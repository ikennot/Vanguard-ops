import { Utils } from "./utils.js";

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(position, color, count = 6) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: position.x,
        y: position.y,
        vx: Utils.randomRange(-90, 90),
        vy: Utils.randomRange(-140, 20),
        life: Utils.randomRange(0.2, 0.45),
        maxLife: 0.45,
        color
      });
    }
  }

  update(deltaTime) {
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.life -= deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 220 * deltaTime;
    }
  }

  draw(ctx, camera) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camera.x, p.y - camera.y, 3, 3);
    }
    ctx.globalAlpha = 1;
  }
}

export default ParticleSystem;
