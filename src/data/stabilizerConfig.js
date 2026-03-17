/**
 * StabilizerConfig — Complete process variable definitions and cascade rules
 * for the Stabilizer facility (Tier 1).
 *
 * Equipment: Pig receiver, inlet separator, pre-heat exchanger, hot oil exchanger,
 * reboiler, packed tower, overhead compressor, product tanks, truck loading.
 */

const StabilizerConfig = {
  name: 'STABILIZER',
  tier: 1,

  processVariables: [
    // ---- TEMPERATURES ----
    {
      tag: 'TIC-101', desc: 'INLET LIQ TEMP', unit: 'degF',
      value: 85, sp: 85, min: 40, max: 200,
      hi: 150, hh: 170, lo: 50, ll: 40,
      controllable: false, noise: 0.3, responseRate: 0.03
    },
    {
      tag: 'TIC-102', desc: 'REBOILER TEMP', unit: 'degF',
      value: 295, sp: 300, min: 200, max: 400,
      hi: 340, hh: 360, lo: 260, ll: 240,
      controllable: true, mode: 'AUTO', noise: 0.5, responseRate: 0.04,
      maxRateOfChange: 5 // degF per game-minute safe limit
    },
    {
      tag: 'TIC-103', desc: 'TOWER OVERHEAD TEMP', unit: 'degF',
      value: 120, sp: 125, min: 60, max: 250,
      hi: 180, hh: 200, lo: 90, ll: 75,
      controllable: false, noise: 0.4, responseRate: 0.03
    },
    {
      tag: 'TIC-104', desc: 'HOT OIL SUPPLY TEMP', unit: 'degF',
      value: 350, sp: 350, min: 200, max: 500,
      hi: 420, hh: 450, lo: 280, ll: 250,
      controllable: true, mode: 'AUTO', noise: 0.6, responseRate: 0.02
    },
    {
      tag: 'TIC-105', desc: 'COMP SUCTION TEMP', unit: 'degF',
      value: 130, sp: 135, min: 60, max: 250,
      hi: 180, hh: 200, lo: 80, ll: 60,
      controllable: false, noise: 0.3, responseRate: 0.03
    },

    // ---- PRESSURES ----
    {
      tag: 'PIC-201', desc: 'TOWER PRESSURE', unit: 'PSI',
      value: 275, sp: 275, min: 100, max: 400,
      hi: 320, hh: 350, lo: 220, ll: 200,
      controllable: true, mode: 'AUTO', noise: 0.8, responseRate: 0.03
    },
    {
      tag: 'PIC-202', desc: 'COMP DISCHARGE', unit: 'PSI',
      value: 450, sp: 450, min: 200, max: 600,
      hi: 520, hh: 550, lo: 350, ll: 300,
      controllable: false, noise: 1.0, responseRate: 0.02
    },
    {
      tag: 'PIC-203', desc: 'TANK PRESSURE', unit: 'PSI',
      value: 45, sp: 50, min: 0, max: 100,
      hi: 65, hh: 75, lo: 20, ll: 10,
      controllable: false, noise: 0.2, responseRate: 0.04
    },

    // ---- LEVELS ----
    {
      tag: 'LIC-301', desc: 'TOWER SUMP LEVEL', unit: '%',
      value: 50, sp: 50, min: 0, max: 100,
      hi: 75, hh: 85, lo: 25, ll: 15,
      controllable: true, mode: 'AUTO', noise: 0.5, responseRate: 0.05
    },
    {
      tag: 'LIC-302', desc: 'SEPARATOR LEVEL', unit: '%',
      value: 30, sp: 35, min: 0, max: 100,
      hi: 65, hh: 80, lo: 15, ll: 10,
      controllable: true, mode: 'AUTO', noise: 0.3, responseRate: 0.06
    },
    {
      tag: 'LIC-303', desc: 'PRODUCT TANK LEVEL', unit: '%',
      value: 40, sp: 50, min: 0, max: 100,
      hi: 85, hh: 92, lo: 15, ll: 8,
      controllable: false, noise: 0.1, responseRate: 0.02
    },

    // ---- FLOWS ----
    {
      tag: 'FI-401', desc: 'LIQUID FEED FLOW', unit: 'bbl/hr',
      value: 120, sp: 120, min: 0, max: 500,
      hi: 350, hh: 400, lo: 30, ll: 10,
      controllable: false, noise: 2.0, responseRate: 0.08
    },
    {
      tag: 'FI-402', desc: 'PRODUCT FLOW', unit: 'bbl/hr',
      value: 100, sp: 100, min: 0, max: 400,
      hi: 300, hh: 350, lo: 20, ll: 5,
      controllable: false, noise: 1.5, responseRate: 0.06
    },

    // ---- ANALYZERS ----
    {
      tag: 'AI-501', desc: 'RVP (REID VAPOR PRESSURE)', unit: 'psi',
      value: 10.2, sp: 10.0, min: 5, max: 18,
      hi: 11.5, hh: 13.0, lo: 9.0, ll: 7.0,
      controllable: false, noise: 0.08, responseRate: 0.02
    },

    // ---- GAS CHROMATOGRAPH (Product Stream) ----
    {
      tag: 'GC-C1', desc: 'METHANE (C1)', unit: 'mol%',
      value: 0.8, sp: 0.5, min: 0, max: 10,
      hi: 2.0, hh: 3.5, lo: null, ll: null,
      controllable: false, noise: 0.02, responseRate: 0.015
    },
    {
      tag: 'GC-C2', desc: 'ETHANE (C2)', unit: 'mol%',
      value: 2.1, sp: 1.5, min: 0, max: 15,
      hi: 4.0, hh: 6.0, lo: null, ll: null,
      controllable: false, noise: 0.03, responseRate: 0.015
    },
    {
      tag: 'GC-C3', desc: 'PROPANE (C3)', unit: 'mol%',
      value: 8.5, sp: 7.0, min: 0, max: 30,
      hi: 15.0, hh: 20.0, lo: null, ll: null,
      controllable: false, noise: 0.05, responseRate: 0.018
    },
    {
      tag: 'GC-C4', desc: 'BUTANES (C4)', unit: 'mol%',
      value: 22.0, sp: 22.0, min: 5, max: 45,
      hi: null, hh: null, lo: null, ll: null,
      controllable: false, noise: 0.08, responseRate: 0.02
    },
    {
      tag: 'GC-C5', desc: 'PENTANES+ (C5+)', unit: 'mol%',
      value: 66.6, sp: 69.0, min: 30, max: 95,
      hi: null, hh: null, lo: null, ll: null,
      controllable: false, noise: 0.1, responseRate: 0.02
    }
  ],

  // Valve positions (0-100%)
  valves: {
    'XV-101': { desc: 'INLET ISOLATION', position: 100, failPosition: 0, type: 'on-off' },
    'TV-102': { desc: 'HOT OIL CONTROL', position: 50, failPosition: 0, type: 'modulating' },
    'FV-201': { desc: 'PRODUCT CONTROL', position: 50, failPosition: 50, type: 'modulating' },
    'LV-301': { desc: 'SUMP LEVEL CONTROL', position: 45, failPosition: 50, type: 'modulating' },
    'LV-302': { desc: 'SEPARATOR LEVEL', position: 40, failPosition: 50, type: 'modulating' }
  },

  // Equipment state
  equipment: {
    'H-100': { desc: 'HOT OIL HEATER', status: 'running', faultProbability: 0.001 },
    'C-100': { desc: 'OVERHEAD COMPRESSOR', status: 'running', faultProbability: 0.0005 },
    'V-100': { desc: 'INLET SEPARATOR', status: 'running', faultProbability: 0 },
    'E-101': { desc: 'PRE-HEAT EXCHANGER', status: 'running', faultProbability: 0 },
    'E-102': { desc: 'HOT OIL EXCHANGER', status: 'running', faultProbability: 0 },
    'E-103': { desc: 'REBOILER', status: 'running', faultProbability: 0 },
    'T-100': { desc: 'PACKED TOWER', status: 'running', faultProbability: 0 },
    'TK-100': { desc: 'PRODUCT TANK', status: 'running', faultProbability: 0 }
  },

  // Cascade rules — how process variables affect each other
  cascadeRules: [
    // Hot oil supply temp affects reboiler temp (with lag)
    {
      source: 'TIC-104', target: 'TIC-102', type: 'proportional',
      gain: 0.3, id: 'hotoil-to-reboiler'
    },
    // Reboiler temp affects tower overhead temp (inverse — hotter reboiler = more light ends flashed = hotter overhead)
    {
      source: 'TIC-102', target: 'TIC-103', type: 'proportional',
      gain: 0.2, id: 'reboiler-to-overhead'
    },
    // Tower overhead temp affects compressor suction temp
    {
      source: 'TIC-103', target: 'TIC-105', type: 'proportional',
      gain: 0.6, id: 'overhead-to-compsuct'
    },
    // Reboiler temp affects RVP (higher reboiler = lower RVP — more light ends removed)
    {
      source: 'TIC-102', target: 'AI-501', type: 'custom',
      id: 'reboiler-to-rvp',
      fn: (sourceVal, targetPV, dt) => {
        // RVP decreases when reboiler is above SP, increases when below
        const reboilerSP = 300;
        const error = sourceVal - reboilerSP;
        return -error * 0.002;
      }
    },
    // Feed flow affects separator level
    {
      source: 'FI-401', target: 'LIC-302', type: 'proportional',
      gain: 0.02, id: 'feed-to-seplevel'
    },
    // Feed flow affects tower sump level
    {
      source: 'FI-401', target: 'LIC-301', type: 'proportional',
      gain: 0.015, id: 'feed-to-sumplevel'
    },
    // Product flow drains tower sump
    {
      source: 'FI-402', target: 'LIC-301', type: 'inverse',
      gain: 0.015, id: 'product-to-sumplevel'
    },
    // Product flow fills tank
    {
      source: 'FI-402', target: 'LIC-303', type: 'proportional',
      gain: 0.008, id: 'product-to-tanklevel'
    },
    // Tower pressure affects comp discharge
    {
      source: 'PIC-201', target: 'PIC-202', type: 'proportional',
      gain: 0.5, id: 'twrpress-to-compdisch'
    },
    // RVP too high = tank pressure rises (light ends in product)
    {
      source: 'AI-501', target: 'PIC-203', type: 'custom',
      id: 'rvp-to-tankpress',
      fn: (rvp, targetPV, dt) => {
        if (rvp > 12.0) return (rvp - 12.0) * 0.5;
        return 0;
      }
    },
    // Separator HiHi = overflow into stabilizer (feed surge)
    {
      source: 'LIC-302', target: 'FI-401', type: 'threshold',
      threshold: 80, condition: 'above', gain: 3.0,
      id: 'sep-overflow-to-feed'
    },
    // Inlet liquid temp affected by ambient (slow)
    {
      source: 'TIC-101', target: 'TIC-101', type: 'custom',
      id: 'ambient-drift',
      fn: (val, pv, dt) => {
        // Slowly drift toward ambient (simulated)
        const ambient = 85; // Will be replaced by weather system
        return (ambient - val) * 0.001;
      }
    },

    // ---- GC CASCADE RULES ----
    // Reboiler temp drives composition — higher temp strips more lights
    {
      source: 'TIC-102', target: 'GC-C1', type: 'custom',
      id: 'reboiler-to-gc-c1',
      fn: (reboilerTemp, pv, dt) => {
        // C1 should be near 0.5% at SP=300F. Below SP = more C1 in product
        const target = 0.5 + Math.max(0, (300 - reboilerTemp) * 0.04);
        return (target - pv.value) * 0.008;
      }
    },
    {
      source: 'TIC-102', target: 'GC-C2', type: 'custom',
      id: 'reboiler-to-gc-c2',
      fn: (reboilerTemp, pv, dt) => {
        const target = 1.5 + Math.max(0, (300 - reboilerTemp) * 0.08);
        return (target - pv.value) * 0.008;
      }
    },
    {
      source: 'TIC-102', target: 'GC-C3', type: 'custom',
      id: 'reboiler-to-gc-c3',
      fn: (reboilerTemp, pv, dt) => {
        const target = 7.0 + Math.max(0, (300 - reboilerTemp) * 0.15);
        return (target - pv.value) * 0.006;
      }
    },
    {
      source: 'TIC-102', target: 'GC-C4', type: 'custom',
      id: 'reboiler-to-gc-c4',
      fn: (reboilerTemp, pv, dt) => {
        // C4 increases slightly when too hot (over-stripping pulls some C4 overhead)
        const target = 22.0 - Math.max(0, (reboilerTemp - 320) * 0.1);
        return (target - pv.value) * 0.005;
      }
    },
    {
      source: 'TIC-102', target: 'GC-C5', type: 'custom',
      id: 'reboiler-to-gc-c5',
      fn: (reboilerTemp, pv, dt) => {
        // C5+ is the remainder — increases as lights are stripped out
        const target = 69.0 + Math.min(8, Math.max(-10, (reboilerTemp - 300) * 0.12));
        return (target - pv.value) * 0.005;
      }
    }
  ],

  // Steady-state economic parameters
  economics: {
    baseRevenuePerHour: 1800,     // $/hr at normal steady state
    rvpBonusPerHour: 200,         // $/hr when RVP perfectly in spec
    rvpPenaltyPerHour: 500,       // $/hr when RVP out of spec
    tankPopoffPenalty: 2000,      // $ per pop-off event
    compRestartCost: 800,         // $ per compressor restart
    truckLoadingRevenue: 1500,    // $ per successful truck load
    esdCostPerMinute: 75          // $/min during ESD
  },

  // Spec targets
  specs: {
    rvp: { target: 10.0, min: 9.0, max: 11.5, unit: 'psi' },
    residueBTU: { target: 1010, min: 1005, max: 1015, unit: 'BTU' }
  },

  // Weather (initial conditions)
  weather: {
    ambientTemp: 72,
    windDirection: 'SW',
    windSpeed: 8,
    precipitation: 'CLEAR'
  }
};

window.StabilizerConfig = StabilizerConfig;
