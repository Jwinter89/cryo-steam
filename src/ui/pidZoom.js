/**
 * PidZoom — Zoom and pan controls for the P&ID SVG diagram.
 * Supports mouse wheel zoom, click-drag pan, pinch zoom on touch,
 * and zoom controls overlay.
 */

class PidZoom {
  constructor() {
    this.svg = document.getElementById('pid-diagram');
    if (!this.svg) return;

    this._scale = 1;
    this._minScale = 0.5;
    this._maxScale = 4;
    this._panX = 0;
    this._panY = 0;
    this._isPanning = false;
    this._startX = 0;
    this._startY = 0;
    this._origViewBox = this.svg.getAttribute('viewBox');
    this._parseViewBox();

    this._bindControls();
    this._createOverlay();
  }

  _parseViewBox() {
    const parts = this._origViewBox.split(/\s+/).map(Number);
    this._vbX = parts[0];
    this._vbY = parts[1];
    this._vbW = parts[2];
    this._vbH = parts[3];
    this._baseW = parts[2];
    this._baseH = parts[3];
  }

  /** Reset to the original facility viewBox */
  resetForFacility() {
    this._origViewBox = this.svg.getAttribute('viewBox');
    this._parseViewBox();
    this._scale = 1;
    this._panX = 0;
    this._panY = 0;
    this._applyTransform();
  }

  _bindControls() {
    const container = this.svg.parentElement;

    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      this._zoom(delta, e.clientX, e.clientY);
    }, { passive: false });

    // Mouse drag pan
    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.tag-bubble, .glossary-term, button')) return;
      this._isPanning = true;
      this._startX = e.clientX;
      this._startY = e.clientY;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this._isPanning) return;
      const dx = e.clientX - this._startX;
      const dy = e.clientY - this._startY;
      this._startX = e.clientX;
      this._startY = e.clientY;

      // Convert screen pixels to viewBox units
      const svgRect = this.svg.getBoundingClientRect();
      const scaleX = this._vbW / svgRect.width;
      const scaleY = this._vbH / svgRect.height;
      this._panX -= dx * scaleX;
      this._panY -= dy * scaleY;
      this._applyTransform();
    });

    window.addEventListener('mouseup', () => {
      this._isPanning = false;
      if (container) container.style.cursor = '';
    });

    // Touch pinch zoom + pan
    let lastTouches = null;
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastTouches = Array.from(e.touches);
        e.preventDefault();
      } else if (e.touches.length === 1 && this._scale > 1.1) {
        this._isPanning = true;
        this._startX = e.touches[0].clientX;
        this._startY = e.touches[0].clientY;
      }
    }, { passive: false });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && lastTouches) {
        e.preventDefault();
        const oldDist = this._touchDist(lastTouches[0], lastTouches[1]);
        const newDist = this._touchDist(e.touches[0], e.touches[1]);
        const delta = (newDist - oldDist) / oldDist;
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        this._zoom(delta, cx, cy);
        lastTouches = Array.from(e.touches);
      } else if (e.touches.length === 1 && this._isPanning) {
        const dx = e.touches[0].clientX - this._startX;
        const dy = e.touches[0].clientY - this._startY;
        this._startX = e.touches[0].clientX;
        this._startY = e.touches[0].clientY;
        const svgRect = this.svg.getBoundingClientRect();
        const scaleX = this._vbW / svgRect.width;
        const scaleY = this._vbH / svgRect.height;
        this._panX -= dx * scaleX;
        this._panY -= dy * scaleY;
        this._applyTransform();
      }
    }, { passive: false });

    container.addEventListener('touchend', () => {
      lastTouches = null;
      this._isPanning = false;
    });

    // Double-click to reset
    container.addEventListener('dblclick', (e) => {
      if (e.target.closest('.tag-bubble')) return;
      this._scale = 1;
      this._panX = 0;
      this._panY = 0;
      this._applyTransform();
    });
  }

  _touchDist(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  _zoom(delta, cx, cy) {
    const oldScale = this._scale;
    this._scale = Math.max(this._minScale, Math.min(this._maxScale, this._scale + delta));

    // Zoom toward cursor position
    const svgRect = this.svg.getBoundingClientRect();
    const svgX = this._vbX + ((cx - svgRect.left) / svgRect.width) * this._vbW;
    const svgY = this._vbY + ((cy - svgRect.top) / svgRect.height) * this._vbH;

    const scaleDelta = this._scale / oldScale;
    this._panX = svgX - (svgX - this._panX) / scaleDelta;
    this._panY = svgY - (svgY - this._panY) / scaleDelta;

    this._applyTransform();
    this._updateZoomLabel();
  }

  _applyTransform() {
    const w = this._baseW / this._scale;
    const h = this._baseH / this._scale;

    // Clamp pan so we don't go too far off-screen
    const maxPanX = this._baseW * 0.5;
    const maxPanY = this._baseH * 0.5;
    this._panX = Math.max(-maxPanX, Math.min(maxPanX, this._panX));
    this._panY = Math.max(-maxPanY, Math.min(maxPanY, this._panY));

    const x = this._panX;
    const y = this._panY;
    this.svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  }

  _createOverlay() {
    const container = this.svg.parentElement;
    if (!container) return;

    const controls = document.createElement('div');
    controls.className = 'pid-zoom-controls';
    controls.innerHTML = `
      <button class="pid-zoom-btn" id="pid-zoom-in" title="Zoom In">+</button>
      <span class="pid-zoom-level" id="pid-zoom-level">100%</span>
      <button class="pid-zoom-btn" id="pid-zoom-out" title="Zoom Out">\u2212</button>
      <button class="pid-zoom-btn pid-zoom-reset" id="pid-zoom-reset" title="Reset (Double-click)">FIT</button>
    `;
    container.style.position = 'relative';
    container.appendChild(controls);

    // Mobile hint
    const hint = document.createElement('div');
    hint.className = 'pid-zoom-hint';
    hint.textContent = 'PINCH TO ZOOM \u2022 DRAG TO PAN \u2022 DOUBLE-TAP TO RESET';
    container.appendChild(hint);

    document.getElementById('pid-zoom-in').addEventListener('click', () => {
      const rect = this.svg.getBoundingClientRect();
      this._zoom(0.3, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    document.getElementById('pid-zoom-out').addEventListener('click', () => {
      const rect = this.svg.getBoundingClientRect();
      this._zoom(-0.3, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    document.getElementById('pid-zoom-reset').addEventListener('click', () => {
      this._scale = 1;
      this._panX = 0;
      this._panY = 0;
      this._applyTransform();
      this._updateZoomLabel();
    });
  }

  _updateZoomLabel() {
    const el = document.getElementById('pid-zoom-level');
    if (el) el.textContent = Math.round(this._scale * 100) + '%';
  }

  /**
   * Highlight flow lines connected to a tag bubble (pulse animation).
   * Clears previous highlights automatically after 3 seconds.
   */
  highlightLoop(tag) {
    // Clear any existing highlights
    this.clearHighlight();

    if (!this.svg || !tag) return;

    // Find the tag bubble element
    const bubble = this.svg.querySelector(`.tag-bubble[data-tag="${tag}"]`);
    if (!bubble) return;

    // Find the parent equipment group
    const equipGroup = bubble.closest('g[id^="equip-"], g[transform]');
    if (!equipGroup) return;

    // Highlight connected flow lines (siblings & nearby)
    const parent = equipGroup.parentElement;
    if (!parent) return;
    const allLines = parent.querySelectorAll('.flow-line.active');
    const groupRect = equipGroup.getBBox();
    const cx = groupRect.x + groupRect.width / 2;
    const cy = groupRect.y + groupRect.height / 2;

    allLines.forEach(line => {
      const x1 = parseFloat(line.getAttribute('x1') || 0);
      const y1 = parseFloat(line.getAttribute('y1') || 0);
      const x2 = parseFloat(line.getAttribute('x2') || 0);
      const y2 = parseFloat(line.getAttribute('y2') || 0);
      const dist = Math.min(
        Math.hypot(x1 - cx, y1 - cy),
        Math.hypot(x2 - cx, y2 - cy)
      );
      if (dist < 120) {
        line.classList.add('loop-highlight');
      }
    });

    this._highlightTimer = setTimeout(() => this.clearHighlight(), 3000);
  }

  clearHighlight() {
    if (this._highlightTimer) {
      clearTimeout(this._highlightTimer);
      this._highlightTimer = null;
    }
    if (!this.svg) return;
    this.svg.querySelectorAll('.loop-highlight').forEach(el => {
      el.classList.remove('loop-highlight');
    });
  }
}

window.PidZoom = PidZoom;
