/**
 * GaugeManager — Updates all gauge rows in the left panel with current PV data.
 * Handles alarm states, trend arrows, and sparkline mini-trends.
 */

class GaugeManager {
  constructor(sim) {
    this.sim = sim;
    this.gaugeElements = {};
    this._initGauges();
  }

  _initGauges() {
    const rows = document.querySelectorAll('.gauge-row');
    rows.forEach(row => {
      const tag = row.dataset.tag;
      if (!tag) return;
      this.gaugeElements[tag] = {
        row,
        valEl: row.querySelector('.gauge-val'),
        trendEl: row.querySelector('.gauge-trend'),
        modeEl: row.querySelector('.gauge-mode'),
        tagEl: row.querySelector('.gauge-tag'),
        descEl: row.querySelector('.gauge-desc'),
        unitEl: row.querySelector('.gauge-unit')
      };
    });
  }

  update() {
    for (const tag in this.gaugeElements) {
      const pv = this.sim.getPV(tag);
      if (!pv) continue;

      const el = this.gaugeElements[tag];

      // Update value
      el.valEl.textContent = pv.formatValue();

      // Update trend arrow
      const trend = pv.getTrendArrow();
      el.trendEl.textContent = trend.char;
      el.trendEl.className = 'gauge-trend' + (trend.cls ? ' ' + trend.cls : '');

      // Update mode badge
      if (el.modeEl && pv.controllable) {
        el.modeEl.textContent = pv.mode;
      }

      // Update alarm state on row
      el.row.className = 'gauge-row';
      switch (pv.alarmState) {
        case 'HIHI':
        case 'LOLO':
          el.row.classList.add(pv.alarmState === 'HIHI' ? 'alarm-hihi' : 'alarm-lolo');
          break;
        case 'HI':
          el.row.classList.add('alarm-hi');
          break;
        case 'LO':
          el.row.classList.add('alarm-lo');
          break;
      }
    }
  }

  /**
   * Get the element for a tag (for faceplate positioning)
   */
  getRowElement(tag) {
    return this.gaugeElements[tag] ? this.gaugeElements[tag].row : null;
  }
}

window.GaugeManager = GaugeManager;
