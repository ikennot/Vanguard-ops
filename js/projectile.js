import { GAME_CONST } from "./constants.js";
import { createTransform } from "./components/Transform.js";
import { createSprite } from "./components/Sprite.js";
import { createHitbox } from "./components/Hitbox.js";
import eventBus from "./core/EventBus.js";

class ProjectileManager {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.projectiles = [];
  }

  clear() {
    for (const projectile of this.projectiles) {
      projectile.markedForRemoval = true;
    }
    this.projectiles = [];
  }

  spawn(
    origin,
    direction,
    speed,
    damage,
    owner,
    color = null,
    knockback = GAME_CONST.projectile.knockback
  ) {
    const norm = Math.hypot(direction.x, direction.y) || 1;
    const projectileSize =
      owner === "enemy" ? GAME_CONST.entity.projectile.enemy : GAME_CONST.entity.projectile.player;
    const projectileColor =
      color ||
      (owner === "enemy"
        ? GAME_CONST.entity.projectile.enemy.color
        : GAME_CONST.entity.projectile.player.color);
    const projectile = this.entityManager
      .createEntity()
      .addTag("projectile")
      .addTag("render")
      .addTag("physics")
      .addComponent(
        "transform",
        createTransform({
          x: origin.x,
          y: origin.y,
          vx: (direction.x / norm) * speed,
          vy: (direction.y / norm) * speed,
          width: projectileSize.width,
          height: projectileSize.height,
          gravity: 0
        })
      )
      .addComponent("sprite", createSprite({ color: projectileColor }))
      .addComponent("hitbox", createHitbox())
      .addComponent("projectile", {
        life: GAME_CONST.projectile.life,
        damage,
        owner,
        knockback
      });

    this.projectiles.push(projectile);
    eventBus.emit("projectile:spawned", {
      owner,
      origin: { x: origin.x, y: origin.y },
      damage
    });
  }

  update(deltaTime, worldWidth, worldHeight = GAME_CONST.world.killY) {
    for (const projectile of this.projectiles) {
      if (projectile.markedForRemoval) continue;
      const transform = projectile.getComponent("transform");
      const projectileData = projectile.getComponent("projectile");
      projectileData.life -= deltaTime;

      if (
        projectileData.life <= 0 ||
        transform.position.x <= -20 ||
        transform.position.x >= worldWidth + 20 ||
        transform.position.y <= -20 ||
        transform.position.y >= worldHeight + 20
      ) {
        projectile.markedForRemoval = true;
      }
    }

    this.projectiles = this.projectiles.filter((projectile) => !projectile.markedForRemoval);
  }
}

export default ProjectileManager;
