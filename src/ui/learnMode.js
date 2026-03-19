/**
 * LearnMode — Guided walkthrough with Henry the mascot.
 * Follows the Stabilizer School progression: Day 1 through Day 5.
 * Henry delivers the lessons with personality and highlights key equipment.
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

    // Active waitFor listener cleanup
    this._waitCleanup = null;

    this.lessons = this._buildLessons();

    this.nextBtn.addEventListener('click', () => this._nextStep());
  }

  _buildLessons() {
    return {
      1: { // Day 1 — Observe
        title: 'DAY 1 — OBSERVE',
        steps: [
          {
            text: "Welcome to Stabilizer School, greenhorn. I'm Henry. Been running gas plants since before you were born.\n\nBefore you touch anything, let me show you what you're looking at.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Center of your screen — that's the P&ID. Piping and Instrumentation Diagram. Every vessel, valve, exchanger, and instrument. This is the same document real operators stare at for 12-hour shifts.",
            highlight: 'pid-diagram',
            mood: 'teaching'
          },
          {
            text: "Left panel — process values in DCS format. Each tag follows ISA standard: TIC-102 means Temperature Indicator Controller, loop 102. That 'C' is important — means you can control it.",
            highlight: 'left-panel',
            mood: 'teaching'
          },
          {
            text: "Flow starts at the PIG RECEIVER. Liquid arrives from the pipeline when a pig pushes it through. Enters the INLET SEPARATOR (V-100) — gas goes up, liquid goes down. Simple physics.",
            highlight: 'equip-pig-receiver',
            mood: 'normal'
          },
          {
            text: "Liquid flows through the PRE-HEAT EXCHANGER (E-101) — picks up heat from tower overhead gas. Free energy. Then through the HOT OIL EXCHANGER (E-102) for the real heating.",
            highlight: 'equip-preheat',
            mood: 'teaching'
          },
          {
            text: "The REBOILER (E-103) — your main control point. This is where you earn your paycheck. Apply heat to flash off light ends from the heavier condensate. Too much heat? Product goes to gas. Too little? Tank pops off.",
            highlight: 'equip-reboiler',
            mood: 'alert'
          },
          {
            text: "PACKED TOWER (T-100). Hot vapor rises through packed beds, liquid falls. Light ends exit the top as overhead gas. Heavy condensate — that's your money — exits the bottom.",
            highlight: 'equip-tower',
            mood: 'teaching'
          },
          {
            text: "Overhead gas hits the COMPRESSOR (C-100), goes to sales gas pipeline. Condensate product flows to the PRODUCT TANK (TK-100) for truck loading. That's the whole flow path.",
            highlight: 'equip-comp',
            mood: 'normal'
          },
          {
            text: "RVP — Reid Vapor Pressure, tag AI-501. This is THE number. Tells you if your product is in spec. 9.0 to 11.5 psi. Too high means light ends in the tank — that's a pop-off. Too low means you're giving product away.",
            highlight: 'g-ai-501',
            mood: 'alert'
          },
          {
            text: "Right panel — SPEC BOARD and P&L. Every mistake costs money. Every good decision makes money. In-spec product? Revenue. Off-spec? Penalties. This is how the real industry keeps score.",
            highlight: 'right-panel',
            mood: 'teaching'
          },
          {
            text: "Day 1 done. You know the flow path now. That's more than most people learn in their first week.\n\nTomorrow — I'll teach you to control the reboiler.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      2: { // Day 2 — Control the Reboiler
        title: 'DAY 2 — CONTROL THE REBOILER',
        steps: [
          {
            text: "Today you learn the most important control in this plant: reboiler temperature, TIC-102.\n\nClick any instrument tag — left panel or P&ID — to open its FACEPLATE.",
            highlight: 'g-tic-102',
            mood: 'teaching',
            waitFor: { event: 'faceplate:open', match: { tag: 'TIC-102' } }
          },
          {
            text: "Faceplate shows: PV (what it reads now), SP (your target), OUT (how open the control valve is), and MODE (AUTO or MAN).\n\nThis is your cockpit for each loop.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "AUTO mode — the controller handles the valve to hold your SP. MAN mode — you drive the valve yourself. New operators stay in AUTO. Once you've got the feel... MAN is faster.",
            highlight: null,
            mood: 'normal'
          },
          {
            text: "Try it. Click TIC-102, change SP to 305, hit APPLY.\n\nWatch the PV trend up. Notice the RVP start to drop — more heat means more light ends flashed off. That's the cause and effect.",
            highlight: 'g-tic-102',
            action: 'enable-controls',
            mood: 'teaching',
            waitFor: { event: 'faceplate:apply', match: { tag: 'TIC-102', sp: 305, tolerance: 3 } }
          },
          {
            text: "See the TREND ARROW next to each value? Rising arrow means going up. Double arrow means going fast. Rate of change matters more than current value — it tells you WHERE things are heading.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Set reboiler SP back to 300. Watch the lag — there's always a delay between your move and the result. During an upset, this lag is the difference between a good operator and a plant trip.",
            highlight: null,
            mood: 'alert',
            waitFor: { event: 'faceplate:apply', match: { tag: 'TIC-102', sp: 300, tolerance: 3 } }
          },
          {
            text: "Good work. You can control the reboiler now.\n\nTomorrow... your first pig arrives. That's where it gets interesting.",
            highlight: null,
            action: 'complete-day2',
            mood: 'happy'
          }
        ]
      },
      3: { // Day 3 — First Pig
        title: 'DAY 3 — FIRST PIG',
        steps: [
          {
            text: "A pig — a device that runs through the pipeline to clean it and push liquids ahead. When it arrives, a massive slug of liquid hits your separator at once.\n\nThis is the #1 challenge for new operators.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "Watch the NPC RADIO panel. Pipeline control will warn you when a pig launches. You'll have about 20 minutes to prepare. Watch LIC-302 — separator level — it WILL spike when the pig hits.",
            highlight: 'g-lic-302',
            mood: 'teaching'
          },
          {
            text: "When alarms fire, click ACK on the alarm bar. That acknowledges the alarm and lets you focus. Don't panic — alarms are information, not emergencies. Unless they're HIHI. Then move fast.",
            highlight: 'alarm-bar',
            mood: 'teaching'
          },
          {
            text: "Your plan: Ramp up FIC-401 (feed flow) to pull liquid off the separator faster. Ramp reboiler heat UP — more liquid needs more heat to hold RVP. If you're slow, RVP goes bad.",
            highlight: 'g-fic-401',
            mood: 'alert'
          },
          {
            text: "Alright, I'm turning the sim on. Pig arrives in about 20 minutes. Hit 1x to start the clock.\n\nHold RVP in spec through the whole event. I'll be watching.",
            highlight: null,
            action: 'start-pig-scenario',
            mood: 'normal'
          }
        ]
      },
      4: { // Day 4 — Something Goes Wrong
        title: 'DAY 4 — SOMETHING GOES WRONG',
        steps: [
          {
            text: "Today you learn what separates operators from button-pushers.\n\nDuring a pig arrival, the hot oil system is going to have a problem. Heat drops. Tower floods. Things cascade.",
            highlight: null,
            mood: 'worried'
          },
          {
            text: "When something breaks, your instinct is to stare at the thing that's alarming. Don't. Look at the P&ID. Trace the flow. Ask: what feeds into the thing that's failing?\n\nThat's where the root cause lives.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Hot oil → reboiler → tower feed. Hot oil drops? Reboiler temp drops. Reboiler drops? Less flash-off. Less flash-off? RVP rises. RVP rises? Tower sump rises. Tower floods.\n\nSee the chain?",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "If TIC-102 is dropping and you haven't touched anything — check TIC-104 (hot oil supply) FIRST. If hot oil is the problem, adjusting the reboiler setpoint won't help. Fix the source.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "EVENTS section in the right panel shows active events with action buttons — REPAIR HEATER, RESTART COMP, ISSUE PERMIT. Those are your tools.",
            highlight: 'event-status',
            mood: 'teaching'
          },
          {
            text: "Here we go. Pig plus hot oil fault. Find the problem. Fix it. Recover.\n\nClick REPAIR HEATER when you find it. I believe in you.",
            highlight: null,
            action: 'start-fault-scenario',
            mood: 'normal'
          }
        ]
      },
      5: { // Day 5 — Graduation
        title: 'DAY 5 — GRADUATION',
        steps: [
          {
            text: "Final exam. Full shift. Two pigs scheduled. One instrument fault somewhere. A truck will show up for loading.\n\nHold RVP in spec. Keep the lights on. Make money.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "Everything you've learned: reboiler control, pig management, cascade troubleshooting, reading trends, tracing the P&ID.\n\nIt all comes together now.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Pass this shift with positive P&L and no ESD events. Your shift earnings go on the leaderboard.\n\nShow me what you've got.",
            highlight: null,
            mood: 'normal'
          },
          {
            text: "The plant tells you something is wrong before it goes wrong. The job is learning to listen.\n\nGood luck, operator. Make me proud.",
            highlight: null,
            action: 'start-graduation',
            mood: 'happy'
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
    this._clearWaitFor();
    this.active = false;
    this.overlay.style.display = 'none';
    // Hide Henry if he's showing a tutorial
    if (this.game.henry) {
      this.game.henry.hide();
    }
  }

  _showStep() {
    // Clean up any previous waitFor listener
    this._clearWaitFor();

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

    // Use Henry if available, otherwise fall back to overlay
    if (this.game.henry) {
      this.overlay.style.display = 'none';

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

      const isLast = this.currentStep >= dayData.steps.length - 1;
      const btnLabel = isLast ? (step.action ? 'START' : 'COMPLETE') : 'NEXT';

      // Build button list: main action + skip
      const buttons = [
        { label: btnLabel, callback: () => this._nextStep(), action: 'dismiss' }
      ];
      // Add SKIP button (unless this is the very last step of the last day)
      if (!(this.currentDay === 5 && isLast)) {
        buttons.push({ label: 'SKIP TUTORIAL', callback: () => this._skipTutorial(), action: 'dismiss' });
      }

      this.game.henry.show({
        text: step.text,
        mood: step.mood || 'teaching',
        position: 'right',
        duration: 0,
        type: 'tutorial',
        buttons: buttons
      });

      // Set up waitFor auto-advance if this step has a condition
      if (step.waitFor) {
        this._setupWaitFor(step.waitFor);
      }
    } else {
      // Fallback: original overlay
      this.overlay.style.display = 'flex';
      this.titleEl.textContent = dayData.title;
      this.textEl.textContent = step.text;

      if (this.currentStep >= dayData.steps.length - 1) {
        this.nextBtn.textContent = step.action ? 'START' : 'COMPLETE';
      } else {
        this.nextBtn.textContent = 'NEXT';
      }

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
  }

  /**
   * Set up a DOM event listener that auto-advances the tutorial when the
   * player completes the requested action.
   */
  _setupWaitFor(waitFor) {
    const handler = (e) => {
      const detail = e.detail || {};
      const match = waitFor.match || {};
      let matched = true;

      // Check tag match
      if (match.tag && detail.tag !== match.tag) matched = false;

      // Check SP match with optional tolerance
      if (match.sp != null && detail.sp != null) {
        const tolerance = match.tolerance || 0;
        if (Math.abs(detail.sp - match.sp) > tolerance) matched = false;
      }

      if (matched) {
        // Henry nods to acknowledge the player's action
        if (this.game.henry) {
          this.game.henry.nod();
        }
        // Small delay so the player sees the nod before advancing
        setTimeout(() => this._nextStep(), 600);
      }
    };

    document.addEventListener(waitFor.event, handler);
    this._waitCleanup = () => {
      document.removeEventListener(waitFor.event, handler);
    };
  }

  /**
   * Remove any active waitFor listener.
   */
  _clearWaitFor() {
    if (this._waitCleanup) {
      this._waitCleanup();
      this._waitCleanup = null;
    }
  }

  /**
   * Skip the entire tutorial — unpause sim and clean up.
   */
  _skipTutorial() {
    this._clearWaitFor();
    this._clearHighlights();
    this.overlay.style.display = 'none';
    this.active = false;

    // Unpause the simulation so the player can play freely
    if (this.game.sim) this.game.sim.setSpeed(1);

    if (this.game.henry) {
      this.game.henry.hide();
      setTimeout(() => {
        this.game.henry.show({
          text: "Alright, you want to learn the hard way. I respect that.\n\nI'll still be around if things go sideways.",
          mood: 'happy',
          position: 'right',
          duration: 8000,
          type: 'tip'
        });
      }, 400);
    }
  }

  _nextStep() {
    this._clearWaitFor();

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

    if (this.game.henry) {
      this.game.henry.hide();
    }

    if (this.currentDay < 5) {
      this.game.saveProgress({ [`day${this.currentDay}Complete`]: true });
      this._showQuiz(this.currentDay);
    } else {
      this.game.saveProgress({ stabilizerComplete: true });
      this._showCertificate();
    }
  }

  _showQuiz(day) {
    const quizzes = {
      1: {
        question: "What does RVP stand for?",
        options: ['Reid Vapor Pressure', 'Reduced Valve Position', 'Residual Volume Percent', 'Reboiler Vent Pressure'],
        correct: 0,
        explanation: "RVP — Reid Vapor Pressure. It measures how easily a liquid evaporates. Your main product spec."
      },
      2: {
        question: "If reboiler temp (TIC-102) drops, what happens to RVP?",
        options: ['RVP goes down', 'RVP goes up', 'No change', 'RVP oscillates'],
        correct: 1,
        explanation: "Lower reboiler temp = less light ends flashed off = more volatiles in product = higher RVP."
      },
      3: {
        question: "During a pig arrival, which is the FIRST thing to watch?",
        options: ['Tower overhead temp', 'Separator level (LIC-302)', 'Product tank level', 'Compressor discharge'],
        correct: 1,
        explanation: "Separator level spikes first when the pig hits. If you're not watching LIC-302, you'll miss the surge."
      },
      4: {
        question: "Hot oil supply temp drops unexpectedly. Where do you look first?",
        options: ['The compressor', 'The product tank', 'TIC-104 — Hot Oil Supply', 'The overhead temp'],
        correct: 2,
        explanation: "Trace upstream! TIC-104 is the hot oil supply. If it's dropping, that's your root cause."
      }
    };

    const quiz = quizzes[day];
    if (!quiz || !this.game.henry) {
      this._postQuizAdvance(day);
      return;
    }

    let quizHtml = `<strong>POP QUIZ — Day ${day}</strong>\n\n${quiz.question}\n\n`;
    quiz.options.forEach((opt, i) => {
      quizHtml += `${String.fromCharCode(65 + i)}) ${opt}\n`;
    });

    const buttons = quiz.options.map((opt, i) => ({
      label: String.fromCharCode(65 + i),
      callback: () => {
        const correct = i === quiz.correct;
        setTimeout(() => {
          this.game.henry.show({
            text: correct
              ? `Correct! ${quiz.explanation}\n\nDay ${day} complete. Ready for Day ${day + 1}?`
              : `Not quite — the answer is ${String.fromCharCode(65 + quiz.correct)}.\n\n${quiz.explanation}\n\nDay ${day} complete. Ready for Day ${day + 1}?`,
            mood: correct ? 'happy' : 'teaching',
            position: 'right',
            duration: 0,
            type: 'announcement',
            buttons: [
              { label: `START DAY ${day + 1}`, callback: () => this.start(day + 1), action: 'dismiss' },
              { label: 'LATER', action: 'dismiss' }
            ]
          });
        }, 300);
      },
      action: 'dismiss'
    }));

    setTimeout(() => {
      this.game.henry.show({
        text: quizHtml,
        mood: 'teaching',
        position: 'right',
        duration: 0,
        type: 'tutorial',
        buttons: buttons
      });
    }, 500);
  }

  _postQuizAdvance(day) {
    if (this.game.henry) {
      setTimeout(() => {
        this.game.henry.show({
          text: `Day ${day} complete. You're getting the hang of this.\n\nReady for Day ${day + 1}?`,
          mood: 'happy',
          position: 'right',
          duration: 0,
          type: 'announcement',
          buttons: [
            { label: `START DAY ${day + 1}`, callback: () => this.start(day + 1), action: 'dismiss' },
            { label: 'LATER', action: 'dismiss' }
          ]
        });
      }, 500);
    }
  }

  _showCertificate() {
    const username = localStorage.getItem('coldcreek-username') || 'OPERATOR';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const certDiv = document.createElement('div');
    certDiv.className = 'learn-certificate-overlay';
    certDiv.innerHTML = `
      <div class="learn-certificate">
        <div class="cert-border">
          <div class="cert-header">COLD CREEK GAS PROCESSING</div>
          <div class="cert-title">CERTIFICATE OF COMPLETION</div>
          <div class="cert-body">
            This certifies that
            <div class="cert-name">${username}</div>
            has successfully completed the
            <div class="cert-course">STABILIZER OPERATOR TRAINING PROGRAM</div>
            under the supervision of Henry, Senior Operator
          </div>
          <div class="cert-date">${date}</div>
          <div class="cert-signature">
            <div class="cert-sig-line"></div>
            <div class="cert-sig-name">Henry — Senior Operator</div>
          </div>
          <div class="cert-footer">"The plant tells you something is wrong before it goes wrong."</div>
          <button class="menu-btn cert-close-btn" id="cert-close-btn">CONTINUE</button>
        </div>
      </div>
    `;
    document.body.appendChild(certDiv);

    document.getElementById('cert-close-btn').addEventListener('click', () => {
      certDiv.remove();
      if (this.game.henry) {
        setTimeout(() => {
          this.game.henry.show({
            text: "You graduated Stabilizer School. Not bad, greenhorn.\n\nRefrigeration Plant and Cryogenic are unlocked.",
            mood: 'happy',
            position: 'right',
            duration: 0,
            type: 'announcement',
            buttons: [{ label: 'THANKS, HENRY', action: 'dismiss' }]
          });
        }, 400);
      }
    });
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
