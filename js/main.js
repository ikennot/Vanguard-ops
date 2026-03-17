import Game from "./game.js";
import InputHandler from "./input.js";
import AudioManager from "./audio.js";
import Camera from "./camera.js";
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

function bootstrap() {
  const canvas = document.getElementById("game-canvas");
  const services = {
    input: new InputHandler(canvas),
    audio: new AudioManager(),
    camera: new Camera(canvas.width, canvas.height),
    platforms: new PlatformManager(),
    player: new Player(),
    enemies: new EnemyManager(),
    projectiles: new ProjectileManager(),
    pickups: new PickupManager(),
    particles: new ParticleSystem(),
    hud: new Hud(),
    menu: new MenuController()
  };

  for (const [key, instance] of Object.entries(services)) {
    serviceLocator.register(key, instance);
  }
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
