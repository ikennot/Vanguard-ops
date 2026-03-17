class Enemy {
  constructor(x, y, patrolWidth = 180, type = "rival") {
    this.position = { x, y };
    this.prevPosition = { x, y };
    this.velocity = { x: -GAME_CONST.enemy.speed, y: 0 };
    this.width = 40;
    this.height = 60;
    this.type = type;
    this.health = GAME_CONST.enemy.maxHealth;
    this.gravity = GAME_CONST.enemy.gravity;
    this.onGround = false;
    this.direction = -1;
    this.patrolMinX = x - patrolWidth * 0.5;
    this.patrolMaxX = x + patrolWidth * 0.5;
    this.shootTimer = Utils.randomRange(0.2, GAME_CONST.enemy.shootCooldown);
    this.markedForRemoval = false;
    this.knockbackTimer = 0;
    this.knockbackVelocityX = 0;
    this.killCounted = false;
  }

  update(deltaTime, game) {
    const difficultyScale = game.getDifficultyScale();
    this.prevPosition.x = this.position.x;
    this.prevPosition.y = this.position.y;
    this.onGround = false;

    const baseMoveX = this.direction * GAME_CONST.enemy.speed * difficultyScale;
    this.knockbackTimer -= deltaTime;
    this.knockbackVelocityX *= 0.92;
    if (Math.abs(this.knockbackVelocityX) < 8) this.knockbackVelocityX = 0;
    this.velocity.x = baseMoveX + this.knockbackVelocityX;

    if (this.position.x < this.patrolMinX) this.direction = 1;
    if (this.position.x + this.width > this.patrolMaxX) this.direction = -1;

    this.shootTimer -= deltaTime;
    const player = game.player;
    const centerX = this.position.x + this.width * 0.5;
    const centerY = this.position.y + this.height * 0.45;
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distance = Math.hypot(dx, dy);

    if (this.knockbackTimer <= 0 && distance < GAME_CONST.enemy.shootRange + 40 * (difficultyScale - 1) && this.shootTimer <= 0) {
      game.projectiles.spawn(
        { x: centerX, y: centerY },
        { x: dx, y: dy * 0.3 },
        GAME_CONST.projectile.enemySpeed * (0.95 + difficultyScale * 0.08),
        GAME_CONST.enemy.damage + Math.floor((difficultyScale - 1) * 5),
        "enemy",
        "#ff8f6c",
        260 * Math.sign(dx || 1)
      );
      this.shootTimer = GAME_CONST.enemy.shootCooldown / difficultyScale + Utils.randomRange(-0.15, 0.25);
    }

    Physics.applyGravity(this, deltaTime);
    Physics.integrate(this, deltaTime);
  }

  takeDamage(amount, knockback, game) {
    this.health -= amount;
    const healthRatio = Math.max(0, this.health) / GAME_CONST.enemy.maxHealth;
    const multiplier = healthRatio > 0.35 ? 2.6 : 4.2;
    this.knockbackVelocityX += knockback * multiplier;
    this.velocity.y = -320;
    this.knockbackTimer = healthRatio > 0.35 ? 0.6 : 0.95;

    if (game.audio.particlesEnabled) {
      game.particles.spawn({ x: this.position.x + this.width * 0.5, y: this.position.y + 20 }, "#ff9c75", 10);
    }

    if (this.health <= 0) {
      this.health = Math.floor(GAME_CONST.enemy.maxHealth * 0.4);
    }
  }

  draw(ctx, camera) {
    ctx.fillStyle = "#c97474";
    ctx.fillRect(this.position.x - camera.x, this.position.y - camera.y, this.width, this.height);
    ctx.fillStyle = "#280e0e";
    if (this.direction > 0) ctx.fillRect(this.position.x + this.width - 10 - camera.x, this.position.y + 16 - camera.y, 10, 4);
    else ctx.fillRect(this.position.x - camera.x, this.position.y + 16 - camera.y, 10, 4);
  }
}

class EnemyManager {
  constructor() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.maxActive = 4;
    this.totalSpawned = 0;
  }

  reset(platforms) {
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
    this.enemies.push(new Enemy(x, y, patrolWidth));
    this.totalSpawned += 1;
  }

  update(deltaTime, game) {
    this.spawnTimer -= deltaTime;
    for (const enemy of this.enemies) {
      enemy.update(deltaTime, game);
      Collision.resolveWorldBounds(enemy, GAME_CONST.world.width);
      Collision.resolvePlatforms(enemy, game.platforms.platforms);
      if (enemy.position.y > GAME_CONST.world.killY) {
        if (!enemy.killCounted) {
          enemy.killCounted = true;
          game.registerKill();
        }
        enemy.markedForRemoval = true;
      }
    }

    this.enemies = this.enemies.filter((enemy) => !enemy.markedForRemoval);

    if (
      game.state === "playing" &&
      this.enemies.length < this.maxActive &&
      this.totalSpawned < GAME_CONST.objective.targetKills &&
      this.spawnTimer <= 0
    ) {
      this.spawnFromPlatforms(game.platforms.platforms);
      this.spawnTimer = Utils.randomRange(1.6, 2.8);
    }
  }

  draw(ctx, camera) {
    for (const enemy of this.enemies) enemy.draw(ctx, camera);
  }
}

window.EnemyManager = EnemyManager;
