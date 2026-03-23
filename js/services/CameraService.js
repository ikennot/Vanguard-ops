import { GAME_CONST } from "../constants.js";
import { Utils } from "../utils.js";

class CameraService {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
    this.zoom = GAME_CONST.camera.zoom; // Zoom factor
    this.lerpSpeed = GAME_CONST.camera.lerpSpeed; // Smoothness factor (0 to 1)
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }

  resetToTarget(target) {
    if (!target) {
      this.reset();
      return;
    }
    const visibleWidth = this.width / this.zoom;
    const visibleHeight = this.height / this.zoom;
    this.x = target.position.x - visibleWidth / 2;
    this.y = target.position.y - visibleHeight / 2;
  }

  follow(target) {
    if (!target) return;

    const visibleWidth = this.width / this.zoom;
    const visibleHeight = this.height / this.zoom;

    const targetX = target.position.x - visibleWidth / 2;
    const targetY = target.position.y - visibleHeight / 2;

    // Smooth movement using lerp
    this.x += (targetX - this.x) * this.lerpSpeed;
    this.y += (targetY - this.y) * this.lerpSpeed;

    // Clamp within world boundaries
    this.x = Utils.clamp(this.x, 0, GAME_CONST.world.width - visibleWidth);
    this.y = Utils.clamp(this.y, 0, GAME_CONST.world.height - visibleHeight);
  }
}

export default CameraService;
