import { GAME_CONST } from "../constants.js";
import { Utils } from "../utils.js";

class CameraService {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = 0;
  }

  reset() {
    this.x = 0;
    this.y = 0;
  }

  resetToTarget(target) {
    this.reset();
    if (!target) return;
    this.follow(target);
  }

  follow(target) {
    this.x = Utils.clamp(target.position.x - this.width * 0.35, 0, GAME_CONST.world.width - this.width);
    this.y = Utils.clamp(
      target.position.y - this.height * 0.45,
      0,
      GAME_CONST.world.height - this.height
    );
  }
}

export default CameraService;
