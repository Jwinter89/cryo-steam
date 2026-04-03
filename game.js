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
      { id: 'amine', label: 'AMINE' },
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
      { header: 'TEG DEHYDRATION', tags: ['TIC-201', 'AI-201', 'FI-201', 'LIC-201', 'LIC-202', 'LIC-203'] },
      { header: 'BTEX / FUEL GAS', tags: ['XI-210', 'TIC-210', 'PIC-401', 'AI-401'] },
      { header: 'REFRIGERATION', tags: ['TIC-301', 'TIC-302', 'TIC-303', 'PIC-301'] },
      { header: 'PRODUCT / RECOVERY', tags: ['AI-501', 'AI-502', 'AI-503', 'FI-501', 'AI-601', 'AI-602', 'LIC-501'] },
      { header: 'RESIDUE', tags: ['PIC-501', 'TIC-501'] }
    ],
    cryogenic: [
      { header: 'INLET / MOL SIEVE', tags: ['FI-100', 'PIC-100', 'TIC-100', 'TIC-201', 'TIC-202', 'TIC-203', 'AI-201'] },
      { header: 'AMINE / H2S', tags: ['FI-A01', 'TIC-A01', 'TIC-A02', 'PIC-A01', 'LIC-A01', 'AI-A01', 'AI-A02', 'AI-A03', 'TIC-A03', 'LIC-A03', 'AI-A04', 'AI-A05', 'CI-A01', 'TIC-A04', 'PIC-A03', 'LIC-A02', 'PIC-A02', 'LIC-A04'] },
      { header: 'COLD BOX', tags: ['TIC-301', 'TIC-302', 'TIC-303'] },
      { header: 'EXPANDER', tags: ['TIC-401', 'TIC-402', 'PIC-401', 'SI-401', 'FIC-401', 'TIC-403', 'PIC-402', 'VI-401'] },
      { header: 'DEMETHANIZER', tags: ['TIC-501', 'TIC-502', 'TIC-503', 'TIC-504', 'TIC-505', 'PIC-501', 'PDI-501', 'LIC-501'] },
      { header: 'RESIDUE / PRODUCT', tags: ['PIC-601', 'PIC-602', 'TIC-601', 'TIC-602', 'TIC-603', 'AI-701', 'AI-702', 'AI-703', 'AI-704', 'AI-705', 'LIC-701'] },
      { header: 'UTILITIES', tags: ['TIC-801', 'TIC-901', 'AI-801'] }
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
      tanks: ['FIC-401', 'FI-402', 'AI-501'],
      gc: ['GC-C1', 'GC-C2', 'GC-C3', 'GC-C4', 'GC-C5']
    },
    refrigeration: {
      overview: null, // null = show all
      'inlet-comp': ['PIC-101', 'PIC-102', 'TIC-110', 'TIC-111'],
      teg: ['TIC-201', 'AI-201', 'FI-201', 'LIC-201', 'LIC-202', 'LIC-203'],
      btex: ['XI-210', 'TIC-210', 'PIC-401', 'AI-401'],
      refrig: ['TIC-301', 'TIC-302', 'TIC-303', 'PIC-301'],
      residue: ['PIC-501', 'TIC-501', 'AI-502', 'AI-503', 'FI-501'],
      product: ['AI-501', 'AI-601', 'AI-602', 'LIC-501']
    },
    cryogenic: {
      overview: null,
      molsieve: ['FI-100', 'PIC-100', 'TIC-100', 'TIC-201', 'TIC-202', 'TIC-203', 'AI-201'],
      amine: ['FI-A01', 'TIC-A01', 'TIC-A02', 'PIC-A01', 'LIC-A01', 'AI-A01', 'AI-A02', 'AI-A03', 'TIC-A03', 'TIC-A04', 'PIC-A03', 'LIC-A03', 'LIC-A02', 'PIC-A02', 'AI-A04', 'AI-A05', 'CI-A01', 'LIC-A04'],
      coldbox: ['TIC-301', 'TIC-302', 'TIC-303'],
      expander: ['TIC-401', 'TIC-402', 'PIC-401', 'SI-401', 'FIC-401', 'TIC-403', 'PIC-402', 'VI-401'],
      demet: ['TIC-501', 'TIC-502', 'TIC-503', 'TIC-504', 'TIC-505', 'PIC-501', 'PDI-501', 'LIC-501'],
      residue: ['PIC-601', 'PIC-602', 'TIC-601', 'TIC-602', 'TIC-603', 'AI-705'],
      product: ['AI-701', 'AI-702', 'AI-703', 'AI-704', 'LIC-701', 'AI-801'],
      hotoil: ['TIC-801']
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
    fieldNotes: null, // initialized via window.FieldNotes
    gcDisplay: null,
    henry: null,

    // New systems
    achievements: null,
    career: null,
    operatorProfile: null,
    challenges: null,
    debriefScreen: null,
    glossary: null,
    colorBlindMode: null,
    pidZoom: null,

    // Shift tracking flags for achievements
    _rvpInSpecEntireShift: true,
    _noBtexPenalties: true,
    _expanderTamed: false,
    _highRecoveryEntireShift: true,
    _crisisRecoveryTime: null,
    _compRecoveredUnder8Min: false,
    _truckLoadsClean: 0,
    _molsieveCycleComplete: false,
    _compTripStartTime: null,
    _shiftAchievements: [],
    _shiftChallenges: [],

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

    // ============================================================
    // INITIALIZATION
    // ============================================================

    init() {
      try { this.leaderboard = new Leaderboard(); } catch (e) { console.error('Leaderboard init failed', e); this.leaderboard = { hasUsername() { return false; }, getUsername() { return ''; }, setUsername() {}, submitScore() {}, getTopScores() { return Promise.resolve([]); } }; }
      this._loadProgress();
      this._bindScreenNav();
      this._bindTimeControls();
      this._bindSettings();
      this._bindUsername();
      this._updateUnlockStates();
      this._updateContinueButton();
      this._updateLandingPage();
      this._showScreen('title-screen');
      this._refreshLeaderboard();
      this._bindLeaderboardFilters();
      this._updateChallengesPreview();
      this._initHenry();
      this._checkBuildingTabOverflow();
      window.addEventListener('resize', () => this._checkBuildingTabOverflow());
      const tabBar = document.getElementById('building-tabs');
      if (tabBar) tabBar.addEventListener('scroll', () => this._checkBuildingTabOverflow());

      // Initialize new systems
      if (window.Achievements) this.achievements = new Achievements();
      if (window.CareerProgression) this.career = new CareerProgression();
      if (window.OperatorProfile) this.operatorProfile = new OperatorProfile(this.achievements, this.career);
      if (window.Challenges) this.challenges = new Challenges();
      if (window.DebriefScreen) this.debriefScreen = new DebriefScreen();
      if (window.Glossary) this.glossary = new Glossary();
      if (window.ColorBlindMode) {
        this.colorBlindMode = new ColorBlindMode();
        // Restore saved setting
        const cbSelect = document.getElementById('setting-colorblind');
        if (cbSelect) {
          cbSelect.value = this.colorBlindMode.getMode();
        }
      }

      // Daily login streak
      this._checkStreak();

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
            case 'quick-start':
              this._quickStart();
              break;
            case 'start-training':
              this.currentMode = 'learn';
              this.currentFacility = 'stabilizer';
              this._startGame();
              break;
            case 'leaderboard':
              this._refreshLeaderboard();
              this._showScreen('leaderboard-screen');
              break;
            case 'profile':
              this._showProfileScreen();
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
          if (this.sim && this.sim.speed > 0) {
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
          window.open(`mailto:hello@winterhowlers.com?subject=${subject}&body=${body}`, '_blank');
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

      // Escape key — go back from menu screens
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        // Dismiss confirm dialog if open
        const confirmOverlay = document.getElementById('confirm-overlay');
        if (confirmOverlay && confirmOverlay.style.display !== 'none') {
          confirmOverlay.style.display = 'none';
          return;
        }

        const backScreens = ['leaderboard-screen', 'settings-screen', 'profile-screen', 'mode-screen', 'facility-screen', 'crisis-screen'];
        if (backScreens.includes(this.currentScreen)) {
          const backBtn = document.querySelector(`#${this.currentScreen} .back-btn`);
          if (backBtn) this._showScreen(backBtn.dataset.screen);
        }

        // In-game: Escape toggles pause menu
        if (this.currentScreen === 'game-screen' && this.sim) {
          const pauseMenu = document.getElementById('pause-menu');
          if (this.sim.speed > 0) {
            this._lastSpeedBeforePause = this.sim.speed;
            this.sim.pause();
            this._updateTimeButtons(0);
            if (pauseMenu) this._showPauseMenu();
          } else {
            if (pauseMenu) this._hidePauseMenu();
            const resumeSpeed = this._lastSpeedBeforePause || 1;
            this.sim.setSpeed(resumeSpeed);
            this._updateTimeButtons(resumeSpeed);
          }
        }
      });

      // Mode selection
      document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
        const activate = () => {
          this.currentMode = card.dataset.mode;
          if (this.currentMode === 'crisis') {
            this._populateCrisisScreen();
            this._showScreen('crisis-screen');
          } else {
            this._showScreen('facility-screen');
          }
        };
        card.addEventListener('click', activate);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
        });
      });

      // Facility selection
      document.querySelectorAll('.mode-card[data-facility]').forEach(card => {
        const activate = () => {
          if (card.classList.contains('facility-locked')) return;
          this.currentFacility = card.dataset.facility;
          this._startGame();
        };
        card.addEventListener('click', activate);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
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
          this._showConfirm('Reset all progress? This cannot be undone.', () => {
            localStorage.removeItem('coldcreek-progress');
            localStorage.removeItem('coldcreek-gamestate');
            localStorage.removeItem('coldcreek-fieldnotes');
            localStorage.removeItem('coldcreek-achievements');
            localStorage.removeItem('coldcreek-career');
            localStorage.removeItem('coldcreek-profile-stats');
            localStorage.removeItem('coldcreek-challenges');
            this.progress = {};
            if (this.achievements) this.achievements.reset();
            if (this.career) this.career.reset();
            if (this.operatorProfile) this.operatorProfile.reset();
            if (this.challenges) this.challenges.reset();
            this._updateUnlockStates();
            this._updateContinueButton();
          });
        });
      }
    },

    _getShiftTarget() {
      // Shift target based on facility
      const targets = { stabilizer: 12000, refrigeration: 18000, cryogenic: 25000 };
      return targets[this.currentFacility] || 12000;
    },

    _showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const screen = document.getElementById(screenId);
      if (screen) screen.classList.add('active');
      this.currentScreen = screenId;

      // Start tagline rotation on title screen
      if (screenId === 'title-screen') {
        this._startTaglineRotation();
      } else {
        this._stopTaglineRotation();
      }

      // Refresh landing page when returning to title
      if (screenId === 'title-screen') {
        this._refreshLeaderboard();
        this._updateContinueButton();
        this._updateLandingPage();
        this._updateChallengesPreview();
      }

      // Update facility lock states when entering facility selection
      if (screenId === 'facility-screen') {
        this._updateUnlockStates();
      }
    },

    _showConfirm(message, onConfirm) {
      let overlay = document.getElementById('confirm-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999';
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--bg-card,#1a1a2e);border:1px solid var(--border,#333);padding:20px 24px;max-width:360px;font-family:var(--font-mono,monospace);color:var(--text-normal,#ccc);text-align:center';
        box.innerHTML = `
          <div id="confirm-msg" style="font-size:12px;margin-bottom:16px"></div>
          <div style="display:flex;gap:12px;justify-content:center">
            <button id="confirm-yes" style="font-family:var(--font-mono,monospace);font-size:11px;padding:6px 16px;min-height:28px;background:var(--alarm-crit,#c0392b);color:#fff;border:none;cursor:pointer">CONFIRM</button>
            <button id="confirm-no" style="font-family:var(--font-mono,monospace);font-size:11px;padding:6px 16px;min-height:28px;background:var(--bg-input,#222);color:var(--text-label,#aaa);border:1px solid var(--border,#333);cursor:pointer">CANCEL</button>
          </div>`;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'flex';
      document.getElementById('confirm-msg').textContent = message;
      const cleanup = () => { overlay.style.display = 'none'; };
      document.getElementById('confirm-yes').onclick = () => { cleanup(); onConfirm(); };
      document.getElementById('confirm-no').onclick = cleanup;
    },

    _updateContinueButton() {
      const btn = document.getElementById('btn-continue');
      if (btn) {
        btn.style.display = this.progress.hasGameState ? '' : 'none';
      }
    },

    // ============================================================
    // LANDING PAGE — QUICK START / NEW USER / STREAK
    // ============================================================

    _updateLandingPage() {
      const facilityNames = { stabilizer: 'STABILIZER', refrigeration: 'REFRIGERATION', cryogenic: 'CRYOGENIC' };
      const modeNames = { learn: 'LEARN', operate: 'OPERATE', crisis: 'CRISIS', optimize: 'OPTIMIZE' };

      const isReturningUser = this.progress.hasGameState ||
        this.progress.stabilizerShiftsComplete > 0 ||
        this.progress.refrigerationShiftsComplete > 0 ||
        this.progress.cryogenicShiftsComplete > 0;

      const quickStartEl = document.getElementById('quick-start');
      const newUserEl = document.getElementById('new-user-cta');
      const streakEl = document.getElementById('streak-badge');

      if (isReturningUser) {
        // Show quick-start with last played facility/mode
        if (quickStartEl) {
          const lastFacility = this.progress.lastFacility || 'stabilizer';
          const lastMode = this.progress.lastMode || 'operate';
          const detail = document.getElementById('qs-detail');
          if (detail) detail.textContent = (facilityNames[lastFacility] || 'STABILIZER') + ' \u2014 ' + (modeNames[lastMode] || 'OPERATE');
          quickStartEl.style.display = '';
        }
        if (newUserEl) newUserEl.style.display = 'none';
      } else {
        // First-time user — show prominent training CTA
        if (newUserEl) newUserEl.style.display = '';
        if (quickStartEl) quickStartEl.style.display = 'none';
      }

      // Streak badge
      const streak = parseInt(localStorage.getItem('coldcreek-streak') || '0', 10);
      if (streakEl && streak > 1) {
        document.getElementById('streak-count').textContent = streak;
        streakEl.style.display = '';
      }
    },

    _quickStart() {
      const lastFacility = this.progress.lastFacility || 'stabilizer';
      const lastMode = this.progress.lastMode || 'operate';

      // If there's a saved game for this facility+mode, continue it
      if (this.progress.hasGameState) {
        try {
          const data = localStorage.getItem('coldcreek-gamestate');
          if (data) {
            const state = JSON.parse(data);
            if (state.facility === lastFacility) {
              this._continueGame();
              return;
            }
          }
        } catch (e) { /* fall through to new game */ }
      }

      this.currentMode = lastMode;
      this.currentFacility = lastFacility;
      this._startGame();
    },

    // ============================================================
    // UNLOCK / PROGRESS
    // ============================================================

    _updateUnlockStates() {
      const cards = document.querySelectorAll('.mode-card[data-facility]');
      cards.forEach(card => {
        const facility = card.dataset.facility;
        let locked = false;

        if (facility === 'refrigeration') {
          locked = !(this.progress.stabilizerShiftsComplete >= 1);
        } else if (facility === 'cryogenic') {
          locked = !(this.progress.refrigerationShiftsComplete >= 1);
        }

        if (locked) {
          card.classList.add('facility-locked');
          card.setAttribute('aria-disabled', 'true');
          if (!card.querySelector('.lock-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'lock-overlay';
            overlay.innerHTML = facility === 'refrigeration'
              ? '&#128274; Complete 1 Stabilizer shift to unlock'
              : '&#128274; Complete 1 Refrigeration shift to unlock';
            card.appendChild(overlay);
          }
        } else {
          card.classList.remove('facility-locked');
          card.removeAttribute('aria-disabled');
          const overlay = card.querySelector('.lock-overlay');
          if (overlay) overlay.remove();
        }
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
            <div class="gauge-bar-wrap">
              <div class="gauge-bar-fill"></div>
              <div class="gauge-bar-sp"></div>
            </div>
            <div class="gauge-val-block">
              <span class="gauge-val">----</span>
              <span class="gauge-unit">${pvDef.unit}</span>
            </div>
            ${pvDef.controllable ? `<span class="gauge-mode">${pvDef.mode || 'AUTO'}</span>` : ''}
            <span class="gauge-trend">&#8594;</span>
          `;

          // Double-click gauge tag to add to trend graph
          const tagEl = row.querySelector('.gauge-tag');
          if (tagEl) {
            tagEl.style.cursor = 'pointer';
            tagEl.title = 'Double-click to track in trend graph';
            tagEl.addEventListener('dblclick', (e) => {
              e.stopPropagation();
              if (this.trendManager) {
                this.trendManager.trackTag(tag);
                if (!this.trendManager._visible) this.trendManager.show();
                this.showToast(tag, 'Added to trend graph', 'TREND');
              }
            });
          }

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

      // Mobile building pills removed — Steam desktop only
    },

    _buildMobileBuildingPills(facility, tabs) {
      const pillBar = document.getElementById('mobile-building-pills');
      if (!pillBar) return;
      pillBar.innerHTML = '';

      tabs.forEach((tab, i) => {
        const pill = document.createElement('button');
        pill.className = 'mobile-building-pill' + (i === 0 ? ' active' : '');
        pill.dataset.building = tab.id;
        pill.textContent = tab.label;
        pill.addEventListener('click', () => {
          // Sync with the desktop building tab click
          const desktopBtn = document.querySelector(`.building-tab[data-building="${tab.id}"]`);
          if (desktopBtn) desktopBtn.click();

          // Update pill active state
          pillBar.querySelectorAll('.mobile-building-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
        });
        pillBar.appendChild(pill);
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
        this._hideGaugeSheetOverlaps(true);
        const gcCloseBtn = document.getElementById('gauge-sheet-close');
        if (gcCloseBtn) gcCloseBtn.onclick = () => {
          this._closeGaugeSheet();
          this._activeBuilding = null;
          document.querySelectorAll('.building-tab').forEach(t => t.classList.remove('active'));
          const first = document.querySelector('.building-tab');
          if (first) first.classList.add('active');
        };
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
      this._hideGaugeSheetOverlaps(true);

      // Bind close button (use onclick to prevent listener accumulation)
      const closeBtn = document.getElementById('gauge-sheet-close');
      if (closeBtn) closeBtn.onclick = () => {
        this._closeGaugeSheet();
        this._activeBuilding = null;
        document.querySelectorAll('.building-tab').forEach(t => t.classList.remove('active'));
        const first = document.querySelector('.building-tab');
        if (first) first.classList.add('active');
      };

      // Bind row taps to open faceplate
      sheet.querySelectorAll('.gauge-sheet-row').forEach(row => {
        row.addEventListener('click', (e) => {
          const tag = row.dataset.tag;
          if (tag && this.faceplateManager) {
            this.faceplateManager.open(tag, e);
            if (this.pidZoom) this.pidZoom.highlightLoop(tag);
          }
        });
      });
    },

    _closeGaugeSheet() {
      const sheet = document.getElementById('gauge-sheet');
      if (sheet) sheet.classList.remove('open');
      this._hideGaugeSheetOverlaps(false);
      // Also sync mobile pills — deactivate all, reactivate first
      const pillBar = document.getElementById('mobile-building-pills');
      if (pillBar) {
        pillBar.querySelectorAll('.mobile-building-pill').forEach(p => p.classList.remove('active'));
        const first = pillBar.querySelector('.mobile-building-pill');
        if (first) first.classList.add('active');
      }
    },

    _hideGaugeSheetOverlaps(hide) {
      const pills = document.getElementById('mobile-building-pills');
      const pnlStrip = document.getElementById('mobile-pnl-strip');
      const speedDial = document.querySelector('.mobile-speed-dial');
      if (pills) pills.classList.toggle('gauge-sheet-hidden', hide);
      if (pnlStrip) pnlStrip.classList.toggle('gauge-sheet-hidden', hide);
      if (speedDial) speedDial.classList.toggle('gauge-sheet-hidden', hide);
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

    _updateBuildingTabAlarms() {
      if (!this.alarmManager || !this.currentFacility) return;
      const buildingTags = BUILDING_TAGS[this.currentFacility] || {};
      const tabs = document.querySelectorAll('.building-tab');
      tabs.forEach(tab => {
        const bid = tab.dataset.building;
        const allowed = buildingTags[bid];
        let hasAlarm = false;
        let hasCritical = false;
        if (allowed) {
          for (const a of this.alarmManager.alarms) {
            if (allowed.includes(a.tag)) {
              hasAlarm = true;
              if (a.state === 'HIHI' || a.state === 'LOLO') hasCritical = true;
            }
          }
        } else if (allowed === null) {
          // Overview tab — show if any alarm exists
          hasAlarm = this.alarmManager.alarms.length > 0;
          hasCritical = this.alarmManager.alarms.some(a => a.state === 'HIHI' || a.state === 'LOLO');
        }
        tab.classList.toggle('tab-alarm', hasAlarm && !hasCritical);
        tab.classList.toggle('tab-alarm-crit', hasCritical);
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

      // Add shift target row
      const targetRow = document.createElement('div');
      targetRow.className = 'spec-row';
      targetRow.id = 'spec-shift-target';
      const target = this._getShiftTarget();
      targetRow.innerHTML = `
        <span class="spec-label">SHIFT TARGET</span>
        <span class="spec-val" id="spec-shift-val">$0</span>
        <span class="spec-range">$${target.toLocaleString()}</span>
        <span class="spec-status" id="spec-shift-status">----</span>
      `;
      board.appendChild(targetRow);
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
        svgEl.setAttribute('viewBox', '0 0 1000 1050');
      }
    },

    _enrichTagBubbleTooltips(config) {
      const svgEl = document.getElementById('pid-diagram');
      if (!svgEl || !config) return;

      // Build a tag→description map from config process variables
      const pvMap = {};
      if (config.processVariables) {
        config.processVariables.forEach(pv => {
          pvMap[pv.tag] = pv.desc + (pv.unit ? ' (' + pv.unit + ')' : '');
        });
      }

      // Add SVG <title> elements to tag bubbles for native tooltips
      svgEl.querySelectorAll('.tag-bubble').forEach(bubble => {
        const tag = bubble.dataset.tag;
        if (!tag) return;

        // Remove existing titles
        const existingTitle = bubble.querySelector('title');
        if (existingTitle) existingTitle.remove();

        const desc = pvMap[tag] || tag;
        const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleEl.textContent = tag + ': ' + desc;
        bubble.appendChild(titleEl);
      });

      // Also add tooltips to tag labels (text elements near bubbles)
      svgEl.querySelectorAll('text[data-tag]').forEach(textEl => {
        const tag = textEl.dataset.tag;
        if (!tag) return;
        const desc = pvMap[tag] || tag;
        const existingTitle = textEl.querySelector('title');
        if (existingTitle) existingTitle.remove();
        const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleEl.textContent = tag + ': ' + desc;
        textEl.appendChild(titleEl);
      });
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
        const card = document.createElement('div');
        card.className = 'crisis-card mode-card';
        card.innerHTML = `
          <div class="crisis-card-name">${s.name}</div>
          <div class="crisis-card-desc">${s.description}</div>
          <div class="crisis-card-meta">
            <span class="crisis-difficulty ${s.difficulty === 'LEGENDARY' ? 'legendary' : ''}">${s.difficulty}</span>
            <span>${s.facility.toUpperCase()}</span>
            <span>${s.timeLimit} MIN</span>
          </div>
        `;

        card.addEventListener('click', () => {
          this.crisisScenario = s.id;
          this.currentFacility = s.facility;
          this._startGame();
        });

        list.appendChild(card);
      }
    },

    // ============================================================
    // GAME START
    // ============================================================

    _startGame() {
      // Clean up previous game if any
      if (this.sim) this.sim.destroy();

      // Show DCS boot sequence on first game start
      if (!this._hasBooted) {
        this._hasBooted = true;
        this._showBootSequence(() => this._actualStartGame());
        return;
      }
      this._actualStartGame();
    },

    _actualStartGame() {
      this._showScreen('game-screen');
      this._shiftStartRealTime = Date.now();

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
      this._enrichTagBubbleTooltips(config);

      // Cache config and DOM refs for hot-path tick functions
      this._cachedConfig = config;
      this._cachedWeatherEls = {
        temp: document.getElementById('weather-temp'),
        wind: document.getElementById('weather-wind'),
        precip: document.getElementById('weather-precip')
      };

      // On small mobile, start with left panel collapsed
      if (window.innerWidth <= 480) {
        const lp = document.getElementById('left-panel');
        if (lp) lp.classList.add('collapsed');
      }

      // Initialize simulation
      this._initSimulation(config);

      // Initialize UI managers
      this.gaugeManager = new GaugeManager(this.sim);
      if (this.faceplateManager) this.faceplateManager.destroy();
      this.faceplateManager = new FaceplateManager(this.sim);
      if (this.alarmManager) this.alarmManager.destroy();
      this.alarmManager = new AlarmManager();
      this.pidDiagram = new PidDiagram(this.sim);

      // P&ID zoom/pan
      if (window.PidZoom) {
        this.pidZoom = new PidZoom();
        this.pidZoom.resetForFacility();
        if (this._faceplateOpenHandler) {
          document.removeEventListener('faceplate:open', this._faceplateOpenHandler);
        }
        this._faceplateOpenHandler = (e) => {
          if (this.pidZoom && e.detail && e.detail.tag) {
            this.pidZoom.highlightLoop(e.detail.tag);
          }
        };
        document.addEventListener('faceplate:open', this._faceplateOpenHandler);
      }

      // Trend graph
      if (window.TrendManager) {
        this.trendManager = new TrendManager(this.sim);
      }

      // Bind mol sieve switch button (cryo only)
      if (this.currentFacility === 'cryogenic') {
        const switchBtn = document.getElementById('ms-switch-btn');
        if (switchBtn) {
          switchBtn.onclick = (e) => {
            e.stopPropagation();
            this._switchMolSieveBeds();
          };
        }
      }

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
        if (this.kimrayWidget) this.kimrayWidget.bindSVG();
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
          if (report.newAlarm === 'HIHI' || report.newAlarm === 'LOLO') {
            this.audioManager.playAlarm('critical');
          } else if (report.newAlarm === 'HI' || report.newAlarm === 'LO') {
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

      // Reset debrief recorder for new shift
      if (this.debriefScreen) this.debriefScreen.reset();

      // Reset shift tracking flags
      this._rvpInSpecEntireShift = true;
      this._noBtexPenalties = true;
      this._expanderTamed = false;
      this._highRecoveryEntireShift = true;
      this._crisisRecoveryTime = null;
      this._compRecoveredUnder8Min = false;
      this._truckLoadsClean = 0;
      this._tankPopoffCost = 0;
      this._towerFloodCost = 0;
      this._molsieveCycleComplete = false;
      this._compTripStartTime = null;
      this._shiftAchievements = [];
      this._shiftChallenges = [];

      // Reset field note hold timers so they don't bleed between shifts
      if (window.FieldNotes && FieldNotes.notes) {
        for (const note of FieldNotes.notes) {
          note._holdTimer = 0;
        }
      }

      // Show challenges panel
      const chPanel = document.getElementById('challenges-panel-container');
      if (chPanel && this.challenges) {
        chPanel.innerHTML = this.challenges.renderPanel();
        chPanel.style.display = '';
      }

      // Restore saved state if continuing a game (must happen after sim is created, before mode init)
      if (this._pendingRestoreState) {
        const state = this._pendingRestoreState;
        this._pendingRestoreState = null;
        if (state.sim && this.sim) this.sim.loadJSON(state.sim);
        if (state.events && this.eventSystem) this.eventSystem.loadJSON(state.events);
        if (state.valves) this.valves = state.valves;
        if (state.weather) this.weather = state.weather;
        if (state.equipment) this.equipment = state.equipment;
        if (state.crisisScenario) this.crisisScenario = state.crisisScenario;
        if (state.pnl && this.pnlSystem) {
          this.pnlSystem.loadJSON(state.pnl);
        }
      }

      // Start in appropriate mode
      if (this.currentMode === 'learn') {
        this.learnMode.start(1, this.currentFacility);
      } else if (this.currentMode === 'crisis' && this.crisisScenario) {
        this._startCrisisScenario();
        // Henry announces crisis
        if (this.henry) {
          setTimeout(() => {
            this.henry.show({
              text: "Crisis scenario. Clock is ticking.\n\nFocus on the critical path. Don't get distracted by secondary alarms.",
              mood: 'worried',
              position: 'right',
              duration: 5000,
              type: 'event'
            });
          }, 1500);
        }
        // Show coach hint after initial crisis announcement
        if (this.henry && window.CrisisScenarios) {
          setTimeout(() => {
            const hint = CrisisScenarios.getCoachHint(this.crisisScenario);
            if (hint) {
              this.henry.show({
                text: hint,
                mood: 'thinking',
                position: 'right',
                duration: 8000,
                type: 'tip'
              });
            }
          }, 8000);
        }
      } else {
        // Operate/optimize mode — show briefing, start paused
        this.sim.pause();
        this._showObjectivesBriefing();
        // Henry shift-start tip
        if (this.henry) {
          setTimeout(() => {
            const facilityTips = {
              stabilizer: "Stabilizer. Check your reboiler temp and separator level before you start the clock. Plan ahead.",
              refrigeration: "Refrigeration plant. Watch your TEG contactor level and keep an eye on BTEX compliance. EPA doesn't give second chances.",
              cryogenic: "Cryo Plant — 110 million a day. Watch the cold box, don't let moisture through the mol sieve, and keep that expander running."
            };
            this.henry.show({
              text: facilityTips[this.currentFacility] || "New shift. Read your board before you touch anything.",
              mood: 'normal',
              position: 'right',
              duration: 6000,
              type: 'tip'
            });
          }, 2000);
        }
      }

      // After game starts, check building tab overflow
      setTimeout(() => this._checkBuildingTabOverflow(), 100);
    },

    _initSimulation(config) {
      // Create simulation tick system
      this.sim = new SimulationTick();

      // Register process variables from facility config
      for (const pvConfig of config.processVariables) {
        const pv = new ProcessVariable(pvConfig);
        this.sim.registerPV(pv);
      }

      // Register amine PVs — built into cryo, DLC for other facilities
      const loadAmine = (this.currentFacility === 'cryogenic' || this.progress.amineDLC) && window.AmineConfig;
      if (loadAmine) {
        for (const pvConfig of AmineConfig.processVariables) {
          const pv = new ProcessVariable(pvConfig);
          this.sim.registerPV(pv);
        }
      }

      // Set up cascade rules
      for (const rule of config.cascadeRules) {
        this.sim.cascadeEngine.addRule(rule);
      }
      if (loadAmine) {
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
      if (loadAmine && AmineConfig.valves) {
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
      if (loadAmine && AmineConfig.equipment) {
        for (const [id, e] of Object.entries(AmineConfig.equipment)) {
          this.equipment[id] = { ...e };
        }
      }

      // Weather
      this.weather = { ...(config.weather || { ambientTemp: 72, windDirection: 'SW', windSpeed: 8, precipitation: 'CLEAR' }) };

      // Set up event system with FNAF-style progressive difficulty
      this.eventSystem = new EventSystem();
      const rankLevel = this.career ? this.career.getCurrentRank().level : 1;
      this.eventSystem.setDifficulty(rankLevel);

      // Register events based on facility
      if (window.registerPigEvents) registerPigEvents(this.eventSystem);
      if (window.registerEquipmentEvents) registerEquipmentEvents(this.eventSystem);

      if (this.currentFacility === 'refrigeration' && window.registerRefrigerationEvents) {
        registerRefrigerationEvents(this.eventSystem);
      }
      if (this.currentFacility === 'cryogenic' && window.registerCryogenicEvents) {
        registerCryogenicEvents(this.eventSystem);
      }
      if ((this.currentFacility === 'cryogenic' || this.progress.amineDLC) && window.registerAmineEvents) {
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
      // Keep alarm manager in sync with game time
      if (this.alarmManager) this.alarmManager.gameTimeMinutes = gameTime;

      // Update time display
      document.getElementById('game-time').textContent = this.sim.getTimeString();
      document.getElementById('shift-label').textContent = this.sim.getShiftLabel();
      const remainEl = document.getElementById('shift-remaining');
      if (remainEl && this.sim) {
        const left = Math.max(0, this.sim.shiftDurationMinutes - this.sim.shiftElapsed);
        const hrs = (left / 60).toFixed(1);
        remainEl.textContent = hrs + 'h LEFT';
      }

      // Update UI every tick
      if (this.gaugeManager) this.gaugeManager.update();
      if (this.faceplateManager) this.faceplateManager.update();
      if (this.pidDiagram) this.pidDiagram.update();
      if (this.gcDisplay) this.gcDisplay.update();
      this._updateGaugeSheet();
      this._updateBuildingTabAlarms();

      // Screen-edge red glow when critical alarms active
      const gs = document.getElementById('game-screen');
      if (gs && this.alarmManager) {
        const hasCritical = this.alarmManager.alarms.some(a => a.state === 'HIHI' || a.state === 'LOLO');
        gs.classList.toggle('critical-alarm-active', hasCritical);
      }

      // Mol sieve cycle tracking (cryo only)
      if (this.currentFacility === 'cryogenic') {
        this._tickMolSieveCycle(dt);

        // Cold sep HIHI → expander trip (liquid carryover)
        const coldSepLvl = this.sim.getPV('LIC-301');
        if (coldSepLvl && coldSepLvl.alarmState === 'HIHI' && this.eventSystem) {
          const expEvt = this.eventSystem.events.find(e => e.id === 'expander-trip');
          if (expEvt && !expEvt.active) {
            this.eventSystem._startEvent('expander-trip', this.sim.pvMap);
            this._addRadioMessage('COLD SEP HIHI — LIQUID CARRYOVER — EXPANDER TRIP');
          }
        }
      }

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

      // Tag dynamic content with glossary terms (throttled every 30 ticks)
      if (this.glossary && this.sim.totalTicks % 30 === 0) {
        this.glossary.tagDynamic('.event-action-desc, .henry-text, .alarm-tip, .radio-msg');
      }

      // Check field note unlocks periodically
      if (window.FieldNotes && this.sim.totalTicks % 50 === 0) {
        this._checkFieldNoteUnlocks();
      }

      // Safety interlocks — HIHI/LOLO triggers consequences
      if (this.sim.totalTicks % 20 === 0) {
        this._checkSafetyInterlocks();
      }

      // Henry gameplay tips
      this._henryGameplayTips(dt, gameTime);
      this._tickHenryCooldowns();

      // Shift timer warning + P&L colors
      this._updateShiftTimerWarning(gameTime);
      this._updatePnlColors();


      // Record debrief data every 10 ticks
      if (this.debriefScreen && this.sim.totalTicks % 10 === 0) {
        this.debriefScreen.recordTick(gameTime, this.pnlSystem);
      }

      // Record trend data and update trend graph
      if (this.trendManager && this.sim.totalTicks % 5 === 0) {
        this.trendManager.recordTick(gameTime);
        this.trendManager.update();
      }

      // Track achievement flags
      this._trackAchievementFlags();
    },

    // ============================================================
    // MOL SIEVE 3-BED CYCLE MANAGEMENT
    // ============================================================

    _tickMolSieveCycle(dt) {
      const config = window.CryogenicConfig;
      if (!config || !config.molSieve) return;

      const ms = config.molSieve;
      const beds = [
        { key: 'bedA', label: 'A', tag: 'TIC-201' },
        { key: 'bedB', label: 'B', tag: 'TIC-202' },
        { key: 'bedC', label: 'C', tag: null }
      ];

      // Regen heater outlet — target temp for regenerating beds
      const regenPV = this.sim ? this.sim.getPV('TIC-203') : null;
      const regenTarget = regenPV ? regenPV.value : 500;
      const adsorbTarget = 85; // Inlet gas temp ~85F

      // Advance cycle timers and drive bed temps
      for (const bed of beds) {
        const b = ms[bed.key];
        b.cycleTime += dt;

        // Auto-advance from regen to standby after regen time
        if (b.state === 'regenerating' && b.cycleTime >= b.maxCycleTime) {
          b.state = 'standby';
          b.cycleTime = 0;
        }

        // Drive bed temperature toward state-appropriate target
        if (bed.tag && this.sim) {
          const pv = this.sim.getPV(bed.tag);
          if (pv) {
            let target;
            if (b.state === 'regenerating') target = regenTarget * 0.85; // Bed outlet lags heater
            else if (b.state === 'adsorbing') target = adsorbTarget;
            else target = adsorbTarget + 20; // Standby — cooling down slowly
            const rate = b.state === 'regenerating' ? 0.03 : 0.015;
            pv.value += (target - pv.value) * rate * dt;
          }
        }
      }

      // Update P&ID bed status indicators
      this._updateMolSievePID(ms);
    },

    _switchMolSieveBeds() {
      const config = window.CryogenicConfig;
      if (!config || !config.molSieve) return;

      const ms = config.molSieve;
      const beds = ['bedA', 'bedB', 'bedC'];

      // Find the bed that's been adsorbing longest
      let longestAdsorb = null;
      let longestTime = -1;
      for (const key of beds) {
        if (ms[key].state === 'adsorbing' && ms[key].cycleTime > longestTime) {
          longestTime = ms[key].cycleTime;
          longestAdsorb = key;
        }
      }

      // Find the standby bed to bring online
      let standbyBed = null;
      for (const key of beds) {
        if (ms[key].state === 'standby') {
          standbyBed = key;
          break;
        }
      }

      if (longestAdsorb && standbyBed) {
        // Swap: longest adsorber goes to regen, standby goes to adsorb
        ms[longestAdsorb].state = 'regenerating';
        ms[longestAdsorb].cycleTime = 0;
        ms[standbyBed].state = 'adsorbing';
        ms[standbyBed].cycleTime = 0;

        this._molsieveCycleComplete = true;

        if (this.henry) {
          const bedLabel = longestAdsorb.replace('bed', '');
          const newLabel = standbyBed.replace('bed', '');
          this.henry.tip(`Mol sieve switch: Bed ${bedLabel} to regen, Bed ${newLabel} online.`, 4000);
        }
      } else if (longestAdsorb && !standbyBed) {
        // No standby available — force the regen bed
        if (this.henry) {
          this.henry.tip("No standby bed available. Wait for regen to complete.", 3000);
        }
      }

      this._updateMolSievePID(ms);
    },

    _updateMolSievePID(ms) {
      const stateColors = {
        adsorbing: '#4CAF50',  // green
        regenerating: '#FF9800', // orange
        standby: '#607D8B'     // grey-blue
      };
      const stateLabels = {
        adsorbing: 'ADSORB',
        regenerating: 'REGEN',
        standby: 'STANDBY'
      };
      const bedFills = {
        adsorbing: '#505050',
        regenerating: '#4A3A20',
        standby: '#383838'
      };

      for (const [key, label] of [['bedA', 'a'], ['bedB', 'b'], ['bedC', 'c']]) {
        const bed = ms[key];
        const color = stateColors[bed.state] || '#606060';
        const statusDot = document.getElementById('ms-status-' + label);
        const stateText = document.getElementById('ms-state-' + label);
        const bedRect = document.getElementById('ms-bed-' + label);

        if (statusDot) statusDot.setAttribute('fill', color);
        if (stateText) {
          stateText.textContent = stateLabels[bed.state] || bed.state.toUpperCase();
          stateText.setAttribute('fill', color);
        }
        if (bedRect) {
          bedRect.setAttribute('fill', bedFills[bed.state] || '#505050');
          bedRect.setAttribute('stroke', bed.state === 'adsorbing' ? '#808080' : '#606060');
        }
      }

      // Update equipment status too
      if (this.equipment) {
        for (const [key, equipId] of [['bedA', 'MS-A'], ['bedB', 'MS-B'], ['bedC', 'MS-C']]) {
          if (this.equipment[equipId]) {
            this.equipment[equipId].status = ms[key].state;
          }
        }
      }
    },

    _checkSafetyInterlocks() {
      const pvMap = this.sim.getAllPVs();

      // Separator HIHI → compressor trip (liquid carryover)
      const sep = pvMap['LIC-302'];
      if (sep && sep.alarmState === 'HIHI' && this.equipment && this.equipment['C-100']) {
        if (this.equipment['C-100'].status === 'running') {
          this.equipment['C-100'].status = 'tripped';
          this._compTripStartTime = this.sim.gameTimeMinutes;
          this._addRadioMessage('ESD: Compressor C-100 tripped on separator HIHI level — liquid carryover protection.');
          if (this.pnlSystem) this.pnlSystem.applyEventCost(800, 'COMP ESD TRIP');
          if (this.audioManager) this.audioManager.playEffect('esd');
          const cp = document.getElementById('center-panel');
          if (cp) { cp.classList.add('esd-shake'); setTimeout(() => cp.classList.remove('esd-shake'), 200); }
        }
      }

      // Tank HIHI pressure → pop-off relief (capped at $5,000 per shift)
      const tankP = pvMap['PIC-203'];
      if (tankP && tankP.alarmState === 'HIHI') {
        this._tankPopoffCost = this._tankPopoffCost || 0;
        if (this.pnlSystem && this.sim.totalTicks % 100 === 0 && this._tankPopoffCost < 5000) {
          this.pnlSystem.applyEventCost(500, 'TANK POP-OFF');
          this._tankPopoffCost += 500;
          this._addRadioMessage('WARNING: Tank TK-100 pop-off valve lifting — venting product!');
        }
      }

      // Tower sump HIHI → flooding damages packing (capped at $2,000 per shift)
      if (this.currentFacility === 'stabilizer') {
        const sump = pvMap['LIC-301'];
        if (sump && sump.alarmState === 'HIHI') {
          this._towerFloodCost = this._towerFloodCost || 0;
          if (this.pnlSystem && this.sim.totalTicks % 100 === 0 && this._towerFloodCost < 2000) {
            this.pnlSystem.applyEventCost(200, 'TOWER FLOODING');
            this._towerFloodCost += 200;
          }
        }
      }
    },

    // ============================================================
    // SPEC BOARD UPDATE (facility-aware)
    // ============================================================

    _updateSpecBoard() {
      const pvMap = this.sim.getAllPVs();
      const board = document.getElementById('spec-board');
      if (!board) return;

      const config = this._cachedConfig || (FACILITY_CONFIGS[this.currentFacility]
        ? FACILITY_CONFIGS[this.currentFacility]()
        : StabilizerConfig);

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
          const pv = pvMap['AI-A02'] || pvMap['AI-705'];
          if (pv) val = pv.displayValue();
        } else if (key === 'h2sOutlet') {
          const pv = pvMap['AI-A01'] || pvMap['AI-705'];
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

      // Update shift target in spec board
      const shiftValEl = document.getElementById('spec-shift-val');
      const shiftStatusEl = document.getElementById('spec-shift-status');
      if (shiftValEl && this.pnlSystem) {
        const earnings = Math.round(this.pnlSystem.shiftEarnings);
        shiftValEl.textContent = `$${earnings.toLocaleString()}`;
        const target = this._getShiftTarget();
        const pct = target > 0 ? Math.round((earnings / target) * 100) : 0;
        shiftStatusEl.textContent = `${pct}%`;
        const row = document.getElementById('spec-shift-target');
        if (row) row.className = 'spec-row ' + (earnings >= target ? 'in-spec' : earnings >= 0 ? '' : 'off-spec');
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

      // Trend graph toggle
      const trendBtn = document.getElementById('btn-trend');
      if (trendBtn) {
        trendBtn.addEventListener('click', () => {
          if (this.trendManager) {
            this.trendManager.toggle();
            trendBtn.classList.toggle('active', this.trendManager._visible);
          }
        });
      }

      // Snapshot button
      const snapBtn = document.getElementById('btn-snapshot');
      if (snapBtn) {
        snapBtn.addEventListener('click', () => {
          this._takeSnapshot();
        });
      }
    },

    _updateTimeButtons(speed) {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      const labels = { 0: 'PAUSED', 1: '1X SPEED', 2: '2X SPEED', 4: '4X SPEED' };
      document.getElementById('time-speed-label').textContent = labels[speed] || '';

      if (speed === 0) document.getElementById('btn-pause').classList.add('active');
      else if (speed === 1) document.getElementById('btn-1x').classList.add('active');
      else if (speed === 2) document.getElementById('btn-2x').classList.add('active');
      else if (speed === 4) document.getElementById('btn-4x').classList.add('active');

      // Sync mobile FAB label
      const fabLabels = { 0: '\u23F8', 1: '1x', 2: '2x', 4: '4x' };
      if (this._mobileFabLabel) {
        this._mobileFabLabel.textContent = fabLabels[speed] || '';
      }
      if (this._mobileSpeedRing) {
        this._mobileSpeedRing.querySelectorAll('.sd-btn[data-speed]').forEach(b => {
          b.classList.toggle('active', parseInt(b.dataset.speed, 10) === speed);
        });
      }

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

      // Lead Operator Mode (Henry's hints & coaching)
      const leadOpToggle = document.getElementById('setting-lead-operator');
      if (leadOpToggle) {
        const saved = localStorage.getItem('coldcreek-lead-operator');
        leadOpToggle.checked = saved !== 'off';
        this.leadOperatorMode = leadOpToggle.checked;
        leadOpToggle.addEventListener('change', () => {
          this.leadOperatorMode = leadOpToggle.checked;
          localStorage.setItem('coldcreek-lead-operator', leadOpToggle.checked ? 'on' : 'off');
          // Hide Henry immediately if turning off
          if (!leadOpToggle.checked && this.henry) {
            this.henry.hide();
          }
          // Hide/show coach button
          const coachBtn = document.getElementById('btn-coach');
          if (coachBtn) coachBtn.style.display = leadOpToggle.checked ? '' : 'none';
        });
      }

      // Color-blind mode
      const cbSelect = document.getElementById('setting-colorblind');
      if (cbSelect) {
        cbSelect.addEventListener('change', () => {
          if (this.colorBlindMode) this.colorBlindMode.setMode(cbSelect.value);
        });
      }

      // Glossary button
      const glossaryBtn = document.getElementById('btn-glossary');
      if (glossaryBtn) {
        glossaryBtn.addEventListener('click', () => {
          this._showGlossaryPopup();
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
        const cp = document.getElementById('center-panel');
        if (cp) { cp.classList.add('esd-shake'); setTimeout(() => cp.classList.remove('esd-shake'), 200); }
      }
      // Henry announces the event
      this._henryAnnounceEvent(event);
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
      if (!eventBlock) return;
      const active = this.eventSystem.getActiveEventsSummary();
      if (active.length === 0) {
        eventBlock.innerHTML = '<span class="event-item">NO ACTIVE EVENTS</span>';
        return;
      }

      eventBlock.innerHTML = '';
      active.forEach(e => {
        const mins = Math.floor(e.elapsed);
        const span = document.createElement('span');
        span.className = 'event-item active-event';
        span.textContent = e.name + ' (' + mins + 'm)';
        eventBlock.appendChild(span);
      });
    },

    _addRadioMessage(msg) {
      const radioLog = document.getElementById('radio-log');
      if (!radioLog) return;
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
      const els = this._cachedWeatherEls;
      if (!els) return;
      if (els.temp) els.temp.textContent = `${this.weather.ambientTemp} degF`;
      if (els.wind) els.wind.textContent = `${this.weather.windDirection} ${this.weather.windSpeed} mph`;
      if (els.precip) els.precip.textContent = this.weather.precipitation;
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

    _updateChallengesPreview() {
      const container = document.getElementById('title-challenges-preview');
      if (!container || !this.challenges) {
        if (container) container.style.display = 'none';
        return;
      }

      const today = this.challenges.getDaily ? this.challenges.getDaily() : null;
      const weekly = this.challenges.getWeekly ? this.challenges.getWeekly() : null;

      if (!today && !weekly) {
        container.style.display = 'none';
        return;
      }

      let html = '<div class="challenges-preview-title">TODAY\'S CHALLENGES</div>';

      const renderChallenge = (ch) => {
        const done = ch.completed || false;
        const statusText = done ? '&#10003; DONE' : 'ACTIVE';
        const statusClass = done ? 'done' : 'active';
        return `<div class="challenge-preview-item">
          <span class="challenge-preview-pts">${ch.reward || ch.points || 0} PTS</span>
          <span class="challenge-preview-name">${ch.name || ch.id}</span>
          <span class="challenge-preview-status ${statusClass}">${statusText}</span>
        </div>`;
      };

      if (today && today.length > 0) {
        today.forEach(ch => { html += renderChallenge(ch); });
      }

      if (weekly) {
        html += '<div class="challenges-preview-title" style="margin-top:8px">WEEKLY CHALLENGE</div>';
        html += renderChallenge(weekly);
      }

      container.innerHTML = html;
      container.style.display = '';
    },

    _bindLeaderboardFilters() {
      document.querySelectorAll('.lb-filter').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.lb-filter').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.dataset.lbFilter;
          this._refreshLeaderboard(filter === 'all' ? null : filter);
        });
      });
    },

    async _refreshLeaderboard(facility = null) {
      const listEl = document.getElementById('leaderboard-list');
      if (!listEl) return;

      // Timeout after 5 seconds
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000));

      try {
        const scores = await Promise.race([this.leaderboard.getTopScores(10, facility), timeout]);
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
            <span class="lb-facility">${this._escapeHtml(facility)}</span>
            <span class="lb-score${scoreClass}">${this._escapeHtml(earnings)}</span>
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

    /** Sanitize a string for use as a Firebase path key */
    _sanitizeFirebaseKey(str) {
      // Firebase keys cannot contain . $ # [ ] / or control chars
      return String(str || '')
        .replace(/[.$#\[\]\/\x00-\x1f]/g, '_')
        .substring(0, 40);
    },

    // ============================================================
    // DAILY LOGIN STREAK
    // ============================================================

    _checkStreak() {
      const today = new Date().toDateString();
      const lastLogin = localStorage.getItem('coldcreek-last-login');
      let streak = parseInt(localStorage.getItem('coldcreek-streak') || '0', 10);
      if (isNaN(streak) || streak < 0) streak = 0;

      if (lastLogin === today) return; // Already logged in today

      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastLogin === yesterday) {
        streak++;
      } else if (lastLogin) {
        streak = 1; // Streak broken
      } else {
        streak = 1; // First login
      }

      localStorage.setItem('coldcreek-streak', streak);
      localStorage.setItem('coldcreek-last-login', today);

      if (streak > 1) {
        setTimeout(() => {
          this.showToast(`${streak}-DAY STREAK`, `+${Math.min(streak * 2, 20)}% shift bonus`, 'DAILY LOGIN');
        }, 1500);
      }
    },

    // ============================================================
    // SHIFT END
    // ============================================================

    _onShiftEnd() {
      this.sim.pause();
      this._updateTimeButtons(0);

      // Apply streak bonus (only to positive earnings)
      const rawStreak = parseInt(localStorage.getItem('coldcreek-streak') || '0', 10);
      const streak = isNaN(rawStreak) ? 0 : Math.max(0, rawStreak);
      const streakBonus = Math.min(streak * 0.02, 0.20); // Max 20% bonus
      if (streakBonus > 0 && this.pnlSystem && this.pnlSystem.shiftEarnings > 0) {
        this.pnlSystem.shiftEarnings *= (1 + streakBonus);
      }

      const earnings = this.pnlSystem ? this.pnlSystem.shiftEarnings : 0;
      const facility = this.currentFacility;

      // Anti-exploit: minimum real playtime
      const realPlayTime = Date.now() - (this._shiftStartRealTime || Date.now());
      const validScore = realPlayTime > 120000; // 2 minutes minimum

      // Scores at 4x speed get a penalty
      const speedPenalty = this.sim.timeCompression > 2 ? 0.85 : 1.0;

      // Record shift completion
      const key = facility + 'ShiftsComplete';
      this.saveProgress({
        [key]: (this.progress[key] || 0) + 1,
        lastShiftEarnings: earnings,
        lastFacility: facility,
        lastMode: this.currentMode
      });

      this._updateUnlockStates();
      this._addRadioMessage(`SHIFT COMPLETE — Earnings: $${Math.round(earnings).toLocaleString()}`);

      // Submit to leaderboard (with anti-exploit checks)
      if (this.leaderboard && validScore) {
        const adjustedEarnings = earnings * speedPenalty;
        this.leaderboard.submitScore(facility, this.currentMode, adjustedEarnings);
      }

      // Crisis-specific scoring
      let crisisResult = null;
      if (this.currentMode === 'crisis' && this.crisisScenario && window.CrisisScenarios) {
        const recoveryTime = this._crisisRecoveryTime || (this.sim.shiftElapsed / this.sim.timeCompression);
        const pnlLoss = Math.min(0, earnings);
        const zeroPenalties = this._noBtexPenalties && this._rvpInSpecEntireShift;
        crisisResult = CrisisScenarios.scoreScenario(this.crisisScenario, recoveryTime, pnlLoss, zeroPenalties);
        if (crisisResult) {
          this._addRadioMessage(`CRISIS RESULT: ${crisisResult.medal} — Score: ${crisisResult.score}`);
        }
      }

      // Evaluate objectives
      if (this.objectives) this.objectives.evaluate(this);
      const grade = this.objectives ? this.objectives.getGrade() : { letter: 'C' };

      // Evaluate achievements
      if (this.achievements) {
        this._shiftAchievements = this.achievements.evaluateShiftEnd(this);
        for (const achId of this._shiftAchievements) {
          const def = Achievements.DEFINITIONS.find(d => d.id === achId);
          if (def) {
            const tier = Achievements.TIERS[def.tier];
            this.showToast(def.name, def.desc, `${tier.label} ACHIEVEMENT`);
            this._addRadioMessage(`ACHIEVEMENT UNLOCKED: ${def.name}`);
          }
        }
      }

      // Evaluate challenges
      if (this.challenges) {
        this._shiftChallenges = this.challenges.evaluateShiftEnd(this);
        for (const c of this._shiftChallenges) {
          this.showToast(c.challenge.name, `+${c.challenge.reward} pts`, 'CHALLENGE COMPLETE');
        }
      }

      // Award career XP
      if (this.career) {
        const xpResult = this.career.awardShiftXP(this);
        this._lastXPResult = xpResult; // Store for debrief display
        if (xpResult.newRank) {
          setTimeout(() => this._showPromotionOverlay(xpResult.newRank), 1500);
          this._addRadioMessage(`PROMOTED: ${xpResult.newRank.title}`);
        }
      }

      // Record to operator profile
      if (this.operatorProfile) {
        this.operatorProfile.recordShift({
          facility,
          mode: this.currentMode,
          earnings,
          grade: grade.letter,
          alarms: this.alarmManager ? (this.alarmManager.alarmHistory || []).length : 0,
          pigs: this.eventSystem ? this.eventSystem.eventHistory.filter(e => e.id.startsWith('pig-')).length : 0
        });
      }

      // Check for tier unlock messages
      if (facility === 'stabilizer' && this.progress.stabilizerShiftsComplete === 1) {
        this._addRadioMessage('TIER 2 UNLOCKED: Refrigeration Plant now available.');
        this.showToast('REFRIGERATION PLANT', 'Tier 2 facility now available', 'FACILITY UNLOCKED');
      }
      if (facility === 'refrigeration' && this.progress.refrigerationShiftsComplete === 1) {
        this._addRadioMessage('TIER 3 UNLOCKED: Cryo Plant now available.');
        this.showToast('CRYO PLANT', 'Tier 3 facility now available', 'FACILITY UNLOCKED');
      }

      // Hide challenges panel
      const chPanel = document.getElementById('challenges-panel-container');
      if (chPanel) chPanel.style.display = 'none';

      // Show debrief screen (replaces old objectives results)
      this._showDebriefScreen(earnings);
    },

    _showObjectivesBriefing() {
      if (!this.objectives) return;
      const overlay = document.getElementById('objectives-overlay');
      if (!overlay) return;

      overlay.innerHTML = this.objectives.renderBriefing();
      overlay.style.display = 'flex';

      document.getElementById('obj-start-btn').onclick = () => {
        overlay.style.display = 'none';
      };
    },

    _showObjectivesResults(earnings) {
      if (!this.objectives) return;
      this.objectives.evaluate(this);
      const overlay = document.getElementById('objectives-overlay');
      if (!overlay) return;

      overlay.innerHTML = this.objectives.renderResults(earnings);

      // Add Henry commentary based on grade
      const grade = this.objectives.getGrade();
      const henryComments = {
        'S': "Well I'll be damned. That's the best shift I've seen in 30 years. You sure you're new?",
        'A': "Excellent work. Clean shift, good numbers. You'd survive out here.",
        'B': "Solid shift. Nothing blew up, we made money. That's the job.",
        'C': "You kept the lights on. That counts for something. But there's room to improve.",
        'D': "Rough one. Don't worry — every good operator has bad shifts. Learn from it."
      };
      const comment = henryComments[grade.letter] || henryComments['C'];

      // Insert Henry comment before the done button
      const doneBtn = overlay.querySelector('#obj-done-btn');
      if (doneBtn) {
        const commentEl = document.createElement('div');
        commentEl.className = 'obj-henry-comment';
        commentEl.textContent = comment;
        doneBtn.parentElement.insertBefore(commentEl, doneBtn);
      }

      // Show achievement toast for great shifts
      if (grade.letter === 'S') {
        setTimeout(() => this.showToast('EXCEPTIONAL SHIFT', `$${Math.round(earnings).toLocaleString()} earned with a perfect score`, 'SHIFT COMPLETE'), 1000);
      } else if (grade.letter === 'A' && earnings > this._getShiftTarget()) {
        setTimeout(() => this.showToast('TARGET EXCEEDED', `Beat the shift target by $${Math.round(earnings - this._getShiftTarget()).toLocaleString()}`, 'MILESTONE'), 1000);
      }

      overlay.style.display = 'flex';

      document.getElementById('obj-done-btn').onclick = () => {
        overlay.style.display = 'none';
        this._showScreen('title-screen');
        this._updateContinueButton();
      };
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
          this.showToast(note.title, note.category, 'FIELD NOTE UNLOCKED');
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
        const catDiv = document.createElement('div');
        catDiv.className = 'field-note-category';
        catDiv.textContent = note.category;
        card.appendChild(catDiv);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'field-note-title';
        titleDiv.textContent = note.unlocked ? note.title : '???';
        card.appendChild(titleDiv);

        const textDiv = document.createElement('div');
        textDiv.className = 'field-note-text';
        textDiv.textContent = note.unlocked ? note.text : 'Keep operating to unlock this note.';
        card.appendChild(textDiv);
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
        const json = JSON.stringify(this.progress);
        localStorage.setItem('coldcreek-progress', json);
        if (window.steam && window.steam.isAvailable()) {
          window.steam.writeCloudFile('progress.json', json);
        }
      } catch (e) { /* Storage unavailable */ }

      // Sync progress to Firebase (only if authenticated)
      if (typeof firebase !== 'undefined' && firebase.database && firebase.auth && firebase.auth().currentUser) {
        try {
          const username = localStorage.getItem('coldcreek-username');
          if (username) {
            const uid = firebase.auth().currentUser.uid;
            firebase.database().ref('profiles/' + uid + '/progress').set(this.progress);
          }
        } catch (e) { /* ok */ }
      }
    },

    _loadProgress() {
      try {
        // Prefer Steam Cloud progress (cross-machine), fall back to localStorage
        let data = null;
        if (window.steam && window.steam.isAvailable() && window.steam.isCloudEnabled()) {
          data = window.steam.readCloudFile('progress.json');
        }
        if (!data) data = localStorage.getItem('coldcreek-progress');
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
          equipment: this.equipment,
          crisisScenario: this.crisisScenario,
          pnl: this.pnlSystem ? this.pnlSystem.toJSON() : { shiftEarnings: 0 }
        };
        const json = JSON.stringify(state);
        localStorage.setItem('coldcreek-gamestate', json);
        if (window.steam && window.steam.isAvailable()) {
          window.steam.writeCloudFile('gamestate.json', json);
        }
        this.saveProgress({ hasGameState: true });
      } catch (e) { /* Storage unavailable */ }
    },

    _continueGame() {
      try {
        // Prefer Steam Cloud save (cross-machine), fall back to localStorage
        let data = null;
        if (window.steam && window.steam.isAvailable() && window.steam.isCloudEnabled()) {
          data = window.steam.readCloudFile('gamestate.json');
        }
        if (!data) data = localStorage.getItem('coldcreek-gamestate');
        if (data) {
          const state = JSON.parse(data);
          this.currentMode = state.mode || 'operate';
          this.currentFacility = state.facility || 'stabilizer';

          // Store pending state so it can be restored after boot sequence completes
          this._pendingRestoreState = state;
          this._startGame();
        }
      } catch (e) {
        // No saved state — start fresh
        this.currentMode = 'operate';
        this.currentFacility = 'stabilizer';
        this._startGame();
      }
    },

    // ============================================================
    // HENRY — MASCOT CHARACTER INTEGRATION
    // ============================================================

    _initHenry() {
      if (!window.Henry) return;
      this.henry = new Henry();

      // Prompt callsign if not set
      if (!this.leaderboard || !this.leaderboard.hasUsername()) {
        setTimeout(() => {
          this.henry.tip("First things first — enter your callsign up top so we know who's running the board.", 6000);
        }, 800);
      } else if (!localStorage.getItem('coldcreek-welcomed')) {
        // Show welcome on first visit (has callsign but hasn't played yet)
        setTimeout(() => {
          this.henry.welcome();
          localStorage.setItem('coldcreek-welcomed', '1');
        }, 800);
      } else {
        // Returning player — quick hello
        const greetings = [
          "Back for another shift? Good. Let's make some money.",
          "Welcome back, operator. The board's waiting.",
          "Another day, another dollar. Let's get to work.",
          "Good to see you. Pick a plant and show me what you've got."
        ];
        setTimeout(() => {
          this.henry.tip(greetings[Math.floor(Math.random() * greetings.length)], 4000);
        }, 1200);
      }
    },

    _henryAnnounceEvent(event) {
      if (!this.henry || !this.leadOperatorMode) return;

      // Custom messages per event type for personality
      const messages = {
        'pig-single': { name: 'PIG INCOMING!', desc: "Heads up — pig launched on the line. You've got 15-25 minutes. Ramp that feed flow and watch your separator level.", mood: 'alert' },
        'pig-fast': { name: 'FAST PIG!', desc: "This one's moving! 5-10 minutes tops. Get FIC-401 ramped up NOW. No time to think, just move.", mood: 'worried' },
        'pig-double': { name: 'BACK-TO-BACK PIGS!', desc: "Two pigs in the line. One behind the other. This is gonna get ugly. Stay sharp.", mood: 'worried' },
        'hot-oil-fault': { name: 'HOT OIL PROBLEM', desc: "Hot oil system's acting up. Your reboiler temp is about to drop. Find the fault and fix it before RVP goes sideways.", mood: 'alert' },
        'comp-trip': { name: 'COMPRESSOR TRIPPED!', desc: "Comp's down. Check what caused it — probably liquid carryover. Get that separator sorted first.", mood: 'worried' },
        'instrument-freeze': { name: 'INSTRUMENT ISSUE', desc: "Something doesn't look right on the board. One of your readings might be stuck. Trust your gut.", mood: 'alert' },
        'teg-foaming': { name: 'TEG FOAMING', desc: "Glycol's foaming up in the contactor. Inject antifoam before you lose moisture spec.", mood: 'alert' },
        'btex-pilot-out': { name: 'BTEX PILOT OUT!', desc: "BTEX burner pilot went out. That's an EPA problem real fast. Get it relit.", mood: 'worried' },
        'expander-trip': { name: 'EXPANDER TRIP!', desc: "Turboexpander's down! Your cold box is warming up. Get it restarted before you lose ethane recovery.", mood: 'worried' },
        'cold-box-freeze': { name: 'COLD BOX FREEZE-UP', desc: "Moisture in the cold box. Brazed aluminum doesn't like that. Controlled warmup — don't rush it, 3 degrees per minute max.", mood: 'worried' },
        'molsieve-breakthrough': { name: 'MOL SIEVE BREAKTHROUGH', desc: "Moisture breaking through the mol sieve. Switch beds or inject EG downstream. Clock's ticking.", mood: 'alert' },
        'weather-change': { name: 'WEATHER INCOMING', desc: "Front moving in. Temps are dropping. Watch your exposed lines and aerial coolers.", mood: 'alert' },
        'fuel-gas-swing': { name: 'FUEL GAS SWING', desc: "Fuel gas composition just shifted. Your heater might get rich or lean. Watch the BTU and flame.", mood: 'alert' },
        'instrument-air-loss': { name: 'INSTRUMENT AIR LOSS!', desc: "Instrument air header pressure is dropping. Control valves are going to fail to their safe positions. This is not a drill.", mood: 'worried' },
        'fire-eye-alarm': { name: 'FIRE EYE ALARM', desc: "Fire eye lost flame signal on the heater. Could be a fouled sensor or an actual flameout. Investigate NOW.", mood: 'worried' },
        'ldar-inspection': { name: 'LDAR INSPECTION', desc: "Environmental inspector on site with the OGI camera. Keep everything tight and in spec.", mood: 'alert' },
        'pump-bearing-hot': { name: 'PUMP BEARING HOT', desc: "Bearing temp climbing on one of your pumps. If it gets to 200°F, shut it down before it seizes.", mood: 'alert' },
        'lel-alarm': { name: 'LEL ALARM!', desc: "Lower Explosive Limit alarm in the comp building. Something's leaking. This is a potential evac situation.", mood: 'worried' },
        'res-comp-fault': { name: 'RESIDUE COMP FAULT', desc: "Residue gas compressor throwing a fault. Your suction pressure is going to climb. Watch the demethanizer.", mood: 'alert' },
        'h2s-area-alarm': { name: 'H2S AREA ALARM!', desc: "H2S detector tripped. Check wind direction immediately. If it's heading toward personnel — evacuate.", mood: 'worried' },
        'amine-pump-fail': { name: 'AMINE PUMP FAILURE', desc: "Amine pump just went down. You're about to lose H2S treating. Get the spare online.", mood: 'worried' },
        'truck-arrival': { name: 'TRUCK AT RACK', desc: "Truck at the loading rack. Check your tank levels and RVP before you start loading.", mood: 'normal' },
        'refrig-condenser-foul': { name: 'CONDENSER FOULING', desc: "Condenser's losing efficiency. Approach temperature is climbing. Check for tube fouling.", mood: 'alert' },
        'kimray-dp-swing': { name: 'KIMRAY DP SWING', desc: "Glycol pump differential is swinging. Your circulation rate is going to bounce. Watch the contactor.", mood: 'alert' },
        'feed-composition-swing': { name: 'FEED COMP CHANGE', desc: "Upstream composition just changed. Richer feed means more liquids. Adjust your recovery settings.", mood: 'alert' },
        'mode-switch': { name: 'MODE SWITCH', desc: "Switching recovery modes. Take it slow — changing too fast will upset the demethanizer.", mood: 'teaching' },
      };

      const custom = messages[event.id];
      if (custom) {
        this.henry.announce(custom.name, custom.desc, event.severity);
        this.henry._setMood(custom.mood);
      } else {
        this.henry.announce(event.name, event.description || '', event.severity);
      }
    },

    _henryGameplayTips(dt, gameTime) {
      if (!this.henry || !this.leadOperatorMode || this.henry.isVisible) return;
      if (!this.sim || !this.pnlSystem) return;

      // Only check every ~60 ticks (about every minute of game time)
      if (this.sim.totalTicks % 60 !== 0) return;

      const pvMap = this.sim.getAllPVs();

      // RVP tips
      const rvpPV = pvMap['AI-501'] || pvMap['AI-704'];
      if (rvpPV) {
        if (rvpPV.value > 12.5 && !this._henryTipCooldown('rvp-high')) {
          this.henry.operatorTip('rvp-high');
          this._setHenryTipCooldown('rvp-high', 300);
        } else if (rvpPV.value < 8.0 && !this._henryTipCooldown('rvp-low')) {
          this.henry.operatorTip('rvp-low');
          this._setHenryTipCooldown('rvp-low', 300);
        }
      }

      // Separator high level tip
      const sepPV = pvMap['LIC-302'];
      if (sepPV && sepPV.alarmState === 'HI' && !this._henryTipCooldown('sep-high')) {
        this.henry.operatorTip('separator-high');
        this._setHenryTipCooldown('sep-high', 200);
      }

      // Hot oil temperature drop
      const hoilPV = pvMap['TIC-104'] || pvMap['TIC-201'];
      if (hoilPV && hoilPV.value < hoilPV.lo && !this._henryTipCooldown('hotoil-drop')) {
        this.henry.operatorTip('hotoil-drop');
        this._setHenryTipCooldown('hotoil-drop', 300);
      }

      // Tower pressure spike
      const towerP = pvMap['PIC-201'] || pvMap['PIC-501'];
      if (towerP && towerP.alarmState === 'HI' && !this._henryTipCooldown('pressure-spike')) {
        this.henry.operatorTip('pressure-spike');
        this._setHenryTipCooldown('pressure-spike', 300);
      }

      // Negative earnings warning
      if (this.pnlSystem.shiftEarnings < -500 && !this._henryTipCooldown('earnings-neg')) {
        this.henry.operatorTip('earnings-negative');
        this._setHenryTipCooldown('earnings-neg', 600);
      }

      // NGL recovery dropping (cryo)
      const nglPV = pvMap['AI-701'] || pvMap['AI-502'];
      if (nglPV && nglPV.value < 85 && !this._henryTipCooldown('recovery-drop')) {
        this.henry.operatorTip('recovery-dropping');
        this._setHenryTipCooldown('recovery-drop', 400);
      }

      // Tank overpressure
      const tankP = pvMap['PIC-203'] || pvMap['PIC-202'];
      if (tankP && tankP.alarmState === 'HI' && !this._henryTipCooldown('tank-op')) {
        this.henry.operatorTip('tank-overpressure');
        this._setHenryTipCooldown('tank-op', 300);
      }

      // Good earnings encouragement
      if (this.pnlSystem.shiftEarnings > 5000 && !this._henryTipCooldown('good-earnings')) {
        this.henry.operatorTip('good-earnings');
        this._setHenryTipCooldown('good-earnings', 9999);
      }

      // Shift end approaching (15 game-minutes remaining)
      const minsLeft = this.sim.shiftDurationMinutes - this.sim.shiftElapsed;
      if (minsLeft <= 15 && minsLeft > 10 && !this._henryTipCooldown('shift-end')) {
        this.henry.operatorTip('shift-end-approaching');
        this._setHenryTipCooldown('shift-end', 9999);
      }

      // Shift halfway ambient comment
      const halfShift = this.sim.shiftDurationMinutes / 2;
      if (this.sim.shiftElapsed >= halfShift && this.sim.shiftElapsed <= halfShift + 5 && !this._henryTipCooldown('halfway')) {
        this.henry.operatorTip('shift-halfway');
        this._setHenryTipCooldown('halfway', 9999);
      }

      // Random ambient radio chatter (every ~5 game-minutes, 20% chance)
      if (this.sim.totalTicks % 300 === 0 && Math.random() < 0.2 && !this._henryTipCooldown('ambient')) {
        this.henry.ambientRadio();
        this._setHenryTipCooldown('ambient', 600);
      }

      // First faceplate hint
      if (this.sim.totalTicks === 60 && !this.progress.firstFaceplateHint) {
        this.henry.operatorTip('first-faceplate');
        this.saveProgress({ firstFaceplateHint: true });
      }
    },

    _henryTipCooldowns: {},

    _henryTipCooldown(key) {
      return this._henryTipCooldowns[key] && this._henryTipCooldowns[key] > 0;
    },

    _setHenryTipCooldown(key, ticks) {
      this._henryTipCooldowns[key] = ticks;
    },

    _tickHenryCooldowns() {
      for (const key in this._henryTipCooldowns) {
        if (this._henryTipCooldowns[key] > 0) this._henryTipCooldowns[key]--;
      }
    },

    // ============================================================
    // DCS BOOT SEQUENCE
    // ============================================================

    _showBootSequence(callback) {
      const overlay = document.createElement('div');
      overlay.className = 'boot-overlay';

      const facilityNames = {
        stabilizer: 'COLD CREEK STABILIZER',
        refrigeration: 'COLD CREEK REFRIGERATION',
        cryogenic: 'CRYO PLANT'
      };
      const name = facilityNames[this.currentFacility] || 'COLD CREEK';

      overlay.innerHTML = `
        <div class="boot-logo">COLD CREEK</div>
        <div class="boot-sub">DISTRIBUTED CONTROL SYSTEM v4.2.1</div>
        <div class="boot-log" id="boot-log"></div>
        <div class="boot-progress"><div class="boot-progress-bar" id="boot-bar"></div></div>
      `;
      document.body.appendChild(overlay);

      const lines = [
        { text: 'INITIALIZING DCS KERNEL...', cls: 'info', delay: 200 },
        { text: 'SCANNING I/O MODULES.............. <span class="ok">OK</span>', cls: '', delay: 400 },
        { text: `LOADING FACILITY: ${name}`, cls: 'info', delay: 300 },
        { text: 'PROCESS VARIABLE DATABASE......... <span class="ok">OK</span>', cls: '', delay: 350 },
        { text: 'CASCADE ENGINE.................... <span class="ok">OK</span>', cls: '', delay: 250 },
        { text: 'ALARM MANAGEMENT SYSTEM........... <span class="ok">OK</span>', cls: '', delay: 300 },
        { text: 'EVENT SCHEDULER................... <span class="ok">OK</span>', cls: '', delay: 250 },
        { text: 'P&ID GRAPHICS MODULE.............. <span class="ok">OK</span>', cls: '', delay: 300 },
        { text: 'HISTORICAL DATA TRENDING.......... <span class="ok">OK</span>', cls: '', delay: 250 },
        { text: 'SAFETY INTERLOCK SYSTEM........... <span class="ok">OK</span>', cls: '', delay: 350 },
        { text: 'FIELD INSTRUMENT SCAN............. <span class="ok">OK</span>', cls: '', delay: 300 },
        { text: 'OPERATOR STATION READY', cls: 'ok', delay: 400 }
      ];

      const log = document.getElementById('boot-log');
      const bar = document.getElementById('boot-bar');
      let i = 0;
      let totalDelay = 0;

      for (const line of lines) {
        totalDelay += line.delay;
        const idx = i;
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'boot-line';
          el.innerHTML = line.text;
          log.appendChild(el);
          bar.style.width = Math.round(((idx + 1) / lines.length) * 100) + '%';
          log.scrollTop = log.scrollHeight;
        }, totalDelay);
        i++;
      }

      // Fade out and start game
      setTimeout(() => {
        overlay.style.transition = 'opacity 0.4s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          callback();
        }, 400);
      }, totalDelay + 600);
    },

    // ============================================================
    // ACHIEVEMENT TOAST SYSTEM
    // ============================================================

    _showPauseMenu() {
      const pm = document.getElementById('pause-menu');
      if (!pm) return;
      pm.style.display = 'flex';

      // Sync controls with current state
      const vol = document.getElementById('pause-volume');
      if (vol && this.audioManager && this.audioManager.masterGain) {
        vol.value = Math.round(this.audioManager.masterGain.gain.value * 100);
      }
      const sfx = document.getElementById('pause-sound');
      if (sfx) sfx.checked = localStorage.getItem('coldcreek-sound') !== 'off';
      const alm = document.getElementById('pause-alarm-sound');
      if (alm) alm.checked = localStorage.getItem('coldcreek-alarm-sound') !== 'off';
      const tips = document.getElementById('pause-tips');
      if (tips) tips.checked = localStorage.getItem('coldcreek-tips') !== 'off';

      // Bind controls (only once)
      if (!this._pauseMenuBound) {
        this._pauseMenuBound = true;
        if (vol) vol.addEventListener('input', () => {
          if (this.audioManager) this.audioManager.setVolume(vol.value / 100);
          localStorage.setItem('coldcreek-volume', vol.value);
        });
        if (sfx) sfx.addEventListener('change', () => {
          localStorage.setItem('coldcreek-sound', sfx.checked ? 'on' : 'off');
          if (this.audioManager) this.audioManager.setEnabled(sfx.checked);
        });
        if (alm) alm.addEventListener('change', () => {
          localStorage.setItem('coldcreek-alarm-sound', alm.checked ? 'on' : 'off');
        });
        if (tips) tips.addEventListener('change', () => {
          localStorage.setItem('coldcreek-tips', tips.checked ? 'on' : 'off');
          if (this.alarmManager) this.alarmManager.setTipsEnabled(tips.checked);
        });
        document.getElementById('pause-resume').addEventListener('click', () => {
          this._hidePauseMenu();
          const resumeSpeed = this._lastSpeedBeforePause || 1;
          this.sim.setSpeed(resumeSpeed);
          this._updateTimeButtons(resumeSpeed);
        });
        document.getElementById('pause-quit').addEventListener('click', () => {
          this._hidePauseMenu();
          if (this.sim) this.sim.pause();
          if (this.audioManager) this.audioManager.stopAll();
          this.saveGameState();
          this._showScreen('title-screen');
          this._updateContinueButton();
        });
      }
    },

    _hidePauseMenu() {
      const pm = document.getElementById('pause-menu');
      if (pm) pm.style.display = 'none';
    },

    showToast(title, description, headerText) {
      const toast = document.createElement('div');
      toast.className = 'achievement-toast';

      const hdr = document.createElement('div');
      hdr.className = 'toast-header';
      hdr.textContent = headerText || 'ACHIEVEMENT';
      toast.appendChild(hdr);

      const ttl = document.createElement('div');
      ttl.className = 'toast-title';
      ttl.textContent = title;
      toast.appendChild(ttl);

      if (description) {
        const desc = document.createElement('div');
        desc.className = 'toast-desc';
        desc.textContent = description;
        toast.appendChild(desc);
      }

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    },

    // ============================================================
    // ROTATING TAGLINES (Title Screen)
    // ============================================================

    _taglines: [
      '"The plant tells you something is wrong before it goes wrong."',
      '"If everything is colored, nothing stands out."',
      'Designed by a decade-experienced cryogenic plant operator.',
      'Real cascade physics. Real ISA-101 HMI standards.',
      '"Watch the trend, not the number."',
      'From stabilizer to 110 MMcfd cryogenic.',
      '"Your reboiler is your paycheck."',
      '"Rate of change matters more than current value."',
      'Three facilities. Four modes. One leaderboard.',
      '"Don\'t stare at the alarm. Trace the flow."',
      'Used by operators and engineering students worldwide.',
      'Train like it\'s real. Because it was.'
    ],

    _startTaglineRotation() {
      if (this._taglineInterval) clearInterval(this._taglineInterval);
      const el = document.getElementById('title-tagline');
      if (!el) return;
      this._taglineIdx = this._taglineIdx || 0;

      const show = () => {
        el.textContent = this._taglines[this._taglineIdx % this._taglines.length];
        el.classList.add('visible');
        this._taglineIdx++;
      };

      show();
      this._taglineInterval = setInterval(() => {
        el.classList.remove('visible');
        setTimeout(show, 600);
      }, 5000);
    },

    _stopTaglineRotation() {
      if (this._taglineInterval) {
        clearInterval(this._taglineInterval);
        this._taglineInterval = null;
      }
    },

    // ============================================================
    // SHIFT TIMER WARNINGS
    // ============================================================

    _updateShiftTimerWarning(gameTime) {
      const timeEl = document.getElementById('game-time');
      if (!timeEl) return;
      const shiftStart = this.sim ? this.sim.shiftStartTime || 360 : 360;
      const shiftDuration = this.sim ? this.sim.shiftDurationMinutes || 480 : 480;
      const shiftEnd = shiftStart + shiftDuration;
      const minsLeft = shiftEnd - gameTime;

      if (minsLeft <= 30 && minsLeft > 10) {
        timeEl.classList.add('time-warning');
        timeEl.classList.remove('time-critical');
      } else if (minsLeft <= 10 && minsLeft > 0) {
        timeEl.classList.remove('time-warning');
        timeEl.classList.add('time-critical');
      } else {
        timeEl.classList.remove('time-warning', 'time-critical');
      }
    },

    // ============================================================
    // ENHANCED P&L DISPLAY
    // ============================================================

    _updatePnlColors() {
      const rateEl = document.getElementById('pnl-rate');
      const shiftEl = document.getElementById('shift-earnings');
      if (!this.pnlSystem) return;

      if (rateEl) {
        const net = this.pnlSystem.netPerHour;
        rateEl.classList.toggle('pnl-positive', net >= 0);
        rateEl.classList.toggle('pnl-negative', net < 0);
      }
      if (shiftEl) {
        const shift = this.pnlSystem.shiftEarnings;
        shiftEl.classList.toggle('pnl-positive', shift >= 0);
        shiftEl.classList.toggle('pnl-negative', shift < 0);
      }
    },

    // ============================================================
    // ACHIEVEMENT TRACKING (per-tick flags)
    // ============================================================

    _trackAchievementFlags() {
      if (!this.sim || !this.pnlSystem) return;
      const pvMap = this.sim.getAllPVs();

      // RVP tracking
      const rvp = pvMap['AI-501'] || pvMap['AI-704'];
      if (rvp) {
        const val = rvp.displayValue();
        if (val < 9.0 || val > 11.5) this._rvpInSpecEntireShift = false;
      }

      // BTEX tracking
      if (this.pnlSystem.penaltyReasons && this.pnlSystem.penaltyReasons.includes('BTEX VIOLATION')) {
        this._noBtexPenalties = false;
      }

      // NGL recovery tracking (92%+ for Cryo God)
      const eth = pvMap['AI-701'] || pvMap['AI-502'];
      if (eth && eth.displayValue() < 92) {
        this._highRecoveryEntireShift = false;
      }

      // Check if expander was tamed (tripped and recovered)
      const expander = this.currentFacility === 'cryogenic' && this.equipment['EX-400'];
      if (expander) {
        if (expander.status === 'running' && expander._wasTripped) {
          this._expanderTamed = true;
        }
      }

      // Check compressor trip recovery time (in game-minutes)
      const compressor = this.equipment['C-100'] || this.equipment['C-200'];
      if (compressor && compressor.status === 'running' && this._compTripStartTime) {
        const gameTime = this.sim.gameTimeMinutes;
        const recoveryMinutes = gameTime - this._compTripStartTime;
        if (recoveryMinutes <= 8) this._compRecoveredUnder8Min = true;
        this._compTripStartTime = null;
      }

      // Check crisis recovery time
      if (this.currentMode === 'crisis' && !this._crisisRecoveryTime && this.eventSystem) {
        if (this.eventSystem.activeEvents.length === 0 && this.eventSystem.eventHistory.length > 0) {
          this._crisisRecoveryTime = this.sim.shiftElapsed;
        }
      }
    },

    // ============================================================
    // NEW SCREEN METHODS
    // ============================================================

    _showProfileScreen() {
      if (!this.operatorProfile) return;
      const content = document.getElementById('profile-content');
      if (content) {
        content.innerHTML = this.operatorProfile.render();
        const closeBtn = document.getElementById('profile-close-btn');
        if (closeBtn) {
          closeBtn.onclick = () => this._showScreen('title-screen');
        }
      }
      this._showScreen('profile-screen');
    },

    _takeSnapshot() {
      // Generate a quick in-game snapshot image
      const gameScreen = document.getElementById('game-screen');
      if (!gameScreen) return;
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 340;
      const ctx = canvas.getContext('2d');

      // Draw dark background
      ctx.fillStyle = '#1E1E1E';
      ctx.fillRect(0, 0, 600, 340);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 596, 336);

      // Header
      ctx.fillStyle = '#E8E8E8';
      ctx.font = 'bold 16px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('COLD CREEK GAS PLANT', 300, 30);

      ctx.font = '10px Courier New';
      ctx.fillStyle = '#999';
      const facility = (this.currentFacility || 'stabilizer').toUpperCase();
      const mode = (this.currentMode || 'operate').toUpperCase();
      ctx.fillText(`${facility} | ${mode} MODE`, 300, 48);

      // Time
      const time = this.sim ? this.sim.getTimeString() : '06:00';
      const shift = this.sim ? this.sim.getShiftLabel() : 'DAY SHIFT';
      ctx.fillText(`${time} ${shift}`, 300, 65);

      // P&L
      const earnings = this.pnlSystem ? Math.round(this.pnlSystem.shiftEarnings) : 0;
      const rate = this.pnlSystem ? Math.round(this.pnlSystem.netPerHour) : 0;
      ctx.font = 'bold 28px Courier New';
      ctx.fillStyle = earnings >= 0 ? '#4CAF50' : '#E04040';
      ctx.fillText('$' + earnings.toLocaleString(), 300, 120);

      ctx.font = '12px Courier New';
      ctx.fillStyle = rate >= 0 ? '#4CAF50' : '#E04040';
      ctx.fillText('$' + rate.toLocaleString() + '/hr', 300, 142);

      // Active alarms
      const alarmCount = this.alarmManager ? (this.alarmManager.alarms || []).length : 0;
      ctx.fillStyle = alarmCount > 0 ? '#E04040' : '#4CAF50';
      ctx.fillText(alarmCount + ' ALARMS', 300, 170);

      // Watermark
      ctx.font = '9px Courier New';
      ctx.fillStyle = '#555';
      ctx.fillText('gasplantsim.com', 300, 330);

      canvas.toBlob(blob => {
        if (!blob) return;
        const file = new File([blob], 'coldcreek-snapshot.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: 'Cold Creek Snapshot' }).catch(() => {});
          this.showToast('SHARED', 'Snapshot shared!', 'SNAPSHOT');
        } else {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'coldcreek-snapshot.png';
          a.click();
          URL.revokeObjectURL(a.href);
          this.showToast('DOWNLOADED', 'Snapshot saved!', 'SNAPSHOT');
        }
      }, 'image/png');
    },

    _showGlossaryPopup() {
      if (!this.glossary) return;
      const content = document.getElementById('glossary-content');
      if (content) content.innerHTML = this.glossary.renderFullGlossary();
      const popup = document.getElementById('glossary-popup');
      if (popup) popup.style.display = '';
    },

    _showDebriefScreen(earnings) {
      if (!this.debriefScreen) {
        // Fallback to original objectives results
        this._showObjectivesResults(earnings);
        return;
      }

      const overlay = document.getElementById('debrief-overlay');
      if (!overlay) return;

      overlay.innerHTML = this.debriefScreen.render(this);
      overlay.style.display = 'flex';

      // Draw the P&L chart after DOM is ready
      setTimeout(() => this.debriefScreen.drawChart(), 50);

      // Bind action buttons (use onclick to avoid listener accumulation)
      const doneBtn = document.getElementById('debrief-done-btn');
      if (doneBtn) {
        doneBtn.onclick = () => {
          overlay.style.display = 'none';
          this._showScreen('title-screen');
          this._updateContinueButton();
        };
      }

      const profileBtn = document.getElementById('debrief-profile-btn');
      if (profileBtn) {
        profileBtn.onclick = () => {
          overlay.style.display = 'none';
          this._showProfileScreen();
        };
      }

      const shareBtn = document.getElementById('debrief-share-btn');
      if (shareBtn) {
        shareBtn.onclick = async () => {
          shareBtn.textContent = 'GENERATING...';
          shareBtn.disabled = true;
          try {
            const result = await this.debriefScreen.shareAsImage(this);
            if (result === 'shared') {
              this.showToast('SHARED', 'Shift debrief shared!', 'SHARE');
            } else if (result === 'downloaded') {
              this.showToast('DOWNLOADED', 'Shift image saved! Share it on social media.', 'SHARE');
            } else if (result === 'copied') {
              this.showToast('COPIED TO CLIPBOARD', 'Share your shift results!', 'SHARE');
            }
          } catch (e) { /* ok */ }
          shareBtn.textContent = 'SHARE SHIFT';
          shareBtn.disabled = false;
        };
      }
    },

    _showPromotionOverlay(rank) {
      const overlay = document.getElementById('promotion-overlay');
      if (!overlay) return;
      const titleEl = document.getElementById('promotion-rank');
      const lineEl = document.getElementById('promotion-line');
      if (titleEl) {
        titleEl.textContent = rank.title;
        titleEl.style.color = rank.color || '#FFD700';
      }
      if (lineEl) lineEl.textContent = rank.radioLine || '';
      overlay.style.display = 'flex';

      const dismissBtn = document.getElementById('promotion-dismiss');
      if (dismissBtn) {
        dismissBtn.onclick = () => {
          overlay.style.display = 'none';
        };
      }

      // Auto-dismiss after 6 seconds
      setTimeout(() => { overlay.style.display = 'none'; }, 6000);
    },

    // ============================================================
    // BUILDING TAB OVERFLOW CHECK
    // ============================================================

    _checkBuildingTabOverflow() {
      const tabBar = document.getElementById('building-tabs');
      if (!tabBar) return;
      const hasOverflow = tabBar.scrollWidth > tabBar.clientWidth;
      const atEnd = tabBar.scrollLeft + tabBar.clientWidth >= tabBar.scrollWidth - 2;
      tabBar.classList.toggle('has-overflow', hasOverflow && !atEnd);
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
