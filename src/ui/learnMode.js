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

    this.facility = 'stabilizer';
    this.lessons = this._buildLessons(this.facility);

    this.nextBtn.addEventListener('click', () => this._nextStep());
  }

  _buildLessons(facility) {
    if (facility === 'refrigeration') return this._buildRefrigerationLessons();
    if (facility === 'cryogenic') return this._buildCryogenicLessons();
    return this._buildStabilizerLessons();
  }

  _buildStabilizerLessons() {
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

  _buildRefrigerationLessons() {
    return {
      1: { // Day 1 — The Dehy Loop
        title: 'DAY 1 — THE DEHY LOOP',
        steps: [
          {
            text: "Welcome to Refrigeration School. I'm Henry. You passed Stabilizer, so you're not completely hopeless.\n\nThis plant is bigger, colder, and less forgiving. Let's start with dehydration.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Before you chill gas, you MUST dry it. Wet gas in a cold system means hydrates — ice plugs that shut you down. TEG — Triethylene Glycol — absorbs the water.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "TEG CONTACTOR — wet gas enters the bottom, dry glycol enters the top. Counter-current flow. The glycol absorbs water as it falls through the gas. Dry gas exits the top.",
            highlight: 'g-tic-201',
            mood: 'teaching'
          },
          {
            text: "AI-201 — water dewpoint analyzer. This tells you if the gas is dry enough. Target is below -30°F dewpoint for refrigeration service. If this number drifts up, your chiller will hydrate.",
            highlight: 'g-ai-201',
            mood: 'teaching'
          },
          {
            text: "FI-201 — glycol circulation rate. More circulation = dryer gas, but costs energy. Too little = wet gas slips through. It's a balance.",
            highlight: 'g-fi-201',
            mood: 'normal'
          },
          {
            text: "LIC-201 — contactor sump level. Glycol accumulates at the bottom before returning to the reboiler. Lose this level and you lose your glycol to the gas pipeline. Bad day.",
            highlight: 'g-lic-201',
            mood: 'alert'
          },
          {
            text: "The KIMRAY PUMP — a clever piece of engineering. Uses high-pressure gas from the contactor to pump glycol back up to contactor pressure. No electricity needed. Been doing this since the 1950s.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "The TEG REBOILER heats rich glycol to 390-400°F to boil off the absorbed water. Critical rule: NEVER exceed 404°F. TEG decomposes above that temperature and you'll ruin your glycol charge.",
            highlight: 'g-tic-201',
            mood: 'alert'
          },
          {
            text: "Day 1 done. You understand the dehy loop — contactor, reboiler, Kimray pump, and back around. Dry gas goes downstream.\n\nTomorrow we talk about what comes OUT of that reboiler besides water.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      2: { // Day 2 — BTEX & Emissions
        title: 'DAY 2 — BTEX & EMISSIONS',
        steps: [
          {
            text: "The TEG reboiler doesn't just boil off water. It also strips out BTEX — Benzene, Toluene, Ethylbenzene, Xylene. Aromatics. Carcinogens.\n\nThe EPA cares about this. A lot.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "XI-210 — BTEX thermal oxidizer status. This unit burns the BTEX vapors from the still column before they hit atmosphere. If it's running, you're compliant. If it's not... you have a problem.",
            highlight: 'g-xi-210',
            mood: 'teaching'
          },
          {
            text: "The thermal oxidizer has a pilot flame. PIC-401 monitors fuel gas pressure to the pilot. If fuel gas drops below minimum, the pilot goes out. Unburned BTEX goes straight to atmosphere.\n\nThat's an EPA violation. Fines start at $50,000 per day.",
            highlight: 'g-pic-401',
            mood: 'alert'
          },
          {
            text: "AI-401 — stack emissions analyzer. Monitors what's actually coming out. If you see BTEX spikes here with the oxidizer running, your combustion temp is too low. Check TIC-210.",
            highlight: 'g-ai-401',
            mood: 'teaching'
          },
          {
            text: "TIC-210 — oxidizer combustion chamber temperature. Needs to stay above 1400°F to fully destroy BTEX. Below that, you get incomplete combustion and emissions.",
            highlight: 'g-tic-210',
            mood: 'teaching'
          },
          {
            text: "The fuel gas system feeds both the TEG reboiler and the thermal oxidizer. If fuel gas pressure drops, you lose BOTH. No reboiler heat means wet gas. No oxidizer means emissions. Double failure.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "Day 2 complete. BTEX compliance isn't optional — it's the difference between operating and getting shut down.\n\nTomorrow we get cold. Refrigeration loop.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      3: { // Day 3 — Refrigeration Loop
        title: 'DAY 3 — REFRIGERATION LOOP',
        steps: [
          {
            text: "The heart of this plant: propane refrigeration. Same principle as your home AC, but we're chilling gas to -30 or -40°F to knock out heavier hydrocarbons.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "TIC-301 — chiller outlet temperature. This is your money number. Colder = more NGL recovery. But go too cold and you'll freeze up the chiller with hydrates if the dehy isn't perfect.",
            highlight: 'g-tic-301',
            mood: 'teaching'
          },
          {
            text: "The propane loop: liquid propane goes through a JT valve (expansion valve), drops pressure, gets COLD. It absorbs heat from the process gas in the chiller. Propane vaporizes, gas gets cold.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "TIC-302 — propane suction temperature at the compressor. If this gets too warm, your chiller isn't cold enough. Too cold and you risk liquid carryover to the compressor. Liquid slugging kills compressors.",
            highlight: 'g-tic-302',
            mood: 'alert'
          },
          {
            text: "TIC-303 — condenser outlet temperature. The propane compressor pushes hot propane vapor through the condenser (air or water cooled). It must re-condense to liquid to complete the loop.",
            highlight: 'g-tic-303',
            mood: 'teaching'
          },
          {
            text: "PIC-301 — compressor discharge pressure. Hot days = higher condenser pressure = harder to condense propane = less chilling capacity. Summer is your enemy in a refrig plant.",
            highlight: 'g-pic-301',
            mood: 'normal'
          },
          {
            text: "Typical propane chiller outlet: -30 to -40°F. That's cold enough to condense C3+ (propane and heavier) out of the gas stream. The cold liquid drops into the cold separator.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Day 3 done. You know the refrigeration loop: JT valve, chiller, compressor, condenser, repeat.\n\nTomorrow — product specs and NGL recovery. Where the money is.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      4: { // Day 4 — Product Specs & Recovery
        title: 'DAY 4 — PRODUCT SPECS & RECOVERY',
        steps: [
          {
            text: "Everything we do — dehy, refrigeration, separation — is to pull valuable NGLs out of the gas and sell them separately. Today you learn what we're making and what it has to look like.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "AI-502 — product purity analyzer. Measures C3+ content in your NGL product stream. Higher purity = higher price. But chasing purity too hard can reduce throughput.",
            highlight: 'g-ai-502',
            mood: 'teaching'
          },
          {
            text: "AI-503 — residue gas quality. This is what goes to the sales gas pipeline. Must meet BTU spec, hydrocarbon dewpoint, and H2S limits. Too rich = pipeline rejection.",
            highlight: 'g-ai-503',
            mood: 'alert'
          },
          {
            text: "FI-501 — NGL product flow. This is your recovery rate. More flow = more product = more revenue. But only if it's in spec.",
            highlight: 'g-fi-501',
            mood: 'normal'
          },
          {
            text: "AI-601 — pipeline BTU analyzer. Natural gas pipelines have a BTU window — typically 950-1100 BTU/scf. If you leave too many heavies in the gas, BTU goes high. Pull too many out, BTU goes low.",
            highlight: 'g-ai-601',
            mood: 'teaching'
          },
          {
            text: "Why is propane recovery higher than ethane in a refrig plant? Because propane is heavier — it condenses more easily at the warmer temperatures a refrig plant operates at.\n\nTypical refrig: 90%+ propane recovery, 20-40% ethane recovery.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Day 4 done. Product specs, recovery rates, pipeline quality. That's how you turn cold gas into money.\n\nTomorrow — graduation shift. Full operation.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      5: { // Day 5 — Graduation
        title: 'DAY 5 — GRADUATION',
        steps: [
          {
            text: "Final exam. Full shift on the refrigeration plant. Dehy upsets, refrigeration compressor issues, product spec swings.\n\nKeep the plant running. Keep specs in range. Make money.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "Everything you've learned: TEG dehy, BTEX compliance, propane refrigeration loop, product specs, pipeline quality.\n\nIt all matters today.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Watch the dehy AND the refrigeration section. Problems in dehy cascade downstream into hydrates in the chiller. That's a plant shutdown if you miss it.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "You've got this. Keep your head on a swivel, watch the trends, and trace the P&ID when something doesn't look right.\n\nMake me proud, operator.",
            highlight: null,
            action: 'start-graduation',
            mood: 'happy'
          }
        ]
      }
    };
  }

  _buildCryogenicLessons() {
    return {
      1: { // Day 1 — Mol Sieve Dehy
        title: 'DAY 1 — MOL SIEVE DEHY',
        steps: [
          {
            text: "Welcome to Cryo School. This is the big leagues. Turboexpanders, cold boxes, -150°F gas temperatures.\n\nI'm Henry. If you survived Stabilizer and Refrig, you might survive this.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "First rule of cryogenic processing: the gas must be BONE DRY. Not TEG dry — that only gets you to 4-7 lb water per million scf. Cryo needs less than 0.1 ppm. Any moisture freezes solid in the cold box.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "MOLECULAR SIEVE BEDS — synthetic zeolite that traps water molecules in its crystal structure. We run a 3-bed system: one adsorbing, one regenerating, one cooling. They switch on a timed cycle.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "TIC-201 — Bed A outlet temperature. During adsorption, temp stays stable. During regeneration, hot gas (500-600°F) drives water off the sieve. TIC-202 and TIC-203 monitor Beds B and C.",
            highlight: 'g-tic-201',
            mood: 'teaching'
          },
          {
            text: "The regeneration cycle: heat the bed with hot gas to drive off water, then cool it back down before switching to adsorption. If you switch too early, the bed is still hot — it won't adsorb well.",
            highlight: 'g-tic-202',
            mood: 'normal'
          },
          {
            text: "AI-201 — outlet moisture analyzer. This is your lifeline. If moisture breaks through above 0.1 ppm, you MUST switch beds immediately. Moisture in the cold box means ice, and ice means shutdown.",
            highlight: 'g-ai-201',
            mood: 'alert'
          },
          {
            text: "Why can't you use TEG ahead of a cryo plant? TEG only gets you to about 4-7 lb/MMscf water content. Cryo needs less than 0.1 ppm to prevent ice and hydrate formation in the cold box. Only mol sieve can get that dry.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Day 1 done. Mol sieve dehy — three beds, timed switching, bone-dry gas out.\n\nTomorrow we go inside the cold box.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      2: { // Day 2 — The Cold Box
        title: 'DAY 2 — THE COLD BOX',
        steps: [
          {
            text: "The COLD BOX. A heavily insulated structure containing brazed aluminum heat exchangers. Gas-to-gas, gas-to-liquid — multiple streams exchanging heat simultaneously.\n\nThis is where thermodynamics earns its keep.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Brazed aluminum exchangers — thousands of thin aluminum plates brazed together. Incredibly efficient heat transfer. Also incredibly fragile. Thermal shock cracks them. That's a $2 million repair.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "TIC-301 — cold box inlet gas temperature. The feed gas pre-cools against the cold residue gas leaving the plant. Free refrigeration before we spend any mechanical energy.",
            highlight: 'g-tic-301',
            mood: 'teaching'
          },
          {
            text: "TIC-302 — cold separator temperature. After the cold box pre-cools the gas, it hits the cold separator. Liquids drop out here before the gas goes to the turboexpander.",
            highlight: 'g-tic-302',
            mood: 'teaching'
          },
          {
            text: "TIC-303 — cold box warm end approach temperature. The difference between inlet and outlet streams. Tighter approach = more efficient, but too tight and you risk temperature cross.",
            highlight: 'g-tic-303',
            mood: 'normal'
          },
          {
            text: "LIC-301 — cold separator level. Liquid from the cold separator feeds the demethanizer. Lose this level and you lose feed to the column. The expander surges. Bad things cascade.",
            highlight: 'g-lic-301',
            mood: 'alert'
          },
          {
            text: "CRITICAL RULE: Cold box warmup rates must be limited to about 3°F per minute. Faster than that and the brazed aluminum will crack from thermal stress. During a shutdown, patience saves millions.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "Day 2 complete. The cold box is the most expensive and most fragile equipment in the plant. Respect it.\n\nTomorrow — the turboexpander. Where we make extreme cold.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      3: { // Day 3 — Turboexpander
        title: 'DAY 3 — TURBOEXPANDER',
        steps: [
          {
            text: "The TURBOEXPANDER. A turbine that rapidly expands high-pressure gas to create extreme cold. The expansion drops temperature to -150°F or lower. This is what enables 90%+ ethane recovery.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "How it works: high-pressure gas spins a turbine wheel. The gas expands and cools dramatically (Joule-Thomson effect plus work extraction). The turbine wheel drives a compressor on the other end — re-compresses the residue gas.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "TIC-401 — expander outlet temperature. This is your cryo money number. Colder = more ethane recovery. Typical: -140 to -160°F. Watch this like a hawk.",
            highlight: 'g-tic-401',
            mood: 'teaching'
          },
          {
            text: "TIC-402 — expander bearing temperature. Bearings run on oil film at 30,000+ RPM. If bearing temp rises above alarm, you have minutes before catastrophic failure. This trips the unit.",
            highlight: 'g-tic-402',
            mood: 'alert'
          },
          {
            text: "SI-401 — expander speed indicator. The expander runs at extreme RPM controlled by GUIDE VANES that regulate gas flow. Guide vanes are your throttle — they control how much gas enters the turbine.",
            highlight: 'g-si-401',
            mood: 'teaching'
          },
          {
            text: "FIC-401 — guide vane position controller. Opening guide vanes = more gas flow = more cooling = more recovery. But open too far and you can surge the compressor end or overspeed the unit.",
            highlight: 'g-fic-401',
            mood: 'teaching'
          },
          {
            text: "TIC-403 — lube oil supply temperature. The oil system is the expander's lifeblood. Too hot = bearing damage. Too cold = high viscosity, poor film. Keep it in the 110-130°F range.",
            highlight: 'g-tic-403',
            mood: 'normal'
          },
          {
            text: "PIC-402 — lube oil pressure. If oil pressure drops below minimum, the expander MUST trip. Running without oil even briefly destroys the bearings. This is a hardwired safety shutdown.",
            highlight: 'g-pic-402',
            mood: 'alert'
          },
          {
            text: "Day 3 done. The turboexpander is a precision machine running at insane speeds in extreme cold. Respect the bearings, watch the oil, and don't overspeed it.\n\nTomorrow — the demethanizer and amine treating.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      4: { // Day 4 — Demethanizer & Amine
        title: 'DAY 4 — DEMETHANIZER & AMINE',
        steps: [
          {
            text: "Two systems today. The DEMETHANIZER separates methane from the NGL product. The AMINE SYSTEM removes H2S so you don't poison anyone.\n\nBoth are critical. Both can ruin your day.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "TIC-501 — demethanizer overhead temperature. This column separates methane (top) from C2+ NGLs (bottom). Overhead temp controls the split. Too warm = methane in product. Too cold = ethane in residue gas.",
            highlight: 'g-tic-501',
            mood: 'teaching'
          },
          {
            text: "PIC-501 — demethanizer pressure. Column pressure directly affects separation. Higher pressure = warmer operation but less sharp separation. Lower pressure = colder, sharper cut but more refrigeration needed.",
            highlight: 'g-pic-501',
            mood: 'normal'
          },
          {
            text: "LIC-501 — demethanizer sump level. NGL product accumulates in the bottom. Side reboilers and bottom reboiler provide heat for the stripping section. Lose sump level = lose product flow downstream.",
            highlight: 'g-lic-501',
            mood: 'alert'
          },
          {
            text: "Now — AMINE TREATING. AI-A01 — H2S analyzer on the treated gas. Pipeline spec for H2S: 4 ppm, or 1/4 grain per 100 scf. Exceed that and the pipeline company rejects your gas. Revenue stops.",
            highlight: 'g-ai-a01',
            mood: 'alert'
          },
          {
            text: "FI-A01 — amine circulation rate. The amine absorber works like the TEG contactor: sour gas in the bottom, lean amine from the top. H2S transfers to the amine. Rich amine goes to the regenerator.",
            highlight: 'g-fi-a01',
            mood: 'teaching'
          },
          {
            text: "What happens if amine circulation stops? H2S breaks through to the product — sour gas in the pipeline. That's a safety emergency AND a contract violation. Amine pumps have backup pumps for exactly this reason.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "Day 4 complete. Demethanizer makes your product. Amine keeps you legal.\n\nTomorrow — graduation shift. Everything at once.",
            highlight: null,
            mood: 'happy'
          }
        ]
      },
      5: { // Day 5 — Graduation
        title: 'DAY 5 — GRADUATION',
        steps: [
          {
            text: "Final exam. Full cryogenic plant operation. Mol sieve switching, cold box management, turboexpander control, demethanizer separation, and amine treating.\n\nAll of it. At once.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "The cryo plant is a tightly coupled system. A mol sieve breakthrough cascades to cold box icing. Cold box icing cascades to expander surge. Expander surge cascades to demethanizer upset. Everything is connected.",
            highlight: null,
            mood: 'teaching'
          },
          {
            text: "Watch your moisture analyzer. Watch your expander bearings. Watch your demethanizer level. Watch your H2S. If one goes bad, the others will follow.",
            highlight: null,
            mood: 'alert'
          },
          {
            text: "You've made it to the top of the mountain. Cryogenic processing is the most complex operation in gas processing.\n\nShow me you can run it. Good luck, operator.",
            highlight: null,
            action: 'start-graduation',
            mood: 'happy'
          }
        ]
      }
    };
  }

  start(day, facility) {
    this.facility = facility || this.facility || 'stabilizer';
    this.lessons = this._buildLessons(this.facility);
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
        this.game.saveProgress({ [`${this.facility}Day2Complete`]: true });
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
      this.game.saveProgress({ [`${this.facility}Day${this.currentDay}Complete`]: true });
      this._showQuiz(this.currentDay);
    } else {
      const completionKey = this.facility + 'Complete';
      this.game.saveProgress({ [completionKey]: true });
      this._showCertificate();
    }
  }

  _showQuiz(day) {
    const allQuizzes = {
      stabilizer: {
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
      },
      refrigeration: {
        1: {
          question: "What temperature should the TEG reboiler NOT exceed?",
          options: ['350°F', '380°F', '404°F', '450°F'],
          correct: 2,
          explanation: "404°F — TEG decomposes above this temperature. You'll ruin your glycol charge and lose dehy capacity."
        },
        2: {
          question: "What happens if the BTEX thermal oxidizer pilot flame goes out?",
          options: ['Nothing — BTEX is harmless', 'Unburned BTEX emissions — EPA violation', 'The TEG reboiler shuts down', 'The refrigeration compressor trips'],
          correct: 1,
          explanation: "Unburned BTEX goes straight to atmosphere. That's an EPA violation with fines starting at $50,000 per day."
        },
        3: {
          question: "What is a typical propane refrigeration chiller outlet temperature?",
          options: ['0 to -10°F', '-10 to -20°F', '-30 to -40°F', '-60 to -80°F'],
          correct: 2,
          explanation: "-30 to -40°F — cold enough to condense propane and heavier hydrocarbons out of the gas stream."
        },
        4: {
          question: "Why is propane recovery typically higher than ethane in a refrigeration plant?",
          options: ['Propane is lighter and rises faster', 'Propane is heavier and condenses more easily at warmer temps', 'The compressor preferentially compresses propane', 'Ethane is removed upstream'],
          correct: 1,
          explanation: "Propane is heavier — it condenses more easily at the warmer temperatures a refrig plant operates at. Typical: 90%+ propane recovery vs 20-40% ethane."
        }
      },
      cryogenic: {
        1: {
          question: "Why can't you use TEG dehy ahead of a cryogenic plant?",
          options: ['TEG is too expensive', 'TEG only gets to ~4-7 lb/MMscf — cryo needs <0.1 ppm to prevent ice/hydrate in cold box', 'TEG freezes at low temperatures', 'TEG reacts with ethane'],
          correct: 1,
          explanation: "TEG only gets you to about 4-7 lb/MMscf water content. Cryo needs less than 0.1 ppm — only molecular sieve can get that dry."
        },
        2: {
          question: "Why must cold box warmup rates be limited to ~3°F/min?",
          options: ['To save energy', 'Brazed aluminum will crack from thermal stress', 'The insulation melts', 'To prevent hydrate formation'],
          correct: 1,
          explanation: "Brazed aluminum heat exchangers will crack from thermal stress if warmed too fast. That's a $2 million repair."
        },
        3: {
          question: "What does the turboexpander actually do?",
          options: ['Compresses gas to high pressure', 'Rapidly expands gas to create extreme cold — drops temp to -150°F for ethane recovery', 'Pumps liquid NGLs', 'Generates electricity for the plant'],
          correct: 1,
          explanation: "The turboexpander rapidly expands gas, dropping temperature to -150°F or lower. This extreme cold enables 90%+ ethane recovery."
        },
        4: {
          question: "What is the pipeline spec for H2S?",
          options: ['10 ppm', '4 ppm (1/4 grain per 100 scf)', '50 ppm', '1% by volume'],
          correct: 1,
          explanation: "4 ppm or 1/4 grain per 100 scf. Exceed that and the pipeline rejects your gas."
        }
      }
    };

    const quizzes = allQuizzes[this.facility] || allQuizzes.stabilizer;

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
              { label: `START DAY ${day + 1}`, callback: () => this.start(day + 1, this.facility), action: 'dismiss' },
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
            { label: `START DAY ${day + 1}`, callback: () => this.start(day + 1, this.facility), action: 'dismiss' },
            { label: 'LATER', action: 'dismiss' }
          ]
        });
      }, 500);
    }
  }

  _showCertificate() {
    const username = localStorage.getItem('coldcreek-username') || 'OPERATOR';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const facilityNames = { stabilizer: 'STABILIZER', refrigeration: 'REFRIGERATION', cryogenic: 'CRYOGENIC' };
    const certTitle = (facilityNames[this.facility] || 'STABILIZER') + ' OPERATOR TRAINING PROGRAM';

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
            <div class="cert-course">${certTitle}</div>
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
          const gradMessages = {
            stabilizer: "You graduated Stabilizer School. Not bad, greenhorn.\n\nRefrigeration Plant and Cryogenic are unlocked.",
            refrigeration: "You graduated Refrigeration School. You can run a refrig plant now.\n\nCryogenic is where the real operators play. Give it a shot.",
            cryogenic: "You graduated Cryogenic School. That's the top of the mountain.\n\nYou can run any gas plant in the country. I'm proud of you, operator."
          };
          this.game.henry.show({
            text: gradMessages[this.facility] || gradMessages.stabilizer,
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
