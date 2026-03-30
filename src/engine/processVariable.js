/**
 * ProcessVariable — Core data structure for every measurable point in the plant.
 * Each PV tracks current value, setpoint, alarm limits, trend history,
 * rate-of-change, and control mode (AUTO/MAN/CAS).
 */

class ProcessVariable {
  /**
   * @param {Object} config
   * @param {string} config.tag       - ISA tag (e.g. "TIC-102")
   * @param {string} config.desc      - Description (e.g. "REBOILER TEMP")
   * @param {string} config.unit      - Engineering unit (e.g. "degF")
   * @param {number} config.value     - Initial value
   * @param {number} config.sp        - Setpoint
   * @param {number} config.min       - Range minimum
   * @param {number} config.max       - Range maximum
   * @param {number} [config.hh]      - High-High alarm limit
   * @param {number} [config.hi]      - High alarm limit
   * @param {number} [config.lo]      - Low alarm limit
   * @param {number} [config.ll]      - Low-Low alarm limit
   * @param {string} [config.mode]    - Control mode: "AUTO", "MAN", "CAS"
   * @param {boolean} [config.controllable] - Can the operator change SP/output?
   * @param {number} [config.output]  - Controller output 0-100%
   * @param {number} [config.responseRate] - How fast PV tracks toward target per tick (0-1)
   * @param {number} [config.noise]   - Random noise amplitude
   */
  constructor(config) {
    this.tag = config.tag;
    this.desc = config.desc || '';
    this.unit = config.unit || '';
    this.value = config.value != null ? config.value : 0;
    this.sp = config.sp != null ? config.sp : (config.value != null ? config.value : 0);
    this.min = config.min != null ? config.min : 0;
    this.max = config.max != null ? config.max : 100;
    this.hh = config.hh != null ? config.hh : null;
    this.hi = config.hi != null ? config.hi : null;
    this.lo = config.lo != null ? config.lo : null;
    this.ll = config.ll != null ? config.ll : null;
    this.mode = config.mode || 'AUTO';
    this.controllable = config.controllable === true;
    this.output = config.output != null ? config.output : 50;
    this.responseRate = config.responseRate != null ? config.responseRate : 0.05;
    this.noise = config.noise != null ? config.noise : 0;

    // Rate of change tracking
    this.prevValue = this.value;
    this.rateOfChange = 0; // units per game-minute

    // Trend history (last 60 values for sparkline)
    this.trendHistory = [];
    this.maxTrendLength = 60;

    // Alarm state
    this.alarmState = 'NORMAL'; // NORMAL, HI, HIHI, LO, LOLO
    this.alarmAcked = true;
    this.alarmTimestamp = null;

    // Hidden damage accumulator (for rate-of-change violations)
    this.damageAccumulator = 0;
    this.maxRateOfChange = config.maxRateOfChange || null; // units/min safe limit

    // Freeze flag (instrument failure)
    this.frozen = false;
    this.frozenAt = null;

    // Dependencies (tags this PV affects when it changes)
    this.dependents = [];

    // External force (for events pushing value in a direction)
    this.externalForce = 0;

    // Ramp state (for ramp sequence)
    this.rampTarget = null;
    this.rampRate = null; // units per tick
  }

  /**
   * Update the PV for one simulation tick
   * @param {number} dt - Delta time in game-minutes
   * @returns {Object} Change report { changed, alarmChanged, oldAlarm, newAlarm }
   */
  tick(dt) {
    this.prevValue = this.value;
    const report = { changed: false, alarmChanged: false, oldAlarm: this.alarmState, newAlarm: this.alarmState };

    if (this.frozen) {
      // Instrument failure — value stays frozen, real process continues underneath
      return report;
    }

    let targetValue = this.value;

    // AUTO mode: PV tracks toward setpoint via output
    if (this.mode === 'AUTO' && this.controllable) {
      // Output drives toward SP. Simple P-controller model.
      const error = this.sp - this.value;
      const outputDelta = error * this.responseRate * dt;
      targetValue = this.value + outputDelta;
      // Update output to reflect controller action
      this.output = Math.max(0, Math.min(100, 50 + (error / (this.max - this.min)) * 100));
    }

    // MAN mode: output is directly set, PV responds to output position
    if (this.mode === 'MAN' && this.controllable) {
      // Output maps linearly to a target in the PV range
      const outputTarget = this.min + (this.output / 100) * (this.max - this.min);
      const error = outputTarget - this.value;
      targetValue = this.value + error * this.responseRate * dt;
    }

    // Apply ramp if active
    if (this.rampTarget !== null && this.rampRate !== null) {
      const rampDelta = this.rampRate * dt;
      if (Math.abs(this.rampTarget - this.value) <= Math.abs(rampDelta)) {
        targetValue = this.rampTarget;
        this.rampTarget = null;
        this.rampRate = null;
      } else {
        targetValue = this.value + Math.sign(this.rampTarget - this.value) * Math.abs(rampDelta);
      }
    }

    // Apply external forces (events, cascade effects)
    targetValue += this.externalForce * dt;

    // Add noise
    if (this.noise > 0) {
      targetValue += (Math.random() - 0.5) * 2 * this.noise;
    }

    // Clamp to range
    this.value = Math.max(this.min, Math.min(this.max, targetValue));

    // Calculate rate of change (units per game-minute)
    this.rateOfChange = dt > 0 ? (this.value - this.prevValue) / dt : 0;

    // Check rate-of-change damage
    if (this.maxRateOfChange !== null && Math.abs(this.rateOfChange) > this.maxRateOfChange) {
      const excess = Math.abs(this.rateOfChange) - this.maxRateOfChange;
      this.damageAccumulator += excess * dt * 0.1;
    }

    // Record trend
    this.trendHistory.push(this.value);
    if (this.trendHistory.length > this.maxTrendLength) {
      this.trendHistory.shift();
    }

    // Check alarms
    const oldAlarm = this.alarmState;
    this.alarmState = this._checkAlarms();
    if (this.alarmState !== oldAlarm) {
      report.alarmChanged = true;
      report.oldAlarm = oldAlarm;
      report.newAlarm = this.alarmState;
      if (this.alarmState !== 'NORMAL') {
        this.alarmAcked = false;
        this.alarmTimestamp = Date.now();
      }
    }

    report.changed = Math.abs(this.value - this.prevValue) > 0.001;
    return report;
  }

  _checkAlarms() {
    if (this.hh !== null && this.value >= this.hh) return 'HIHI';
    if (this.hi !== null && this.value >= this.hi) return 'HI';
    if (this.ll !== null && this.value <= this.ll) return 'LOLO';
    if (this.lo !== null && this.value <= this.lo) return 'LO';
    return 'NORMAL';
  }

  acknowledge() {
    this.alarmAcked = true;
  }

  /** Get trend direction arrow character */
  getTrendArrow() {
    const roc = this.rateOfChange;
    const threshold = (this.max - this.min) * 0.001; // 0.1% of range per minute
    const fastThreshold = threshold * 5;

    if (Math.abs(roc) < threshold) return { char: '\u2192', cls: '' }; // →
    if (roc > fastThreshold) return { char: '\u2191\u2191', cls: 'rising-fast' };
    if (roc > threshold) return { char: '\u2191', cls: 'rising' };
    if (roc < -fastThreshold) return { char: '\u2193\u2193', cls: 'falling-fast' };
    if (roc < -threshold) return { char: '\u2193', cls: 'falling' };
    return { char: '\u2192', cls: '' };
  }

  /** Set a ramp target */
  startRamp(target, ratePerMin) {
    this.rampTarget = Math.max(this.min, Math.min(this.max, target));
    this.rampRate = ratePerMin;
  }

  cancelRamp() {
    this.rampTarget = null;
    this.rampRate = null;
  }

  /** Freeze instrument (failure mode) */
  freeze() {
    this.frozen = true;
    this.frozenAt = this.value;
  }

  unfreeze() {
    this.frozen = false;
    this.frozenAt = null;
  }

  /** Format value for display per DCS standard */
  formatValue() {
    if (this.frozen && this.frozenAt !== null) {
      // Show frozen value (operator doesn't know it's frozen)
      return this.frozenAt.toFixed(this.unit === 'psi' ? 2 : 1);
    }
    return this.value.toFixed(this.unit === 'psi' ? 2 : 1);
  }

  /** Get display value (what operator sees — may be frozen) */
  displayValue() {
    if (this.frozen && this.frozenAt !== null) return this.frozenAt;
    return this.value;
  }

  toJSON() {
    return {
      tag: this.tag,
      value: this.value,
      sp: this.sp,
      output: this.output,
      mode: this.mode,
      alarmState: this.alarmState,
      alarmAcked: this.alarmAcked,
      damageAccumulator: this.damageAccumulator,
      trendHistory: this.trendHistory
    };
  }

  loadJSON(data) {
    if (data.value != null) this.value = data.value;
    if (data.sp != null) this.sp = data.sp;
    if (data.output != null) this.output = data.output;
    if (data.mode) this.mode = data.mode;
    if (data.alarmState) this.alarmState = data.alarmState;
    if (data.alarmAcked != null) this.alarmAcked = data.alarmAcked;
    if (data.damageAccumulator != null) this.damageAccumulator = data.damageAccumulator;
    if (data.trendHistory) this.trendHistory = data.trendHistory;
  }
}

// Make available globally
window.ProcessVariable = ProcessVariable;
