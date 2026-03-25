import { GAME_CONST } from "./constants.js";
import { Utils } from "./utils.js";
import { createTransform } from "./components/Transform.js";
import { createHealth } from "./components/Health.js";
import { createSprite } from "./components/Sprite.js";
import { createHitbox } from "./components/Hitbox.js";
import serviceLocator from "./core/ServiceLocator.js";

class FinalBoss {
  constructor(entityManager, x, y) {
    this.entityManager = entityManager;
    this.entity = entityManager.createEntity();
    this.entity
      .addTag("enemy")
      .addTag("render")
      .addTag("physics")
      .addTag("world-bounds")
      .addComponent(
        "transform",
        createTransform({
          x,
          y,
          width: GAME_CONST.boss.width,
          height: GAME_CONST.boss.height,
          gravity: 0,
          facing: -1
        })
      )
      .addComponent(
        "health",
        createHealth({
          health: GAME_CONST.boss.maxHealth,
          maxHealth: GAME_CONST.boss.maxHealth,
          knockbackVelocityX: 0,
          knockbackTimer: 0,
          killCounted: false,
          wasHitByPlayer: false
        })
      )
      .addComponent(
        "bossAi",
        {
          shootTimer: GAME_CONST.boss.shootCooldown * 0.5,
          hoverTime: Math.random() * Math.PI * 2,
          deathFalling: false,
          burstCount: 0,
          burstCooldown: 0
        }
      )
      .addComponent(
        "sprite",
        createSprite({
          type: "sprite",
          assetKey: "boss-facing-west",
          frameWidth: 500,
          frameHeight: 500,
          numFrames: 1,
          animationSpeed: 0.1,
          scale: 0.26,
          noFlip: true,
          color: GAME_CONST.boss.color
        })
      )
      .addComponent("hitbox", createHitbox());
  }

  get transform() {
    return this.entity.getComponent("transform");
  }

  get health() {
    return this.entity.getComponent("health");
  }

  get ai() {
    return this.entity.getComponent("bossAi");
  }

  update(deltaTime, deps) {
    const transform = this.transform;
    const health = this.health;
    const ai = this.ai;
    const sprite = this.entity.getComponent("sprite");
    const playerTransform = deps.player?.entity?.getComponent("transform");
    if (!transform || !health || !ai || !playerTransform) return;

    health.knockbackVelocityX *= 0.94;
    if (Math.abs(health.knockbackVelocityX) < 6) health.knockbackVelocityX = 0;

    if (health.health <= 0) {
      if (!ai.deathFalling) {
        ai.deathFalling = true;
        transform.gravity = GAME_CONST.enemy.gravity;
        transform.velocity.x = 0;
      }
      return;
    }

    ai.hoverTime += deltaTime * GAME_CONST.boss.hoverSpeed;

    const playerCenterX = playerTransform.position.x + playerTransform.width * 0.5;
    const playerCenterY = playerTransform.position.y + playerTransform.height * 0.5;
    const bossCenterX = transform.position.x + transform.width * 0.5;
    const bossCenterY = transform.position.y + transform.height * 0.5;
    const dx = playerCenterX - bossCenterX;
    const dy = playerCenterY - bossCenterY;
    const direction = dx >= 0 ? 1 : -1;

    transform.facing = direction;
    const chaseVx = direction * GAME_CONST.boss.speed;
    transform.velocity.x = chaseVx + health.knockbackVelocityX;

    const targetY =
      playerTransform.position.y +
      GAME_CONST.boss.chaseYOffset +
      Math.sin(ai.hoverTime) * GAME_CONST.boss.hoverAmplitude;
    const verticalError = targetY - transform.position.y;
    transform.velocity.y = Utils.clamp(verticalError * 3.2, -GAME_CONST.boss.speed, GAME_CONST.boss.speed);

    if (sprite) {
      sprite.assetKey = direction >= 0 ? "boss-facing-east" : "boss-facing-west";
      sprite.color = health.knockbackTimer > 0 ? "#ffffff" : GAME_CONST.boss.color;
    }

    ai.shootTimer -= deltaTime;
    ai.burstCooldown -= deltaTime;
    const distance = Math.hypot(dx, dy);

    const BURST_SIZE = 3;
    const BURST_INTERVAL = 0.12;

    if (deps.gameState === "playing" && distance <= GAME_CONST.boss.shootRange) {
      if (ai.shootTimer <= 0 && ai.burstCount === 0) {
        ai.burstCount = BURST_SIZE;
        ai.burstCooldown = 0;
        ai.shootTimer = GAME_CONST.boss.shootCooldown;
      }

      if (ai.burstCount > 0 && ai.burstCooldown <= 0) {
        deps.projectiles.spawn(
          { x: bossCenterX, y: bossCenterY },
          { x: dx, y: dy },
          GAME_CONST.boss.projectileSpeed,
          GAME_CONST.boss.damage,
          "enemy",
          GAME_CONST.boss.projectileColor,
          GAME_CONST.boss.projectileKnockback * Math.sign(dx || 1)
        );

        const audioService = serviceLocator.get("audio");
        if (audioService) {
          audioService.playSfx("sfx-laser-gun");
        }

        ai.burstCount -= 1;
        ai.burstCooldown = BURST_INTERVAL;
      }
    }
  }
}

class FinalBossManager {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.boss = null;
  }

  reset() {
    if (this.boss) {
      this.boss.entity.markedForRemoval = true;
      this.boss = null;
    }
  }

  spawn(x, y) {
    this.reset();
    this.boss = new FinalBoss(this.entityManager, x, y);
    return this.boss;
  }

  update(deltaTime, deps) {
    if (!this.boss) return;
    if (this.boss.entity.markedForRemoval) {
      this.boss = null;
      return;
    }
    this.boss.update(deltaTime, deps);
  }

  getEntity() {
    return this.boss?.entity || null;
  }

  getHealthRatio() {
    if (!this.boss || this.boss.entity.markedForRemoval) return 0;
    const health = this.boss.health;
    if (!health || health.maxHealth <= 0) return 0;
    return Utils.clamp(health.health / health.maxHealth, 0, 1);
  }

  isAlive() {
    if (!this.boss || this.boss.entity.markedForRemoval) return false;
    return this.boss.health.health > 0;
  }
}

export { FinalBoss, FinalBossManager };
