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
      .addTag("physics")
      .addTag("world-bounds")
      .addTag("platform-collide")
      .addComponent(
        "transform",
        createTransform({
          x,
          y,
          width: physicalWidth,
          height: physicalHeight,
          gravity: 300 // Lower gravity for slower falling
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
    const pickupCount = Math.max(3, Math.floor(platforms.length * 0.5));

    for (let i = 0; i < pickupCount; i++) {
      const type = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
      const randomX = Math.random() * (GAME_CONST.world.width - GAME_CONST.entity.pickup.width);
      this.createPickup(
        type,
        randomX,
        -100, // Spawn above the screen
        null
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
      const randomX = Math.random() * (GAME_CONST.world.width - GAME_CONST.entity.pickup.width);
      this.createPickup(respawn.type, randomX, -100, null);
    }

    const playerTransform = player.entity.getComponent("transform");
    this.pickups = this.pickups.filter((pickup) => {
      if (pickup.markedForRemoval) return false;

      const transform = pickup.getComponent("transform");
      const pickupData = pickup.getComponent("pickup");

      // Handle falling off world
      if (transform.position.y > GAME_CONST.world.killY) {
        pickup.markedForRemoval = true;
        this.respawnQueue.push({
           timer: 5,
           type: pickupData.type,
           sourcePlatform: null
        });
        return false;
      }

      if (!Collision.intersects(transform, playerTransform)) {
        return true;
      }

      this.applyPickup(pickupData.type, player);
      this.respawnQueue.push({
        timer: 10,
        type: pickupData.type,
        sourcePlatform: null
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
