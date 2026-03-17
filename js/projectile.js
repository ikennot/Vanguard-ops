class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  spawn(origin, direction, speed, damage, owner, color = "#ffd27f", knockback = GAME_CONST.projectile.knockback) {
    const norm = Math.hypot(direction.x, direction.y) || 1;
    this.projectiles.push({
      x: origin.x,
      y: origin.y,
      width: 8,
      height: 4,
      vx: (direction.x / norm) * speed,
      vy: (direction.y / norm) * speed,
      life: GAME_CONST.projectile.life,
      damage,
      owner,
      knockback,
      color
    });
  }

  update(deltaTime, worldWidth, worldHeight) {
    for (const p of this.projectiles) {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
    }

    this.projectiles = this.projectiles.filter(
      (p) =>
        p.life > 0 &&
        p.x > -20 &&
        p.x < worldWidth + 20 &&
        p.y > -20 &&
        p.y < worldHeight + 20
    );
  }

  draw(ctx, camera) {
    for (const p of this.projectiles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camera.x, p.y - camera.y, p.width, p.height);
    }
  }
}

window.ProjectileManager = ProjectileManager;
