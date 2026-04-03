/**
 * TrendManager — Draws mini sparkline trends in gauge rows
 * and provides a toggleable full trend graph window.
 */

class TrendManager {
  constructor(sim) {
    this.sim = sim;
    this._history = {};
    this._maxPoints = 200;
    this._trackedTags = [];
    this._visible = false;
    this._panel = null;
    this._canvas = null;
  }

  trackTag(tag) {
    if (!this._trackedTags.includes(tag)) {
      this._trackedTags.push(tag);
      if (this._trackedTags.length > 6) this._trackedTags.shift();
    }
  }

  untrackTag(tag) {
    this._trackedTags = this._trackedTags.filter(t => t !== tag);
  }

  recordTick(gameTime) {
    if (!this.sim) return;
    const pvMap = this.sim.getAllPVs();
    for (const tag of this._trackedTags) {
      if (pvMap[tag]) {
        if (!this._history[tag]) this._history[tag] = { values: [], times: [] };
        this._history[tag].values.push(pvMap[tag].value);
        this._history[tag].times.push(gameTime);
        if (this._history[tag].values.length > this._maxPoints) {
          this._history[tag].values.shift();
          this._history[tag].times.shift();
        }
      }
    }
  }

  toggle() {
    this._visible = !this._visible;
    if (this._visible) this.show();
    else this.hide();
  }

  show() {
    this._visible = true;
    if (!this._panel) this._createPanel();
    this._panel.style.display = 'block';
    this._draw();
  }

  hide() {
    this._visible = false;
    if (this._panel) this._panel.style.display = 'none';
  }

  update() {
    if (!this._visible || !this._canvas) return;
    this._draw();
  }

  _createPanel() {
    this._panel = document.createElement('div');
    this._panel.className = 'trend-window';
    this._panel.innerHTML = `
      <div class="trend-header">
        <span class="trend-title">TREND GRAPH</span>
        <button class="trend-close-btn" id="trend-close-btn">&times;</button>
      </div>
      <div class="trend-tags" id="trend-tags-bar"></div>
      <canvas id="trend-canvas" class="trend-canvas" width="450" height="200"></canvas>
      <div class="trend-footer">Double-click a gauge tag to add it to the trend</div>
    `;
    document.getElementById('game-screen').appendChild(this._panel);
    this._canvas = document.getElementById('trend-canvas');

    // HiDPI canvas scaling
    const dpr = window.devicePixelRatio || 1;
    if (dpr > 1) {
      this._canvas.width = 450 * dpr;
      this._canvas.height = 200 * dpr;
      this._canvas.style.width = '450px';
      this._canvas.style.height = '200px';
      this._canvas.getContext('2d').scale(dpr, dpr);
    }

    let isDragging = false, offsetX = 0, offsetY = 0;
    const header = this._panel.querySelector('.trend-header');
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - this._panel.offsetLeft;
      offsetY = e.clientY - this._panel.offsetTop;
    });
    // Use named handlers so they can be cleaned up
    this._onDocMouseMove = (e) => {
      if (!isDragging) return;
      this._panel.style.left = (e.clientX - offsetX) + 'px';
      this._panel.style.top = (e.clientY - offsetY) + 'px';
    };
    this._onDocMouseUp = () => { isDragging = false; };
    document.addEventListener('mousemove', this._onDocMouseMove);
    document.addEventListener('mouseup', this._onDocMouseUp);

    document.getElementById('trend-close-btn').addEventListener('click', () => this.hide());
  }

  _draw() {
    if (!this._canvas) return;
    const ctx = this._canvas.getContext('2d');
    const w = this._canvas.width;
    const h = this._canvas.height;
    const pad = { top: 15, right: 80, bottom: 20, left: 45 };

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.5;

    // Compute Y-axis range from first tracked tag for labels
    let yMin = 0, yMax = 100;
    if (this._trackedTags.length > 0) {
      const firstHist = this._history[this._trackedTags[0]];
      if (firstHist && firstHist.values.length >= 2) {
        yMin = Math.min(...firstHist.values);
        yMax = Math.max(...firstHist.values);
        if (yMax - yMin < 1) { yMin -= 0.5; yMax += 0.5; }
      }
    }

    ctx.font = '8px Courier New';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (h - pad.top - pad.bottom);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      // Y-axis tick label
      const val = yMax - (i / 4) * (yMax - yMin);
      ctx.fillText(val.toFixed(1), pad.left - 4, y + 3);
    }

    const colors = ['#4CAF50', '#E8A030', '#4A9BD9', '#C77DFF', '#E04040', '#00CED1'];
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const tagsBar = document.getElementById('trend-tags-bar');
    if (tagsBar) {
      tagsBar.innerHTML = this._trackedTags.map((tag, i) => {
        const color = colors[i % colors.length];
        return `<span class="trend-tag-chip" style="border-color:${color};color:${color}" data-tag="${tag}">${tag} &times;</span>`;
      }).join('');
      tagsBar.querySelectorAll('.trend-tag-chip').forEach(chip => {
        chip.addEventListener('click', () => this.untrackTag(chip.dataset.tag));
      });
    }

    this._trackedTags.forEach((tag, idx) => {
      const hist = this._history[tag];
      if (!hist || hist.values.length < 2) return;

      const color = colors[idx % colors.length];
      const vals = hist.values;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min || 1;

      const pvMap = this.sim ? this.sim.getAllPVs() : {};
      const pv = pvMap[tag];
      if (pv && pv.sp != null) {
        const spY = pad.top + ((max - pv.sp) / range) * plotH;
        if (spY >= pad.top && spY <= pad.top + plotH) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(pad.left, spY);
          ctx.lineTo(pad.left + plotW, spY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < vals.length; i++) {
        const x = pad.left + (i / (vals.length - 1)) * plotW;
        const y = pad.top + ((max - vals[i]) / range) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const ly = pad.top + idx * 15;
      ctx.fillStyle = color;
      ctx.font = '9px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(`${tag}: ${vals[vals.length - 1].toFixed(1)}`, w - pad.right + 6, ly + 4);
    });

    if (this._trackedTags.length === 0) {
      ctx.fillStyle = '#555';
      ctx.font = '11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('No tags tracked', w / 2, h / 2);
    }
  }

  reset() {
    this._history = {};
    this._trackedTags = [];
    if (this._panel) this._panel.style.display = 'none';
    this._visible = false;
  }

  static drawSparkline(ctx, w, h, data, min, max, color) {
    if (!data || data.length < 2) return;

    ctx.clearRect(0, 0, w, h);

    const range = max - min || 1;
    ctx.strokeStyle = color || '#E8E8E8';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((data[i] - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  destroy() {
    if (this._onDocMouseMove) document.removeEventListener('mousemove', this._onDocMouseMove);
    if (this._onDocMouseUp) document.removeEventListener('mouseup', this._onDocMouseUp);
    if (this._panel && this._panel.parentNode) this._panel.parentNode.removeChild(this._panel);
    this._panel = null;
    this._canvas = null;
  }
}

window.TrendManager = TrendManager;
