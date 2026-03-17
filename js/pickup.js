class PickupManager {
  constructor() {
    this.pickups = [];
    this.respawnQueue = [];
  }

  reset(platforms) {
    this.pickups = [];
    this.respawnQueue = [];

    const types = ["weapon-crate", "ammo-small", "ammo-medium", "fuel"];
    for (const p of platforms) {
      if (Math.random() < 0.65) {
        const type = types[Math.floor(Math.random() * types.length)];
        this.pickups.push({
          type,
          x: p.x + p.width * 0.5 - 10,
          y: p.y - 20,
          width: 20,
          height: 20,
          sourcePlatform: p
        });
      }
    }
  }

  update(deltaTime, game) {
    for (const queued of this.respawnQueue) queued.timer -= deltaTime;
    const ready = this.respawnQueue.filter((r) => r.timer <= 0);
    this.respawnQueue = this.respawnQueue.filter((r) => r.timer > 0);

    for (const respawn of ready) {
      this.pickups.push(respawn.pickup);
    }

    const player = game.player;
    this.pickups = this.pickups.filter((pickup) => {
      if (!Collision.intersects({ x: pickup.x, y: pickup.y, width: pickup.width, height: pickup.height }, player)) {
        return true;
      }

      this.applyPickup(pickup, game);
      this.respawnQueue.push({
        timer: 10,
        pickup: {
          ...pickup,
          x: pickup.sourcePlatform.x + pickup.sourcePlatform.width * (0.2 + Math.random() * 0.6),
          y: pickup.sourcePlatform.y - 20
        }
      });
      return false;
    });
  }

  applyPickup(pickup, game) {
    const player = game.player;
    switch (pickup.type) {
      case "weapon-crate":
        player.weapon.setRandomWeapon();
        player.weapon.addAmmo(24);
        break;
      case "ammo-small":
        player.weapon.addAmmo(8);
        break;
      case "ammo-medium":
        player.weapon.addAmmo(16);
        break;
      case "fuel":
        player.jetpackFuel = Math.min(player.maxJetpackFuel, player.jetpackFuel + 40);
        break;
      default:
        break;
    }

    if (game.audio.particlesEnabled) {
      game.particles.spawn({ x: pickup.x + 10, y: pickup.y + 10 }, "#7ce3e6", 12);
    }
  }

  draw(ctx, camera) {
    for (const pickup of this.pickups) {
      if (pickup.type === "weapon-crate") ctx.fillStyle = "#97a5a8";
      if (pickup.type === "ammo-small" || pickup.type === "ammo-medium") ctx.fillStyle = "#d9c27a";
      if (pickup.type === "fuel") ctx.fillStyle = "#66a9ff";
      ctx.fillRect(pickup.x - camera.x, pickup.y - camera.y, pickup.width, pickup.height);
    }
  }
}

window.PickupManager = PickupManager;
