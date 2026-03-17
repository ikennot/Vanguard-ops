class SpriteSheet {
  constructor(path) {
    this.path = path;
    this.image = new Image();
    this.image.src = path;
  }
}

window.SpriteSheet = SpriteSheet;
