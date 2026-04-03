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
    minRank: 1,
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
      event.data.warningsSent = 0;
      event.data.arrivalAnnounced = false;
    },

    onTick: (event, dt, pvMap) => {
      const d = event.data;

      if (d.surgePhase === 'approaching') {
        // Progressive radio warnings during approach
        const timeLeft = d.arrivalDelay - event.elapsed;
        if (timeLeft <= 10 && d.warningsSent < 1) {
          d.warningsSent = 1;
          if (event.onRadio) event.onRadio('Pipeline: Pig 10 minutes out. Ramp up FIC-401 now.');
        }
        if (timeLeft <= 5 && d.warningsSent < 2) {
          d.warningsSent = 2;
          if (event.onRadio) event.onRadio('Pipeline: Pig 5 minutes out! Check separator level!');
        }
        if (timeLeft <= 2 && d.warningsSent < 3) {
          d.warningsSent = 3;
          if (event.onRadio) event.onRadio('Pipeline: PIG AT THE DOOR!');
        }
        if (event.elapsed >= d.arrivalDelay) {
          d.surgePhase = 'arriving';
          if (!d.arrivalAnnounced && event.onRadio) {
            event.onRadio('Pipeline: Pig in receiver. Liquid surge hitting separator.');
            d.arrivalAnnounced = true;
          }
        }
        return;
      }

      if (d.surgePhase === 'arriving') {
        d.liquidSurge = Math.min(d.peakSurge, d.liquidSurge + d.peakSurge * 0.1 * dt);
        if (d.liquidSurge >= d.peakSurge * 0.95) {
          d.surgePhase = 'peak';
        }
      }

      if (d.surgePhase === 'peak') {
        d.liquidSurge = d.peakSurge;
        if (event.elapsed > d.arrivalDelay + 8) {
          d.surgePhase = 'trailing';
        }
      }

      if (d.surgePhase === 'trailing') {
        d.liquidSurge = Math.max(0, d.liquidSurge - d.peakSurge * 0.05 * dt);
      }

      // Pig slug hits the separator — level is the primary impact
      const sepPV = pvMap['LIC-302'] || pvMap['LIC-201'] || pvMap['LIC-301'];
      const feedPV = pvMap['FIC-401'] || pvMap['FI-501'] || pvMap['FI-100'];
      if (sepPV && d.liquidSurge > 0) {
        // Higher feed SP = pulling more liquid off separator = less level rise
        const feedSP = feedPV ? feedPV.sp : 120;
        const pullFactor = Math.max(0.3, Math.min(1.0, 1.0 - (feedSP - 120) / 200));
        sepPV.externalForce += d.liquidSurge * 0.06 * pullFactor;
      }
    },

    checkResolved: (event, pvMap) => {
      // Pig event ends when surge drops to near zero and separator is stable
      return event.data.surgePhase === 'trailing' && event.data.liquidSurge < 5;
    },

    onEnd: (event, pvMap) => {
      const sepPV = pvMap['LIC-302'] || pvMap['LIC-201'] || pvMap['LIC-301'];
      if (sepPV) sepPV.externalForce = 0;
    }
  });

  // Fast pig — Less warning time
  eventSystem.registerEvent({
    id: 'pig-fast',
    name: 'FAST PIG ARRIVAL',
    description: 'Pig arriving faster than expected. Tighter margins.',
    severity: 'alarm',
    probability: 0.005,
    minRank: 2,
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
      event.data.warningsSent = 0;
      event.data.arrivalAnnounced = false;
    },

    onTick: (event, dt, pvMap) => {
      const d = event.data;

      if (d.surgePhase === 'approaching') {
        const timeLeft = d.arrivalDelay - event.elapsed;
        if (timeLeft <= 3 && d.warningsSent < 1) {
          d.warningsSent = 1;
          if (event.onRadio) event.onRadio('Pipeline: FAST PIG — 3 minutes! Ramp FIC-401 NOW!');
        }
        if (timeLeft <= 1 && d.warningsSent < 2) {
          d.warningsSent = 2;
          if (event.onRadio) event.onRadio('Pipeline: PIG AT THE DOOR!');
        }
        if (event.elapsed >= d.arrivalDelay) {
          d.surgePhase = 'arriving';
          if (!d.arrivalAnnounced && event.onRadio) {
            event.onRadio('Pipeline: Pig in receiver. Heavy surge!');
            d.arrivalAnnounced = true;
          }
        }
        return;
      }

      if (d.surgePhase === 'arriving') {
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

      const sepPV = pvMap['LIC-302'] || pvMap['LIC-201'] || pvMap['LIC-301'];
      const feedPV = pvMap['FIC-401'] || pvMap['FI-501'] || pvMap['FI-100'];
      if (sepPV && d.liquidSurge > 0) {
        const feedSP = feedPV ? feedPV.sp : 120;
        const pullFactor = Math.max(0.3, Math.min(1.0, 1.0 - (feedSP - 120) / 200));
        sepPV.externalForce += d.liquidSurge * 0.08 * pullFactor;
      }
    },

    checkResolved: (event, pvMap) => {
      return event.data.surgePhase === 'trailing' && event.data.liquidSurge < 5;
    },

    onEnd: (event, pvMap) => {
      const sepPV = pvMap['LIC-302'] || pvMap['LIC-201'] || pvMap['LIC-301'];
      if (sepPV) sepPV.externalForce = 0;
    }
  });

  // Back-to-back pigs
  eventSystem.registerEvent({
    id: 'pig-double',
    name: 'BACK-TO-BACK PIGS',
    description: 'Second pig detected before recovery from first. No rest.',
    severity: 'alarm',
    probability: 0.003,
    minRank: 4,
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

      const sepPV = pvMap['LIC-302'] || pvMap['LIC-201'] || pvMap['LIC-301'];
      const feedPV = pvMap['FIC-401'] || pvMap['FI-501'] || pvMap['FI-100'];
      if (sepPV && totalSurge > 0) {
        const feedSP = feedPV ? feedPV.sp : 120;
        const pullFactor = Math.max(0.3, Math.min(1.0, 1.0 - (feedSP - 120) / 200));
        sepPV.externalForce += totalSurge * 0.07 * pullFactor;
      }
    },

    checkResolved: (event, pvMap) => {
      return event.data.pigs.every(p => p.phase === 'done');
    },

    onEnd: (event, pvMap) => {
      const sepPV = pvMap['LIC-302'] || pvMap['LIC-201'] || pvMap['LIC-301'];
      if (sepPV) sepPV.externalForce = 0;
    }
  });
}

window.registerPigEvents = registerPigEvents;
