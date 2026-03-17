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

    currentScreen: 'title-screen',
    currentMode: null,    // learn, operate, crisis, optimize
    currentFacility: null, // stabilizer, refrigeration, cryogenic

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
      this._loadProgress();
      this._bindScreenNav();
      this._bindTimeControls();
      this._updateContinueButton();
      this._showScreen('title-screen');
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
          this._showScreen('facility-screen');
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

      // Building tabs
      document.querySelectorAll('.building-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.building-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          // Building tab switching would show different P&ID views
          // For MVP, all shown on one view
        });
      });

      // Settings
      const timeComp = document.getElementById('setting-timecomp');
      if (timeComp) {
        timeComp.addEventListener('change', () => {
          if (this.sim) {
            this.sim.timeCompression = parseInt(timeComp.value);
          }
        });
      }
    },

    _showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const screen = document.getElementById(screenId);
      if (screen) screen.classList.add('active');
      this.currentScreen = screenId;
    },

    _updateContinueButton() {
      const btn = document.getElementById('btn-continue');
      if (btn) {
        btn.style.display = this.progress.hasGameState ? '' : 'none';
      }
    },

    // ============================================================
    // GAME START
    // ============================================================

    _startGame() {
      this._showScreen('game-screen');

      // Update topbar labels
      document.getElementById('plant-name').textContent =
        this.currentFacility === 'stabilizer' ? 'STABILIZER' :
        this.currentFacility === 'refrigeration' ? 'REFRIG PLANT' : 'GARDEN CREEK';
      document.getElementById('game-mode-label').textContent =
        (this.currentMode || 'OPERATE').toUpperCase();

      // Initialize simulation
      this._initSimulation();

      // Initialize UI managers
      this.gaugeManager = new GaugeManager(this.sim);
      this.faceplateManager = new FaceplateManager(this.sim);
      this.alarmManager = new AlarmManager();
      this.pidDiagram = new PidDiagram(this.sim);
      this.learnMode = new LearnMode(this);

      // Connect alarm callback
      this.sim.onAlarm = (report) => {
        this.alarmManager.onAlarmChange(report);
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

      // Set up UI update loop (separate from sim tick for smoother rendering)
      this.sim.onTick = (dt, gameTime) => {
        this._onSimTick(dt, gameTime);
      };

      // Start in appropriate mode
      if (this.currentMode === 'learn') {
        this.learnMode.start(1);
      } else {
        // Operate mode — start paused
        this.sim.pause();
      }
    },

    _initSimulation() {
      const config = StabilizerConfig; // Only stabilizer for MVP

      // Create simulation tick system
      this.sim = new SimulationTick();

      // Register process variables
      for (const pvConfig of config.processVariables) {
        const pv = new ProcessVariable(pvConfig);
        this.sim.registerPV(pv);
      }

      // Set up cascade rules
      for (const rule of config.cascadeRules) {
        this.sim.cascadeEngine.addRule(rule);
      }

      // Initialize valves
      this.valves = {};
      for (const [id, v] of Object.entries(config.valves)) {
        this.valves[id] = { ...v };
      }

      // Initialize equipment
      this.equipment = {};
      for (const [id, e] of Object.entries(config.equipment)) {
        this.equipment[id] = { ...e };
      }

      // Weather
      this.weather = { ...config.weather };

      // Set up event system
      this.eventSystem = new EventSystem();
      registerPigEvents(this.eventSystem);
      registerEquipmentEvents(this.eventSystem);
      this.sim.eventSystem = this.eventSystem;

      // Set up P&L system
      this.pnlSystem = new PnlManager({
        ...config.economics,
        specs: config.specs.rvp
      });
      this.sim.pnlSystem = this.pnlSystem;

      // Time compression from settings
      const timeComp = document.getElementById('setting-timecomp');
      if (timeComp) {
        this.sim.timeCompression = parseInt(timeComp.value);
      }
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
      if (this.pnlSystem) this.pnlSystem.updateSpecBoard(this.sim.getAllPVs());

      // Update event display
      this._updateEventDisplay();

      // Update weather display
      this._updateWeatherDisplay();
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
    },

    // ============================================================
    // EVENT HANDLING
    // ============================================================

    _onEventStart(event) {
      if (event.severity !== 'hidden' && event.severity !== 'info') {
        this.alarmManager.addEventAlarm(event.id, event.name, event.severity);
      }
      this._updateEventDisplay();
    },

    _onEventEnd(event) {
      this.alarmManager.removeEventAlarm(event.id);
      this._updateEventDisplay();
    },

    _updateEventDisplay() {
      const eventBlock = document.getElementById('event-status');
      if (!this.eventSystem) return;

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

      // Remove 'new' class after a few seconds
      setTimeout(() => msgEl.classList.remove('new'), 5000);

      // Limit log length
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
    // SAVE / LOAD
    // ============================================================

    saveProgress(updates) {
      Object.assign(this.progress, updates);
      this.progress.hasGameState = true;
      try {
        localStorage.setItem('coldcreek-progress', JSON.stringify(this.progress));
      } catch (e) {
        // Storage unavailable
      }
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
      } catch (e) {
        // Storage unavailable
      }
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
    }
  };

  // ============================================================
  // BOOT
  // ============================================================

  // Make game globally accessible for inter-module communication
  window.coldCreekGame = Game;

  // Initialize when DOM is ready
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
