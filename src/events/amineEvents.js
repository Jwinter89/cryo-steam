/**
 * AmineEvents — Events for Amine/H2S treatment system (Tier 4 DLC).
 * H2S breakthrough, evacuation mechanics, corrosion, amine chemistry.
 */

function registerAmineEvents(eventSystem) {

  // H2S Breakthrough
  eventSystem.registerEvent({
    id: 'h2s-breakthrough',
    name: 'H2S BREAKTHROUGH',
    description: 'H2S levels rising in treated gas. Amine system not removing enough.',
    severity: 'alarm',
    probability: 0.005,
    radioMessage: 'ALARM: AI-A01 H2S OUTLET HIGH — Check amine circulation.',

    data: { severity: 0, evacuationNeeded: false },

    onStart: (event, pvMap) => {
      event.data.severity = 0.4 + Math.random() * 0.6;
      const h2s = pvMap['AI-A01'];
      if (h2s) h2s.externalForce += event.data.severity * 2;
    },

    onTick: (event, dt, pvMap) => {
      const h2s = pvMap['AI-A01'];
      if (h2s) {
        h2s.externalForce += event.data.severity;
        if (h2s.value > 8 && !event.data.evacuationNeeded) {
          event.data.evacuationNeeded = true;
        }
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'increase-circulation') {
        const flow = pvMap['FI-A01'];
        if (flow) flow.sp += 10;
        const h2s = pvMap['AI-A01'];
        if (h2s) h2s.externalForce = 0;
        return true;
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      const h2s = pvMap['AI-A01'];
      if (h2s) h2s.externalForce = 0;
    }
  });

  // H2S Area Alarm (evacuation trigger)
  eventSystem.registerEvent({
    id: 'h2s-area-alarm',
    name: 'H2S AREA ALARM',
    description: 'H2S detected in plant area. Evacuation protocol required.',
    severity: 'critical',
    probability: 0.003,
    radioMessage: 'CRITICAL: H2S ALARM — EVACUATE AFFECTED AREA. CHECK WIND DIRECTION.',

    data: {
      area: '',
      concentration: 0,
      windDirection: 'SW',
      safeRoutes: [],
      evacuationStarted: false,
      evacuationTimer: 0
    },

    onStart: (event, pvMap) => {
      const areas = ['ABSORBER', 'REGENERATOR', 'FLASH DRUM', 'AMINE PUMPS'];
      event.data.area = areas[Math.floor(Math.random() * areas.length)];
      event.data.concentration = 5 + Math.random() * 15; // 5-20 ppm area concentration

      // Wind direction determines safe evacuation routes
      const windDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const wind = windDirs[Math.floor(Math.random() * windDirs.length)];
      event.data.windDirection = wind;

      // Safe routes are UPWIND of the leak
      const opposites = { 'N': 'S', 'NE': 'SW', 'E': 'W', 'SE': 'NW', 'S': 'N', 'SW': 'NE', 'W': 'E', 'NW': 'SE' };
      event.data.safeRoutes = [opposites[wind], wind]; // Go upwind

      const areaH2s = pvMap['AI-A02'] || pvMap['AI-A03'];
      if (areaH2s) areaH2s.value = event.data.concentration;
    },

    onTick: (event, dt, pvMap) => {
      if (event.data.evacuationStarted) {
        event.data.evacuationTimer += dt;
      }
      // H2S concentration may drift
      const areaH2s = pvMap['AI-A02'] || pvMap['AI-A03'];
      if (areaH2s) areaH2s.externalForce += (Math.random() - 0.4) * 0.5;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'evacuate') {
        event.data.evacuationStarted = true;
        return false; // Need to also fix the source
      }
      if (action === 'isolate-source') {
        const areaH2s = pvMap['AI-A02'] || pvMap['AI-A03'];
        if (areaH2s) {
          areaH2s.value = 0;
          areaH2s.externalForce = 0;
        }
        return event.data.evacuationStarted; // Must have evacuated first
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      ['AI-A02', 'AI-A03'].forEach(tag => {
        const pv = pvMap[tag];
        if (pv) { pv.value = 0; pv.externalForce = 0; }
      });
    }
  });

  // Amine Foaming
  eventSystem.registerEvent({
    id: 'amine-foaming',
    name: 'AMINE FOAMING',
    description: 'Contamination causing amine foaming in absorber. H2S removal degrading.',
    severity: 'warning',
    probability: 0.005,
    affectedByMaintenance: true,
    radioMessage: 'Ops: Absorber showing differential pressure increase. Possible foaming.',

    data: { severity: 0 },

    onStart: (event, pvMap) => {
      event.data.severity = 0.3 + Math.random() * 0.7;
    },

    onTick: (event, dt, pvMap) => {
      const h2s = pvMap['AI-A01'];
      if (h2s) h2s.externalForce += event.data.severity * 0.2;

      const absorberLevel = pvMap['LIC-A01'];
      if (absorberLevel) absorberLevel.externalForce += event.data.severity * 0.3;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'antifoam-injection') return true;
      return false;
    },

    duration: 40
  });

  // Amine Reboiler Upset
  eventSystem.registerEvent({
    id: 'amine-reboiler-upset',
    name: 'AMINE REBOILER UPSET',
    description: 'Regen reboiler temperature drifting. Lean amine quality at risk.',
    severity: 'warning',
    probability: 0.006,

    data: { direction: 'high' },

    onStart: (event, pvMap) => {
      event.data.direction = Math.random() < 0.5 ? 'high' : 'low';
      const reboiler = pvMap['TIC-A03'];
      if (reboiler) {
        reboiler.externalForce += event.data.direction === 'high' ? 2 : -2;
      }
    },

    onTick: (event, dt, pvMap) => {
      const reboiler = pvMap['TIC-A03'];
      if (reboiler) {
        reboiler.externalForce += event.data.direction === 'high' ? 0.5 : -0.5;
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'adjust-reboiler') {
        const reboiler = pvMap['TIC-A03'];
        if (reboiler) reboiler.externalForce = 0;
        return true;
      }
      return false;
    },

    duration: 45
  });

  // Amine Pump Failure
  eventSystem.registerEvent({
    id: 'amine-pump-fail',
    name: 'AMINE PUMP FAIL',
    description: 'Primary amine pump has failed. Switch to spare or lose circulation.',
    severity: 'alarm',
    probability: 0.004,
    radioMessage: 'ALARM: P-A01 AMINE PUMP TRIP — Switch to spare pump.',

    onStart: (event, pvMap) => {
      const flow = pvMap['FI-A01'];
      if (flow) flow.externalForce -= 5;
    },

    onTick: (event, dt, pvMap) => {
      const flow = pvMap['FI-A01'];
      if (flow) flow.externalForce -= 3;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'start-spare-pump') {
        const flow = pvMap['FI-A01'];
        if (flow) flow.externalForce = 0;
        return true;
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      const flow = pvMap['FI-A01'];
      if (flow) flow.externalForce = 0;
    }
  });

  // Corrosion Event (long-term consequence)
  eventSystem.registerEvent({
    id: 'corrosion-incident',
    name: 'CORROSION INCIDENT',
    description: 'Inspection found accelerated corrosion. Poor amine chemistry consequence.',
    severity: 'warning',
    probability: 0.003,
    affectedByMaintenance: true,
    radioMessage: 'Inspection: Corrosion found in regen overhead piping. Schedule repair.',

    data: { repairCost: 0 },

    onStart: (event, pvMap) => {
      const corrRate = pvMap['CI-A01'];
      event.data.repairCost = corrRate ? 3000 + corrRate.value * 500 : 5000;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'repair-now') return true;
      if (action === 'defer-repair') {
        eventSystem.deferredMaintenance.push('corrosion-repair');
        return true;
      }
      return false;
    },

    duration: 120
  });

  // Sour Gas Permitting Event
  eventSystem.registerEvent({
    id: 'sour-permit',
    name: 'SOUR GAS PERMIT',
    description: 'Work permit required for sour gas area maintenance.',
    severity: 'info',
    probability: 0.004,
    radioMessage: 'Maintenance: Requesting sour gas work permit for amine area.',

    data: { permitIssued: false, gasTestDone: false },

    onResolve: (event, action, pvMap) => {
      if (action === 'gas-test') {
        event.data.gasTestDone = true;
        return false;
      }
      if (action === 'issue-sour-permit' && event.data.gasTestDone) {
        event.data.permitIssued = true;
        return true;
      }
      return false;
    },

    duration: 60
  });
}

window.registerAmineEvents = registerAmineEvents;
