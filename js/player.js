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
    const existingLives = existing ? existing.getComponent("health").lives : this.maxLives;

    if (existing) existing.markedForRemoval = true;

    // Prefixes: player, player2, player3, player4
    const prefix = this.selectedCharacter === 1 ? "player" : `player${this.selectedCharacter}`;
    const initialAsset = `${prefix}-running-left`;
    
    // Character 1 has different dimensions, others are same as character 2
    const isLargeChar = this.selectedCharacter >= 2;
    const frameSize = isLargeChar ? 224 : 48;
    const scale = isLargeChar ? 0.535 : 2.5;
    const offsetY = isLargeChar ? 30 : GAME_CONST.entity.player.spriteOffsetY;

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
          offsetY: offsetY
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
    const cameraService = deps.camera || serviceLocator.get("camera");
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

    // Movement updates facing
    if (health.controlLockTimer <= 0) {
      if (inputService.isDown(GAME_CONST.controls.left)) {
          this.velocity.x = -speed;
          this.facing = -1;
      }
      if (inputService.isDown(GAME_CONST.controls.right)) {
          this.velocity.x = speed;
          this.facing = 1;
      }
    }

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
      if (this.onGround) {
        this.velocity.y = -10;
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

    const isAiming = inputService.isMouseDown(0);
    const hasAmmo = this.weapon.magAmmo[this.weapon.currentWeapon] > 0;
    
    // Aim updates facing
    if ((isAiming || this.shootRequested) && cameraService) {
        const originX = this.position.x + this.width * 0.5;
        const mouseWorldX = (inputService.mouse.x / cameraService.zoom) + cameraService.x;
        this.facing = (mouseWorldX > originX) ? 1 : -1;
    }

    if (this.shootRequested || isAiming) {
      this.tryShoot({
        ...deps,
        input: inputService,
        camera: cameraService,
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
      const isActuallyFiring = this.shootTimer > 0;
      const isAimingWithAmmo = isAiming && hasAmmo;
      const visuallyShooting = isActuallyFiring || isAimingWithAmmo;
      
      const isFlying = this.state === "jetpack";
      let nextAssetKey;
      const prefix = this.selectedCharacter === 1 ? "player" : `player${this.selectedCharacter}`;
      const facingSuffix = this.facing === -1 ? "left" : "right";
      const usesDirectionalSheets = this.selectedCharacter >= 2;
      const runFacingSuffix = this.selectedCharacter === 2
        ? (this.facing === -1 ? "right" : "left")
        : facingSuffix;

      if (visuallyShooting) {
        nextAssetKey = usesDirectionalSheets
          ? `${prefix}-shooting-${facingSuffix}`
          : `${prefix}-shooting-left`;
      } else if (isFlying || this.state === "jumping" || this.state === "falling") {
        nextAssetKey = this.selectedCharacter === 1
          ? `player-flying-${facingSuffix}`
          : `${prefix}-running-${runFacingSuffix}`;
      } else {
        nextAssetKey = usesDirectionalSheets
          ? `${prefix}-running-${runFacingSuffix}`
          : `${prefix}-running-left`;
      }

      if (sprite.assetKey !== nextAssetKey) {
        sprite.assetKey = nextAssetKey;
        sprite.currentFrame = 0;
        sprite.animationTimer = 0;
      }

      sprite.noFlip = true;
      if (usesDirectionalSheets) {
        sprite.flipX = false;
      } else if (visuallyShooting) {
        sprite.flipX = this.facing === 1;
      } else {
        sprite.flipX = this.facing === -1;
      }

      const isLargeChar = this.selectedCharacter >= 2;
      sprite.type = "sprite";
      sprite.frameY = 0;
      sprite.frameWidth = isLargeChar ? 224 : 48;
      sprite.frameHeight = isLargeChar ? 224 : 48;
      sprite.scale = isLargeChar ? 0.535 : 2.5;
      sprite.offsetY = isLargeChar ? 30 : GAME_CONST.entity.player.spriteOffsetY;
      sprite.frameSequence = null;

      if (visuallyShooting) {
        if (isActuallyFiring) {
            if (this.selectedCharacter === 1) {
                sprite.frameX = 3; 
                sprite.numFrames = 2;
                sprite.animationSpeed = 0.06;
            } else if (this.selectedCharacter === 2) {
                sprite.frameX = this.facing === -1 ? 1 : 4;
                sprite.numFrames = 1;
                sprite.currentFrame = 0;
                sprite.animationSpeed = 0.06;
            } else if (this.selectedCharacter === 3) {
                // Ghost shooting frames: 5th frame (index 4) for right, 1st frame (index 0) for left
                sprite.frameX = this.facing === -1 ? 0 : 4;
                sprite.numFrames = 1;
                sprite.currentFrame = 0;
                sprite.animationSpeed = 0.08;
            } else if (this.selectedCharacter === 4) {
                if (this.state === "running") {
                    sprite.frameX = this.facing === -1 ? 3 : 2;
                } else {
                    sprite.frameX = 2;
                }
                sprite.numFrames = 1;
                sprite.currentFrame = 0;
                sprite.animationSpeed = 0.08;
            } else {
                if (this.state === "running") {
                    sprite.frameX = this.facing === -1 ? 3 : 0;
                    sprite.numFrames = 2;
                } else {
                    sprite.frameX = this.facing === -1 ? 0 : 2;
                    sprite.numFrames = 3;
                }
                sprite.animationSpeed = 0.08;
            }
            sprite.loop = true;
        } else {
            if (this.selectedCharacter === 1) {
                sprite.frameX = 2;
            } else if (this.selectedCharacter === 2) {
                sprite.frameX = this.facing === -1 ? 1 : 4;
            } else {
                sprite.frameX = 0;
            }
            sprite.numFrames = 1;
            sprite.animationSpeed = 0.1;
            sprite.loop = false;
        }
      } else if (isFlying || this.state === "jumping" || this.state === "falling") {
        sprite.frameX = 0;
        // Sentinel (Char 2), Ghost (Char 3), and Titan (Char 4) use a static frame for air states
        if (this.selectedCharacter >= 2) {
          sprite.numFrames = 1;
        } else {
          sprite.numFrames = 2; // Vanguard (Char 1) uses 2 frames for air
        }
        sprite.animationSpeed = 0.12;
        sprite.loop = true;
      } else if (this.state === "running") {
        sprite.frameX = 0;
        sprite.numFrames = 3; // Fluid 3-frame run cycle
        sprite.animationSpeed = 0.1;
        sprite.loop = true;
      } else {
        sprite.frameX = 0;
        sprite.numFrames = 1;
        sprite.animationSpeed = 0.12;
        sprite.loop = true;
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
    
    let direction = { x: deltaX, y: deltaY };
    const shootFacing = (deltaX > 0) ? 1 : -1;

    projectileManager.spawn(
      { x: this.position.x + this.width * 0.5 + shootFacing * 12, y: this.position.y + this.height * 0.45 },
      direction,
      GAME_CONST.projectile.playerSpeed,
      34,
      "player",
      GAME_CONST.entity.projectile.player.color,
      GAME_CONST.projectile.knockback * shootFacing
    );
    this.weapon.consumeAmmo(1);
    this.shootTimer = GAME_CONST.player.shootCooldown;
    
    if (audioService) {
      audioService.playSfx("sfx-laser-gun");
    }
    
    if (audioService?.particlesEnabled && particleSystem) {
      particleSystem.spawn(
        { x: this.position.x + this.width * 0.5 + shootFacing * 14, y: this.position.y + 26 },
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
