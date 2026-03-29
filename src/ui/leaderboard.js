/**
 * Leaderboard — Username management and score tracking.
 * Uses Firebase Realtime Database for shared leaderboard,
 * with localStorage fallback for offline play.
 */

class Leaderboard {
  constructor() {
    this.username = localStorage.getItem('coldcreek-username') || '';
    this.localScores = this._loadLocalScores();
    this._deduplicateLocal();
    this._seedScores();
    this.db = null;
    this._initFirebase();
  }

  // Remove duplicate entries already in localStorage (same username + earnings + facility)
  _deduplicateLocal() {
    const seen = new Set();
    const cleaned = [];
    for (const s of this.localScores) {
      const key = (s.username || '') + '|' + (s.facility || '') + '|' + (s.earnings || 0);
      if (!seen.has(key)) {
        seen.add(key);
        cleaned.push(s);
      }
    }
    if (cleaned.length < this.localScores.length) {
      this.localScores = cleaned;
      this._saveLocalScores();
    }
  }

  // Seed leaderboard with notable scores (deduplicated)
  _seedScores() {
    const allSeeds = [
      { username: 'LITTLE BLACK BOX', facility: 'stabilizer', mode: 'operate', earnings: 19771, timestamp: Date.now() - 86400000 },
      { username: 'END OF SHIFT', facility: 'cryogenic', mode: 'operate', earnings: 38911, timestamp: Date.now() - 43200000 },
      { username: 'FLATTOP', facility: 'refrigeration', mode: 'operate', earnings: 30587, timestamp: Date.now() - 72000000 },
      { username: 'ENGUISH', facility: 'cryogenic', mode: 'operate', earnings: 32429, timestamp: Date.now() - 36000000 }
    ];

    const currentVersion = 'v2';
    if (localStorage.getItem('coldcreek-lb-seed-' + currentVersion)) return;

    // Filter out seeds that already exist in local scores (by username + earnings)
    const newSeeds = allSeeds.filter(seed =>
      !this.localScores.some(s => s.username === seed.username && s.earnings === seed.earnings)
    );

    if (newSeeds.length > 0) {
      this.localScores.push(...newSeeds);
      this._saveLocalScores();
      // Also push new ones to Firebase if available
      setTimeout(() => {
        if (this.db) {
          newSeeds.forEach(s => {
            try { this.db.ref('leaderboard').push(s); } catch(e) {}
          });
        }
      }, 2000);
    }
    localStorage.setItem('coldcreek-lb-seed-' + currentVersion, '1');
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
   * Returns top scores. Uses Firebase if available, else local.
   * @param {number} limit - Max number of scores to return
   * @returns {Promise<Array>} Sorted by earnings descending
   */
  async getTopScores(limit = 10, facility = null) {
    // Try Firebase first
    if (this.db) {
      try {
        const snapshot = await this.db.ref('leaderboard')
          .orderByChild('earnings')
          .limitToLast(limit * 2)
          .once('value');

        const scores = [];
        snapshot.forEach(child => {
          scores.push(child.val());
        });

        // Filter by facility if specified
        const filtered = facility
          ? scores.filter(s => (s.facility || '').toLowerCase() === facility.toLowerCase())
          : scores;

        // Sort descending by earnings, take top N
        filtered.sort((a, b) => b.earnings - a.earnings);
        return filtered.slice(0, limit);
      } catch (e) {
        console.warn('Leaderboard: Firebase fetch failed, using local', e);
      }
    }

    // Fallback to local
    const filtered = facility
      ? this.localScores.filter(s => (s.facility || '').toLowerCase() === facility.toLowerCase())
      : [...this.localScores];
    const sorted = filtered.sort((a, b) => b.earnings - a.earnings);
    return sorted.slice(0, limit);
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
