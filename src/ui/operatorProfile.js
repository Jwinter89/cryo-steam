/**
 * OperatorProfile — Profile screen with achievements, career rank,
 * shift stats, and badges. Accessible from title screen.
 */

class OperatorProfile {
  constructor(achievements, career) {
    this.achievements = achievements;
    this.career = career;
    this._stats = this._loadStats();
  }

  /** Record shift stats for the profile */
  recordShift(data) {
    this._stats.totalShifts = (this._stats.totalShifts || 0) + 1;
    this._stats.totalEarnings = (this._stats.totalEarnings || 0) + (data.earnings || 0);
    this._stats.bestShift = Math.max(this._stats.bestShift || 0, data.earnings || 0);
    this._stats.totalAlarms = (this._stats.totalAlarms || 0) + (data.alarms || 0);
    this._stats.totalPigs = (this._stats.totalPigs || 0) + (data.pigs || 0);

    // Per-facility tracking
    if (data.facility) {
      if (!this._stats.facilities) this._stats.facilities = {};
      const f = this._stats.facilities[data.facility] || { shifts: 0, earnings: 0, best: 0 };
      f.shifts++;
      f.earnings += data.earnings || 0;
      f.best = Math.max(f.best, data.earnings || 0);
      this._stats.facilities[data.facility] = f;
    }

    // Shift history (last 50)
    if (!this._stats.history) this._stats.history = [];
    this._stats.history.push({
      facility: data.facility,
      mode: data.mode,
      earnings: data.earnings || 0,
      grade: data.grade || 'C',
      alarms: data.alarms || 0,
      timestamp: Date.now()
    });
    if (this._stats.history.length > 50) this._stats.history = this._stats.history.slice(-50);

    this._saveStats();
  }

  /** Render the full profile screen HTML */
  render() {
    const username = localStorage.getItem('coldcreek-username') || 'OPERATOR';
    const rank = this.career ? this.career.getCurrentRank() : { title: 'JUNIOR OPERATOR', level: 1 };
    const unlocked = this.achievements ? this.achievements.getUnlockedCount() : 0;
    const total = Achievements.DEFINITIONS.length;

    let html = `<div class="profile-screen">`;
    html += `<div class="profile-header">`;
    html += `<div class="profile-name">${this._escapeHtml(username.toUpperCase())}</div>`;
    html += `<div class="profile-rank" style="color:${rank.color || '#4CAF50'}">${rank.title}</div>`;
    html += `<div class="profile-stats-mini">`;
    html += `<span>${this._stats.totalShifts || 0} SHIFTS</span>`;
    html += `<span>$${Math.round(this._stats.totalEarnings || 0).toLocaleString()} EARNED</span>`;
    html += `<span>${unlocked}/${total} BADGES</span>`;
    html += `</div>`;
    html += `</div>`;

    // Career progress bar
    if (this.career) {
      const next = this.career.getNextRank();
      const pct = this.career.getProgressPercent();
      html += `<div class="profile-career-bar">`;
      html += `<div class="career-bar-label">${rank.title} \u2192 ${next ? next.title : 'MAX RANK'}</div>`;
      html += `<div class="career-bar-track"><div class="career-bar-fill" style="width:${pct}%;background:${rank.color || '#4CAF50'}"></div></div>`;
      html += `</div>`;
    }

    // Achievement badges grid
    html += `<div class="profile-section-header">ACHIEVEMENTS</div>`;
    html += `<div class="achievement-grid">`;
    for (const def of Achievements.DEFINITIONS) {
      const isUnlocked = this.achievements && this.achievements.isUnlocked(def.id);
      const tier = Achievements.TIERS[def.tier];
      const progress = this.achievements ? this.achievements.getProgress(def.id) : 0;
      const pct = def.max > 1 ? Math.round((progress / def.max) * 100) : (isUnlocked ? 100 : 0);

      html += `<div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">`;
      html += `<div class="ach-icon" style="color:${isUnlocked ? tier.color : '#555'}">${def.icon}</div>`;
      html += `<div class="ach-name">${def.name}</div>`;
      html += `<div class="ach-desc">${def.desc}</div>`;
      html += `<div class="ach-tier" style="color:${tier.color}">${tier.label}</div>`;
      if (def.max > 1 && !isUnlocked) {
        html += `<div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${pct}%;background:${tier.color}"></div></div>`;
        html += `<div class="ach-progress-text">${progress}/${def.max}</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;

    // Recent shift history
    html += `<div class="profile-section-header">RECENT SHIFTS</div>`;
    html += `<div class="profile-history">`;
    const history = (this._stats.history || []).slice(-10).reverse();
    if (history.length === 0) {
      html += `<div class="profile-empty">NO SHIFTS YET — GET TO WORK</div>`;
    }
    for (const h of history) {
      const date = new Date(h.timestamp);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const fac = (h.facility || '').toUpperCase().substring(0, 5);
      html += `<div class="profile-history-row">`;
      html += `<span class="ph-date">${dateStr}</span>`;
      html += `<span class="ph-facility">${fac}</span>`;
      html += `<span class="ph-grade" style="color:${this._gradeColor(h.grade)}">${h.grade}</span>`;
      html += `<span class="ph-earnings" style="color:${h.earnings >= 0 ? '#4CAF50' : '#E04040'}">$${Math.round(h.earnings).toLocaleString()}</span>`;
      html += `</div>`;
    }
    html += `</div>`;

    html += `<button class="menu-btn profile-close-btn" id="profile-close-btn">BACK</button>`;
    html += `</div>`;
    return html;
  }

  _gradeColor(g) {
    const map = { S: '#FFD700', A: '#4CAF50', B: '#5A9BD4', C: '#D4A843', D: '#E04040' };
    return map[g] || '#A0A0A0';
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _loadStats() {
    try {
      const data = localStorage.getItem('coldcreek-profile-stats');
      return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
  }

  _saveStats() {
    try {
      localStorage.setItem('coldcreek-profile-stats', JSON.stringify(this._stats));
    } catch (e) { /* ok */ }

    // Sync to Firebase (only if authenticated)
    if (typeof firebase !== 'undefined' && firebase.database && firebase.auth && firebase.auth().currentUser) {
      try {
        const uid = firebase.auth().currentUser.uid;
        firebase.database().ref('profiles/' + uid + '/stats').set(this._stats);
      } catch (e) { /* ok */ }
    }
  }

  reset() {
    this._stats = {};
    this._saveStats();
  }
}

window.OperatorProfile = OperatorProfile;
