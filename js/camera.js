class Camera {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
  }

  follow(target) {
    this.x = Math.max(0, target.position.x - this.width * 0.35);
    this.y = Math.max(0, target.position.y - this.height * 0.45);
  }
}

window.Camera = Camera;
