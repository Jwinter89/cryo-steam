/**
 * CryogenicConfig — Complete process variable definitions and cascade rules
 * for the Cryo Plant (Tier 3).
 *
 * 110 MMcfd design, up to 130 MMcfd operational.
 * Mol sieve dehydration, turboexpander/recompressor, demethanizer tower,
 * LEFC/HEFC bubble trays with mist pads, full cold box exchanger train.
 * Mode switching between ethane recovery and propane rejection.
 * Three-plant simultaneous operation at endgame.
 */

const CryogenicConfig = {
  name: 'CRYO PLANT',
  tier: 3,

  processVariables: [
    // ---- INLET / FEED ----
    {
      tag: 'FI-100', desc: 'INLET GAS FLOW', unit: 'MMcfd',
      value: 110, sp: 110, min: 0, max: 150,
      hi: 125, hh: 135, lo: 60, ll: 40,
      controllable: false, noise: 1.0, responseRate: 0.04
    },
    {
      tag: 'PIC-100', desc: 'INLET PRESSURE', unit: 'PSI',
      value: 850, sp: 850, min: 500, max: 1100,
      hi: 1000, hh: 1050, lo: 650, ll: 600,
      controllable: false, noise: 2, responseRate: 0.03
    },
    {
      tag: 'TIC-100', desc: 'INLET GAS TEMP', unit: 'degF',
      value: 95, sp: 95, min: 40, max: 140,
      hi: 120, hh: 130, lo: 60, ll: 50,
      controllable: false, noise: 0.3, responseRate: 0.02
    },

    // ---- MOL SIEVE DEHYDRATION ----
    {
      tag: 'TIC-201', desc: 'MOL SIEVE BED A', unit: 'degF',
      value: 85, sp: 85, min: 40, max: 140,
      hi: 120, hh: 130, lo: null, ll: null,
      controllable: false, noise: 0.2, responseRate: 0.02
    },
    {
      tag: 'TIC-202', desc: 'MOL SIEVE BED B', unit: 'degF',
      value: 85, sp: 85, min: 40, max: 140,
      hi: 120, hh: 130, lo: null, ll: null,
      controllable: false, noise: 0.2, responseRate: 0.02
    },
    {
      tag: 'TIC-203', desc: 'REGEN HEATER OUT', unit: 'degF',
      value: 500, sp: 500, min: 300, max: 650,
      hi: 580, hh: 620, lo: 420, ll: 380,
      controllable: true, mode: 'AUTO', noise: 2.0, responseRate: 0.02
    },
    {
      tag: 'AI-201', desc: 'OUTLET MOISTURE', unit: 'ppm',
      value: 0.1, sp: 0.1, min: 0, max: 5,
      hi: 0.5, hh: 1.0, lo: null, ll: null,
      controllable: false, noise: 0.01, responseRate: 0.01
    },

    // ---- COLD BOX / HEAT EXCHANGERS ----
    {
      tag: 'TIC-301', desc: 'GAS/GAS EXCH OUT', unit: 'degF',
      value: -30, sp: -30, min: -120, max: 40,
      hi: 0, hh: 20, lo: -80, ll: -100,
      controllable: false, noise: 0.4, responseRate: 0.02,
      maxRateOfChange: 3 // Critical rate-of-change limit for brazed aluminum
    },
    {
      tag: 'TIC-302', desc: 'GAS/PROD EXCH OUT', unit: 'degF',
      value: -55, sp: -55, min: -140, max: 0,
      hi: -20, hh: -5, lo: -110, ll: -120,
      controllable: false, noise: 0.4, responseRate: 0.02,
      maxRateOfChange: 3
    },
    {
      tag: 'TIC-303', desc: 'COLD SEPARATOR', unit: 'degF',
      value: -90, sp: -90, min: -160, max: -20,
      hi: -50, hh: -30, lo: -130, ll: -145,
      controllable: false, noise: 0.5, responseRate: 0.015,
      maxRateOfChange: 2.5
    },
    {
      tag: 'LIC-301', desc: 'COLD SEP LEVEL', unit: '%',
      value: 45, sp: 45, min: 0, max: 100,
      hi: 70, hh: 80, lo: 20, ll: 10,
      controllable: true, mode: 'AUTO', noise: 0.5, responseRate: 0.04
    },

    // ---- TURBOEXPANDER / RECOMPRESSOR ----
    {
      tag: 'SI-401', desc: 'EXPANDER SPEED', unit: 'RPM',
      value: 18500, sp: 18500, min: 0, max: 25000,
      hi: 22000, hh: 23500, lo: 12000, ll: 8000,
      controllable: false, noise: 50, responseRate: 0.03
    },
    {
      tag: 'TIC-401', desc: 'EXPANDER INLET', unit: 'degF',
      value: -90, sp: -90, min: -160, max: -20,
      hi: -50, hh: -30, lo: -135, ll: -150,
      controllable: false, noise: 0.3, responseRate: 0.02
    },
    {
      tag: 'TIC-402', desc: 'EXPANDER OUTLET', unit: 'degF',
      value: -150, sp: -150, min: -200, max: -60,
      hi: -100, hh: -80, lo: -175, ll: -185,
      controllable: false, noise: 0.4, responseRate: 0.02,
      maxRateOfChange: 4
    },
    {
      tag: 'PIC-401', desc: 'EXPANDER SUCTION', unit: 'PSI',
      value: 620, sp: 620, min: 300, max: 900,
      hi: 780, hh: 850, lo: 450, ll: 380,
      controllable: false, noise: 2, responseRate: 0.03
    },
    {
      tag: 'TIC-403', desc: 'BEARING TEMP', unit: 'degF',
      value: 140, sp: 140, min: 80, max: 250,
      hi: 180, hh: 200, lo: null, ll: null,
      controllable: false, noise: 0.3, responseRate: 0.01
    },
    {
      tag: 'PIC-402', desc: 'LUBE OIL PRESS', unit: 'PSI',
      value: 45, sp: 45, min: 0, max: 60,
      hi: null, hh: null, lo: 25, ll: 18,
      controllable: false, noise: 0.2, responseRate: 0.02
    },
    {
      tag: 'VI-401', desc: 'EXPANDER VIBRATION', unit: 'mils',
      value: 0.8, sp: 0.8, min: 0, max: 5,
      hi: 2.0, hh: 3.0, lo: null, ll: null,
      controllable: false, noise: 0.05, responseRate: 0.01
    },
    {
      tag: 'FIC-401', desc: 'INLET GUIDE VANE', unit: '%',
      value: 65, sp: 65, min: 0, max: 100,
      hi: null, hh: null, lo: null, ll: null,
      controllable: true, mode: 'AUTO', noise: 0, responseRate: 0.06
    },

    // ---- DEMETHANIZER TOWER ----
    {
      tag: 'TIC-501', desc: 'DEMET OVERHEAD', unit: 'degF',
      value: -92, sp: -92, min: -160, max: -30,
      hi: -60, hh: -45, lo: -130, ll: -145,
      controllable: false, noise: 0.3, responseRate: 0.02
    },
    {
      tag: 'TIC-502', desc: 'DEMET MID TRAY', unit: 'degF',
      value: -20, sp: -20, min: -100, max: 60,
      hi: 30, hh: 45, lo: -60, ll: -80,
      controllable: false, noise: 0.4, responseRate: 0.02
    },
    {
      tag: 'TIC-503', desc: 'DEMET BOTTOM', unit: 'degF',
      value: 60, sp: 60, min: 0, max: 140,
      hi: 100, hh: 120, lo: 30, ll: 15,
      controllable: false, noise: 0.3, responseRate: 0.02
    },
    {
      tag: 'PIC-501', desc: 'DEMET PRESSURE', unit: 'PSI',
      value: 235, sp: 235, min: 150, max: 350,
      hi: 290, hh: 320, lo: 190, ll: 170,
      controllable: true, mode: 'AUTO', noise: 1.0, responseRate: 0.03
    },
    {
      tag: 'PDI-501', desc: 'DEMET DIFF PRESS', unit: 'PSI',
      value: 2.5, sp: 2.5, min: 0, max: 15,
      hi: 6.0, hh: 8.0, lo: null, ll: null,
      controllable: false, noise: 0.1, responseRate: 0.03
    },
    {
      tag: 'LIC-501', desc: 'DEMET SUMP', unit: '%',
      value: 50, sp: 50, min: 0, max: 100,
      hi: 75, hh: 85, lo: 25, ll: 15,
      controllable: true, mode: 'AUTO', noise: 0.5, responseRate: 0.04
    },
    {
      tag: 'TIC-504', desc: 'SIDE REBOILER', unit: 'degF',
      value: 25, sp: 25, min: -40, max: 100,
      hi: 65, hh: 80, lo: -5, ll: -20,
      controllable: true, mode: 'AUTO', noise: 0.3, responseRate: 0.03
    },
    {
      tag: 'TIC-505', desc: 'BOTTOM REBOILER', unit: 'degF',
      value: 80, sp: 80, min: 20, max: 160,
      hi: 120, hh: 140, lo: 45, ll: 30,
      controllable: true, mode: 'AUTO', noise: 0.4, responseRate: 0.03
    },

    // ---- RESIDUE COMPRESSION ----
    {
      tag: 'PIC-601', desc: 'RESIDUE DISCH', unit: 'PSI',
      value: 1100, sp: 1100, min: 800, max: 1300,
      hi: 1200, hh: 1250, lo: 950, ll: 900,
      controllable: false, noise: 3.0, responseRate: 0.02
    },
    {
      tag: 'TIC-601', desc: 'RES COMP1 DISCH', unit: 'degF',
      value: 195, sp: 195, min: 100, max: 350,
      hi: 270, hh: 300, lo: 130, ll: 110,
      controllable: false, noise: 1.0, responseRate: 0.03
    },
    {
      tag: 'TIC-602', desc: 'RES COMP2 DISCH', unit: 'degF',
      value: 190, sp: 190, min: 100, max: 350,
      hi: 270, hh: 300, lo: 130, ll: 110,
      controllable: false, noise: 1.0, responseRate: 0.03
    },
    {
      tag: 'TIC-603', desc: 'RES COMP3 DISCH', unit: 'degF',
      value: 192, sp: 192, min: 100, max: 350,
      hi: 270, hh: 300, lo: 130, ll: 110,
      controllable: false, noise: 1.0, responseRate: 0.03
    },
    {
      tag: 'PIC-602', desc: 'BOOSTER DISCH', unit: 'PSI',
      value: 320, sp: 320, min: 200, max: 500,
      hi: 420, hh: 460, lo: 250, ll: 220,
      controllable: false, noise: 1.5, responseRate: 0.03
    },

    // ---- PRODUCT / RECOVERY ----
    {
      tag: 'AI-701', desc: 'ETHANE RECOVERY', unit: '%',
      value: 87, sp: 88, min: 0, max: 100,
      hi: null, hh: null, lo: 75, ll: 65,
      controllable: false, noise: 0.3, responseRate: 0.015
    },
    {
      tag: 'AI-702', desc: 'PROPANE RECOVERY', unit: '%',
      value: 96, sp: 96, min: 0, max: 100,
      hi: null, hh: null, lo: 90, ll: 80,
      controllable: false, noise: 0.2, responseRate: 0.015
    },
    {
      tag: 'AI-703', desc: 'RESIDUE BTU', unit: 'BTU',
      value: 1012, sp: 1010, min: 950, max: 1070,
      hi: 1015, hh: 1025, lo: 1005, ll: 995,
      controllable: false, noise: 1.2, responseRate: 0.015
    },
    {
      tag: 'AI-704', desc: 'PRODUCT RVP', unit: 'psi',
      value: 10.1, sp: 10.0, min: 5, max: 18,
      hi: 11.0, hh: 11.5, lo: 9.5, ll: 9.0,
      controllable: false, noise: 0.05, responseRate: 0.015
    },
    {
      tag: 'LIC-701', desc: 'NGL PRODUCT TANK', unit: '%',
      value: 50, sp: 50, min: 0, max: 100,
      hi: 85, hh: 92, lo: 15, ll: 8,
      controllable: false, noise: 0.1, responseRate: 0.02
    },
    {
      tag: 'AI-705', desc: 'H2S OUTLET', unit: 'ppm',
      value: 3.0, sp: 3.0, min: 0, max: 20,
      hi: 4.0, hh: 6.0, lo: null, ll: null,
      controllable: false, noise: 0.1, responseRate: 0.01
    },

    // ---- FUEL GAS ----
    {
      tag: 'AI-801', desc: 'FUEL GAS BTU', unit: 'BTU',
      value: 1050, sp: 1050, min: 900, max: 1200,
      hi: 1120, hh: 1150, lo: 980, ll: 950,
      controllable: false, noise: 4, responseRate: 0.01
    },

    // ---- HOT OIL ----
    {
      tag: 'TIC-801', desc: 'HOT OIL SUPPLY', unit: 'degF',
      value: 380, sp: 380, min: 200, max: 500,
      hi: 440, hh: 470, lo: 300, ll: 260,
      controllable: true, mode: 'AUTO', noise: 0.8, responseRate: 0.02
    },

    // ---- REFRIGERATION ----
    {
      tag: 'TIC-901', desc: 'REFRIG SUCTION', unit: 'degF',
      value: -35, sp: -35, min: -80, max: 10,
      hi: -10, hh: 0, lo: -60, ll: -70,
      controllable: true, mode: 'AUTO', noise: 0.5, responseRate: 0.02
    }
  ],

  // Mode switch state
  modeSwitch: {
    currentMode: 'ethane', // 'ethane' or 'propane'
    switchPhase: null, // null, 'limp-down', 'switching', 'rate-management', 'bring-up', 'stable'
    switchProgress: 0, // 0-100%
    switchStartTime: null,
    criticalValveRamping: false
  },

  // Mol sieve cycle state
  molSieve: {
    bedA: { state: 'adsorbing', cycleTime: 0, maxCycleTime: 480 }, // 8 game-hours
    bedB: { state: 'adsorbing', cycleTime: 0, maxCycleTime: 480 },
    bedC: { state: 'regenerating', cycleTime: 0, maxCycleTime: 240 }, // 4 game-hours regen
    egInjection: false,
    breakthrough: false
  },

  valves: {
    'XV-100': { desc: 'INLET ISOLATION', position: 100, failPosition: 0, type: 'on-off' },
    'FV-100': { desc: 'INLET FLOW CTRL', position: 65, failPosition: 50, type: 'modulating' },
    'TV-301': { desc: 'COLD BOX BYPASS', position: 0, failPosition: 100, type: 'modulating' },
    'FIC-401': { desc: 'INLET GUIDE VANE', position: 65, failPosition: 0, type: 'modulating' },
    'TV-501': { desc: 'SIDE REBOILER', position: 45, failPosition: 50, type: 'modulating' },
    'TV-502': { desc: 'BOTTOM REBOILER', position: 50, failPosition: 50, type: 'modulating' },
    'LV-501': { desc: 'DEMET SUMP', position: 50, failPosition: 50, type: 'modulating' },
    'PV-501': { desc: 'DEMET PRESSURE', position: 40, failPosition: 50, type: 'modulating' },
    'FV-701': { desc: 'PRODUCT CONTROL', position: 50, failPosition: 50, type: 'modulating' }
  },

  equipment: {
    'MS-A': { desc: 'MOL SIEVE BED A', status: 'adsorbing', faultProbability: 0 },
    'MS-B': { desc: 'MOL SIEVE BED B', status: 'adsorbing', faultProbability: 0 },
    'MS-C': { desc: 'MOL SIEVE BED C', status: 'regenerating', faultProbability: 0 },
    'H-200': { desc: 'REGEN HEATER', status: 'running', faultProbability: 0.001 },
    'EX-400': { desc: 'TURBOEXPANDER', status: 'running', faultProbability: 0.002 },
    'BC-400': { desc: 'BOOSTER COMP', status: 'running', faultProbability: 0.001 },
    'T-500': { desc: 'DEMETHANIZER', status: 'running', faultProbability: 0 },
    'C-601': { desc: 'RESIDUE COMP 1', status: 'running', faultProbability: 0.001 },
    'C-602': { desc: 'RESIDUE COMP 2', status: 'running', faultProbability: 0.001 },
    'C-603': { desc: 'RESIDUE COMP 3', status: 'running', faultProbability: 0.001 },
    'P-701': { desc: 'NGL PUMP 1', status: 'running', faultProbability: 0.001 },
    'P-702': { desc: 'NGL PUMP 2', status: 'standby', faultProbability: 0 },
    'H-800': { desc: 'HOT OIL HEATER', status: 'running', faultProbability: 0.001 },
    'R-900': { desc: 'REFRIG COMP', status: 'running', faultProbability: 0.001 },
    'TK-701': { desc: 'NGL PRODUCT TANK', status: 'running', faultProbability: 0 }
  },

  cascadeRules: [
    // ---- COLD BOX CHAIN ----
    // Inlet gas splits: ~60% to gas/gas exchanger, rest to gas/product exchanger
    {
      source: 'FI-100', target: 'TIC-301', type: 'custom',
      id: 'flow-to-gasgas',
      fn: (flow, pv, dt) => {
        const normalFlow = 110;
        return (flow - normalFlow) * 0.003;
      }
    },
    {
      source: 'TIC-301', target: 'TIC-302', type: 'proportional',
      gain: 0.4, id: 'gasgas-to-gasprod'
    },
    {
      source: 'TIC-302', target: 'TIC-303', type: 'proportional',
      gain: 0.5, id: 'gasprod-to-coldsep'
    },

    // ---- EXPANDER CHAIN ----
    // Cold separator feeds expander
    {
      source: 'TIC-303', target: 'TIC-401', type: 'proportional',
      gain: 0.6, id: 'coldsep-to-expanderinlet'
    },
    // Guide vane position affects expander speed and outlet temp
    {
      source: 'FIC-401', target: 'SI-401', type: 'custom',
      id: 'guidevane-to-speed',
      fn: (vanePos, speedPV, dt) => {
        const targetSpeed = 14000 + vanePos * 100;
        return (targetSpeed - speedPV.value) * 0.01;
      }
    },
    {
      source: 'FIC-401', target: 'TIC-402', type: 'custom',
      id: 'guidevane-to-expanderout',
      fn: (vanePos, outPV, dt) => {
        // More open = colder outlet (more expansion)
        const targetTemp = -100 - vanePos * 0.7;
        return (targetTemp - outPV.value) * 0.005;
      }
    },
    // Expander vibration correlates with speed and bearing temp
    {
      source: 'SI-401', target: 'VI-401', type: 'custom',
      id: 'speed-to-vibration',
      fn: (speed, vibPV, dt) => {
        // Base vibration scales with speed, spikes near overspeed
        const base = 0.5 + (speed / 18500) * 0.5;
        const spike = speed > 20000 ? (speed - 20000) * 0.001 : 0;
        return (base + spike - vibPV.value) * 0.01;
      }
    },
    // Expander suction drops with inlet flow restriction (pig)
    {
      source: 'FI-100', target: 'PIC-401', type: 'proportional',
      gain: 0.8, id: 'flow-to-expandersuction'
    },

    // ---- DEMETHANIZER CHAIN ----
    // Expander outlet (two-phase) feeds demet top
    {
      source: 'TIC-402', target: 'TIC-501', type: 'proportional',
      gain: 0.4, id: 'expanderout-to-demetoh'
    },
    // Reboilers affect demet bottom
    {
      source: 'TIC-504', target: 'TIC-502', type: 'proportional',
      gain: 0.3, id: 'sidereboiler-to-demetmid'
    },
    {
      source: 'TIC-505', target: 'TIC-503', type: 'proportional',
      gain: 0.4, id: 'bottomreboiler-to-demetbottom'
    },
    // Demet bottom temp affects product RVP
    {
      source: 'TIC-503', target: 'AI-704', type: 'custom',
      id: 'demetbottom-to-rvp',
      fn: (temp, rvpPV, dt) => {
        const optimal = 60;
        return -(temp - optimal) * 0.003;
      }
    },
    // Demet overhead temp affects ethane recovery
    {
      source: 'TIC-501', target: 'AI-701', type: 'custom',
      id: 'demetoh-to-ethane',
      fn: (temp, ethPV, dt) => {
        // Colder overhead = better ethane recovery
        const optimal = -92;
        return (optimal - temp) * 0.03;
      }
    },
    // Demet pressure affects overhead conditions
    {
      source: 'PIC-501', target: 'TIC-501', type: 'custom',
      id: 'demetpress-to-demetoh',
      fn: (press, ohPV, dt) => {
        return (press - 235) * 0.003;
      }
    },
    // Sump level drives tray dP — high level = flooding = high dP
    {
      source: 'LIC-501', target: 'PDI-501', type: 'custom',
      id: 'sumplevel-to-demetdp',
      fn: (level, dpPV, dt) => {
        // Normal dP ~2.5 PSI. Rises exponentially above 70% sump
        const baseDp = 2.5;
        const target = level > 70 ? baseDp + Math.pow((level - 70) / 10, 2) : baseDp;
        return (target - dpPV.value) * 0.02;
      }
    },

    // ---- RESIDUE COMPRESSION ----
    // Booster (expander shaft-driven) feeds residue compressors
    {
      source: 'SI-401', target: 'PIC-602', type: 'custom',
      id: 'expanderspeed-to-booster',
      fn: (speed, boostPV, dt) => {
        const targetPress = 200 + (speed / 18500) * 120;
        return (targetPress - boostPV.value) * 0.005;
      }
    },
    // Residue comp discharge
    {
      source: 'PIC-602', target: 'PIC-601', type: 'custom',
      id: 'booster-to-residue',
      fn: (boostPress, resPV, dt) => {
        return (boostPress - 320) * 0.01;
      }
    },

    // ---- MOL SIEVE & HOT OIL ----
    // Hot oil affects regen heater
    {
      source: 'TIC-801', target: 'TIC-203', type: 'proportional',
      gain: 0.5, id: 'hotoil-to-regen'
    },
    // Regen quality affects moisture
    {
      source: 'TIC-203', target: 'AI-201', type: 'custom',
      id: 'regen-to-moisture',
      fn: (regenTemp, moistPV, dt) => {
        if (regenTemp < 450) return (450 - regenTemp) * 0.0005;
        return -0.001; // Good regen = moisture stays low
      }
    },
    // Moisture affects cold box (hydrate formation with delay)
    {
      source: 'AI-201', target: 'TIC-303', type: 'threshold',
      threshold: 0.5, condition: 'above', gain: 0.3,
      delay: 30, effectDuration: 120,
      id: 'moisture-to-coldbox-hydrate'
    },

    // ---- FUEL GAS CHAIN ----
    {
      source: 'AI-801', target: 'TIC-801', type: 'custom',
      id: 'fuelgas-to-hotoil',
      fn: (btu, hotOilPV, dt) => {
        if (btu < 1000) return -(1000 - btu) * 0.003;
        return 0;
      }
    },
    {
      source: 'AI-801', target: 'TIC-203', type: 'custom',
      id: 'fuelgas-to-regenheater',
      fn: (btu, regenPV, dt) => {
        if (btu < 1000) return -(1000 - btu) * 0.004;
        return 0;
      }
    },

    // ---- RECOVERY & BTU ----
    {
      source: 'AI-701', target: 'AI-703', type: 'custom',
      id: 'ethrecovery-to-btu',
      fn: (ethRecovery, btuPV, dt) => {
        const baseBTU = 1050;
        const target = baseBTU - (ethRecovery * 0.45);
        return (target - btuPV.value) * 0.003;
      }
    },
    {
      source: 'AI-702', target: 'AI-703', type: 'custom',
      id: 'proprecovery-to-btu',
      fn: (propRecovery, btuPV, dt) => {
        return -(propRecovery - 96) * 0.005;
      }
    },

    // ---- WEATHER/AMBIENT ----
    {
      source: 'TIC-901', target: 'TIC-303', type: 'custom',
      id: 'refrig-to-coldsep',
      fn: (refrigTemp, coldSepPV, dt) => {
        return (refrigTemp + 35) * 0.002; // Warmer refrig = warmer cold sep
      }
    }
  ],

  economics: {
    baseRevenuePerHour: 4500,
    ethaneRecoveryBonusBase: 420, // $/hr per % above 85
    propaneRecoveryBonusBase: 200,
    rvpBonusPerHour: 250,
    rvpPenaltyPerHour: 600,
    btuOffSpecPerHour: 800,
    expanderTripCostPerHour: 4000,
    compRestartCost: 1500,
    coldBoxDamageRepair: 25000,
    esdCostPerMinute: 200,
    liquidFullRecoveryCost: 60000,
    tankPopoffPenalty: 2500,
    truckLoadingRevenue: 2000
  },

  specs: {
    rvp: { target: 10.0, min: 9.0, max: 11.5, unit: 'psi' },
    residueBTU: { target: 1010, min: 1005, max: 1015, unit: 'BTU' },
    h2s: { target: 3.0, max: 4.0, unit: 'ppm' },
    ethaneRecovery: { target: 88, min: 75, unit: '%' },
    propaneRecovery: { target: 96, min: 90, unit: '%' }
  },

  weather: {
    ambientTemp: 85,
    windDirection: 'SW',
    windSpeed: 10,
    precipitation: 'CLEAR'
  }
};

window.CryogenicConfig = CryogenicConfig;
