window.Collision = {
  resolveWorldBounds(entity, worldWidth, worldHeight) {
    entity.position.x = Utils.clamp(entity.position.x, 0, worldWidth - entity.width);
    if (entity.position.y + entity.height >= worldHeight) {
      entity.position.y = worldHeight - entity.height;
      entity.velocity.y = 0;
      entity.onGround = true;
    }
  }
};
