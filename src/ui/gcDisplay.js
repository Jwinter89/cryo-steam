/**
 * GCDisplay — Gas Chromatograph live composition display.
 * Shows C1-C5+ mol% as a bar chart + table, updated each sim tick.
 */

class GCDisplay {
  constructor(sim) {
    this.sim = sim;
    this.gcTags = ['GC-C1', 'GC-C2', 'GC-C3', 'GC-C4', 'GC-C5'];
    this.labels = ['C1', 'C2', 'C3', 'C4', 'C5+'];
    this.colors = ['#4FC3F7', '#29B6F6', '#039BE5', '#0277BD', '#01579B'];
  }

  /**
   * Render GC into a container element (for bottom sheet or panel).
   * Returns the container for further manipulation.
   */
  render(container) {
    container.innerHTML = '';
    container.classList.add('gc-display');

    // Header
    const header = document.createElement('div');
    header.className = 'gc-header';
    header.innerHTML = `<span class="gc-title">GAS CHROMATOGRAPH</span>
      <span class="gc-stream">PRODUCT STREAM</span>
      <span class="gc-cycle" id="gc-cycle">CYCLE: 0s</span>`;
    container.appendChild(header);

    // Bar chart area
    const chart = document.createElement('div');
    chart.className = 'gc-chart';
    chart.id = 'gc-chart';

    for (let i = 0; i < this.gcTags.length; i++) {
      const col = document.createElement('div');
      col.className = 'gc-bar-col';

      const val = document.createElement('span');
      val.className = 'gc-bar-val';
      val.id = `gc-val-${i}`;
      val.textContent = '--';

      const barWrap = document.createElement('div');
      barWrap.className = 'gc-bar-wrap';

      const bar = document.createElement('div');
      bar.className = 'gc-bar';
      bar.id = `gc-bar-${i}`;
      bar.style.background = this.colors[i];
      bar.style.height = '0%';
      barWrap.appendChild(bar);

      const label = document.createElement('span');
      label.className = 'gc-bar-label';
      label.textContent = this.labels[i];

      col.appendChild(val);
      col.appendChild(barWrap);
      col.appendChild(label);
      chart.appendChild(col);
    }
    container.appendChild(chart);

    // Table with details
    const table = document.createElement('div');
    table.className = 'gc-table';
    table.id = 'gc-table';

    for (let i = 0; i < this.gcTags.length; i++) {
      const row = document.createElement('div');
      row.className = 'gc-table-row';
      row.id = `gc-row-${i}`;
      row.innerHTML = `
        <span class="gc-comp-name">${this.labels[i]}</span>
        <span class="gc-comp-full">${this._fullName(i)}</span>
        <span class="gc-comp-val" id="gc-tval-${i}">--</span>
        <span class="gc-comp-unit">mol%</span>
        <span class="gc-comp-status" id="gc-tstat-${i}">--</span>
      `;
      table.appendChild(row);
    }

    // Total row
    const totalRow = document.createElement('div');
    totalRow.className = 'gc-table-row gc-total-row';
    totalRow.innerHTML = `
      <span class="gc-comp-name">TOTAL</span>
      <span class="gc-comp-full"></span>
      <span class="gc-comp-val" id="gc-total">--</span>
      <span class="gc-comp-unit">mol%</span>
      <span class="gc-comp-status"></span>
    `;
    table.appendChild(totalRow);
    container.appendChild(table);

    this._cycleTime = 0;
    this.update();
  }

  update() {
    if (!this.sim) return;
    let total = 0;

    for (let i = 0; i < this.gcTags.length; i++) {
      const pv = this.sim.getPV(this.gcTags[i]);
      if (!pv) continue;

      const val = pv.displayValue();
      total += val;

      // Bar
      const bar = document.getElementById(`gc-bar-${i}`);
      if (bar) {
        // Scale: C5+ can be 70%+, so use log-ish scale for visibility
        const maxH = Math.min(100, val * 1.3);
        bar.style.height = maxH + '%';
      }

      // Bar value label
      const valEl = document.getElementById(`gc-val-${i}`);
      if (valEl) valEl.textContent = val.toFixed(1);

      // Table value
      const tval = document.getElementById(`gc-tval-${i}`);
      if (tval) tval.textContent = val.toFixed(2);

      // Status
      const tstat = document.getElementById(`gc-tstat-${i}`);
      if (tstat) {
        if (pv.alarmState === 'HIHI' || pv.alarmState === 'LOLO') {
          tstat.textContent = 'ALARM';
          tstat.className = 'gc-comp-status gc-alarm';
        } else if (pv.alarmState === 'HI' || pv.alarmState === 'LO') {
          tstat.textContent = 'WARN';
          tstat.className = 'gc-comp-status gc-warn';
        } else {
          tstat.textContent = 'OK';
          tstat.className = 'gc-comp-status gc-ok';
        }
      }
    }

    // Total
    const totalEl = document.getElementById('gc-total');
    if (totalEl) totalEl.textContent = total.toFixed(1);

    // Cycle timer (GC typically cycles every 4-6 minutes)
    this._cycleTime = (this._cycleTime || 0) + 1;
    const cycleSec = this._cycleTime % 360;
    const cycleEl = document.getElementById('gc-cycle');
    if (cycleEl) {
      cycleEl.textContent = `CYCLE: ${Math.floor(cycleSec / 60)}m ${cycleSec % 60}s`;
    }
  }

  _fullName(i) {
    const names = ['METHANE', 'ETHANE', 'PROPANE', 'BUTANES', 'PENTANES+'];
    return names[i] || '';
  }
}

window.GCDisplay = GCDisplay;
