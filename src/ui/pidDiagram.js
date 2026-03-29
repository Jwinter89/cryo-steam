/**
 * PidDiagram — Updates the SVG P&ID diagram with live process data.
 * Handles equipment state colors, flow line states, level indicators,
 * valve positions, and interactive elements.
 * Supports all facility types — gracefully skips missing elements.
 */

class PidDiagram {
  constructor(sim) {
    this.sim = sim;
    this.svg = document.getElementById('pid-diagram');
    this._bindTagBubbleClicks();
  }

  update() {
    this._updateLevelIndicators();
    this._updateValvePositions();
    this._updateEquipmentStates();
    this._updateFlowLines();
    this._updatePigStatus();
    this._updateTagBubbles();
    this._updateLiveValues();
  }

  /**
   * Bind click events on all tag bubbles to open faceplates
   */
  _bindTagBubbleClicks() {
    if (!this.svg) return;
    // Use event delegation on the SVG
    this.svg.addEventListener('click', (e) => {
      const bubble = e.target.closest('.tag-bubble');
      if (!bubble) return;
      const tag = bubble.dataset.tag;
      if (!tag) return;
      const game = window.coldCreekGame;
      if (game && game.faceplateManager) {
        game.faceplateManager.open(tag, e);
      }
    });
  }

  /**
   * Update all level indicator lines (separator, tank, flash drum, etc.)
   */
  _updateLevelIndicators() {
    // Stabilizer separator level
    this._updateLevelLine('sep-level-line', 'LIC-302', 70);
    this._updateSepFill('sep-level-fill', 'LIC-302', 68);
    // Product tank level fill
    this._updateTankFill('tank-level-fill', 'LIC-303', 66);
    // Flash drum level (amine)
    this._updateLevelLine('flash-level', 'LIC-A02', 45);

    // Refrigeration levels
    const pvMap = this.sim.getAllPVs ? this.sim.getAllPVs() : {};
    this._setLevel(pvMap, 'LIC-201', 'contactor-level-fill', 'contactor-level-line');
    this._setLevel(pvMap, 'LIC-202', 'flash-tank-level-fill', null);
    this._setLevel(pvMap, 'LIC-501', 'product-tank-level-fill', null);

    // Cryogenic levels
    this._setLevel(pvMap, 'LIC-301', 'cold-sep-level-fill', null);
    this._setLevel(pvMap, 'LIC-501', 'demet-sump-level-fill', 'demet-level-line');
    this._setLevel(pvMap, 'LIC-701', 'cryo-product-level-fill', null);
    this._setLevel(pvMap, 'LIC-A01', 'absorber-level-fill', null);
    this._setLevel(pvMap, 'LIC-A03', 'regen-sump-level-fill', null);
  }

  _updateSepFill(elementId, pvTag, vesselHeight) {
    const pv = this.sim.getPV(pvTag);
    if (!pv) return;
    const fill = document.getElementById(elementId);
    if (!fill) return;

    const pct = pv.displayValue() / 100;
    const fillHeight = pct * vesselHeight;
    const y = 2 + (vesselHeight - fillHeight);
    fill.setAttribute('y', y);
    fill.setAttribute('height', Math.max(0, fillHeight));

    // Color based on alarm state and pig activity
    const game = window.coldCreekGame;
    const pigActive = game && game.eventSystem &&
      game.eventSystem.activeEvents.some(e => e.id.startsWith('pig-') &&
        (e.data.surgePhase === 'arriving' || e.data.surgePhase === 'peak'));

    if (pv.alarmState === 'HIHI' || pv.alarmState === 'LOLO') {
      fill.setAttribute('fill', '#8B1A1A');
      fill.setAttribute('opacity', '0.8');
    } else if (pv.alarmState === 'HI' || pv.alarmState === 'LO') {
      fill.setAttribute('fill', '#8B6914');
      fill.setAttribute('opacity', '0.7');
    } else if (pigActive) {
      fill.setAttribute('fill', '#6B5B33');
      fill.setAttribute('opacity', '0.7');
    } else {
      fill.setAttribute('fill', '#3A5A7A');
      fill.setAttribute('opacity', '0.6');
    }
  }

  _updateLevelLine(elementId, pvTag, vesselHeight) {
    const pv = this.sim.getPV(pvTag);
    if (!pv) return;
    const el = document.getElementById(elementId);
    if (!el) return;

    const pct = pv.displayValue() / 100;
    const y = vesselHeight - (pct * (vesselHeight - 10)) - 5;
    el.setAttribute('y1', y);
    el.setAttribute('y2', y);

    if (pv.alarmState === 'HIHI' || pv.alarmState === 'LOLO') {
      el.setAttribute('stroke', '#FF2020');
      el.setAttribute('stroke-width', '2');
    } else if (pv.alarmState === 'HI' || pv.alarmState === 'LO') {
      el.setAttribute('stroke', '#FFD700');
      el.setAttribute('stroke-width', '1.5');
    } else {
      el.setAttribute('stroke', '#707070');
      el.setAttribute('stroke-width', '1');
    }
  }

  _updateTankFill(elementId, pvTag, totalHeight) {
    const pv = this.sim.getPV(pvTag);
    if (!pv) return;
    const fill = document.getElementById(elementId);
    if (!fill) return;

    const pct = pv.displayValue() / 100;
    const fillHeight = pct * totalHeight;
    const y = 2 + (totalHeight - fillHeight);
    fill.setAttribute('y', y);
    fill.setAttribute('height', fillHeight);

    if (pv.alarmState === 'HIHI') {
      fill.setAttribute('fill', '#3a1010');
    } else if (pv.alarmState === 'HI') {
      fill.setAttribute('fill', '#3a3010');
    } else {
      fill.setAttribute('fill', '#484848');
    }
  }

  _updateValvePositions() {
    const valveEls = document.querySelectorAll('.valve-pos');
    valveEls.forEach(el => {
      const valveId = el.dataset.valve;
      if (!valveId) return;
      const game = window.coldCreekGame;
      if (game && game.valves && game.valves[valveId]) {
        el.textContent = Math.round(game.valves[valveId].position);
      }
    });
  }

  _updateEquipmentStates() {
    const game = window.coldCreekGame;
    if (!game || !game.equipment) return;

    // Hot oil system status indicator
    this._setEquipStatus('hotoil-status', game.equipment['H-100'] || game.equipment['H-401'] || game.equipment['H-800']);

    // Compressor status
    this._setEquipStatus('comp-status', game.equipment['C-100'] || game.equipment['C-101']);

    // Expander status
    this._setEquipStatus('expander-status', game.equipment['EX-400']);
  }

  _setEquipStatus(elementId, equip) {
    const el = document.getElementById(elementId);
    if (!el || !equip) return;

    if (equip.status === 'running') {
      el.setAttribute('fill', '#505050');
      el.setAttribute('stroke', '#606060');
    } else if (equip.status === 'fault' || equip.status === 'tripped') {
      el.setAttribute('fill', '#AA1111');
      el.setAttribute('stroke', '#FF2020');
    } else if (equip.status === 'standby') {
      el.setAttribute('fill', '#404040');
      el.setAttribute('stroke', '#555555');
    }
  }

  _updateFlowLines() {
    const pvMap = this.sim.getAllPVs ? this.sim.getAllPVs() : {};
    // Update flow line colors based on valve/flow state
    const flowLines = document.querySelectorAll('.flow-line');
    flowLines.forEach(line => {
      const tag = line.dataset.tag;
      if (!tag) return;
      const pv = pvMap[tag];
      if (!pv) return;

      // Color based on flow percentage of normal
      const ratio = pv.sp > 0 ? pv.value / pv.sp : 1;
      if (ratio < 0.3) {
        line.style.stroke = '#E04040'; // Low/no flow - red
        line.classList.remove('flowing');
      } else if (ratio < 0.7) {
        line.style.stroke = '#D4A843'; // Reduced flow - amber
        line.classList.add('flowing');
      } else {
        line.style.stroke = ''; // Normal - default color
        line.classList.add('flowing');
      }
    });

    // Update valve position indicators
    const valveEls = document.querySelectorAll('[data-valve]');
    valveEls.forEach(el => {
      const tag = el.dataset.valve;
      const pv = pvMap[tag];
      if (!pv) return;
      const pct = Math.round(pv.output || pv.value);
      const label = el.querySelector('.valve-pct');
      if (label) label.textContent = pct + '%';
    });
  }

  _updatePigStatus() {
    const pigStatus = document.getElementById('pig-status');
    if (!pigStatus) return;

    const game = window.coldCreekGame;
    if (!game || !game.eventSystem) {
      pigStatus.setAttribute('fill', '#505050');
      return;
    }

    const pigEvents = game.eventSystem.activeEvents.filter(e =>
      e.id.startsWith('pig-'));

    if (pigEvents.length > 0) {
      const pig = pigEvents[0];
      if (pig.data.surgePhase === 'approaching') {
        pigStatus.setAttribute('fill', '#AA8800');
        pigStatus.setAttribute('stroke', '#FFD700');
      } else if (pig.data.surgePhase === 'arriving' || pig.data.surgePhase === 'peak') {
        pigStatus.setAttribute('fill', '#AA1111');
        pigStatus.setAttribute('stroke', '#FF2020');
      } else {
        pigStatus.setAttribute('fill', '#505050');
        pigStatus.setAttribute('stroke', '#606060');
      }
    } else {
      pigStatus.setAttribute('fill', '#505050');
      pigStatus.setAttribute('stroke', '#606060');
    }
  }

  /**
   * Update tag bubble colors based on alarm state
   */
  _updateTagBubbles() {
    const bubbles = document.querySelectorAll('.tag-bubble');
    bubbles.forEach(bubble => {
      const tag = bubble.dataset.tag;
      if (!tag) return;
      const pv = this.sim.getPV(tag);
      if (!pv) return;

      if (pv.alarmState === 'HIHI' || pv.alarmState === 'LOLO') {
        bubble.setAttribute('stroke', '#FF2020');
        bubble.setAttribute('stroke-width', '2');
        bubble.style.animation = 'tag-alarm-flash 0.5s ease infinite';
      } else if (pv.alarmState === 'HI' || pv.alarmState === 'LO') {
        bubble.setAttribute('stroke', '#FFD700');
        bubble.setAttribute('stroke-width', '1.5');
        bubble.style.animation = '';
      } else {
        bubble.setAttribute('stroke', '#5A9FD4');
        bubble.setAttribute('stroke-width', '1.2');
        bubble.style.animation = '';
      }
    });
  }

  /**
   * Show live PV values on the P&ID near their tag bubbles
   * Creates/updates small text elements next to each tag bubble
   */
  _updateLiveValues() {
    if (!this.svg) return;

    const bubbles = this.svg.querySelectorAll('.tag-bubble');
    bubbles.forEach(bubble => {
      const tag = bubble.dataset.tag;
      if (!tag) return;
      const pv = this.sim.getPV(tag);
      if (!pv) return;

      // Find or create the live value text element
      const liveId = 'live-' + tag.replace(/[^a-zA-Z0-9]/g, '-');
      let liveEl = this.svg.querySelector('#' + liveId);

      if (!liveEl) {
        liveEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        liveEl.id = liveId;
        liveEl.setAttribute('font-family', 'Courier New');
        liveEl.setAttribute('font-size', '8');
        liveEl.setAttribute('text-anchor', 'middle');
        liveEl.setAttribute('pointer-events', 'none');
        // Position below the bubble
        const cx = parseFloat(bubble.getAttribute('cx')) || 0;
        const cy = parseFloat(bubble.getAttribute('cy')) || 0;
        // Get the parent transform to position correctly
        const parent = bubble.parentElement;
        if (parent) {
          parent.appendChild(liveEl);
          liveEl.setAttribute('x', cx);
          liveEl.setAttribute('y', cy + 22);
        }
      }

      // Update value
      const val = pv.formatValue ? pv.formatValue() : (typeof pv.value === 'number' ? pv.value.toFixed(1) : '----');
      liveEl.textContent = val;

      // Color based on alarm state
      if (pv.alarmState === 'HIHI' || pv.alarmState === 'LOLO') {
        liveEl.setAttribute('fill', '#FF2020');
      } else if (pv.alarmState === 'HI' || pv.alarmState === 'LO') {
        liveEl.setAttribute('fill', '#FFD700');
      } else {
        liveEl.setAttribute('fill', '#B0B0B0');
      }
    });
  }
}

window.PidDiagram = PidDiagram;
