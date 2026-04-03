/**
 * Achievements — Bronze/Silver/Gold achievement tracking.
 * 12 achievements that unlock based on gameplay milestones.
 * Persists to localStorage and syncs to Firebase.
 */

class Achievements {
  constructor() {
    this.definitions = Achievements.DEFINITIONS;
    this.state = {}; // { id: { unlocked: bool, unlockedAt: timestamp, progress: number } }
    this._plantGodTimer = 0;
    this._load();
  }

  static get TIERS() {
    return {
      bronze: { label: 'BRONZE', color: '#CD7F32' },
      silver: { label: 'SILVER', color: '#C0C0C0' },
      gold: { label: 'GOLD', color: '#FFD700' },
      platinum: { label: 'PLATINUM', color: '#E5E4E2' }
    };
  }

  static get DEFINITIONS() {
    return [
      // ---- BRONZE (Journey / Getting Started) ----
      { id: 'first-shift', name: 'First Shift Survivor', desc: 'Complete any Operate shift with net > $0', tier: 'bronze', icon: '\u2726', max: 1 },
      { id: 'pig-whisperer', name: 'Pig Whisperer', desc: 'Handle 5 pig arrivals without flow upset', tier: 'bronze', icon: '\u25C6', max: 5 },
      { id: 'alarm-assassin', name: 'Alarm Assassin', desc: 'Finish a shift with 0 alarms', tier: 'bronze', icon: '\u2716', max: 1 },
      { id: 'graduate', name: 'Stabilizer Graduate', desc: 'Complete Learn mode on Stabilizer', tier: 'bronze', icon: '\u2302', max: 1 },
      { id: 'first-crisis', name: 'Trial by Fire', desc: 'Complete your first Crisis scenario', tier: 'bronze', icon: '\u2622', max: 1 },
      { id: 'ten-shifts', name: 'Veteran Operator', desc: 'Complete 10 total shifts', tier: 'bronze', icon: '\u2318', max: 10 },
      { id: 'field-note-reader', name: 'Field Note Collector', desc: 'Unlock 10 field notes', tier: 'bronze', icon: '\u270E', max: 10 },
      { id: 'truck-loader', name: 'Truck Master', desc: 'Load 10 trucks without off-spec RVP', tier: 'bronze', icon: '\u26DF', max: 10 },

      // ---- SILVER (Skill / Facility Mastery) ----
      { id: 'rvp-rebel', name: 'RVP Rebel', desc: 'Hold RVP in spec for an entire shift', tier: 'silver', icon: '\u2605', max: 1 },
      { id: 'btex-boss', name: 'BTEX Boss', desc: 'Zero BTEX penalties in Refrigeration Plant', tier: 'silver', icon: '\u26A0', max: 1 },
      { id: 'expander-tamer', name: 'Turboexpander Tamer', desc: 'Switch modes in Cryo without recycle trip', tier: 'silver', icon: '\u2699', max: 1 },
      { id: 'stab-master', name: 'Stabilizer Master', desc: 'Complete 10 stabilizer shifts with B grade or better', tier: 'silver', icon: '\u2694', max: 10 },
      { id: 'refrig-master', name: 'Refrigeration Master', desc: 'Complete 10 refrigeration shifts with B grade or better', tier: 'silver', icon: '\u2744', max: 10 },
      { id: 'molsieve-pro', name: 'Mol Sieve Pro', desc: 'Complete a mol sieve bed switch without moisture alarm', tier: 'silver', icon: '\u29BE', max: 1 },
      { id: 's-grade', name: 'S-Rank Operator', desc: 'Earn an S grade on any shift', tier: 'silver', icon: '\u272A', max: 1 },
      { id: 'speed-demon', name: 'Speed Demon', desc: 'Complete a shift at 4x speed with positive P&L', tier: 'silver', icon: '\u23E9', max: 1 },
      { id: 'blizzard-run', name: 'Blizzard Runner', desc: 'Finish a cryo shift in spec at -15F weather', tier: 'silver', icon: '\u2603', max: 1 },

      // ---- GOLD (Endurance / Excellence) ----
      { id: 'cryo-god', name: 'Cryo God', desc: '92%+ NGL recovery for full shift', tier: 'gold', icon: '\u2744', max: 1 },
      { id: 'profit-king', name: 'Profit King', desc: '$15,000+ net in one shift', tier: 'gold', icon: '\u2654', max: 1 },
      { id: 'crisis-legend', name: 'Crisis Legend', desc: 'Recover from any Crisis in under 4 minutes', tier: 'gold', icon: '\u26A1', max: 1 },
      { id: 'zero-alarm-legend', name: 'Zero-Alarm Legend', desc: '10 perfect shifts in a row', tier: 'gold', icon: '\u2728', max: 10 },
      { id: 'three-plant', name: 'Three-Plant Overlord', desc: 'Run all three facilities in one session with positive P&L', tier: 'gold', icon: '\u2756', max: 3 },
      { id: 'shift-legend', name: 'Shift Legend', desc: 'Earn $8,000+ net for 7 shifts in a row', tier: 'gold', icon: '\u265B', max: 7 },
      { id: 'fifty-shifts', name: 'Lifer', desc: 'Complete 50 total shifts', tier: 'gold', icon: '\u2620', max: 50 },
      { id: 'streak-7', name: 'Iron Streak', desc: 'Log in and complete a shift 7 days in a row', tier: 'gold', icon: '\u2602', max: 7 },
      { id: 'crisis-sweep', name: 'Crisis Sweep', desc: 'Earn Gold medal on 5 different crisis scenarios', tier: 'gold', icon: '\u2655', max: 5 },
      { id: 'all-field-notes', name: 'The Whole Story', desc: 'Unlock every field note', tier: 'gold', icon: '\u2637', max: 1 },

      // ---- PLATINUM (Legendary) ----
      { id: 'plant-god', name: 'Plant God', desc: 'Push cryo throughput to 132+ MMcfd and hold it for 3 minutes without tripping', tier: 'platinum', icon: '\u2604', max: 1 }
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
      this._notifySteam(id);
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
    this._notifySteam(id);
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

    // Cryo God — 92%+ NGL recovery (tracked via game._highRecoveryEntireShift)
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

    // ---- NEW ACHIEVEMENTS ----

    // Stabilizer Graduate — learn mode complete
    if (game.progress && game.progress.stabilizerDay5Complete) {
      if (this.unlock('graduate')) results.push('graduate');
    }

    // Trial by Fire — first crisis completed
    if (mode === 'crisis') {
      if (this.unlock('first-crisis')) results.push('first-crisis');
    }

    // Veteran Operator — 10 total shifts
    const p = game.progress || {};
    const totalShifts = (p.stabilizerShiftsComplete || 0) +
      (p.refrigerationShiftsComplete || 0) +
      (p.cryogenicShiftsComplete || 0);
    if (this.addProgress('ten-shifts', 1)) results.push('ten-shifts');

    // Lifer — 50 total shifts
    if (totalShifts >= 50) {
      if (this.unlock('fifty-shifts')) results.push('fifty-shifts');
    }

    // Field Note Collector — 10 field notes unlocked
    if (window.FieldNotes && FieldNotes.notes) {
      const unlockedNotes = FieldNotes.notes.filter(n => n.unlocked).length;
      if (unlockedNotes >= 10 && !this.isUnlocked('field-note-reader')) {
        this.state['field-note-reader'] = { unlocked: false, progress: unlockedNotes };
        if (unlockedNotes >= 10) {
          if (this.unlock('field-note-reader')) results.push('field-note-reader');
        }
      }
      // The Whole Story — all field notes
      if (unlockedNotes >= FieldNotes.notes.length) {
        if (this.unlock('all-field-notes')) results.push('all-field-notes');
      }
    }

    // Truck Master — cumulative clean truck loads
    if ((game._truckLoadsClean || 0) > 0) {
      if (this.addProgress('truck-loader', game._truckLoadsClean)) results.push('truck-loader');
    }

    // Stabilizer Master / Refrigeration Master — 10 shifts with B+ grade
    const grade = game.objectives ? game.objectives.getGrade() : { letter: 'C' };
    const goodGrade = ['S', 'A', 'B'].includes(grade.letter);
    if (facility === 'stabilizer' && goodGrade) {
      if (this.addProgress('stab-master', 1)) results.push('stab-master');
    }
    if (facility === 'refrigeration' && goodGrade) {
      if (this.addProgress('refrig-master', 1)) results.push('refrig-master');
    }

    // S-Rank Operator
    if (grade.letter === 'S') {
      if (this.unlock('s-grade')) results.push('s-grade');
    }

    // Mol Sieve Pro — bed switch without moisture alarm
    if (facility === 'cryogenic' && game._molsieveCycleComplete) {
      const moistureAlarm = alarmMgr && alarmMgr.alarmHistory &&
        alarmMgr.alarmHistory.some(a => a.tag === 'AI-201' && (a.state === 'HI' || a.state === 'HIHI'));
      if (!moistureAlarm) {
        if (this.unlock('molsieve-pro')) results.push('molsieve-pro');
      }
    }

    // Speed Demon — 4x speed with positive P&L
    if (earnings > 0 && game.sim && game.sim.realSecondsAt4x) {
      const totalReal = (Date.now() - (game._shiftStartRealTime || Date.now())) / 1000;
      if (totalReal > 60 && game.sim.realSecondsAt4x > totalReal * 0.5) {
        if (this.unlock('speed-demon')) results.push('speed-demon');
      }
    }

    // Blizzard Runner — cryo shift in spec at -15F
    if (facility === 'cryogenic' && game.weather && game.weather.ambientTemp <= -15 && earnings > 0) {
      if (this.unlock('blizzard-run')) results.push('blizzard-run');
    }

    // Iron Streak — 7-day login streak
    const streak = parseInt(localStorage.getItem('coldcreek-streak') || '0', 10);
    if (streak >= 7) {
      if (this.unlock('streak-7')) results.push('streak-7');
    }

    // Crisis Sweep — gold medal on 5 different crises
    if (mode === 'crisis' && game.crisisScenario) {
      if (!this._crisisGolds) this._crisisGolds = new Set();
      const crisisResult = window.CrisisScenarios && CrisisScenarios.scoreScenario ?
        CrisisScenarios.scoreScenario(game.crisisScenario, game._crisisRecoveryTime || 999, Math.min(0, earnings), false) : null;
      if (crisisResult && crisisResult.medal === 'GOLD') {
        this._crisisGolds.add(game.crisisScenario);
        if (this._crisisGolds.size >= 5) {
          if (this.unlock('crisis-sweep')) results.push('crisis-sweep');
        }
      }
    }

    // Plant God is evaluated per-tick, not at shift end (see evaluateTick)

    this._save();
    return results; // Array of newly unlocked achievement IDs
  }

  /**
   * Per-tick evaluation for achievements that need real-time monitoring.
   * Called from game.js tick loop.
   */
  evaluateTick(game, dt) {
    if (!game.sim || !game.currentFacility) return null;

    // Plant God — 132+ MMcfd (20% over 110) for 3 game-minutes
    if (game.currentFacility === 'cryogenic' && !this.isUnlocked('plant-god')) {
      const flow = game.sim.getPV('FI-100');
      if (flow && flow.value >= 132) {
        this._plantGodTimer = (this._plantGodTimer || 0) + dt;
        if (this._plantGodTimer >= 3) {
          if (this.unlock('plant-god')) return 'plant-god';
        }
      } else {
        this._plantGodTimer = 0;
      }
    }

    return null;
  }

  // ── Steam Integration ────────────────────────────────

  _notifySteam(id) {
    if (typeof window !== 'undefined' && window.steam && window.steam.isAvailable && window.steam.isAvailable()) {
      window.steam.activateAchievement(id);
    }
  }

  // ── Persistence ──────────────────────────────────────

  _save() {
    try {
      localStorage.setItem('coldcreek-achievements', JSON.stringify(this.state));
    } catch (e) { /* ok */ }

    // Sync to Firebase (only if authenticated)
    if (typeof firebase !== 'undefined' && firebase.database && firebase.auth && firebase.auth().currentUser) {
      try {
        const uid = firebase.auth().currentUser.uid;
        firebase.database().ref('profiles/' + uid + '/achievements').set(this.state);
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
