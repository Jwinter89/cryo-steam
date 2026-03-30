/**
 * AdManager — Throttled ad display for Cold Creek
 *
 * Strategy:
 * - 1 banner ad on title/menu screen only (never during gameplay)
 * - 1 interstitial ad between shifts (after debrief → before menu)
 *   - Max 1 interstitial per 5 minutes
 *   - Never during active gameplay, boot, or crisis
 * - Ad-free flag for paid users (checked via localStorage)
 *
 * AdSense publisher ID: ca-pub-4033673224873505
 */

(function () {
  'use strict';

  const AD_FREE_KEY = 'coldcreek-ad-free';
  const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
  const STRIPE_PK = 'pk_live_51TGPTUArAkbyMDHnQNKuGNE7SGcsMWcIbiWxP8TmsiMt97Hch7aNdnu1XDJVzV24CW5wT9Ni5O4FHQsQnNkIKIIO00umjQIBp2';
  const STRIPE_PRICE_ID = 'price_1TGTJdArAkbyMDHnak0Ym0D4';

  class AdManager {
    constructor() {
      this._lastInterstitialTime = 0;
      this._adsLoaded = false;
      this._adFree = this._checkAdFree();
      this._stripe = null;

      // Check for successful purchase return
      this._checkPurchaseReturn();

      if (!this._adFree) {
        this._initAds();
      }
    }

    /** Check if user has paid for ad-free */
    _checkAdFree() {
      try {
        return localStorage.getItem(AD_FREE_KEY) === 'true';
      } catch (e) {
        return false;
      }
    }

    /** Set ad-free status (called after Stripe purchase) */
    setAdFree(value) {
      this._adFree = !!value;
      try {
        localStorage.setItem(AD_FREE_KEY, value ? 'true' : 'false');
      } catch (e) { /* ok */ }

      if (this._adFree) {
        this._hideAllAds();
      }
    }

    isAdFree() {
      return this._adFree;
    }

    /** Initialize AdSense script (already loaded in HTML head) */
    _initAds() {
      // AdSense auto-initializes via the async script tag
      this._adsLoaded = typeof window.adsbygoogle !== 'undefined';

      // Retry check after script loads
      if (!this._adsLoaded) {
        window.addEventListener('load', () => {
          this._adsLoaded = typeof window.adsbygoogle !== 'undefined';
        });
      }
    }

    /** Show the title screen banner ad slot */
    showTitleBanner() {
      if (this._adFree) return;

      const slot = document.getElementById('ad-title-banner');
      if (!slot) return;

      slot.style.display = '';

      // Push ad if not already loaded
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) { /* ad blocker or not loaded */ }
    }

    /** Hide the title screen banner ad */
    hideTitleBanner() {
      const slot = document.getElementById('ad-title-banner');
      if (slot) slot.style.display = 'none';
    }

    /**
     * Show an interstitial ad between shifts.
     * Respects the 5-minute cooldown.
     * @param {Function} callback - Called when ad is closed/skipped
     */
    showInterstitial(callback) {
      if (this._adFree) {
        if (callback) callback();
        return;
      }

      const now = Date.now();
      if (now - this._lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) {
        // Cooldown active — skip ad
        if (callback) callback();
        return;
      }

      this._lastInterstitialTime = now;

      // Create a simple overlay interstitial using AdSense display ad
      const overlay = document.createElement('div');
      overlay.className = 'ad-interstitial-overlay';
      overlay.id = 'ad-interstitial-overlay';

      const container = document.createElement('div');
      container.className = 'ad-interstitial-container';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'ad-interstitial-close';
      closeBtn.textContent = 'Continue';
      closeBtn.disabled = true;

      const label = document.createElement('div');
      label.className = 'ad-interstitial-label';
      label.textContent = 'ADVERTISEMENT';

      const adSlot = document.createElement('ins');
      adSlot.className = 'adsbygoogle';
      adSlot.style.display = 'block';
      adSlot.setAttribute('data-ad-client', 'ca-pub-4033673224873505');
      adSlot.setAttribute('data-ad-slot', '');
      adSlot.setAttribute('data-ad-format', 'auto');
      adSlot.setAttribute('data-full-width-responsive', 'true');

      container.appendChild(label);
      container.appendChild(adSlot);
      container.appendChild(closeBtn);
      overlay.appendChild(container);
      document.body.appendChild(overlay);

      // Push the ad
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) { /* ad blocker */ }

      // Enable close button after 3 seconds (gives ad time to render)
      setTimeout(() => {
        closeBtn.disabled = false;
        closeBtn.textContent = 'Continue to Menu';
      }, 3000);

      closeBtn.addEventListener('click', () => {
        overlay.remove();
        if (callback) callback();
      });

      // Auto-dismiss after 15 seconds if user doesn't click
      setTimeout(() => {
        if (document.getElementById('ad-interstitial-overlay')) {
          overlay.remove();
          if (callback) callback();
        }
      }, 15000);
    }

    /** Remove all ad elements */
    _hideAllAds() {
      this.hideTitleBanner();
      const interstitial = document.getElementById('ad-interstitial-overlay');
      if (interstitial) interstitial.remove();

      // Hide ad-free upgrade banner
      const upgradeBanner = document.getElementById('ad-free-banner');
      if (upgradeBanner) upgradeBanner.style.display = 'none';

      // Hide the title banner slot
      const titleBanner = document.getElementById('ad-title-banner');
      if (titleBanner) titleBanner.style.display = 'none';
    }

    /** Redirect to Stripe Checkout for ad-free purchase */
    startPurchase() {
      if (!window.Stripe) {
        // Stripe.js not loaded yet
        return;
      }

      if (!this._stripe) {
        this._stripe = window.Stripe(STRIPE_PK);
      }

      this._stripe.redirectToCheckout({
        lineItems: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        mode: 'payment',
        successUrl: window.location.origin + '/?adfree=success',
        cancelUrl: window.location.origin + '/?adfree=cancel',
      }).catch(function () {
        // Checkout failed — user stays on page
      });
    }

    /** Check URL params for successful purchase return */
    _checkPurchaseReturn() {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('adfree') === 'success') {
          this.setAdFree(true);
          // Clean URL without reload
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (e) { /* ok */ }
    }
  }

  window.AdManager = AdManager;
})();
