/**
 * KimrayWidget — Animated Kimray glycol pump with manual stroke adjustment.
 * Shows visible stroke rhythm with BPM counter. Adjustment is a manual dial.
 *
 * "No alarm fires when stroke rate drifts. Player must notice throughput
 * changed and adjust."
 */

class KimrayWidget {
  constructor(game) {
    this.game = game;
    this.spm = 6.0;           // Strokes per minute
    this.targetSPM = 6.0;
    this.minSPM = 2;
    this.maxSPM = 12;
    this.strokePhase = 0;      // 0-1 animation phase
    this.visible = false;
    this.container = null;
    this.dialDragging = false;

    this._createWidget();
  }

  _createWidget() {
    // Create floating Kimray control panel
    this.container = document.createElement('div');
    this.container.id = 'kimray-widget';
    this.container.className = 'kimray-widget';
    this.container.style.display = 'none';
    this.container.innerHTML = `
      <div class="kimray-header">
        <span class="kimray-tag">K-201 KIMRAY GLYCOL PUMP</span>
        <button class="kimray-close">X</button>
      </div>
      <div class="kimray-body">
        <div class="kimray-animation">
          <canvas id="kimray-canvas" width="180" height="80"></canvas>
        </div>
        <div class="kimray-readings">
          <div class="kimray-row">
            <span class="kimray-label">SPM:</span>
            <span id="kimray-spm-display" class="kimray-value">6.0</span>
          </div>
          <div class="kimray-row">
            <span class="kimray-label">CIRC:</span>
            <span id="kimray-circ-display" class="kimray-value">35</span>
            <span class="kimray-unit">gal/hr</span>
          </div>
          <div class="kimray-row">
            <span class="kimray-label">DP:</span>
            <span id="kimray-dp-display" class="kimray-value">45</span>
            <span class="kimray-unit">PSI</span>
          </div>
        </div>
        <div class="kimray-dial-area">
          <span class="kimray-dial-label">STROKE ADJUST</span>
          <input type="range" id="kimray-dial" min="2" max="12" step="0.5" value="6"
                 class="kimray-dial"/>
          <div class="kimray-dial-marks">
            <span>2</span><span>4</span><span>6</span><span>8</span><span>10</span><span>12</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('app').appendChild(this.container);

    // Add CSS for Kimray widget
    const style = document.createElement('style');
    style.textContent = `
      .kimray-widget {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 220px;
        background: var(--bg-faceplate);
        border: 1px solid var(--border);
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        z-index: 150;
        font-family: var(--font-mono);
      }
      .kimray-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 8px;
        background: var(--bg-deep);
        border-bottom: 1px solid var(--border);
      }
      .kimray-tag {
        font-size: 9px;
        color: var(--text-tag);
        letter-spacing: 0.05em;
      }
      .kimray-close {
        font-family: var(--font-mono);
        font-size: 10px;
        background: none;
        border: none;
        color: var(--text-unit);
        cursor: pointer;
      }
      .kimray-body {
        padding: 8px;
      }
      .kimray-animation {
        margin-bottom: 6px;
      }
      .kimray-animation canvas {
        width: 100%;
        height: 80px;
        background: var(--bg-deep);
        border: 1px solid var(--border-lite);
      }
      .kimray-readings {
        margin-bottom: 6px;
      }
      .kimray-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 1px 0;
      }
      .kimray-label {
        font-size: 10px;
        color: var(--text-label);
        min-width: 35px;
      }
      .kimray-value {
        font-size: 13px;
        color: var(--text-normal);
        min-width: 40px;
        text-align: right;
      }
      .kimray-unit {
        font-size: 9px;
        color: var(--text-unit);
      }
      .kimray-dial-area {
        border-top: 1px solid var(--border-lite);
        padding-top: 6px;
      }
      .kimray-dial-label {
        font-size: 9px;
        color: var(--text-unit);
        display: block;
        margin-bottom: 4px;
        letter-spacing: 0.05em;
      }
      .kimray-dial {
        width: 100%;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: var(--bg-input);
        border-radius: 3px;
        outline: none;
      }
      .kimray-dial::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: var(--text-unit);
        border-radius: 50%;
        cursor: pointer;
      }
      .kimray-dial::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: var(--text-unit);
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
      .kimray-dial-marks {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        color: var(--text-unit);
        padding: 2px 0;
      }
    `;
    document.head.appendChild(style);

    // Bind events
    this.container.querySelector('.kimray-close').addEventListener('click', () => this.hide());

    const dial = document.getElementById('kimray-dial');
    dial.addEventListener('input', () => {
      this.targetSPM = parseFloat(dial.value);
    });

    // Click on Kimray area in SVG opens widget
    // Will be bound when SVG is loaded
  }

  bindSVG() {
    // Bind click on Kimray pump area in SVG
    const svgEl = document.getElementById('pid-svg');
    if (!svgEl) return;

    // Use event delegation for dynamically loaded SVGs
    svgEl.addEventListener('click', (e) => {
      const kimrayGroup = e.target.closest('#kimray-pump-area, [data-equip="kimray"]');
      if (kimrayGroup) {
        this.toggle();
      }
    });
  }

  show() {
    this.visible = true;
    this.container.style.display = 'block';
    this._startAnimation();
  }

  hide() {
    this.visible = false;
    this.container.style.display = 'none';
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  /**
   * Update pump physics each tick
   */
  tick(dt) {
    if (!this.game.sim) return;

    const pvMap = this.game.sim.getAllPVs();

    // SPM drifts toward target slowly (manual adjustment feel)
    const spmDiff = this.targetSPM - this.spm;
    this.spm += spmDiff * 0.1 * dt;

    // Differential pressure affects actual stroke rate
    // (This is the key mechanic — DP changes from front-end pressure swings
    //  cause circulation rate to drift silently)
    const kimrayConfig = this.game.currentConfig && this.game.currentConfig.kimrayPump;
    if (kimrayConfig) {
      const dpPV = pvMap['PIC-101']; // Inlet pressure as proxy for DP
      if (dpPV) {
        const normalDP = kimrayConfig.differentialPressure || 45;
        const actualDP = normalDP + (dpPV.value - 75) * 0.3;
        const dpRatio = actualDP / normalDP;
        // Actual flow = stroke rate * volume * DP ratio
        const actualFlow = this.spm * (kimrayConfig.strokeVolume || 0.8) * dpRatio * 60;

        const glycolPV = pvMap['FI-201'];
        if (glycolPV) {
          glycolPV.sp = actualFlow;
          glycolPV.value += (actualFlow - glycolPV.value) * 0.1 * dt;
        }
      }
    }

    // Update SPM display on the SVG
    const spmEl = document.getElementById('kimray-spm');
    if (spmEl) spmEl.textContent = this.spm.toFixed(1);

    // Update widget displays
    if (this.visible) {
      const spmDisplay = document.getElementById('kimray-spm-display');
      if (spmDisplay) spmDisplay.textContent = this.spm.toFixed(1);

      const circDisplay = document.getElementById('kimray-circ-display');
      const glycolPV = pvMap['FI-201'];
      if (circDisplay && glycolPV) circDisplay.textContent = glycolPV.value.toFixed(0);
    }

    // Animate stroke phase
    this.strokePhase += (this.spm / 60) * dt * 60; // Convert to seconds-based
    if (this.strokePhase > 1) this.strokePhase -= 1;
  }

  _startAnimation() {
    const canvas = document.getElementById('kimray-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      if (!this.visible) return;
      this._drawPump(ctx, canvas.width, canvas.height);
      requestAnimationFrame(animate);
    };
    animate();
  }

  _drawPump(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#2E2E2E';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Pump body
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#505050';

    // Cylinder
    ctx.fillRect(cx - 50, cy - 15, 100, 30);
    ctx.strokeRect(cx - 50, cy - 15, 100, 30);

    // Piston (moves with stroke)
    const pistonX = cx - 30 + Math.sin(this.strokePhase * Math.PI * 2) * 25;
    ctx.fillStyle = '#707070';
    ctx.fillRect(pistonX - 3, cy - 12, 6, 24);

    // Crank arm
    const crankAngle = this.strokePhase * Math.PI * 2;
    const crankX = cx + 60 + Math.cos(crankAngle) * 12;
    const crankY = cy + Math.sin(crankAngle) * 12;
    ctx.beginPath();
    ctx.arc(cx + 60, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 60, cy);
    ctx.lineTo(crankX, crankY);
    ctx.stroke();

    // Connecting rod
    ctx.beginPath();
    ctx.moveTo(crankX, crankY);
    ctx.lineTo(pistonX, cy);
    ctx.stroke();

    // Flow direction arrows
    ctx.fillStyle = '#A0A0A0';
    ctx.font = '8px Arial';
    ctx.fillText('RICH IN', 5, cy - 20);
    ctx.fillText('LEAN OUT', w - 50, cy - 20);

    // Flow arrows
    ctx.strokeStyle = '#A0A0A0';
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy);
    ctx.lineTo(cx - 65, cy);
    ctx.moveTo(cx - 60, cy - 3);
    ctx.lineTo(cx - 55, cy);
    ctx.lineTo(cx - 60, cy + 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 55, cy);
    ctx.lineTo(cx + 65, cy);
    ctx.moveTo(cx + 60, cy - 3);
    ctx.lineTo(cx + 65, cy);
    ctx.lineTo(cx + 60, cy + 3);
    ctx.stroke();
  }
}

window.KimrayWidget = KimrayWidget;
