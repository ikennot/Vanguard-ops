class RenderSystem {
  drawByTag(ctx, camera, entityManager, tag) {
    const entities = entityManager.getByTag(tag);
    this.drawEntities(ctx, camera, entities);
  }

  drawEntities(ctx, camera, entities) {
    for (const entity of entities) {
      const transform = entity.getComponent("transform");
      const sprite = entity.getComponent("sprite");
      if (!transform || !sprite) continue;

      ctx.fillStyle = sprite.color;
      ctx.fillRect(
        transform.position.x - camera.x,
        transform.position.y - camera.y,
        transform.width,
        transform.height
      );

      if (sprite.gunColor) {
        ctx.fillStyle = sprite.gunColor;
        const dir = transform.facing || 1;
        const gunWidth = sprite.gunWidth || 14;
        const gunHeight = sprite.gunHeight || 4;
        const gunOffsetY = sprite.gunOffsetY || 18;
        const gunInsetRight = sprite.gunInsetRight || 10;
        const gunInsetLeft = sprite.gunInsetLeft || 4;
        if (dir > 0) {
          ctx.fillRect(
            transform.position.x + transform.width - gunInsetRight - camera.x,
            transform.position.y + gunOffsetY - camera.y,
            gunWidth,
            gunHeight
          );
        } else {
          ctx.fillRect(
            transform.position.x - gunInsetLeft - camera.x,
            transform.position.y + gunOffsetY - camera.y,
            gunWidth,
            gunHeight
          );
        }
      }
    }
  }
}

export default RenderSystem;
