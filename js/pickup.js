import { Collision } from "./collision.js";
import { createTransform } from "./components/Transform.js";
import { createSprite } from "./components/Sprite.js";
import { createHitbox } from "./components/Hitbox.js";
import serviceLocator from "./core/ServiceLocator.js";

class PickupManager {
  constructor(entityManager) {
    this.entityManager = entityManager;
    this.pickups = [];
    this.respawnQueue = [];
  }

  clear() {
    for (const pickup of this.pickups) pickup.markedForRemoval = true;
    this.pickups = [];
    this.respawnQueue = [];
  }

  createPickup(type, x, y, sourcePlatform) {
    const colorByType = {
      "weapon-crate": "#97a5a8",
      "ammo-small": "#d9c27a",
      "ammo-medium": "#d9c27a",
      fuel: "#66a9ff"
    };

    const pickup = this.entityManager
      .createEntity()
      .addTag("pickup")
      .addTag("render")
      .addComponent(
        "transform",
        createTransform({
          x,
          y,
          width: 20,
          height: 20,
          gravity: 0
        })
      )
      .addComponent("sprite", createSprite({ color: colorByType[type] || "#97a5a8" }))
      .addComponent("hitbox", createHitbox())
      .addComponent("pickup", { type, sourcePlatform });

    this.pickups.push(pickup);
  }

  reset(platforms) {
    this.clear();

    const types = ["weapon-crate", "ammo-small", "ammo-medium", "fuel"];
    for (const platform of platforms) {
      if (Math.random() < 0.65) {
        const type = types[Math.floor(Math.random() * types.length)];
        this.createPickup(type, platform.x + platform.width * 0.5 - 10, platform.y - 20, platform);
      }
    }
  }

  update(deltaTime, deps = {}) {
    const player = deps.player || serviceLocator.get("player");
    const audio = deps.audio || serviceLocator.get("audio");
    const particles = deps.particles || serviceLocator.get("particles");

    if (!player) return;

    for (const queued of this.respawnQueue) queued.timer -= deltaTime;
    const ready = this.respawnQueue.filter((respawn) => respawn.timer <= 0);
    this.respawnQueue = this.respawnQueue.filter((respawn) => respawn.timer > 0);

    for (const respawn of ready) {
      this.createPickup(respawn.type, respawn.x, respawn.y, respawn.sourcePlatform);
    }

    const playerTransform = player.entity.getComponent("transform");
    this.pickups = this.pickups.filter((pickup) => {
      if (pickup.markedForRemoval) return false;

      const transform = pickup.getComponent("transform");
      const pickupData = pickup.getComponent("pickup");

      if (!Collision.intersects(transform, playerTransform)) {
        return true;
      }

      this.applyPickup(pickupData.type, player);
      this.respawnQueue.push({
        timer: 10,
        type: pickupData.type,
        sourcePlatform: pickupData.sourcePlatform,
        x: pickupData.sourcePlatform.x + pickupData.sourcePlatform.width * (0.2 + Math.random() * 0.6),
        y: pickupData.sourcePlatform.y - 20
      });

      if (audio?.particlesEnabled && particles) {
        particles.spawn(
          { x: transform.position.x + 10, y: transform.position.y + 10 },
          "#7ce3e6",
          12
        );
      }

      pickup.markedForRemoval = true;
      return false;
    });
  }

  applyPickup(type, player) {
    switch (type) {
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
  }
}

export default PickupManager;
