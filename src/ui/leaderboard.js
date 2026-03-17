/**
 * Leaderboard — Username management and score tracking.
 * Uses Firebase Realtime Database for shared leaderboard,
 * with localStorage fallback for offline play.
 */

class Leaderboard {
  constructor() {
    this.username = localStorage.getItem('coldcreek-username') || '';
    this.localScores = this._loadLocalScores();
    this.db = null;
    this._initFirebase();
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
  async getTopScores(limit = 10) {
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

        // Sort descending by earnings, take top N
        scores.sort((a, b) => b.earnings - a.earnings);
        return scores.slice(0, limit);
      } catch (e) {
        console.warn('Leaderboard: Firebase fetch failed, using local', e);
      }
    }

    // Fallback to local
    const sorted = [...this.localScores].sort((a, b) => b.earnings - a.earnings);
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
