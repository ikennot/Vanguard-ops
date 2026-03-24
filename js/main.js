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
  { key: "player-soldier", src: "assets/sprites/player/soldier.png", type: "image" },
  { key: "player-spartan", src: "assets/sprites/player/spartan-sheet.png", type: "image" },
  {
    key: "player-running-left",
    src: "assets/sprites/player/running_facing_left.png",
    type: "image"
  },
  {
    key: "player-running-right",
    src: "assets/sprites/player/running_facing_right.png",
    type: "image"
  },
  { key: "player-flying-left", src: "assets/sprites/player/flying_left.png", type: "image" },
  { key: "player-flying-right", src: "assets/sprites/player/flying_right.png", type: "image" },
  { key: "player-shooting-left", src: "assets/sprites/player/shooting_left.png", type: "image" },
  { key: "player-shooting-right", src: "assets/sprites/player/shooting_right.png", type: "image" },
  { key: "enemy-left", src: "assets/sprites/enemy/enemy-facing-left.png", type: "image" },
  { key: "enemy-right", src: "assets/sprites/enemy/enemy-facing-right.png", type: "image" },
  {
    key: "enemy-left-shooting",
    src: "assets/sprites/enemy/enemy-facing-left-shooting.png",
    type: "image"
  },
  {
    key: "enemy-right-shooting",
    src: "assets/sprites/enemy/enemy-facing-rigth-shooting.png",
    type: "image"
  },
  { key: "enemy-sheet", src: "assets/sprites/enemies/enemies-sprite.png", type: "image" },
  { key: "pickup-sheet", src: "assets/sprites/pickups/booster-packs-sprite.png", type: "image" },
  { key: "weapon-sheet", src: "assets/sprites/weapons/guns-sprite.png", type: "image" },
  { key: "effect-explosion", src: "assets/sprites/effects/effects-particles-explosion-sprite.png", type: "image" },
  { key: "hud-life", src: "assets/sprites/ui/life.png", type: "image" },
  { key: "hud-bullet", src: "assets/sprites/ui/buttons/bullet.png", type: "image" },
  { key: "hud-gun", src: "assets/sprites/ui/buttons/gun.png", type: "image" },
  { key: "platform-space", src: "assets/space/spaceplatform.png", type: "image" },
  { key: "platform-jungle-1", src: "assets/jungle/jungleplatform_1_3.png", type: "image" },
  { key: "platform-jungle-2", src: "assets/jungle/jungleplatform_2.png", type: "image" },
  { key: "platform-canyon", src: "assets/lava/lavaplatform.png", type: "image" },
  { key: "platform-laboratory", src: "assets/laboratory/laboratoryplatform.png", type: "image" },
  { key: "platform-warzone", src: "assets/warzone/warzone_platform.png", type: "image" },
  { key: "bg-space", src: "assets/space/terrainspace.jpg", type: "image" },
  { key: "bg-jungle", src: "assets/jungle/terrainjungle.jpg", type: "image" },
  { key: "bg-canyon", src: "assets/lava/terrainlava.jpg", type: "image" },
  { key: "bg-laboratory", src: "assets/laboratory/terrainlaboratory.png", type: "image" },
  { key: "bg-warzone", src: "assets/warzone/warzoneterrain.png", type: "image" },
  { key: "info-space", src: "assets/space/gameinfo_space.png", type: "image" },
  { key: "info-jungle", src: "assets/jungle/gameinfo_jungle.png", type: "image" },
  { key: "info-canyon", src: "assets/lava/gameinfo_lava.png", type: "image" },
  { key: "info-warzone", src: "assets/warzone/gameobjectives.png", type: "image" },
  { key: "info-laboratory", src: "assets/laboratory/gameobjectives.png", type: "image" },
  { key: "pause-bg-space", src: "assets/space/gamepaused.png", type: "image" },
  { key: "win-bg-space", src: "assets/win1/win1.jpeg", type: "image" },
  { key: "hud-bg-space", src: "assets/space/info.png", type: "image" },
  { key: "hud-bg-lava", src: "assets/lava/info.png", type: "image" },
  { key: "pause-icon", src: "assets/space/pause.jpg", type: "image" },
  { key: "pickup-5x", src: "assets/resources_menu/pickup-5x.png", type: "image" },
  { key: "pickup-10x", src: "assets/resources_menu/pickup-10x.png", type: "image" },
  { key: "pickup-20x", src: "assets/resources_menu/pickup-20x.png", type: "image" },
  { key: "bgm-bg", src: "assets/audio/sfx/bg.mp3", type: "audio" },
  { key: "sfx-button", src: "assets/audio/sfx/button.mp3", type: "audio" },
  { key: "sfx-enemy-fall", src: "assets/audio/sfx/enemy-fall.mp3", type: "audio" },
  { key: "sfx-gun", src: "assets/audio/sfx/gun.mp3", type: "audio" },
  { key: "sfx-jet-pack", src: "assets/audio/sfx/jet-pack.mp3", type: "audio" },
  { key: "sfx-laser-gun", src: "assets/audio/sfx/laser-gun.mp3", type: "audio" },
  { key: "bgm-lose", src: "assets/audio/sfx/lose.mp3", type: "audio" },
  { key: "bgm-opening", src: "assets/audio/sfx/opening.mp3", type: "audio" },
  { key: "bgm-jungle", src: "assets/audio/sfx/jungle.mp3", type: "audio" },
  { key: "bgm-volcano", src: "assets/audio/sfx/volcano.mp3", type: "audio" },
  { key: "sfx-respawn-fall", src: "assets/audio/sfx/respawn-fall.mp3", type: "audio" },
  { key: "bgm-victory", src: "assets/audio/sfx/victory.mp3", type: "audio" }
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

  serviceLocator.register("eventBus", eventBus);
  serviceLocator.register("gameState", gameState);

  assets.preload(assetManifest).then(() => {
    console.log("Assets preloaded successfully.");
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
  }).catch((e) => {
    console.error("Failed to preload assets", e);
    // Start game even if some assets fail to load
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
  });
}

bootstrap();
