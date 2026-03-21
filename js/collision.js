import { Utils } from "./utils.js";

export const Collision = {
  getX(entity) {
    return entity.position ? entity.position.x : entity.x;
  },

  getY(entity) {
    return entity.position ? entity.position.y : entity.y;
  },

  resolveWorldBounds(entity, worldWidth) {
    entity.position.x = Utils.clamp(entity.position.x, 0, worldWidth - entity.width);
    if (entity.position.y < -80) {
      entity.position.y = -80;
      entity.velocity.y = Math.max(0, entity.velocity.y);
    }
  },

  resolvePlatforms(entity, platforms) {
    if ((entity.oneWayPlatformIgnoreTimer || 0) > 0) return;

    const prevY = entity.prevPosition ? entity.prevPosition.y : entity.position.y;
    const prevBottom = prevY + entity.height;
    const currBottom = entity.position.y + entity.height;

    for (const p of platforms) {
      const horizontalOverlap = entity.position.x + entity.width > p.x && entity.position.x < p.x + p.width;
      const landed = horizontalOverlap && prevBottom <= p.y && currBottom >= p.y && entity.velocity.y >= 0;

      if (landed) {
        entity.position.y = p.y - entity.height;
        entity.velocity.y = 0;
        entity.onGround = true;
      }
    }
  },

  intersects(a, b) {
    const ax = this.getX(a);
    const ay = this.getY(a);
    const bx = this.getX(b);
    const by = this.getY(b);
    return ax < bx + b.width && ax + a.width > bx && ay < by + b.height && ay + a.height > by;
  }
};
