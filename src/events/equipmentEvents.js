/**
 * EquipmentEvents — Equipment failure and operational event definitions.
 */

function registerEquipmentEvents(eventSystem) {

  // Hot Oil System Fault
  eventSystem.registerEvent({
    id: 'hot-oil-fault',
    name: 'HOT OIL FAULT',
    description: 'Hot oil heater malfunction. Heat supply degrading.',
    severity: 'alarm',
    probability: 0.008,
    affectedByMaintenance: true,
    radioMessage: 'Control room: Hot oil heater showing fault. Investigate.',

    data: {
      severity: 1, // 1-3
      heatLoss: 0
    },

    onStart: (event, pvMap) => {
      event.data.severity = Math.ceil(Math.random() * 3);
      event.data.heatLoss = 0;
    },

    onTick: (event, dt, pvMap) => {
      // Gradually reduce hot oil supply temp
      const heatLossRate = event.data.severity * 2; // degF/game-min loss
      event.data.heatLoss += heatLossRate * dt * 0.1;

      const hotOilPV = pvMap['TIC-104'];
      if (hotOilPV) {
        hotOilPV.externalForce -= heatLossRate * 0.3;
      }

      // Cascading: reboiler loses heat -> tower floods -> RVP rises
      // This happens through the cascade engine automatically via TIC-104 -> TIC-102 -> AI-501
    },

    checkResolved: null, // Must be manually resolved

    onResolve: (event, action, pvMap) => {
      if (action === 'repair') {
        return true;
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      const hotOilPV = pvMap['TIC-104'];
      if (hotOilPV) hotOilPV.externalForce = 0;
    }
  });

  // Compressor Trip
  eventSystem.registerEvent({
    id: 'comp-trip',
    name: 'COMPRESSOR TRIP',
    description: 'Overhead compressor tripped. Flash gas building pressure.',
    severity: 'critical',
    probability: 0.003,
    radioMessage: 'ALARM: C-100 OVERHEAD COMPRESSOR TRIP',

    data: {
      cause: '',
      restartAttempts: 0
    },

    onStart: (event, pvMap) => {
      const causes = ['HIGH DISCHARGE TEMP', 'LOW LUBE OIL', 'HIGH VIBRATION', 'SUCTION VALVE FAULT'];
      event.data.cause = causes[Math.floor(Math.random() * causes.length)];

      // Tower pressure rises immediately when comp stops
      const twrPress = pvMap['PIC-201'];
      if (twrPress) {
        twrPress.externalForce += 3; // Pressure building
      }
    },

    onTick: (event, dt, pvMap) => {
      // Tower pressure continues to build
      const twrPress = pvMap['PIC-201'];
      if (twrPress) {
        twrPress.externalForce += 1.5;
      }

      // Comp discharge drops to zero
      const compDisch = pvMap['PIC-202'];
      if (compDisch) {
        compDisch.externalForce -= 5;
      }

      // Overhead temp rises (no gas leaving)
      const ohTemp = pvMap['TIC-103'];
      if (ohTemp) {
        ohTemp.externalForce += 0.5;
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'restart') {
        event.data.restartAttempts++;
        // 70% chance of successful restart
        if (Math.random() < 0.7) {
          return true;
        }
        return false;
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      // Normalize forces
      const twrPress = pvMap['PIC-201'];
      if (twrPress) twrPress.externalForce = 0;
      const compDisch = pvMap['PIC-202'];
      if (compDisch) compDisch.externalForce = 0;
    }
  });

  // Instrument Air Loss
  eventSystem.registerEvent({
    id: 'instrument-air-loss',
    name: 'INSTRUMENT AIR LOSS',
    description: 'Instrument air pressure bleeding down. Pneumatic valves at risk.',
    severity: 'critical',
    probability: 0.002,
    radioMessage: 'ALARM: INSTRUMENT AIR PRESSURE LOW — ALL STATIONS',

    data: {
      airPressure: 100, // % of normal
      valvesFailed: []
    },

    onStart: (event, pvMap) => {
      event.data.airPressure = 100;
      event.data.valvesFailed = [];
    },

    onTick: (event, dt, pvMap) => {
      // Air pressure bleeds down
      event.data.airPressure = Math.max(0, event.data.airPressure - 2 * dt);

      // At various pressure levels, valves fail to last position
      if (event.data.airPressure < 60 && !event.data.valvesFailed.includes('TV-102')) {
        event.data.valvesFailed.push('TV-102');
        // Hot oil valve fails closed -> heat drops
        const hotOil = pvMap['TIC-104'];
        if (hotOil) hotOil.externalForce -= 3;
      }

      if (event.data.airPressure < 40 && !event.data.valvesFailed.includes('FV-201')) {
        event.data.valvesFailed.push('FV-201');
        // Product valve fails to 50% -> product flow changes
        const prodFlow = pvMap['FI-402'];
        if (prodFlow) prodFlow.externalForce -= 1;
      }

      if (event.data.airPressure < 20 && !event.data.valvesFailed.includes('LV-302')) {
        event.data.valvesFailed.push('LV-302');
        // Separator level valve fails -> level uncontrolled
        const sepLevel = pvMap['LIC-302'];
        if (sepLevel) sepLevel.mode = 'MAN'; // Loses auto control
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'repair-air') {
        return true;
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      event.data.airPressure = 100;
      // Restore valve control
      const sepLevel = pvMap['LIC-302'];
      if (sepLevel) sepLevel.mode = 'AUTO';
    }
  });

  // Instrument Failure (Frozen Signal)
  eventSystem.registerEvent({
    id: 'instrument-freeze',
    name: 'INSTRUMENT FAILURE',
    description: 'A thermocouple is reading flat. No alarm — just stops responding.',
    severity: 'hidden', // Player doesn't know!
    probability: 0.01,

    data: {
      frozenTag: null
    },

    onStart: (event, pvMap) => {
      // Pick a random temperature instrument to freeze
      const tempTags = ['TIC-101', 'TIC-102', 'TIC-103', 'TIC-104', 'TIC-105'];
      const tag = tempTags[Math.floor(Math.random() * tempTags.length)];
      event.data.frozenTag = tag;

      const pv = pvMap[tag];
      if (pv) pv.freeze();
    },

    onTick: (event, dt, pvMap) => {
      // Nothing visible — that's the danger
      // The real value is drifting but display is frozen
    },

    duration: 60, // Lasts 60 game-minutes then auto-resolves (instrument resets)

    onEnd: (event, pvMap) => {
      if (event.data.frozenTag) {
        const pv = pvMap[event.data.frozenTag];
        if (pv) pv.unfreeze();
      }
    }
  });

  // Tank Pop-Off Valve Lift
  eventSystem.registerEvent({
    id: 'tank-popoff',
    name: 'TANK POP-OFF LIFT',
    description: 'Product tank pressure relief valve has lifted. Product venting.',
    severity: 'alarm',
    probability: 0, // Only triggered by conditions, not random

    data: {
      productLost: 0
    },

    onStart: (event, pvMap) => {
      event.data.productLost = 0;
    },

    onTick: (event, dt, pvMap) => {
      // Product being lost
      event.data.productLost += 50 * dt; // $/game-minute

      // Tank pressure drops as gas vents
      const tankPress = pvMap['PIC-203'];
      if (tankPress) {
        tankPress.externalForce -= 2;
      }

      // Tank level slowly drops
      const tankLevel = pvMap['LIC-303'];
      if (tankLevel) {
        tankLevel.externalForce -= 0.5;
      }
    },

    checkResolved: (event, pvMap) => {
      // Resolves when tank pressure drops below relief set point
      const tankPress = pvMap['PIC-203'];
      return tankPress && tankPress.value < 65;
    },

    onEnd: (event, pvMap) => {
      // Cleanup
    }
  });

  // Truck Loading
  eventSystem.registerEvent({
    id: 'truck-arrival',
    name: 'TRUCK LOADING',
    description: 'NGL truck arrived for loading. Issue permit to proceed.',
    severity: 'info',
    probability: 0.012,
    radioMessage: 'Gate: NGL truck at loading rack. Requesting permit.',

    data: {
      permitIssued: false,
      loadingStarted: false,
      loadingProgress: 0,
      waiting: true
    },

    onStart: (event, pvMap) => {
      event.data.permitIssued = false;
      event.data.loadingStarted = false;
      event.data.loadingProgress = 0;
      event.data.waiting = true;
    },

    onTick: (event, dt, pvMap) => {
      if (event.data.loadingStarted) {
        event.data.loadingProgress += dt * 2; // ~30 min to load
        // Drain product tank
        const tankLevel = pvMap['LIC-303'];
        if (tankLevel) {
          tankLevel.externalForce -= 0.3;
        }
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'issue-permit' && !event.data.permitIssued) {
        event.data.permitIssued = true;
        event.data.loadingStarted = true;
        event.data.waiting = false;
        return false; // Not fully resolved yet — loading in progress
      }
      return false;
    },

    checkResolved: (event, pvMap) => {
      return event.data.loadingProgress >= 60;
    },

    onEnd: (event, pvMap) => {
      // Truck loaded successfully
    }
  });

  // LEL Detection Alarm (with false alarm possibility)
  eventSystem.registerEvent({
    id: 'lel-alarm',
    name: 'LEL ALARM',
    description: 'Gas concentration alarm triggered.',
    severity: 'alarm',
    probability: 0.01,

    data: {
      building: '',
      isReal: false
    },

    onStart: (event, pvMap) => {
      const buildings = ['STABILIZER', 'COMPRESSION', 'TANKS', 'INLET'];
      event.data.building = buildings[Math.floor(Math.random() * buildings.length)];
      event.data.isReal = Math.random() < 0.3; // 30% chance it's real

      if (!event.data.isReal) {
        eventSystem.recordFalseAlarm('LEL-' + event.data.building);
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'investigate') {
        return true;
      }
      if (action === 'acknowledge') {
        return !event.data.isReal; // Only resolves if false alarm
      }
      return false;
    },

    duration: 15 // Auto-clears after 15 game-minutes if not resolved
  });

  // Weather Change
  eventSystem.registerEvent({
    id: 'weather-change',
    name: 'WEATHER CHANGE',
    description: 'Ambient conditions shifting.',
    severity: 'info',
    probability: 0.008,

    data: {
      newTemp: 72,
      newWind: 'SW',
      newPrecip: 'CLEAR'
    },

    onStart: (event, pvMap) => {
      const temps = [55, 60, 65, 72, 78, 85, 92, 98];
      const winds = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const precips = ['CLEAR', 'CLEAR', 'CLEAR', 'OVERCAST', 'RAIN', 'HEAVY RAIN'];

      event.data.newTemp = temps[Math.floor(Math.random() * temps.length)];
      event.data.newWind = winds[Math.floor(Math.random() * winds.length)];
      event.data.newPrecip = precips[Math.floor(Math.random() * precips.length)];
    },

    duration: 1, // Instant event

    onEnd: (event, pvMap) => {
      // Weather changes affect inlet temp slowly
      const inletTemp = pvMap['TIC-101'];
      if (inletTemp) {
        // Ambient affects inlet liquid temp over time
        inletTemp.sp = event.data.newTemp * 0.4 + 55; // Rough approximation
      }
    }
  });
}

window.registerEquipmentEvents = registerEquipmentEvents;
