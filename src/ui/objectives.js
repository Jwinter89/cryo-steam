/**
 * Objectives — Shift objectives and win/loss conditions per facility.
 * Displayed at shift start and trackable during gameplay.
 */

class Objectives {
  constructor(facility, mode) {
    this.facility = facility;
    this.mode = mode;
    this.objectives = this._getObjectives(facility, mode);
    this.results = {}; // tag → { passed: bool, value }
  }

  _getObjectives(facility, mode) {
    const base = {
      stabilizer: [
        { id: 'rvp-spec', label: 'Keep RVP in spec (9.0–11.5 psi)', tag: 'AI-501', check: 'range', min: 9.0, max: 11.5, metric: 'psi', priority: 'primary' },
        { id: 'no-hihi', label: 'Avoid any HIHI/LOLO alarms', check: 'no-critical-alarms', priority: 'primary' },
        { id: 'profit', label: 'End shift with positive earnings', check: 'positive-earnings', priority: 'primary' },
        { id: 'sep-level', label: 'Keep separator level 30–70%', tag: 'LIC-302', check: 'range', min: 30, max: 70, metric: '%', priority: 'secondary' },
        { id: 'tank-level', label: 'Don\'t overfill product tank', tag: 'LIC-303', check: 'max', max: 90, metric: '%', priority: 'secondary' },
        { id: 'handle-pig', label: 'Survive a pig arrival without trip', check: 'pig-no-trip', priority: 'bonus' }
      ],
      refrigeration: [
        { id: 'moisture-spec', label: 'Keep TEG moisture below 7 lb/MMSCF', tag: 'AI-TEG', check: 'max', max: 7, metric: 'lb/MMSCF', priority: 'primary' },
        { id: 'no-hihi', label: 'Avoid any HIHI/LOLO alarms', check: 'no-critical-alarms', priority: 'primary' },
        { id: 'profit', label: 'End shift with positive earnings', check: 'positive-earnings', priority: 'primary' },
        { id: 'btu-spec', label: 'Keep residue BTU in spec', tag: 'AI-BTU', check: 'range', min: 950, max: 1100, metric: 'BTU', priority: 'secondary' },
        { id: 'recovery', label: 'Maintain >85% C3+ recovery', check: 'recovery-target', priority: 'bonus' }
      ],
      cryogenic: [
        { id: 'no-hihi', label: 'Avoid any HIHI/LOLO alarms', check: 'no-critical-alarms', priority: 'primary' },
        { id: 'profit', label: 'End shift with positive earnings', check: 'positive-earnings', priority: 'primary' },
        { id: 'expander-up', label: 'Keep expander running', check: 'equipment-running', equipId: 'EX-400', priority: 'primary' },
        { id: 'recovery', label: 'Maximize ethane recovery >90%', check: 'recovery-target', priority: 'secondary' },
        { id: 'molsieve', label: 'Complete mol sieve regeneration cycle', check: 'molsieve-cycle', priority: 'bonus' }
      ]
    };

    return base[facility] || base.stabilizer;
  }

  /**
   * Evaluate all objectives at shift end
   */
  evaluate(game) {
    const pvMap = game.sim ? game.sim.getAllPVs() : {};
    const alarmMgr = game.alarmManager;
    const earnings = game.pnlSystem ? game.pnlSystem.shiftEarnings : 0;

    for (const obj of this.objectives) {
      let passed = false;

      switch (obj.check) {
        case 'range': {
          const pv = pvMap[obj.tag];
          if (pv) {
            const val = pv.displayValue();
            passed = val >= obj.min && val <= obj.max;
            obj.finalValue = val;
          }
          break;
        }
        case 'max': {
          const pv = pvMap[obj.tag];
          if (pv) {
            const val = pv.displayValue();
            passed = val <= obj.max;
            obj.finalValue = val;
          }
          break;
        }
        case 'no-critical-alarms': {
          // Check alarm history for any HIHI/LOLO
          if (alarmMgr) {
            const criticals = alarmMgr.alarmHistory.filter(a =>
              a.state === 'HIHI' || a.state === 'LOLO');
            passed = criticals.length === 0;
            obj.finalValue = criticals.length;
          }
          break;
        }
        case 'positive-earnings': {
          passed = earnings > 0;
          obj.finalValue = earnings;
          break;
        }
        case 'pig-no-trip': {
          // Passed if a pig event occurred and no equipment tripped
          if (game.eventSystem) {
            const hadPig = game.eventSystem.eventHistory.some(e => e.id.startsWith('pig-'));
            if (hadPig) {
              const equip = game.equipment || {};
              const anyTrip = Object.values(equip).some(e => e.status === 'tripped' || e.status === 'fault');
              passed = !anyTrip;
            } else {
              passed = true; // No pig = auto pass
              obj.finalValue = 'NO PIG';
            }
          }
          break;
        }
        case 'equipment-running': {
          const equip = game.equipment && game.equipment[obj.equipId];
          passed = equip && equip.status === 'running';
          break;
        }
        default:
          passed = true;
      }

      obj.passed = passed;
    }

    return this.objectives;
  }

  /**
   * Get the grade based on objectives passed
   */
  getGrade() {
    const primary = this.objectives.filter(o => o.priority === 'primary');
    const secondary = this.objectives.filter(o => o.priority === 'secondary');
    const bonus = this.objectives.filter(o => o.priority === 'bonus');

    const primaryPassed = primary.filter(o => o.passed).length;
    const secondaryPassed = secondary.filter(o => o.passed).length;
    const bonusPassed = bonus.filter(o => o.passed).length;

    const totalPrimary = primary.length;

    if (primaryPassed === totalPrimary && secondaryPassed === secondary.length && bonusPassed > 0) {
      return { letter: 'S', label: 'EXCEPTIONAL', color: '#FFD700' };
    }
    if (primaryPassed === totalPrimary && secondaryPassed === secondary.length) {
      return { letter: 'A', label: 'EXCELLENT', color: '#4CAF50' };
    }
    if (primaryPassed === totalPrimary) {
      return { letter: 'B', label: 'GOOD', color: '#5A9BD4' };
    }
    if (primaryPassed >= totalPrimary - 1) {
      return { letter: 'C', label: 'ACCEPTABLE', color: '#D4A843' };
    }
    return { letter: 'D', label: 'NEEDS WORK', color: '#E04040' };
  }

  /**
   * Render the objectives briefing (shown at shift start)
   */
  renderBriefing() {
    const facilityNames = { stabilizer: 'STABILIZER', refrigeration: 'REFRIGERATION', cryogenic: 'CRYOGENIC' };
    const name = facilityNames[this.facility] || this.facility.toUpperCase();

    let html = `<div class="obj-briefing">`;
    html += `<h3 class="obj-briefing-title">SHIFT BRIEFING — ${name}</h3>`;
    html += `<p class="obj-briefing-sub">Complete these objectives by end of shift:</p>`;

    const groups = [
      { label: 'PRIMARY OBJECTIVES', items: this.objectives.filter(o => o.priority === 'primary'), cls: 'obj-primary' },
      { label: 'SECONDARY', items: this.objectives.filter(o => o.priority === 'secondary'), cls: 'obj-secondary' },
      { label: 'BONUS', items: this.objectives.filter(o => o.priority === 'bonus'), cls: 'obj-bonus' }
    ];

    for (const group of groups) {
      if (group.items.length === 0) continue;
      html += `<div class="obj-group">`;
      html += `<span class="obj-group-label ${group.cls}">${group.label}</span>`;
      for (const obj of group.items) {
        html += `<div class="obj-item"><span class="obj-bullet ${group.cls}">&#9679;</span> ${obj.label}</div>`;
      }
      html += `</div>`;
    }

    html += `<button class="menu-btn obj-start-btn" id="obj-start-btn">BEGIN SHIFT</button>`;
    html += `</div>`;
    return html;
  }

  /**
   * Render the shift results (shown at shift end)
   */
  renderResults(earnings) {
    const grade = this.getGrade();
    const passed = this.objectives.filter(o => o.passed).length;
    const total = this.objectives.length;

    let html = `<div class="obj-results">`;
    html += `<h3 class="obj-results-title">SHIFT COMPLETE</h3>`;
    html += `<div class="obj-grade" style="color:${grade.color}">${grade.letter}</div>`;
    html += `<div class="obj-grade-label" style="color:${grade.color}">${grade.label}</div>`;

    // Stats row
    html += `<div class="obj-stats-row">`;
    html += `<div class="obj-stat"><span class="obj-stat-val" style="color:${earnings >= 0 ? '#4CAF50' : '#E04040'}">$${Math.round(earnings).toLocaleString()}</span><span class="obj-stat-label">EARNINGS</span></div>`;
    html += `<div class="obj-stat"><span class="obj-stat-val" style="color:${grade.color}">${passed}/${total}</span><span class="obj-stat-label">OBJECTIVES</span></div>`;
    html += `</div>`;

    html += `<div class="obj-checklist">`;
    for (const obj of this.objectives) {
      const icon = obj.passed ? '&#10003;' : '&#10007;';
      const cls = obj.passed ? 'obj-pass' : 'obj-fail';
      html += `<div class="obj-result-row ${cls}">
        <span class="obj-check-icon">${icon}</span>
        <span class="obj-check-label">${obj.label}</span>
      </div>`;
    }
    html += `</div>`;

    html += `<button class="menu-btn obj-done-btn" id="obj-done-btn">MAIN MENU</button>`;
    html += `</div>`;
    return html;
  }
}

window.Objectives = Objectives;
