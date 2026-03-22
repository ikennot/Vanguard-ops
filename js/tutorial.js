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
      collHeight: 80, // Even smaller collision height to remove visual gap
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

    this.sprites = {
      idle: new Image(),
      running: new Image(),
      shooting: new Image(),
      flying: new Image(),
      enemyLeft: new Image(),
      enemyRight: new Image(),
      enemyLeftAlt: new Image(),
      enemyRightAlt: new Image()
    };

    let loadedCount = 0;
    const totalSprites = 8;
    const onLoaded = () => {
        loadedCount++;
        if (loadedCount === totalSprites) this.spriteReady = true;
    };

    this.sprites.idle.onload = onLoaded;
    this.sprites.running.onload = onLoaded;
    this.sprites.shooting.onload = onLoaded;
    this.sprites.flying.onload = onLoaded;
    this.sprites.enemyLeft.onload = onLoaded;
    this.sprites.enemyRight.onload = onLoaded;
    this.sprites.enemyLeftAlt.onload = onLoaded;
    this.sprites.enemyRightAlt.onload = onLoaded;

    this.sprites.idle.src = "assets/sprites/player/running_facing_right.png";
    this.sprites.running.src = "assets/sprites/player/running_facing_right.png";
    this.sprites.shooting.src = "assets/sprites/player/shooting_right.png";
    this.sprites.flying.src = "assets/sprites/player/flying_right.png";
    this.sprites.enemyLeft.src = "assets/sprites/enemy/enemy-facing-left.png";
    this.sprites.enemyRight.src = "assets/sprites/enemy/enemy-facing-right.png";
    this.sprites.enemyLeftAlt.src = "assets/sprites/enemy/enemy-facing-left-shooting.png";
    this.sprites.enemyRightAlt.src = "assets/sprites/enemy/enemy-facing-rigth-shooting.png";

    this.platformSprite = new Image();
    this.platformSprite.onload = () => {
        this.platformReady = true;
    };
    this.platformSprite.src = "assets/tutorial/tutorialplatform.png";
    
    // Physics constants for tutorial
    this.physics = {
      speed: 600,
      jumpForce: -600,
      gravity: 1500,
      jetpackForce: 2600,
      fuelRegen: 80,
      fuelDrain: 60,
      terminalVelocity: 800
    };

    this.enemy = {
      x: 800,
      y: 520,
      width: 96,
      height: 96,
      collHeight: 64, // Smaller collision box
      vx: 0,
      vy: 0,
      facing: -1,
      onGround: false,
      knockbackX: 0,
      spawnX: 800,
      spawnY: 520,
      respawnTimer: 0,
      jumpTimer: 1.0, // Delay first jump
      walkFrame: 0,
      walkTimer: 0
    };

    this.frame = 0;
    this.frameTimer = 0;
    this.frameDuration = 0.1;
    this.shootTimer = 0;

    this.audio = {
      gun: new Audio("assets/audio/sfx/laser-gun.mp3")
    };

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
    // Aim logic like main gameplay: calculate direction from player center to mouse
    const originX = this.player.x + this.player.width * 0.5;
    const originY = this.player.y + this.player.height * 0.45;
    const dx = this.mouse.x - originX;
    const dy = this.mouse.y - originY;
    
    // Normalize and scale velocity
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 18; // Bullet speed in tutorial
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    // Update facing based on mouse position
    if (Math.abs(dx) > 1) {
      this.player.facing = dx > 0 ? 1 : -1;
    }

    this.bullets.push({
      x: originX + this.player.facing * 12,
      y: originY,
      vx: vx,
      vy: vy,
      life: 60
    });
    this.shootTimer = 0.3; // Animation duration for shooting

    // Play gun sound
    if (this.audio && this.audio.gun) {
      this.audio.gun.currentTime = 0; // Reset to start for rapid fire
      this.audio.gun.play().catch(e => console.log("Audio play failed:", e));
    }
  }

  update(dt) {
    const p = this.player;
    const phys = this.physics;
    const en = this.enemy;
    this.shootTimer = Math.max(0, this.shootTimer - dt);

    if (this.keys["KeyA"]) {
      p.vx = -phys.speed;
      p.facing = -1;
    } else if (this.keys["KeyD"]) {
      p.vx = phys.speed;
      p.facing = 1;
    } else {
      p.vx = 0;
    }

    if (this.keys["KeyW"] && p.onGround) {
      p.vy = phys.jumpForce;
      p.onGround = false;
    }

    p.vy += phys.gravity * dt; // Gravity

    if (this.keys["Space"] && p.fuel > 0) {
      p.vy -= phys.jetpackForce * dt;
      p.fuel -= phys.fuelDrain * dt;
    } else if (p.onGround) {
      p.fuel = Math.min(100, p.fuel + phys.fuelRegen * dt);
    }

    // Limit falling speed
    if (p.vy > phys.terminalVelocity) p.vy = phys.terminalVelocity;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    p.onGround = false;
    for (const plat of this.platforms) {
      if (p.vy >= 0 && 
          p.x + p.width * 0.3 < plat.x + plat.width && 
          p.x + p.width * 0.7 > plat.x &&
          p.y + p.collHeight > plat.y && 
          p.y + p.collHeight < plat.y + plat.height + Math.max(15, p.vy * dt)) {
        
        if (this.keys["KeyS"]) continue;

        p.y = plat.y - p.collHeight;
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

    // Enemy AI logic
    if (en.respawnTimer > 0) {
      en.respawnTimer -= dt;
      if (en.respawnTimer <= 0) {
        en.x = en.spawnX;
        en.y = en.spawnY;
        en.vx = 0;
        en.vy = 0;
        en.knockbackX = 0;
        en.jumpTimer = 1.0; 
      }
    } else {
      const dx = p.x - en.x;
      const dy = p.y - en.y;
      const enemyAccel = 1000;
      const maxEnemySpeed = 180;
      
      // Smoother Follow AI
      if (Math.abs(dx) > 30) {
        const dir = dx > 0 ? 1 : -1;
        en.vx += dir * enemyAccel * dt;
        if (Math.abs(en.vx) > maxEnemySpeed) en.vx = dir * maxEnemySpeed;
        en.facing = dir;
        
        // Walk animation
        en.walkTimer += dt;
        if (en.walkTimer >= 0.12) {
          en.walkFrame = (en.walkFrame + 1) % 2;
          en.walkTimer = 0;
        }
      } else {
        en.vx *= 0.7;
        en.walkFrame = 0;
      }

      // Natural Jumping: Jump only if player is significantly higher or blocked
      en.jumpTimer -= dt;
      if (en.onGround && en.jumpTimer <= 0) {
        if (dy < -100 || (Math.abs(dx) > 250 && Math.random() < 0.2)) {
          en.vy = -750;
          en.onGround = false;
          en.jumpTimer = 0.5 + Math.random();
        }
      }

      en.vy += phys.gravity * dt;
      en.x += (en.vx + en.knockbackX) * dt;
      en.y += en.vy * dt;
      en.knockbackX *= 0.94; // Slower knockback decay for feel

      en.onGround = false;
      for (const plat of this.platforms) {
        if (en.vy >= 0 && 
            en.x + en.width * 0.3 < plat.x + plat.width && 
            en.x + en.width * 0.7 > plat.x &&
            en.y + en.collHeight > plat.y && 
            en.y + en.collHeight < plat.y + plat.height + Math.max(15, en.vy * dt)) {
          
          en.y = plat.y - en.collHeight;
          en.vy = 0;
          en.onGround = true;
        }
      }

      // Check if fallen off
      if (en.y > this.height) {
        en.respawnTimer = 1.5;
      }
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy; // Apply vertical velocity
      b.life--;

      // Bullet-Enemy collision
      if (en.respawnTimer <= 0 &&
          b.x > en.x && b.x < en.x + en.width &&
          b.y > en.y && b.y < en.y + en.collHeight) {
        
        en.knockbackX = (b.vx > 0 ? 1 : -1) * 1800;
        en.vy = -450; 
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0) this.bullets.splice(i, 1);
    }

    this.frameTimer += dt;
    if (this.frameTimer >= this.frameDuration) {
      if (Math.abs(p.vx) > 0.1 || !p.onGround) {
        this.frame = (this.frame + 1) % 5;
      } else {
        this.frame = 0; // Idle
      }
      this.frameTimer = 0;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const p = this.player;
    const en = this.enemy;

    // Draw platforms
    if (this.platformReady) {
      for (const plat of this.platforms) {
        this.ctx.drawImage(this.platformSprite, plat.x, plat.y, plat.width, plat.height);
      }
    }

    if (this.spriteReady) {
        // Draw enemy if active
        if (en.respawnTimer <= 0) {
          let enemyImg;
          if (en.facing > 0) {
            enemyImg = en.walkFrame === 0 ? this.sprites.enemyRight : this.sprites.enemyRightAlt;
          } else {
            enemyImg = en.walkFrame === 0 ? this.sprites.enemyLeft : this.sprites.enemyLeftAlt;
          }
          // Added +22 to snap feet to platform
          this.ctx.drawImage(enemyImg, 0, 0, 48, 48, Math.round(en.x), Math.round(en.y - (en.height - en.collHeight) + 22), en.width, en.height);
        }

        let sprite = this.sprites.idle;
        let frameX = this.frame;

        if (this.shootTimer > 0) {
          sprite = this.sprites.shooting;
          frameX = 3 + (Math.floor(this.shootTimer * 10) % 2); 
        } else if (!p.onGround && this.keys["Space"]) {
          sprite = this.sprites.flying;
        } else if (Math.abs(p.vx) > 0.1) {
          sprite = this.sprites.running;
        }

        const sw = sprite.width / 5;
        const sh = sprite.height;
        
        this.ctx.save();
        const visualOffset = 29; // Increased to 29px for the player
        const dx = Math.round(p.x);
        const dy = Math.round(p.y - (p.height - p.collHeight) + visualOffset); 

        // Reverse flipping as requested by user
        if (p.facing > 0) {
            this.ctx.translate(dx + p.width, dy);
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(sprite, frameX * sw, 0, sw, sh, 0, 0, p.width, p.height);
        } else {
            this.ctx.drawImage(sprite, frameX * sw, 0, sw, sh, dx, dy, p.width, p.height);
        }
        this.ctx.restore();
    }

    this.ctx.fillStyle = "yellow";
    for (const b of this.bullets) {
      this.ctx.beginPath();
      this.ctx.arc(Math.round(b.x), Math.round(b.y), 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw crosshair (circle cursor)
    this.ctx.strokeStyle = "rgba(119, 212, 222, 0.8)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, 8, 0, Math.PI * 2);
    this.ctx.stroke();
    // Dot in center
    this.ctx.fillStyle = "rgba(119, 212, 222, 0.8)";
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Fuel indicator at the top of the player sprite
    const indicatorY = Math.round(p.y - (p.height - p.collHeight) + 17); // Adjusted to stay above the head with the 29px offset
    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
    this.ctx.fillRect(Math.round(p.x + 30), indicatorY, 60, 4);
    this.ctx.fillStyle = "#77d4de";
    this.ctx.fillRect(Math.round(p.x + 30), indicatorY, 60 * (p.fuel / 100), 4);
  }
}
