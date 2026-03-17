import { Collision } from "../collision.js";
import { GAME_CONST } from "../constants.js";

class CollisionSystem {
  update(entityManager, platforms) {
    const entities = entityManager.getWithComponents(["transform", "hitbox"]);

    for (const entity of entities) {
      if (!entity.hasTag("physics")) continue;
      if (!entity.hasTag("world-bounds")) continue;
      const transform = entity.getComponent("transform");

      Collision.resolveWorldBounds(transform, GAME_CONST.world.width);

      if (entity.hasTag("platform-collide")) {
        Collision.resolvePlatforms(transform, platforms);
      }
    }
  }
}

export default CollisionSystem;
