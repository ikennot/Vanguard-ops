class Player {
  constructor() {
    this.width = 44;
    this.height = 64;
    this.gravity = GAME_CONST.player.gravity;
    this.maxLives = GAME_CONST.player.maxLives;
    this.maxJetpackFuel = 100;
    this.weapon = new WeaponSystem();

    this.spawnPoint = { x: 150, y: 400 };
    this.position = { x: this.spawnPoint.x, y: this.spawnPoint.y };
    this.velocity = { x: 0, y: 0 };
    this.prevPosition = { x: this.position.x, y: this.position.y };
    this.lives = this.maxLives;
    this.onGround = false;
    this.jetpackFuel = this.maxJetpackFuel;
    this.facing = 1;
    this.state = "idle";
    this.shootTimer = 0;
    this.invulnTimer = 0;
    this.knockbackVelocityX = 0;
    this.controlLockTimer = 0;
  }

  setSpawn(spawnPoint) {
    this.spawnPoint = { ...spawnPoint };
    this.position.x = this.spawnPoint.x;
    this.position.y = this.spawnPoint.y;
    this.prevPosition.x = this.spawnPoint.x;
    this.prevPosition.y = this.spawnPoint.y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.onGround = false;
  }

  resetForSession(spawnPoint) {
    this.lives = this.maxLives;
    this.jetpackFuel = this.maxJetpackFuel;
    this.weapon.reset();
    this.setSpawn(spawnPoint);
  }

  respawn() {
    this.jetpackFuel = Math.max(55, this.jetpackFuel);
    this.setSpawn(this.spawnPoint);
    this.invulnTimer = 0.75;
  }

  update(input, deltaTime, game) {
    this.prevPosition.x = this.position.x;
    this.prevPosition.y = this.position.y;
    const wasGrounded = this.onGround;

    const speed = GAME_CONST.player.speed;
    this.velocity.x = 0;
    this.controlLockTimer = Math.max(0, this.controlLockTimer - deltaTime);

    if (this.controlLockTimer <= 0) {
      if (input.isDown(GAME_CONST.controls.left)) this.velocity.x = -speed;
      if (input.isDown(GAME_CONST.controls.right)) this.velocity.x = speed;
    }
    if (this.velocity.x !== 0) this.facing = this.velocity.x > 0 ? 1 : -1;

    if (wasGrounded && input.wasPressed(GAME_CONST.controls.up)) {
      this.velocity.y = GAME_CONST.player.jumpForce;
    }

    let jetpackActive = false;
    if (input.isDown(GAME_CONST.controls.jetpack) && this.jetpackFuel > 0) {
      this.velocity.y -= GAME_CONST.player.jetpackForce * deltaTime;
      this.jetpackFuel = Math.max(0, this.jetpackFuel - GAME_CONST.player.jetpackDrain * deltaTime);
      jetpackActive = true;

      if (game.audio.particlesEnabled) {
        game.particles.spawn({ x: this.position.x + this.width * 0.5, y: this.position.y + this.height }, "#67c7ff", 2);
      }
    } else if (wasGrounded) {
      this.jetpackFuel = Math.min(this.maxJetpackFuel, this.jetpackFuel + GAME_CONST.player.jetpackRegen * deltaTime);
    }

    this.onGround = false;

    this.velocity.x += this.knockbackVelocityX;
    this.knockbackVelocityX *= 0.9;
    if (Math.abs(this.knockbackVelocityX) < 8) this.knockbackVelocityX = 0;

    Physics.applyGravity(this, deltaTime);
    Physics.integrate(this, deltaTime);

    this.shootTimer = Math.max(0, this.shootTimer - deltaTime);
    this.invulnTimer = Math.max(0, this.invulnTimer - deltaTime);
    this.weapon.update(deltaTime);

    if (input.wasMousePressed(0)) this.tryShoot(game);

    if (jetpackActive) this.state = "jetpack";
    else if (!this.onGround && this.velocity.y < 0) this.state = "jumping";
    else if (!this.onGround && this.velocity.y >= 0) this.state = "falling";
    else if (this.velocity.x !== 0) this.state = "running";
    else this.state = "idle";
  }

  tryShoot(game) {
    if (this.shootTimer > 0) return;
    if (!this.weapon.canFire()) {
      this.weapon.startReload();
      return;
    }
    const originX = this.position.x + this.width * 0.5;
    const originY = this.position.y + this.height * 0.45;
    const mouseWorldX = game.input.mouse.x + game.camera.x;
    const mouseWorldY = game.input.mouse.y + game.camera.y;
    const deltaX = mouseWorldX - originX;
    const deltaY = mouseWorldY - originY;
    let direction = { x: this.facing, y: 0 };

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      direction = { x: deltaX, y: deltaY };
      if (deltaX !== 0) this.facing = deltaX > 0 ? 1 : -1;
    }

    game.projectiles.spawn(
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
    if (game.audio.particlesEnabled) {
      game.particles.spawn({ x: this.position.x + this.width * 0.5 + this.facing * 14, y: this.position.y + 26 }, "#ffb458", 10);
    }
  }

  takeDamage(amount, knockbackX, game) {
    if (this.invulnTimer > 0) return;
    this.knockbackVelocityX += knockbackX;
    this.velocity.y = -180;
    this.invulnTimer = 0.45;
    this.controlLockTimer = 0.2;

    if (game.audio.particlesEnabled) {
      game.particles.spawn({ x: this.position.x + this.width * 0.5, y: this.position.y + 20 }, "#ff7f7f", 10);
    }
  }

  loseLife(game) {
    this.lives = Math.max(0, this.lives - 1);
    if (this.lives <= 0) {
      game.triggerDefeat();
      return;
    }
    this.respawn();
  }

  draw(ctx, camera) {
    ctx.fillStyle = this.invulnTimer > 0 ? "#99dfe8" : "#6fc18d";
    ctx.fillRect(this.position.x - camera.x, this.position.y - camera.y, this.width, this.height);

    ctx.fillStyle = "#102631";
    if (this.facing > 0) ctx.fillRect(this.position.x + this.width - 10 - camera.x, this.position.y + 18 - camera.y, 14, 4);
    else ctx.fillRect(this.position.x - 4 - camera.x, this.position.y + 18 - camera.y, 14, 4);
  }
}

window.Player = Player;
