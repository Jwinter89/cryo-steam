/**
 * RefrigerationConfig — Complete process variable definitions and cascade rules
 * for the Refrigeration Plant (Tier 2).
 *
 * Equipment: Inlet compression, TEG dehydration (Kimray glycol pump),
 * BTEX combustion unit, refrigeration system, stabilizer overhead compression,
 * fuel gas system, product pumps.
 *
 * Specs: 60-100 PSI inlet, ~1,100 PSI residue, cryo depth -30°F to -110°F
 * TEG Kimray pump: 5-7 strokes/min at 15-20 MMcfd
 */

const RefrigerationConfig = {
  name: 'REFRIG PLANT',
  tier: 2,

  processVariables: [
    // ---- INLET COMPRESSION ----
    {
      tag: 'PIC-101', desc: 'INLET SUCTION', unit: 'PSI',
      value: 75, sp: 75, min: 30, max: 150,
      hi: 110, hh: 130, lo: 50, ll: 40,
      controllable: true, mode: 'AUTO', noise: 1.2, responseRate: 0.04
    },
    {
      tag: 'PIC-102', desc: 'INLET DISCHARGE', unit: 'PSI',
      value: 450, sp: 450, min: 200, max: 700,
      hi: 600, hh: 650, lo: 300, ll: 250,
      controllable: false, noise: 1.5, responseRate: 0.03
    },
    {
      tag: 'TIC-110', desc: 'INTERSTAGE TEMP', unit: 'degF',
      value: 140, sp: 140, min: 80, max: 250,
      hi: 200, hh: 220, lo: 100, ll: 85,
      controllable: false, noise: 0.6, responseRate: 0.03
    },
    {
      tag: 'TIC-111', desc: 'INLET DISCH TEMP', unit: 'degF',
      value: 165, sp: 165, min: 100, max: 300,
      hi: 230, hh: 260, lo: 120, ll: 100,
      controllable: false, noise: 0.5, responseRate: 0.03
    },

    // ---- TEG DEHYDRATION ----
    {
      tag: 'TIC-201', desc: 'TEG REBOILER', unit: 'degF',
      value: 390, sp: 400, min: 300, max: 450,
      hi: 410, hh: 420, lo: 370, ll: 350,
      controllable: true, mode: 'AUTO', noise: 0.2, responseRate: 0.03,
      maxRateOfChange: 3
    },
    {
      tag: 'TIC-202', desc: 'CONTACTOR TEMP', unit: 'degF',
      value: 100, sp: 100, min: 60, max: 180,
      hi: 140, hh: 160, lo: 70, ll: 60,
      controllable: false, noise: 0.4, responseRate: 0.03
    },
    {
      tag: 'TIC-203', desc: 'STILL OVERHEAD', unit: 'degF',
      value: 215, sp: 215, min: 150, max: 280,
      hi: 250, hh: 265, lo: 195, ll: 180,
      controllable: false, noise: 0.5, responseRate: 0.03
    },
    {
      tag: 'AI-201', desc: 'OUTLET MOISTURE', unit: 'lb/MMcf',
      value: 4.5, sp: 4.0, min: 0, max: 20,
      hi: 7.0, hh: 10.0, lo: null, ll: null,
      controllable: false, noise: 0.15, responseRate: 0.02
    },
    {
      tag: 'FI-201', desc: 'GLYCOL CIRC RATE', unit: 'gal/hr',
      value: 35, sp: 35, min: 0, max: 100,
      hi: 60, hh: 75, lo: 15, ll: 8,
      controllable: false, noise: 0.8, responseRate: 0.05
    },
    {
      tag: 'LIC-201', desc: 'CONTACTOR LEVEL', unit: '%',
      value: 50, sp: 50, min: 0, max: 100,
      hi: 75, hh: 85, lo: 25, ll: 15,
      controllable: true, mode: 'AUTO', noise: 0.4, responseRate: 0.04
    },
    {
      tag: 'LIC-202', desc: 'FLASH TANK LVL', unit: '%',
      value: 40, sp: 40, min: 0, max: 100,
      hi: 70, hh: 80, lo: 20, ll: 10,
      controllable: true, mode: 'AUTO', noise: 0.3, responseRate: 0.04
    },
    {
      tag: 'LIC-203', desc: 'TEG SURGE TANK', unit: '%',
      value: 60, sp: 60, min: 0, max: 100,
      hi: 80, hh: 90, lo: 30, ll: 20,
      controllable: false, noise: 0.2, responseRate: 0.02
    },

    // ---- BTEX UNIT ----
    {
      tag: 'TIC-210', desc: 'BTEX FIREBOX', unit: 'degF',
      value: 1400, sp: 1400, min: 800, max: 1800,
      hi: 1600, hh: 1700, lo: 1100, ll: 900,
      controllable: false, noise: 15, responseRate: 0.02
    },
    {
      tag: 'XI-210', desc: 'BTEX PILOT', unit: 'status',
      value: 1, sp: 1, min: 0, max: 1,
      hi: null, hh: null, lo: 0.5, ll: 0,
      controllable: false, noise: 0, responseRate: 0
    },

    // ---- REFRIGERATION ----
    {
      tag: 'TIC-301', desc: 'REFRIG SUCTION', unit: 'degF',
      value: -35, sp: -40, min: -120, max: 0,
      hi: -20, hh: -10, lo: -50, ll: -60,
      controllable: true, mode: 'AUTO', noise: 0.8, responseRate: 0.02,
      maxRateOfChange: 2
    },
    {
      tag: 'TIC-302', desc: 'REFRIG DISCHARGE', unit: 'degF',
      value: 110, sp: 110, min: 60, max: 200,
      hi: 160, hh: 180, lo: 80, ll: 70,
      controllable: false, noise: 0.6, responseRate: 0.03
    },
    {
      tag: 'PIC-301', desc: 'REFRIG SUCT PRESS', unit: 'PSI',
      value: 25, sp: 25, min: 5, max: 60,
      hi: 45, hh: 55, lo: 12, ll: 8,
      controllable: false, noise: 0.3, responseRate: 0.03
    },
    {
      tag: 'TIC-303', desc: 'CHILLER OUTLET', unit: 'degF',
      value: -40, sp: -45, min: -120, max: 0,
      hi: -15, hh: -5, lo: -90, ll: -105,
      controllable: true, mode: 'AUTO', noise: 0.5, responseRate: 0.02,
      maxRateOfChange: 2
    },

    // ---- FUEL GAS ----
    {
      tag: 'AI-401', desc: 'FUEL GAS BTU', unit: 'BTU',
      value: 1050, sp: 1050, min: 900, max: 1200,
      hi: 1120, hh: 1150, lo: 980, ll: 950,
      controllable: false, noise: 5, responseRate: 0.01
    },
    {
      tag: 'PIC-401', desc: 'FUEL GAS PRESS', unit: 'PSI',
      value: 35, sp: 35, min: 10, max: 60,
      hi: 50, hh: 55, lo: 20, ll: 15,
      controllable: true, mode: 'AUTO', noise: 0.3, responseRate: 0.03
    },

    // ---- RESIDUE COMPRESSION ----
    {
      tag: 'PIC-501', desc: 'RESIDUE DISCH', unit: 'PSI',
      value: 1100, sp: 1100, min: 800, max: 1300,
      hi: 1200, hh: 1250, lo: 950, ll: 900,
      controllable: false, noise: 2.0, responseRate: 0.02
    },
    {
      tag: 'TIC-501', desc: 'RESIDUE DISCH TEMP', unit: 'degF',
      value: 180, sp: 180, min: 100, max: 300,
      hi: 240, hh: 270, lo: 130, ll: 110,
      controllable: false, noise: 0.8, responseRate: 0.03
    },

    // ---- PRODUCT ----
    {
      tag: 'FI-501', desc: 'GAS THROUGHPUT', unit: 'MMcfd',
      value: 18, sp: 18, min: 0, max: 35,
      hi: 25, hh: 30, lo: 8, ll: 5,
      controllable: false, noise: 0.3, responseRate: 0.04
    },
    {
      tag: 'AI-501', desc: 'PRODUCT RVP', unit: 'psi',
      value: 10.0, sp: 10.0, min: 5, max: 18,
      hi: 11.0, hh: 11.5, lo: 9.5, ll: 9.0,
      controllable: false, noise: 0.06, responseRate: 0.02
    },
    {
      tag: 'AI-502', desc: 'ETHANE RECOVERY', unit: '%',
      value: 72, sp: 75, min: 0, max: 100,
      hi: null, hh: null, lo: 60, ll: 50,
      controllable: false, noise: 0.4, responseRate: 0.02
    },
    {
      tag: 'AI-503', desc: 'PROPANE RECOVERY', unit: '%',
      value: 91, sp: 93, min: 0, max: 100,
      hi: null, hh: null, lo: 85, ll: 75,
      controllable: false, noise: 0.3, responseRate: 0.02
    },
    {
      tag: 'LIC-501', desc: 'PRODUCT TANK', unit: '%',
      value: 45, sp: 50, min: 0, max: 100,
      hi: 85, hh: 92, lo: 15, ll: 8,
      controllable: false, noise: 0.1, responseRate: 0.02
    },
    {
      tag: 'AI-601', desc: 'RESIDUE BTU', unit: 'BTU',
      value: 1010, sp: 1010, min: 950, max: 1070,
      hi: 1015, hh: 1025, lo: 1005, ll: 995,
      controllable: false, noise: 1.5, responseRate: 0.015
    },
    {
      tag: 'AI-602', desc: 'H2S OUTLET', unit: 'ppm',
      value: 2.8, sp: 3.0, min: 0, max: 20,
      hi: 4.0, hh: 6.0, lo: null, ll: null,
      controllable: false, noise: 0.1, responseRate: 0.01
    }
  ],

  // Kimray pump state (special mechanic — not a standard PV)
  kimrayPump: {
    strokesPerMinute: 6,
    targetStrokesPerMinute: 6,
    minStrokes: 2,
    maxStrokes: 12,
    strokeVolume: 0.8, // gallons per stroke
    differentialPressure: 45, // PSI driving force
    // Stroke rate drifts with differential pressure changes
    // No alarm fires when it drifts — operator must notice
  },

  valves: {
    'XV-101': { desc: 'INLET ISOLATION', position: 100, failPosition: 0, type: 'on-off' },
    'TV-201': { desc: 'TEG REBOILER CTRL', position: 55, failPosition: 0, type: 'modulating' },
    'FV-201': { desc: 'GLYCOL MAKEUP', position: 30, failPosition: 50, type: 'modulating' },
    'TV-301': { desc: 'REFRIG EXPANSION', position: 45, failPosition: 50, type: 'modulating' },
    'PV-401': { desc: 'FUEL GAS REG', position: 50, failPosition: 50, type: 'modulating' },
    'FV-501': { desc: 'PRODUCT CONTROL', position: 50, failPosition: 50, type: 'modulating' },
    'LV-201': { desc: 'CONTACTOR LEVEL', position: 40, failPosition: 50, type: 'modulating' },
    'LV-202': { desc: 'FLASH TANK LEVEL', position: 35, failPosition: 50, type: 'modulating' }
  },

  equipment: {
    'C-101': { desc: 'INLET COMPRESSOR', status: 'running', faultProbability: 0.001 },
    'C-102': { desc: 'RESIDUE COMPRESSOR 1', status: 'running', faultProbability: 0.0008 },
    'C-103': { desc: 'RESIDUE COMPRESSOR 2', status: 'running', faultProbability: 0.0008 },
    'K-201': { desc: 'KIMRAY GLYCOL PUMP', status: 'running', faultProbability: 0.0005 },
    'T-201': { desc: 'CONTACTOR TOWER', status: 'running', faultProbability: 0 },
    'T-202': { desc: 'STILL COLUMN', status: 'running', faultProbability: 0 },
    'H-201': { desc: 'TEG REBOILER', status: 'running', faultProbability: 0.0005 },
    'B-210': { desc: 'BTEX UNIT', status: 'running', faultProbability: 0.002 },
    'R-301': { desc: 'REFRIG COMPRESSOR', status: 'running', faultProbability: 0.001 },
    'E-301': { desc: 'REFRIG CONDENSER', status: 'running', faultProbability: 0.0003 },
    'H-401': { desc: 'HOT OIL HEATER', status: 'running', faultProbability: 0.001 },
    'P-501': { desc: 'NGL PUMP 1', status: 'running', faultProbability: 0.001 },
    'P-502': { desc: 'NGL PUMP 2', status: 'standby', faultProbability: 0 },
    'TK-501': { desc: 'PRODUCT TANK', status: 'running', faultProbability: 0 }
  },

  cascadeRules: [
    // TEG reboiler temp affects dehydration quality
    {
      source: 'TIC-201', target: 'AI-201', type: 'custom',
      id: 'tegreboiler-to-moisture',
      fn: (reboilerTemp, moisturePV, dt) => {
        // Higher reboiler temp = better TEG regeneration = lower moisture
        const optimal = 400;
        const error = reboilerTemp - optimal;
        return -error * 0.003;
      }
    },
    // Fuel gas BTU affects TEG reboiler
    {
      source: 'AI-401', target: 'TIC-201', type: 'custom',
      id: 'fuelgas-to-tegreboiler',
      fn: (btu, reboilerPV, dt) => {
        // Low BTU = reboiler struggles
        if (btu < 1000) return -(1000 - btu) * 0.005;
        if (btu > 1100) return (btu - 1100) * 0.003;
        return 0;
      }
    },
    // Fuel gas BTU affects BTEX pilot stability
    {
      source: 'AI-401', target: 'XI-210', type: 'custom',
      id: 'fuelgas-to-btexpilot',
      fn: (btu, pilotPV, dt) => {
        if (btu < 970) return -0.05; // Pilot struggling
        return 0;
      }
    },
    // Fuel gas pressure affects all fired equipment
    {
      source: 'PIC-401', target: 'TIC-201', type: 'custom',
      id: 'fuelpress-to-tegreboiler',
      fn: (press, reboilerPV, dt) => {
        if (press < 22) return -(22 - press) * 0.1;
        return 0;
      }
    },
    // Refrigeration suction affects chiller outlet
    {
      source: 'TIC-301', target: 'TIC-303', type: 'proportional',
      gain: 0.5, id: 'refrig-to-chiller'
    },
    // Chiller outlet affects product recovery
    {
      source: 'TIC-303', target: 'AI-502', type: 'custom',
      id: 'chiller-to-ethane',
      fn: (chillerTemp, ethPV, dt) => {
        // Colder = better recovery
        const optimal = -45;
        return (optimal - chillerTemp) * 0.05;
      }
    },
    {
      source: 'TIC-303', target: 'AI-503', type: 'custom',
      id: 'chiller-to-propane',
      fn: (chillerTemp, propPV, dt) => {
        const optimal = -45;
        return (optimal - chillerTemp) * 0.08;
      }
    },
    // Moisture affects downstream cryo (hydrate risk)
    {
      source: 'AI-201', target: 'TIC-303', type: 'threshold',
      threshold: 7.0, condition: 'above', gain: 0.5,
      delay: 30, effectDuration: 60,
      id: 'moisture-to-hydrate'
    },
    // Glycol circulation affects moisture removal
    {
      source: 'FI-201', target: 'AI-201', type: 'custom',
      id: 'glycolflow-to-moisture',
      fn: (flow, moisturePV, dt) => {
        const optimal = 35;
        if (flow < 20) return (20 - flow) * 0.02; // Under-circulation = moisture rises
        if (flow > 55) return 0.01; // Over-circulation = carryover risk but still drying
        return (optimal - flow) * 0.001;
      }
    },
    // Throughput affects kimray stroke requirement (indirect)
    {
      source: 'FI-501', target: 'FI-201', type: 'custom',
      id: 'throughput-to-glycol',
      fn: (mmcfd, glycolPV, dt) => {
        // Higher throughput needs more glycol
        const needed = mmcfd * 2; // ~2 gal/hr per MMcfd
        return (needed - glycolPV.value) * 0.01;
      }
    },
    // Ambient/weather affects refrigeration condenser
    {
      source: 'TIC-302', target: 'TIC-301', type: 'proportional',
      gain: 0.1, id: 'discharge-to-suction'
    },
    // Inlet compression affects throughput
    {
      source: 'PIC-101', target: 'FI-501', type: 'custom',
      id: 'inletpress-to-throughput',
      fn: (inletPress, throughputPV, dt) => {
        const normal = 75;
        return (inletPress - normal) * 0.01;
      }
    },
    // Recovery affects residue BTU
    {
      source: 'AI-502', target: 'AI-601', type: 'custom',
      id: 'ethrecovery-to-btu',
      fn: (ethRecovery, btuPV, dt) => {
        // Higher ethane recovery = leaner residue = lower BTU
        const baseBTU = 1040;
        const target = baseBTU - (ethRecovery * 0.4);
        return (target - btuPV.value) * 0.005;
      }
    }
  ],

  economics: {
    baseRevenuePerHour: 3200,
    recoveryBonusPerHour: 600,
    rvpBonusPerHour: 200,
    rvpPenaltyPerHour: 500,
    btexViolationPenalty: 5000,
    moisturePenaltyPerHour: 800,
    btuOffSpecPerHour: 800,
    compRestartCost: 1200,
    tankPopoffPenalty: 2000,
    truckLoadingRevenue: 1500,
    esdCostPerMinute: 120
  },

  specs: {
    rvp: { target: 10.0, min: 9.0, max: 11.5, unit: 'psi' },
    residueBTU: { target: 1010, min: 1005, max: 1015, unit: 'BTU' },
    moisture: { target: 4.0, max: 7.0, unit: 'lb/MMcf' },
    h2s: { target: 3.0, max: 4.0, unit: 'ppm' }
  },

  weather: {
    ambientTemp: 78,
    windDirection: 'S',
    windSpeed: 12,
    precipitation: 'CLEAR'
  }
};

window.RefrigerationConfig = RefrigerationConfig;
