/**
 * PnlManager — Profit & Loss economic system.
 * The live P&L ticker is the core feedback loop.
 * Every action has a dollar consequence.
 */

class PnlManager {
  constructor(economics) {
    this.economics = economics || {};
    this.revenuePerHour = 0;
    this.penaltiesPerHour = 0;
    this.netPerHour = 0;
    this.shiftEarnings = 0;
    this.eventCosts = 0;        // One-time event costs accumulated
    this.penaltyReasons = [];   // Active penalty descriptions

    // UI elements
    this.rateEl = document.getElementById('pnl-rate');
    this.shiftEl = document.getElementById('shift-earnings');
    this.revEl = document.getElementById('pnl-revenue');
    this.penEl = document.getElementById('pnl-penalties');
    this.netEl = document.getElementById('pnl-net');
    this.shiftPnlEl = document.getElementById('pnl-shift');
  }

  /**
   * Called every simulation tick
   */
  tick(dt, pvMap) {
    const econ = this.economics;
    let revenue = econ.baseRevenuePerHour || 1800;
    let penalties = 0;
    this.penaltyReasons = [];

    // RVP in-spec bonus
    const rvp = pvMap['AI-501'];
    if (rvp) {
      const rvpVal = rvp.displayValue();
      const specs = this.economics.specs || { min: 9.0, max: 11.5 };

      if (rvpVal >= specs.min && rvpVal <= specs.max) {
        // In spec — bonus based on how close to target
        const target = (specs.min + specs.max) / 2;
        const closeness = 1 - Math.abs(rvpVal - target) / ((specs.max - specs.min) / 2);
        revenue += (econ.rvpBonusPerHour || 200) * closeness;
      } else {
        // Off spec — penalty
        penalties += econ.rvpPenaltyPerHour || 500;
        this.penaltyReasons.push('RVP OFF-SPEC');
      }
    }

    // Tank pressure high = pop-off risk
    const tankPress = pvMap['PIC-203'];
    if (tankPress && tankPress.alarmState === 'HIHI') {
      penalties += 300;
      this.penaltyReasons.push('TANK OVERPRESSURE');
    }

    // Separator HiHi = potential ESD scenario
    const sepLevel = pvMap['LIC-302'];
    if (sepLevel && sepLevel.alarmState === 'HIHI') {
      penalties += 2000;
      this.penaltyReasons.push('SEPARATOR HIHI');
    }

    // Compressor trip penalty
    const compDisch = pvMap['PIC-202'];
    if (compDisch && compDisch.value < 300) {
      penalties += 1500;
      revenue *= 0.3; // Massive revenue loss when comp down
      this.penaltyReasons.push('COMP DOWN');
    }

    // Tower flooding penalty
    const towerSump = pvMap['LIC-301'];
    if (towerSump && towerSump.alarmState === 'HIHI') {
      penalties += 800;
      this.penaltyReasons.push('TOWER FLOODING');
    }

    this.revenuePerHour = revenue;
    this.penaltiesPerHour = penalties;
    this.netPerHour = revenue - penalties;

    // Accumulate shift earnings (dt is in game-minutes, convert to hours)
    const dtHours = dt / 60;
    this.shiftEarnings += this.netPerHour * dtHours;

    this._updateUI();
  }

  /**
   * Apply a one-time cost (compressor restart, pop-off, etc.)
   */
  applyEventCost(amount, reason) {
    this.eventCosts += amount;
    this.shiftEarnings -= amount;
    this.penaltyReasons.push(reason);
  }

  _updateUI() {
    // Format currency
    const fmt = (val) => {
      const abs = Math.abs(val);
      const str = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${Math.round(abs)}`;
      return val < 0 ? `-${str}` : str;
    };

    const fmtRate = (val) => {
      const abs = Math.abs(val);
      const str = `$${Math.round(abs).toLocaleString()}`;
      return val < 0 ? `-${str}/hr` : `${str}/hr`;
    };

    if (this.rateEl) {
      this.rateEl.textContent = fmtRate(this.netPerHour);
      this.rateEl.style.color = this.netPerHour > 0
        ? (this.penaltiesPerHour > 0 ? 'var(--alarm-lo)' : 'var(--text-normal)')
        : 'var(--alarm-crit)';
    }

    if (this.shiftEl) {
      this.shiftEl.textContent = `SHIFT: ${fmt(this.shiftEarnings)}`;
    }

    if (this.revEl) {
      this.revEl.textContent = fmtRate(this.revenuePerHour);
    }

    if (this.penEl) {
      this.penEl.textContent = this.penaltiesPerHour > 0
        ? `-${fmtRate(this.penaltiesPerHour)}`.replace('/hr', '/hr')
        : '-$0/hr';
    }

    if (this.netEl) {
      this.netEl.textContent = fmtRate(this.netPerHour);
      this.netEl.style.color = this.netPerHour >= 0 ? 'var(--text-normal)' : 'var(--alarm-crit)';
    }

    if (this.shiftPnlEl) {
      this.shiftPnlEl.textContent = fmt(this.shiftEarnings);
    }
  }

  /**
   * Update spec board display
   */
  updateSpecBoard(pvMap) {
    const rvpRow = document.getElementById('spec-rvp');
    const btuRow = document.getElementById('spec-btu');

    if (rvpRow) {
      const rvp = pvMap['AI-501'];
      if (rvp) {
        const val = rvp.displayValue();
        rvpRow.querySelector('.spec-val').textContent = val.toFixed(2);
        const inSpec = val >= 9.0 && val <= 11.5;
        const warning = val >= 11.0 || val <= 9.3;
        rvpRow.className = 'spec-row ' + (inSpec ? (warning ? 'warning' : 'in-spec') : 'off-spec');
        rvpRow.querySelector('.spec-status').textContent = inSpec ? (warning ? '!!' : 'OK') : 'BAD';
      }
    }

    if (btuRow) {
      // Residue BTU is simulated based on tower overhead conditions
      const overhead = pvMap['TIC-103'];
      if (overhead) {
        const btu = 1010 + (overhead.value - 125) * 0.2 + (Math.random() - 0.5) * 2;
        btuRow.querySelector('.spec-val').textContent = Math.round(btu);
        const inSpec = btu >= 1005 && btu <= 1015;
        const warning = btu >= 1013 || btu <= 1007;
        btuRow.className = 'spec-row ' + (inSpec ? (warning ? 'warning' : 'in-spec') : 'off-spec');
        btuRow.querySelector('.spec-status').textContent = inSpec ? (warning ? '!!' : 'OK') : 'BAD';
      }
    }
  }

  reset() {
    this.revenuePerHour = 0;
    this.penaltiesPerHour = 0;
    this.netPerHour = 0;
    this.shiftEarnings = 0;
    this.eventCosts = 0;
    this.penaltyReasons = [];
    this._updateUI();
  }
}

window.PnlManager = PnlManager;
