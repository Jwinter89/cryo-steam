# Cold Creek — Master Bug & Issue Tracker

Generated from 9-agent codebase review (2026-04-02).
Status key: `[ ]` = open, `[x]` = fixed & verified, `[-]` = wontfix/deferred

---

## TIER 1 — Critical Bugs (fix before anything else)

- [x] **BUG-001**: Steam callback interval starts before app ready
  - File: `electron/main.js:254`
  - Issue: `setInterval` runs at module scope before `app.whenReady()` and `initSteam()`
  - Fix: Move interval creation inside `app.whenReady().then()` after `initSteam()`

- [x] **BUG-002**: Save/load drops all active events
  - File: `game.js:1255-1266`, `eventSystem.js:305-332`
  - Issue: `saveGameState()` saves events via `eventSystem.toJSON()` but restore block never calls `eventSystem.loadJSON(state.events)`. Also `onStart` forces not re-applied.
  - Fix: Add `if (state.events && this.eventSystem) this.eventSystem.loadJSON(state.events);` in restore block. Events' `onTick` will reapply forces on next tick.

- [x] **BUG-003**: Crisis mode state restored after sim starts running
  - File: `game.js:1199-1207` vs `1254-1266`
  - Issue: `_startCrisisScenario()` sets speed and schedules events BEFORE `_pendingRestoreState` is applied. Crisis events fire at wrong times on Continue.
  - Fix: Move restore block to execute before mode-specific startup code.

- [-] **BUG-006**: Event storm at 4x speed — NOT A BUG
  - File: `eventSystem.js:101-109`
  - Analysis: `baseDt = dt / spd` already normalizes countdown rate. At 4x, baseDt = 0.8/4 = 0.2, same as 1x. Check fires at same real-world rate. QA agent misread the code.

---

## TIER 2 — High Bugs (fix before Steam submission)

- [x] **BUG-005**: Alarm chattering — no hysteresis on thresholds
  - File: `processVariable.js:166-172`
  - Issue: Simple >= / <= comparisons with no deadband. PVs with noise chatter alarm state every tick near threshold.
  - Fix: Add hysteresis band (~0.5-1% of span). On entering alarm, require exceed. On clearing, require value < (threshold - deadband).

- [x] **BUG-009**: Pump bearing failure fires immediately at gameTime=0
  - File: `cryogenicEvents.js:539`, `eventSystem.js:81`
  - Issue: `scheduleEvent('pump-bearing-failure', 0, {})` — gameTime param is 0 instead of current time.
  - Fix: Pass `eventSystem._currentGameTime + 2` for slight delay.

- [x] **BUG-008**: EventActionPanel style tag accumulates on every game start
  - File: `eventActionPanel.js:13-68`, `game.js:1111`
  - Issue: `_createStyles()` appends new `<style>` unconditionally. New instance created each game start.
  - Fix: Guard with `if (!document.getElementById('event-action-panel-styles'))` and set `style.id`.

- [x] **BUG-010**: FaceplateManager center-panel click listener accumulates
  - File: `faceplateManager.js:111-116`
  - Issue: `center-panel` addEventListener called every game start; element persists. After 5 starts, 5 close handlers fire.
  - Fix: Store handler ref, add `destroy()` method, call before creating new instance.

- [x] **BUG-015**: obj-done-btn listener accumulates on shift completion
  - File: `game.js:2296`
  - Issue: `addEventListener` on persistent DOM element each shift end.
  - Fix: Use `onclick =` assignment (like `_showObjectivesBriefing` already does).

- [x] **BUG-011**: Escape key pause doesn't call sim.pause() or update UI
  - File: `game.js:315-316`
  - Issue: Sets `this.sim.speed = 0` directly. Tick interval keeps running. Speed buttons don't update.
  - Fix: Use `this.sim.pause(); this._updateTimeButtons(0);`

- [x] **BUG-007**: Alarm history loses HIHI→HI transition entries
  - File: `alarmManager.js:56-73`
  - Issue: State changes on existing alarms update in place without appending to history. Debrief/profile alarm counts are incomplete.
  - Fix: Always push new entry to `alarmHistory` on any alarm state change.

- [x] **AUDIO-001**: Broken audio effect keys
  - File: `audioManager.js`
  - Issue: 4 effect keys referenced in code don't map to actual sound definitions. `stopAll()` method missing. Alarm ACK doesn't stop alarm tone.
  - Fix: Map missing keys, add stopAll(), wire ACK to stop tone.

---

## TIER 3 — Medium Bugs (fix before v1.0)

- [ ] **BUG-012**: Tank pop-off P&L penalty fires unbounded
  - File: `game.js:1612-1617`
  - Issue: $500 penalty every 100 ticks with no cap. Can drive earnings to -infinity.
  - Fix: Cap total penalty at realistic maximum (~$5,000).

- [ ] **BUG-014**: Henry shift-end tips hardcoded to day shift times
  - File: `game.js:2633-2642`
  - Issue: Checks absolute game-minute values (690, 360). Breaks for night shifts or non-06:00 starts.
  - Fix: Use `shiftElapsed` and `shiftDurationMinutes` instead of absolute times.

- [ ] **BUG-016**: HIHI/LOLO alarms have no color class in alarm list popup
  - File: `alarmManager.js:140`
  - Issue: HIHI/LOLO fall to else branch and get class `'lo'`. No critical/HIHI class path.
  - Fix: Add `a.state === 'HIHI' || a.state === 'LOLO' ? 'hihi' : ...` mapping and CSS class.

- [ ] **BUG-013**: Achievement flag tracking — penaltyReasons null guard
  - File: `game.js:2878`
  - Issue: `penaltyReasons.includes()` can throw if array is undefined on early ticks.
  - Fix: Guard with `if (this.pnlSystem.penaltyReasons && ...)`.

- [ ] **BUG-018**: Tagline rotation interval can double up
  - File: `game.js:2793-2816`
  - Issue: `_startTaglineRotation()` doesn't clear existing interval before setting new one.
  - Fix: Add `if (this._taglineInterval) clearInterval(this._taglineInterval);` at top.

---

## TIER 4 — Visual Polish (highest Steam impression impact)

- [ ] **VIS-001**: Faceplate trend alarm limit lines invisible
  - File: `faceplateManager.js`
  - Issue: HI/LO limit lines drawn in `#553300` on `#2E2E2E` background (~1.3:1 contrast).
  - Fix: Change to `rgba(255,165,0,0.45)` for HI, `rgba(255,165,0,0.3)` for LO.

- [ ] **VIS-002**: Screen-edge red glow on critical alarms
  - File: `style.css` / `game.js`
  - Issue: No visual "this is serious" beyond alarm bar turning red.
  - Fix: Add `box-shadow: inset 0 0 80px rgba(255,32,32,0.25)` on `#game-screen` via `.critical-alarm-active` class.

- [ ] **VIS-003**: `--alarm-hi` orange token defined but never used
  - File: `style.css`, `gaugeManager.js`, `alarmManager.js`
  - Issue: Both HI and LO alarms render as gold. ISA-101 distinguishes HI (orange) from LO (yellow).
  - Fix: Wire `--alarm-hi` to HI alarm rendering. Consistent across gauge rows and alarm list.

- [ ] **VIS-004**: Flow line glow too faint
  - File: `style.css`
  - Issue: `drop-shadow(0 0 1px rgba(160,160,160,0.3))` is invisible at normal viewing distance.
  - Fix: Increase to 3-4x stronger, per-stream-color glows.

- [ ] **VIS-005**: No Y-axis labels on trend graphs
  - File: `trendManager.js`, `faceplateManager.js`
  - Issue: Trend shows curve with no numeric scale — can't tell if value moved 2 or 20.
  - Fix: Add 4 Y-axis tick marks with numeric labels.

- [ ] **VIS-006**: SVG level fills cause layout thrash every tick
  - File: `pidDiagram.js`
  - Issue: `setAttribute('height')` and `setAttribute('y')` on every tick forces SVG relayout.
  - Fix: Use `transform: scaleY()` on fixed-height element for GPU compositing.

- [ ] **VIS-007**: Screen shake on ESD trips
  - File: `game.js` / `style.css`
  - Issue: Major events (compressor trip, relief valve) have no physical feedback.
  - Fix: `@keyframes center-shake` on `#center-panel`, 150ms, 3-4px amplitude.

- [ ] **VIS-008**: Screen transitions are instant
  - File: `game.js` / `style.css`
  - Issue: All screen changes are `display:none → display:flex` with no fade.
  - Fix: 150ms opacity crossfade on screen transitions.

- [ ] **VIS-009**: Tag bubbles blue in normal state — ISA-101 violation
  - File: `style.css`
  - Issue: `.tag-bubble { stroke: #5A9FD4 }` always. Color should be reserved for abnormal.
  - Fix: Normal state → `#707070`. Blue only for currently-open faceplate tag.

- [ ] **VIS-010**: Cryo P&ID viewBox too tall for widescreen
  - File: `index.html` (inline SVG)
  - Issue: `viewBox="0 0 1000 1050"` — bottom third below fold at 1080p.
  - Fix: Restructure cryo P&ID layout for widescreen aspect ratio.

---

## TIER 5 — UI/UX Improvements

- [ ] **UX-001**: Gauge rows need bar graph / range indicator
  - File: `gaugeManager.js`
  - Issue: Numbers only — no visual position-in-range. ISA-101 HP HMI core feature.
  - Fix: Add compact bar graph to each gauge row. `TrendManager.drawSparkline()` infrastructure exists.

- [ ] **UX-002**: Building tabs carry no alarm state
  - File: `game.js` / `style.css`
  - Issue: Tab with HIHI alarm looks identical to tab with no alarms.
  - Fix: Colored dot on tabs containing active alarms, wired to AlarmManager.

- [ ] **UX-003**: Right panel — EVENTS should be at top
  - File: `index.html`
  - Issue: EVENTS is 3rd behind SPEC BOARD and P&L. Highest urgency during crisis.
  - Fix: Reorder HTML sections.

- [ ] **UX-004**: Faceplate SP lost on click-away
  - File: `faceplateManager.js`
  - Issue: Clicking outside faceplate with unsaved SP change silently discards it.
  - Fix: Check for unsaved changes before close, auto-apply or warn.

- [ ] **UX-005**: Trend window discovery is hidden
  - File: `gaugeManager.js` / `trendManager.js`
  - Issue: Double-click to add trend only documented inside the trend window itself.
  - Fix: Hover tooltip or visual affordance on gauge rows.

- [ ] **UX-006**: Alarm list modal blocks P&ID
  - File: `alarmManager.js` / `style.css`
  - Issue: Centered fixed-position modal covers the diagram during acknowledgment.
  - Fix: Anchor alarm list to alarm bar (slide down) instead of center modal.

- [ ] **UX-007**: No in-game settings access
  - File: `game.js`
  - Issue: Must exit to main menu to change volume/alarm sounds/tips.
  - Fix: Pause menu with volume, alarm sounds, tips accessible via Esc or hamburger.

- [ ] **UX-008**: Section headers use Arial instead of mono/condensed
  - File: `style.css`
  - Issue: `.section-header` uses `--font-sans`. Everything else uses `--font-mono`.
  - Fix: Change to `--font-condensed`.

- [ ] **UX-009**: 9px text below usability floor
  - File: `style.css`
  - Issue: Multiple elements at 8-9px. At 1440p+, physically too small.
  - Fix: Raise minimum to 10px across the board.

---

## TIER 6 — Game Design / Content

- [ ] **GD-001**: Crisis scenarios file doesn't exist
  - File: `src/scenarios/crisisScenarios.js`
  - Issue: Crisis mode advertised with scenario selection screen but no scenarios defined.
  - Fix: Create 6-8 scenarios across three facilities.

- [ ] **GD-002**: Only 12 achievements — need 25-30 for Steam
  - File: `src/ui/achievements.js`
  - Issue: Thin achievement list hurts store page and playtime perception.
  - Fix: Add journey, discovery, facility mastery, and streak achievements.

- [ ] **GD-003**: Complacency meter built but unwired
  - File: `game.js`
  - Issue: Tracked every tick (0-1 scale, driven by false alarm history) but drives nothing.
  - Fix: Affect Henry tip delay time or false alarm visual prominence.

- [ ] **GD-004**: Deferred maintenance array never populated
  - File: `game.js`
  - Issue: `deferredMaintenance` increases event probability but nothing populates it.
  - Fix: Pre-shift decision screen with 1-3 pending maintenance items.

- [ ] **GD-005**: Facility unlock is a stub
  - File: `game.js`
  - Issue: `_updateUnlockStates()` does nothing. All facilities open from start.
  - Fix: Gate Refrigeration behind 3 Stabilizer shifts, Cryo behind 3 Refrigeration shifts.

- [ ] **GD-006**: Ranks 2-3 underserved in event content
  - File: `src/events/*.js`
  - Issue: Most cryo events are minRank 4. Big jump from rank 1 to rank 4 content.
  - Fix: Add or re-tier events for ranks 2-3.

- [ ] **GD-007**: Optimize mode has no coaching layer
  - File: `game.js`
  - Issue: Feels like "hard Operate" — no guidance on what to tune or why.
  - Fix: Henry explains efficiency target at shift start. Debrief compares to optimal.

---

## TIER 7 — Accessibility (launch items)

- [ ] **A11Y-001**: Reduced-motion removes ALL alarm visual indication
  - File: `style.css:4199`
  - Issue: `prefers-reduced-motion` suppresses alarm-flash animation but no static fallback exists. Alarm bar and gauge rows become invisible to reduced-motion users.
  - Fix: Add static `background: #660000` as base style on `.has-unacked` that doesn't depend on animation.

- [ ] **A11Y-002**: Icon-only buttons missing aria-labels
  - File: `index.html`
  - Issue: Pause, trend, snapshot, close buttons use Unicode/emoji with no accessible name.
  - Fix: Add `aria-label` to each (6 buttons, 5 minutes).

- [ ] **A11Y-003**: Gauge row HIHI/LOLO static fallback for reduced-motion
  - File: `style.css`
  - Issue: `gauge-flash` animation suppressed by reduced-motion — HIHI gauge looks identical to normal except border color.
  - Fix: Add static dark red background that persists when animation is suppressed.

---

## TIER 8 — Accessibility (post-launch)

- [ ] **A11Y-004**: Faceplate has no keyboard access or focus trap
- [ ] **A11Y-005**: Alarm bar not keyboard-focusable
- [ ] **A11Y-006**: No aria-live regions for alarm announcements
- [ ] **A11Y-007**: Colorblind mode doesn't cover SVG flow line colors
- [ ] **A11Y-008**: Secondary text colors fail WCAG AA contrast (need high-contrast mode option)
- [ ] **A11Y-009**: P&ID pan requires mouse — no keyboard arrow key support
- [ ] **A11Y-010**: Henry typewriter text can't be replayed or paused

---

## TIER 9 — Business / Launch Prep

- [ ] **BIZ-001**: Strip AdSense/Stripe code from Steam build
- [ ] **BIZ-002**: Submit Steam Direct ($100) — get real App ID
- [ ] **BIZ-003**: Steam store page — screenshots, trailer, description
- [ ] **BIZ-004**: Replace Stripe Checkout with Apple IAP for iOS build
- [ ] **BIZ-005**: Dead CSS cleanup (~150 lines of mobile/web rules)

---

## Notes

- Fixes are verified by reading the changed file after each edit
- QC agent re-audits after each batch of fixes
- This file is the source of truth — check here, not memory
