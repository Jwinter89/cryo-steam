/**
 * Henry — The Gas Plant Mascot
 * A friendly, hard-hat-wearing character who guides players through tutorials
 * and announces events. He slides in from the side or top with personality.
 *
 * Henry is a decade-experienced operator who's seen it all. He's gruff but
 * kind, speaks in short declarative sentences, and always knows what's coming.
 */

class Henry {
  constructor() {
    this.container = null;
    this.speechBubble = null;
    this.isVisible = false;
    this.queue = [];
    this.currentTimeout = null;
    this.dismissCallback = null;
    this._create();
  }

  _create() {
    // Main container
    this.container = document.createElement('div');
    this.container.id = 'henry-container';
    this.container.className = 'henry-container';
    this.container.innerHTML = `
      <div class="henry-character" id="henry-character">
        <div class="henry-hardhat">
          <div class="henry-hardhat-brim"></div>
          <div class="henry-hardhat-dome"></div>
          <div class="henry-lamp"></div>
        </div>
        <div class="henry-face">
          <div class="henry-eye henry-eye-left"></div>
          <div class="henry-eye henry-eye-right"></div>
          <div class="henry-mustache"></div>
          <div class="henry-mouth"></div>
        </div>
        <div class="henry-body">
          <div class="henry-coveralls"></div>
          <div class="henry-badge">HENRY</div>
          <div class="henry-arm henry-arm-left"></div>
          <div class="henry-arm henry-arm-right"></div>
        </div>
      </div>
      <div class="henry-speech" id="henry-speech">
        <div class="henry-speech-arrow"></div>
        <div class="henry-speech-text" id="henry-speech-text"></div>
        <div class="henry-speech-actions" id="henry-speech-actions"></div>
      </div>
    `;
    document.body.appendChild(this.container);

    this.speechBubble = document.getElementById('henry-speech');
    this.textEl = document.getElementById('henry-speech-text');
    this.actionsEl = document.getElementById('henry-speech-actions');
    this.characterEl = document.getElementById('henry-character');
  }

  /**
   * Show Henry with a message. Position: 'left', 'right', 'top'
   * Options:
   *   text: string
   *   mood: 'normal' | 'alert' | 'happy' | 'worried' | 'teaching'
   *   position: 'left' | 'right' | 'top'
   *   duration: ms (0 = stay until dismissed)
   *   buttons: [{ label, action, callback }]
   *   onDismiss: callback
   *   type: 'tutorial' | 'event' | 'tip' | 'announcement'
   */
  show(options = {}) {
    const {
      text = '',
      mood = 'normal',
      position = 'right',
      duration = 0,
      buttons = [],
      onDismiss = null,
      type = 'tip'
    } = options;

    // If currently showing, queue this message
    if (this.isVisible && type !== 'event') {
      this.queue.push(options);
      return;
    }

    this.isVisible = true;
    this.dismissCallback = onDismiss;

    // Set position
    this.container.className = `henry-container henry-${position} henry-${type}`;

    // Set mood (affects face expression)
    this._setMood(mood);

    // Set text with typewriter effect
    this._typewrite(text);

    // Set buttons
    this.actionsEl.innerHTML = '';
    if (buttons.length > 0) {
      buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = 'henry-btn';
        el.textContent = btn.label;
        el.addEventListener('click', () => {
          if (btn.callback) btn.callback();
          if (btn.action === 'dismiss') this.hide();
        });
        this.actionsEl.appendChild(el);
      });
    } else if (duration === 0) {
      // Add a default dismiss button
      const el = document.createElement('button');
      el.className = 'henry-btn';
      el.textContent = 'GOT IT';
      el.addEventListener('click', () => this.hide());
      this.actionsEl.appendChild(el);
    }

    // Animate in
    requestAnimationFrame(() => {
      this.container.classList.add('henry-visible');
    });

    // Arm wave animation on entry
    this.characterEl.classList.add('henry-wave');
    setTimeout(() => this.characterEl.classList.remove('henry-wave'), 1200);

    // Auto-dismiss
    if (this.currentTimeout) clearTimeout(this.currentTimeout);
    if (duration > 0) {
      this.currentTimeout = setTimeout(() => this.hide(), duration);
    }
  }

  /**
   * Show an event announcement — slides in from top with urgency
   */
  announce(eventName, description, severity = 'warning') {
    const moods = {
      warning: 'alert',
      alarm: 'worried',
      critical: 'worried',
      info: 'normal'
    };

    this.show({
      text: `${eventName}\n${description}`,
      mood: moods[severity] || 'alert',
      position: 'top',
      duration: 6000,
      type: 'event',
      buttons: []
    });
  }

  /**
   * Tutorial step — Henry teaches with a NEXT button
   */
  teach(text, onNext) {
    this.show({
      text: text,
      mood: 'teaching',
      position: 'right',
      duration: 0,
      type: 'tutorial',
      buttons: [
        { label: 'NEXT', callback: onNext, action: 'dismiss' }
      ]
    });
  }

  /**
   * Quick tip — brief popup that auto-dismisses
   */
  tip(text, duration = 4000) {
    this.show({
      text: text,
      mood: 'happy',
      position: 'right',
      duration: duration,
      type: 'tip'
    });
  }

  /**
   * Welcome message for first-time players
   */
  welcome() {
    this.show({
      text: "Name's Henry. Been running gas plants for thirty years.\n\nI'll show you around. Pick a facility and mode to get started. If you're new, hit LEARN MODE — I'll walk you through everything.",
      mood: 'happy',
      position: 'right',
      duration: 0,
      type: 'announcement',
      buttons: [
        { label: "LET'S GO", action: 'dismiss' }
      ]
    });
  }

  /**
   * Context-aware tips during gameplay
   */
  operatorTip(context) {
    const tips = {
      'rvp-high': "RVP climbing. Ramp that reboiler up — you're leaving lights in the product.",
      'rvp-low': "RVP dropping too low. Ease off the heat. You're burning money sending product to gas.",
      'pig-incoming': "Pig inbound. Get your separator ready — ramp up FIC-401 before it hits.",
      'shift-start': "New shift. Check your levels, temps, and pressures. Read the board before you touch anything.",
      'alarm-flood': "Multiple alarms. Don't chase them all. Find the ROOT CAUSE. Trace it on the P&ID.",
      'first-faceplate': "Click any tag to open its faceplate. That's where you change setpoints and modes.",
      'good-earnings': "Nice shift. You're making money. Keep that product in spec.",
      'crisis-start': "Crisis scenario. Clock's ticking. Focus on the critical path — don't get distracted.",
      'separator-high': "Separator level climbing fast. Open up that feed valve before it trips the comp.",
      'comp-trip': "Compressor tripped! Check what caused it. Probably liquid carryover from the separator.",
    };

    const text = tips[context];
    if (text) {
      this.tip(text, 5000);
    }
  }

  hide() {
    if (!this.isVisible) return;

    this.container.classList.remove('henry-visible');
    this.isVisible = false;

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    if (this.dismissCallback) {
      this.dismissCallback();
      this.dismissCallback = null;
    }

    // Process queue after animation
    setTimeout(() => {
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.show(next);
      }
    }, 400);
  }

  _setMood(mood) {
    const face = this.characterEl.querySelector('.henry-face');
    const mouth = this.characterEl.querySelector('.henry-mouth');
    const eyeL = this.characterEl.querySelector('.henry-eye-left');
    const eyeR = this.characterEl.querySelector('.henry-eye-right');

    // Reset
    face.className = 'henry-face';
    mouth.className = 'henry-mouth';
    eyeL.className = 'henry-eye henry-eye-left';
    eyeR.className = 'henry-eye henry-eye-right';

    switch (mood) {
      case 'alert':
        face.classList.add('henry-mood-alert');
        mouth.classList.add('henry-mouth-open');
        eyeL.classList.add('henry-eye-wide');
        eyeR.classList.add('henry-eye-wide');
        break;
      case 'worried':
        face.classList.add('henry-mood-worried');
        mouth.classList.add('henry-mouth-frown');
        break;
      case 'happy':
        face.classList.add('henry-mood-happy');
        mouth.classList.add('henry-mouth-smile');
        break;
      case 'teaching':
        face.classList.add('henry-mood-teaching');
        mouth.classList.add('henry-mouth-talk');
        eyeL.classList.add('henry-eye-squint');
        eyeR.classList.add('henry-eye-squint');
        break;
      default:
        mouth.classList.add('henry-mouth-neutral');
    }
  }

  _typewrite(text) {
    this.textEl.textContent = '';
    let i = 0;
    const chars = text.split('');

    const type = () => {
      if (i < chars.length) {
        this.textEl.textContent += chars[i];
        i++;
        // Speed varies — faster for spaces, slower for punctuation
        const ch = chars[i - 1];
        const delay = ch === '\n' ? 100 : ch === '.' || ch === '!' || ch === '?' ? 80 : ch === ',' ? 50 : ch === ' ' ? 15 : 18;
        this._typeTimer = setTimeout(type, delay);
      }
    };

    if (this._typeTimer) clearTimeout(this._typeTimer);
    type();
  }

  /**
   * Shake animation for urgent events
   */
  shake() {
    this.characterEl.classList.add('henry-shake');
    setTimeout(() => this.characterEl.classList.remove('henry-shake'), 600);
  }

  /**
   * Nod animation for confirmations
   */
  nod() {
    this.characterEl.classList.add('henry-nod');
    setTimeout(() => this.characterEl.classList.remove('henry-nod'), 500);
  }
}

window.Henry = Henry;
