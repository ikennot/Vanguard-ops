class Camera {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
  }

  follow(target) {
    this.x = Utils.clamp(target.position.x - this.width * 0.35, 0, GAME_CONST.world.width - this.width);
    this.y = Utils.clamp(target.position.y - this.height * 0.45, 0, GAME_CONST.world.height - this.height);
  }
}

window.Camera = Camera;
