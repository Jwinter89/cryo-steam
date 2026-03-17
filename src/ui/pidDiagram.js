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
  }

  update() {
    this._updateLevelIndicators();
    this._updateValvePositions();
    this._updateEquipmentStates();
    this._updateFlowLines();
    this._updatePigStatus();
    this._updateTagBubbles();
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
    // Could update flow line colors based on valve positions / equipment status
    // Keeping it simple — flow lines stay at their default state
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
      } else if (pv.alarmState === 'HI' || pv.alarmState === 'LO') {
        bubble.setAttribute('stroke', '#FFD700');
        bubble.setAttribute('stroke-width', '1.5');
      } else {
        bubble.setAttribute('stroke', '#808080');
        bubble.setAttribute('stroke-width', '1');
      }
    });
  }
}

window.PidDiagram = PidDiagram;
