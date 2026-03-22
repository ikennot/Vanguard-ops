import { Utils } from "../utils.js";
import eventBus from "../core/EventBus.js";
import serviceLocator from "../core/ServiceLocator.js";

class AudioService {
  constructor() {
    this.bgmVolume = 0.7;
    this.sfxVolume = 0.8;
    this.particlesEnabled = true;
    this.audioContext = null;
    this.lastEnemyHitAt = 0;
    this.currentBgm = null;
    this.bgmName = null;
    
    eventBus.on("enemy:hit", () => {
      const now = performance.now();
      if (now - this.lastEnemyHitAt < 45) return;
      this.lastEnemyHitAt = now;
      this.playSfx("enemy-hit");
    });
  }

  setBgmVolume(value) {
    const wasMuted = this.bgmVolume === 0;
    this.bgmVolume = Utils.clamp(value, 0, 1);
    if (this.currentBgm) {
      this.currentBgm.volume = this.bgmVolume;
      if (wasMuted && this.bgmVolume > 0 && this.currentBgm.paused) {
        this.currentBgm.play().catch(e => console.warn(e));
      } else if (this.bgmVolume === 0 && !this.currentBgm.paused) {
        this.currentBgm.pause();
      }
    }
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

  playBgm(name) {
    if (this.bgmName === name) return;
    this.stopBgm();
    
    const assets = serviceLocator.get("assets");
    if (!assets) return;
    
    const audio = assets.getAudio(name);
    if (!audio) return;
    
    this.bgmName = name;
    this.currentBgm = audio.cloneNode();
    this.currentBgm.loop = true;
    this.currentBgm.volume = this.bgmVolume;
    
    if (this.bgmVolume > 0) {
      const playPromise = this.currentBgm.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name === 'NotAllowedError') {
            console.warn(`Autoplay blocked for BGM ${name}. Waiting for user interaction...`);
            
            const resumeOnInteract = () => {
              if (this.currentBgm && this.bgmName === name && this.bgmVolume > 0) {
                this.currentBgm.play().catch(err => console.warn(err));
              }
              document.removeEventListener("click", resumeOnInteract);
            };
            document.addEventListener("click", resumeOnInteract);
          } else {
            console.warn(`Failed to play BGM ${name}:`, e);
          }
        });
      }
    }
  }
  
  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.currentTime = 0;
      this.currentBgm = null;
    }
    this.bgmName = null;
  }

  playSfx(name) {
    if (this.sfxVolume <= 0) return;
    const context = this.getAudioContext();
    if (context && context.state === "suspended") {
      context.resume();
    }

    if (name === "enemy-hit") {
      if (!context) return;
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
      return;
    }
    
    const assets = serviceLocator.get("assets");
    if (assets) {
      const audioAsset = assets.getAudio(name);
      if (audioAsset) {
        const soundInstance = audioAsset.cloneNode();
        soundInstance.volume = this.sfxVolume;
        soundInstance.play().catch(e => console.warn(`Failed to play SFX ${name}:`, e));
      }
    }
  }
}

export default AudioService;
