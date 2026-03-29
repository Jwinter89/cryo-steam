/**
 * Leaderboard — Username management and score tracking.
 * Uses Firebase Realtime Database for shared leaderboard,
 * with localStorage fallback for offline play.
 *
 * Seed scores are hardcoded and merged at display time only.
 * They are NEVER written to localStorage — this prevents duplication.
 */

class Leaderboard {
  constructor() {
    // Seed scores live here in code — never in localStorage
    this.seeds = [
      { username: 'LITTLE BLACK BOX', facility: 'stabilizer', mode: 'operate', earnings: 19771, isSeed: true },
      { username: 'END OF SHIFT', facility: 'cryogenic', mode: 'operate', earnings: 38911, isSeed: true },
      { username: 'FLATTOP', facility: 'refrigeration', mode: 'operate', earnings: 30587, isSeed: true },
      { username: 'ENGUISH', facility: 'cryogenic', mode: 'operate', earnings: 32429, isSeed: true }
    ];

    this.username = localStorage.getItem('coldcreek-username') || '';
    this.localScores = this._loadLocalScores();
    this._purgeOldSeeds();
    this.db = null;
    this._initFirebase();
  }

  // One-time cleanup: remove any seed entries that previous buggy code
  // wrote into localStorage. Keyed so it only runs once.
  _purgeOldSeeds() {
    if (localStorage.getItem('coldcreek-lb-purged')) return;
    const seedKeys = new Set(this.seeds.map(s => s.username + '|' + s.earnings));
    const before = this.localScores.length;
    this.localScores = this.localScores.filter(s =>
      !seedKeys.has((s.username || '') + '|' + (s.earnings || 0))
    );
    if (this.localScores.length < before) {
      this._saveLocalScores();
    }
    localStorage.setItem('coldcreek-lb-purged', '1');
  }

  _initFirebase() {
    if (typeof firebase === 'undefined' || !firebase.database) {
      console.warn('Leaderboard: Firebase not loaded — using local only');
      return;
    }
    try {
      this.db = firebase.database();
    } catch (e) {
      console.warn('Leaderboard: Firebase init failed', e);
    }
  }

  // ── Username ──────────────────────────────────────────────

  hasUsername() {
    return this.username.length > 0;
  }

  setUsername(name) {
    this.username = name.trim().substring(0, 20);
    localStorage.setItem('coldcreek-username', this.username);
  }

  getUsername() {
    return this.username;
  }

  // ── Submit Score ──────────────────────────────────────────

  submitScore(facility, mode, earnings) {
    const entry = {
      username: this.username || 'ANONYMOUS',
      facility,
      mode,
      earnings: Math.round(earnings),
      timestamp: Date.now()
    };

    // Always save locally
    this.localScores.push(entry);
    this._saveLocalScores();

    // Push to Firebase if available
    if (this.db) {
      try {
        this.db.ref('leaderboard').push(entry);
      } catch (e) {
        console.warn('Leaderboard: Firebase push failed', e);
      }
    }
  }

  // ── Fetch Scores ──────────────────────────────────────────

  /**
   * Returns top scores. Merges hardcoded seeds with real scores.
   * Uses Firebase if available, else local + seeds.
   * @param {number} limit - Max number of scores to return
   * @param {string|null} facility - Filter by facility
   * @returns {Promise<Array>} Sorted by earnings descending
   */
  async getTopScores(limit = 10, facility = null) {
    let realScores = [];

    // Try Firebase first
    if (this.db) {
      try {
        const snapshot = await this.db.ref('leaderboard')
          .orderByChild('earnings')
          .limitToLast(limit * 2)
          .once('value');

        snapshot.forEach(child => {
          realScores.push(child.val());
        });
      } catch (e) {
        console.warn('Leaderboard: Firebase fetch failed, using local', e);
        realScores = [...this.localScores];
      }
    } else {
      realScores = [...this.localScores];
    }

    // Merge seeds into real scores
    const combined = [...realScores, ...this.seeds];

    // Filter by facility if specified
    const filtered = facility
      ? combined.filter(s => (s.facility || '').toLowerCase() === facility.toLowerCase())
      : combined;

    // Sort descending by earnings, take top N
    filtered.sort((a, b) => b.earnings - a.earnings);
    return filtered.slice(0, limit);
  }

  // ── Local Storage ─────────────────────────────────────────

  _loadLocalScores() {
    try {
      const data = localStorage.getItem('coldcreek-leaderboard');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  _saveLocalScores() {
    try {
      // Keep last 50 local scores
      if (this.localScores.length > 50) {
        this.localScores = this.localScores.slice(-50);
      }
      localStorage.setItem('coldcreek-leaderboard', JSON.stringify(this.localScores));
    } catch (e) { /* Storage unavailable */ }
  }
}

window.Leaderboard = Leaderboard;
