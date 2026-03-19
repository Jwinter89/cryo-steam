/**
 * CareerProgression — Promotion system based on shift performance.
 * Players start as Junior Board Operator and rank up through thresholds.
 */

class CareerProgression {
  constructor() {
    this.state = this._load();
  }

  static get RANKS() {
    return [
      { level: 1, title: 'JUNIOR BOARD OPERATOR', xpRequired: 0, color: '#808080', radioLine: "New guy, huh? Don't touch anything until I tell you." },
      { level: 2, title: 'BOARD OPERATOR', xpRequired: 500, color: '#5A9BD4', radioLine: "You're getting the hang of it. Keep your eyes on the board." },
      { level: 3, title: 'SENIOR BOARD OPERATOR', xpRequired: 1500, color: '#4CAF50', radioLine: "Good instincts. You're earning your keep out here." },
      { level: 4, title: 'LEAD OPERATOR', xpRequired: 3500, color: '#D4A843', radioLine: "You're running point now. I trust your calls." },
      { level: 5, title: 'SHIFT SUPERVISOR', xpRequired: 7000, color: '#FF6600', radioLine: "The crew looks to you. Don't let them down." },
      { level: 6, title: 'PLANT SUPERINTENDENT', xpRequired: 12000, color: '#C0C0C0', radioLine: "Never thought I'd see the day. You own this plant now." },
      { level: 7, title: 'CRYO LEGEND', xpRequired: 20000, color: '#FFD700', radioLine: "Hell of a career, operator. The plant's in good hands." }
    ];
  }

  /** Get current rank object */
  getCurrentRank() {
    const xp = this.state.xp || 0;
    const ranks = CareerProgression.RANKS;
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (xp >= ranks[i].xpRequired) return ranks[i];
    }
    return ranks[0];
  }

  /** Get next rank (or null if max) */
  getNextRank() {
    const current = this.getCurrentRank();
    const ranks = CareerProgression.RANKS;
    const idx = ranks.findIndex(r => r.level === current.level);
    return idx < ranks.length - 1 ? ranks[idx + 1] : null;
  }

  /** Get progress percent to next rank */
  getProgressPercent() {
    const xp = this.state.xp || 0;
    const current = this.getCurrentRank();
    const next = this.getNextRank();
    if (!next) return 100;
    const range = next.xpRequired - current.xpRequired;
    const progress = xp - current.xpRequired;
    return Math.min(100, Math.round((progress / range) * 100));
  }

  /**
   * Award XP after a shift. Returns { xpGained, newRank (or null) }
   */
  awardShiftXP(game) {
    const earnings = game.pnlSystem ? game.pnlSystem.shiftEarnings : 0;
    const grade = game.objectives ? game.objectives.getGrade() : { letter: 'C' };
    const facility = game.currentFacility;

    const oldRank = this.getCurrentRank();

    // XP calculation
    let xp = 50; // Base XP for completing a shift
    if (earnings > 0) xp += Math.min(200, Math.round(earnings / 100));
    if (grade.letter === 'S') xp += 150;
    else if (grade.letter === 'A') xp += 100;
    else if (grade.letter === 'B') xp += 50;

    // Facility bonus
    if (facility === 'refrigeration') xp = Math.round(xp * 1.2);
    if (facility === 'cryogenic') xp = Math.round(xp * 1.5);

    // Crisis mode bonus
    if (game.currentMode === 'crisis') xp = Math.round(xp * 1.5);

    this.state.xp = (this.state.xp || 0) + xp;
    this.state.totalShifts = (this.state.totalShifts || 0) + 1;
    this._save();

    const newRank = this.getCurrentRank();
    const promoted = newRank.level > oldRank.level;

    return {
      xpGained: xp,
      newRank: promoted ? newRank : null,
      totalXP: this.state.xp
    };
  }

  // ── Persistence ──────────────────────────────────────

  _save() {
    try {
      localStorage.setItem('coldcreek-career', JSON.stringify(this.state));
    } catch (e) { /* ok */ }

    // Firebase sync
    if (typeof firebase !== 'undefined' && firebase.database) {
      try {
        const username = localStorage.getItem('coldcreek-username');
        if (username) {
          firebase.database().ref('profiles/' + username + '/career').set(this.state);
        }
      } catch (e) { /* ok */ }
    }
  }

  _load() {
    try {
      const data = localStorage.getItem('coldcreek-career');
      return data ? JSON.parse(data) : { xp: 0, totalShifts: 0 };
    } catch (e) {
      return { xp: 0, totalShifts: 0 };
    }
  }

  reset() {
    this.state = { xp: 0, totalShifts: 0 };
    this._save();
  }
}

window.CareerProgression = CareerProgression;
