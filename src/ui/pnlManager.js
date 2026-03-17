/**
 * PnlManager — Profit & Loss economic system.
 * The live P&L ticker is the core feedback loop.
 * Every action has a dollar consequence.
 * Supports all facility types with facility-aware penalty checks.
 */

class PnlManager {
  constructor(economics) {
    this.economics = economics || {};
    this.revenuePerHour = 0;
    this.penaltiesPerHour = 0;
    this.netPerHour = 0;
    this.shiftEarnings = 0;
    this.eventCosts = 0;
    this.penaltyReasons = [];

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
    let revenue = 0;
    let penalties = 0;
    this.penaltyReasons = [];

    // ---- THROUGHPUT-BASED REVENUE ----
    // Revenue scales with product flow — no flow, no money
    const productFlow = pvMap['FI-402'] || pvMap['FI-702'];
    const baseRate = econ.baseRevenuePerHour || 1800;
    if (productFlow) {
      // Normalize: 100 bbl/hr is nominal. Revenue scales linearly.
      const flowRatio = Math.max(0, productFlow.value / 100);
      revenue = baseRate * Math.min(flowRatio, 2.0); // Cap at 2x
    } else {
      revenue = baseRate;
    }

    // ---- UTILITY COSTS ----
    // Heater fuel cost scales with hot oil temp
    const hotOil = pvMap['TIC-104'];
    if (hotOil) {
      const fuelCost = Math.max(0, (hotOil.value - 200) * 0.8); // ~$120/hr at 350F
      penalties += fuelCost;
      if (fuelCost > 150) this.penaltyReasons.push('HIGH FUEL COST');
    }

    // ---- UNIVERSAL CHECKS ----

    // RVP in-spec check (stabilizer produces condensate; refrig/cryo produce NGL)
    const rvp = pvMap['AI-501'] || pvMap['AI-704'];
    if (rvp) {
      const rvpVal = rvp.displayValue();
      const specs = this.economics.specs || { min: 9.0, max: 11.5 };
      if (rvpVal >= specs.min && rvpVal <= specs.max) {
        const target = (specs.min + specs.max) / 2;
        const closeness = 1 - Math.abs(rvpVal - target) / ((specs.max - specs.min) / 2);
        revenue += (econ.rvpBonusPerHour || 200) * closeness;
      } else {
        penalties += econ.rvpPenaltyPerHour || 500;
        this.penaltyReasons.push('RVP OFF-SPEC');
      }
    }

    // ---- STABILIZER CHECKS ----

    // Tank pressure high
    const tankPress = pvMap['PIC-203'];
    if (tankPress && tankPress.alarmState === 'HIHI') {
      penalties += 300;
      this.penaltyReasons.push('TANK OVERPRESSURE');
    }

    // Separator HiHi
    const sepLevel = pvMap['LIC-302'];
    if (sepLevel && sepLevel.alarmState === 'HIHI') {
      penalties += 2000;
      this.penaltyReasons.push('SEPARATOR HIHI');
    }

    // Compressor trip (stabilizer)
    const compDisch = pvMap['PIC-202'];
    if (compDisch && compDisch.value < 300) {
      penalties += 1500;
      revenue *= 0.3;
      this.penaltyReasons.push('COMP DOWN');
    }

    // Tower flooding
    const towerSump = pvMap['LIC-301'];
    if (towerSump && towerSump.alarmState === 'HIHI') {
      penalties += 800;
      this.penaltyReasons.push('TOWER FLOODING');
    }

    // ---- REFRIGERATION CHECKS ----

    // Moisture off-spec
    const moisture = pvMap['AI-201'];
    if (moisture && econ.moisturePenaltyPerHour) {
      if (moisture.displayValue() > 7.0) {
        penalties += econ.moisturePenaltyPerHour;
        this.penaltyReasons.push('MOISTURE HIGH');
      }
    }

    // BTEX pilot out
    const btexPilot = pvMap['XI-210'];
    if (btexPilot && btexPilot.value < 0.5 && econ.btexViolationPenalty) {
      penalties += econ.btexViolationPenalty / 60; // per minute converted to tick rate
      this.penaltyReasons.push('BTEX VIOLATION');
    }

    // Residue BTU off-spec
    const btu = pvMap['AI-601'] || pvMap['AI-703'];
    if (btu && econ.btuOffSpecPerHour) {
      const btuVal = btu.displayValue();
      if (btuVal < 1005 || btuVal > 1015) {
        penalties += econ.btuOffSpecPerHour;
        this.penaltyReasons.push('BTU OFF-SPEC');
      }
    }

    // ---- CRYOGENIC CHECKS ----

    // Ethane recovery bonus
    const ethRecovery = pvMap['AI-701'] || pvMap['AI-502'];
    if (ethRecovery && econ.ethaneRecoveryBonusBase) {
      const eth = ethRecovery.displayValue();
      if (eth > 85) {
        revenue += econ.ethaneRecoveryBonusBase * ((eth - 85) / 10);
      }
    }

    // Propane recovery bonus
    const propRecovery = pvMap['AI-702'] || pvMap['AI-503'];
    if (propRecovery && econ.propaneRecoveryBonusBase) {
      const prop = propRecovery.displayValue();
      if (prop > 90) {
        revenue += econ.propaneRecoveryBonusBase * ((prop - 90) / 10);
      }
    }

    // Expander trip
    const expanderSpeed = pvMap['SI-401'];
    if (expanderSpeed && expanderSpeed.value < 1000 && econ.expanderTripCostPerHour) {
      penalties += econ.expanderTripCostPerHour;
      revenue *= 0.4;
      this.penaltyReasons.push('EXPANDER DOWN');
    }

    // ---- AMINE CHECKS ----

    // H2S breakthrough
    const h2s = pvMap['AI-A01'];
    if (h2s && econ.h2sBreakthroughPenaltyPerHour) {
      if (h2s.displayValue() > 4.0) {
        penalties += econ.h2sBreakthroughPenaltyPerHour;
        this.penaltyReasons.push('H2S BREAKTHROUGH');
      }
    }

    // ---- CALCULATE TOTALS ----

    this.revenuePerHour = revenue;
    this.penaltiesPerHour = penalties;
    this.netPerHour = revenue - penalties;

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

    const moneyColor = (val, hasPenalties) => {
      if (val < 0) return '#E04040';           // red — losing money
      if (hasPenalties) return '#D4A843';       // yellow — making money but with penalties
      return '#4CAF50';                         // green — clean profit
    };

    if (this.rateEl) {
      this.rateEl.textContent = fmtRate(this.netPerHour);
      this.rateEl.style.color = moneyColor(this.netPerHour, this.penaltiesPerHour > 0);
    }

    if (this.shiftEl) {
      this.shiftEl.textContent = `SHIFT: ${fmt(this.shiftEarnings)}`;
      this.shiftEl.style.color = this.shiftEarnings >= 0 ? '#4CAF50' : '#E04040';
    }

    if (this.revEl) {
      this.revEl.textContent = fmtRate(this.revenuePerHour);
      this.revEl.style.color = '#4CAF50';
    }

    if (this.penEl) {
      this.penEl.textContent = this.penaltiesPerHour > 0
        ? `-${fmtRate(this.penaltiesPerHour)}`
        : '-$0/hr';
      this.penEl.style.color = this.penaltiesPerHour > 0 ? '#E04040' : 'var(--text-unit)';
    }

    if (this.netEl) {
      this.netEl.textContent = fmtRate(this.netPerHour);
      this.netEl.style.color = moneyColor(this.netPerHour, this.penaltiesPerHour > 0);
    }

    if (this.shiftPnlEl) {
      this.shiftPnlEl.textContent = fmt(this.shiftEarnings);
      this.shiftPnlEl.style.color = this.shiftEarnings >= 0 ? '#4CAF50' : '#E04040';
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
