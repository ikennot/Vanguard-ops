import Game from "./game.js";
import InputService from "./services/InputService.js";
import AudioService from "./services/AudioService.js";
import CameraService from "./services/CameraService.js";
import AssetService from "./services/AssetService.js";
import PlatformManager from "./platform.js";
import Player from "./player.js";
import { EnemyManager } from "./enemy.js";
import ProjectileManager from "./projectile.js";
import PickupManager from "./pickup.js";
import ParticleSystem from "./particle.js";
import Hud from "./hud.js";
import MenuController from "./menu.js";
import serviceLocator from "./core/ServiceLocator.js";
import gameState from "./core/GameState.js";
import eventBus from "./core/EventBus.js";
import EntityManager from "./entities/EntityManager.js";
import PhysicsSystem from "./systems/PhysicsSystem.js";
import CollisionSystem from "./systems/CollisionSystem.js";
import RenderSystem from "./systems/RenderSystem.js";

const assetManifest = [
  { key: "player-main", src: "assets/sprites/player/main-char.png", type: "image" },
  { key: "player-shoot", src: "assets/sprites/player/char-shooting-animation.png", type: "image" },
  { key: "enemy-sheet", src: "assets/sprites/enemies/enemies-sprite.png", type: "image" },
  { key: "pickup-sheet", src: "assets/sprites/pickups/booster-packs-sprite.png", type: "image" },
  { key: "weapon-sheet", src: "assets/sprites/weapons/guns-sprite.png", type: "image" },
  { key: "effect-explosion", src: "assets/sprites/effects/effects-particles-explosion-sprite.png", type: "image" }
];

function bootstrap() {
  const canvas = document.getElementById("game-canvas");
  const entityManager = new EntityManager();
  const input = new InputService(canvas);
  const audio = new AudioService();
  const camera = new CameraService(canvas.width, canvas.height);
  const assets = new AssetService();
  const platforms = new PlatformManager();
  const player = new Player(entityManager);
  const enemies = new EnemyManager(entityManager);
  const projectiles = new ProjectileManager(entityManager);
  const pickups = new PickupManager(entityManager);
  const particles = new ParticleSystem();
  const hud = new Hud();
  const menu = new MenuController();

  const services = {
    input,
    audio,
    camera,
    assets,
    platforms,
    entityManager,
    player,
    enemies,
    projectiles,
    pickups,
    particles,
    hud,
    menu,
    physicsSystem: new PhysicsSystem(),
    collisionSystem: new CollisionSystem(),
    renderSystem: new RenderSystem()
  };

  for (const [key, instance] of Object.entries(services)) {
    serviceLocator.register(key, instance);
  }

  assets.preload(assetManifest).catch(() => null);

  serviceLocator.register("eventBus", eventBus);
  serviceLocator.register("gameState", gameState);

  const game = new Game(canvas, services);
  serviceLocator.register("game", game);

  let last = performance.now();

  function loop(now) {
    const deltaTime = Math.min(0.033, (now - last) / 1000);
    last = now;
    game.update(deltaTime);
    game.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

bootstrap();
