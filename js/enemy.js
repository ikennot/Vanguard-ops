import { GAME_CONST } from "./constants.js";
import { Utils } from "./utils.js";
import { createTransform } from "./components/Transform.js";
import { createHealth } from "./components/Health.js";
import { createSprite } from "./components/Sprite.js";
import { createHitbox } from "./components/Hitbox.js";

class Enemy {
  constructor(entityManager, x, y, patrolWidth = 180, type = "rival") {
    this.entityManager = entityManager;
    this.entity = entityManager.createEntity();
    this.entity
      .addTag("enemy")
      .addTag("render")
      .addTag("physics")
      .addTag("platform-collide")
      .addTag("world-bounds")
      .addComponent(
        "transform",
        createTransform({
          x,
          y,
          vx: -GAME_CONST.enemy.speed,
          width: 40,
          height: 60,
          gravity: GAME_CONST.enemy.gravity,
          facing: -1
        })
      )
      .addComponent(
        "health",
        createHealth({
          health: GAME_CONST.enemy.maxHealth,
          maxHealth: GAME_CONST.enemy.maxHealth,
          knockbackVelocityX: 0,
          knockbackTimer: 0,
          killCounted: false
        })
      )
      .addComponent(
        "enemyAi",
        {
          direction: -1,
          patrolMinX: x - patrolWidth * 0.5,
          patrolMaxX: x + patrolWidth * 0.5,
          shootTimer: Utils.randomRange(0.2, GAME_CONST.enemy.shootCooldown),
          type
        }
      )
      .addComponent(
        "sprite",
        createSprite({
          color: "#c97474",
          gunColor: "#280e0e",
          gunWidth: 10,
          gunHeight: 4,
          gunOffsetY: 16,
          gunInsetRight: 10,
          gunInsetLeft: 0
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
    return this.entity.getComponent("enemyAi");
  }

  get position() {
    return this.transform.position;
  }

  get width() {
    return this.transform.width;
  }

  update(deltaTime, deps) {
    const difficultyScale = deps.getDifficultyScale();
    const transform = this.transform;
    const ai = this.ai;
    const health = this.health;

    const baseMoveX = ai.direction * GAME_CONST.enemy.speed * difficultyScale;
    transform.facing = ai.direction;
    transform.velocity.x = baseMoveX + health.knockbackVelocityX;
    health.knockbackVelocityX *= 0.92;
    if (Math.abs(health.knockbackVelocityX) < 8) health.knockbackVelocityX = 0;

    if (transform.position.x < ai.patrolMinX) ai.direction = 1;
    if (transform.position.x + transform.width > ai.patrolMaxX) ai.direction = -1;

    ai.shootTimer -= deltaTime;
    const playerTransform = deps.player.entity.getComponent("transform");
    const centerX = transform.position.x + transform.width * 0.5;
    const centerY = transform.position.y + transform.height * 0.45;
    const dx = playerTransform.position.x - transform.position.x;
    const dy = playerTransform.position.y - transform.position.y;
    const distance = Math.hypot(dx, dy);

    if (
      health.knockbackTimer <= 0 &&
      distance < GAME_CONST.enemy.shootRange + 40 * (difficultyScale - 1) &&
      ai.shootTimer <= 0
    ) {
      deps.projectiles.spawn(
        { x: centerX, y: centerY },
        { x: dx, y: dy * 0.3 },
        GAME_CONST.projectile.enemySpeed * (0.95 + difficultyScale * 0.08),
        GAME_CONST.enemy.damage + Math.floor((difficultyScale - 1) * 5),
        "enemy",
        "#ff8f6c",
        260 * Math.sign(dx || 1)
      );
      ai.shootTimer =
        GAME_CONST.enemy.shootCooldown / difficultyScale + Utils.randomRange(-0.15, 0.25);
    }
  }
}

class EnemyManager {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.enemies = [];
    this.spawnTimer = 0;
    this.maxActive = 4;
    this.totalSpawned = 0;
  }

  reset(platforms) {
    for (const enemy of this.enemies) {
      enemy.entity.markedForRemoval = true;
    }
    this.enemies = [];
    this.spawnTimer = 0;
    this.totalSpawned = 0;
    for (let i = 0; i < 3; i += 1) this.spawnFromPlatforms(platforms);
  }

  spawnFromPlatforms(platforms) {
    if (this.totalSpawned >= GAME_CONST.objective.targetKills) return;
    if (!platforms.length) return;
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const x = platform.x + platform.width * (0.2 + Math.random() * 0.6);
    const y = platform.y - 60;
    const patrolWidth = Math.max(120, platform.width - 20);
    this.enemies.push(new Enemy(this.entityManager, x, y, patrolWidth));
    this.totalSpawned += 1;
  }

  update(deltaTime, deps) {
    this.spawnTimer -= deltaTime;

    for (const enemy of this.enemies) {
      if (enemy.entity.markedForRemoval) continue;
      enemy.update(deltaTime, deps);
    }

    this.enemies = this.enemies.filter((enemy) => !enemy.entity.markedForRemoval);

    if (
      deps.gameState === "playing" &&
      this.enemies.length < this.maxActive &&
      this.totalSpawned < GAME_CONST.objective.targetKills &&
      this.spawnTimer <= 0
    ) {
      this.spawnFromPlatforms(deps.platforms);
      this.spawnTimer = Utils.randomRange(1.6, 2.8);
    }
  }
}

export { Enemy, EnemyManager };
