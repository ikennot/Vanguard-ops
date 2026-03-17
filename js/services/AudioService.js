import { Utils } from "../utils.js";

class AudioService {
  constructor() {
    this.bgmVolume = 0.7;
    this.sfxVolume = 0.8;
    // Keeps existing behavior: this also gates visual particle effects.
    this.particlesEnabled = true;
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
}

export default AudioService;
