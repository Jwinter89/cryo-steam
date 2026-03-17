/**
 * AlarmManager — Manages the alarm summary bar and alarm list popup.
 * Follows Honeywell Experion alarm presentation standards.
 */

class AlarmManager {
  constructor() {
    this.alarms = []; // Active alarms
    this.alarmHistory = []; // All alarms this shift

    this.barEl = document.getElementById('alarm-bar');
    this.countEl = document.getElementById('alarm-count');
    this.msgEl = document.getElementById('alarm-message');
    this.ackBtnEl = document.getElementById('alarm-ack-btn');
    this.listPopup = document.getElementById('alarm-list-popup');
    this.listEl = document.getElementById('alarm-list');

    this._bindEvents();
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
    if (this.listPopup.style.display === 'none') return;

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
      'FI-401': 'LIQUID FEED FLOW',
      'FI-402': 'PRODUCT FLOW',
      'AI-501': 'RVP'
    };
    return descs[tag] || tag;
  }

  _ackHighest() {
    const unacked = this.alarms.find(a => !a.acked);
    if (unacked) {
      unacked.acked = true;
      this._updateBar();
      this._updateList();
    }
  }

  _ackAlarm(tag) {
    const alarm = this.alarms.find(a => a.tag === tag);
    if (alarm) {
      alarm.acked = true;
      this._updateBar();
      this._updateList();
    }
  }

  _toggleAlarmList() {
    if (this.listPopup.style.display === 'none') {
      this.listPopup.style.display = 'flex';
      this._updateList();
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
