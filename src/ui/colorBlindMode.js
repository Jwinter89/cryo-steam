/**
 * ColorBlindMode — Adds pattern overlays and alternative color palettes
 * for deuteranopia, protanopia, and tritanopia.
 */

class ColorBlindMode {
  constructor() {
    this.mode = localStorage.getItem('coldcreek-colorblind') || 'off';
    this._apply();
  }

  static get MODES() {
    return [
      { id: 'off', label: 'NORMAL' },
      { id: 'deuteranopia', label: 'DEUTERANOPIA (Red/Green)' },
      { id: 'protanopia', label: 'PROTANOPIA (Red Weak)' },
      { id: 'tritanopia', label: 'TRITANOPIA (Blue/Yellow)' }
    ];
  }

  /** Color remapping per mode */
  static get PALETTES() {
    return {
      off: {
        alarmCrit: '#FF2020',
        alarmHi: '#FF6600',
        alarmLo: '#FFD700',
        alarmRtn: '#00CC44',
        pnlGood: '#4CAF50',
        pnlBad: '#E04040',
        pnlWarn: '#D4A843',
        specOk: '#4CAF50',
        specBad: '#E04040'
      },
      deuteranopia: {
        alarmCrit: '#FF4400',
        alarmHi: '#FF8800',
        alarmLo: '#FFDD55',
        alarmRtn: '#4488FF',
        pnlGood: '#4488FF',
        pnlBad: '#FF4400',
        pnlWarn: '#FFAA00',
        specOk: '#4488FF',
        specBad: '#FF4400'
      },
      protanopia: {
        alarmCrit: '#CC6600',
        alarmHi: '#FFAA00',
        alarmLo: '#FFDD44',
        alarmRtn: '#3377FF',
        pnlGood: '#3377FF',
        pnlBad: '#CC6600',
        pnlWarn: '#FFAA00',
        specOk: '#3377FF',
        specBad: '#CC6600'
      },
      tritanopia: {
        alarmCrit: '#FF2020',
        alarmHi: '#FF6688',
        alarmLo: '#44BBBB',
        alarmRtn: '#22CC22',
        pnlGood: '#22CC22',
        pnlBad: '#FF2020',
        pnlWarn: '#FF6688',
        specOk: '#22CC22',
        specBad: '#FF2020'
      }
    };
  }

  setMode(mode) {
    this.mode = mode;
    localStorage.setItem('coldcreek-colorblind', mode);
    this._apply();
  }

  getMode() {
    return this.mode;
  }

  getPalette() {
    return ColorBlindMode.PALETTES[this.mode] || ColorBlindMode.PALETTES.off;
  }

  _apply() {
    const root = document.documentElement;
    const p = this.getPalette();

    root.style.setProperty('--alarm-crit', p.alarmCrit);
    root.style.setProperty('--alarm-hi', p.alarmHi);
    root.style.setProperty('--alarm-lo', p.alarmLo);
    root.style.setProperty('--alarm-rtn', p.alarmRtn);

    // Add/remove body class for pattern-based indicators
    document.body.classList.remove('cb-deuteranopia', 'cb-protanopia', 'cb-tritanopia');
    if (this.mode !== 'off') {
      document.body.classList.add('cb-' + this.mode);
    }

    // Add SVG patterns for alarms when color-blind mode is on
    if (this.mode !== 'off') {
      this._addSVGPatterns();
    }
  }

  _addSVGPatterns() {
    const svg = document.getElementById('pid-diagram');
    if (!svg) return;

    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    // Add hatching pattern for alarm states
    if (!defs.querySelector('#cb-pattern-alarm')) {
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.id = 'cb-pattern-alarm';
      pattern.setAttribute('width', '6');
      pattern.setAttribute('height', '6');
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern.innerHTML = '<line x1="0" y1="6" x2="6" y2="0" stroke="#FF4400" stroke-width="1.5"/>';
      defs.appendChild(pattern);
    }
  }
}

window.ColorBlindMode = ColorBlindMode;
