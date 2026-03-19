/**
 * storageBridge.js — Durable key-value storage for Cold Creek
 *
 * On native iOS (Capacitor), WKWebView localStorage can be purged under
 * storage pressure. This bridge uses Capacitor Preferences (native KeychainWrapper
 * / UserDefaults) when available, falling back to localStorage on the web.
 *
 * API mirrors localStorage: getItem(key), setItem(key, value), removeItem(key)
 * All methods return Promises since Capacitor Preferences is async.
 *
 * Usage in game code:
 *   await StorageBridge.setItem('coldcreek-progress', JSON.stringify(data));
 *   const val = await StorageBridge.getItem('coldcreek-progress');
 */
(function () {
  'use strict';

  const isCapacitorNative = typeof window.Capacitor !== 'undefined'
    && window.Capacitor.isNativePlatform
    && window.Capacitor.isNativePlatform();

  let Preferences = null;
  if (isCapacitorNative && window.Capacitor.Plugins) {
    Preferences = window.Capacitor.Plugins.Preferences;
  }

  window.StorageBridge = {
    async getItem(key) {
      if (Preferences) {
        const result = await Preferences.get({ key });
        return result.value;
      }
      return localStorage.getItem(key);
    },

    async setItem(key, value) {
      if (Preferences) {
        await Preferences.set({ key, value });
      }
      // Always write to localStorage too as a fast sync fallback
      try { localStorage.setItem(key, value); } catch (_) { /* quota */ }
    },

    async removeItem(key) {
      if (Preferences) {
        await Preferences.remove({ key });
      }
      try { localStorage.removeItem(key); } catch (_) { /* noop */ }
    },

    /**
     * One-time migration: copies existing localStorage keys into
     * Capacitor Preferences. Call once on first native launch.
     */
    async migrateFromLocalStorage() {
      if (!Preferences) return;
      const keys = [
        'coldcreek-progress',
        'coldcreek-gamestate',
        'coldcreek-fieldnotes',
        'coldcreek-tips',
        'coldcreek-username',
        'coldcreek-leaderboard',
      ];
      for (const key of keys) {
        const existing = localStorage.getItem(key);
        if (existing !== null) {
          const capVal = await Preferences.get({ key });
          if (capVal.value === null) {
            await Preferences.set({ key, value: existing });
          }
        }
      }
    },
  };
})();
