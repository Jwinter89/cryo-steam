/**
 * Challenges — Daily and weekly rotating challenges.
 * Refreshes at midnight UTC. Awards bonus leaderboard points.
 */

class Challenges {
  constructor() {
    this.state = this._load();
    this._refresh();
  }

  static get DAILY_POOL() {
    return [
      { id: 'blizzard-run', name: 'Blizzard Run', desc: 'Hit spec at -15\u00B0F weather with 110 MMcfd throughput', facility: 'cryogenic', reward: 200, check: 'weather-cold-spec' },
      { id: 'comp-chaos', name: 'Compressor Chaos', desc: 'Survive a C-100 trip and recover in under 8 minutes', facility: null, reward: 250, check: 'comp-recovery' },
      { id: 'truck-master', name: 'Truck Load Master', desc: 'Load 3 trucks without off-spec RVP', facility: 'stabilizer', reward: 150, check: 'truck-loads' },
      { id: 'molsieve-miracle', name: 'Mol Sieve Miracle', desc: 'Keep mol sieve online during full regen cycle', facility: 'cryogenic', reward: 200, check: 'molsieve-online' },
      { id: 'zero-penalty', name: 'Clean Sheet', desc: 'Complete a shift with $0 penalties', facility: null, reward: 300, check: 'zero-penalties' },
      { id: 'speed-demon', name: 'Speed Demon', desc: 'Complete an Operate shift at 4x speed with positive P&L', facility: null, reward: 200, check: 'speed-run' },
      { id: 'alarm-free', name: 'Silent Shift', desc: 'No alarms for an entire shift', facility: null, reward: 250, check: 'no-alarms' },
      { id: 'pig-rush', name: 'Pig Rush', desc: 'Handle 3+ pig arrivals in one shift without separator HIHI', facility: 'stabilizer', reward: 300, check: 'pig-rush' }
    ];
  }

  static get WEEKLY_POOL() {
    return [
      { id: 'blackout-week', name: 'Blackout Week', desc: 'Complete 5 Operate shifts with zero critical alarms', reward: 500, target: 5, check: 'weekly-no-criticals' },
      { id: 'profit-hunter', name: 'Profit Hunter', desc: 'Top 10% global P&L across any facility', reward: 500, target: 1, check: 'weekly-top-pnl' },
      { id: 'crisis-god', name: 'Crisis God Challenge', desc: 'Beat your personal best recovery time on 3 different crises', reward: 750, target: 3, check: 'weekly-crisis-pb' },
      { id: 'all-facilities', name: 'Tour of Duty', desc: 'Complete a shift on all 3 facilities this week', reward: 400, target: 3, check: 'weekly-all-facilities' }
    ];
  }

  /** Get today's active daily challenges (2 per day) */
  getDaily() {
    return this.state.daily || [];
  }

  /** Get this week's active weekly challenge */
  getWeekly() {
    return this.state.weekly || null;
  }

  /** Check and refresh challenges if day/week has changed */
  _refresh() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekNum = this._getWeekNumber(now);

    if (this.state.lastDailyDate !== today) {
      // Seed-based selection for deterministic daily challenges
      const seed = this._dateSeed(today);
      const pool = [...Challenges.DAILY_POOL];
      const d1 = pool.splice(seed % pool.length, 1)[0];
      const d2 = pool[(seed * 7 + 3) % pool.length];
      this.state.daily = [
        { ...d1, completed: false, progress: 0 },
        { ...d2, completed: false, progress: 0 }
      ];
      this.state.lastDailyDate = today;
    }

    if (this.state.lastWeekNum !== weekNum) {
      const pool = Challenges.WEEKLY_POOL;
      const seed = this._dateSeed(today);
      const w = pool[seed % pool.length];
      this.state.weekly = { ...w, completed: false, progress: 0 };
      this.state.lastWeekNum = weekNum;
    }

    this._save();
  }

  /** Evaluate challenges at shift end */
  evaluateShiftEnd(game) {
    const results = [];
    const earnings = game.pnlSystem ? game.pnlSystem.shiftEarnings : 0;
    const alarmMgr = game.alarmManager;
    const penalties = game.pnlSystem ? game.pnlSystem.eventCosts : 0;
    const facility = game.currentFacility;

    for (const ch of (this.state.daily || [])) {
      if (ch.completed) continue;

      let completed = false;
      switch (ch.check) {
        case 'zero-penalties':
          // Check cumulative event costs, not just current tick rate
          completed = penalties === 0 && game.pnlSystem && game.pnlSystem.eventCosts === 0;
          break;
        case 'no-alarms':
          completed = alarmMgr && alarmMgr.alarmHistory && alarmMgr.alarmHistory.length === 0;
          break;
        case 'speed-run':
          // Must spend majority of real shift time at 4x speed with positive earnings
          if (earnings > 0 && game.sim && game.sim.realSecondsAt4x && game._shiftStartRealTime) {
            const totalReal = (Date.now() - game._shiftStartRealTime) / 1000;
            completed = totalReal > 60 && game.sim.realSecondsAt4x > totalReal * 0.5;
          }
          break;
        case 'pig-rush':
          if (game.eventSystem && facility === 'stabilizer') {
            const pigs = game.eventSystem.eventHistory.filter(e => e.id.startsWith('pig-'));
            const sepPV = game.sim ? game.sim.getPV('LIC-302') : null;
            completed = pigs.length >= 3 && sepPV && sepPV.alarmState !== 'HIHI';
          }
          break;
        case 'comp-recovery':
          completed = !!game._compRecoveredUnder8Min;
          break;
        case 'truck-loads':
          completed = (game._truckLoadsClean || 0) >= 3;
          break;
        case 'weather-cold-spec':
          completed = facility === 'cryogenic' && game.weather && game.weather.ambientTemp <= -15 && earnings > 0;
          break;
        case 'molsieve-online':
          completed = facility === 'cryogenic' && game._molsieveCycleComplete;
          break;
        default:
          break;
      }

      if (completed) {
        ch.completed = true;
        results.push({ type: 'daily', challenge: ch });
      }
    }

    // Weekly progress
    const w = this.state.weekly;
    if (w && !w.completed) {
      switch (w.check) {
        case 'weekly-no-criticals':
          if (alarmMgr && !alarmMgr.alarmHistory.some(a => a.state === 'HIHI' || a.state === 'LOLO')) {
            w.progress = (w.progress || 0) + 1;
          }
          break;
        case 'weekly-all-facilities':
          if (!w._facilities) w._facilities = [];
          if (!w._facilities.includes(facility)) w._facilities.push(facility);
          w.progress = w._facilities.length;
          break;
        case 'weekly-crisis-pb':
          if (game.currentMode === 'crisis' && game._crisisRecoveryTime) {
            w.progress = (w.progress || 0) + 1;
          }
          break;
        case 'weekly-top-pnl':
          if (earnings > 10000) w.progress = 1;
          break;
      }
      if (w.progress >= (w.target || 1)) {
        w.completed = true;
        results.push({ type: 'weekly', challenge: w });
      }
    }

    this._save();
    return results;
  }

  /** Render challenges panel HTML */
  renderPanel() {
    let html = '<div class="challenges-panel">';
    html += '<div class="challenges-header">DAILY CHALLENGES</div>';
    for (const ch of this.getDaily()) {
      const status = ch.completed ? '\u2713' : '\u25CB';
      const cls = ch.completed ? 'ch-complete' : 'ch-active';
      html += `<div class="challenge-row ${cls}">`;
      html += `<span class="ch-status">${status}</span>`;
      html += `<span class="ch-name">${ch.name}</span>`;
      html += `<span class="ch-reward">+${ch.reward}pts</span>`;
      html += `</div>`;
      html += `<div class="ch-desc">${ch.desc}</div>`;
    }

    const w = this.getWeekly();
    if (w) {
      html += '<div class="challenges-header" style="margin-top:8px">WEEKLY CHALLENGE</div>';
      const status = w.completed ? '\u2713' : `${w.progress || 0}/${w.target || 1}`;
      const cls = w.completed ? 'ch-complete' : 'ch-active';
      html += `<div class="challenge-row ${cls}">`;
      html += `<span class="ch-status">${status}</span>`;
      html += `<span class="ch-name">${w.name}</span>`;
      html += `<span class="ch-reward">+${w.reward}pts</span>`;
      html += `</div>`;
      html += `<div class="ch-desc">${w.desc}</div>`;
    }

    html += '</div>';
    return html;
  }

  // ── Helpers ──────────────────────────────────────────

  _dateSeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  _getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  _save() {
    try {
      localStorage.setItem('coldcreek-challenges', JSON.stringify(this.state));
    } catch (e) { /* ok */ }
  }

  _load() {
    try {
      const data = localStorage.getItem('coldcreek-challenges');
      return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
  }

  reset() {
    this.state = {};
    this._save();
    this._refresh();
  }
}

window.Challenges = Challenges;
