class SpriteSheet {
  constructor(path) {
    this.path = path;
    this.image = new Image();
    this.image.src = path;
  }
}

export default SpriteSheet;
