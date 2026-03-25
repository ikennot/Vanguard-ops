import { GAME_CONST } from "../constants.js";
import serviceLocator from "../core/ServiceLocator.js";
import eventBus from "../core/EventBus.js";

class HealthSystem {
  constructor({ particles, audio } = {}) {
    this.particles = particles;
    this.audio = audio;
    eventBus.on("enemy:hit", ({ entity, damage, knockback }) => {
      this.applyEnemyDamage(entity, damage, knockback);
    });
    eventBus.on("player:hit", ({ entity, knockback }) => {
      this.applyPlayerDamage(entity, knockback);
    });
  }

  applyPlayerDamage(entity, knockbackX) {
    const audio = this.audio || serviceLocator.get("audio");
    const particles = this.particles || serviceLocator.get("particles");
    const health = entity.getComponent("health");
    const transform = entity.getComponent("transform");
    if (!health || !transform) return;
    if (health.invulnTimer > 0) return;

    health.knockbackVelocityX += knockbackX;
    transform.velocity.y = -180;
    health.invulnTimer = 0.45;
    health.controlLockTimer = 0.2;

    if (audio?.particlesEnabled && particles) {
      particles.spawn(
        { x: transform.position.x + transform.width * 0.5, y: transform.position.y + 20 },
        "#ff7f7f",
        10
      );
    }
  }

  applyEnemyDamage(entity, amount, knockback) {
    const audio = this.audio || serviceLocator.get("audio");
    const particles = this.particles || serviceLocator.get("particles");
    const health = entity.getComponent("health");
    const transform = entity.getComponent("transform");
    if (!health || !transform) return;

    health.health -= amount;
    health.wasHitByPlayer = true;
    const isBoss = entity.hasComponent("bossAi");
    const healthRatio = Math.max(0, health.health) / Math.max(1, health.maxHealth || 1);
    const multiplier = isBoss
      ? (healthRatio > 0.35 ? 5.5 : 8.0)
      : (healthRatio > 0.35 ? 2.6 : 4.2);
    health.knockbackVelocityX += knockback * multiplier;
    transform.velocity.y = isBoss ? -480 : -320;
    health.knockbackTimer = isBoss
      ? (healthRatio > 0.35 ? 0.9 : 1.3)
      : (healthRatio > 0.35 ? 0.6 : 0.95);

    if (audio?.particlesEnabled && particles) {
      particles.spawn(
        { x: transform.position.x + transform.width * 0.5, y: transform.position.y + 20 },
        "#ff9c75",
        10
      );
    }

    if (health.health <= 0) {
      if (!isBoss) {
        health.health = Math.floor(GAME_CONST.enemy.maxHealth * 0.4);
      }
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
          if (!health.killCounted && health.wasHitByPlayer) {
            health.killCounted = true;
            eventBus.emit("entity:death", { tag: "enemy" });
          }
          const audio = this.audio || serviceLocator.get("audio");
          if (audio && !entity.markedForRemoval) {
            audio.playSfx("sfx-enemy-fall");
          }
          entity.markedForRemoval = true;
        }

      }
    }
  }
}

export default HealthSystem;
