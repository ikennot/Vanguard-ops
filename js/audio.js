class AudioManager {
  constructor() {
    this.bgmVolume = 0.7;
    this.sfxVolume = 0.8;
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

window.AudioManager = AudioManager;
