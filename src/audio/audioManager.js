/**
 * AudioManager — Generates and manages all game audio using Web Audio API.
 * No external audio files needed — all sounds synthesized.
 *
 * Ambient plant hum, alarm tones, radio static, equipment sounds.
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.alarmsEnabled = true;
    this.initialized = false;

    // Active sound loops
    this.ambientNode = null;
    this.alarmNodes = {};
  }

  /**
   * Initialize audio context (must be called from user gesture)
   */
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  /**
   * Start ambient plant hum
   */
  startAmbient() {
    if (!this.initialized || !this.enabled) return;
    if (this.ambientNode) return;

    // Low frequency hum (plant machinery)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 60; // 60Hz hum

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 120; // Harmonic

    const gain = this.ctx.createGain();
    gain.gain.value = 0.03;

    // Add subtle noise for air handling
    const noise = this._createNoise(0.01);

    osc1.connect(gain);
    osc2.connect(gain);
    noise.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.ambientNode = { osc1, osc2, noise, gain };
  }

  stopAmbient() {
    if (this.ambientNode) {
      this.ambientNode.osc1.stop();
      this.ambientNode.osc2.stop();
      if (this.ambientNode.noise._source) {
        this.ambientNode.noise._source.stop();
      } else if (this.ambientNode.noise.stop) {
        this.ambientNode.noise.stop();
      }
      this.ambientNode = null;
    }
  }

  /**
   * Play alarm tone
   * @param {string} priority - 'critical', 'high', 'low'
   */
  playAlarm(priority) {
    if (!this.initialized || !this.enabled || !this.alarmsEnabled) return;

    const key = priority;
    if (this.alarmNodes[key]) return; // Already playing

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    switch (priority) {
      case 'critical':
        // Fast beeping, high pitch
        osc.type = 'square';
        osc.frequency.value = 880;
        gain.gain.value = 0;
        this._pulseGain(gain, 0.15, 0.25); // Fast pulse
        break;
      case 'high':
        // Medium beeping
        osc.type = 'square';
        osc.frequency.value = 660;
        gain.gain.value = 0;
        this._pulseGain(gain, 0.1, 0.5);
        break;
      case 'low':
        // Slow beeping, lower pitch
        osc.type = 'sine';
        osc.frequency.value = 440;
        gain.gain.value = 0;
        this._pulseGain(gain, 0.08, 1.0);
        break;
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.alarmNodes[key] = { osc, gain, interval: null };
  }

  _pulseGain(gainNode, maxVol, interval) {
    const pulse = () => {
      const now = this.ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(maxVol, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
    };
    pulse();
    const id = setInterval(pulse, interval * 1000);
    gainNode._intervalId = id;
  }

  /**
   * Stop alarm tone
   */
  stopAlarm(priority) {
    const node = this.alarmNodes[priority];
    if (node) {
      node.osc.stop();
      if (node.gain._intervalId) clearInterval(node.gain._intervalId);
      delete this.alarmNodes[priority];
    }
  }

  /**
   * Stop all alarms
   */
  stopAllAlarms() {
    for (const key in this.alarmNodes) {
      this.stopAlarm(key);
    }
  }

  /**
   * Play a short sound effect
   * @param {string} type - 'click', 'beep', 'radio', 'pump-stroke', 'valve-move'
   */
  playEffect(type) {
    if (!this.initialized || !this.enabled) return;

    switch (type) {
      case 'click':
        this._playTone(1200, 0.02, 0.05, 'sine');
        break;
      case 'beep':
        this._playTone(800, 0.05, 0.1, 'sine');
        break;
      case 'radio':
        this._playRadioStatic();
        break;
      case 'pump-stroke':
        this._playTone(200, 0.08, 0.15, 'triangle');
        break;
      case 'valve-move':
        this._playTone(300, 0.03, 0.2, 'sawtooth');
        break;
      case 'alarm':
        // Short urgent alarm burst
        this._playTone(880, 0.12, 0.15, 'square');
        break;
      case 'alarm-critical':
        // Critical event — two-tone urgent
        this._playTone(880, 0.15, 0.12, 'square');
        setTimeout(() => this._playTone(1100, 0.15, 0.12, 'square'), 120);
        break;
      case 'radio-static':
        this._playRadioStatic();
        break;
      case 'alarm-ack':
        this._playTone(600, 0.05, 0.08, 'sine');
        setTimeout(() => this._playTone(800, 0.05, 0.08, 'sine'), 80);
        break;
      case 'esd':
        // Emergency shutdown — loud, distinctive
        this._playTone(440, 0.2, 0.5, 'square');
        setTimeout(() => this._playTone(220, 0.2, 0.5, 'square'), 500);
        break;
    }
  }

  _playTone(freq, vol, duration, type) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.01);
  }

  _playRadioStatic() {
    const noise = this._createNoise(0.05);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.stop(this.ctx.currentTime + 0.35);
  }

  _createNoise(volume) {
    // Cache noise buffer — same white noise reused across all instances
    if (!this._noiseBuffer) {
      const bufferSize = this.ctx.sampleRate * 2;
      this._noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this._noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    const source = this.ctx.createBufferSource();
    source.buffer = this._noiseBuffer;
    source.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    source.start();
    // Return gain node so callers connect the volume-controlled output
    // Attach source ref for stop() calls
    gain._source = source;
    gain.stop = function (when) { source.stop(when); };
    return gain;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
    }
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
      this.stopAllAlarms();
    }
  }

  setAlarmsEnabled(enabled) {
    this.alarmsEnabled = enabled;
    if (!enabled) {
      this.stopAllAlarms();
    }
  }

  stopAll() {
    this.stopAmbient();
    this.stopAllAlarms();
  }

  destroy() {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

window.AudioManager = AudioManager;
