/**
 * MultiPlantManager — Three-plant simultaneous operation (endgame).
 * Each plant at a different phase. Split view or tabbed.
 * Each plant shows a condensed status card with pig status, key temps, P&L.
 */

class MultiPlantManager {
  constructor() {
    this.plants = [];
    this.activePlantIndex = 0;
    this.container = null;
    this.active = false;
    this._createUI();
  }

  _createUI() {
    this.container = document.createElement('div');
    this.container.id = 'multi-plant-bar';
    this.container.className = 'multi-plant-bar';
    this.container.style.display = 'none';
    this.container.innerHTML = `
      <div class="mp-header">THREE-PLANT OPERATION</div>
      <div id="mp-cards" class="mp-cards"></div>
    `;

    // Insert before building tabs
    const buildingTabs = document.getElementById('building-tabs');
    if (buildingTabs) {
      buildingTabs.parentNode.insertBefore(this.container, buildingTabs);
    }

    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
      .multi-plant-bar {
        background: var(--bg-deep);
        border-top: 1px solid var(--border);
        padding: 4px 8px;
        flex-shrink: 0;
      }
      .mp-header {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--text-unit);
        letter-spacing: 0.1em;
        margin-bottom: 4px;
      }
      .mp-cards {
        display: flex;
        gap: 6px;
      }
      .mp-card {
        flex: 1;
        background: var(--bg-card);
        border: 1px solid var(--border);
        padding: 4px 8px;
        cursor: pointer;
        transition: border-color 0.15s;
      }
      .mp-card.active {
        border-color: var(--text-label);
      }
      .mp-card:hover {
        border-color: var(--text-unit);
      }
      .mp-card-name {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--text-tag);
        margin-bottom: 2px;
      }
      .mp-card-stats {
        display: flex;
        gap: 8px;
        font-family: var(--font-mono);
        font-size: 10px;
      }
      .mp-stat {
        color: var(--text-unit);
      }
      .mp-stat-val {
        color: var(--text-normal);
      }
      .mp-card-pnl {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--text-normal);
        margin-top: 2px;
      }
      .mp-card-event {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--alarm-lo);
        margin-top: 1px;
      }
      .mp-card-event.clear {
        color: var(--text-unit);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Initialize three-plant mode
   * @param {Object[]} plantConfigs - Array of {name, sim, eventSystem, pnlSystem}
   */
  activate(plantConfigs) {
    this.plants = plantConfigs.map((pc, i) => ({
      name: pc.name,
      sim: pc.sim,
      eventSystem: pc.eventSystem,
      pnlSystem: pc.pnlSystem,
      index: i
    }));

    this.active = true;
    this.container.style.display = 'block';
    this._renderCards();
  }

  deactivate() {
    this.active = false;
    this.container.style.display = 'none';
    this.plants = [];
  }

  _renderCards() {
    const cardsEl = document.getElementById('mp-cards');
    cardsEl.innerHTML = '';

    this.plants.forEach((plant, i) => {
      const card = document.createElement('div');
      card.className = 'mp-card' + (i === this.activePlantIndex ? ' active' : '');
      card.innerHTML = `
        <div class="mp-card-name">${plant.name}</div>
        <div class="mp-card-stats">
          <span class="mp-stat">TEMP: <span class="mp-stat-val" id="mp-temp-${i}">----</span></span>
          <span class="mp-stat">LVL: <span class="mp-stat-val" id="mp-lvl-${i}">----</span></span>
        </div>
        <div class="mp-card-pnl" id="mp-pnl-${i}">$0/hr</div>
        <div class="mp-card-event clear" id="mp-evt-${i}">NO EVENTS</div>
      `;
      card.addEventListener('click', () => this._switchPlant(i));
      cardsEl.appendChild(card);
    });
  }

  _switchPlant(index) {
    this.activePlantIndex = index;
    // Update card highlights
    document.querySelectorAll('.mp-card').forEach((c, i) => {
      c.classList.toggle('active', i === index);
    });
    // Notify game to switch active plant view
    if (window.coldCreekGame && window.coldCreekGame.onPlantSwitch) {
      window.coldCreekGame.onPlantSwitch(index);
    }
  }

  /**
   * Update status cards each tick
   */
  update() {
    if (!this.active) return;

    this.plants.forEach((plant, i) => {
      // Key temp (first available temp PV)
      const pvMap = plant.sim.getAllPVs();
      const tempTags = ['TIC-303', 'TIC-301', 'TIC-102', 'TIC-201'];
      let keyTemp = '----';
      for (const tag of tempTags) {
        if (pvMap[tag]) {
          keyTemp = pvMap[tag].formatValue();
          break;
        }
      }
      const tempEl = document.getElementById(`mp-temp-${i}`);
      if (tempEl) tempEl.textContent = keyTemp;

      // Key level
      const lvlTags = ['LIC-301', 'LIC-501', 'LIC-302', 'LIC-201'];
      let keyLvl = '----';
      for (const tag of lvlTags) {
        if (pvMap[tag]) {
          keyLvl = pvMap[tag].formatValue() + '%';
          break;
        }
      }
      const lvlEl = document.getElementById(`mp-lvl-${i}`);
      if (lvlEl) lvlEl.textContent = keyLvl;

      // P&L
      const pnlEl = document.getElementById(`mp-pnl-${i}`);
      if (pnlEl && plant.pnlSystem) {
        const net = plant.pnlSystem.netPerHour;
        pnlEl.textContent = `$${Math.round(net).toLocaleString()}/hr`;
        pnlEl.style.color = net >= 0 ? 'var(--text-normal)' : 'var(--alarm-crit)';
      }

      // Active events
      const evtEl = document.getElementById(`mp-evt-${i}`);
      if (evtEl && plant.eventSystem) {
        const active = plant.eventSystem.getActiveEventsSummary();
        if (active.length > 0) {
          evtEl.textContent = active[0].name;
          evtEl.className = 'mp-card-event';
        } else {
          evtEl.textContent = 'NO EVENTS';
          evtEl.className = 'mp-card-event clear';
        }
      }
    });
  }
}

window.MultiPlantManager = MultiPlantManager;
