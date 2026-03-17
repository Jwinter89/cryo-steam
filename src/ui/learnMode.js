/**
 * LearnMode — Guided walkthrough of the stabilizer with tooltips and P&ID overlays.
 * Follows the Stabilizer School progression: Day 1 through Day 5.
 */

class LearnMode {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.currentDay = 1;
    this.currentStep = 0;
    this.overlay = document.getElementById('learn-overlay');
    this.titleEl = document.getElementById('learn-title');
    this.textEl = document.getElementById('learn-text');
    this.nextBtn = document.getElementById('learn-next');

    this.lessons = this._buildLessons();

    this.nextBtn.addEventListener('click', () => this._nextStep());
  }

  _buildLessons() {
    return {
      1: { // Day 1 — Observe
        title: 'DAY 1 — OBSERVE',
        steps: [
          {
            text: 'Welcome to Stabilizer School. You are standing in the control room of a natural gas liquids stabilizer facility. Before you touch anything, you need to understand what you are looking at.',
            highlight: null
          },
          {
            text: 'The center of your screen shows the P&ID — the Piping and Instrumentation Diagram. Every vessel, valve, exchanger, and instrument is shown here. This is the same document a real operator uses to understand the plant.',
            highlight: 'pid-diagram'
          },
          {
            text: 'On the left panel, you see process values displayed in DCS format. Each tag follows the ISA standard: TIC-102 means Temperature Indicator Controller, loop number 102. The "C" means this instrument can be controlled — you can change its setpoint.',
            highlight: 'left-panel'
          },
          {
            text: 'The flow path starts at the PIG RECEIVER (top left of the P&ID). Liquid arrives from the pipeline when a pig pushes it through. This liquid enters the INLET SEPARATOR (V-100), where gas and liquid separate.',
            highlight: 'equip-pig-receiver'
          },
          {
            text: 'Liquid flows from the separator through the PRE-HEAT EXCHANGER (E-101), where it picks up heat from the tower overhead gas. Then through the HOT OIL EXCHANGER (E-102) for more heating.',
            highlight: 'equip-preheat'
          },
          {
            text: 'The heated liquid enters the REBOILER (E-103) — this is your primary control point. The reboiler applies heat to flash off light ends (methane, ethane) from the heavier condensate product.',
            highlight: 'equip-reboiler'
          },
          {
            text: 'The PACKED TOWER (T-100) is where separation happens. Hot vapor rises through packed bed sections while liquid falls. Light ends exit the top as overhead gas. Heavy condensate product exits the bottom.',
            highlight: 'equip-tower'
          },
          {
            text: 'Overhead gas goes to the COMPRESSOR (C-100), which sends it to the sales gas pipeline. Condensate product flows to the PRODUCT TANK (TK-100) for truck loading.',
            highlight: 'equip-comp'
          },
          {
            text: 'The key measurement is RVP — Reid Vapor Pressure (tag AI-501). This tells you if your product is in spec. Too high = too many light ends still in product (tank pop-off risk). Too low = you are losing valuable product to the gas stream.',
            highlight: 'g-ai-501'
          },
          {
            text: 'The right panel shows your SPEC BOARD and P&L. Every action has a dollar consequence. In-spec product earns revenue. Off-spec product costs money. This is how the real industry measures plant performance.',
            highlight: 'right-panel'
          },
          {
            text: 'Day 1 complete. You now understand the flow path. Tomorrow, you will learn to control the reboiler.',
            highlight: null
          }
        ]
      },
      2: { // Day 2 — Control the Reboiler
        title: 'DAY 2 — CONTROL THE REBOILER',
        steps: [
          {
            text: 'Today you learn your most important control: the reboiler temperature (TIC-102). Click on any instrument tag — either in the left panel or on the P&ID — to open its FACEPLATE.',
            highlight: 'g-tic-102'
          },
          {
            text: 'The faceplate shows: PV (process value — what it reads now), SP (setpoint — your target), OUT (output — how open the control valve is), and MODE (AUTO or MAN).',
            highlight: null
          },
          {
            text: 'In AUTO mode, the controller adjusts the valve automatically to hold the SP. In MAN (manual) mode, you control the valve position directly. New operators start in AUTO. Experts use MAN for faster response.',
            highlight: null
          },
          {
            text: 'Try adjusting the reboiler setpoint. Click TIC-102, change the SP to 305, and click APPLY. Watch the PV trend upward. Notice the RVP starts to drop — more heat means more light ends removed from product.',
            highlight: 'g-tic-102',
            action: 'enable-controls'
          },
          {
            text: 'Now watch the TREND ARROW next to each value. An upward arrow means the value is rising. A double arrow means it is rising fast. Rate of change matters more than current value — it tells you where things are going.',
            highlight: null
          },
          {
            text: 'Set reboiler SP back to 300. Watch the response lag — there is always a delay between your adjustment and the result. This lag time is critical during upsets. You must learn to anticipate, not just react.',
            highlight: null
          },
          {
            text: 'Day 2 complete. You can now control the reboiler. Tomorrow, your first pig arrives.',
            highlight: null,
            action: 'complete-day2'
          }
        ]
      },
      3: { // Day 3 — First Pig
        title: 'DAY 3 — FIRST PIG',
        steps: [
          {
            text: 'A pig is a device that runs through the pipeline to clean it and push liquids ahead of it. When a pig arrives, a large slug of liquid hits your inlet separator all at once. This is the single biggest challenge for new operators.',
            highlight: null
          },
          {
            text: 'Listen for the NPC RADIO panel (bottom right). Pipeline control will warn you a pig has been launched. You will have about 20 minutes to prepare. Watch LIC-302 (separator level) — it will spike when the pig arrives.',
            highlight: 'g-lic-302'
          },
          {
            text: 'When alarms fire, click the ACK button on the alarm bar at the top. This acknowledges the alarm and opens the faceplate for that tag so you can take action immediately.',
            highlight: 'alarm-bar'
          },
          {
            text: 'Your job: Ramp up FIC-401 (liquid feed flow) setpoint to pull liquid off the separator faster. Also ramp reboiler heat UP — more liquid needs more heat to maintain RVP. If you are too slow, RVP will spike.',
            highlight: 'g-fic-401'
          },
          {
            text: 'The simulation is now running. A pig will arrive in about 20 minutes. Unpause the game (hit 1x) and manage it. Hold RVP in spec (9.0-11.5 psi) through the entire event. Good luck.',
            highlight: null,
            action: 'start-pig-scenario'
          }
        ]
      },
      4: { // Day 4 — Something Goes Wrong
        title: 'DAY 4 — SOMETHING GOES WRONG',
        steps: [
          {
            text: 'Today, you are going to experience your first equipment fault. During a pig arrival, the hot oil system will have a problem. Heat supply will drop. The tower will start to flood.',
            highlight: null
          },
          {
            text: 'When something goes wrong, your first instinct will be to stare at the thing that is alarming. Resist that instinct. Look at the P&ID. Trace the flow. Ask: what feeds into the thing that is failing? That is where the root cause lives.',
            highlight: null
          },
          {
            text: 'Hot oil feeds the reboiler. The reboiler heats the tower feed. If hot oil drops, reboiler temp drops. If reboiler temp drops, less light ends flash off. RVP rises. Tower sump level rises. Eventually: flooding.',
            highlight: null
          },
          {
            text: 'When you see TIC-102 (reboiler) dropping and you have not touched anything — check TIC-104 (hot oil supply) FIRST. If hot oil is the problem, reboiler adjustments alone will not fix it. You need to resolve the source.',
            highlight: null
          },
          {
            text: 'Look at the EVENTS section in the right panel (or tap INFO on mobile). Active events show action buttons — REPAIR HEATER, RESTART COMP, ISSUE PERMIT. These are your tools to resolve equipment faults.',
            highlight: 'event-status'
          },
          {
            text: 'The simulation will now run a pig + hot oil fault scenario. Find the problem. Fix it. Recover. Click REPAIR HEATER in the event panel when you find the hot oil fault. Good luck.',
            highlight: null,
            action: 'start-fault-scenario'
          }
        ]
      },
      5: { // Day 5 — Graduation
        title: 'DAY 5 — GRADUATION',
        steps: [
          {
            text: 'Final exam. Full shift simulation. Two pigs scheduled. One instrument fault will occur at some point. A truck will arrive for loading. Hold RVP in spec for the entire shift to pass.',
            highlight: null
          },
          {
            text: 'Everything you have learned applies now: reboiler control, pig management, pinch valve timing, troubleshooting cascade failures, reading trends, using the P&ID to trace problems to their source.',
            highlight: null
          },
          {
            text: 'Pass this shift with positive P&L and no ESD events to unlock the Refrigeration Plant (Tier 2). Your shift earnings will be tracked on the leaderboard.',
            highlight: null
          },
          {
            text: 'The plant tells you something is wrong before it goes wrong. The job is learning to listen. Good luck, operator.',
            highlight: null,
            action: 'start-graduation'
          }
        ]
      }
    };
  }

  start(day) {
    this.active = true;
    this.currentDay = day || 1;
    this.currentStep = 0;

    // Pause the sim during tutorials
    if (this.game.sim) {
      this.game.sim.pause();
    }

    this._showStep();
  }

  stop() {
    this.active = false;
    this.overlay.style.display = 'none';
  }

  _showStep() {
    const dayData = this.lessons[this.currentDay];
    if (!dayData) {
      this.stop();
      return;
    }

    const step = dayData.steps[this.currentStep];
    if (!step) {
      // Day complete — advance to next day or exit
      this._dayComplete();
      return;
    }

    this.overlay.style.display = 'flex';
    this.titleEl.textContent = dayData.title;
    this.textEl.textContent = step.text;

    // Update button text
    if (this.currentStep >= dayData.steps.length - 1) {
      this.nextBtn.textContent = step.action ? 'START' : 'COMPLETE';
    } else {
      this.nextBtn.textContent = 'NEXT';
    }

    // Highlight element if specified
    this._clearHighlights();
    if (step.highlight) {
      const el = document.getElementById(step.highlight);
      if (el) {
        el.style.outline = '2px solid var(--accent)';
        el.style.outlineOffset = '2px';
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  _nextStep() {
    const dayData = this.lessons[this.currentDay];
    const step = dayData ? dayData.steps[this.currentStep] : null;

    // Execute step action if any
    if (step && step.action) {
      this._executeAction(step.action);
    }

    this.currentStep++;
    this._showStep();
  }

  _executeAction(action) {
    switch (action) {
      case 'enable-controls':
        // Unpause so player can interact
        if (this.game.sim) this.game.sim.setSpeed(1);
        break;

      case 'complete-day2':
        // Save progress
        this.game.saveProgress({ day2Complete: true });
        break;

      case 'start-pig-scenario':
        // Unpause and schedule a pig — give player ~20 minutes to prepare
        if (this.game.sim) this.game.sim.setSpeed(1);
        if (this.game.eventSystem) {
          this.game.eventSystem.scheduleEvent('pig-single', this.game.sim.gameTimeMinutes + 20);
        }
        this.overlay.style.display = 'none';
        break;

      case 'start-fault-scenario':
        if (this.game.sim) this.game.sim.setSpeed(1);
        if (this.game.eventSystem) {
          this.game.eventSystem.scheduleEvent('pig-single', this.game.sim.gameTimeMinutes + 3);
          this.game.eventSystem.scheduleEvent('hot-oil-fault', this.game.sim.gameTimeMinutes + 12);
        }
        this.overlay.style.display = 'none';
        break;

      case 'start-graduation':
        if (this.game.sim) this.game.sim.setSpeed(1);
        if (this.game.eventSystem) {
          // Two pigs + one instrument fault + one truck
          this.game.eventSystem.scheduleEvent('pig-single', this.game.sim.gameTimeMinutes + 30);
          this.game.eventSystem.scheduleEvent('pig-fast', this.game.sim.gameTimeMinutes + 120);
          this.game.eventSystem.scheduleEvent('instrument-freeze', this.game.sim.gameTimeMinutes + 80);
          this.game.eventSystem.scheduleEvent('truck-arrival', this.game.sim.gameTimeMinutes + 200);
        }
        this.overlay.style.display = 'none';
        break;
    }
  }

  _dayComplete() {
    this._clearHighlights();
    this.overlay.style.display = 'none';
    this.active = false;

    // Check if more days available
    if (this.currentDay < 5) {
      this.game.saveProgress({ [`day${this.currentDay}Complete`]: true });
    } else {
      // Graduation
      this.game.saveProgress({ stabilizerComplete: true });
    }
  }

  _clearHighlights() {
    // Remove any highlights
    document.querySelectorAll('[style*="outline"]').forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  }
}

window.LearnMode = LearnMode;
