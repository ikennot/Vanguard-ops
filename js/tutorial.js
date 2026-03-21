export class TutorialManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;

    this.player = {
      x: 200,
      y: 560, // Lowered starting pos
      width: 120,
      height: 120,
      vx: 0,
      vy: 0,
      onGround: false,
      fuel: 100,
      facing: 1
    };

    this.bullets = [];
    
    // Adjusted platforms to match the reference image layout
    this.platforms = [
      { x: 180, y: 615, width: 920, height: 40 }, // Bottom long platform
      { x: 350, y: 480, width: 580, height: 30 }  // Top middle platform
    ];

    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };

    this.soldierSprite = new Image();
    this.soldierSprite.onload = () => {
        this.spriteReady = true;
    };
    this.soldierSprite.src = "assets/sprites/player/soldier_breathing_idle.png";

    this.platformSprite = new Image();
    this.platformSprite.onload = () => {
        this.platformReady = true;
    };
    this.platformSprite.src = "assets/tutorial/tutorialplatform.png";
    
    this.frame = 0;
    this.frameTimer = 0;
    this.frameDuration = 0.12;

    this.bindEvents();
  }

  bindEvents() {
    const kd = (e) => this.keys[e.code] = true;
    const ku = (e) => this.keys[e.code] = false;
    
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    
    this.canvas.parentElement.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
    });

    this.canvas.parentElement.addEventListener("mousedown", () => {
      this.shoot();
    });
  }

  shoot() {
    this.bullets.push({
      x: this.player.x + (this.player.facing > 0 ? this.player.width * 0.7 : this.player.width * 0.3),
      y: this.player.y + this.player.height * 0.42,
      vx: this.player.facing * 18,
      vy: 0,
      life: 60
    });
  }

  update(dt) {
    const p = this.player;

    if (this.keys["KeyA"]) {
      p.vx -= 1.0;
      p.facing = -1;
    }
    if (this.keys["KeyD"]) {
      p.vx += 1.0;
      p.facing = 1;
    }
    p.vx *= 0.9;

    if (this.keys["KeyW"] && p.onGround) {
      p.vy = -15;
      p.onGround = false;
    }

    p.vy += 0.8; // Gravity

    if (this.keys["Space"] && p.fuel > 0) {
      p.vy -= 1.8;
      p.fuel -= 2;
    } else if (p.onGround) {
      p.fuel = Math.min(100, p.fuel + 3);
    }

    p.x += p.vx;
    p.y += p.vy;

    p.onGround = false;
    for (const plat of this.platforms) {
      if (p.vy >= 0 && 
          p.x + p.width * 0.4 < plat.x + plat.width && 
          p.x + p.width * 0.6 > plat.x &&
          p.y + p.height > plat.y && 
          p.y + p.height < plat.y + plat.height + p.vy) {
        
        if (this.keys["KeyS"]) continue;

        p.y = plat.y - p.height;
        p.vy = 0;
        p.onGround = true;
      }
    }

    if (p.x < -20) p.x = -20;
    if (p.x > this.width - p.width + 20) p.x = this.width - p.width + 20;
    
    if (p.y > this.height) { 
      p.x = 200;
      p.y = 500;
      p.vy = 0;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].x += this.bullets[i].vx;
      this.bullets[i].life--;
      if (this.bullets[i].life <= 0) this.bullets.splice(i, 1);
    }

    this.frameTimer += dt;
    if (this.frameTimer >= this.frameDuration) {
      this.frame = (this.frame + 1) % 8;
      if (this.frame === 3 || this.frame === 7) {
        this.frame = (this.frame + 1) % 8;
      }
      this.frameTimer = 0;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const p = this.player;

    // Draw platforms
    if (this.platformReady) {
      for (const plat of this.platforms) {
        this.ctx.drawImage(this.platformSprite, plat.x, plat.y, plat.width, plat.height);
      }
    }

    if (this.spriteReady) {
        const sw = this.soldierSprite.width / 8;
        const sh = this.soldierSprite.height;
        
        this.ctx.save();
        const dx = Math.round(p.x);
        const dy = Math.round(p.y);

        if (p.facing < 0) {
            this.ctx.translate(dx + p.width, dy);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.soldierSprite, this.frame * sw, 0, sw, sh, 0, 0, p.width, p.height);
        } else {
            this.ctx.drawImage(this.soldierSprite, this.frame * sw, 0, sw, sh, dx, dy, p.width, p.height);
        }
        this.ctx.restore();
    }

    this.ctx.fillStyle = "yellow";
    for (const b of this.bullets) {
      this.ctx.beginPath();
      this.ctx.arc(Math.round(b.x), Math.round(b.y), 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Fuel indicator
    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.ctx.fillRect(Math.round(p.x + 30), Math.round(p.y + 10), 60, 4);
    this.ctx.fillStyle = "#77d4de";
    this.ctx.fillRect(Math.round(p.x + 30), Math.round(p.y + 10), 60 * (p.fuel / 100), 4);
  }
}
