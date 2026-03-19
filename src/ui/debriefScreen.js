/**
 * DebriefScreen — Post-shift debrief with stats, graphs, insights, and share.
 * Replaces the simple objectives results with a full analytics screen.
 */

class DebriefScreen {
  constructor() {
    this._pnlHistory = []; // { time, net, revenue, penalties }
    this._recordingInterval = null;
  }

  /** Start recording P&L data each tick (called from game tick) */
  recordTick(gameTime, pnlSystem) {
    if (!pnlSystem) return;
    this._pnlHistory.push({
      time: gameTime,
      net: Math.round(pnlSystem.netPerHour),
      revenue: Math.round(pnlSystem.revenuePerHour),
      penalties: Math.round(pnlSystem.penaltiesPerHour),
      shift: Math.round(pnlSystem.shiftEarnings)
    });
    // Keep max 500 data points
    if (this._pnlHistory.length > 500) {
      this._pnlHistory = this._pnlHistory.filter((_, i) => i % 2 === 0);
    }
  }

  /** Reset for new shift */
  reset() {
    this._pnlHistory = [];
  }

  /** Render the full debrief screen */
  render(game) {
    const earnings = game.pnlSystem ? Math.round(game.pnlSystem.shiftEarnings) : 0;
    const revenue = game.pnlSystem ? Math.round(game.pnlSystem.revenuePerHour) : 0;
    const penalties = game.pnlSystem ? Math.round(game.pnlSystem.penaltiesPerHour) : 0;
    const eventCosts = game.pnlSystem ? Math.round(game.pnlSystem.eventCosts) : 0;
    const facility = (game.currentFacility || 'stabilizer').toUpperCase();
    const mode = (game.currentMode || 'operate').toUpperCase();
    const alarms = game.alarmManager ? (game.alarmManager.alarmHistory || []).length : 0;
    const grade = game.objectives ? game.objectives.getGrade() : { letter: 'C', label: 'ACCEPTABLE', color: '#D4A843' };

    // Previous shift comparison
    const profile = game.operatorProfile;
    const history = profile && profile._stats && profile._stats.history ? profile._stats.history : [];
    const prevShift = history.length > 1 ? history[history.length - 2] : null;
    const delta = prevShift ? earnings - prevShift.earnings : 0;
    const deltaPct = prevShift && prevShift.earnings !== 0 ? Math.round((delta / Math.abs(prevShift.earnings)) * 100) : 0;
    const deltaStr = delta >= 0 ? `+${deltaPct}%` : `${deltaPct}%`;

    // Recovery rates
    const pvMap = game.sim ? game.sim.getAllPVs() : {};
    const ethRecovery = pvMap['AI-701'] || pvMap['AI-502'];
    const propRecovery = pvMap['AI-702'] || pvMap['AI-503'];

    let html = `<div class="debrief-screen">`;

    // Top banner
    html += `<div class="debrief-banner">`;
    html += `<div class="debrief-title">COLD CREEK SHIFT DEBRIEF</div>`;
    html += `<div class="debrief-sub">${game.sim ? game.sim.getTimeString() : '18:00'} | ${game.sim ? game.sim.getShiftLabel() : 'DAY SHIFT'} | ${facility}</div>`;
    html += `</div>`;

    // Grade + Earnings header
    html += `<div class="debrief-grade-row">`;
    html += `<div class="debrief-grade" style="color:${grade.color}">${grade.letter}</div>`;
    html += `<div class="debrief-earnings">`;
    html += `<div class="debrief-earnings-val" style="color:${earnings >= 0 ? '#4CAF50' : '#E04040'}">$${earnings.toLocaleString()}</div>`;
    html += `<div class="debrief-earnings-label">NET EARNINGS ${prevShift ? `<span style="color:${delta >= 0 ? '#4CAF50' : '#E04040'}">${deltaStr} from last</span>` : ''}</div>`;
    html += `</div>`;
    html += `</div>`;

    // Stats cards
    html += `<div class="debrief-stats">`;
    if (ethRecovery) {
      const eth = ethRecovery.displayValue();
      html += this._statCard('NGL RECOVERY', eth.toFixed(1) + '%', eth > 90 ? '#4CAF50' : eth > 80 ? '#D4A843' : '#E04040');
    }
    html += this._statCard('PENALTIES', '$' + eventCosts.toLocaleString(), eventCosts > 0 ? '#E04040' : '#4CAF50');
    html += this._statCard('ALARMS', alarms.toString(), alarms === 0 ? '#4CAF50' : alarms < 5 ? '#D4A843' : '#E04040');
    html += this._statCard('GRADE', `${grade.letter} — ${grade.label}`, grade.color);
    html += `</div>`;

    // P&L Graph (canvas-based)
    html += `<div class="debrief-section-header">P&L OVER SHIFT</div>`;
    html += `<canvas id="debrief-pnl-chart" class="debrief-chart" width="600" height="200"></canvas>`;

    // Key insights
    html += `<div class="debrief-section-header">KEY INSIGHTS</div>`;
    html += `<div class="debrief-insights">`;
    html += this._generateInsights(game);
    html += `</div>`;

    // Objectives checklist
    if (game.objectives) {
      html += `<div class="debrief-section-header">OBJECTIVES</div>`;
      html += `<div class="debrief-objectives">`;
      for (const obj of game.objectives.objectives) {
        const icon = obj.passed ? '\u2713' : '\u2717';
        const cls = obj.passed ? 'obj-pass' : 'obj-fail';
        html += `<div class="debrief-obj-row ${cls}"><span class="obj-check-icon">${icon}</span> ${obj.label}</div>`;
      }
      html += `</div>`;
    }

    // Achievement unlocks from this shift
    if (game._shiftAchievements && game._shiftAchievements.length > 0) {
      html += `<div class="debrief-section-header">ACHIEVEMENTS UNLOCKED</div>`;
      html += `<div class="debrief-achievements">`;
      for (const achId of game._shiftAchievements) {
        const def = Achievements.DEFINITIONS.find(d => d.id === achId);
        if (def) {
          const tier = Achievements.TIERS[def.tier];
          html += `<div class="debrief-ach-row"><span class="ach-icon" style="color:${tier.color}">${def.icon}</span> <strong>${def.name}</strong> — ${def.desc}</div>`;
        }
      }
      html += `</div>`;
    }

    // Challenge completions
    if (game._shiftChallenges && game._shiftChallenges.length > 0) {
      html += `<div class="debrief-section-header">CHALLENGES COMPLETED</div>`;
      html += `<div class="debrief-challenges">`;
      for (const c of game._shiftChallenges) {
        html += `<div class="debrief-ch-row">\u2713 ${c.challenge.name} <span class="ch-reward">+${c.challenge.reward}pts</span></div>`;
      }
      html += `</div>`;
    }

    // Career XP / Promotion
    if (game.career) {
      const rank = game.career.getCurrentRank();
      const next = game.career.getNextRank();
      const pct = game.career.getProgressPercent();
      const xpResult = game._lastXPResult;
      html += `<div class="debrief-section-header">CAREER PROGRESSION</div>`;
      html += `<div class="debrief-career">`;
      html += `<div class="debrief-rank" style="color:${rank.color}">${rank.title}</div>`;
      if (xpResult) {
        html += `<div class="debrief-xp-gained" style="color:#4CAF50">+${xpResult.xpGained} XP this shift</div>`;
        if (xpResult.newRank) {
          html += `<div class="debrief-xp-gained" style="color:${xpResult.newRank.color}">PROMOTED TO ${xpResult.newRank.title}!</div>`;
        }
      }
      if (next) {
        html += `<div class="debrief-xp-bar"><div class="debrief-xp-fill" style="width:${pct}%;background:${rank.color}"></div></div>`;
        html += `<div class="debrief-xp-label">${game.career.state.xp} / ${next.xpRequired} XP — Next: ${next.title}</div>`;
      } else {
        html += `<div class="debrief-xp-label">MAX RANK ACHIEVED</div>`;
      }
      html += `</div>`;
    }

    // Henry comment
    const comment = this._getHenryComment(grade.letter, earnings);
    html += `<div class="debrief-henry">"${comment}"<br><span class="debrief-henry-name">— HENRY, SENIOR OPERATOR</span></div>`;

    // Action buttons
    html += `<div class="debrief-actions">`;
    html += `<button class="menu-btn debrief-btn" id="debrief-share-btn">SHARE SHIFT</button>`;
    html += `<button class="menu-btn debrief-btn" id="debrief-profile-btn">VIEW PROFILE</button>`;
    html += `<button class="menu-btn debrief-btn debrief-main-btn" id="debrief-done-btn">MAIN MENU</button>`;
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  /** Draw the P&L chart onto the canvas after render */
  drawChart() {
    const canvas = document.getElementById('debrief-pnl-chart');
    if (!canvas || this._pnlHistory.length < 2) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = { top: 20, right: 20, bottom: 30, left: 50 };

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, w, h);

    const data = this._pnlHistory;
    const maxShift = Math.max(...data.map(d => d.shift), 1);
    const minShift = Math.min(...data.map(d => d.shift), 0);
    const range = maxShift - minShift || 1;

    // Grid lines
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (h - pad.top - pad.bottom);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      const val = maxShift - (i / 4) * range;
      ctx.fillStyle = '#888';
      ctx.font = '9px Courier New';
      ctx.textAlign = 'right';
      ctx.fillText('$' + Math.round(val).toLocaleString(), pad.left - 4, y + 3);
    }

    // Zero line
    if (minShift < 0) {
      const zeroY = pad.top + ((maxShift) / range) * (h - pad.top - pad.bottom);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, zeroY);
      ctx.lineTo(w - pad.right, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // P&L line
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right);
      const y = pad.top + ((maxShift - data[i].shift) / range) * (h - pad.top - pad.bottom);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill gradient under line
    const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0.0)');
    ctx.fillStyle = gradient;
    ctx.lineTo(w - pad.right, h - pad.bottom);
    ctx.lineTo(pad.left, h - pad.bottom);
    ctx.closePath();
    ctx.fill();

    // Time labels
    ctx.fillStyle = '#888';
    ctx.font = '9px Courier New';
    ctx.textAlign = 'center';
    const first = data[0];
    const last = data[data.length - 1];
    ctx.fillText(this._fmtTime(first.time), pad.left, h - 8);
    ctx.fillText(this._fmtTime(last.time), w - pad.right, h - 8);
    ctx.fillText(this._fmtTime((first.time + last.time) / 2), w / 2, h - 8);
  }

  _fmtTime(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins) % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  _statCard(label, value, color) {
    return `<div class="debrief-stat-card"><div class="debrief-stat-val" style="color:${color}">${value}</div><div class="debrief-stat-label">${label}</div></div>`;
  }

  _generateInsights(game) {
    let html = '';
    const penalties = game.pnlSystem ? game.pnlSystem.penaltyReasons : [];
    const eventCosts = game.pnlSystem ? game.pnlSystem.eventCosts : 0;

    if (eventCosts > 0) {
      html += `<div class="insight-row insight-bad">Biggest money loser: Event costs totaling $${eventCosts.toLocaleString()}</div>`;
    }
    if (penalties.includes('RVP OFF-SPEC')) {
      html += `<div class="insight-row insight-bad">RVP went off-spec — adjust reboiler duty earlier next time</div>`;
    }
    if (penalties.includes('BTEX VIOLATION')) {
      html += `<div class="insight-row insight-bad">BTEX violation detected — keep pilot lit at all times</div>`;
    }
    if (penalties.includes('COMP DOWN')) {
      html += `<div class="insight-row insight-bad">Compressor was down — watch separator level to prevent trips</div>`;
    }
    if (penalties.length === 0 && eventCosts === 0) {
      html += `<div class="insight-row insight-good">Clean shift! No penalties recorded. Outstanding work.</div>`;
    }

    // Weather insight
    if (game.weather) {
      if (game.weather.ambientTemp < 30) {
        html += `<div class="insight-row insight-info">Cold weather boosted recovery rates. Take advantage next time.</div>`;
      } else if (game.weather.ambientTemp > 95) {
        html += `<div class="insight-row insight-warn">Hot weather reduced condenser efficiency. Consider adjusting setpoints.</div>`;
      }
    }

    if (!html) {
      html = `<div class="insight-row insight-info">Solid shift. Keep refining your setpoints for better margins.</div>`;
    }
    return html;
  }

  _getHenryComment(grade, earnings) {
    const comments = {
      S: "Well I'll be damned. That's the best shift I've seen in 30 years. You sure you're new?",
      A: "Excellent work. Clean shift, good numbers. You'd survive out here.",
      B: "Solid shift. Nothing blew up, we made money. That's the job.",
      C: "You kept the lights on. That counts for something. But there's room to improve.",
      D: "Rough one. Don't worry \u2014 every good operator has bad shifts. Learn from it."
    };
    return comments[grade] || comments.C;
  }

  /** Generate a shareable text summary */
  getShareText(game) {
    const earnings = game.pnlSystem ? Math.round(game.pnlSystem.shiftEarnings) : 0;
    const facility = (game.currentFacility || '').toUpperCase();
    const grade = game.objectives ? game.objectives.getGrade() : { letter: 'C' };
    return `I just completed a shift at Cold Creek ${facility} \u2014 Grade ${grade.letter}, $${earnings.toLocaleString()} earned! \ud83c\udfed\n\nPlay free at gasplantsim.com #ColdCreek #GasPlant`;
  }

  /**
   * Generate a shareable image (canvas → blob) with shift stats.
   * Returns a Promise<Blob> (PNG).
   */
  generateShareImage(game) {
    const W = 600, H = 340;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, W, H);

    // Border accent
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // Header
    ctx.fillStyle = '#D4A843';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('COLD CREEK GAS PLANT', W / 2, 36);

    ctx.fillStyle = '#808080';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('SHIFT DEBRIEF', W / 2, 54);

    // Facility & mode
    const facility = (game.currentFacility || 'stabilizer').toUpperCase();
    const mode = (game.currentMode || 'operate').toUpperCase();
    ctx.fillStyle = '#A0A0A0';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(`${facility}  |  ${mode} MODE`, W / 2, 78);

    // Grade circle
    const grade = game.objectives ? game.objectives.getGrade() : { letter: 'C', color: '#D4A843' };
    ctx.beginPath();
    ctx.arc(W / 2, 130, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#2A2A2A';
    ctx.fill();
    ctx.strokeStyle = grade.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = grade.color;
    ctx.font = 'bold 40px "Courier New", monospace';
    ctx.fillText(grade.letter, W / 2, 145);

    // Earnings
    const earnings = game.pnlSystem ? Math.round(game.pnlSystem.shiftEarnings) : 0;
    ctx.fillStyle = earnings >= 0 ? '#4CAF50' : '#E04040';
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText('$' + earnings.toLocaleString(), W / 2, 200);
    ctx.fillStyle = '#808080';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('NET SHIFT EARNINGS', W / 2, 218);

    // Stats row
    const alarms = game.alarmManager ? (game.alarmManager.alarmHistory || []).length : 0;
    const rank = game.career ? game.career.getCurrentRank() : null;
    const items = [
      { label: 'ALARMS', val: alarms.toString(), color: alarms === 0 ? '#4CAF50' : '#E04040' },
      { label: 'RANK', val: rank ? rank.title.split(' ').pop() : 'N/A', color: rank ? rank.color : '#A0A0A0' }
    ];
    const pvMap = game.sim ? game.sim.getAllPVs() : {};
    const recovery = pvMap['AI-701'] || pvMap['AI-502'];
    if (recovery) {
      items.unshift({ label: 'RECOVERY', val: recovery.displayValue().toFixed(1) + '%', color: '#5A9BD4' });
    }
    const spacing = W / (items.length + 1);
    items.forEach((item, i) => {
      const x = spacing * (i + 1);
      ctx.fillStyle = item.color;
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText(item.val, x, 254);
      ctx.fillStyle = '#606060';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(item.label, x, 268);
    });

    // Mini P&L sparkline
    if (this._pnlHistory.length > 2) {
      const data = this._pnlHistory;
      const maxS = Math.max(...data.map(d => d.shift), 1);
      const minS = Math.min(...data.map(d => d.shift), 0);
      const range = maxS - minS || 1;
      const sparkX = 60, sparkW = W - 120, sparkY = 280, sparkH = 28;

      ctx.strokeStyle = '#4CAF5088';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = sparkX + (i / (data.length - 1)) * sparkW;
        const y = sparkY + sparkH - ((data[i].shift - minS) / range) * sparkH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Footer
    ctx.fillStyle = '#555';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('gasplantsim.com  |  Play Free', W / 2, H - 14);

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  /**
   * Share as image (uses Web Share API or fallback download).
   */
  async shareAsImage(game) {
    try {
      const blob = await this.generateShareImage(game);
      const file = new File([blob], 'cold-creek-shift.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Cold Creek Shift Debrief',
          text: this.getShareText(game),
          files: [file]
        });
        return 'shared';
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cold-creek-shift.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return 'downloaded';
    } catch (e) {
      // Final fallback: copy text
      const text = this.getShareText(game);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return 'copied';
      }
      return 'failed';
    }
  }
}

window.DebriefScreen = DebriefScreen;
