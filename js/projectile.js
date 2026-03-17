class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  spawn(origin, direction, speed, damage) {
    this.projectiles.push({
      x: origin.x,
      y: origin.y,
      vx: direction.x * speed,
      vy: direction.y * speed,
      damage
    });
  }

  update(deltaTime) {
    for (const p of this.projectiles) {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
    }
  }
}

window.ProjectileManager = ProjectileManager;
