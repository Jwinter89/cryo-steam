/**
 * EventActionPanel — UI for resolving active events.
 * Shows available actions based on event type.
 * Replaces the event display block with interactive controls.
 */

class EventActionPanel {
  constructor(game) {
    this.game = game;
    this.container = document.getElementById('event-status');
    this._createStyles();
  }

  _createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .event-action-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-left: 3px solid var(--alarm-lo);
        padding: 4px 6px;
        margin: 3px 0;
      }
      .event-action-card.critical {
        border-left-color: var(--alarm-crit);
      }
      .event-action-card.info {
        border-left-color: var(--text-unit);
      }
      .event-action-name {
        font-family: var(--font-mono);
        font-size: 9px;
        color: var(--text-tag);
        margin-bottom: 2px;
      }
      .event-action-desc {
        font-size: 8px;
        color: var(--text-unit);
        margin-bottom: 3px;
        line-height: 1.3;
      }
      .event-action-elapsed {
        font-family: var(--font-mono);
        font-size: 8px;
        color: var(--text-unit);
        margin-bottom: 3px;
      }
      .event-action-btns {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
      }
      .event-action-btn {
        font-family: var(--font-mono);
        font-size: 8px;
        padding: 2px 6px;
        background: var(--bg-input);
        color: var(--text-label);
        border: 1px solid var(--border);
        cursor: pointer;
      }
      .event-action-btn:hover {
        background: var(--border);
        color: var(--text-normal);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Update the event display with action buttons
   */
  update() {
    if (!this.game.eventSystem) return;

    const active = this.game.eventSystem.activeEvents;
    if (active.length === 0) {
      this.container.innerHTML = '<span class="event-item">NO ACTIVE EVENTS</span>';
      return;
    }

    this.container.innerHTML = active.map(evt => {
      const actions = this._getActions(evt);
      const mins = Math.floor(evt.elapsed);
      const severityClass = evt.severity === 'critical' ? 'critical' :
                           evt.severity === 'info' ? 'info' : '';

      return `
        <div class="event-action-card ${severityClass}">
          <div class="event-action-name">${evt.name}</div>
          <div class="event-action-elapsed">${mins}m elapsed</div>
          ${evt.data && evt.data.cause ? `<div class="event-action-desc">Cause: ${evt.data.cause}</div>` : ''}
          ${evt.data && evt.data.surgePhase ? `<div class="event-action-desc">Phase: ${evt.data.surgePhase}</div>` : ''}
          ${evt.data && evt.data.phase ? `<div class="event-action-desc">Phase: ${evt.data.phase}</div>` : ''}
          ${evt.data && evt.data.building ? `<div class="event-action-desc">Area: ${evt.data.building || evt.data.area}</div>` : ''}
          ${evt.data && evt.data.complianceViolation ? '<div class="event-action-desc" style="color:var(--alarm-crit)">EPA COMPLIANCE VIOLATION</div>' : ''}
          ${evt.data && evt.data.evacuationNeeded ? '<div class="event-action-desc" style="color:var(--alarm-crit)">EVACUATION REQUIRED</div>' : ''}
          <div class="event-action-btns">
            ${actions.map(a => `<button class="event-action-btn" data-event="${evt.id}" data-action="${a.action}">${a.label}</button>`).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Bind action buttons
    this.container.querySelectorAll('.event-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = btn.dataset.event;
        const action = btn.dataset.action;
        this._executeAction(eventId, action);
      });
    });
  }

  _getActions(event) {
    const actions = [];
    const id = event.id;

    // Define available actions per event type
    switch (id) {
      case 'pig-single':
      case 'pig-fast':
      case 'pig-double':
        // Pig events resolve on their own — but player can adjust pinch valve
        break;

      case 'hot-oil-fault':
        actions.push({ action: 'repair', label: 'REPAIR HEATER' });
        break;

      case 'comp-trip':
        actions.push({ action: 'restart', label: 'RESTART COMP' });
        break;

      case 'instrument-air-loss':
        actions.push({ action: 'repair-air', label: 'REPAIR AIR COMP' });
        break;

      case 'instrument-freeze':
        // Hidden — player can't directly act (they don't know it's frozen)
        actions.push({ action: 'check-instrument', label: 'CHECK INSTRUMENTS' });
        break;

      case 'tank-popoff':
        // Resolves when pressure drops
        break;

      case 'truck-arrival':
        if (!event.data.permitIssued) {
          actions.push({ action: 'issue-permit', label: 'ISSUE PERMIT' });
        } else {
          actions.push({ action: 'loading', label: 'LOADING...' });
        }
        break;

      case 'lel-alarm':
        actions.push({ action: 'investigate', label: 'INVESTIGATE' });
        actions.push({ action: 'acknowledge', label: 'ACK' });
        break;

      case 'teg-foaming':
        actions.push({ action: 'antifoam-injection', label: 'INJECT ANTIFOAM' });
        break;

      case 'btex-pilot-out':
        actions.push({ action: 'relight', label: 'RELIGHT PILOT' });
        break;

      case 'refrig-condenser-foul':
        actions.push({ action: 'clean-condenser', label: 'CLEAN CONDENSER' });
        break;

      case 'inlet-comp-surge':
        actions.push({ action: 'open-recycle', label: 'OPEN RECYCLE' });
        break;

      case 'ldar-inspection':
        if (!event.data.permitIssued) {
          actions.push({ action: 'issue-permit', label: 'ISSUE PERMIT' });
        } else if (event.data.leakFound && !event.data.leakDeferred) {
          actions.push({ action: 'fix-leak', label: 'FIX NOW' });
          actions.push({ action: 'defer-leak', label: 'DEFER' });
        }
        break;

      case 'expander-trip':
        actions.push({ action: 'restart-expander', label: 'RESTART EXP' });
        break;

      case 'molsieve-breakthrough':
        actions.push({ action: 'switch-beds', label: 'SWITCH BEDS' });
        actions.push({ action: 'eg-injection', label: 'EG INJECTION' });
        break;

      case 'cold-box-freeze':
        if (event.data.recoveryPhase === 'active') {
          actions.push({ action: 'controlled-warmup', label: 'BEGIN WARMUP' });
        } else {
          actions.push({ action: 'complete-warmup', label: 'COMPLETE WARMUP' });
        }
        break;

      case 'res-comp-fault':
        actions.push({ action: 'repair-compressor', label: 'REPAIR' });
        break;

      case 'demet-flooding':
        // Resolves by managing levels
        break;

      case 'pump-bearing-hot':
        actions.push({ action: 'switch-to-spare', label: 'SWITCH SPARE' });
        actions.push({ action: 'reduce-flow', label: 'REDUCE FLOW' });
        break;

      case 'pump-bearing-failure':
        actions.push({ action: 'esd-pump', label: 'ESD PUMP' });
        break;

      case 'mode-switch':
        if (event.data.phase === 'limp-down' && !event.data.fieldConfirmed) {
          actions.push({ action: 'confirm-field', label: 'FIELD CONFIRM' });
        }
        break;

      case 'separator-flood':
        actions.push({ action: 'drain-separator', label: 'DRAIN STEP' });
        break;

      case 'fire-eye-alarm':
        actions.push({ action: 'investigate', label: 'INVESTIGATE' });
        actions.push({ action: 'acknowledge', label: 'ACK' });
        break;

      case 'flare-fire':
        actions.push({ action: 'check-flare-routing', label: 'CHECK ROUTING' });
        break;

      case 'h2s-breakthrough':
        actions.push({ action: 'increase-circulation', label: 'INCR CIRC' });
        break;

      case 'h2s-area-alarm':
        if (!event.data.evacuationStarted) {
          actions.push({ action: 'evacuate', label: 'EVACUATE' });
        }
        actions.push({ action: 'isolate-source', label: 'ISOLATE' });
        if (event.data.windDirection) {
          actions.push({ action: 'check-wind', label: `WIND: ${event.data.windDirection}` });
        }
        break;

      case 'amine-foaming':
        actions.push({ action: 'antifoam-injection', label: 'INJECT ANTIFOAM' });
        break;

      case 'amine-reboiler-upset':
        actions.push({ action: 'adjust-reboiler', label: 'ADJUST REBOILER' });
        break;

      case 'amine-pump-fail':
        actions.push({ action: 'start-spare-pump', label: 'START SPARE' });
        break;

      case 'corrosion-incident':
        actions.push({ action: 'repair-now', label: 'REPAIR NOW' });
        actions.push({ action: 'defer-repair', label: 'DEFER' });
        break;

      case 'sour-permit':
        if (!event.data.gasTestDone) {
          actions.push({ action: 'gas-test', label: 'GAS TEST' });
        } else {
          actions.push({ action: 'issue-sour-permit', label: 'ISSUE PERMIT' });
        }
        break;

      case 'weather-change':
        // Info only
        break;

      default:
        actions.push({ action: 'acknowledge', label: 'ACK' });
    }

    return actions;
  }

  _executeAction(eventId, action) {
    if (!this.game.eventSystem) return;

    // Special actions
    if (action === 'confirm-field') {
      const evt = this.game.eventSystem.activeEvents.find(e => e.id === eventId);
      if (evt && evt.data) evt.data.fieldConfirmed = true;
      if (this.game.audioManager) this.game.audioManager.playEffect('radio');
      this.game._addRadioMessage('Field: Confirmed. Valves aligned for mode switch.');
      this.update();
      return;
    }

    if (action === 'check-wind') {
      // Just informational
      return;
    }

    if (action === 'check-instrument') {
      // Unfreeze the instrument if player checks
      const evt = this.game.eventSystem.activeEvents.find(e => e.id === eventId);
      if (evt && evt.data && evt.data.frozenTag) {
        const pv = this.game.sim.getPV(evt.data.frozenTag);
        if (pv && pv.frozen) {
          pv.unfreeze();
          this.game._addRadioMessage(`Instrument ${evt.data.frozenTag} was frozen. Restored.`);
        }
      }
      return;
    }

    const resolved = this.game.eventSystem.resolveEvent(
      eventId, action, this.game.sim.getAllPVs()
    );

    if (resolved) {
      this.game._addRadioMessage(`Event resolved: ${eventId}`);
      if (this.game.audioManager) this.game.audioManager.playEffect('alarm-ack');

      // Track truck loads for achievement
      if (eventId === 'truck-arrival') {
        this.game._truckLoadsClean = (this.game._truckLoadsClean || 0) + 1;
      }
    } else {
      // Action attempted but not fully resolved
      if (this.game.audioManager) this.game.audioManager.playEffect('beep');
    }

    this.update();
  }
}

window.EventActionPanel = EventActionPanel;
