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
    this.weapon = new WeaponSystem();
    this.entity = null;
    this.jumpRequested = false;
    this.shootRequested = false;
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

  createOrResetEntity(spawnPoint) {
    const existing = this.entity;
    if (existing) existing.markedForRemoval = true;

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
          width: 44,
          height: 64,
          gravity: GAME_CONST.player.gravity,
          facing: 1
        })
      )
      .addComponent(
        "health",
        createHealth({
          lives: GAME_CONST.player.maxLives,
          maxLives: GAME_CONST.player.maxLives,
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
          spawnPoint: { ...spawnPoint }
        }
      )
      .addComponent(
        "sprite",
        createSprite({
          type: "sprite",
          assetKey: "player-soldier",
          frameWidth: 64,
          frameHeight: 64,
          numFrames: 1,
          animationSpeed: 0.1,
          scale: 1.2,
          color: "#6fc18d"
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

  resetForSession(spawnPoint) {
    this.weapon.reset();
    this.createOrResetEntity(spawnPoint);
  }

  respawn() {
    this.jetpackFuel = Math.max(55, this.jetpackFuel);
    this.setSpawn(this.playerState.spawnPoint);
    this.invulnTimer = 0.75;
  }

  update(input, deltaTime, deps = {}) {
    const inputService = input || deps.input || serviceLocator.get("input");
    const audioService = deps.audio || serviceLocator.get("audio");
    const particleSystem = deps.particles || serviceLocator.get("particles");
    const wasGrounded = this.onGround;
    const speed = GAME_CONST.player.speed;
    const health = this.health;

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

    let jetpackActive = false;
    if (inputService.isDown(GAME_CONST.controls.jetpack) && this.jetpackFuel > 0) {
      this.velocity.y -= GAME_CONST.player.jetpackForce * deltaTime;
      this.jetpackFuel = Math.max(0, this.jetpackFuel - GAME_CONST.player.jetpackDrain * deltaTime);
      jetpackActive = true;

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

    if (this.shootRequested) {
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
    sprite.assetKey = "player-soldier";
    sprite.numFrames = 1;
    sprite.color = this.invulnTimer > 0 ? "rgba(153, 223, 232, 0.5)" : "transparent";
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
    const mouseWorldX = inputService.mouse.x + cameraService.x;
    const mouseWorldY = inputService.mouse.y + cameraService.y;
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
      "#ffd36f",
      GAME_CONST.projectile.knockback * this.facing
    );
    this.weapon.consumeAmmo(1);
    this.shootTimer = GAME_CONST.player.shootCooldown;
    if (audioService?.particlesEnabled && particleSystem) {
      particleSystem.spawn(
        { x: this.position.x + this.width * 0.5 + this.facing * 14, y: this.position.y + 26 },
        "#ffb458",
        10
      );
    }
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    if (this.lives <= 0) {
      eventBus.emit("player:died", { lives: this.lives });
      return;
    }
    this.respawn();
  }
}

export default Player;
