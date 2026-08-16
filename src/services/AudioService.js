import { CONFIG } from '../config/gameConfig.js';

/**
 * AudioService - Zero-asset procedural Web Audio API sound synthesizer and synthwave sequencer.
 */
export class AudioService {
  constructor() {
    this.ctx = null;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.7;
    this.isMuted = false;
    this.musicPlaying = false;
    this.musicTimeout = null;
    this.currentBpm = 124;
    this.step = 0;

    this.synthScales = [
      [220, 261.63, 293.66, 329.63, 392.00, 440], // Minor synth
      [196, 220, 246.94, 293.66, 329.63, 392],    // Mixolydian
      [174.61, 220, 261.63, 293.66, 349.23, 440]  // Dark
    ];
    this.scaleIndex = 0;
    this.bossMusicMode = false;

    // Master gains
    this.masterSfxGain = null;
    this.masterMusicGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      this.ctx = new AudioCtxClass();

      // SFX Node
      this.masterSfxGain = this.ctx.createGain();
      this.masterSfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.masterSfxGain.connect(this.ctx.destination);

      // Music Node
      this.masterMusicGain = this.ctx.createGain();
      this.masterMusicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.masterMusicGain.connect(this.ctx.destination);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.masterSfxGain && this.ctx) {
      this.masterSfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.masterMusicGain && this.ctx) {
      this.masterMusicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  playSound(type) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.ctx || !this.masterSfxGain) return;

    const t = this.ctx.currentTime;
    const dest = this.masterSfxGain;

    switch (type) {
      case 'jump': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(550, t + 0.15);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      }

      case 'double_jump': {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(440, t);
        osc1.frequency.exponentialRampToValueAtTime(880, t + 0.2);
        osc2.frequency.setValueAtTime(554, t);
        osc2.frequency.exponentialRampToValueAtTime(1108, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(dest);
        osc1.start(t); osc2.start(t);
        osc1.stop(t + 0.2); osc2.stop(t + 0.2);
        break;
      }

      case 'slide': {
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.25);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        break;
      }

      case 'coin': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.06);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.22);
        break;
      }

      case 'gravity': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.28);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.28);
        break;
      }

      case 'nitro': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.4);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.4);
        break;
      }

      case 'powerup': {
        const notes = [329.63, 440, 554.37, 659.25];
        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + i * 0.06);
          gain.gain.setValueAtTime(0.2, t + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(t + i * 0.06);
          osc.stop(t + i * 0.06 + 0.25);
        });
        break;
      }

      case 'hit':
      case 'crash': {
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(60, t + 0.4);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        noise.start(t);
        break;
      }

      case 'laser': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'boss_alarm': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.setValueAtTime(480, t + 0.15);
        osc.frequency.setValueAtTime(350, t + 0.3);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.45);
        break;
      }
    }
  }

  startMusic() {
    if (this.musicPlaying) return;
    this.init();
    this.musicPlaying = true;
    this.step = 0;
    this.scheduleMusicStep();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimeout) clearTimeout(this.musicTimeout);
  }

  setMusicTempo(speed) {
    const norm = Math.min(1, Math.max(0, (speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED)));
    this.currentBpm = 120 + norm * 40;
  }

  scheduleMusicStep() {
    if (!this.musicPlaying) return;
    const stepDuration = 60 / this.currentBpm / 4; // 16th note
    if (this.ctx && this.musicVolume > 0 && !this.isMuted) {
      const t = this.ctx.currentTime + 0.04;
      this.playSequencerStep(this.step, t);
    }
    this.step = (this.step + 1) % 16;
    this.musicTimeout = setTimeout(() => this.scheduleMusicStep(), stepDuration * 1000);
  }

  playSequencerStep(step, t) {
    if (!this.masterMusicGain) return;
    const dest = this.masterMusicGain;
    const scale = this.synthScales[this.scaleIndex % this.synthScales.length];

    // Bass Kick on 0, 4, 8, 12
    if (step % 4 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      gain.gain.setValueAtTime(0.6 * 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    // Snare on 4, 12
    if (step === 4 || step === 12) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      gain.gain.setValueAtTime(0.2 * 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    // Hi-hat on odd steps
    if (step % 2 === 1) {
      const bufferSize = this.ctx.sampleRate * 0.03;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12 * 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(t);
    }

    // Bassline Synth Arp
    if (step % 2 === 0 || this.bossMusicMode) {
      const noteIdx = (step * 3 + (this.bossMusicMode ? 2 : 0)) % scale.length;
      const freq = scale[noteIdx] * (this.bossMusicMode ? 0.75 : 0.5);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2 * 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.18);
    }
  }
}
