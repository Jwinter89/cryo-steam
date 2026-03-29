/**
 * AlarmManager — Manages the alarm summary bar and alarm list popup.
 * Follows Honeywell Experion alarm presentation standards.
 */

class AlarmManager {
  constructor() {
    this.alarms = []; // Active alarms
    this.alarmHistory = []; // All alarms this shift
    this.tipsEnabled = localStorage.getItem('coldcreek-tips') !== 'off';

    this.barEl = document.getElementById('alarm-bar');
    this.countEl = document.getElementById('alarm-count');
    this.msgEl = document.getElementById('alarm-message');
    this.ackBtnEl = document.getElementById('alarm-ack-btn');
    this.listPopup = document.getElementById('alarm-list-popup');
    this.listEl = document.getElementById('alarm-list');

    this._bindEvents();
  }

  setTipsEnabled(enabled) {
    this.tipsEnabled = enabled;
    localStorage.setItem('coldcreek-tips', enabled ? 'on' : 'off');
  }

  _bindEvents() {
    // Click alarm bar to open alarm list
    this.barEl.addEventListener('click', (e) => {
      if (e.target === this.ackBtnEl) return;
      this._toggleAlarmList();
    });

    // Acknowledge button
    this.ackBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this._ackHighest();
    });

    // Close alarm list popup
    const closeBtn = this.listPopup.querySelector('.popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.listPopup.style.display = 'none';
      });
    }
  }

  /**
   * Called when a PV alarm state changes
   */
  onAlarmChange(report) {
    const { tag, oldAlarm, newAlarm } = report;

    if (newAlarm !== 'NORMAL') {
      // Add or update alarm
      const existing = this.alarms.find(a => a.tag === tag);
      if (existing) {
        existing.state = newAlarm;
        existing.time = this._formatTime();
        existing.acked = false;
      } else {
        const alarm = {
          tag,
          state: newAlarm,
          time: this._formatTime(),
          acked: false,
          priority: this._getPriority(newAlarm)
        };
        this.alarms.push(alarm);
        this.alarmHistory.push({ ...alarm });
      }
    } else {
      // Return to normal — remove alarm
      const idx = this.alarms.findIndex(a => a.tag === tag);
      if (idx !== -1) {
        this.alarms.splice(idx, 1);
      }
    }

    // Sort by priority (highest first)
    this.alarms.sort((a, b) => a.priority - b.priority);

    this._updateBar();
    this._updateList();
  }

  _getPriority(state) {
    switch (state) {
      case 'HIHI': case 'LOLO': return 1;
      case 'HI': case 'LO': return 2;
      default: return 3;
    }
  }

  _formatTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  }

  _updateBar() {
    const unacked = this.alarms.filter(a => !a.acked).length;
    const total = this.alarms.length;

    this.barEl.classList.toggle('has-alarms', total > 0);
    this.barEl.classList.toggle('has-unacked', unacked > 0);

    this.countEl.textContent = total > 0 ? `${total} ALARM${total > 1 ? 'S' : ''}` : '0 ALARMS';

    if (total > 0) {
      const highest = this.alarms[0];
      this.msgEl.textContent = `${highest.tag}  ${highest.state} ALARM  |  ${highest.time}`;
      this.ackBtnEl.style.display = unacked > 0 ? '' : 'none';
    } else {
      this.msgEl.textContent = 'NO ACTIVE ALARMS';
      this.ackBtnEl.style.display = 'none';
    }
  }

  _updateList() {
    this._listDirty = true;
    if (this.listPopup.style.display === 'none') return;
    this._renderList();
  }

  _renderList() {
    this._listDirty = false;
    if (this.alarms.length === 0) {
      this.listEl.innerHTML = '<div class="alarm-empty">NO ALARMS</div>';
      return;
    }

    this.listEl.innerHTML = this.alarms.map(a => `
      <div class="alarm-entry ${a.acked ? '' : 'unacked'}">
        <span class="alarm-tag">${a.tag}</span>
        <span class="alarm-type ${a.priority <= 1 ? '' : a.state === 'HI' || a.state === 'LO' ? 'hi' : 'lo'}">${a.state}</span>
        <span class="alarm-desc">${this._getDesc(a.tag)}</span>
        <span class="alarm-time">${a.time}</span>
        ${!a.acked ? `<button class="alarm-ack-btn" data-tag="${a.tag}">ACK</button>` : ''}
      </div>
    `).join('');

    // Bind ack buttons
    this.listEl.querySelectorAll('.alarm-ack-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._ackAlarm(btn.dataset.tag);
      });
    });
  }

  _getDesc(tag) {
    const descs = {
      'TIC-101': 'INLET LIQ TEMP',
      'TIC-102': 'REBOILER TEMP',
      'TIC-103': 'TWR OVERHEAD TEMP',
      'TIC-104': 'HOT OIL SUPPLY',
      'TIC-105': 'COMP SUCTION TEMP',
      'PIC-201': 'TOWER PRESSURE',
      'PIC-202': 'COMP DISCHARGE',
      'PIC-203': 'TANK PRESSURE',
      'LIC-301': 'TOWER SUMP LEVEL',
      'LIC-302': 'SEPARATOR LEVEL',
      'LIC-303': 'PRODUCT TANK LEVEL',
      'FIC-401': 'LIQUID FEED FLOW',
      'FI-402': 'PRODUCT FLOW',
      'AI-501': 'RVP',
      'GC-C1': 'METHANE IN PRODUCT',
      'GC-C2': 'ETHANE IN PRODUCT',
      'GC-C3': 'PROPANE IN PRODUCT',
      'GC-C4': 'BUTANES IN PRODUCT',
      'GC-C5': 'PENTANES+ IN PRODUCT',

      // Refrigeration facility
      'PIC-101': 'INLET SUCTION PRESS',
      'PIC-102': 'DISCHARGE PRESS',
      'TIC-110': 'INLET GAS TEMP',
      'TIC-111': 'AFTERCOOL TEMP',
      'TIC-201': 'TEG REBOILER',
      'AI-201': 'OUTLET MOISTURE',
      'FI-201': 'GLYCOL CIRC RATE',
      'LIC-201': 'CONTACTOR LEVEL',
      'LIC-202': 'FLASH TANK LEVEL',
      'TIC-210': 'BTEX FIREBOX',
      'XI-210': 'BTEX PILOT STATUS',
      'PIC-401': 'FUEL GAS PRESS',
      'AI-401': 'FUEL GAS BTU',
      'TIC-301': 'REFRIG SUCTION TEMP',
      'TIC-302': 'CONDENSER TEMP',
      'TIC-303': 'CHILLER OUTLET',
      'AI-502': 'ETHANE RECOVERY',
      'AI-503': 'PROPANE RECOVERY',
      'FI-501': 'PRODUCT FLOW',
      'AI-601': 'PRODUCT C3 PURITY',
      'AI-602': 'H2S OUTLET',

      // Cryogenic facility
      'FI-100': 'INLET GAS FLOW',
      'PIC-100': 'INLET PRESSURE',
      'TIC-100': 'INLET GAS TEMP',
      'TIC-201': 'MOL SIEVE BED A',
      'TIC-202': 'MOL SIEVE BED B',
      'TIC-203': 'REGEN HEATER OUT',
      'AI-201': 'OUTLET MOISTURE',
      'TIC-301': 'GAS/GAS EXCHGR',
      'TIC-302': 'GAS/PRODUCT EXCHGR',
      'TIC-303': 'COLD SEPARATOR',
      'TIC-401': 'EXPANDER INLET',
      'TIC-402': 'EXPANDER OUTLET',
      'TIC-403': 'BEARING TEMP',
      'PIC-401': 'EXPANDER DELTA-P',
      'SI-401': 'EXPANDER SPEED',
      'FIC-401': 'INLET GUIDE VANE',
      'PIC-402': 'LUBE OIL PRESS',
      'TIC-501': 'DEMET OVERHEAD',
      'TIC-502': 'DEMET TRAY 20',
      'TIC-503': 'DEMET BOTTOM',
      'TIC-504': 'SIDE REBOILER',
      'TIC-505': 'BOTTOM REBOILER',
      'PIC-501': 'DEMET PRESSURE',
      'LIC-501': 'DEMET SUMP LEVEL',
      'PIC-601': 'RESIDUE DISCH PRESS',
      'PIC-602': 'RESIDUE SUCTION',
      'AI-701': 'ETHANE RECOVERY',
      'AI-702': 'PROPANE RECOVERY',
      'AI-703': 'PRODUCT C2 CONTENT',
      'AI-704': 'PRODUCT C3 PURITY',
      'LIC-701': 'PRODUCT TANK LEVEL',
      'AI-705': 'H2S OUTLET',
      'TIC-801': 'HOT OIL SUPPLY',
      'AI-801': 'FUEL GAS BTU',
      'TIC-901': 'REFRIG SUCTION',

      // Amine facility
      'FI-A01': 'LEAN AMINE FLOW',
      'TIC-A01': 'ABSORBER TEMP',
      'TIC-A02': 'RICH AMINE TEMP',
      'PIC-A01': 'ABSORBER PRESS',
      'LIC-A01': 'ABSORBER LEVEL',
      'AI-A01': 'OUTLET H2S',
      'AI-A02': 'ABSORBER AREA H2S',
      'AI-A03': 'REGEN AREA H2S',
      'TIC-A03': 'REGEN REBOILER',
      'TIC-A04': 'REGEN OVERHEAD',
      'PIC-A03': 'REGEN PRESSURE',
      'LIC-A02': 'FLASH DRUM LEVEL',
      'PIC-A02': 'FLASH DRUM PRESS',
      'LIC-A03': 'REGEN SUMP LEVEL',
      'LIC-A04': 'AMINE STORAGE',
      'AI-A04': 'AMINE STRENGTH',
      'AI-A05': 'AMINE pH',
      'CI-A01': 'CORROSION RATE'
    };
    return descs[tag] || tag;
  }

  _ackHighest() {
    const unacked = this.alarms.find(a => !a.acked);
    if (unacked) {
      unacked.acked = true;
      this._navigateToTag(unacked.tag, unacked.state);
      this._updateBar();
      this._updateList();
    }
  }

  _ackAlarm(tag) {
    const alarm = this.alarms.find(a => a.tag === tag);
    if (alarm) {
      alarm.acked = true;
      this._navigateToTag(tag, alarm.state);
      this._updateBar();
      this._updateList();
    }
  }

  _navigateToTag(tag, state) {
    // Open faceplate for the alarming tag
    const game = window.coldCreekGame;
    if (game && game.faceplateManager && !tag.startsWith('evt-')) {
      // Close alarm list popup so faceplate is visible
      this.listPopup.style.display = 'none';
      // Create a synthetic event at center of screen
      const fakeEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
      game.faceplateManager.open(tag, fakeEvent);
    }

    // Show contextual tip
    if (this.tipsEnabled) {
      this._showTip(tag, state);
    }
  }

  _showTip(tag, state) {
    const tip = this._getTip(tag, state);
    if (!tip) return;

    // Remove existing tip
    const existing = document.getElementById('alarm-tip');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'alarm-tip';
    el.className = 'alarm-tip';
    el.innerHTML = `
      <span class="alarm-tip-icon">&#x1F4A1;</span>
      <span class="alarm-tip-text">${tip}</span>
      <button class="alarm-tip-dismiss" id="alarm-tip-dismiss">&#x2715;</button>
      <button class="alarm-tip-off" id="alarm-tip-off">TURN OFF TIPS</button>
    `;
    document.getElementById('game-screen').appendChild(el);

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => el.remove(), 8000);

    document.getElementById('alarm-tip-dismiss').addEventListener('click', () => {
      clearTimeout(timer);
      el.remove();
    });

    document.getElementById('alarm-tip-off').addEventListener('click', () => {
      clearTimeout(timer);
      el.remove();
      this.setTipsEnabled(false);
    });
  }

  _getTip(tag, state) {
    const isHigh = state === 'HI' || state === 'HIHI';
    const tips = {
      'LIC-302': isHigh
        ? 'Separator level rising — ramp up FIC-401 SP to pull more liquid off. Consider pinching XV-101 if a pig is incoming.'
        : 'Separator level low — check inlet flow. Is XV-101 open? Feed may have dropped.',
      'LIC-301': isHigh
        ? 'Tower sump flooding — increase product flow via FV-201. Check reboiler temperature.'
        : 'Tower sump low — reduce product flow. Check if feed is reaching the tower.',
      'TIC-102': isHigh
        ? 'Reboiler too hot — reduce hot oil supply via TIC-104 SP or close TV-102. Risk of over-stripping.'
        : 'Reboiler too cold — increase TIC-104 SP. Product RVP will rise with insufficient heat.',
      'TIC-104': isHigh
        ? 'Hot oil supply too hot — reduce heater firing. Check H-100 status.'
        : 'Hot oil supply cold — check heater H-100. May have faulted. RVP will drift off-spec.',
      'PIC-201': isHigh
        ? 'Tower pressure high — check compressor C-100 status. Overhead may be backing up.'
        : 'Tower pressure low — check feed flow and reboiler. May be over-stripping.',
      'PIC-202': isHigh
        ? 'Compressor discharge high — check downstream restrictions.'
        : 'Compressor discharge low — compressor may have tripped. Check C-100.',
      'PIC-203': isHigh
        ? 'Tank pressure rising — RVP may be off-spec. Light ends in product. Check reboiler temp.'
        : null,
      'AI-501': isHigh
        ? 'RVP high — not enough light ends stripped. Increase reboiler temp (TIC-102 SP).'
        : 'RVP low — over-stripping. Reduce reboiler temp to save energy and product yield.',
      'FIC-401': isHigh
        ? 'Feed flow high — pig surge? Check separator level LIC-302. Manage with XV-101 pinch.'
        : 'Feed flow low — check inlet. XV-101 may be closed or pipeline issue.',
      'TIC-103': isHigh
        ? 'Tower overhead temp high — more light ends flashing overhead. Check reboiler.'
        : null,
      'TIC-105': isHigh
        ? 'Compressor suction hot — check overhead cooling.'
        : null,
      'LIC-303': isHigh
        ? 'Product tank near full — arrange truck loading or reduce product flow.'
        : 'Product tank low — normal if truck recently loaded.',
      'GC-C1': isHigh ? 'Methane in product high — increase reboiler temp to strip more lights.' : null,
      'GC-C2': isHigh ? 'Ethane in product high — increase reboiler temp.' : null,
      'GC-C3': isHigh ? 'Propane in product high — reboiler may be too cold.' : null,
    };
    return tips[tag] || null;
  }

  _toggleAlarmList() {
    if (this.listPopup.style.display === 'none') {
      this.listPopup.style.display = 'flex';
      if (this._listDirty) {
        this._renderList();
      }
    } else {
      this.listPopup.style.display = 'none';
    }
  }

  /**
   * Add an event-based alarm (non-PV alarm)
   */
  addEventAlarm(id, message, severity) {
    const alarm = {
      tag: id,
      state: severity === 'critical' ? 'HIHI' : severity === 'alarm' ? 'HI' : 'LO',
      time: this._formatTime(),
      acked: false,
      priority: severity === 'critical' ? 1 : severity === 'alarm' ? 2 : 3,
      eventAlarm: true,
      message
    };
    this.alarms.push(alarm);
    this.alarms.sort((a, b) => a.priority - b.priority);
    this._updateBar();
  }

  removeEventAlarm(id) {
    this.alarms = this.alarms.filter(a => !(a.tag === id && a.eventAlarm));
    this._updateBar();
    this._updateList();
  }

  reset() {
    this.alarms = [];
    this.alarmHistory = [];
    this._updateBar();
  }
}

window.AlarmManager = AlarmManager;
