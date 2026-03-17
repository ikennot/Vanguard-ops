import { GAME_CONST } from "../constants.js";

class HealthSystem {
  constructor({ particles, audio, onEnemyKilled } = {}) {
    this.particles = particles;
    this.audio = audio;
    this.onEnemyKilled = onEnemyKilled;
  }

  applyPlayerDamage(entity, knockbackX) {
    const health = entity.getComponent("health");
    const transform = entity.getComponent("transform");
    if (!health || !transform) return;
    if (health.invulnTimer > 0) return;

    health.knockbackVelocityX += knockbackX;
    transform.velocity.y = -180;
    health.invulnTimer = 0.45;
    health.controlLockTimer = 0.2;

    if (this.audio?.particlesEnabled && this.particles) {
      this.particles.spawn(
        { x: transform.position.x + transform.width * 0.5, y: transform.position.y + 20 },
        "#ff7f7f",
        10
      );
    }
  }

  applyEnemyDamage(entity, amount, knockback) {
    const health = entity.getComponent("health");
    const transform = entity.getComponent("transform");
    if (!health || !transform) return;

    health.health -= amount;
    const healthRatio = Math.max(0, health.health) / GAME_CONST.enemy.maxHealth;
    const multiplier = healthRatio > 0.35 ? 2.6 : 4.2;
    health.knockbackVelocityX += knockback * multiplier;
    transform.velocity.y = -320;
    health.knockbackTimer = healthRatio > 0.35 ? 0.6 : 0.95;

    if (this.audio?.particlesEnabled && this.particles) {
      this.particles.spawn(
        { x: transform.position.x + transform.width * 0.5, y: transform.position.y + 20 },
        "#ff9c75",
        10
      );
    }

    if (health.health <= 0) {
      health.health = Math.floor(GAME_CONST.enemy.maxHealth * 0.4);
    }
  }

  update(entityManager, deltaTime) {
    const entities = entityManager.getWithComponents(["health", "transform"]);

    for (const entity of entities) {
      const health = entity.getComponent("health");
      const transform = entity.getComponent("transform");

      health.invulnTimer = Math.max(0, (health.invulnTimer || 0) - deltaTime);
      health.knockbackTimer = Math.max(0, (health.knockbackTimer || 0) - deltaTime);
      health.controlLockTimer = Math.max(0, (health.controlLockTimer || 0) - deltaTime);

      if (transform.position.y > GAME_CONST.world.killY) {
        if (entity.hasTag("enemy")) {
          if (!health.killCounted) {
            health.killCounted = true;
            if (this.onEnemyKilled) this.onEnemyKilled();
          }
          entity.markedForRemoval = true;
        }

      }
    }
  }
}

export default HealthSystem;
