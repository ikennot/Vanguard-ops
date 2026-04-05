import { GAME_CONST } from "./constants.js";
import WeaponSystem from "./weapon.js";
import { createTransform } from "./components/Transform.js";
import { createHealth } from "./components/Health.js";
import { createSprite } from "./components/Sprite.js";
import { createHitbox } from "./components/Hitbox.js";
import serviceLocator from "./core/ServiceLocator.js";
import eventBus from "./core/EventBus.js";
import gameState from "./core/GameState.js";

class Player {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.maxJetpackFuel = 100;
    this.maxLives = GAME_CONST.player.maxLives;
    this.weapon = new WeaponSystem();
    this.entity = null;
    this.jumpRequested = false;
    this.shootRequested = false;
    this.lastJetpackSfxAt = 0;
    this.respawnTimer = 0;
    this.selectedCharacter = 1;
    eventBus.on("input:jump", () => {
      if (gameState.get() !== "playing") return;
      this.jumpRequested = true;
    });
    eventBus.on("input:shoot", () => {
      if (gameState.get() !== "playing") return;
      this.shootRequested = true;
    });
    eventBus.on("player:fallout", () => {
      this.loseLife();
    });
    eventBus.on("game:state-changed", (nextState) => {
      if (nextState !== "playing") {
        this.jumpRequested = false;
        this.shootRequested = false;
      }
    });
    this.resetForSession({ x: 150, y: 400 });
  }

  createOrResetEntity(spawnPoint, preserveLives = false) {
    const game = serviceLocator.get("game");
    if (game) {
      this.selectedCharacter = game.selectedCharacter || 1;
    }

    const existing = this.entity;
    // We want to pass existing lives down into the new health component when doing a session reset (map transitions)
    const existingLives = existing ? existing.getComponent("health").lives : this.maxLives;

    if (existing) existing.markedForRemoval = true;

    const initialAsset = this.selectedCharacter === 1 ? "player-running-right" : "player2-running-right";
    const frameSize = this.selectedCharacter === 1 ? 48 : 224;
    const scale = this.selectedCharacter === 1 ? 3 : 0.65;

    this.entity = this.entityManager.createEntity();
    this.entity
      .addTag("player")
      .addTag("render")
      .addTag("physics")
      .addTag("platform-collide")
      .addTag("world-bounds")
      .addComponent(
        "transform",
        createTransform({
          x: spawnPoint.x,
          y: spawnPoint.y,
          width: GAME_CONST.entity.player.width,
          height: GAME_CONST.entity.player.height,
          gravity: GAME_CONST.player.gravity,
          facing: 1
        })
      )
      .addComponent(
        "health",
        createHealth({
          lives: preserveLives ? existingLives : this.maxLives,
          maxLives: this.maxLives,
          invulnTimer: 0,
          controlLockTimer: 0,
          knockbackVelocityX: 0
        })
      )
      .addComponent(
        "playerState",
        {
          state: "idle",
          shootTimer: 0,
          jetpackFuel: this.maxJetpackFuel,
          maxJetpackFuel: this.maxJetpackFuel,
          spawnPoint: { ...spawnPoint }
        }
      )
      .addComponent(
        "sprite",
        createSprite({
          type: "sprite",
          assetKey: initialAsset,
          frameWidth: frameSize,
          frameHeight: frameSize,
          numFrames: 5,
          animationSpeed: 0.1,
          scale: scale,
          noFlip: true,
          color: GAME_CONST.entity.player.color,
          offsetY: this.selectedCharacter === 1 ? GAME_CONST.entity.player.spriteOffsetY : -30
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

  get playerState() {
    return this.entity.getComponent("playerState");
  }

  get position() {
    return this.transform.position;
  }

  get velocity() {
    return this.transform.velocity;
  }

  get prevPosition() {
    return this.transform.prevPosition;
  }

  get width() {
    return this.transform.width;
  }

  get height() {
    return this.transform.height;
  }

  get onGround() {
    return this.transform.onGround;
  }

  set onGround(value) {
    this.transform.onGround = value;
  }

  get facing() {
    return this.transform.facing;
  }

  set facing(value) {
    this.transform.facing = value;
  }

  get state() {
    return this.playerState.state;
  }

  set state(value) {
    this.playerState.state = value;
  }

  get shootTimer() {
    return this.playerState.shootTimer;
  }

  set shootTimer(value) {
    this.playerState.shootTimer = value;
  }

  get jetpackFuel() {
    return this.playerState.jetpackFuel;
  }

  set jetpackFuel(value) {
    this.playerState.jetpackFuel = value;
  }

  get lives() {
    return this.health.lives;
  }

  set lives(value) {
    this.health.lives = value;
  }

  get invulnTimer() {
    return this.health.invulnTimer;
  }

  set invulnTimer(value) {
    this.health.invulnTimer = value;
  }

  setSpawn(spawnPoint) {
    const state = this.playerState;
    state.spawnPoint = { ...spawnPoint };
    this.position.x = spawnPoint.x;
    this.position.y = spawnPoint.y;
    this.prevPosition.x = spawnPoint.x;
    this.prevPosition.y = spawnPoint.y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.onGround = false;
  }

  resetForSession(spawnPoint, preserveLives = false) {
    this.weapon.reset();
    this.createOrResetEntity(spawnPoint, preserveLives);
  }

  respawn() {
    this.jetpackFuel = Math.max(55, this.jetpackFuel);
    this.setSpawn(this.playerState.spawnPoint);
    this.invulnTimer = GAME_CONST.player.invulnDuration || 2.5;
    this.health.respawnInvuln = true;
  }

  update(input, deltaTime, deps = {}) {
    const inputService = input || deps.input || serviceLocator.get("input");
    const audioService = deps.audio || serviceLocator.get("audio");
    const particleSystem = deps.particles || serviceLocator.get("particles");
    const wasGrounded = this.onGround;
    const speed = GAME_CONST.player.speed;
    const health = this.health;

    if (this.respawnTimer > 0) {
      this.respawnTimer -= deltaTime;
      if (this.respawnTimer <= 0) {
        this.respawn();
        const sprite = this.entity.getComponent("sprite");
        if (sprite) sprite.visible = true;
      }
      return;
    }

    if (!inputService) return;

    this.velocity.x = 0;

    if (health.controlLockTimer <= 0) {
      if (inputService.isDown(GAME_CONST.controls.left)) this.velocity.x = -speed;
      if (inputService.isDown(GAME_CONST.controls.right)) this.velocity.x = speed;
    }
    if (this.velocity.x !== 0) this.facing = this.velocity.x > 0 ? 1 : -1;

    if (wasGrounded && this.jumpRequested) {
      this.velocity.y = GAME_CONST.player.jumpForce;
    }
    this.jumpRequested = false;

    if (wasGrounded && inputService.wasPressed(GAME_CONST.controls.down)) {
      this.transform.oneWayPlatformIgnoreTimer = GAME_CONST.player.dropThroughDuration;
      this.velocity.y = Math.max(this.velocity.y, GAME_CONST.player.dropDownVelocity);
      this.onGround = false;
    }

    let jetpackActive = false;
    if (inputService.isDown(GAME_CONST.controls.jetpack) && this.jetpackFuel > 0) {
      // If we are on the ground, give a small nudge to break contact
      if (this.onGround) {
        this.velocity.y = -10; // Tiny upward nudge just to break ground contact
        this.onGround = false;
      }
      this.velocity.y -= GAME_CONST.player.jetpackForce * deltaTime;
      this.jetpackFuel = Math.max(0, this.jetpackFuel - GAME_CONST.player.jetpackDrain * deltaTime);
      jetpackActive = true;

      if (audioService) {
        const now = performance.now();
        if (now - this.lastJetpackSfxAt > 150) {
          audioService.playSfx("sfx-jet-pack");
          this.lastJetpackSfxAt = now;
        }
      }

      if (audioService?.particlesEnabled && particleSystem) {
        particleSystem.spawn(
          { x: this.position.x + this.width * 0.5, y: this.position.y + this.height },
          "#67c7ff",
          2
        );
      }
    } else if (wasGrounded) {
      this.jetpackFuel = Math.min(
        this.maxJetpackFuel,
        this.jetpackFuel + GAME_CONST.player.jetpackRegen * deltaTime
      );
    }

    this.onGround = false;

    this.velocity.x += health.knockbackVelocityX;
    health.knockbackVelocityX *= 0.9;
    if (Math.abs(health.knockbackVelocityX) < 8) health.knockbackVelocityX = 0;

    this.shootTimer = Math.max(0, this.shootTimer - deltaTime);
    this.weapon.update(deltaTime);

    if (this.shootRequested || inputService.isMouseDown(0)) {
      this.tryShoot({
        ...deps,
        input: inputService,
        audio: audioService,
        particles: particleSystem
      });
    }
    this.shootRequested = false;

    if (jetpackActive) this.state = "jetpack";
    else if (!wasGrounded && this.velocity.y < -50) this.state = "jumping";
    else if (!wasGrounded && this.velocity.y > 50) this.state = "falling";
    else if (this.velocity.x !== 0) this.state = "running";
    else this.state = "idle";

    const sprite = this.entity.getComponent("sprite");
    if (sprite) {
      const isShooting = this.shootTimer > 0;
      const facingLeft = this.facing === -1;
      const isFlying = this.state === "jetpack";
      const isMoving = ["running", "jumping", "falling"].includes(this.state);

      let nextAssetKey;
      const prefix = this.selectedCharacter === 1 ? "player" : "player2";
      
      if (isShooting) {
        nextAssetKey = facingLeft ? `${prefix}-shooting-left` : `${prefix}-shooting-right`;
      } else if (isFlying || this.state === "jumping" || this.state === "falling") {
        if (this.selectedCharacter === 1) {
          nextAssetKey = facingLeft ? "player-flying-left" : "player-flying-right";
        } else {
          // Player 2 fallback to running for flying/air states
          nextAssetKey = facingLeft ? "player2-running-left" : "player2-running-right";
        }
      } else {
        nextAssetKey = facingLeft ? `${prefix}-running-left` : `${prefix}-running-right`;
      }

      if (sprite.assetKey !== nextAssetKey) {
        sprite.assetKey = nextAssetKey;
        sprite.currentFrame = 0;
        sprite.animationTimer = 0;
      }

      sprite.type = "sprite";
      sprite.noFlip = true;
      sprite.frameY = 0;
      sprite.frameWidth = this.selectedCharacter === 1 ? 48 : 224;
      sprite.frameHeight = this.selectedCharacter === 1 ? 48 : 224;
      sprite.scale = this.selectedCharacter === 1 ? 2.5 : 0.55;
      sprite.offsetY = this.selectedCharacter === 1 ? GAME_CONST.entity.player.spriteOffsetY : -20;

      if (isShooting) {
        sprite.frameX = this.selectedCharacter === 1 ? 3 : 0;
        sprite.numFrames = this.selectedCharacter === 1 ? 2 : 5;
        sprite.animationSpeed = 0.08;
      } else if (isFlying || this.state === "jumping" || this.state === "falling") {
        sprite.frameX = 0;
        sprite.numFrames = 1;
        sprite.animationSpeed = 0.1;
      } else if (this.state === "running") {
        sprite.frameX = 0;
        sprite.numFrames = 5;
        sprite.animationSpeed = 0.1;
      } else {
        sprite.frameX = 0;
        sprite.numFrames = 1;
        sprite.animationSpeed = 0.12;
      }

      sprite.currentFrame %= sprite.numFrames;
      sprite.color =
        this.invulnTimer > 0
          ? GAME_CONST.entity.player.flashColor
          : GAME_CONST.entity.player.color;

      if (this.invulnTimer > 0 && this.health.respawnInvuln) {
        sprite.visible = Math.floor(this.invulnTimer * 15) % 2 === 0;
      } else {
        sprite.visible = true;
      }
    }
  }

  tryShoot(deps = {}) {
    const inputService = deps.input || serviceLocator.get("input");
    const cameraService = deps.camera || serviceLocator.get("camera");
    const projectileManager = deps.projectiles || serviceLocator.get("projectiles");
    const audioService = deps.audio || serviceLocator.get("audio");
    const particleSystem = deps.particles || serviceLocator.get("particles");

    if (this.shootTimer > 0) return;
    if (!this.weapon.canFire()) {
      this.weapon.startReload();
      return;
    }
    if (!inputService || !cameraService || !projectileManager) return;

    const originX = this.position.x + this.width * 0.5;
    const originY = this.position.y + this.height * 0.45;
    const mouseWorldX = (inputService.mouse.x / cameraService.zoom) + cameraService.x;
    const mouseWorldY = (inputService.mouse.y / cameraService.zoom) + cameraService.y;
    const deltaX = mouseWorldX - originX;
    const deltaY = mouseWorldY - originY;
    let direction = { x: this.facing, y: 0 };

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      direction = { x: deltaX, y: deltaY };
      if (deltaX !== 0) this.facing = deltaX > 0 ? 1 : -1;
    }

    projectileManager.spawn(
      { x: this.position.x + this.width * 0.5 + this.facing * 12, y: this.position.y + this.height * 0.45 },
      direction,
      GAME_CONST.projectile.playerSpeed,
      34,
      "player",
      GAME_CONST.entity.projectile.player.color,
      GAME_CONST.projectile.knockback * this.facing
    );
    this.weapon.consumeAmmo(1);
    this.shootTimer = GAME_CONST.player.shootCooldown;
    
    if (audioService) {
      audioService.playSfx("sfx-laser-gun");
    }
    
    if (audioService?.particlesEnabled && particleSystem) {
      particleSystem.spawn(
        { x: this.position.x + this.width * 0.5 + this.facing * 14, y: this.position.y + 26 },
        "#ffb458",
        10
      );
    }
  }

  loseLife() {
    if (this.respawnTimer > 0) return;

    this.lives = Math.max(0, this.lives - 1);
    this.weapon.reset();

    const audioService = serviceLocator.get("audio");
    if (audioService) {
      audioService.playSfx("sfx-respawn-fall");
    }

    if (this.lives <= 0) {
      eventBus.emit("player:died", { lives: this.lives });
      return;
    }
    
    this.respawnTimer = 1.0;
    const sprite = this.entity.getComponent("sprite");
    if (sprite) sprite.visible = false;
  }
}

export default Player;
