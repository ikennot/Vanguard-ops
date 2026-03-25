import { GAME_CONST } from "./constants.js";
import { Utils } from "./utils.js";
import { createTransform } from "./components/Transform.js";
import { createHealth } from "./components/Health.js";
import { createSprite } from "./components/Sprite.js";
import { createHitbox } from "./components/Hitbox.js";
import eventBus from "./core/EventBus.js";
import serviceLocator from "./core/ServiceLocator.js";

function getEnemyAssetKeys(mapId) {
  if (mapId === "jungle") {
    return {
      left: "enemy-l2-left",
      right: "enemy-l2-right",
      leftShooting: "enemy-l2-left-shooting",
      rightShooting: "enemy-l2-right-shooting"
    };
  }
  if (mapId === "canyon") {
    return {
      left: "enemy-l3-left",
      right: "enemy-l3-right",
      leftShooting: "enemy-l3-left-shooting",
      rightShooting: "enemy-l3-right-shooting"
    };
  }
  return {
    left: "enemy-left",
    right: "enemy-right",
    leftShooting: "enemy-left-shooting",
    rightShooting: "enemy-right-shooting"
  };
}

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
          width: GAME_CONST.entity.enemy.width,
          height: GAME_CONST.entity.enemy.height,
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
          killCounted: false,
          wasHitByPlayer: false
        })
      )
      .addComponent(
        "enemyAi",
        {
          direction: -1,
          patrolMinX: x - patrolWidth * 0.5,
          patrolMaxX: x + patrolWidth * 0.5,
          shootTimer: Utils.randomRange(0.2, GAME_CONST.enemy.shootCooldown),
          shootingTimer: 0,
          type,
          jumpTimer: Utils.randomRange(
            GAME_CONST.enemy.jumpCooldownMin,
            GAME_CONST.enemy.jumpCooldownMax
          ),
          isJumping: false,
          hoverTimer: Math.random() * Math.PI * 2,
          dropDownTimer: Utils.randomRange(2.0, 5.0),
          jetpackFuel: 100,
          maxJetpackFuel: 100
        }
      )
      .addComponent(
        "sprite",
        createSprite({
          type: "sprite",
          assetKey: "enemy-left",
          frameWidth: 48,
          frameHeight: 48,
          numFrames: 1,
          animationSpeed: 0.1,
          scale: 2.5,
          noFlip: true,
          color: GAME_CONST.entity.enemy.color,
          offsetY: 24,
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
    const difficultyScale = deps.difficultyScale;
    const threatScale = Math.max(0, difficultyScale - 1);
    const transform = this.transform;
    const ai = this.ai;
    const health = this.health;
    const sprite = this.entity.getComponent("sprite");

    const speedScale = 1 + threatScale * GAME_CONST.enemy.threatSpeedScale;
    const baseMoveX = ai.direction * GAME_CONST.enemy.speed * speedScale;
    transform.facing = ai.direction;
    transform.velocity.x = baseMoveX + health.knockbackVelocityX;
    health.knockbackVelocityX *= 0.92;
    if (Math.abs(health.knockbackVelocityX) < 8) health.knockbackVelocityX = 0;

    const canJump = deps.currentMapId === "jungle";
    const canFly = deps.currentMapId === "canyon";
    const player = deps.player;
    
    if (canFly && player) {
      // Restore gravity to match player's physics feel
      transform.gravity = GAME_CONST.enemy.gravity;

      const targetY = player.position.y - 120;
      const jetpackForce = 2400; // Strong force to overcome gravity and ascend

      let isUsingJetpack = false;
      // If below target height AND has fuel, "activate jetpack"
      if (transform.position.y > targetY && ai.jetpackFuel > 0) {
        transform.velocity.y -= jetpackForce * deltaTime;
        ai.jetpackFuel = Math.max(0, ai.jetpackFuel - GAME_CONST.player.jetpackDrain * deltaTime);
        isUsingJetpack = true;

        // Match player's jetpack particles (blue)
        const particleSystem = deps.particles || serviceLocator.get("particles");
        if (particleSystem && Math.random() < 0.4) {
          particleSystem.spawn(
            { x: transform.position.x + transform.width * 0.5, y: transform.position.y + transform.height * 0.8 },
            "#67c7ff",
            1
          );
        }
      }

      // Fuel regeneration when on ground or not using jetpack
      if (transform.onGround) {
        ai.jetpackFuel = Math.min(ai.maxJetpackFuel, ai.jetpackFuel + GAME_CONST.player.jetpackRegen * deltaTime);
      }

      // Flight visual state
      if (isUsingJetpack || !transform.onGround) {
        ai.isJumping = true;
      }

      // In flight, enemies don't "stick" to platforms as easily unless they are landing
      if (isUsingJetpack) {
        transform.onGround = false;
      }
    } else {
      transform.gravity = GAME_CONST.enemy.gravity;
      
      if (canJump) {
        // Drop down logic for jungle map
        if (transform.onGround) {
          ai.dropDownTimer -= deltaTime;
          const isPlayerBelow = player && player.position.y > transform.position.y + 100;
          
          if (isPlayerBelow && ai.dropDownTimer <= 0) {
            transform.oneWayPlatformIgnoreTimer = GAME_CONST.player.dropThroughDuration;
            transform.velocity.y = GAME_CONST.player.dropDownVelocity;
            transform.onGround = false;
            ai.dropDownTimer = Utils.randomRange(3.0, 6.0);
          }
        } else {
          // If we just landed on a new platform, update patrol bounds
          if (transform.velocity.y === 0 && !ai.isJumping) {
            const currentPlatform = deps.platforms.find(p => 
              transform.position.x + transform.width > p.x && 
              transform.position.x < p.x + p.width &&
              Math.abs((transform.position.y + transform.height) - p.y) < 5
            );
            if (currentPlatform) {
              const patrolWidth = Math.max(120, currentPlatform.width - 20);
              ai.patrolMinX = currentPlatform.x + 10;
              ai.patrolMaxX = currentPlatform.x + currentPlatform.width - 10;
            }
          }
        }

        ai.jumpTimer -= deltaTime * (1 + threatScale * GAME_CONST.enemy.threatJumpCadenceScale);
        if (ai.jumpTimer <= 0 && transform.onGround) {
          const jumpForceScale = 1 + threatScale * GAME_CONST.enemy.threatJumpForceScale;
          const jungleJumpMultiplier = 1.5;
          transform.velocity.y = GAME_CONST.enemy.jumpForce * jumpForceScale * jungleJumpMultiplier;
          transform.onGround = false;
          ai.isJumping = true;
          const jumpCadenceScale = 1 + threatScale * GAME_CONST.enemy.threatJumpCadenceScale;
          ai.jumpTimer = Utils.randomRange(
            GAME_CONST.enemy.jumpCooldownMin,
            GAME_CONST.enemy.jumpCooldownMax
          ) / jumpCadenceScale;
        }
      } else {
        ai.isJumping = false;
      }
    }
    if (transform.onGround) {
      ai.isJumping = false;
    }

    if (transform.position.x < ai.patrolMinX) ai.direction = 1;
    if (transform.position.x + transform.width > ai.patrolMaxX) ai.direction = -1;

    if (sprite) {
      const isShooting = ai.shootingTimer > 0;
      const isJumping = ai.isJumping;
      const facingLeft = ai.direction === -1;
      const keys = getEnemyAssetKeys(deps.currentMapId);

      const nextAssetKey = isShooting
        ? (facingLeft ? keys.leftShooting : keys.rightShooting)
        : (facingLeft ? keys.left : keys.right);

      if (sprite.assetKey !== nextAssetKey) {
        sprite.assetKey = nextAssetKey;
        sprite.currentFrame = 0;
        sprite.animationTimer = 0;
      }

      sprite.type = "sprite";
      sprite.noFlip = true;
      sprite.frameY = 0;
      sprite.color = GAME_CONST.entity.enemy.color;

      if (isShooting) {
        sprite.frameX = 0;
        sprite.numFrames = 4;
        sprite.animationSpeed = 0.08;
      } else if (isJumping) {
        sprite.frameX = 1;
        sprite.numFrames = 2;
        sprite.animationSpeed = 0.12;
      } else {
        sprite.frameX = 0;
        sprite.numFrames = 4;
        sprite.animationSpeed = 0.12;
      }

      sprite.currentFrame %= sprite.numFrames;
    }

    ai.shootTimer -= deltaTime;
    ai.shootingTimer = Math.max(0, ai.shootingTimer - deltaTime);
    const playerTransform = deps.player.entity.getComponent("transform");
    const centerX = transform.position.x + transform.width * 0.5;
    const centerY = transform.position.y + transform.height * 0.45;
    const dx = playerTransform.position.x - transform.position.x;
    const dy = playerTransform.position.y - transform.position.y;
    const distance = Math.hypot(dx, dy);

    if (
      health.knockbackTimer <= 0 &&
      distance < GAME_CONST.enemy.shootRange + GAME_CONST.enemy.threatRangeBonusPerScale * threatScale &&
      ai.shootTimer <= 0
    ) {
      deps.projectiles.spawn(
        { x: centerX, y: centerY },
        { x: dx, y: dy * 0.3 },
        GAME_CONST.projectile.enemySpeed * (0.95 + difficultyScale * GAME_CONST.enemy.threatProjectileSpeedScale),
        GAME_CONST.enemy.damage + Math.floor(threatScale * GAME_CONST.enemy.threatDamageBonusPerScale),
        "enemy",
        GAME_CONST.entity.projectile.enemy.color,
        650 * (deps.knockbackMultiplier || 1) * Math.sign(dx || 1)
      );

      const audioService = serviceLocator.get("audio");
      if (audioService) {
        audioService.playSfx("sfx-laser-gun");
      }

      const shootCadenceScale = 1 + threatScale * GAME_CONST.enemy.threatShootCadenceScale;
      const baseCooldown = GAME_CONST.enemy.shootCooldown / shootCadenceScale;
      ai.shootTimer = Math.max(0.16, baseCooldown + Utils.randomRange(-0.08, 0.12));
      ai.shootingTimer = 0.25;
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
    this.kills = 0;
    this.killTarget = 15;
    eventBus.on("game:scoreChanged", ({ kills, target }) => {
      this.kills = kills;
      this.killTarget = target;
    });
  }

  reset(platforms, mapId = "space") {
    for (const enemy of this.enemies) {
      enemy.entity.markedForRemoval = true;
    }
    this.enemies = [];
    this.spawnTimer = 0;
    this.totalSpawned = 0;
    if (mapId === "laboratory") return;
    for (let i = 0; i < 3; i += 1) this.spawnFromPlatforms(platforms);
  }

  spawnFromPlatforms(platforms) {
    if (!platforms.length) return;
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const x = platform.x + platform.width * (0.2 + Math.random() * 0.6);
    const y = platform.y - GAME_CONST.entity.enemy.height;
    const patrolWidth = Math.max(120, platform.width - 20);
    this.enemies.push(new Enemy(this.entityManager, x, y, patrolWidth));
    this.totalSpawned += 1;
  }

  update(deltaTime, deps) {
    this.spawnTimer -= deltaTime;
    const difficultyScale = deps.difficultyScale || 1.0;
    const difficultyStep = Math.max(0, Math.floor((difficultyScale - 1) / 0.15));
    const dynamicMaxActive = this.maxActive +
      difficultyStep * GAME_CONST.enemy.threatExtraActivePerStep;

    for (const enemy of this.enemies) {
      if (enemy.entity.markedForRemoval) continue;
      enemy.update(deltaTime, {
        ...deps,
        difficultyScale
      });
    }

    this.enemies = this.enemies.filter((enemy) => !enemy.entity.markedForRemoval);

    if (
      deps.gameState === "playing" &&
      deps.currentMapId !== "laboratory" &&
      this.enemies.length < dynamicMaxActive &&
      this.kills < this.killTarget &&
      this.spawnTimer <= 0
    ) {
      this.spawnFromPlatforms(deps.platforms);
      const spawnCadenceScale = Math.max(
        GAME_CONST.enemy.minSpawnCadenceScale,
        1 - difficultyStep * GAME_CONST.enemy.threatSpawnCadencePerStep
      );
      this.spawnTimer = Utils.randomRange(1.6, 2.8) * spawnCadenceScale;
    }
  }
}

export { Enemy, EnemyManager };
