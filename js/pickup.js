import { Collision } from "./collision.js";
import { GAME_CONST } from "./constants.js";
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
    let assetKey = "pickup-sheet";
    let frameX = 0;
    let frameWidth = 32;
    let frameHeight = 32;
    let scale = 1;
    
    // Default physical dimensions in game world
    let physicalWidth = GAME_CONST.entity.pickup.width;
    let physicalHeight = GAME_CONST.entity.pickup.height;
    
    // Add custom sprite based on pickup type using the images you mentioned
    // Adjust scaling based on the ammo pack size
    switch(type) {
      case "weapon-crate": // 20x bullets
        assetKey = "pickup-20x";
        frameWidth = 552;
        frameHeight = 452;
        scale = 80 / 552; // Largest
        break;
      case "ammo-medium": // 10x bullets
        assetKey = "pickup-10x";
        frameWidth = 547;
        frameHeight = 456;
        scale = 70 / 547; // Medium
        break;
      case "ammo-small": // 5x bullets
        assetKey = "pickup-5x";
        frameWidth = 496;
        frameHeight = 503;
        scale = 60 / 496; // Smallest (60px wide)
        break;
      case "fuel":
        assetKey = "pickup-sheet"; // Fuel retains the old sprite sheet (if any) or fallback to colored rect
        frameX = 1;
        break;
    }

    const pickup = this.entityManager
      .createEntity()
      .addTag("pickup")
      .addTag("render")
      .addComponent(
        "transform",
        createTransform({
          x,
          y,
          width: physicalWidth,
          height: physicalHeight,
          gravity: 0
        })
      )
      .addComponent("sprite", createSprite({ 
        type: "sprite",
        assetKey: assetKey,
        frameWidth: frameWidth,
        frameHeight: frameHeight,
        frameX: frameX,
        numFrames: 1,
        scale: scale,
        color: GAME_CONST.entity.pickup.color 
      }))
      .addComponent("hitbox", createHitbox())
      .addComponent("pickup", { type, sourcePlatform });

    this.pickups.push(pickup);
  }

  reset(platforms) {
    this.clear();

    const ammoTypes = ["weapon-crate", "ammo-small", "ammo-medium"];
    let ammoSpawned = false;

    for (const platform of platforms) {
      if (Math.random() < 0.65) {
        const type = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
        ammoSpawned = true;
        this.createPickup(
          type,
          platform.x + platform.width * 0.5 - GAME_CONST.entity.pickup.width * 0.5,
          platform.y - GAME_CONST.entity.pickup.height,
          platform
        );
      }
    }

    if (!ammoSpawned && platforms.length) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      this.createPickup(
        ammoTypes[Math.floor(Math.random() * ammoTypes.length)],
        platform.x + platform.width * 0.5 - GAME_CONST.entity.pickup.width * 0.5,
        platform.y - GAME_CONST.entity.pickup.height,
        platform
      );
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
        x:
          pickupData.sourcePlatform.x +
          pickupData.sourcePlatform.width * (0.2 + Math.random() * 0.6),
        y: pickupData.sourcePlatform.y - GAME_CONST.entity.pickup.height
      });

      if (audio?.particlesEnabled && particles) {
        particles.spawn(
          {
            x: transform.position.x + GAME_CONST.entity.pickup.width * 0.5,
            y: transform.position.y + GAME_CONST.entity.pickup.height * 0.5
          },
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
        player.weapon.addAmmo(20);
        break;
      case "ammo-small":
        player.weapon.addAmmo(5);
        break;
      case "ammo-medium":
        player.weapon.addAmmo(10);
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
