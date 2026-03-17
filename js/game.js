class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new InputHandler();
    this.audio = new AudioManager();
    this.camera = new Camera(canvas.width, canvas.height);
    this.platforms = new PlatformManager();
    this.player = new Player();
    this.enemies = new EnemyManager();
    this.projectiles = new ProjectileManager();
    this.pickups = new PickupManager();
    this.particles = new ParticleSystem();
    this.hud = new Hud();
    this.menu = new MenuController();
    this.state = "menu";
    this.kills = 0;

    this.bindUi();
  }

  bindUi() {
    document.getElementById("btn-start").addEventListener("click", () => {
      this.state = "playing";
      this.menu.hideAll();
    });
    document.getElementById("btn-settings").addEventListener("click", () => {
      this.menu.main.classList.add("hidden");
      this.menu.settings.classList.remove("hidden");
    });
    document.getElementById("btn-settings-close").addEventListener("click", () => {
      this.menu.showMain();
    });
  }

  update(deltaTime) {
    if (this.state !== "playing") return;
    this.player.update(this.input, deltaTime);
    Collision.resolveWorldBounds(this.player, 1800, this.canvas.height);
    this.enemies.update(deltaTime);
    this.projectiles.update(deltaTime);
    this.particles.update(deltaTime);
    this.camera.follow(this.player);
  }

  drawBackground() {
    this.ctx.fillStyle = "#142230";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPlayer() {
    const { x, y } = this.player.position;
    this.ctx.fillStyle = "#6ab0d8";
    this.ctx.fillRect(x - this.camera.x, y - this.camera.y, this.player.width, this.player.height);
  }

  render() {
    this.drawBackground();
    if (this.state === "playing") {
      this.drawPlayer();
      this.hud.draw(this.ctx, this);
    }
  }
}

window.Game = Game;
