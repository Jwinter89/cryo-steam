/**
 * COLD CREEK — Gas Plant Simulator
 * Main entry point. Initializes all systems, manages screens and game state.
 *
 * "The plant tells you something is wrong before it goes wrong.
 *  The job is learning to listen."
 */

(function() {
  'use strict';

  // ============================================================
  // CONFIG MAP — facility name to config object
  // ============================================================

  const FACILITY_CONFIGS = {
    stabilizer: () => window.StabilizerConfig,
    refrigeration: () => window.RefrigerationConfig,
    cryogenic: () => window.CryogenicConfig
  };

  // Building tabs per facility
  const BUILDING_TABS = {
    stabilizer: [
      { id: 'stabilizer', label: 'STABILIZER' },
      { id: 'inlet', label: 'INLET SEP' },
      { id: 'hotoil', label: 'HOT OIL' },
      { id: 'compression', label: 'COMPRESSION' },
      { id: 'tanks', label: 'TANKS' },
      { id: 'gc', label: 'GC' }
    ],
    refrigeration: [
      { id: 'overview', label: 'OVERVIEW' },
      { id: 'inlet-comp', label: 'INLET COMP' },
      { id: 'teg', label: 'TEG DEHY' },
      { id: 'btex', label: 'BTEX' },
      { id: 'refrig', label: 'REFRIG' },
      { id: 'residue', label: 'RESIDUE' },
      { id: 'product', label: 'PRODUCT' }
    ],
    cryogenic: [
      { id: 'overview', label: 'OVERVIEW' },
      { id: 'molsieve', label: 'MOL SIEVE' },
      { id: 'coldbox', label: 'COLD BOX' },
      { id: 'expander', label: 'EXPANDER' },
      { id: 'demet', label: 'DEMET' },
      { id: 'residue', label: 'RESIDUE' },
      { id: 'product', label: 'PRODUCT' },
      { id: 'hotoil', label: 'HOT OIL' }
    ]
  };

  // Gauge section groupings per facility
  const GAUGE_GROUPS = {
    stabilizer: [
      { header: 'TEMPERATURES', tags: ['TIC-101', 'TIC-102', 'TIC-103', 'TIC-104', 'TIC-105'] },
      { header: 'PRESSURES', tags: ['PIC-201', 'PIC-202', 'PIC-203'] },
      { header: 'LEVELS & FLOWS', tags: ['LIC-301', 'LIC-302', 'FIC-401', 'FI-402', 'AI-501', 'LIC-303'] }
    ],
    refrigeration: [
      { header: 'INLET / COMP', tags: ['PIC-101', 'PIC-102', 'TIC-110', 'TIC-111'] },
      { header: 'TEG DEHYDRATION', tags: ['TIC-201', 'AI-201', 'FI-201', 'LIC-201'] },
      { header: 'BTEX / FUEL GAS', tags: ['XI-210', 'PIC-401', 'AI-401'] },
      { header: 'REFRIGERATION', tags: ['TIC-301', 'TIC-302', 'TIC-303'] },
      { header: 'PRODUCT / RECOVERY', tags: ['AI-502', 'AI-503', 'FI-501', 'AI-601'] }
    ],
    cryogenic: [
      { header: 'INLET / MOL SIEVE', tags: ['FI-100', 'PIC-100', 'TIC-100', 'TIC-201', 'TIC-202', 'TIC-203', 'AI-201'] },
      { header: 'COLD BOX', tags: ['TIC-301', 'TIC-302', 'TIC-303'] },
      { header: 'EXPANDER', tags: ['TIC-401', 'TIC-402', 'PIC-401', 'SI-401', 'FIC-401'] },
      { header: 'DEMETHANIZER', tags: ['TIC-501', 'TIC-502', 'TIC-503', 'TIC-504', 'TIC-505', 'PIC-501', 'LIC-501'] },
      { header: 'RESIDUE / PRODUCT', tags: ['PIC-601', 'PIC-602', 'AI-701', 'AI-702', 'AI-703', 'AI-704', 'LIC-701'] }
    ]
  };

  // Building-to-tags mapping for tab filtering
  // First tab in each facility shows ALL tags
  const BUILDING_TAGS = {
    stabilizer: {
      stabilizer: null, // first tab shows all
      inlet: ['PIC-201', 'LIC-303', 'TIC-101'],
      hotoil: ['TIC-104', 'TIC-105'],
      compression: ['PIC-202', 'PIC-203'],
      tanks: ['FIC-401', 'FI-402', 'AI-501']
    },
    refrigeration: {
      overview: null, // null = show all
      'inlet-comp': ['PIC-101', 'PIC-102', 'TIC-110', 'TIC-111'],
      teg: ['TIC-201', 'AI-201', 'FI-201', 'LIC-201'],
      btex: ['XI-210', 'PIC-401', 'AI-401'],
      refrig: ['TIC-301', 'TIC-302', 'TIC-303'],
      residue: ['AI-502', 'AI-503', 'FI-501'],
      product: ['AI-601']
    },
    cryogenic: {
      overview: null,
      molsieve: ['FI-100', 'PIC-100', 'TIC-100', 'TIC-201', 'TIC-202', 'TIC-203', 'AI-201'],
      coldbox: ['TIC-301', 'TIC-302', 'TIC-303'],
      expander: ['TIC-401', 'TIC-402', 'PIC-401', 'SI-401', 'FIC-401'],
      demet: ['TIC-501', 'TIC-502', 'TIC-503', 'TIC-504', 'TIC-505', 'PIC-501', 'LIC-501'],
      residue: ['PIC-601', 'PIC-602'],
      product: ['AI-701', 'AI-702', 'AI-703', 'AI-704', 'LIC-701'],
      hotoil: ['TIC-201', 'TIC-202', 'TIC-203']
    }
  };

  // ============================================================
  // GAME STATE
  // ============================================================

  const Game = {
    sim: null,
    eventSystem: null,
    pnlSystem: null,
    gaugeManager: null,
    faceplateManager: null,
    alarmManager: null,
    pidDiagram: null,
    learnMode: null,
    audioManager: null,
    kimrayWidget: null,
    multiPlantManager: null,
    eventActionPanel: null,
    fieldNotes: null,
    gcDisplay: null,

    currentScreen: 'title-screen',
    currentMode: null,    // learn, operate, crisis, optimize
    currentFacility: null, // stabilizer, refrigeration, cryogenic
    crisisScenario: null, // selected crisis scenario id

    valves: {},
    equipment: {},

    weather: {
      ambientTemp: 72,
      windDirection: 'SW',
      windSpeed: 8,
      precipitation: 'CLEAR'
    },

    progress: {},
    uiUpdateInterval: null,

    // ============================================================
    // INITIALIZATION
    // ============================================================

    init() {
      this.leaderboard = new Leaderboard();
      this._loadProgress();
      this._bindScreenNav();
      this._bindTimeControls();
      this._bindSettings();
      this._bindMobileControls();
      this._bindUsername();
      this._updateUnlockStates();
      this._updateContinueButton();
      this._showScreen('title-screen');
      this._refreshLeaderboard();
    },

    // ============================================================
    // SCREEN NAVIGATION
    // ============================================================

    _bindScreenNav() {
      // Title menu buttons
      document.querySelectorAll('.menu-btn[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          switch (btn.dataset.action) {
            case 'new-game':
              this._showScreen('mode-screen');
              break;
            case 'continue':
              this._continueGame();
              break;
            case 'settings':
              this._showScreen('settings-screen');
              break;
          }
        });
      });

      // Main menu button (from game screen)
      const mainMenuBtn = document.getElementById('btn-main-menu');
      if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', () => {
          if (this.sim && this.sim.running) {
            this.sim.pause();
            this._updateTimeButtons(0);
          }
          this.saveGameState();
          this._showScreen('title-screen');
          this._updateContinueButton();
        });
      }

      // Feedback Boys
      const feedbackBtn = document.getElementById('feedback-send');
      if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
          const text = document.getElementById('feedback-text').value.trim();
          const name = document.getElementById('feedback-name').value.trim();
          if (!text) return;
          const subject = encodeURIComponent('Cold Creek Feedback' + (name ? ' from ' + name : ''));
          const body = encodeURIComponent((name ? 'From: ' + name + '\n\n' : '') + text);
          window.open(`mailto:Josh.winter5276@gmail.com?subject=${subject}&body=${body}`, '_blank');
          // Show confirmation
          const box = document.querySelector('.feedback-box');
          const msg = document.createElement('p');
          msg.className = 'feedback-sent';
          msg.textContent = 'MAIL CLIENT OPENED — THANKS!';
          box.appendChild(msg);
          document.getElementById('feedback-text').value = '';
          document.getElementById('feedback-name').value = '';
          setTimeout(() => msg.remove(), 4000);
        });
      }

      // Back buttons
      document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this._showScreen(btn.dataset.screen);
        });
      });

      // Mode selection
      document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
        card.addEventListener('click', () => {
          if (card.classList.contains('locked')) return;
          this.currentMode = card.dataset.mode;
          if (this.currentMode === 'crisis') {
            this._populateCrisisScreen();
            this._showScreen('crisis-screen');
          } else {
            this._showScreen('facility-screen');
          }
        });
      });

      // Facility selection
      document.querySelectorAll('.mode-card[data-facility]').forEach(card => {
        card.addEventListener('click', () => {
          if (card.classList.contains('locked')) return;
          this.currentFacility = card.dataset.facility;
          this._startGame();
        });
      });

      // Alarm bar click opens alarm list
      const alarmBar = document.getElementById('alarm-bar');
      if (alarmBar) {
        alarmBar.addEventListener('click', () => {
          const popup = document.getElementById('alarm-list-popup');
          if (popup) popup.style.display = popup.style.display === 'none' ? '' : 'none';
        });
      }

      // Popup close buttons
      document.querySelectorAll('.popup-close').forEach(btn => {
        btn.addEventListener('click', () => {
          const popup = document.getElementById(btn.dataset.popup);
          if (popup) popup.style.display = 'none';
        });
      });

      // Field notes button
      const fnBtn = document.getElementById('btn-field-notes');
      if (fnBtn) {
        fnBtn.addEventListener('click', () => {
          this._showFieldNotesPopup();
        });
      }

      // Reset progress button
      const resetBtn = document.getElementById('btn-reset-progress');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Reset all progress? This cannot be undone.')) {
            localStorage.removeItem('coldcreek-progress');
            localStorage.removeItem('coldcreek-gamestate');
            localStorage.removeItem('coldcreek-fieldnotes');
            this.progress = {};
            this._updateUnlockStates();
            this._updateContinueButton();
          }
        });
      }
    },

    _bindMobileControls() {
      const toggle = document.getElementById('panel-toggle');
      const leftPanel = document.getElementById('left-panel');
      const backdrop = document.getElementById('faceplate-backdrop');

      if (toggle && leftPanel) {
        toggle.addEventListener('click', () => {
          leftPanel.classList.toggle('collapsed');
          toggle.textContent = leftPanel.classList.contains('collapsed') ? '\u2630' : '\u2715';
        });
      }

      // Backdrop closes faceplate on mobile
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          const fp = document.getElementById('faceplate');
          if (fp) fp.style.display = 'none';
          backdrop.style.display = 'none';
        });
      }
    },

    _showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const screen = document.getElementById(screenId);
      if (screen) screen.classList.add('active');
      this.currentScreen = screenId;

      // Refresh leaderboard when returning to title
      if (screenId === 'title-screen') {
        this._refreshLeaderboard();
      }
    },

    _updateContinueButton() {
      const btn = document.getElementById('btn-continue');
      if (btn) {
        btn.style.display = this.progress.hasGameState ? '' : 'none';
      }
    },

    // ============================================================
    // UNLOCK / PROGRESS
    // ============================================================

    _updateUnlockStates() {
      const p = this.progress;

      // Tier 1 complete = stabilizer operated for a full shift
      const tier1Done = p.stabilizerShiftsComplete >= 1;
      const tier2Done = p.refrigerationShiftsComplete >= 1;

      // Mode unlocks
      document.querySelectorAll('.mode-card[data-mode="crisis"]').forEach(c => {
        c.classList.toggle('locked', !tier1Done);
      });
      document.querySelectorAll('.mode-card[data-mode="optimize"]').forEach(c => {
        c.classList.toggle('locked', !tier1Done);
      });

      // Facility unlocks
      document.querySelectorAll('.mode-card[data-facility="refrigeration"]').forEach(c => {
        c.classList.toggle('locked', !tier1Done);
      });
      document.querySelectorAll('.mode-card[data-facility="cryogenic"]').forEach(c => {
        c.classList.toggle('locked', !tier2Done);
      });
    },

    // ============================================================
    // DYNAMIC GAUGE GENERATION
    // ============================================================

    _buildGaugeRows(facility, config) {
      const leftPanel = document.getElementById('left-panel');
      leftPanel.innerHTML = '';

      const groups = GAUGE_GROUPS[facility] || [];
      for (const group of groups) {
        const section = document.createElement('div');
        section.className = 'panel-section';

        const header = document.createElement('h4');
        header.className = 'section-header';
        header.textContent = group.header;
        section.appendChild(header);

        for (const tag of group.tags) {
          const pvDef = config.processVariables.find(pv => pv.tag === tag);
          if (!pvDef) continue;

          const row = document.createElement('div');
          row.className = 'gauge-row';
          row.id = 'g-' + tag.toLowerCase().replace(/[^a-z0-9]/g, '-');
          row.dataset.tag = tag;

          row.innerHTML = `
            <div class="gauge-tag-block">
              <span class="gauge-tag">${tag}</span>
              <span class="gauge-desc">${pvDef.desc}</span>
            </div>
            <div class="gauge-val-block">
              <span class="gauge-val">----</span>
              <span class="gauge-unit">${pvDef.unit}</span>
            </div>
            ${pvDef.controllable ? `<span class="gauge-mode">${pvDef.mode || 'AUTO'}</span>` : ''}
            <span class="gauge-trend">&#8594;</span>
          `;
          section.appendChild(row);
        }

        leftPanel.appendChild(section);
      }
    },

    // ============================================================
    // DYNAMIC BUILDING TABS
    // ============================================================

    _buildBuildingTabs(facility) {
      const tabBar = document.getElementById('building-tabs');
      tabBar.innerHTML = '';

      const tabs = BUILDING_TABS[facility] || [];
      this._activeBuilding = null;

      tabs.forEach((tab, i) => {
        const btn = document.createElement('button');
        btn.className = 'building-tab' + (i === 0 ? ' active' : '');
        btn.dataset.building = tab.id;
        btn.textContent = tab.label;
        btn.addEventListener('click', () => {
          const isMobile = window.innerWidth <= 768;

          if (isMobile) {
            // On mobile: toggle bottom sheet with gauges
            const wasActive = btn.classList.contains('active') && this._activeBuilding === tab.id;
            tabBar.querySelectorAll('.building-tab').forEach(t => t.classList.remove('active'));

            if (wasActive) {
              // Close bottom sheet
              this._closeGaugeSheet();
              this._activeBuilding = null;
            } else {
              btn.classList.add('active');
              this._activeBuilding = tab.id;
              this._openGaugeSheet(facility, tab.id, tab.label);
            }
          } else {
            // Desktop: filter left panel or show GC
            const wasActive = btn.classList.contains('active') && this._activeBuilding === tab.id;
            tabBar.querySelectorAll('.building-tab').forEach(t => t.classList.remove('active'));

            if (tab.id === 'gc') {
              if (wasActive) {
                this._closeDesktopGC();
                this._activeBuilding = null;
                const first = tabBar.querySelector('.building-tab');
                if (first) first.classList.add('active');
                this._filterGaugesByBuilding(facility, first?.dataset.building);
              } else {
                btn.classList.add('active');
                this._activeBuilding = tab.id;
                this._openDesktopGC();
              }
            } else {
              btn.classList.add('active');
              this._activeBuilding = tab.id;
              this._closeDesktopGC();
              this._filterGaugesByBuilding(facility, tab.id);
            }
          }
        });
        tabBar.appendChild(btn);
      });
    },

    _openGaugeSheet(facility, buildingId, label) {
      let sheet = document.getElementById('gauge-sheet');
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.id = 'gauge-sheet';
        sheet.className = 'gauge-sheet';
        document.getElementById('game-screen').insertBefore(
          sheet,
          document.getElementById('building-tabs')
        );
      }

      // GC tab — render chromatograph display
      if (buildingId === 'gc' && this.gcDisplay) {
        sheet.innerHTML = '';
        const closeBar = document.createElement('div');
        closeBar.className = 'gauge-sheet-header';
        closeBar.innerHTML = `<span class="gauge-sheet-title">${label}</span>
          <button class="gauge-sheet-close" id="gauge-sheet-close">&#x2715;</button>`;
        sheet.appendChild(closeBar);
        const gcBody = document.createElement('div');
        gcBody.className = 'gauge-sheet-body';
        sheet.appendChild(gcBody);
        this.gcDisplay.render(gcBody);
        sheet.classList.add('open');
        document.getElementById('gauge-sheet-close').addEventListener('click', () => {
          this._closeGaugeSheet();
          this._activeBuilding = null;
          document.querySelectorAll('.building-tab').forEach(t => t.classList.remove('active'));
          const first = document.querySelector('.building-tab');
          if (first) first.classList.add('active');
        });
        return;
      }

      const config = FACILITY_CONFIGS[facility] ? FACILITY_CONFIGS[facility]() : null;
      if (!config) return;

      const buildingTags = BUILDING_TAGS[facility] || {};
      const allowedTags = buildingTags[buildingId];
      const groups = GAUGE_GROUPS[facility] || [];

      let html = `<div class="gauge-sheet-header">
        <span class="gauge-sheet-title">${label}</span>
        <button class="gauge-sheet-close" id="gauge-sheet-close">&#x2715;</button>
      </div><div class="gauge-sheet-body">`;

      for (const group of groups) {
        const filteredTags = allowedTags
          ? group.tags.filter(t => allowedTags.includes(t))
          : group.tags;
        if (filteredTags.length === 0) continue;

        html += `<div class="gauge-sheet-section">${group.header}</div>`;
        for (const tag of filteredTags) {
          const pvDef = config.processVariables.find(pv => pv.tag === tag);
          if (!pvDef) continue;
          const livePV = this.sim ? this.sim.getPV(tag) : null;
          const val = livePV ? livePV.formatValue() : '----';
          const mode = (pvDef.controllable && livePV) ? livePV.mode : '';
          html += `<div class="gauge-sheet-row" data-tag="${tag}">
            <span class="gauge-sheet-tag">${tag}</span>
            <span class="gauge-sheet-val">${val}</span>
            <span class="gauge-sheet-unit">${pvDef.unit}</span>
            ${mode ? `<span class="gauge-sheet-mode">${mode}</span>` : ''}
          </div>`;
        }
      }
      html += '</div>';
      sheet.innerHTML = html;
      sheet.classList.add('open');

      // Bind close button
      document.getElementById('gauge-sheet-close').addEventListener('click', () => {
        this._closeGaugeSheet();
        this._activeBuilding = null;
        document.querySelectorAll('.building-tab').forEach(t => t.classList.remove('active'));
        const first = document.querySelector('.building-tab');
        if (first) first.classList.add('active');
      });

      // Bind row taps to open faceplate
      sheet.querySelectorAll('.gauge-sheet-row').forEach(row => {
        row.addEventListener('click', (e) => {
          const tag = row.dataset.tag;
          if (tag && this.faceplateManager) {
            this.faceplateManager.open(tag, e);
          }
        });
      });
    },

    _closeGaugeSheet() {
      const sheet = document.getElementById('gauge-sheet');
      if (sheet) sheet.classList.remove('open');
    },

    _updateGaugeSheet() {
      const sheet = document.getElementById('gauge-sheet');
      if (!sheet || !sheet.classList.contains('open') || !this.sim) return;

      sheet.querySelectorAll('.gauge-sheet-row').forEach(row => {
        const tag = row.dataset.tag;
        if (!tag) return;
        const pv = this.sim.getPV(tag);
        if (!pv) return;

        const valEl = row.querySelector('.gauge-sheet-val');
        if (valEl) valEl.textContent = pv.formatValue();

        const modeEl = row.querySelector('.gauge-sheet-mode');
        if (modeEl) modeEl.textContent = pv.mode;
      });
    },

    _openDesktopGC() {
      if (!this.gcDisplay) return;
      let panel = document.getElementById('gc-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'gc-panel';
        panel.className = 'gc-panel';
        document.getElementById('center-panel').appendChild(panel);
      }
      this.gcDisplay.render(panel);
      panel.style.display = 'block';
    },

    _closeDesktopGC() {
      const panel = document.getElementById('gc-panel');
      if (panel) panel.style.display = 'none';
    },

    _filterGaugesByBuilding(facility, buildingId) {
      const buildingTags = BUILDING_TAGS[facility] || {};
      const allowedTags = buildingTags[buildingId];
      const allRows = document.querySelectorAll('#left-panel .gauge-row');
      const allSections = document.querySelectorAll('#left-panel .panel-section');

      if (!allowedTags) {
        // null or first tab = show all
        allRows.forEach(r => r.style.display = '');
        allSections.forEach(s => s.style.display = '');
        return;
      }

      // Hide/show individual gauge rows
      allRows.forEach(row => {
        const tag = row.dataset.tag;
        row.style.display = allowedTags.includes(tag) ? '' : 'none';
      });

      // Hide sections where all gauges are hidden
      allSections.forEach(section => {
        const rows = section.querySelectorAll('.gauge-row');
        const anyVisible = Array.from(rows).some(r => r.style.display !== 'none');
        section.style.display = anyVisible ? '' : 'none';
      });
    },

    // ============================================================
    // DYNAMIC SPEC BOARD
    // ============================================================

    _buildSpecBoard(config) {
      const board = document.getElementById('spec-board');
      if (!board) return;
      board.innerHTML = '';

      const specs = config.specs || {};
      for (const [key, spec] of Object.entries(specs)) {
        const row = document.createElement('div');
        row.className = 'spec-row';
        row.id = 'spec-' + key;

        const label = key.replace(/([A-Z])/g, ' $1').toUpperCase().trim();
        const rangeStr = spec.min != null && spec.max != null
          ? `${spec.min} - ${spec.max}`
          : spec.max != null ? `< ${spec.max}` : `> ${spec.min}`;

        row.innerHTML = `
          <span class="spec-label">${label}</span>
          <span class="spec-val">----</span>
          <span class="spec-range">${rangeStr}</span>
          <span class="spec-status">----</span>
        `;
        board.appendChild(row);
      }
    },

    // ============================================================
    // P&ID SVG SWITCHING
    // ============================================================

    _loadFacilityPID(facility) {
      const svgEl = document.getElementById('pid-diagram');
      if (!svgEl) return;

      if (facility === 'stabilizer') {
        // Stabilizer SVG is the default in index.html — restore it if it was replaced
        if (this._stabilizerSVG) {
          svgEl.innerHTML = this._stabilizerSVG;
        }
        svgEl.setAttribute('viewBox', '0 0 800 500');
      } else if (facility === 'refrigeration' && window.FacilityViews) {
        // Save stabilizer SVG on first swap
        if (!this._stabilizerSVG) {
          this._stabilizerSVG = svgEl.innerHTML;
        }
        svgEl.innerHTML = FacilityViews.refrigerationPID();
        svgEl.setAttribute('viewBox', '0 0 900 600');
      } else if (facility === 'cryogenic' && window.FacilityViews) {
        if (!this._stabilizerSVG) {
          this._stabilizerSVG = svgEl.innerHTML;
        }
        svgEl.innerHTML = FacilityViews.cryogenicPID();
        svgEl.setAttribute('viewBox', '0 0 1000 700');
      }
    },

    // ============================================================
    // CRISIS SCREEN
    // ============================================================

    _populateCrisisScreen() {
      const list = document.getElementById('crisis-list');
      if (!list || !window.CrisisScenarios) return;
      list.innerHTML = '';

      const scenarios = CrisisScenarios.scenarios || [];
      for (const s of scenarios) {
        // Check if player has unlocked this tier
        const tierOk = s.tier <= 1 || (s.tier <= 2 && this.progress.stabilizerShiftsComplete >= 1)
          || (s.tier <= 3 && this.progress.refrigerationShiftsComplete >= 1);

        const card = document.createElement('div');
        card.className = 'crisis-card mode-card' + (tierOk ? '' : ' locked');
        card.innerHTML = `
          <div class="crisis-card-name">${s.name}</div>
          <div class="crisis-card-desc">${s.description}</div>
          <div class="crisis-card-meta">
            <span class="crisis-difficulty ${s.difficulty === 'LEGENDARY' ? 'legendary' : ''}">${s.difficulty}</span>
            <span>${s.facility.toUpperCase()}</span>
            <span>${s.timeLimit} MIN</span>
          </div>
        `;

        if (tierOk) {
          card.addEventListener('click', () => {
            this.crisisScenario = s.id;
            this.currentFacility = s.facility;
            this._startGame();
          });
        }

        list.appendChild(card);
      }
    },

    // ============================================================
    // GAME START
    // ============================================================

    _startGame() {
      // Clean up previous game if any
      if (this.sim) this.sim.destroy();

      this._showScreen('game-screen');

      const config = FACILITY_CONFIGS[this.currentFacility]
        ? FACILITY_CONFIGS[this.currentFacility]()
        : StabilizerConfig;

      // Update topbar labels
      document.getElementById('plant-name').textContent = config.name || 'PLANT';
      document.getElementById('game-mode-label').textContent =
        (this.currentMode || 'OPERATE').toUpperCase();

      // Build dynamic UI
      this._buildGaugeRows(this.currentFacility, config);
      this._buildBuildingTabs(this.currentFacility);
      this._buildSpecBoard(config);
      this._loadFacilityPID(this.currentFacility);

      // On small mobile, start with left panel collapsed
      if (window.innerWidth <= 480) {
        const lp = document.getElementById('left-panel');
        if (lp) lp.classList.add('collapsed');
      }

      // Initialize simulation
      this._initSimulation(config);

      // Initialize UI managers
      this.gaugeManager = new GaugeManager(this.sim);
      this.faceplateManager = new FaceplateManager(this.sim);
      this.alarmManager = new AlarmManager();
      this.pidDiagram = new PidDiagram(this.sim);

      // GC display
      if (window.GCDisplay) {
        this.gcDisplay = new GCDisplay(this.sim);
      }
      this.learnMode = new LearnMode(this);

      // Event action panel (interactive event resolution)
      if (window.EventActionPanel) {
        this.eventActionPanel = new EventActionPanel(this);
      }

      // Audio manager — init on first user interaction
      if (window.AudioManager && !this.audioManager) {
        this.audioManager = new AudioManager();
      }
      if (this.audioManager) {
        this.audioManager.init();
        this.audioManager.startAmbient();
      }

      // Kimray widget for refrigeration plant
      if (this.currentFacility === 'refrigeration' && window.KimrayWidget) {
        this.kimrayWidget = new KimrayWidget(this);
      } else {
        this.kimrayWidget = null;
      }

      // Multi-plant manager for cryogenic endgame
      if (this.currentFacility === 'cryogenic' && window.MultiPlantManager) {
        this.multiPlantManager = new MultiPlantManager();
      } else {
        this.multiPlantManager = null;
      }

      // Connect alarm callback
      this.sim.onAlarm = (report) => {
        this.alarmManager.onAlarmChange(report);
        if (this.audioManager && this.audioManager.alarmsEnabled) {
          if (report.newState === 'HIHI' || report.newState === 'LOLO') {
            this.audioManager.playAlarm('critical');
          } else if (report.newState === 'HI' || report.newState === 'LO') {
            this.audioManager.playAlarm('high');
          }
        }
      };

      // Connect event callbacks
      this.eventSystem.onEventStart = (event) => {
        this._onEventStart(event);
      };
      this.eventSystem.onEventEnd = (event) => {
        this._onEventEnd(event);
      };
      this.eventSystem.onRadioMessage = (msg) => {
        this._addRadioMessage(msg);
      };

      // Set up simulation tick callback
      this.sim.onTick = (dt, gameTime) => {
        this._onSimTick(dt, gameTime);
      };

      // Shift end tracking
      this.sim.onShiftEnd = () => {
        this._onShiftEnd();
      };

      // Initialize objectives
      if (window.Objectives) {
        this.objectives = new Objectives(this.currentFacility, this.currentMode);
      }

      // Start in appropriate mode
      if (this.currentMode === 'learn') {
        this.learnMode.start(1);
      } else if (this.currentMode === 'crisis' && this.crisisScenario) {
        this._startCrisisScenario();
      } else {
        // Operate/optimize mode — show briefing, start paused
        this.sim.pause();
        this._showObjectivesBriefing();
      }
    },

    _initSimulation(config) {
      // Create simulation tick system
      this.sim = new SimulationTick();

      // Register process variables from facility config
      for (const pvConfig of config.processVariables) {
        const pv = new ProcessVariable(pvConfig);
        this.sim.registerPV(pv);
      }

      // Also register amine PVs if amine DLC is active
      if (this.progress.amineDLC && window.AmineConfig) {
        for (const pvConfig of AmineConfig.processVariables) {
          const pv = new ProcessVariable(pvConfig);
          this.sim.registerPV(pv);
        }
      }

      // Set up cascade rules
      for (const rule of config.cascadeRules) {
        this.sim.cascadeEngine.addRule(rule);
      }
      if (this.progress.amineDLC && window.AmineConfig) {
        for (const rule of AmineConfig.cascadeRules) {
          this.sim.cascadeEngine.addRule(rule);
        }
      }

      // Initialize valves
      this.valves = {};
      if (config.valves) {
        for (const [id, v] of Object.entries(config.valves)) {
          this.valves[id] = { ...v };
        }
      }
      if (this.progress.amineDLC && window.AmineConfig && AmineConfig.valves) {
        for (const [id, v] of Object.entries(AmineConfig.valves)) {
          this.valves[id] = { ...v };
        }
      }

      // Initialize equipment
      this.equipment = {};
      if (config.equipment) {
        for (const [id, e] of Object.entries(config.equipment)) {
          this.equipment[id] = { ...e };
        }
      }
      if (this.progress.amineDLC && window.AmineConfig && AmineConfig.equipment) {
        for (const [id, e] of Object.entries(AmineConfig.equipment)) {
          this.equipment[id] = { ...e };
        }
      }

      // Weather
      this.weather = { ...(config.weather || { ambientTemp: 72, windDirection: 'SW', windSpeed: 8, precipitation: 'CLEAR' }) };

      // Set up event system
      this.eventSystem = new EventSystem();

      // Register events based on facility
      if (window.registerPigEvents) registerPigEvents(this.eventSystem);
      if (window.registerEquipmentEvents) registerEquipmentEvents(this.eventSystem);

      if (this.currentFacility === 'refrigeration' && window.registerRefrigerationEvents) {
        registerRefrigerationEvents(this.eventSystem);
      }
      if (this.currentFacility === 'cryogenic' && window.registerCryogenicEvents) {
        registerCryogenicEvents(this.eventSystem);
      }
      if (this.progress.amineDLC && window.registerAmineEvents) {
        registerAmineEvents(this.eventSystem);
      }

      this.sim.eventSystem = this.eventSystem;

      // Set up P&L system
      this.pnlSystem = new PnlManager({
        ...config.economics,
        specs: config.specs ? config.specs.rvp : { min: 9.0, max: 11.5 }
      });
      this.sim.pnlSystem = this.pnlSystem;

      // Time compression from settings
      const timeComp = document.getElementById('setting-timecomp');
      if (timeComp) {
        this.sim.timeCompression = parseInt(timeComp.value);
      }
    },

    // ============================================================
    // CRISIS SCENARIO START
    // ============================================================

    _startCrisisScenario() {
      if (!window.CrisisScenarios || !this.crisisScenario) return;
      const scenario = CrisisScenarios.scenarios.find(s => s.id === this.crisisScenario);
      if (!scenario) return;

      this._addRadioMessage(`CRISIS: ${scenario.name}`);
      this._addRadioMessage(scenario.description);

      // Schedule crisis events
      for (const evt of scenario.events) {
        this.eventSystem.scheduleEvent(evt.id, 360 + evt.delay);
      }

      // Start running at 1x
      this.sim.setSpeed(1);
      this._updateTimeButtons(1);
    },

    // ============================================================
    // SIMULATION TICK CALLBACK
    // ============================================================

    _onSimTick(dt, gameTime) {
      // Update time display
      document.getElementById('game-time').textContent = this.sim.getTimeString();
      document.getElementById('shift-label').textContent = this.sim.getShiftLabel();

      // Update UI every tick
      if (this.gaugeManager) this.gaugeManager.update();
      if (this.faceplateManager) this.faceplateManager.update();
      if (this.pidDiagram) this.pidDiagram.update();
      if (this.gcDisplay) this.gcDisplay.update();
      this._updateGaugeSheet();

      // Update spec board (facility-aware)
      this._updateSpecBoard();

      // Update event display
      this._updateEventDisplay();

      // Update weather display
      this._updateWeatherDisplay();

      // Kimray widget tick
      if (this.kimrayWidget && this.kimrayWidget.visible) {
        this.kimrayWidget.tick(dt);
      }

      // Check field note unlocks periodically
      if (window.FieldNotes && this.sim.totalTicks % 50 === 0) {
        this._checkFieldNoteUnlocks();
      }
    },

    // ============================================================
    // SPEC BOARD UPDATE (facility-aware)
    // ============================================================

    _updateSpecBoard() {
      const pvMap = this.sim.getAllPVs();
      const board = document.getElementById('spec-board');
      if (!board) return;

      const config = FACILITY_CONFIGS[this.currentFacility]
        ? FACILITY_CONFIGS[this.currentFacility]()
        : StabilizerConfig;

      const specs = config.specs || {};

      for (const [key, spec] of Object.entries(specs)) {
        const row = document.getElementById('spec-' + key);
        if (!row) continue;

        let val = null;
        const valEl = row.querySelector('.spec-val');
        const statusEl = row.querySelector('.spec-status');

        // Map spec keys to PV tags
        if (key === 'rvp') {
          const pv = pvMap['AI-501'] || pvMap['AI-704'];
          if (pv) val = pv.displayValue();
        } else if (key === 'residueBTU') {
          const pv = pvMap['AI-601'] || pvMap['AI-703'];
          if (pv) val = pv.displayValue();
          else {
            // Simulate BTU from overhead temp for stabilizer
            const oh = pvMap['TIC-103'];
            if (oh) val = 1010 + (oh.value - 125) * 0.2 + (Math.random() - 0.5) * 2;
          }
        } else if (key === 'moisture') {
          const pv = pvMap['AI-201'];
          if (pv) val = pv.displayValue();
        } else if (key === 'h2s') {
          const pv = pvMap['AI-A01'];
          if (pv) val = pv.displayValue();
        } else if (key === 'h2sOutlet') {
          const pv = pvMap['AI-A01'];
          if (pv) val = pv.displayValue();
        } else if (key === 'ethaneRecovery') {
          const pv = pvMap['AI-701'] || pvMap['AI-502'];
          if (pv) val = pv.displayValue();
        } else if (key === 'propaneRecovery') {
          const pv = pvMap['AI-702'] || pvMap['AI-503'];
          if (pv) val = pv.displayValue();
        } else if (key === 'amineStrength') {
          const pv = pvMap['AI-A04'];
          if (pv) val = pv.displayValue();
        } else if (key === 'corrosionRate') {
          const pv = pvMap['CI-A01'];
          if (pv) val = pv.displayValue();
        }

        if (val != null) {
          valEl.textContent = typeof val === 'number' ? (Math.abs(val) >= 100 ? Math.round(val) : val.toFixed(1)) : val;
          const inSpec = (spec.min == null || val >= spec.min) && (spec.max == null || val <= spec.max);
          row.className = 'spec-row ' + (inSpec ? 'in-spec' : 'off-spec');
          statusEl.textContent = inSpec ? 'OK' : 'BAD';
        }
      }

      // P&L spec board update from pnlSystem
      if (this.pnlSystem) {
        this.pnlSystem._updateUI();
      }
    },

    // ============================================================
    // TIME CONTROLS
    // ============================================================

    _bindTimeControls() {
      document.getElementById('btn-pause').addEventListener('click', () => {
        if (this.sim) this.sim.pause();
        this._updateTimeButtons(0);
      });
      document.getElementById('btn-1x').addEventListener('click', () => {
        if (this.sim) this.sim.setSpeed(1);
        this._updateTimeButtons(1);
      });
      document.getElementById('btn-2x').addEventListener('click', () => {
        if (this.sim) this.sim.setSpeed(2);
        this._updateTimeButtons(2);
      });
      document.getElementById('btn-4x').addEventListener('click', () => {
        if (this.sim) this.sim.setSpeed(4);
        this._updateTimeButtons(4);
      });
    },

    _updateTimeButtons(speed) {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      const labels = { 0: 'PAUSED', 1: '1X SPEED', 2: '2X SPEED', 4: '4X SPEED' };
      document.getElementById('time-speed-label').textContent = labels[speed] || '';

      if (speed === 0) document.getElementById('btn-pause').classList.add('active');
      else if (speed === 1) document.getElementById('btn-1x').classList.add('active');
      else if (speed === 2) document.getElementById('btn-2x').classList.add('active');
      else if (speed === 4) document.getElementById('btn-4x').classList.add('active');

      // Animate flow lines based on speed
      const flowClass = { 0: '', 1: 'flowing', 2: 'flowing-2x', 4: 'flowing-4x' };
      document.querySelectorAll('.flow-line').forEach(line => {
        line.classList.remove('flowing', 'flowing-2x', 'flowing-4x');
        if (speed > 0 && flowClass[speed]) {
          line.classList.add(flowClass[speed]);
        }
      });
    },

    // ============================================================
    // SETTINGS BINDINGS
    // ============================================================

    _bindSettings() {
      const timeComp = document.getElementById('setting-timecomp');
      if (timeComp) {
        timeComp.addEventListener('change', () => {
          if (this.sim) this.sim.timeCompression = parseInt(timeComp.value);
        });
      }

      const volumeSlider = document.getElementById('setting-volume');
      if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
          if (this.audioManager && this.audioManager.masterGain) {
            this.audioManager.masterGain.gain.value = parseInt(volumeSlider.value) / 100;
          }
        });
      }

      const soundToggle = document.getElementById('setting-sound');
      if (soundToggle) {
        soundToggle.addEventListener('change', () => {
          if (this.audioManager) this.audioManager.enabled = soundToggle.checked;
        });
      }

      const alarmSoundToggle = document.getElementById('setting-alarm-sound');
      if (alarmSoundToggle) {
        alarmSoundToggle.addEventListener('change', () => {
          if (this.audioManager) this.audioManager.alarmsEnabled = alarmSoundToggle.checked;
        });
      }

      const tipsToggle = document.getElementById('setting-tips');
      if (tipsToggle) {
        // Restore saved preference
        tipsToggle.checked = localStorage.getItem('coldcreek-tips') !== 'off';
        tipsToggle.addEventListener('change', () => {
          if (this.alarmManager) this.alarmManager.setTipsEnabled(tipsToggle.checked);
        });
      }
    },

    // ============================================================
    // EVENT HANDLING
    // ============================================================

    _onEventStart(event) {
      if (event.severity !== 'hidden' && event.severity !== 'info') {
        this.alarmManager.addEventAlarm(event.id, event.name, event.severity);
      }
      if (this.audioManager && event.severity === 'critical') {
        this.audioManager.playEffect('alarm-critical');
      }
      this._updateEventDisplay();
    },

    _onEventEnd(event) {
      this.alarmManager.removeEventAlarm(event.id);
      this._updateEventDisplay();
    },

    _updateEventDisplay() {
      if (!this.eventSystem) return;

      // Use event action panel if available
      if (this.eventActionPanel) {
        this.eventActionPanel.update(this.eventSystem.activeEvents, this.sim.getAllPVs());
        return;
      }

      // Fallback: simple text display
      const eventBlock = document.getElementById('event-status');
      const active = this.eventSystem.getActiveEventsSummary();
      if (active.length === 0) {
        eventBlock.innerHTML = '<span class="event-item">NO ACTIVE EVENTS</span>';
        return;
      }

      eventBlock.innerHTML = active.map(e => {
        const mins = Math.floor(e.elapsed);
        return `<span class="event-item active-event">${e.name} (${mins}m)</span>`;
      }).join('');
    },

    _addRadioMessage(msg) {
      const radioLog = document.getElementById('radio-log');
      const msgEl = document.createElement('span');
      msgEl.className = 'radio-msg new';
      msgEl.textContent = msg;
      radioLog.insertBefore(msgEl, radioLog.firstChild);

      // Play radio static
      if (this.audioManager) this.audioManager.playEffect('radio-static');

      setTimeout(() => msgEl.classList.remove('new'), 5000);

      while (radioLog.children.length > 10) {
        radioLog.removeChild(radioLog.lastChild);
      }
    },

    _updateWeatherDisplay() {
      document.getElementById('weather-temp').textContent = `${this.weather.ambientTemp} degF`;
      document.getElementById('weather-wind').textContent = `${this.weather.windDirection} ${this.weather.windSpeed} mph`;
      document.getElementById('weather-precip').textContent = this.weather.precipitation;
    },

    // ============================================================
    // USERNAME & LEADERBOARD
    // ============================================================

    _bindUsername() {
      const display = document.getElementById('username-display');
      const prompt = document.getElementById('username-prompt');
      const nameEl = document.getElementById('username-name');
      const input = document.getElementById('username-input');
      const saveBtn = document.getElementById('username-save');
      const editBtn = document.getElementById('username-edit');

      const showName = () => {
        const name = this.leaderboard.getUsername();
        if (name) {
          nameEl.textContent = name.toUpperCase();
          display.style.display = '';
          prompt.style.display = 'none';
        } else {
          display.style.display = 'none';
          prompt.style.display = '';
        }
      };

      saveBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (val) {
          this.leaderboard.setUsername(val);
          input.value = '';
          showName();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click();
      });

      editBtn.addEventListener('click', () => {
        input.value = this.leaderboard.getUsername();
        display.style.display = 'none';
        prompt.style.display = '';
        input.focus();
      });

      showName();
    },

    async _refreshLeaderboard() {
      const listEl = document.getElementById('leaderboard-list');
      if (!listEl) return;

      try {
        const scores = await this.leaderboard.getTopScores(10);
        if (scores.length === 0) {
          listEl.innerHTML = '<div class="leaderboard-empty">NO SCORES YET — COMPLETE A SHIFT!</div>';
          return;
        }

        const currentUser = this.leaderboard.getUsername().toUpperCase();
        listEl.innerHTML = scores.map((s, i) => {
          const rank = i + 1;
          const isSelf = s.username.toUpperCase() === currentUser && currentUser;
          const rankClass = rank <= 3 ? ` lb-rank-${rank}` : '';
          const selfClass = isSelf ? ' lb-self' : '';
          const earnings = s.earnings >= 0
            ? `$${s.earnings.toLocaleString()}`
            : `-$${Math.abs(s.earnings).toLocaleString()}`;
          const scoreClass = s.earnings < 0 ? ' negative' : '';
          const facility = (s.facility || '').toUpperCase();
          return `<div class="lb-row${selfClass}">
            <span class="lb-rank${rankClass}">${rank}</span>
            <span class="lb-name">${this._escapeHtml(s.username)}</span>
            <span class="lb-facility">${facility}</span>
            <span class="lb-score${scoreClass}">${earnings}</span>
          </div>`;
        }).join('');
      } catch (e) {
        listEl.innerHTML = '<div class="leaderboard-empty">COULD NOT LOAD SCORES</div>';
      }
    },

    _escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    // ============================================================
    // SHIFT END
    // ============================================================

    _onShiftEnd() {
      this.sim.pause();
      this._updateTimeButtons(0);

      const earnings = this.pnlSystem ? this.pnlSystem.shiftEarnings : 0;
      const facility = this.currentFacility;

      // Record shift completion
      const key = facility + 'ShiftsComplete';
      this.saveProgress({
        [key]: (this.progress[key] || 0) + 1,
        lastShiftEarnings: earnings,
        lastFacility: facility
      });

      this._updateUnlockStates();
      this._addRadioMessage(`SHIFT COMPLETE — Earnings: $${Math.round(earnings).toLocaleString()}`);

      // Submit to leaderboard
      if (this.leaderboard) {
        this.leaderboard.submitScore(facility, this.currentMode, earnings);
      }

      // Check for tier unlock messages
      if (facility === 'stabilizer' && this.progress.stabilizerShiftsComplete === 1) {
        this._addRadioMessage('TIER 2 UNLOCKED: Refrigeration Plant now available.');
      }
      if (facility === 'refrigeration' && this.progress.refrigerationShiftsComplete === 1) {
        this._addRadioMessage('TIER 3 UNLOCKED: Garden Creek Cryogenic now available.');
      }

      // Show shift results overlay
      this._showObjectivesResults(earnings);
    },

    _showObjectivesBriefing() {
      if (!this.objectives) return;
      const overlay = document.getElementById('objectives-overlay');
      if (!overlay) return;

      overlay.innerHTML = this.objectives.renderBriefing();
      overlay.style.display = 'flex';

      document.getElementById('obj-start-btn').addEventListener('click', () => {
        overlay.style.display = 'none';
      });
    },

    _showObjectivesResults(earnings) {
      if (!this.objectives) return;
      this.objectives.evaluate(this);
      const overlay = document.getElementById('objectives-overlay');
      if (!overlay) return;

      overlay.innerHTML = this.objectives.renderResults(earnings);
      overlay.style.display = 'flex';

      document.getElementById('obj-done-btn').addEventListener('click', () => {
        overlay.style.display = 'none';
        this._showScreen('title-screen');
        this._updateContinueButton();
      });
    },

    // ============================================================
    // FIELD NOTES
    // ============================================================

    _checkFieldNoteUnlocks() {
      if (!window.FieldNotes) return;
      const notes = FieldNotes.notes;
      const pvMap = this.sim.getAllPVs();
      let anyNew = false;

      for (const note of notes) {
        if (note.unlocked) continue;

        let unlock = false;
        switch (note.unlockCondition) {
          case 'survive-pig-no-alarm':
            // Unlocked if pig event ended without HiHi alarm on separator
            if (this.eventSystem && this.eventSystem.eventHistory.some(e => e.id.startsWith('pig-'))) {
              const sepPV = pvMap['LIC-302'];
              if (sepPV && sepPV.alarmState !== 'HIHI') unlock = true;
            }
            break;
          case 'hold-rvp-30min': {
            const rvp = pvMap['AI-501'];
            if (rvp && rvp.value >= 9.0 && rvp.value <= 11.5) {
              note._holdTimer = (note._holdTimer || 0) + 1;
              if (note._holdTimer > 150) unlock = true; // ~30 game-mins at 5 ticks/check
            } else {
              note._holdTimer = 0;
            }
            break;
          }
          case 'diagnose-hotoil-fault':
            if (this.eventSystem && this.eventSystem.eventHistory.some(e => e.id === 'hot-oil-fault')) {
              unlock = true;
            }
            break;
          case 'first-shift-complete':
            if (this.progress.stabilizerShiftsComplete >= 1) unlock = true;
            break;
          default:
            // Other unlock conditions checked on shift end or specific events
            break;
        }

        if (unlock) {
          note.unlocked = true;
          anyNew = true;
          this._addRadioMessage(`FIELD NOTE UNLOCKED: "${note.title}"`);
        }
      }

      if (anyNew) this._saveFieldNotes();
    },

    _saveFieldNotes() {
      if (!window.FieldNotes) return;
      try {
        const state = FieldNotes.notes.map(n => ({ id: n.id, unlocked: n.unlocked }));
        localStorage.setItem('coldcreek-fieldnotes', JSON.stringify(state));
      } catch (e) { /* storage unavailable */ }
    },

    _loadFieldNotes() {
      if (!window.FieldNotes) return;
      try {
        const data = localStorage.getItem('coldcreek-fieldnotes');
        if (data) {
          const state = JSON.parse(data);
          for (const s of state) {
            const note = FieldNotes.notes.find(n => n.id === s.id);
            if (note) note.unlocked = s.unlocked;
          }
        }
      } catch (e) { /* ok */ }
    },

    _showFieldNotesPopup() {
      if (!window.FieldNotes) return;
      this._loadFieldNotes();

      const list = document.getElementById('field-notes-list');
      if (!list) return;
      list.innerHTML = '';

      for (const note of FieldNotes.notes) {
        const card = document.createElement('div');
        card.className = 'field-note-card' + (note.unlocked ? '' : ' field-note-locked');
        card.innerHTML = `
          <div class="field-note-category">${note.category}</div>
          <div class="field-note-title">${note.unlocked ? note.title : '???'}</div>
          <div class="field-note-text">${note.unlocked ? note.text : 'Keep operating to unlock this note.'}</div>
        `;
        list.appendChild(card);
      }

      document.getElementById('field-notes-popup').style.display = '';
    },

    // ============================================================
    // SAVE / LOAD
    // ============================================================

    saveProgress(updates) {
      Object.assign(this.progress, updates);
      this.progress.hasGameState = true;
      try {
        localStorage.setItem('coldcreek-progress', JSON.stringify(this.progress));
      } catch (e) { /* Storage unavailable */ }
    },

    _loadProgress() {
      try {
        const data = localStorage.getItem('coldcreek-progress');
        if (data) {
          this.progress = JSON.parse(data);
        }
      } catch (e) {
        this.progress = {};
      }
      this._loadFieldNotes();
    },

    saveGameState() {
      if (!this.sim) return;
      try {
        const state = {
          sim: this.sim.toJSON(),
          events: this.eventSystem ? this.eventSystem.toJSON() : null,
          mode: this.currentMode,
          facility: this.currentFacility,
          valves: this.valves,
          weather: this.weather,
          pnl: {
            shiftEarnings: this.pnlSystem ? this.pnlSystem.shiftEarnings : 0
          }
        };
        localStorage.setItem('coldcreek-gamestate', JSON.stringify(state));
        this.saveProgress({ hasGameState: true });
      } catch (e) { /* Storage unavailable */ }
    },

    _continueGame() {
      try {
        const data = localStorage.getItem('coldcreek-gamestate');
        if (data) {
          const state = JSON.parse(data);
          this.currentMode = state.mode || 'operate';
          this.currentFacility = state.facility || 'stabilizer';
          this._startGame();

          // Restore state
          if (state.sim) this.sim.loadJSON(state.sim);
          if (state.valves) this.valves = state.valves;
          if (state.weather) this.weather = state.weather;
          if (state.pnl && this.pnlSystem) {
            this.pnlSystem.shiftEarnings = state.pnl.shiftEarnings || 0;
          }
        }
      } catch (e) {
        // No saved state — start fresh
        this.currentMode = 'operate';
        this.currentFacility = 'stabilizer';
        this._startGame();
      }
    },

    // ============================================================
    // CLEANUP
    // ============================================================

    destroy() {
      if (this.sim) this.sim.destroy();
      if (this.uiUpdateInterval) clearInterval(this.uiUpdateInterval);
      if (this.audioManager) this.audioManager.stopAll();
    }
  };

  // ============================================================
  // BOOT
  // ============================================================

  window.coldCreekGame = Game;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Game.init());
  } else {
    Game.init();
  }

  // Auto-save every 30 seconds
  setInterval(() => {
    if (Game.sim && Game.sim.speed > 0) {
      Game.saveGameState();
    }
  }, 30000);

  // Save on page unload
  window.addEventListener('beforeunload', () => {
    Game.saveGameState();
  });

})();
