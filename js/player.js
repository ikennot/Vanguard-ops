class Player {
  constructor() {
    this.position = { x: 150, y: 400 };
    this.velocity = { x: 0, y: 0 };
    this.width = 54;
    this.height = 72;
    this.gravity = GAME_CONST.player.gravity;
    this.health = GAME_CONST.player.maxHealth;
    this.lives = GAME_CONST.player.maxLives;
    this.onGround = false;
    this.jetpackFuel = 100;
  }

  update(input, deltaTime) {
    const speed = GAME_CONST.player.speed;
    this.velocity.x = 0;

    if (input.isDown(GAME_CONST.controls.left)) this.velocity.x = -speed;
    if (input.isDown(GAME_CONST.controls.right)) this.velocity.x = speed;

    if (this.onGround && input.isDown(GAME_CONST.controls.up)) {
      this.velocity.y = GAME_CONST.player.jumpForce;
      this.onGround = false;
    }

    if (input.isDown(GAME_CONST.controls.jetpack) && this.jetpackFuel > 0) {
      this.velocity.y -= 850 * deltaTime;
      this.jetpackFuel = Math.max(0, this.jetpackFuel - 20 * deltaTime);
    }

    Physics.applyGravity(this, deltaTime);
    Physics.integrate(this, deltaTime);
  }
}

window.Player = Player;
