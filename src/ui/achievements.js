/**
 * Achievements — Bronze/Silver/Gold achievement tracking.
 * 12 achievements that unlock based on gameplay milestones.
 * Persists to localStorage and syncs to Firebase.
 */

class Achievements {
  constructor() {
    this.definitions = Achievements.DEFINITIONS;
    this.state = {}; // { id: { unlocked: bool, unlockedAt: timestamp, progress: number } }
    this._load();
  }

  static get TIERS() {
    return { bronze: { label: 'BRONZE', color: '#CD7F32' }, silver: { label: 'SILVER', color: '#C0C0C0' }, gold: { label: 'GOLD', color: '#FFD700' } };
  }

  static get DEFINITIONS() {
    return [
      // Bronze
      { id: 'first-shift', name: 'First Shift Survivor', desc: 'Complete any Operate shift with net > $0', tier: 'bronze', icon: '\u2726', max: 1 },
      { id: 'pig-whisperer', name: 'Pig Whisperer', desc: 'Handle 5 pig arrivals without flow upset', tier: 'bronze', icon: '\u25C6', max: 5 },
      { id: 'alarm-assassin', name: 'Alarm Assassin', desc: 'Finish a shift with 0 alarms', tier: 'bronze', icon: '\u2716', max: 1 },

      // Silver
      { id: 'rvp-rebel', name: 'RVP Rebel', desc: 'Hold RVP in spec for an entire shift', tier: 'silver', icon: '\u2605', max: 1 },
      { id: 'btex-boss', name: 'BTEX Boss', desc: 'Zero BTEX penalties in Refrigeration Plant', tier: 'silver', icon: '\u26A0', max: 1 },
      { id: 'expander-tamer', name: 'Turboexpander Tamer', desc: 'Switch modes in Cryo without recycle trip', tier: 'silver', icon: '\u2699', max: 1 },

      // Gold
      { id: 'cryo-god', name: 'Cryo God', desc: '92%+ NGL recovery for full shift', tier: 'gold', icon: '\u2744', max: 1 },
      { id: 'profit-king', name: 'Profit King', desc: '$15,000+ net in one shift', tier: 'gold', icon: '\u2654', max: 1 },
      { id: 'crisis-legend', name: 'Crisis Legend', desc: 'Recover from any Crisis in under 4 minutes', tier: 'gold', icon: '\u26A1', max: 1 },
      { id: 'zero-alarm-legend', name: 'Zero-Alarm Legend', desc: '10 perfect shifts in a row', tier: 'gold', icon: '\u2728', max: 10 },
      { id: 'three-plant', name: 'Three-Plant Overlord', desc: 'Run all three facilities in one session with positive P&L', tier: 'gold', icon: '\u2756', max: 3 },
      { id: 'shift-legend', name: 'Shift Legend', desc: 'Earn $8,000+ net for 7 shifts in a row', tier: 'gold', icon: '\u265B', max: 7 }
    ];
  }

  /** Check if an achievement is unlocked */
  isUnlocked(id) {
    return !!(this.state[id] && this.state[id].unlocked);
  }

  /** Get progress for an achievement (0-max) */
  getProgress(id) {
    return (this.state[id] && this.state[id].progress) || 0;
  }

  /** Increment progress and check for unlock. Returns true if newly unlocked. */
  addProgress(id, amount) {
    if (this.isUnlocked(id)) return false;
    const def = this.definitions.find(d => d.id === id);
    if (!def) return false;

    if (!this.state[id]) this.state[id] = { unlocked: false, progress: 0 };
    this.state[id].progress = Math.min(def.max, (this.state[id].progress || 0) + (amount || 1));

    if (this.state[id].progress >= def.max) {
      this.state[id].unlocked = true;
      this.state[id].unlockedAt = Date.now();
      this._save();
      return true;
    }
    this._save();
    return false;
  }

  /** Direct unlock */
  unlock(id) {
    if (this.isUnlocked(id)) return false;
    const def = this.definitions.find(d => d.id === id);
    if (!def) return false;
    if (!this.state[id]) this.state[id] = { unlocked: false, progress: 0 };
    this.state[id].unlocked = true;
    this.state[id].progress = def.max;
    this.state[id].unlockedAt = Date.now();
    this._save();
    return true;
  }

  /** Get all unlocked achievements */
  getUnlocked() {
    return this.definitions.filter(d => this.isUnlocked(d.id));
  }

  /** Get total count */
  getUnlockedCount() {
    return this.definitions.filter(d => this.isUnlocked(d.id)).length;
  }

  /**
   * Evaluate achievements at shift end.
   * Called from game.js with full game context.
   */
  evaluateShiftEnd(game) {
    const results = [];
    const earnings = game.pnlSystem ? game.pnlSystem.shiftEarnings : 0;
    const alarmMgr = game.alarmManager;
    const facility = game.currentFacility;
    const mode = game.currentMode;

    // First Shift Survivor
    if (earnings > 0 && mode === 'operate') {
      if (this.unlock('first-shift')) results.push('first-shift');
    }

    // Alarm Assassin — 0 alarms entire shift
    if (alarmMgr && alarmMgr.alarmHistory && alarmMgr.alarmHistory.length === 0) {
      if (this.unlock('alarm-assassin')) results.push('alarm-assassin');
    }

    // Pig Whisperer — track pig arrivals handled cleanly
    if (game.eventSystem) {
      const pigEvents = game.eventSystem.eventHistory.filter(e => e.id.startsWith('pig-'));
      const equip = game.equipment || {};
      const anyTrip = Object.values(equip).some(e => e.status === 'tripped' || e.status === 'fault');
      if (pigEvents.length > 0 && !anyTrip) {
        if (this.addProgress('pig-whisperer', pigEvents.length)) results.push('pig-whisperer');
      }
    }

    // RVP Rebel — check if RVP stayed in spec (tracked via game._rvpInSpecEntireShift)
    if (game._rvpInSpecEntireShift) {
      if (this.unlock('rvp-rebel')) results.push('rvp-rebel');
    }

    // BTEX Boss — refrigeration with no BTEX penalties
    if (facility === 'refrigeration' && game._noBtexPenalties) {
      if (this.unlock('btex-boss')) results.push('btex-boss');
    }

    // Turboexpander Tamer
    if (facility === 'cryogenic' && game._expanderTamed) {
      if (this.unlock('expander-tamer')) results.push('expander-tamer');
    }

    // Cryo God — 98%+ NGL recovery (tracked via game._highRecoveryEntireShift)
    if (facility === 'cryogenic' && game._highRecoveryEntireShift) {
      if (this.unlock('cryo-god')) results.push('cryo-god');
    }

    // Profit King — $15k+ net
    if (earnings >= 15000) {
      if (this.unlock('profit-king')) results.push('profit-king');
    }

    // Crisis Legend — under 4 min recovery
    if (mode === 'crisis' && game._crisisRecoveryTime && game._crisisRecoveryTime < 4) {
      if (this.unlock('crisis-legend')) results.push('crisis-legend');
    }

    // Zero-Alarm Legend — track consecutive 0-alarm shifts
    if (alarmMgr && alarmMgr.alarmHistory && alarmMgr.alarmHistory.length === 0) {
      if (this.addProgress('zero-alarm-legend', 1)) results.push('zero-alarm-legend');
    } else if (!this.isUnlocked('zero-alarm-legend')) {
      // Reset streak only if not yet unlocked
      if (this.state['zero-alarm-legend']) this.state['zero-alarm-legend'].progress = 0;
    }

    // Shift Legend — strong earnings across multiple shifts ($8k+ for 7 shifts)
    if (earnings >= 8000) {
      if (this.addProgress('shift-legend', 1)) results.push('shift-legend');
    } else if (!this.isUnlocked('shift-legend')) {
      if (this.state['shift-legend']) this.state['shift-legend'].progress = 0;
    }

    // Three-Plant Overlord — track facilities completed this session
    if (earnings > 0) {
      if (!this._sessionFacilities) this._sessionFacilities = new Set();
      this._sessionFacilities.add(facility);
      if (this._sessionFacilities.size >= 3) {
        if (this.unlock('three-plant')) results.push('three-plant');
      }
    }

    this._save();
    return results; // Array of newly unlocked achievement IDs
  }

  // ── Persistence ──────────────────────────────────────

  _save() {
    try {
      localStorage.setItem('coldcreek-achievements', JSON.stringify(this.state));
    } catch (e) { /* ok */ }

    // Sync to Firebase
    if (typeof firebase !== 'undefined' && firebase.database) {
      try {
        const username = localStorage.getItem('coldcreek-username');
        if (username) {
          firebase.database().ref('profiles/' + username + '/achievements').set(this.state);
        }
      } catch (e) { /* ok */ }
    }
  }

  _load() {
    try {
      const data = localStorage.getItem('coldcreek-achievements');
      if (data) this.state = JSON.parse(data);
    } catch (e) {
      this.state = {};
    }
  }

  reset() {
    this.state = {};
    this._save();
  }
}

window.Achievements = Achievements;
