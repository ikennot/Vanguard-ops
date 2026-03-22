class AssetService {
  constructor({ imageFactory, audioFactory } = {}) {
    this.imageFactory = imageFactory || (() => new Image());
    this.audioFactory = audioFactory || (() => new Audio());
    this.images = new Map();
    this.audios = new Map();
  }

  has(key) {
    return this.images.has(key) || this.audios.has(key);
  }

  get(key) {
    return this.images.get(key) || this.audios.get(key) || null;
  }

  getImage(key) {
    return this.images.get(key) || null;
  }

  getAudio(key) {
    return this.audios.get(key) || null;
  }

  loadImage(key, src) {
    const cached = this.images.get(key);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve) => {
      const image = this.imageFactory();
      image.onload = () => {
        this.images.set(key, image);
        resolve(image);
      };
      image.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        resolve(null);
      };
      image.src = src;
    });
  }

  loadAudio(key, src) {
    const cached = this.audios.get(key);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve) => {
      const audio = this.audioFactory();
      const cleanup = () => {
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("error", onError);
      };
      const onReady = () => {
        cleanup();
        this.audios.set(key, audio);
        resolve(audio);
      };
      const onError = () => {
        cleanup();
        console.warn(`Failed to load audio: ${src}`);
        // Resolve anyway so we don't block the game from starting
        resolve(null);
      };

      audio.preload = "auto";
      audio.addEventListener("canplaythrough", onReady, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.src = src;
      audio.load();
    });
  }

  preload(manifest = []) {
    const tasks = manifest.map((entry) => {
      const type = entry.type || "image";
      if (type === "audio") return this.loadAudio(entry.key, entry.src);
      return this.loadImage(entry.key, entry.src);
    });
    return Promise.all(tasks);
  }

  clear() {
    this.images.clear();
    this.audios.clear();
  }
}

export default AssetService;
