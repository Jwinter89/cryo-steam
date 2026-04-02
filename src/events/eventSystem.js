/**
 * EventSystem — Manages random and scheduled events during gameplay.
 * Events have probability weights, trigger conditions, and consequences.
 */

class EventSystem {
  constructor() {
    this.events = [];           // Registered event types
    this.activeEvents = [];     // Currently active events
    this.eventHistory = [];     // Log of all events this shift
    this.falseAlarmCount = {};  // Per-detector false alarm count
    this.complacencyMeter = 0;  // 0-1, affects response time
    this.deferredMaintenance = []; // Deferred items increase event probability

    // Callbacks
    this.onEventStart = null;
    this.onEventEnd = null;
    this.onRadioMessage = null;

    // FNAF-style progressive difficulty (set via setDifficulty)
    this.rankLevel = 1;
    this.difficultyProfile = EventSystem.DIFFICULTY[1];

    // Scheduling — defaults overridden by setDifficulty()
    this.nextEventCheck = 120;
    this.eventCheckInterval = 5;
    this.minTimeBetweenEvents = 10;
    this.lastEventTime = 0;

    // Scheduled events queue
    this.scheduledEvents = [];
  }

  /**
   * FNAF-style difficulty profiles keyed by career rank level.
   * gracePeriod: game-minutes before any random event can fire
   * probMultiplier: scales all base probabilities
   * maxSimultaneous: cap on concurrent active events
   * minTimeBetween: minimum gap between random events (game-minutes)
   * eventCheckInterval: how often to roll (game-minutes)
   */
  static get DIFFICULTY() {
    return {
      1: { gracePeriod: 120, probMultiplier: 0.25, maxSimultaneous: 1, minTimeBetween: 30, eventCheckInterval: 8 },
      2: { gracePeriod: 60,  probMultiplier: 0.5,  maxSimultaneous: 2, minTimeBetween: 20, eventCheckInterval: 6 },
      3: { gracePeriod: 30,  probMultiplier: 0.8,  maxSimultaneous: 2, minTimeBetween: 15, eventCheckInterval: 5 },
      4: { gracePeriod: 15,  probMultiplier: 1.0,  maxSimultaneous: 3, minTimeBetween: 10, eventCheckInterval: 5 },
      5: { gracePeriod: 10,  probMultiplier: 1.2,  maxSimultaneous: 3, minTimeBetween: 8,  eventCheckInterval: 4 },
      6: { gracePeriod: 5,   probMultiplier: 1.4,  maxSimultaneous: 3, minTimeBetween: 5,  eventCheckInterval: 3 },
      7: { gracePeriod: 2,   probMultiplier: 1.6,  maxSimultaneous: 4, minTimeBetween: 3,  eventCheckInterval: 2 }
    };
  }

  /**
   * Set difficulty based on career rank. Call before first tick.
   */
  setDifficulty(rankLevel) {
    this.rankLevel = rankLevel || 1;
    this.difficultyProfile = EventSystem.DIFFICULTY[this.rankLevel] || EventSystem.DIFFICULTY[1];
    this.nextEventCheck = this.difficultyProfile.gracePeriod;
    this.eventCheckInterval = this.difficultyProfile.eventCheckInterval;
    this.minTimeBetweenEvents = this.difficultyProfile.minTimeBetween;
  }

  /**
   * Register an event type
   */
  registerEvent(eventDef) {
    this.events.push({
      ...eventDef,
      id: eventDef.id || `evt-${this.events.length}`,
      baseProbability: eventDef.probability || 0.01,
      minRank: eventDef.minRank || 1,
      active: false
    });
  }

  /**
   * Schedule a specific event at a game time
   */
  scheduleEvent(eventId, gameTime, data) {
    this.scheduledEvents.push({ eventId, gameTime, data });
  }

  /**
   * Main tick — check for events, update active ones
   */
  tick(dt, gameTime, pvMap, speed) {
    this._currentGameTime = gameTime;
    const spd = speed || 1;

    // Process scheduled events
    this.scheduledEvents = this.scheduledEvents.filter(se => {
      if (gameTime >= se.gameTime) {
        this._startEvent(se.eventId, pvMap, se.data);
        return false;
      }
      return true;
    });

    // Periodic probability check for random events
    // Countdown uses base dt (1 game-min/real-sec) so real-world pacing
    // stays consistent regardless of speed setting
    const baseDt = spd > 0 ? dt / spd : dt;
    this.nextEventCheck -= baseDt;
    if (this.nextEventCheck <= 0) {
      this.nextEventCheck = this.eventCheckInterval;
      if (gameTime - this.lastEventTime >= this.minTimeBetweenEvents * spd) {
        this._rollForEvents(gameTime, pvMap);
      }
    }

    // Update active events
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      const ae = this.activeEvents[i];
      ae.elapsed += dt;

      // Run event's tick function if it has one
      if (ae.onTick) {
        ae.onTick(ae, dt, pvMap);
      }

      // Check if event has ended
      if (ae.duration && ae.elapsed >= ae.duration) {
        this._endEvent(i, pvMap);
      }
      // Check if event resolved by player action
      if (ae.checkResolved && ae.checkResolved(ae, pvMap)) {
        this._endEvent(i, pvMap);
      }
    }

    // Update complacency meter based on false alarm history
    const totalFalse = Object.values(this.falseAlarmCount).reduce((a, b) => a + b, 0);
    this.complacencyMeter = Math.min(1, totalFalse * 0.1);
  }

  _rollForEvents(gameTime, pvMap) {
    const dp = this.difficultyProfile;

    for (const evt of this.events) {
      if (evt.active) continue;
      if (this.activeEvents.length >= dp.maxSimultaneous) break;

      // Skip events above player's rank
      if (evt.minRank > this.rankLevel) continue;

      // Adjust probability based on conditions
      let prob = evt.baseProbability * dp.probMultiplier;

      // Deferred maintenance increases probability
      if (evt.affectedByMaintenance) {
        prob += this.deferredMaintenance.length * 0.005;
      }

      // Time into shift increases some event probabilities
      if (evt.increasesWithTime) {
        const shiftProgress = (gameTime % 480) / 480;
        prob += shiftProgress * 0.01;
      }

      // Roll
      if (Math.random() < prob) {
        this._startEvent(evt.id, pvMap);
        this.lastEventTime = gameTime;
        break; // One event per check
      }
    }
  }

  _startEvent(eventId, pvMap, extraData) {
    const eventDef = this.events.find(e => e.id === eventId);
    if (!eventDef) return;
    if (eventDef.active) return;

    eventDef.active = true;

    const activeEvent = {
      id: eventDef.id,
      name: eventDef.name,
      description: eventDef.description,
      severity: eventDef.severity || 'warning',
      elapsed: 0,
      duration: eventDef.duration || null,
      onTick: eventDef.onTick || null,
      checkResolved: eventDef.checkResolved || null,
      onRadio: this.onRadioMessage ? (msg) => this.onRadioMessage(msg) : null,
      data: { ...(eventDef.data || {}), ...(extraData || {}) }
    };

    // Apply immediate effects
    if (eventDef.onStart) {
      eventDef.onStart(activeEvent, pvMap);
    }

    this.activeEvents.push(activeEvent);
    this.eventHistory.push({
      id: eventDef.id,
      name: eventDef.name,
      startTime: this._currentGameTime || 0,
      severity: activeEvent.severity
    });

    if (this.onEventStart) {
      this.onEventStart(activeEvent);
    }

    // Radio message
    if (eventDef.radioMessage && this.onRadioMessage) {
      this.onRadioMessage(eventDef.radioMessage);
    }
  }

  _endEvent(index, pvMap) {
    const ae = this.activeEvents[index];
    const eventDef = this.events.find(e => e.id === ae.id);

    if (eventDef) {
      eventDef.active = false;
      if (eventDef.onEnd) {
        eventDef.onEnd(ae, pvMap);
      }
    }

    this.activeEvents.splice(index, 1);

    if (this.onEventEnd) {
      this.onEventEnd(ae);
    }
  }

  /**
   * Player-triggered event resolution
   */
  resolveEvent(eventId, action, pvMap) {
    const idx = this.activeEvents.findIndex(ae => ae.id === eventId);
    if (idx === -1) return false;

    const ae = this.activeEvents[idx];
    const eventDef = this.events.find(e => e.id === ae.id);

    if (eventDef && eventDef.onResolve) {
      const resolved = eventDef.onResolve(ae, action, pvMap);
      if (resolved) {
        this._endEvent(idx, pvMap);
        return true;
      }
    }
    return false;
  }

  /**
   * Record a false alarm for complacency tracking
   */
  recordFalseAlarm(detectorId) {
    this.falseAlarmCount[detectorId] = (this.falseAlarmCount[detectorId] || 0) + 1;
  }

  /**
   * Get active event list for UI
   */
  getActiveEventsSummary() {
    return this.activeEvents.map(ae => ({
      id: ae.id,
      name: ae.name,
      severity: ae.severity,
      elapsed: ae.elapsed
    }));
  }

  /**
   * Reset for new shift
   */
  reset() {
    this.activeEvents = [];
    this.eventHistory = [];
    this.falseAlarmCount = {};
    this.complacencyMeter = 0;
    this.deferredMaintenance = [];
    this.scheduledEvents = [];
    this.nextEventCheck = this.difficultyProfile.gracePeriod;
    this.eventCheckInterval = this.difficultyProfile.eventCheckInterval;
    this.minTimeBetweenEvents = this.difficultyProfile.minTimeBetween;
    this.lastEventTime = 0;
    for (const evt of this.events) {
      evt.active = false;
    }
  }

  toJSON() {
    return {
      activeEvents: this.activeEvents.map(ae => ({
        id: ae.id, elapsed: ae.elapsed, data: ae.data
      })),
      eventHistory: this.eventHistory,
      falseAlarmCount: this.falseAlarmCount,
      complacencyMeter: this.complacencyMeter,
      scheduledEvents: this.scheduledEvents
    };
  }

  /**
   * Restore state from JSON, re-linking behavior functions from registered event definitions
   */
  loadJSON(data) {
    if (!data) return;
    if (data.eventHistory) this.eventHistory = data.eventHistory;
    if (data.falseAlarmCount) this.falseAlarmCount = data.falseAlarmCount;
    if (data.complacencyMeter != null) this.complacencyMeter = data.complacencyMeter;
    if (data.scheduledEvents) this.scheduledEvents = data.scheduledEvents;

    // Restore active events with their behavior functions from registered definitions
    if (data.activeEvents) {
      for (const saved of data.activeEvents) {
        const eventDef = this.events.find(e => e.id === saved.id);
        if (!eventDef) continue;
        eventDef.active = true;
        this.activeEvents.push({
          id: saved.id,
          name: eventDef.name,
          description: eventDef.description,
          severity: eventDef.severity || 'warning',
          elapsed: saved.elapsed || 0,
          duration: eventDef.duration || null,
          onTick: eventDef.onTick || null,
          checkResolved: eventDef.checkResolved || null,
          onRadio: this.onRadioMessage ? (msg) => this.onRadioMessage(msg) : null,
          data: { ...(eventDef.data || {}), ...(saved.data || {}) }
        });
      }
    }
  }
}

window.EventSystem = EventSystem;
