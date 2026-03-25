import { Utils } from "./utils.js";
import { GAME_CONST } from "./constants.js";

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
    const particleSize = GAME_CONST.effects.particles.size;
    const glowSize = GAME_CONST.effects.particles.glowSize;
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const drawX = p.x - camera.x;
      const drawY = p.y - camera.y;

      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(drawX, drawY, glowSize * alpha, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        drawX - particleSize * 0.5,
        drawY - particleSize * 0.5,
        particleSize,
        particleSize
      );
    }
    ctx.globalAlpha = 1;
  }
}

export default ParticleSystem;
