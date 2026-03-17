/**
 * CrisisScenarios — Curated multi-event crisis scenarios for Crisis Mode.
 * Leaderboard eligible. Ranked by recovery time and P&L saved.
 */

const CrisisScenarios = {
  scenarios: [
    // ---- STABILIZER CRISES ----
    {
      id: 'crisis-pig-cascade',
      name: 'THE PIG CASCADE',
      description: 'Back-to-back pigs with a hot oil fault mid-arrival. Classic cascade failure.',
      facility: 'stabilizer',
      tier: 1,
      difficulty: 'HARD',
      timeLimit: 60, // game-minutes
      events: [
        { id: 'pig-single', delay: 0 },
        { id: 'hot-oil-fault', delay: 8 },
        { id: 'pig-fast', delay: 18 }
      ],
      scoring: {
        goldTime: 25,    // game-minutes to full recovery
        silverTime: 40,
        bronzeTime: 55,
        pnlThreshold: -5000 // Lose less than this for gold
      }
    },
    {
      id: 'crisis-instrument-air',
      name: 'LOSING AIR',
      description: 'Instrument air compressor fails. Watch the valves go one by one.',
      facility: 'stabilizer',
      tier: 1,
      difficulty: 'MEDIUM',
      timeLimit: 45,
      events: [
        { id: 'instrument-air-loss', delay: 0 },
        { id: 'truck-arrival', delay: 10 } // Worst timing
      ],
      scoring: {
        goldTime: 15,
        silverTime: 25,
        bronzeTime: 40,
        pnlThreshold: -3000
      }
    },

    // ---- REFRIGERATION CRISES ----
    {
      id: 'crisis-btex-cascade',
      name: 'EPA NIGHTMARE',
      description: 'BTEX pilot goes out during a fuel gas swing. TEG reboiler struggling. Clock ticking on compliance.',
      facility: 'refrigeration',
      tier: 2,
      difficulty: 'HARD',
      timeLimit: 30,
      events: [
        { id: 'fuel-gas-swing', delay: 0, data: { btuShift: -60 } },
        { id: 'btex-pilot-out', delay: 5 },
        { id: 'kimray-dp-swing', delay: 8 }
      ],
      scoring: {
        goldTime: 12,
        silverTime: 20,
        bronzeTime: 28,
        pnlThreshold: -8000
      }
    },
    {
      id: 'crisis-refrig-pig',
      name: 'COLD AND WET',
      description: 'Pig arrival while refrigeration condenser is fouling. TEG foaming starts. Everything at once.',
      facility: 'refrigeration',
      tier: 2,
      difficulty: 'VERY HARD',
      timeLimit: 75,
      events: [
        { id: 'refrig-condenser-foul', delay: 0 },
        { id: 'pig-single', delay: 10 },
        { id: 'teg-foaming', delay: 15 },
        { id: 'ldar-inspection', delay: 25 }
      ],
      scoring: {
        goldTime: 35,
        silverTime: 50,
        bronzeTime: 70,
        pnlThreshold: -12000
      }
    },

    // ---- CRYOGENIC CRISES ----
    {
      id: 'crisis-expander-trip',
      name: 'THE TRIP',
      description: 'Expander trips. Residue compression destabilizes. Recover before the shift is over.',
      facility: 'cryogenic',
      tier: 3,
      difficulty: 'HARD',
      timeLimit: 90,
      events: [
        { id: 'expander-trip', delay: 0 },
        { id: 'res-comp-fault', delay: 12 }
      ],
      scoring: {
        goldTime: 30,
        silverTime: 50,
        bronzeTime: 80,
        pnlThreshold: -20000
      }
    },
    {
      id: 'crisis-coldbox-freeze',
      name: 'FROZEN SOLID',
      description: 'Hot oil fault leads to mol sieve breakthrough leads to cold box freeze-up. The trifecta.',
      facility: 'cryogenic',
      tier: 3,
      difficulty: 'EXTREME',
      timeLimit: 120,
      events: [
        { id: 'feed-composition-swing', delay: 0, data: { btuShift: -50 } },
        { id: 'molsieve-breakthrough', delay: 20 },
        { id: 'cold-box-freeze', delay: 50 }
      ],
      scoring: {
        goldTime: 60,
        silverTime: 90,
        bronzeTime: 115,
        pnlThreshold: -40000
      }
    },
    {
      id: 'crisis-mode-switch',
      name: 'THE SWITCH',
      description: 'Mode switch from ethane to propane recovery. Pig arrives mid-switch. Random events still fire.',
      facility: 'cryogenic',
      tier: 3,
      difficulty: 'EXTREME',
      timeLimit: 180,
      events: [
        { id: 'mode-switch', delay: 0, data: { fromMode: 'ethane', toMode: 'propane' } },
        { id: 'pig-single', delay: 60 },
        { id: 'fire-eye-alarm', delay: 90 },
        { id: 'weather-change', delay: 30, data: { newTemp: 55, newPrecip: 'RAIN' } }
      ],
      scoring: {
        goldTime: 120,
        silverTime: 150,
        bronzeTime: 175,
        pnlThreshold: -30000
      }
    },
    {
      id: 'crisis-night-everything',
      name: 'THE NIGHT EVERYTHING WENT WRONG',
      description: 'Narrative scenario. Three-plant endgame. Every system tested. Leaderboard legend material.',
      facility: 'cryogenic',
      tier: 3,
      difficulty: 'LEGENDARY',
      timeLimit: 240,
      events: [
        { id: 'weather-change', delay: 0, data: { newTemp: 35, newPrecip: 'HEAVY RAIN', newWind: 'N' } },
        { id: 'feed-composition-swing', delay: 10 },
        { id: 'pig-double', delay: 30 },
        { id: 'molsieve-breakthrough', delay: 45 },
        { id: 'instrument-freeze', delay: 60 },
        { id: 'expander-trip', delay: 90 },
        { id: 'res-comp-fault', delay: 100 },
        { id: 'pump-bearing-hot', delay: 120 },
        { id: 'lel-alarm', delay: 140 },
        { id: 'fire-eye-alarm', delay: 160 },
        { id: 'instrument-air-loss', delay: 180 }
      ],
      scoring: {
        goldTime: 180,
        silverTime: 220,
        bronzeTime: 238,
        pnlThreshold: -80000
      }
    },

    // ---- AMINE CRISES ----
    {
      id: 'crisis-h2s-evacuation',
      name: 'SOUR GAS EMERGENCY',
      description: 'H2S leak in amine area. Evacuate. Find the source. Isolate. Wind direction matters.',
      facility: 'amine',
      tier: 4,
      difficulty: 'EXTREME',
      timeLimit: 30,
      events: [
        { id: 'h2s-area-alarm', delay: 0 },
        { id: 'amine-pump-fail', delay: 5 }
      ],
      scoring: {
        goldTime: 10,
        silverTime: 18,
        bronzeTime: 28,
        pnlThreshold: -15000
      }
    }
  ],

  /**
   * Get scenarios for a specific facility
   */
  getForFacility(facility) {
    return this.scenarios.filter(s => s.facility === facility);
  },

  /**
   * Get scenario by ID
   */
  getById(id) {
    return this.scenarios.find(s => s.id === id);
  },

  /**
   * Start a crisis scenario
   */
  startScenario(scenarioId, eventSystem, gameTime) {
    const scenario = this.getById(scenarioId);
    if (!scenario) return null;

    for (const evt of scenario.events) {
      eventSystem.scheduleEvent(evt.id, gameTime + evt.delay, evt.data || {});
    }

    return {
      id: scenario.id,
      name: scenario.name,
      timeLimit: scenario.timeLimit,
      scoring: scenario.scoring,
      startTime: gameTime
    };
  },

  /**
   * Score a completed crisis
   */
  scoreScenario(scenarioId, recoveryTime, pnlLoss) {
    const scenario = this.getById(scenarioId);
    if (!scenario) return null;

    const s = scenario.scoring;
    let medal = 'NONE';
    if (recoveryTime <= s.goldTime && pnlLoss >= s.pnlThreshold) medal = 'GOLD';
    else if (recoveryTime <= s.silverTime) medal = 'SILVER';
    else if (recoveryTime <= s.bronzeTime) medal = 'BRONZE';

    return {
      scenarioId,
      recoveryTime,
      pnlLoss,
      medal,
      score: Math.max(0, 10000 - (recoveryTime * 50) - Math.abs(pnlLoss) * 0.1)
    };
  }
};

window.CrisisScenarios = CrisisScenarios;
