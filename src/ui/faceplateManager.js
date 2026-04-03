/**
 * FaceplateManager — Handles the DCS-style faceplate popup.
 * Clicking any instrument tag opens the faceplate showing PV, SP, OUT, mode, limits, and trend.
 */

class FaceplateManager {
  constructor(sim) {
    this.sim = sim;
    this.currentTag = null;
    this.el = document.getElementById('faceplate');
    this.trendCanvas = document.getElementById('fp-trend-canvas');
    this.trendCtx = this.trendCanvas ? this.trendCanvas.getContext('2d') : null;

    // HiDPI canvas scaling
    if (this.trendCanvas && this.trendCtx) {
      const dpr = window.devicePixelRatio || 1;
      if (dpr > 1) {
        this._trendW = 240;
        this._trendH = 60;
        this.trendCanvas.width = 240 * dpr;
        this.trendCanvas.height = 60 * dpr;
        this.trendCanvas.style.width = '240px';
        this.trendCanvas.style.height = '60px';
        this.trendCtx.scale(dpr, dpr);
      } else {
        this._trendW = this.trendCanvas.width;
        this._trendH = this.trendCanvas.height;
      }
    }

    this._bindEvents();
  }

  _bindEvents() {
    // Close button
    document.getElementById('fp-close').addEventListener('click', () => this.close());

    // Mode buttons
    document.querySelectorAll('.fp-mode-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (this.currentTag) {
          const pv = this.sim.getPV(this.currentTag);
          if (pv && pv.controllable) {
            pv.mode = mode;
            this._updateModeButtons(mode);
            this._updateFieldAccess(pv);
          }
        }
      });
    });

    // Apply button
    document.getElementById('fp-apply').addEventListener('click', () => {
      if (this.currentTag) {
        const pv = this.sim.getPV(this.currentTag);
        if (pv && pv.controllable) {
          if (pv.mode === 'CAS') {
            this._flashApply(false);
            return; // CAS mode — controlled by cascade, no manual changes
          }
          if (pv.mode === 'AUTO') {
            const spInput = document.getElementById('fp-sp');
            const newSP = parseFloat(spInput.value);
            if (!isNaN(newSP) && newSP >= pv.min && newSP <= pv.max) {
              pv.sp = newSP;
              this._flashApply(true);
              document.dispatchEvent(new CustomEvent('faceplate:apply', {
                detail: { tag: this.currentTag, sp: newSP }
              }));
            } else {
              this._flashApply(false);
              spInput.value = pv.sp.toFixed(1);
            }
          } else if (pv.mode === 'MAN') {
            const outInput = document.getElementById('fp-out');
            const newOut = parseFloat(outInput.value);
            if (!isNaN(newOut) && newOut >= 0 && newOut <= 100) {
              pv.output = newOut;
              this._flashApply(true);
              document.dispatchEvent(new CustomEvent('faceplate:apply', {
                detail: { tag: this.currentTag, output: newOut }
              }));
            } else {
              this._flashApply(false);
              outInput.value = pv.output.toFixed(1);
            }
          }
        }
      }
    });

    // Click on tag bubbles in SVG
    document.querySelectorAll('.tag-bubble').forEach(bubble => {
      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = bubble.dataset.tag;
        if (tag) this.open(tag, e);
      });
    });

    // Click on gauge rows
    document.querySelectorAll('.gauge-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const tag = row.dataset.tag;
        if (tag) this.open(tag, e);
      });
    });

    // Close on click outside (store ref for cleanup in destroy())
    this._centerClickHandler = (e) => {
      if (!e.target.closest('.faceplate') && !e.target.closest('.tag-bubble')) {
        this.close();
      }
    };
    document.getElementById('center-panel').addEventListener('click', this._centerClickHandler);
  }

  destroy() {
    const cp = document.getElementById('center-panel');
    if (cp && this._centerClickHandler) {
      cp.removeEventListener('click', this._centerClickHandler);
    }
  }

  open(tag, event) {
    const pv = this.sim.getPV(tag);
    if (!pv) return;

    // Remove active indicator from previous bubble
    document.querySelectorAll('.tag-bubble.fp-active').forEach(b => b.classList.remove('fp-active'));
    // Highlight the active tag bubble
    const bubble = document.querySelector(`.tag-bubble[data-tag="${tag}"]`);
    if (bubble) bubble.classList.add('fp-active');

    this.currentTag = tag;
    this.el.style.display = 'block';

    document.dispatchEvent(new CustomEvent('faceplate:open', {
      detail: { tag }
    }));

    // On mobile (<= 768px), use fixed centering (CSS handles it) + show backdrop
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.el.style.left = '';
      this.el.style.top = '';
      const backdrop = document.getElementById('faceplate-backdrop');
      if (backdrop) backdrop.style.display = 'block';
    } else {
      // Position near click but keep on screen
      const rect = this.el.parentElement.getBoundingClientRect();
      let x = (event.clientX || rect.width / 2) - rect.left;
      let y = (event.clientY || rect.height / 2) - rect.top;

      // Keep faceplate within bounds
      x = Math.min(x, rect.width - 270);
      x = Math.max(x, 10);
      y = Math.min(y, rect.height - 300);
      y = Math.max(y, 10);

      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
    }

    // Populate
    document.getElementById('fp-tag').textContent = pv.tag;
    document.getElementById('fp-desc').textContent = pv.desc;
    document.getElementById('fp-pv').textContent = pv.formatValue();
    document.getElementById('fp-pv-unit').textContent = pv.unit;
    document.getElementById('fp-sp').value = pv.sp.toFixed(1);
    document.getElementById('fp-sp-unit').textContent = pv.unit;
    document.getElementById('fp-out').value = pv.output.toFixed(1);

    // Update field access based on mode and controllability
    this._updateFieldAccess(pv);

    // Mode display
    document.getElementById('fp-mode-display').textContent = pv.mode;
    this._updateModeButtons(pv.mode);

    // Show/hide mode buttons
    const modeButtons = this.el.querySelectorAll('.fp-mode-btn[data-mode]');
    modeButtons.forEach(btn => {
      btn.style.display = pv.controllable ? '' : 'none';
    });

    // Alarm limits
    document.getElementById('fp-hh').textContent = pv.hh != null ? pv.hh : '--';
    document.getElementById('fp-hi').textContent = pv.hi != null ? pv.hi : '--';
    document.getElementById('fp-lo').textContent = pv.lo != null ? pv.lo : '--';
    document.getElementById('fp-ll').textContent = pv.ll != null ? pv.ll : '--';

    // Bar graph
    this._updateBar(pv);

    // Trend
    this._drawTrend(pv);
  }

  close() {
    this.el.style.display = 'none';
    document.querySelectorAll('.tag-bubble.fp-active').forEach(b => b.classList.remove('fp-active'));
    this.currentTag = null;
    const backdrop = document.getElementById('faceplate-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  }

  update() {
    if (!this.currentTag) return;
    const pv = this.sim.getPV(this.currentTag);
    if (!pv) return;

    document.getElementById('fp-pv').textContent = pv.formatValue();
    document.getElementById('fp-mode-display').textContent = pv.mode;

    // Update OUT display — only overwrite if not actively being edited in MAN mode
    const outInput = document.getElementById('fp-out');
    if (document.activeElement !== outInput) {
      outInput.value = pv.output.toFixed(1);
    }

    this._updateBar(pv);
    this._drawTrend(pv);
  }

  _updateBar(pv) {
    const range = pv.max - pv.min;
    const pvPct = ((pv.displayValue() - pv.min) / range) * 100;
    const spPct = ((pv.sp - pv.min) / range) * 100;

    const barFill = document.getElementById('fp-bar-fill');
    const barSP = document.getElementById('fp-bar-sp');
    barFill.style.width = Math.max(0, Math.min(100, pvPct)) + '%';
    barSP.style.left = Math.max(0, Math.min(100, spPct)) + '%';

    // Color bar by alarm state
    barFill.style.background = 'var(--text-unit)';
    if (pv.alarmState === 'HI' || pv.alarmState === 'LO') barFill.style.background = 'var(--alarm-lo)';
    if (pv.alarmState === 'HIHI' || pv.alarmState === 'LOLO') barFill.style.background = 'var(--alarm-crit)';
  }

  _drawTrend(pv) {
    if (!this.trendCtx) return;
    const ctx = this.trendCtx;
    const w = this._trendW || 240;
    const h = this._trendH || 60;
    const data = pv.trendHistory;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#2E2E2E';
    ctx.fillRect(0, 0, w, h);

    if (data.length < 2) return;

    // Draw setpoint line
    const range = pv.max - pv.min;
    const spY = h - ((pv.sp - pv.min) / range) * h;
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, spY);
    ctx.lineTo(w, spY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw alarm limit lines
    if (pv.hi != null) {
      const hiY = h - ((pv.hi - pv.min) / range) * h;
      ctx.strokeStyle = 'rgba(255,165,0,0.45)';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, hiY);
      ctx.lineTo(w, hiY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (pv.lo != null) {
      const loY = h - ((pv.lo - pv.min) / range) * h;
      ctx.strokeStyle = 'rgba(255,165,0,0.3)';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, loY);
      ctx.lineTo(w, loY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw trend line
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((data[i] - pv.min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  _flashApply(success) {
    const btn = document.getElementById('fp-apply');
    btn.classList.remove('fp-apply-ok', 'fp-apply-err');
    // Force reflow for re-triggering animation
    void btn.offsetWidth;
    btn.classList.add(success ? 'fp-apply-ok' : 'fp-apply-err');
    setTimeout(() => btn.classList.remove('fp-apply-ok', 'fp-apply-err'), 600);
  }

  _updateFieldAccess(pv) {
    const spInput = document.getElementById('fp-sp');
    const outInput = document.getElementById('fp-out');

    // CAS mode: SP is driven by cascade (read-only), OUT follows AUTO behavior
    if (pv.mode === 'CAS') {
      spInput.disabled = true;
      outInput.disabled = true;
      return;
    }
    // SP is editable in AUTO mode for controllable PVs
    spInput.disabled = !pv.controllable || pv.mode === 'MAN';
    // OUT is editable in MAN mode for controllable PVs
    outInput.disabled = !pv.controllable || pv.mode === 'AUTO';
  }

  _updateModeButtons(activeMode) {
    document.querySelectorAll('.fp-mode-btn[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === activeMode);
    });
  }
}

window.FaceplateManager = FaceplateManager;
