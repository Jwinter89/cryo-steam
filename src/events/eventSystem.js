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

    // Scheduling
    this.nextEventCheck = 0;    // Game-minutes until next probability roll
    this.eventCheckInterval = 5; // Check every 5 game-minutes
    this.minTimeBetweenEvents = 10; // Minimum gap between random events
    this.lastEventTime = 0;

    // Scheduled events queue
    this.scheduledEvents = [];
  }

  /**
   * Register an event type
   */
  registerEvent(eventDef) {
    this.events.push({
      ...eventDef,
      id: eventDef.id || `evt-${this.events.length}`,
      baseProbability: eventDef.probability || 0.01,
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
  tick(dt, gameTime, pvMap) {
    // Process scheduled events
    this.scheduledEvents = this.scheduledEvents.filter(se => {
      if (gameTime >= se.gameTime) {
        this._startEvent(se.eventId, pvMap, se.data);
        return false;
      }
      return true;
    });

    // Periodic probability check for random events
    this.nextEventCheck -= dt;
    if (this.nextEventCheck <= 0) {
      this.nextEventCheck = this.eventCheckInterval;
      if (gameTime - this.lastEventTime >= this.minTimeBetweenEvents) {
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
    for (const evt of this.events) {
      if (evt.active) continue;
      if (this.activeEvents.length >= 3) break; // Max simultaneous events

      // Adjust probability based on conditions
      let prob = evt.baseProbability;

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
      startTime: Date.now(),
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
    this.nextEventCheck = 5;
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
}

window.EventSystem = EventSystem;
