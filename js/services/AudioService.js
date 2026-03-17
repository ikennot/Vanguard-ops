import { Utils } from "../utils.js";
import eventBus from "../core/EventBus.js";

class AudioService {
  constructor() {
    this.bgmVolume = 0.7;
    this.sfxVolume = 0.8;
    // Keeps existing behavior: this also gates visual particle effects.
    this.particlesEnabled = true;
    this.audioContext = null;
    this.lastEnemyHitAt = 0;
    eventBus.on("enemy:hit", () => {
      const now = performance.now();
      if (now - this.lastEnemyHitAt < 45) return;
      this.lastEnemyHitAt = now;
      this.playSfx("enemy-hit");
    });
  }

  setBgmVolume(value) {
    this.bgmVolume = Utils.clamp(value, 0, 1);
  }

  setSfxVolume(value) {
    this.sfxVolume = Utils.clamp(value, 0, 1);
  }

  setParticlesEnabled(value) {
    this.particlesEnabled = Boolean(value);
  }

  getAudioContext() {
    if (this.audioContext) return this.audioContext;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    this.audioContext = new Context();
    return this.audioContext;
  }

  playSfx(name) {
    if (this.sfxVolume <= 0) return;
    const context = this.getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      context.resume();
    }

    if (name === "enemy-hit") {
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(220, now);
      oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(this.sfxVolume * 0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
    }
  }
}

export default AudioService;
