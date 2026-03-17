/**
 * CascadeEngine — Models dependency chains between process variables.
 * When one variable changes, its dependents are queued for update.
 * Delayed consequences modeled with timers.
 */

class CascadeEngine {
  constructor() {
    // Map of tag -> array of cascade rules
    this.rules = [];
    // Delayed effects queue: { triggerTime, effect }
    this.delayedEffects = [];
    // Active continuous effects
    this.activeEffects = [];
  }

  /**
   * Add a cascade rule
   * @param {Object} rule
   * @param {string} rule.source    - Source PV tag
   * @param {string} rule.target    - Target PV tag
   * @param {string} rule.type      - 'proportional' | 'inverse' | 'threshold' | 'custom'
   * @param {number} [rule.gain]    - Multiplier for proportional/inverse
   * @param {number} [rule.delay]   - Delay in game-minutes before effect starts
   * @param {number} [rule.threshold] - For threshold type: value that triggers
   * @param {string} [rule.condition] - 'above' | 'below' for threshold
   * @param {Function} [rule.fn]    - Custom function(sourceValue, targetPV, dt) => force
   * @param {string} [rule.id]      - Unique identifier for this rule
   */
  addRule(rule) {
    rule.id = rule.id || `${rule.source}->${rule.target}-${this.rules.length}`;
    rule.active = true;
    this.rules.push(rule);
  }

  /**
   * Process all cascade effects for one tick
   * @param {Object} pvMap - Map of tag -> ProcessVariable
   * @param {number} gameTime - Current game time in minutes
   * @param {number} dt - Delta time in game-minutes
   */
  processTick(pvMap, gameTime, dt) {
    // Process delayed effects
    const readyEffects = [];
    this.delayedEffects = this.delayedEffects.filter(de => {
      if (gameTime >= de.triggerTime) {
        readyEffects.push(de.effect);
        return false;
      }
      return true;
    });

    // Apply ready delayed effects
    for (const effect of readyEffects) {
      if (effect.type === 'force') {
        const target = pvMap[effect.target];
        if (target) {
          this.activeEffects.push({
            id: effect.id,
            target: effect.target,
            force: effect.force,
            duration: effect.duration || Infinity,
            elapsed: 0
          });
        }
      } else if (effect.type === 'setvalue') {
        const target = pvMap[effect.target];
        if (target) {
          target.externalForce += effect.force;
        }
      }
    }

    // Update active continuous effects
    this.activeEffects = this.activeEffects.filter(ae => {
      const target = pvMap[ae.target];
      if (!target) return false;
      ae.elapsed += dt;
      if (ae.elapsed >= ae.duration) {
        return false;
      }
      return true;
    });

    // Process cascade rules
    for (const rule of this.rules) {
      if (!rule.active) continue;

      const source = pvMap[rule.source];
      const target = pvMap[rule.target];
      if (!source || !target) continue;

      let force = 0;

      switch (rule.type) {
        case 'proportional':
          // Source change proportionally affects target
          force = source.rateOfChange * (rule.gain || 1);
          break;

        case 'inverse':
          // Source change inversely affects target
          force = -source.rateOfChange * (rule.gain || 1);
          break;

        case 'threshold': {
          // When source crosses threshold, apply force to target
          const condition = rule.condition || 'above';
          const crossed = condition === 'above'
            ? source.value >= rule.threshold
            : source.value <= rule.threshold;

          if (crossed) {
            if (rule.delay && !rule._delayScheduled) {
              // Schedule delayed effect
              this.delayedEffects.push({
                triggerTime: gameTime + rule.delay,
                effect: {
                  type: 'force',
                  id: rule.id,
                  target: rule.target,
                  force: rule.gain || 1,
                  duration: rule.effectDuration || 30
                }
              });
              rule._delayScheduled = true;
            } else if (!rule.delay) {
              force = rule.gain || 1;
            }
          } else {
            rule._delayScheduled = false;
          }
          break;
        }

        case 'custom':
          if (rule.fn) {
            force = rule.fn(source.value, target, dt);
          }
          break;
      }

      // Apply force (accumulates with other forces on target)
      if (force !== 0) {
        target.externalForce += force;
      }
    }

    // Apply active continuous effects
    for (const ae of this.activeEffects) {
      const target = pvMap[ae.target];
      if (target) {
        target.externalForce += ae.force;
      }
    }
  }

  /**
   * Schedule a delayed effect
   * @param {number} gameTime - Current game time
   * @param {number} delayMinutes - Delay in game-minutes
   * @param {Object} effect - Effect to apply
   */
  scheduleDelayed(gameTime, delayMinutes, effect) {
    this.delayedEffects.push({
      triggerTime: gameTime + delayMinutes,
      effect
    });
  }

  /**
   * Remove all effects targeting a specific PV
   */
  clearEffectsOn(tag) {
    this.activeEffects = this.activeEffects.filter(ae => ae.target !== tag);
    this.delayedEffects = this.delayedEffects.filter(de => de.effect.target !== tag);
  }

  /**
   * Reset all cascade state
   */
  reset() {
    this.delayedEffects = [];
    this.activeEffects = [];
    for (const rule of this.rules) {
      rule._delayScheduled = false;
    }
  }

  toJSON() {
    return {
      delayedEffects: this.delayedEffects,
      activeEffects: this.activeEffects
    };
  }

  loadJSON(data) {
    if (data.delayedEffects) this.delayedEffects = data.delayedEffects;
    if (data.activeEffects) this.activeEffects = data.activeEffects;
  }
}

window.CascadeEngine = CascadeEngine;
