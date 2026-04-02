/**
 * CryogenicEvents — Events specific to Cryo Plant (Tier 3).
 * Expander trips, mol sieve breakthrough, cold box freeze-up,
 * mode switch scenarios, three-plant simultaneous operation.
 */

function registerCryogenicEvents(eventSystem) {

  // Expander Trip — multi-step restart procedure
  eventSystem.registerEvent({
    id: 'expander-trip',
    name: 'EXPANDER TRIP',
    description: 'Turboexpander tripped. Plant going to bypass. Full P&L impact.',
    severity: 'critical',
    probability: 0.004,
    minRank: 4,
    radioMessage: 'ALARM: EX-400 TURBOEXPANDER TRIP — BYPASS MODE',

    data: {
      cause: '',
      phase: 'tripped',       // tripped → seal-gas → lube-oil → jt-open → loading → online
      sealGasOn: false,
      lubeOilOn: false,
      jtOpen: false,
      loadingProgress: 0,     // 0–100, expander loading percentage
      loadingRate: 0,         // how fast we're loading (affected by JT close rate)
      restartAttempts: 0,
      overspeedAbort: false
    },

    onStart: (event, pvMap) => {
      const causes = ['HIGH BEARING TEMP', 'LOW LUBE OIL PRESSURE', 'OVERSPEED', 'HIGH VIBRATION', 'SUCTION PRESSURE LOW'];
      event.data.cause = causes[Math.floor(Math.random() * causes.length)];
      event.data.phase = 'tripped';
      event.data.sealGasOn = false;
      event.data.lubeOilOn = false;
      event.data.jtOpen = false;
      event.data.loadingProgress = 0;
      event.data.loadingRate = 0;
      event.data.restartAttempts = 0;
      event.data.overspeedAbort = false;

      // Expander speed drops to zero
      const speed = pvMap['SI-401'];
      if (speed) speed.externalForce -= 200;

      // Expander outlet temp rises drastically (no expansion)
      const expOut = pvMap['TIC-402'];
      if (expOut) expOut.externalForce += 15;

      // Booster comp loses drive — suction drops on residue compressors
      const booster = pvMap['PIC-602'];
      if (booster) booster.externalForce -= 10;

      // IGVs slam closed
      const igv = pvMap['FIC-401'];
      if (igv) igv.externalForce -= 65;

      // Demethanizer pressure climbs (gas not being pulled out as efficiently)
      const demetPress = pvMap['PIC-501'];
      if (demetPress) demetPress.externalForce += 8;
    },

    onTick: (event, dt, pvMap) => {
      // Continuous effects while expander is down
      const ethRecovery = pvMap['AI-701'];
      if (ethRecovery) ethRecovery.externalForce -= 5;

      const propRecovery = pvMap['AI-702'];
      if (propRecovery) propRecovery.externalForce -= 3;

      const btu = pvMap['AI-703'];
      if (btu) btu.externalForce += 2;

      const demetOH = pvMap['TIC-501'];
      if (demetOH) demetOH.externalForce += 1;

      // Cascade: booster offline → residue comp suction drops → surge risk
      if (event.data.phase === 'tripped' || event.data.phase === 'seal-gas' ||
          event.data.phase === 'lube-oil' || event.data.phase === 'jt-open') {
        const resDisch = pvMap['PIC-601'];
        if (resDisch) resDisch.externalForce -= 3;

        // Residue comp discharge temps climb on low suction
        const resTemp1 = pvMap['TIC-601'];
        if (resTemp1) resTemp1.externalForce += 0.5;
        const resTemp2 = pvMap['TIC-602'];
        if (resTemp2) resTemp2.externalForce += 0.5;
      }

      // During loading phase — expander RPM climbs gradually
      if (event.data.phase === 'loading') {
        event.data.loadingProgress += event.data.loadingRate * dt;

        // RPM proportional to loading progress
        const speed = pvMap['SI-401'];
        if (speed) {
          const targetRPM = (event.data.loadingProgress / 100) * 18500;
          speed.externalForce = -(speed.value - targetRPM) * 0.1;
        }

        // Outlet temp drops as expander loads (expansion cooling returns)
        const expOut = pvMap['TIC-402'];
        if (expOut) {
          const coolingReturn = (event.data.loadingProgress / 100) * 15;
          expOut.externalForce = 15 - coolingReturn;
        }

        // Booster pressure recovers as expander loads
        const booster = pvMap['PIC-602'];
        if (booster) {
          const boostReturn = (event.data.loadingProgress / 100) * 10;
          booster.externalForce = -10 + boostReturn;
        }

        // Check for overspeed — loading too fast causes RPM spike
        if (speed && speed.value > 22000) {
          // Hi alarm territory — warn the operator
          event.data.loadingRate = Math.max(0, event.data.loadingRate - 1);
        }
        if (speed && speed.value > 23500) {
          // HiHi — auto trip, restart fails
          event.data.phase = 'tripped';
          event.data.overspeedAbort = true;
          event.data.loadingProgress = 0;
          event.data.loadingRate = 0;
          event.data.sealGasOn = false;
          event.data.lubeOilOn = false;
          event.data.jtOpen = false;
          event.data.restartAttempts++;
          if (speed) speed.externalForce -= 200;
          if (expOut) expOut.externalForce = 15;
          if (booster) booster.externalForce -= 10;
        }

        // Successfully loaded to 100%
        if (event.data.loadingProgress >= 100) {
          event.data.phase = 'online';
        }
      }
    },

    onResolve: (event, action, pvMap) => {
      const bearing = pvMap['TIC-403'];
      const lubeOil = pvMap['PIC-402'];
      const speed = pvMap['SI-401'];

      switch (action) {
        case 'start-seal-gas':
          // Seal gas must be established first — always succeeds
          if (event.data.phase !== 'tripped') return false;
          event.data.sealGasOn = true;
          event.data.phase = 'seal-gas';
          event.data.overspeedAbort = false;
          return false; // event continues, just advanced phase

        case 'start-lube-oil':
          // Lube oil after seal gas — wrong order freezes bearings
          if (!event.data.sealGasOn) {
            // Wrong order! Lube oil without seal gas = frozen bearings
            if (bearing) bearing.externalForce += 30;
            event.data.cause = 'FROZEN BEARINGS — LUBE OIL BEFORE SEAL GAS';
            return false;
          }
          if (event.data.phase !== 'seal-gas') return false;
          event.data.lubeOilOn = true;
          event.data.phase = 'lube-oil';
          // Lube oil restores pressure
          if (lubeOil) lubeOil.externalForce += 5;
          return false;

        case 'open-jt-bypass':
          // Open JT valve to ~60% for initial bypass flow
          if (event.data.phase !== 'lube-oil') return false;
          // Check bearing temp — must be below 180 before proceeding
          if (bearing && bearing.value >= 180) return false;
          // Check lube oil — must be above 25 PSI
          if (lubeOil && lubeOil.value < 25) return false;
          event.data.jtOpen = true;
          event.data.phase = 'jt-open';
          return false;

        case 'begin-loading':
          // Start slowly closing JT to load the expander
          if (event.data.phase !== 'jt-open') return false;
          event.data.phase = 'loading';
          event.data.loadingRate = 3; // moderate rate — safe default
          // IGVs begin opening
          const igv = pvMap['FIC-401'];
          if (igv) igv.externalForce = 0; // release the slam-closed force
          return false;

        case 'load-faster':
          // Increase loading rate — risky, can cause overspeed
          if (event.data.phase !== 'loading') return false;
          event.data.loadingRate = Math.min(8, event.data.loadingRate + 2);
          return false;

        case 'load-slower':
          // Decrease loading rate — safer but takes longer
          if (event.data.phase !== 'loading') return false;
          event.data.loadingRate = Math.max(1, event.data.loadingRate - 2);
          return false;

        case 'emergency-close-igv':
          // Emergency abort — slam IGVs closed to prevent overspeed
          if (event.data.phase !== 'loading') return false;
          event.data.phase = 'jt-open'; // back to JT bypass, must restart loading
          event.data.loadingProgress = 0;
          event.data.loadingRate = 0;
          if (speed) speed.externalForce -= 200;
          return false;

        case 'confirm-online':
          // Final confirmation — expander is loaded and stable
          if (event.data.phase !== 'online') return false;
          if (speed && speed.value > 12000 && speed.value < 22000) {
            return true; // fully resolved
          }
          return false;

        default:
          return false;
      }
    },

    onEnd: (event, pvMap) => {
      // Clear all forces — expander back to normal operation
      ['SI-401', 'TIC-402', 'PIC-602', 'FIC-401', 'PIC-501', 'PIC-402',
       'PIC-601', 'TIC-601', 'TIC-602'].forEach(tag => {
        const pv = pvMap[tag];
        if (pv) pv.externalForce = 0;
      });
    }
  });

  // Mol Sieve Breakthrough
  eventSystem.registerEvent({
    id: 'molsieve-breakthrough',
    name: 'MOL SIEVE BREAKTHROUGH',
    description: 'Water breakthrough in mol sieve beds. Hydrate risk in cold box.',
    severity: 'alarm',
    probability: 0.005,
    minRank: 4,
    affectedByMaintenance: true,
    radioMessage: 'ALARM: AI-201 OUTLET MOISTURE HIGH — MOL SIEVE BREAKTHROUGH',

    data: {
      moistureLevel: 0,
      hydrating: false,
      cause: ''
    },

    onStart: (event, pvMap) => {
      const causes = ['CYCLE TIMING MISSED', 'INCOMPLETE REGEN', 'BED DEGRADATION', 'REGEN HEATER FAULT'];
      event.data.cause = causes[Math.floor(Math.random() * causes.length)];

      const moisture = pvMap['AI-201'];
      if (moisture) moisture.externalForce += 3;
    },

    onTick: (event, dt, pvMap) => {
      const moisture = pvMap['AI-201'];
      if (moisture) {
        moisture.externalForce += 1;
        event.data.moistureLevel = moisture.value;

        // Hydrate formation begins at high moisture
        if (moisture.value > 0.5 && !event.data.hydrating) {
          event.data.hydrating = true;
        }
      }

      if (event.data.hydrating) {
        // Cold box starts plugging
        const coldSep = pvMap['TIC-303'];
        if (coldSep) coldSep.externalForce += 0.3;

        // Expander inlet affected
        const expInlet = pvMap['TIC-401'];
        if (expInlet) expInlet.externalForce += 0.2;
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'switch-beds') {
        const moisture = pvMap['AI-201'];
        if (moisture) moisture.externalForce = 0;
        return true;
      }
      if (action === 'eg-injection') {
        // EG injection helps but doesn't fully resolve
        event.data.hydrating = false;
        return false;
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      const moisture = pvMap['AI-201'];
      if (moisture) moisture.externalForce = 0;
    }
  });

  // Cold Box Freeze-Up
  eventSystem.registerEvent({
    id: 'cold-box-freeze',
    name: 'COLD BOX FREEZE-UP',
    description: 'Ice formation in cold box exchangers. Major recovery event.',
    severity: 'critical',
    probability: 0.002,
    minRank: 4,
    radioMessage: 'CRITICAL: Cold box temperatures erratic — possible freeze-up. Check all upstream systems.',

    data: {
      severity: 0,
      recoveryPhase: 'active'
    },

    onStart: (event, pvMap) => {
      event.data.severity = 0.5 + Math.random() * 0.5;

      // Cold box temps become erratic
      const gasGas = pvMap['TIC-301'];
      if (gasGas) gasGas.noise = 3; // Much more noise

      const gasProd = pvMap['TIC-302'];
      if (gasProd) gasProd.noise = 3;

      const coldSep = pvMap['TIC-303'];
      if (coldSep) {
        coldSep.noise = 4;
        coldSep.externalForce += 5; // Temps rising as flow blocked
      }
    },

    onTick: (event, dt, pvMap) => {
      // Flow restriction through cold box
      const flow = pvMap['FI-100'];
      if (flow) flow.externalForce -= event.data.severity * 2;

      // Expander suction dropping
      const expSuction = pvMap['PIC-401'];
      if (expSuction) expSuction.externalForce -= event.data.severity;

      // Cold sep temps rising
      const coldSep = pvMap['TIC-303'];
      if (coldSep) coldSep.externalForce += event.data.severity * 0.5;

      // Track warmup time during warming phase
      if (event.data.recoveryPhase === 'warming') {
        event.data.warmupTime = (event.data.warmupTime || 0) + dt;
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'controlled-warmup') {
        // Begin slow warmup procedure — takes time
        event.data.recoveryPhase = 'warming';
        return false; // Needs more time
      }
      if (action === 'complete-warmup' && event.data.recoveryPhase === 'warming') {
        // Require at least 10 minutes of warming
        if (event.data.warmupTime && event.data.warmupTime >= 10) {
          // Restore normal noise levels
          ['TIC-301', 'TIC-302', 'TIC-303'].forEach(tag => {
            const pv = pvMap[tag];
            if (pv) pv.noise = 0.4;
          });
          event.data.recoveryPhase = 'complete';
          return true;
        }
        return false; // Not warm enough yet
      }
      return false;
    },

    onEnd: (event, pvMap) => {
      ['TIC-301', 'TIC-302', 'TIC-303'].forEach(tag => {
        const pv = pvMap[tag];
        if (pv) {
          pv.noise = 0.4;
          pv.externalForce = 0;
        }
      });
    }
  });

  // Cold Box Fin Damage (hidden — from excessive rate-of-change)
  eventSystem.registerEvent({
    id: 'coldbox-fin-damage',
    name: 'COLD BOX FIN DAMAGE',
    description: 'Hidden brazed aluminum fin damage from rate-of-change violation.',
    severity: 'hidden',
    probability: 0, // Only triggered by rate-of-change violations
    minRank: 4,

    data: {
      damagePercent: 0,
      discoveredByPlayer: false,
      efficiencyLoss: 0
    },

    onTick: (event, dt, pvMap) => {
      // Subtle efficiency loss over time
      event.data.efficiencyLoss = event.data.damagePercent * 0.05;

      const ethRecovery = pvMap['AI-701'];
      if (ethRecovery) ethRecovery.externalForce -= event.data.efficiencyLoss;

      const propRecovery = pvMap['AI-702'];
      if (propRecovery) propRecovery.externalForce -= event.data.efficiencyLoss * 0.5;
    },

    // This event persists until repaired
    checkResolved: null,

    onResolve: (event, action, pvMap) => {
      if (action === 'repair-coldbox') return true;
      return false;
    }
  });

  // Residue Compressor Fault
  eventSystem.registerEvent({
    id: 'res-comp-fault',
    name: 'RESIDUE COMP FAULT',
    description: 'Residue compressor fault. Coolant line or valve failure.',
    severity: 'alarm',
    probability: 0.004,
    minRank: 3,
    radioMessage: 'ALARM: Residue compressor fault — investigate immediately.',

    data: {
      compNumber: 1,
      cause: '',
      fireEyeTripped: false
    },

    onStart: (event, pvMap) => {
      event.data.compNumber = Math.ceil(Math.random() * 3);
      const causes = ['COOLANT LINE RUPTURE', 'HIGH DISCHARGE TEMP', 'LOW LUBE OIL', 'VALVE FAILURE'];
      event.data.cause = causes[Math.floor(Math.random() * causes.length)];

      if (event.data.cause === 'COOLANT LINE RUPTURE') {
        event.data.fireEyeTripped = true;
      }

      // Residue pressure drops
      const resDisch = pvMap['PIC-601'];
      if (resDisch) resDisch.externalForce -= 5;

      // Affected comp discharge temp
      const compTag = 'TIC-60' + event.data.compNumber;
      const compTemp = pvMap[compTag];
      if (compTemp && event.data.cause === 'HIGH DISCHARGE TEMP') {
        compTemp.externalForce += 5;
      }
    },

    onTick: (event, dt, pvMap) => {
      const resDisch = pvMap['PIC-601'];
      if (resDisch) resDisch.externalForce -= 2;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'repair-compressor') return true;
      return false;
    },

    onEnd: (event, pvMap) => {
      const resDisch = pvMap['PIC-601'];
      if (resDisch) resDisch.externalForce = 0;
    }
  });

  // Demethanizer Flooding
  eventSystem.registerEvent({
    id: 'demet-flooding',
    name: 'DEMETHANIZER FLOOD',
    description: 'Liquid overwhelming demethanizer. Separation collapsing.',
    severity: 'alarm',
    probability: 0.003,
    minRank: 3,
    radioMessage: 'ALARM: Demethanizer differential pressure spiking — possible flood.',

    data: { floodSeverity: 0 },

    onStart: (event, pvMap) => {
      event.data.floodSeverity = 0.4 + Math.random() * 0.6;
    },

    onTick: (event, dt, pvMap) => {
      // Overhead temp rises (poor separation)
      const demetOH = pvMap['TIC-501'];
      if (demetOH) demetOH.externalForce += event.data.floodSeverity * 0.5;

      // RVP spikes (light ends in product)
      const rvp = pvMap['AI-704'];
      if (rvp) rvp.externalForce += event.data.floodSeverity * 0.3;

      // Sump level rises
      const sump = pvMap['LIC-501'];
      if (sump) sump.externalForce += event.data.floodSeverity * 1;
    },

    checkResolved: (event, pvMap) => {
      const sump = pvMap['LIC-501'];
      return sump && sump.value < 65 && event.elapsed > 15;
    },

    onEnd: (event, pvMap) => {
      ['TIC-501', 'AI-704', 'LIC-501'].forEach(tag => {
        const pv = pvMap[tag];
        if (pv) pv.externalForce = 0;
      });
    }
  });

  // NGL Pump Bearing Overheat
  eventSystem.registerEvent({
    id: 'pump-bearing-hot',
    name: 'PUMP BEARING HOT',
    description: 'NGL pump bearing temperature trending up. Early warning — fire risk if ignored.',
    severity: 'warning',
    probability: 0.005,
    minRank: 3,
    increasesWithTime: true,

    data: { tempRise: 0, failureOccurred: false },

    onTick: (event, dt, pvMap) => {
      event.data.tempRise += 0.3 * dt;

      // If ignored for too long, bearing fails
      if (event.data.tempRise > 40 && !event.data.failureOccurred) {
        event.data.failureOccurred = true;
        // Fire risk inside plant
        eventSystem.scheduleEvent('pump-bearing-failure', 0, {});
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'switch-to-spare') return true;
      if (action === 'reduce-flow') {
        event.data.tempRise = Math.max(0, event.data.tempRise - 10);
        return event.data.tempRise < 5;
      }
      return false;
    },

    duration: 90
  });

  // Pump Bearing Failure (cascades from bearing hot)
  eventSystem.registerEvent({
    id: 'pump-bearing-failure',
    name: 'PUMP BEARING FAILURE',
    description: 'NGL pump bearing has failed. Fire risk. ESD possible.',
    severity: 'critical',
    probability: 0,
    minRank: 4,
    radioMessage: 'CRITICAL: P-701 BEARING FAILURE — FIRE RISK IN PUMP AREA',

    onStart: (event, pvMap) => {
      // Fire eye trips on bearing failure
      const bearing = pvMap['TIC-403'];
      if (bearing) bearing.externalForce += 15;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'esd-pump') return true;
      return false;
    },

    duration: 30
  });

  // Mode Switch Event (player-initiated but tracked)
  eventSystem.registerEvent({
    id: 'mode-switch',
    name: 'MODE SWITCH',
    description: 'Mode switch in progress. Critical rate management required.',
    severity: 'info',
    probability: 0, // Player-initiated only
    minRank: 4,

    data: {
      fromMode: 'ethane',
      toMode: 'propane',
      phase: 'limp-down', // limp-down, switching, rate-management, bring-up, stable
      phaseProgress: 0,
      rateViolations: 0,
      fieldConfirmed: false
    },

    onTick: (event, dt, pvMap) => {
      const d = event.data;

      switch (d.phase) {
        case 'limp-down':
          // Throttle throughput
          d.phaseProgress += dt * 0.5;
          const flow = pvMap['FI-100'];
          if (flow) flow.externalForce -= 1;
          if (d.phaseProgress > 30 && d.fieldConfirmed) {
            d.phase = 'switching';
            d.phaseProgress = 0;
          }
          break;

        case 'switching':
          // Boards start moving immediately
          d.phaseProgress += dt;
          // Temp trends begin across cold box
          const gasGas = pvMap['TIC-301'];
          if (gasGas) gasGas.externalForce += (d.toMode === 'propane' ? 0.3 : -0.3);
          const gasProd = pvMap['TIC-302'];
          if (gasProd) gasProd.externalForce += (d.toMode === 'propane' ? 0.4 : -0.4);
          if (d.phaseProgress > 15) {
            d.phase = 'rate-management';
            d.phaseProgress = 0;
          }
          break;

        case 'rate-management':
          // Critical phase — monitor rate of change
          d.phaseProgress += dt;
          ['TIC-301', 'TIC-302', 'TIC-303'].forEach(tag => {
            const pv = pvMap[tag];
            if (pv && Math.abs(pv.rateOfChange) > (pv.maxRateOfChange || 3)) {
              d.rateViolations++;
              // Hidden damage accumulates
              pv.damageAccumulator += Math.abs(pv.rateOfChange) * 0.1;
            }
          });
          if (d.phaseProgress > 60) {
            d.phase = 'bring-up';
            d.phaseProgress = 0;
          }
          break;

        case 'bring-up':
          // Two-hour bring-up (120 game-minutes)
          d.phaseProgress += dt;
          // Gradually restore throughput
          const flowBU = pvMap['FI-100'];
          if (flowBU) flowBU.externalForce += 0.2;
          if (d.phaseProgress > 120) {
            d.phase = 'stable';
          }
          break;

        case 'stable':
          // Complete
          break;
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'confirm-field') {
        event.data.fieldConfirmed = true;
        return false; // Don't end event yet
      }
      return false;
    },

    checkResolved: (event, pvMap) => {
      return event.data.phase === 'stable';
    },

    onEnd: (event, pvMap) => {
      // Clear forces
      ['FI-100', 'TIC-301', 'TIC-302', 'TIC-303'].forEach(tag => {
        const pv = pvMap[tag];
        if (pv) pv.externalForce = 0;
      });
    }
  });

  // Separator Flood (liquid-full — worst case pig scenario)
  eventSystem.registerEvent({
    id: 'separator-flood',
    name: 'SEPARATOR FLOOD',
    description: 'HiHi level triggered. ESD fired. Liquid-full separator. 10-hour recovery.',
    severity: 'critical',
    probability: 0,
    minRank: 4,
    radioMessage: 'ESD ACTIVATED: Separator liquid-full. Begin recovery procedure.',

    data: {
      drainProgress: 0,
      drainPhase: 'initial', // initial, draining, checking, clearing
      totalRecoveryTime: 0
    },

    onTick: (event, dt, pvMap) => {
      event.data.totalRecoveryTime += dt;

      // Plant is down — zero revenue
      const flow = pvMap['FI-100'] || pvMap['FI-501'];
      if (flow) flow.externalForce -= 10;
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'drain-separator') {
        event.data.drainPhase = 'draining';
        event.data.drainProgress += 20;
        return event.data.drainProgress >= 100;
      }
      return false;
    },

    duration: 600 // 10 game-hours max
  });

  // Fire Eye Alarm (building-specific)
  eventSystem.registerEvent({
    id: 'fire-eye-alarm',
    name: 'FIRE EYE ALARM',
    description: 'Fire detection alarm in plant area.',
    severity: 'alarm',
    probability: 0.006,
    minRank: 2,
    radioMessage: 'FIRE EYE ALARM — Verify real or false.',

    data: {
      building: '',
      isReal: false,
      cause: ''
    },

    onStart: (event, pvMap) => {
      const buildings = ['COLD BOX', 'COMPRESSION', 'NGL PUMPS', 'REFRIGERATION'];
      event.data.building = buildings[Math.floor(Math.random() * buildings.length)];
      event.data.isReal = Math.random() < 0.2; // 20% real
      if (event.data.isReal) {
        const causes = ['COOLANT LINE SPRAY ON TURBO', 'BEARING OVERHEAT', 'ELECTRICAL ARC'];
        event.data.cause = causes[Math.floor(Math.random() * causes.length)];
      }
      if (!event.data.isReal) {
        eventSystem.recordFalseAlarm('FIRE-' + event.data.building);
      }
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'investigate') return true;
      if (action === 'acknowledge') return !event.data.isReal;
      return false;
    },

    duration: 20
  });

  // Feed Gas Composition Swing
  eventSystem.registerEvent({
    id: 'feed-composition-swing',
    name: 'FEED COMP SWING',
    description: 'Upstream production change. BTU, H2S, CO2 all shifting.',
    severity: 'info',
    probability: 0.007,
    minRank: 2,
    radioMessage: 'Pipeline: Feed gas composition changing. Upstream well brought online/shut in.',

    data: { btuShift: 0, h2sShift: 0 },

    onStart: (event, pvMap) => {
      event.data.btuShift = (Math.random() - 0.5) * 80;
      event.data.h2sShift = (Math.random() - 0.3) * 2; // Usually increases
    },

    onTick: (event, dt, pvMap) => {
      const fuelBTU = pvMap['AI-801'];
      if (fuelBTU) fuelBTU.externalForce += event.data.btuShift * 0.01;

      const h2s = pvMap['AI-705'];
      if (h2s) h2s.externalForce += event.data.h2sShift * 0.05;
    },

    duration: 90
  });

  // Flare Stack Fire
  eventSystem.registerEvent({
    id: 'flare-fire',
    name: 'FLARE STACK FIRE',
    description: 'Liquids going to flare. Visible fire at flare tip.',
    severity: 'alarm',
    probability: 0.002,
    minRank: 3,
    radioMessage: 'VISUAL: Excessive flame at flare stack. Check liquid routing to flare.',

    onTick: (event, dt, pvMap) => {
      // Managed by reducing what goes to flare
    },

    onResolve: (event, action, pvMap) => {
      if (action === 'check-flare-routing') return true;
      return false;
    },

    duration: 30
  });
}

window.registerCryogenicEvents = registerCryogenicEvents;
