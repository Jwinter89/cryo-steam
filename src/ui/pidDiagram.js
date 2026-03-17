/**
 * PidDiagram — Updates the SVG P&ID diagram with live process data.
 * Handles equipment state colors, flow line states, level indicators,
 * valve positions, and interactive elements.
 */

class PidDiagram {
  constructor(sim) {
    this.sim = sim;
    this.svg = document.getElementById('pid-diagram');
  }

  update() {
    this._updateSeparatorLevel();
    this._updateTankLevel();
    this._updateValvePositions();
    this._updateEquipmentStates();
    this._updateFlowLines();
    this._updatePigStatus();
  }

  _updateSeparatorLevel() {
    const sepPV = this.sim.getPV('LIC-302');
    if (!sepPV) return;

    const levelLine = document.getElementById('sep-level-line');
    if (levelLine) {
      // Level line Y position: 0% = bottom (y=70), 100% = top (y=0)
      // Within the separator vessel which is 70px tall
      const pct = sepPV.displayValue() / 100;
      const y = 70 - (pct * 60) - 5; // 5px margin top/bottom
      levelLine.setAttribute('y1', y);
      levelLine.setAttribute('y2', y);

      // Color by alarm state
      if (sepPV.alarmState === 'HIHI' || sepPV.alarmState === 'LOLO') {
        levelLine.setAttribute('stroke', '#FF2020');
        levelLine.setAttribute('stroke-width', '2');
      } else if (sepPV.alarmState === 'HI' || sepPV.alarmState === 'LO') {
        levelLine.setAttribute('stroke', '#FFD700');
        levelLine.setAttribute('stroke-width', '1.5');
      } else {
        levelLine.setAttribute('stroke', '#707070');
        levelLine.setAttribute('stroke-width', '1');
      }
    }
  }

  _updateTankLevel() {
    const tankPV = this.sim.getPV('LIC-303');
    if (!tankPV) return;

    const fill = document.getElementById('tank-level-fill');
    if (fill) {
      const pct = tankPV.displayValue() / 100;
      const totalHeight = 66; // Inside the tank rect
      const fillHeight = pct * totalHeight;
      const y = 2 + (totalHeight - fillHeight);
      fill.setAttribute('y', y);
      fill.setAttribute('height', fillHeight);

      // Color by alarm state
      if (tankPV.alarmState === 'HIHI') {
        fill.setAttribute('fill', '#3a1010');
      } else if (tankPV.alarmState === 'HI') {
        fill.setAttribute('fill', '#3a3010');
      } else {
        fill.setAttribute('fill', '#484848');
      }
    }
  }

  _updateValvePositions() {
    const valveEls = document.querySelectorAll('.valve-pos');
    valveEls.forEach(el => {
      const valveId = el.dataset.valve;
      if (!valveId) return;

      // Get valve position from game state
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
    const hotOilStatus = document.getElementById('hotoil-status');
    if (hotOilStatus) {
      const hotOil = game.equipment['H-100'];
      if (hotOil) {
        if (hotOil.status === 'running') {
          hotOilStatus.setAttribute('fill', '#505050');
          hotOilStatus.setAttribute('stroke', '#606060');
        } else if (hotOil.status === 'fault') {
          hotOilStatus.setAttribute('fill', '#AA1111');
          hotOilStatus.setAttribute('stroke', '#FF2020');
        }
      }
    }
  }

  _updateFlowLines() {
    // Flow lines state based on valve positions and equipment status
    const game = window.coldCreekGame;
    if (!game) return;

    // If inlet valve is closed, dim inlet flow lines
    const inletValve = game.valves ? game.valves['XV-101'] : null;
    if (inletValve && inletValve.position < 10) {
      // Could dim flow lines here
    }
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
        pigStatus.setAttribute('fill', '#AA8800'); // Yellow - incoming
        pigStatus.setAttribute('stroke', '#FFD700');
      } else if (pig.data.surgePhase === 'arriving' || pig.data.surgePhase === 'peak') {
        pigStatus.setAttribute('fill', '#AA1111'); // Red - active
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
}

window.PidDiagram = PidDiagram;
