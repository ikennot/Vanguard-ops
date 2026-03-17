class AudioManager {
  constructor() {
    this.bgmVolume = 0.7;
    this.sfxVolume = 0.8;
  }

  setBgmVolume(value) {
    this.bgmVolume = Utils.clamp(value, 0, 1);
  }

  setSfxVolume(value) {
    this.sfxVolume = Utils.clamp(value, 0, 1);
  }
}

window.AudioManager = AudioManager;
