/**
 * PigEvents — Pig arrival event definitions for the stabilizer.
 * Pig arrivals are the single biggest training challenge for new operators.
 */

function registerPigEvents(eventSystem) {
  // Single pig, single line — Base difficulty
  eventSystem.registerEvent({
    id: 'pig-single',
    name: 'PIG ARRIVAL',
    description: 'Single pig arriving on inlet line. Manage liquid surge.',
    severity: 'warning',
    probability: 0.015,
    increasesWithTime: true,
    radioMessage: 'Pipeline: Pig launched on Line 1. Estimate arrival 15-25 minutes.',
    duration: null, // Ends when resolved

    data: {
      liquidSurge: 0,
      peakSurge: 200 + Math.random() * 150, // 200-350 bbl/hr surge
      surgePhase: 'approaching', // approaching, arriving, peak, trailing
      arrivalDelay: 15 + Math.random() * 10, // 15-25 game-minutes
      pinchValveAdjusted: false
    },

    onStart: (event, pvMap) => {
      event.data.peakSurge = 200 + Math.random() * 150;
      event.data.arrivalDelay = 15 + Math.random() * 10;
      event.data.surgePhase = 'approaching';
      event.data.liquidSurge = 0;
    },

    onTick: (event, dt, pvMap) => {
      const d = event.data;

      if (d.surgePhase === 'approaching') {
        if (event.elapsed >= d.arrivalDelay) {
          d.surgePhase = 'arriving';
        }
        return;
      }

      if (d.surgePhase === 'arriving') {
        // Liquid surge ramps up
        d.liquidSurge = Math.min(d.peakSurge, d.liquidSurge + d.peakSurge * 0.1 * dt);
        if (d.liquidSurge >= d.peakSurge * 0.95) {
          d.surgePhase = 'peak';
        }
      }

      if (d.surgePhase === 'peak') {
        // Hold peak briefly
        d.liquidSurge = d.peakSurge;
        if (event.elapsed > d.arrivalDelay + 8) {
          d.surgePhase = 'trailing';
        }
      }

      if (d.surgePhase === 'trailing') {
        // Surge tapers off
        d.liquidSurge = Math.max(0, d.liquidSurge - d.peakSurge * 0.05 * dt);
      }

      // Apply liquid surge to feed flow
      const feedPV = pvMap['FI-401'];
      if (feedPV) {
        feedPV.externalForce += d.liquidSurge * 0.05;
      }

      // Pinch valve effect: if XV-101 is partially closed, reduce gas flow impact
      // but still allow liquid through (liquid flows through pig receiver regardless)
      const sepPV = pvMap['LIC-302'];
      if (sepPV && d.liquidSurge > 0) {
        sepPV.externalForce += d.liquidSurge * 0.03;
      }
    },

    checkResolved: (event, pvMap) => {
      // Pig event ends when surge drops to near zero and separator is stable
      return event.data.surgePhase === 'trailing' && event.data.liquidSurge < 5;
    },

    onEnd: (event, pvMap) => {
      // Cleanup — remove surge forces
      const feedPV = pvMap['FI-401'];
      if (feedPV) feedPV.externalForce = 0;
    }
  });

  // Fast pig — Less warning time
  eventSystem.registerEvent({
    id: 'pig-fast',
    name: 'FAST PIG ARRIVAL',
    description: 'Pig arriving faster than expected. Tighter margins.',
    severity: 'alarm',
    probability: 0.005,
    increasesWithTime: true,
    radioMessage: 'Pipeline: Pig on Line 1 moving fast! Estimate 5-10 minutes!',
    duration: null,

    data: {
      liquidSurge: 0,
      peakSurge: 300 + Math.random() * 100,
      surgePhase: 'approaching',
      arrivalDelay: 5 + Math.random() * 5, // Much less warning
      pinchValveAdjusted: false
    },

    onStart: (event, pvMap) => {
      event.data.peakSurge = 300 + Math.random() * 100;
      event.data.arrivalDelay = 5 + Math.random() * 5;
      event.data.surgePhase = 'approaching';
      event.data.liquidSurge = 0;
    },

    onTick: (event, dt, pvMap) => {
      const d = event.data;

      if (d.surgePhase === 'approaching') {
        if (event.elapsed >= d.arrivalDelay) {
          d.surgePhase = 'arriving';
        }
        return;
      }

      if (d.surgePhase === 'arriving') {
        // Faster ramp
        d.liquidSurge = Math.min(d.peakSurge, d.liquidSurge + d.peakSurge * 0.2 * dt);
        if (d.liquidSurge >= d.peakSurge * 0.95) {
          d.surgePhase = 'peak';
        }
      }

      if (d.surgePhase === 'peak') {
        d.liquidSurge = d.peakSurge;
        if (event.elapsed > d.arrivalDelay + 5) {
          d.surgePhase = 'trailing';
        }
      }

      if (d.surgePhase === 'trailing') {
        d.liquidSurge = Math.max(0, d.liquidSurge - d.peakSurge * 0.07 * dt);
      }

      const feedPV = pvMap['FI-401'];
      if (feedPV) feedPV.externalForce += d.liquidSurge * 0.06;

      const sepPV = pvMap['LIC-302'];
      if (sepPV && d.liquidSurge > 0) {
        sepPV.externalForce += d.liquidSurge * 0.04;
      }
    },

    checkResolved: (event, pvMap) => {
      return event.data.surgePhase === 'trailing' && event.data.liquidSurge < 5;
    },

    onEnd: (event, pvMap) => {
      const feedPV = pvMap['FI-401'];
      if (feedPV) feedPV.externalForce = 0;
    }
  });

  // Back-to-back pigs
  eventSystem.registerEvent({
    id: 'pig-double',
    name: 'BACK-TO-BACK PIGS',
    description: 'Second pig detected before recovery from first. No rest.',
    severity: 'alarm',
    probability: 0.003,
    radioMessage: 'Pipeline: Second pig launched! First pig still in transit!',
    duration: null,

    data: {
      pigs: [],
      surgePhase: 'first-approaching'
    },

    onStart: (event, pvMap) => {
      event.data.pigs = [
        { delay: 10 + Math.random() * 5, surge: 0, peak: 250 + Math.random() * 100, phase: 'approaching' },
        { delay: 25 + Math.random() * 10, surge: 0, peak: 200 + Math.random() * 100, phase: 'approaching' }
      ];
    },

    onTick: (event, dt, pvMap) => {
      let totalSurge = 0;

      for (const pig of event.data.pigs) {
        if (pig.phase === 'approaching' && event.elapsed >= pig.delay) {
          pig.phase = 'arriving';
        }
        if (pig.phase === 'arriving') {
          pig.surge = Math.min(pig.peak, pig.surge + pig.peak * 0.12 * dt);
          if (pig.surge >= pig.peak * 0.95) pig.phase = 'peak';
        }
        if (pig.phase === 'peak') {
          pig.surge = pig.peak;
          if (event.elapsed > pig.delay + 8) pig.phase = 'trailing';
        }
        if (pig.phase === 'trailing') {
          pig.surge = Math.max(0, pig.surge - pig.peak * 0.05 * dt);
          if (pig.surge < 1) pig.phase = 'done';
        }
        totalSurge += pig.surge;
      }

      const feedPV = pvMap['FI-401'];
      if (feedPV) feedPV.externalForce += totalSurge * 0.05;

      const sepPV = pvMap['LIC-302'];
      if (sepPV && totalSurge > 0) sepPV.externalForce += totalSurge * 0.035;
    },

    checkResolved: (event, pvMap) => {
      return event.data.pigs.every(p => p.phase === 'done');
    }
  });
}

window.registerPigEvents = registerPigEvents;
