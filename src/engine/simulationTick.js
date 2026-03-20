/**
 * SimulationTick — Master tick system for Cold Creek.
 * Manages game time, time compression, and coordinates all subsystem updates.
 *
 * Default: 1 real second = 2 game minutes → 8-hour shift ≈ 4 real minutes
 */

class SimulationTick {
  constructor() {
    // Time state
    this.gameTimeMinutes = 360; // 06:00 (start of day shift)
    this.shiftStartTime = 360;
    this.shiftDurationMinutes = 480; // 8-hour shift
    this.timeCompression = 2; // game-minutes per real-second
    this.speed = 0; // 0 = paused, 1 = normal, 2 = 2x, 4 = 4x
    this.tickInterval = null;
    this.tickRate = 100; // ms between ticks (10 ticks/second)

    // Process variables registry
    this.pvMap = {};

    // Subsystems
    this.cascadeEngine = new CascadeEngine();
    this.eventSystem = null; // Set externally
    this.pnlSystem = null;   // Set externally

    // Callbacks
    this.onTick = null;       // Called every tick with (dt, gameTime)
    this.onShiftEnd = null;   // Called when shift completes
    this.onAlarm = null;      // Called when alarm state changes

    // Stats
    this.totalTicks = 0;
    this.shiftElapsed = 0; // game-minutes into current shift
  }

  /**
   * Register a process variable
   */
  registerPV(pv) {
    this.pvMap[pv.tag] = pv;
  }

  /**
   * Get a PV by tag
   */
  getPV(tag) {
    return this.pvMap[tag] || null;
  }

  /**
   * Get all PVs
   */
  getAllPVs() {
    return this.pvMap;
  }

  /**
   * Start the simulation loop
   */
  start(speed) {
    this.speed = speed || 1;
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => this._tick(), this.tickRate);
  }

  /**
   * Pause the simulation
   */
  pause() {
    this.speed = 0;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Set speed multiplier (1, 2, 4)
   */
  setSpeed(s) {
    const wasPaused = this.speed === 0;
    this.speed = s;
    if (wasPaused && s > 0) {
      this.start(s);
    }
  }

  /**
   * Core tick function — called tickRate ms
   */
  _tick() {
    if (this.speed === 0) return;

    // Calculate delta time in game-minutes
    // tickRate ms at speed multiplier, with time compression
    const realSeconds = this.tickRate / 1000;
    const dt = realSeconds * this.timeCompression * this.speed;

    // Advance game time
    this.gameTimeMinutes += dt;
    this.shiftElapsed += dt;
    this.totalTicks++;

    // Reset external forces on all PVs before cascade
    for (const tag in this.pvMap) {
      this.pvMap[tag].externalForce = 0;
    }

    // Process cascade chains
    this.cascadeEngine.processTick(this.pvMap, this.gameTimeMinutes, dt);

    // Update all process variables
    const alarmChanges = [];
    for (const tag in this.pvMap) {
      const pv = this.pvMap[tag];
      const report = pv.tick(dt);
      if (report.alarmChanged) {
        alarmChanges.push({ tag, ...report });
      }
    }

    // Notify alarm changes
    if (alarmChanges.length > 0 && this.onAlarm) {
      for (const ac of alarmChanges) {
        this.onAlarm(ac);
      }
    }

    // Update event system
    if (this.eventSystem) {
      this.eventSystem.tick(dt, this.gameTimeMinutes, this.pvMap);
    }

    // Update P&L
    if (this.pnlSystem) {
      this.pnlSystem.tick(dt, this.pvMap);
    }

    // Callback
    if (this.onTick) {
      this.onTick(dt, this.gameTimeMinutes);
    }

    // Check shift end (fire once, then clear callback to prevent repeat)
    if (this.shiftElapsed >= this.shiftDurationMinutes) {
      if (this.onShiftEnd) {
        const cb = this.onShiftEnd;
        this.onShiftEnd = null;
        cb(this.shiftElapsed);
      }
    }
  }

  /**
   * Get formatted game time string (HH:MM)
   */
  getTimeString() {
    const totalMin = Math.floor(this.gameTimeMinutes) % 1440;
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Get shift label
   */
  getShiftLabel() {
    const hour = Math.floor(this.gameTimeMinutes / 60) % 24;
    if (hour >= 6 && hour < 18) return 'DAY SHIFT';
    return 'NIGHT SHIFT';
  }

  /**
   * Get shift progress (0-1)
   */
  getShiftProgress() {
    return Math.min(1, this.shiftElapsed / this.shiftDurationMinutes);
  }

  /**
   * Reset for new shift
   */
  resetShift(startHour) {
    this.gameTimeMinutes = (startHour || 6) * 60;
    this.shiftStartTime = this.gameTimeMinutes;
    this.shiftElapsed = 0;
    this.totalTicks = 0;
    this.cascadeEngine.reset();
  }

  /**
   * Save state
   */
  toJSON() {
    const pvData = {};
    for (const tag in this.pvMap) {
      pvData[tag] = this.pvMap[tag].toJSON();
    }
    return {
      gameTimeMinutes: this.gameTimeMinutes,
      shiftStartTime: this.shiftStartTime,
      shiftElapsed: this.shiftElapsed,
      timeCompression: this.timeCompression,
      pvData,
      cascadeState: this.cascadeEngine.toJSON()
    };
  }

  /**
   * Load state
   */
  loadJSON(data) {
    if (data.gameTimeMinutes != null) this.gameTimeMinutes = data.gameTimeMinutes;
    if (data.shiftStartTime != null) this.shiftStartTime = data.shiftStartTime;
    if (data.shiftElapsed != null) this.shiftElapsed = data.shiftElapsed;
    if (data.timeCompression != null) this.timeCompression = data.timeCompression;
    if (data.pvData) {
      for (const tag in data.pvData) {
        if (this.pvMap[tag]) {
          this.pvMap[tag].loadJSON(data.pvData[tag]);
        }
      }
    }
    if (data.cascadeState) {
      this.cascadeEngine.loadJSON(data.cascadeState);
    }
  }

  destroy() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
}

window.SimulationTick = SimulationTick;
