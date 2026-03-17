/**
 * AmineConfig — H2S / Amine treatment system (Tier 4 DLC).
 * Layered onto either plant type. Amine circulation, H2S breakthrough,
 * reboiler management, corrosion tracking, evacuation mechanic.
 *
 * H2S is treated with appropriate gravity. Evacuation timer mechanic.
 * Wind direction matters for safe response routing.
 * EPA/safety compliance events. Long-term corrosion from poor chemistry.
 */

const AmineConfig = {
  name: 'AMINE / H2S',
  tier: 4,
  isDLC: true,

  processVariables: [
    // ---- AMINE ABSORBER ----
    {
      tag: 'TIC-A01', desc: 'ABSORBER INLET', unit: 'degF',
      value: 100, sp: 100, min: 60, max: 160,
      hi: 130, hh: 145, lo: 75, ll: 65,
      controllable: false, noise: 0.3, responseRate: 0.03
    },
    {
      tag: 'TIC-A02', desc: 'ABSORBER OUTLET', unit: 'degF',
      value: 115, sp: 115, min: 70, max: 180,
      hi: 150, hh: 165, lo: 85, ll: 75,
      controllable: false, noise: 0.4, responseRate: 0.03
    },
    {
      tag: 'PIC-A01', desc: 'ABSORBER PRESS', unit: 'PSI',
      value: 900, sp: 900, min: 600, max: 1100,
      hi: 1020, hh: 1050, lo: 750, ll: 700,
      controllable: false, noise: 1.5, responseRate: 0.03
    },
    {
      tag: 'LIC-A01', desc: 'ABSORBER SUMP', unit: '%',
      value: 55, sp: 55, min: 0, max: 100,
      hi: 75, hh: 85, lo: 30, ll: 20,
      controllable: true, mode: 'AUTO', noise: 0.4, responseRate: 0.04
    },
    {
      tag: 'FI-A01', desc: 'LEAN AMINE FLOW', unit: 'gpm',
      value: 45, sp: 45, min: 0, max: 100,
      hi: 70, hh: 80, lo: 20, ll: 10,
      controllable: true, mode: 'AUTO', noise: 0.5, responseRate: 0.05
    },

    // ---- AMINE FLASH DRUM ----
    {
      tag: 'LIC-A02', desc: 'FLASH DRUM LVL', unit: '%',
      value: 40, sp: 40, min: 0, max: 100,
      hi: 65, hh: 78, lo: 20, ll: 10,
      controllable: true, mode: 'AUTO', noise: 0.3, responseRate: 0.04
    },
    {
      tag: 'PIC-A02', desc: 'FLASH DRUM PRESS', unit: 'PSI',
      value: 75, sp: 75, min: 30, max: 120,
      hi: 100, hh: 110, lo: 45, ll: 35,
      controllable: false, noise: 0.5, responseRate: 0.03
    },

    // ---- AMINE REGENERATOR ----
    {
      tag: 'TIC-A03', desc: 'REGEN REBOILER', unit: 'degF',
      value: 245, sp: 250, min: 200, max: 290,
      hi: 270, hh: 280, lo: 230, ll: 220,
      controllable: true, mode: 'AUTO', noise: 0.6, responseRate: 0.03,
      maxRateOfChange: 3
    },
    {
      tag: 'TIC-A04', desc: 'REGEN OVERHEAD', unit: 'degF',
      value: 215, sp: 215, min: 170, max: 260,
      hi: 240, hh: 250, lo: 195, ll: 185,
      controllable: false, noise: 0.5, responseRate: 0.03
    },
    {
      tag: 'PIC-A03', desc: 'REGEN PRESSURE', unit: 'PSI',
      value: 12, sp: 12, min: 2, max: 25,
      hi: 18, hh: 22, lo: 6, ll: 4,
      controllable: false, noise: 0.2, responseRate: 0.03
    },
    {
      tag: 'LIC-A03', desc: 'REGEN SUMP', unit: '%',
      value: 50, sp: 50, min: 0, max: 100,
      hi: 75, hh: 85, lo: 25, ll: 15,
      controllable: true, mode: 'AUTO', noise: 0.4, responseRate: 0.04
    },

    // ---- H2S MONITORING ----
    {
      tag: 'AI-A01', desc: 'OUTLET H2S', unit: 'ppm',
      value: 2.5, sp: 2.0, min: 0, max: 50,
      hi: 4.0, hh: 8.0, lo: null, ll: null,
      controllable: false, noise: 0.1, responseRate: 0.015
    },
    {
      tag: 'AI-A02', desc: 'ABSORBER AREA H2S', unit: 'ppm',
      value: 0, sp: 0, min: 0, max: 100,
      hi: 5, hh: 10, lo: null, ll: null,
      controllable: false, noise: 0, responseRate: 0.01
    },
    {
      tag: 'AI-A03', desc: 'REGEN AREA H2S', unit: 'ppm',
      value: 0, sp: 0, min: 0, max: 100,
      hi: 5, hh: 10, lo: null, ll: null,
      controllable: false, noise: 0, responseRate: 0.01
    },

    // ---- AMINE CHEMISTRY ----
    {
      tag: 'AI-A04', desc: 'AMINE STRENGTH', unit: 'wt%',
      value: 35, sp: 35, min: 20, max: 50,
      hi: 42, hh: 45, lo: 28, ll: 25,
      controllable: false, noise: 0.1, responseRate: 0.005
    },
    {
      tag: 'AI-A05', desc: 'AMINE pH', unit: 'pH',
      value: 10.2, sp: 10.5, min: 8, max: 13,
      hi: 11.5, hh: 12.0, lo: 9.5, ll: 9.0,
      controllable: false, noise: 0.05, responseRate: 0.005
    },

    // ---- CORROSION TRACKING ----
    {
      tag: 'CI-A01', desc: 'CORROSION RATE', unit: 'mpy',
      value: 2, sp: 2, min: 0, max: 50,
      hi: 8, hh: 15, lo: null, ll: null,
      controllable: false, noise: 0.1, responseRate: 0.002
    },
    {
      tag: 'LIC-A04', desc: 'AMINE STORAGE', unit: '%',
      value: 70, sp: 70, min: 0, max: 100,
      hi: null, hh: null, lo: 30, ll: 15,
      controllable: false, noise: 0.05, responseRate: 0.01
    }
  ],

  // Evacuation system
  evacuation: {
    active: false,
    timer: 0, // seconds remaining
    safeRoutes: [], // Based on wind direction
    personnelEvacuated: false,
    windDirection: 'SW' // Updated from weather system
  },

  valves: {
    'FV-A01': { desc: 'LEAN AMINE FLOW', position: 55, failPosition: 0, type: 'modulating' },
    'LV-A01': { desc: 'ABSORBER SUMP', position: 45, failPosition: 50, type: 'modulating' },
    'LV-A02': { desc: 'FLASH DRUM', position: 40, failPosition: 50, type: 'modulating' },
    'TV-A03': { desc: 'REGEN REBOILER', position: 50, failPosition: 0, type: 'modulating' },
    'LV-A03': { desc: 'REGEN SUMP', position: 50, failPosition: 50, type: 'modulating' },
    'XV-A01': { desc: 'AMINE ISOLATION', position: 100, failPosition: 0, type: 'on-off' },
    'XV-A02': { desc: 'SOUR GAS BYPASS', position: 0, failPosition: 100, type: 'on-off' }
  },

  equipment: {
    'T-A01': { desc: 'AMINE ABSORBER', status: 'running', faultProbability: 0 },
    'V-A01': { desc: 'FLASH DRUM', status: 'running', faultProbability: 0 },
    'T-A02': { desc: 'AMINE REGENERATOR', status: 'running', faultProbability: 0 },
    'H-A01': { desc: 'REGEN REBOILER', status: 'running', faultProbability: 0.0008 },
    'P-A01': { desc: 'AMINE PUMP 1', status: 'running', faultProbability: 0.001 },
    'P-A02': { desc: 'AMINE PUMP 2', status: 'standby', faultProbability: 0 },
    'TK-A01': { desc: 'AMINE STORAGE', status: 'running', faultProbability: 0 },
    'FL-A01': { desc: 'AMINE FILTER', status: 'running', faultProbability: 0.0005 }
  },

  cascadeRules: [
    // Lean amine flow affects H2S removal
    {
      source: 'FI-A01', target: 'AI-A01', type: 'custom',
      id: 'amineflow-to-h2s',
      fn: (flow, h2sPV, dt) => {
        const optimal = 45;
        if (flow < 25) return (25 - flow) * 0.05; // Under-circulation = H2S breakthrough
        return (optimal - flow) * 0.005;
      }
    },
    // Regen reboiler temp affects amine quality
    {
      source: 'TIC-A03', target: 'AI-A04', type: 'custom',
      id: 'regentemp-to-aminestrength',
      fn: (temp, strengthPV, dt) => {
        // Too hot = amine degradation
        if (temp > 265) return -(temp - 265) * 0.002;
        return 0;
      }
    },
    // Poor amine chemistry = corrosion
    {
      source: 'AI-A05', target: 'CI-A01', type: 'custom',
      id: 'ph-to-corrosion',
      fn: (ph, corrPV, dt) => {
        if (ph < 9.5) return (9.5 - ph) * 0.3;
        if (ph > 11.5) return (ph - 11.5) * 0.2;
        return -0.01; // Slowly improves when in range
      }
    },
    // High corrosion = H2S leak risk (delayed)
    {
      source: 'CI-A01', target: 'AI-A02', type: 'threshold',
      threshold: 12, condition: 'above', gain: 0.5,
      delay: 120, effectDuration: 60,
      id: 'corrosion-to-h2sleak'
    },
    // Amine strength degradation from high regen temp
    {
      source: 'TIC-A03', target: 'AI-A01', type: 'custom',
      id: 'regentemp-to-h2sout',
      fn: (temp, h2sPV, dt) => {
        // Under-regen = poor lean amine = H2S breakthrough
        if (temp < 235) return (235 - temp) * 0.003;
        return 0;
      }
    },
    // Amine losses from flash drum
    {
      source: 'LIC-A02', target: 'LIC-A04', type: 'custom',
      id: 'flash-to-storage',
      fn: (flashLevel, storagePV, dt) => {
        // Slow amine inventory consumption
        return -0.002;
      }
    }
  ],

  economics: {
    h2sBreakthroughPenaltyPerHour: 2000,
    evacuationCostPerMinute: 500,
    corrosionRepairCost: 8000,
    amineMakeupCostPerGallon: 15,
    complianceViolationFine: 5000,
    amineSpillCleanup: 12000
  },

  specs: {
    h2sOutlet: { target: 2.0, max: 4.0, unit: 'ppm' },
    amineStrength: { target: 35, min: 28, max: 42, unit: 'wt%' },
    corrosionRate: { target: 2, max: 8, unit: 'mpy' }
  }
};

window.AmineConfig = AmineConfig;
