/**
 * RefrigerationEvents — Events specific to the Refrigeration Plant (Tier 2).
 * TEG failures, BTEX outages, Kimray pump issues, fuel gas swings.
 */

function registerRefrigerationEvents(eventSystem) {

  // TEG Foaming
  eventSystem.registerEvent({
    id: 'teg-foaming',
    name: 'TEG FOAMING',
    description: 'Hydrocarbon contamination causing TEG foaming. Dehydration efficiency dropping.',
    severity: 'warning',
    probability: 0.006,
    minRank: 2,
    affectedByMaintenance: true,
    radioMessage: 'Ops: Contactor tower showing signs of foaming. Check glycol conditions.',

    data: { severity: 0, efficiencyLoss: 0 },

    onStart: (event, pvMap) => {
      event.data.severity = 0.3 + Math.random() * 0.7;
    },

    onTick: (event, dt, pvMap) => {
      event.data.efficiencyLoss += event.data.severity * 0.05 * dt;
      const moisture = pvMap['AI-201'];
      if (moisture) {
        moisture.externalForce += event.data.severity * 0.3;
      }
      const contactorLevel = pvMap['LIC-201'];
      if (contactorLevel) {
        contactorLevel.externalForce += event.data.severity * 0.5;
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'antifoam-injection') return true;
      return false;
    },

    duration: 45 // Self-resolves eventually
  });

  // TEG Degradation (from reboiler too hot)
  eventSystem.registerEvent({
    id: 'teg-degradation',
    name: 'TEG DEGRADATION',
    description: 'Reboiler running too hot. TEG thermal decomposition occurring.',
    severity: 'warning',
    probability: 0,  // Triggered by conditions only
    minRank: 3,

    data: { degradation: 0 },

    onTick: (event, dt, pvMap) => {
      event.data.degradation += dt * 0.01;
      const moisture = pvMap['AI-201'];
      if (moisture) {
        moisture.externalForce += event.data.degradation * 0.1;
      }
    },

    checkResolved: (event, pvMap) => {
      const reboiler = pvMap['TIC-201'];
      return reboiler && reboiler.value < 420;
    }
  });

  // TEG Carryover
  eventSystem.registerEvent({
    id: 'teg-carryover',
    name: 'TEG CARRYOVER',
    description: 'Over-circulation causing TEG carryover. Downstream contamination.',
    severity: 'warning',
    probability: 0,
    minRank: 3,

    data: { inventoryLoss: 0 },

    onTick: (event, dt, pvMap) => {
      event.data.inventoryLoss += dt * 0.5;
      const surge = pvMap['LIC-203'];
      if (surge) {
        surge.externalForce -= 0.2; // Inventory dropping
      }
    },

    checkResolved: (event, pvMap) => {
      const flow = pvMap['FI-201'];
      return flow && flow.value < 55; // Reduce circulation to resolve
    }
  });

  // BTEX Pilot Outage
  eventSystem.registerEvent({
    id: 'btex-pilot-out',
    name: 'BTEX PILOT OUT',
    description: 'BTEX unit pilot has gone out. EPA compliance at risk.',
    severity: 'alarm',
    probability: 0.008,
    minRank: 2,
    radioMessage: 'ALARM: BTEX pilot flame out. Relight procedure required.',

    data: {
      downtime: 0,
      complianceViolation: false,
      cause: ''
    },

    onStart: (event, pvMap) => {
      const causes = ['WIND', 'LOW FUEL GAS', 'CARB BUILDUP', 'IGNITOR FAULT'];
      event.data.cause = causes[Math.floor(Math.random() * causes.length)];
      event.data.downtime = 0;
      event.data.complianceViolation = false;

      const pilot = pvMap['XI-210'];
      if (pilot) pilot.value = 0;

      const firebox = pvMap['TIC-210'];
      if (firebox) firebox.externalForce -= 20;
    },

    onTick: (event, dt, pvMap) => {
      event.data.downtime += dt;

      // BTEX must be operational whenever still is venting
      // Non-compliance after 10 game-minutes (EPA limit)
      if (event.data.downtime > 10 && !event.data.complianceViolation) {
        event.data.complianceViolation = true;
      }

      const firebox = pvMap['TIC-210'];
      if (firebox) firebox.externalForce -= 10;

      // Still column back pressure rises
      const stillOH = pvMap['TIC-203'];
      if (stillOH) stillOH.externalForce += 0.1;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'relight') {
        const pilot = pvMap['XI-210'];
        if (pilot) pilot.value = 1;
        const firebox = pvMap['TIC-210'];
        if (firebox) firebox.externalForce = 0;
        return true;
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      const pilot = pvMap['XI-210'];
      if (pilot) pilot.value = 1;
    }
  });

  // Kimray Pump Differential Pressure Swing
  eventSystem.registerEvent({
    id: 'kimray-dp-swing',
    name: 'KIMRAY DP SWING',
    description: 'Differential pressure change affecting glycol pump stroke rate.',
    severity: 'hidden', // No alarm! Player must notice.
    probability: 0.01,
    minRank: 2,

    data: { dpChange: 0 },

    onStart: (event, pvMap) => {
      event.data.dpChange = (Math.random() - 0.5) * 20; // +-10 PSI
    },

    onTick: (event, dt, pvMap) => {
      // Glycol flow drifts with DP change
      const glycolFlow = pvMap['FI-201'];
      if (glycolFlow) {
        glycolFlow.externalForce += event.data.dpChange * 0.05;
      }
    },

    duration: 30 // Self-resolves as pressures stabilize
  });

  // Fuel Gas Quality Swing
  eventSystem.registerEvent({
    id: 'fuel-gas-swing',
    name: 'FUEL GAS SWING',
    description: 'Inlet composition change affecting fuel gas BTU.',
    severity: 'info',
    probability: 0.008,
    minRank: 2,

    data: { btuShift: 0 },

    onStart: (event, pvMap) => {
      event.data.btuShift = (Math.random() - 0.5) * 100; // +/- 50 BTU
    },

    onTick: (event, dt, pvMap) => {
      const fuelBTU = pvMap['AI-401'];
      if (fuelBTU) {
        fuelBTU.externalForce += event.data.btuShift * 0.02;
      }
    },

    duration: 60 // Composition stabilizes
  });

  // Refrigeration Condenser Fouling
  eventSystem.registerEvent({
    id: 'refrig-condenser-foul',
    name: 'CONDENSER FOULING',
    description: 'Refrigeration condenser losing efficiency. Discharge temps rising.',
    severity: 'warning',
    probability: 0.004,
    minRank: 3,
    affectedByMaintenance: true,

    onTick: (event, dt, pvMap) => {
      const dischTemp = pvMap['TIC-302'];
      if (dischTemp) dischTemp.externalForce += 0.3;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'clean-condenser') return true;
      return false;
    },

    duration: 120
  });

  // Inlet Compressor Surge
  eventSystem.registerEvent({
    id: 'inlet-comp-surge',
    name: 'COMPRESSOR SURGE',
    description: 'Inlet compressor surging on low flow. Anti-surge needed.',
    severity: 'alarm',
    probability: 0.003,
    minRank: 3,
    radioMessage: 'ALARM: C-101 COMPRESSOR SURGE DETECTED',

    onStart: (event, pvMap) => {
      const suction = pvMap['PIC-101'];
      if (suction) suction.externalForce -= 5;
    },

    onTick: (event, dt, pvMap) => {
      const suction = pvMap['PIC-101'];
      if (suction) suction.externalForce -= 2;
      // Throughput drops during surge
      const throughput = pvMap['FI-501'];
      if (throughput) throughput.externalForce -= 1;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'open-recycle') return true;
      return false;
    },

    duration: 20
  });

  // NGL Pump Issues (shared with stabilizer but adapted)
  eventSystem.registerEvent({
    id: 'ref-pump-cavitation',
    name: 'NGL PUMP CAVITATION',
    description: 'Product pump losing prime. Flow dropping — no immediate alarm.',
    severity: 'hidden',
    probability: 0.005,
    minRank: 3,

    data: { cavitationSeverity: 0 },

    onStart: (event, pvMap) => {
      event.data.cavitationSeverity = 0.3 + Math.random() * 0.7;
    },

    onTick: (event, dt, pvMap) => {
      // Product flow gradually drops due to cavitation
      const productFlow = pvMap['FI-501'];
      if (productFlow) productFlow.externalForce -= 0.5;
      const pumpTemp = pvMap['TIC-302'];
      if (pumpTemp) pumpTemp.externalForce += 0.3;
    },

    duration: 25,

    onEnd: (event, pvMap) => {
      // Self-resolves or player addresses
    }
  });

  // LDAR Inspection
  eventSystem.registerEvent({
    id: 'ldar-inspection',
    name: 'LDAR INSPECTION',
    description: 'Leak detection crew arriving. Needs escort and work permit.',
    severity: 'info',
    probability: 0.005,
    minRank: 1,
    radioMessage: 'Gate: LDAR crew at front gate. Requesting escort and permit.',

    data: {
      permitIssued: false,
      leakFound: false,
      leakDeferred: false
    },

    onStart: (event, pvMap) => {
      event.data.leakFound = Math.random() < 0.4; // 40% chance they find something
    },

    onTick: (event, dt, pvMap) => {
      // Crew waiting if no permit
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'issue-permit') {
        event.data.permitIssued = true;
        if (event.data.leakFound) {
          // Crew found a leak — player decides fix now or defer
          return false; // Need another action
        }
        return true;
      }
      if (action === 'fix-leak') return true;
      if (action === 'defer-leak') {
        event.data.leakDeferred = true;
        eventSystem.deferredMaintenance.push('leak-repair');
        return true;
      }
      return false;
    },

    duration: 60
  });
}

window.registerRefrigerationEvents = registerRefrigerationEvents;
