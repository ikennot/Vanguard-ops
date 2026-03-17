class Enemy {
  constructor(x, y, type = "ghost") {
    this.position = { x, y };
    this.velocity = { x: -70, y: 0 };
    this.width = 50;
    this.height = 70;
    this.type = type;
    this.health = 100;
  }

  update(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
  }
}

class EnemyManager {
  constructor() {
    this.enemies = [];
  }

  spawn(x, y, type) {
    this.enemies.push(new Enemy(x, y, type));
  }

  update(deltaTime) {
    this.enemies.forEach((enemy) => enemy.update(deltaTime));
  }
}

window.EnemyManager = EnemyManager;
