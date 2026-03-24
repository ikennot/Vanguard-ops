import { GAME_CONST } from "./constants.js";
import InputService from "./services/InputService.js";
import AudioService from "./services/AudioService.js";
import CameraService from "./services/CameraService.js";
import PlatformManager from "./platform.js";
import Player from "./player.js";
import { EnemyManager } from "./enemy.js";
import ProjectileManager from "./projectile.js";
import PickupManager from "./pickup.js";
import ParticleSystem from "./particle.js";
import Hud from "./hud.js";
import MenuController from "./menu.js";
import { TutorialManager } from "./tutorial.js";
import gameState from "./core/GameState.js";
import eventBus from "./core/EventBus.js";
import EntityManager from "./entities/EntityManager.js";
import PhysicsSystem from "./systems/PhysicsSystem.js";
import CollisionSystem from "./systems/CollisionSystem.js";
import HealthSystem from "./systems/HealthSystem.js";
import RenderSystem from "./systems/RenderSystem.js";
import { Collision } from "./collision.js";
import serviceLocator from "./core/ServiceLocator.js";

class Game {
  constructor(canvas, services = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = services.input || new InputService(canvas);
    this.audio = services.audio || new AudioService();
    this.camera = services.camera || new CameraService(canvas.width, canvas.height);
    this.platforms = services.platforms || new PlatformManager();
    this.entityManager = services.entityManager || new EntityManager();
    this.player = services.player || new Player(this.entityManager);
    this.enemies = services.enemies || new EnemyManager(this.entityManager);
    this.projectiles = services.projectiles || new ProjectileManager(this.entityManager);
    this.pickups = services.pickups || new PickupManager(this.entityManager);
    this.particles = services.particles || new ParticleSystem();
    this.hud = services.hud || new Hud();
    this.menu = services.menu || new MenuController();
    this.tutorialManager = new TutorialManager(document.getElementById("tutorial-canvas"));

    this.physicsSystem =
      services.physicsSystem ||
      new PhysicsSystem();
    this.collisionSystem =
      services.collisionSystem ||
      new CollisionSystem();
    this.healthSystem =
      services.healthSystem ||
      new HealthSystem({
        particles: this.particles,
        audio: this.audio
      });
    this.renderSystem = services.renderSystem || new RenderSystem();

    this.state = "main";
    this.selectedUpgrade = null;
    this.kills = 0;
    this.missionTime = 0;
    this.level = 0;
    this.livesAtStartOfLevel = 3; // Default starting lives
    this.maps = ["space", "jungle", "canyon", "warzone", "laboratory"];
    this.unlockedMaps = ["space"];
    this.mapIndex = 0;
    this.currentMapId = this.maps[this.mapIndex];
    this.currentMapData = GAME_CONST.maps[this.currentMapId];

    this.bindUi();
    this.bindEvents();
    this.setState("main");
    this.updateMapPreview();
    gameState.set(this.state);
    eventBus.emit("game:scoreChanged", {
      kills: this.kills,
      target: this.currentMapData.targetKills
    });
  }

  bindEvents() {
    eventBus.on("input:pause", () => {
      if (this.state === "playing") this.setState("pause");
      else if (this.state === "pause") this.setState("playing");
    });

    eventBus.on("player:died", () => {
      this.triggerDefeat();
    });

    eventBus.on("entity:death", ({ tag }) => {
      if (tag !== "enemy") return;
      this.registerKill();
    });
  }

  bindUi() {
    document.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (button || e.target.id === "map-preview-img") {
        this.audio.playSfx("sfx-button");
      }
    });

    document.getElementById("btn-start").addEventListener("click", () => {
      this.setState("rules");
    });

    document.getElementById("btn-settings").addEventListener("click", () => {
      this.setState("settings");
      this.syncSettingsUI();
    });

    const setupToggle = (id, callback) => {
      const el = document.getElementById(id);
      el.addEventListener("click", () => {
        const on = el.querySelector(".toggle-on");
        const off = el.querySelector(".toggle-off");
        const isCurrentlyOn = !on.classList.contains("hidden");
        
        if (isCurrentlyOn) {
          on.classList.add("hidden");
          off.classList.remove("hidden");
          callback(false);
        } else {
          on.classList.remove("hidden");
          off.classList.add("hidden");
          callback(true);
        }
      });
    };

    setupToggle("toggle-bgm", (on) => {
      this.audio.setBgmVolume(on ? 0.7 : 0);
    });
    setupToggle("toggle-sfx", (on) => {
      this.audio.setSfxVolume(on ? 0.8 : 0);
    });
    setupToggle("toggle-visuals", (on) => {
      this.audio.setParticlesEnabled(on);
    });

    document.getElementById("btn-settings-save").addEventListener("click", () => {
      // Save settings logic could go here (e.g., localStorage)
      this.setState("main");
    });

    document.getElementById("btn-settings-back").addEventListener("click", () => {
      this.setState("main");
    });

    document.getElementById("btn-tutorial").addEventListener("click", () => {
      this.setState("tutorial");
    });

    document.getElementById("btn-tutorial-back").addEventListener("click", () => {
      this.setState("main");
    });

    document.getElementById("btn-exit").addEventListener("click", () => {
      window.alert("Exit is disabled in browser mode. Close the tab to exit.");
    });

    document.getElementById("btn-rules-ok").addEventListener("click", () => {
      this.audio.playSfx("sfx-button");
      this.setState("map-select");
    });
    document.getElementById("btn-map-prev").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.shiftMap(-1);
    });
    document.getElementById("btn-map-next").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.shiftMap(1);
    });
    
    const confirmMap = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (this.unlockedMaps.includes(this.currentMapId)) {
        this.audio.playSfx("sfx-button");
        this.setState("resources");
      }
    };

    document.getElementById("map-preview-img").addEventListener("click", confirmMap);
    document.getElementById("btn-map-confirm").addEventListener("click", confirmMap);
    document.getElementById("btn-resources-ok").addEventListener("click", () => {
      this.audio.playSfx("sfx-button");
      this.setState("level-info");
    });
    document.getElementById("btn-level-info-ok").addEventListener("click", () => {
      this.audio.playSfx("sfx-button");
      this.startMission();
    });

    document.getElementById("btn-resume").addEventListener("click", () => this.setState("playing"));
    document.getElementById("btn-restart").addEventListener("click", () => this.restartMission());
    document.getElementById("btn-main").addEventListener("click", () => this.backToMainMenu());

    document.getElementById("btn-victory-next").addEventListener("click", () => {
      if (this.mapIndex < this.maps.length - 1) {
        if (this.isNewWin) {
          this.setState("upgrade");
        } else {
          this.advanceLevel();
        }
      } else {
        this.backToMainMenu();
      }
    });

    const upgradeAmmo = document.getElementById("upgrade-ammo");
    const upgradeJetpack = document.getElementById("upgrade-jetpack");
    const upgradeLife = document.getElementById("upgrade-life");

    const selectUpgrade = (id) => {
      this.selectedUpgrade = id;
      [upgradeAmmo, upgradeJetpack, upgradeLife].forEach((el) => {
        if (el) el.classList.remove("selected");
      });
      const selectedEl = document.getElementById(id);
      if (selectedEl) selectedEl.classList.add("selected");
      this.audio.playSfx("sfx-button");
    };

    if (upgradeAmmo) upgradeAmmo.addEventListener("click", () => selectUpgrade("upgrade-ammo"));
    if (upgradeJetpack) upgradeJetpack.addEventListener("click", () => selectUpgrade("upgrade-jetpack"));
    if (upgradeLife) upgradeLife.addEventListener("click", () => selectUpgrade("upgrade-life"));

    document.getElementById("btn-upgrade-ok").addEventListener("click", () => {
      this.audio.playSfx("sfx-button");
      if (this.selectedUpgrade) {
        this.applyUpgrade(this.selectedUpgrade);
        this.selectedUpgrade = null;
        [upgradeAmmo, upgradeJetpack, upgradeLife].forEach((el) => {
          if (el) el.classList.remove("selected");
        });
        this.advanceLevel();
      } else {
        // No upgrade selected, show confirmation modal
        this.setState("confirm-upgrade");
      }
    });

    document.getElementById("btn-confirm-upgrade-yes").addEventListener("click", () => {
      this.audio.playSfx("sfx-button");
      this.advanceLevel();
    });

    document.getElementById("btn-confirm-upgrade-no").addEventListener("click", () => {
      this.audio.playSfx("sfx-button");
      this.setState("upgrade");
    });
    document.getElementById("btn-victory-back").addEventListener("click", () => this.setState("map-select"));
    document.getElementById("btn-defeat-restart").addEventListener("click", () => this.restartMission());
    document.getElementById("btn-defeat-main").addEventListener("click", () => this.backToMainMenu());

    this.canvas.addEventListener("click", (event) => {
      if (this.state !== "playing") return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      const r = this.hud.pauseButtonRect;
      if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) this.setState("pause");
    });
  }

  setState(nextState) {
    const previousState = this.state;
    this.state = nextState;
    
    // Stop any lingering SFX when changing screens
    if (this.audio) {
      this.audio.stopAllSfx();
    }

    if (nextState === "playing") this.menu.hideAll();
    else if (nextState === "pause") this.menu.show("pause");
    else this.menu.show(nextState);

    // Audio state transitions
    if (["main", "settings", "rules", "tutorial", "map-select", "resources", "level-info"].includes(nextState)) {
      this.audio.playBgm("bgm-opening");
    } else if (["playing", "pause"].includes(nextState)) {
      if (this.currentMapId === "jungle") {
        this.audio.playBgm("bgm-jungle");
      } else if (this.currentMapId === "canyon") {
        this.audio.playBgm("bgm-volcano");
      } else {
        this.audio.playBgm("bgm-bg");
      }
    } else if (nextState === "victory") {
      this.audio.playBgm("bgm-victory");
    } else if (nextState === "defeat") {
      this.audio.playBgm("bgm-lose");
    }

    gameState.set(nextState);
    eventBus.emit("game:state-changed", nextState, previousState);
  }

  syncSettingsUI() {
    const updateToggle = (id, isOn) => {
      const el = document.getElementById(id);
      const on = el.querySelector(".toggle-on");
      const off = el.querySelector(".toggle-off");
      if (isOn) {
        on.classList.remove("hidden");
        off.classList.add("hidden");
      } else {
        on.classList.add("hidden");
        off.classList.remove("hidden");
      }
    };

    updateToggle("toggle-bgm", this.audio.bgmVolume > 0);
    updateToggle("toggle-sfx", this.audio.sfxVolume > 0);
    updateToggle("toggle-visuals", this.audio.particlesEnabled);
  }

  shiftMap(direction) {
    this.mapIndex = (this.mapIndex + direction + this.maps.length) % this.maps.length;
    this.currentMapId = this.maps[this.mapIndex];
    this.currentMapData = GAME_CONST.maps[this.currentMapId];
    this.updateMapPreview();
  }

  updateMapPreview() {
    const frameImg = document.getElementById("map-select-bg-frame");
    if (frameImg) {
      let assetName = this.currentMapId;
      if (assetName === "canyon") assetName = "lava";
      
      // Use assets from select_map if they exist there, otherwise sprites/ui
      if (["laboratory", "warzone", "lava", "space"].includes(assetName)) {
        frameImg.src = `assets/select_map/selectmap${assetName}.png`;
      } else {
        frameImg.src = `assets/sprites/ui/selectmap${assetName}.png`;
      }
    }
    
    const previewImg = document.getElementById("map-preview-img");
    const isLocked = !this.unlockedMaps.includes(this.currentMapId);
    
    if (previewImg) {
      let assetName = this.currentMapId;
      if (assetName === "canyon") assetName = "lava";
      
      if (isLocked) {
        previewImg.src = `assets/select_map/lock${assetName}.jpg`;
        // Handle laboratory/warzone which have .png versions
        if (assetName === "laboratory" || assetName === "warzone") {
            previewImg.src = `assets/select_map/lock${assetName}.png`;
        }
        document.querySelector('.map-card-container').style.cursor = 'default';
      } else {
        previewImg.src = `assets/select_map/${assetName}_selectmap.jpg`;
        // Handle laboratory/warzone/space which have .png versions
        if (assetName === "laboratory" || assetName === "warzone" || assetName === "space") {
            const ext = (assetName === "laboratory" || assetName === "warzone") ? "png" : "jpg";
            previewImg.src = `assets/select_map/${assetName}_selectmap.${ext}`;
        }
        document.querySelector('.map-card-container').style.pointerEvents = 'auto';
        document.querySelector('.map-card-container').style.cursor = 'pointer';
      }
    }

    // Update confirm button
    const confirmBtnImg = document.querySelector("#btn-map-confirm img");
    if (confirmBtnImg) {
      let folder = this.currentMapId;
      if (folder === "canyon") folder = "lava";
      
      // Check if folder exists or use space as fallback for new maps
      if (folder === "laboratory" || folder === "warzone") {
        confirmBtnImg.src = `assets/space/ok.png`; // Fallback to space ok button
      } else {
        confirmBtnImg.src = `assets/${folder}/ok.png`;
      }
    }

    const levelInfoImg = document.getElementById("level-info-img");
    const levelInfoBg = document.getElementById("level-info-bg");
    const levelInfoOkImg = document.querySelector("#btn-level-info-ok img");

    if (levelInfoImg) {
      let infoAsset = `assets/space/gameinfo_space.png`;
      if (this.currentMapId === "jungle") infoAsset = `assets/jungle/gameinfo_jungle.png`;
      if (this.currentMapId === "canyon") infoAsset = `assets/lava/gameinfo_lava.png`;
      if (this.currentMapId === "warzone") infoAsset = `assets/warzone/gameobjectives.png`;
      if (this.currentMapId === "laboratory") infoAsset = `assets/laboratory/gameobjectives.png`;
      levelInfoImg.src = infoAsset;
    }
    if (levelInfoBg) {
      let bgAsset = `assets/space/terrainspace.jpg`;
      if (this.currentMapId === "jungle") bgAsset = `assets/jungle/terrainjungle.jpg`;
      if (this.currentMapId === "canyon") bgAsset = `assets/lava/terrainlava.jpg`;
      if (this.currentMapId === "warzone") bgAsset = `assets/warzone/warzoneterrain.png`;
      if (this.currentMapId === "laboratory") bgAsset = `assets/laboratory/terrainlaboratory.png`;
      levelInfoBg.src = bgAsset;
    }
    if (levelInfoOkImg) {
        let folder = this.currentMapId;
        if (folder === "canyon") folder = "lava";
        if (folder === "laboratory" || folder === "warzone") {
            levelInfoOkImg.src = `assets/space/ok.png`;
        } else {
            levelInfoOkImg.src = `assets/${folder}/ok.png`;
        }
    }
  }

  startMission() {
    this.livesAtStartOfLevel = this.player.lives;
    this.initializeMission();
    this.setState("playing");
  }

  initializeMission() {
    this.entityManager.clear();
    this.platforms.setMap(this.currentMapId);
    this.player.resetForSession(this.platforms.getSpawnPoint());
    this.kills = 0;
    this.missionTime = 0;
    eventBus.emit("game:scoreChanged", {
      kills: this.kills,
      target: this.currentMapData.targetKills
    });
    this.enemies.reset(this.platforms.platforms);
    this.projectiles.clear();
    this.pickups.reset(this.platforms.platforms);
    this.particles.particles = [];
    this.camera.resetToTarget(this.player);
  }

  restartMission() {
    // Restore lives from the start of the current failed level
    this.player.lives = this.livesAtStartOfLevel;
    this.initializeMission();
    this.setState("playing");
  }

  backToMainMenu() {
    this.projectiles.clear();
    this.particles.particles = [];
    this.entityManager.flush();
    this.mapIndex = 0;
    this.currentMapId = this.maps[this.mapIndex];
    this.currentMapData = GAME_CONST.maps[this.currentMapId];
    this.level = 0;
    this.updateMapPreview();
    this.setState("main");
  }

  unlockMap(mapId) {
    if (!this.unlockedMaps.includes(mapId)) {
      this.unlockedMaps.push(mapId);
    }
  }

  applyUpgrade(id) {
    if (id === "upgrade-life") {
      this.player.maxLives += 1;
      this.player.lives += 1;
    } else if (id === "upgrade-jetpack") {
      this.player.maxJetpackFuel += 50;
      this.player.jetpackFuel = this.player.maxJetpackFuel;
    } else if (id === "upgrade-ammo") {
      this.player.weapon.magSize.machinegun += 20;
      this.player.weapon.magAmmo.machinegun = this.player.weapon.magSize.machinegun;
    }
  }

  registerKill() {
    this.kills += 1;
    eventBus.emit("game:scoreChanged", {
      kills: this.kills,
      target: this.currentMapData.targetKills
    });
    if (this.kills >= this.currentMapData.targetKills && this.state === "playing") {
      // Show victory screen instead of auto-advancing
      this.updateScoreboard("victory", "Victory");
      this.setState("victory");

      // Unlock next map if available (for selection in menu later)
      if (this.mapIndex < this.maps.length - 1) {
        const nextMap = this.maps[this.mapIndex + 1];
        // Check if next map is already unlocked before adding it
        this.isNewWin = !this.unlockedMaps.includes(nextMap);
        this.unlockMap(nextMap);
      } else {
        // Last level completed
        this.isNewWin = true; // Still show something? Actually last level goes back to main menu anyway.
      }
    }
  }

  advanceLevel() {
    if (this.mapIndex >= this.maps.length - 1) {
      this.backToMainMenu();
      return;
    }

    this.level += 1;
    this.mapIndex += 1;
    this.currentMapId = this.maps[this.mapIndex];
    this.currentMapData = GAME_CONST.maps[this.currentMapId];
    this.unlockMap(this.currentMapId);
    this.updateMapPreview();

    // Save lives count at the start of this new level
    this.livesAtStartOfLevel = this.player.lives;

    this.initializeMission();
    this.player.lives = this.livesAtStartOfLevel;
    this.setState("playing");
  }

  getEnemyKnockbackMultiplier() {
    return 1 + this.level * 2.5;
  }

  getGameplayScale() {
    return this.getDifficultyScale();
  }

  triggerDefeat() {
    if (this.state !== "playing") return;
    this.updateScoreboard("defeat", "Defeat");
    this.setState("defeat");
  }

  getDifficultyScale() {
    const step = GAME_CONST.enemy.difficultyStepEveryKills;
    const maxStep = GAME_CONST.enemy.maxDifficultyStep;
    const difficultyStep = Math.min(maxStep, Math.floor(this.kills / step));
    return 1 + difficultyStep * 0.15;
  }

  getFormattedTime() {
    const total = Math.max(0, Math.floor(this.missionTime));
    const mm = String(Math.floor(total / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  updateScoreboard(target, resultLabel) {
    const elementId = target === "victory" ? "scoreboard-victory" : "scoreboard-defeat";
    const scoreboard = document.getElementById(elementId);
    scoreboard.innerHTML = [
      `Map: ${this.currentMapData.name}`,
      `Kills: ${this.kills}/${this.currentMapData.targetKills}`,
      `Lives: ${this.player.lives}`,
      `Time: ${this.getFormattedTime()}`,
      `Threat: x${this.getDifficultyScale().toFixed(2)}`
    ].join("<br>");
  }

  update(deltaTime) {
    if (this.state === "tutorial") {
      this.tutorialManager.update(deltaTime);
      return;
    }

    if (this.state !== "playing") {
      this.input.endFrame();
      return;
    }

    this.healthSystem.update(this.entityManager, deltaTime);

    this.player.update(this.input, deltaTime, {
      input: this.input,
      camera: this.camera,
      projectiles: this.projectiles,
      particles: this.particles,
      audio: this.audio
    });

    this.enemies.update(deltaTime, {
      player: this.player,
      projectiles: this.projectiles,
      gameState: this.state,
      currentMapId: this.currentMapId,
      platforms: this.platforms.platforms,
      knockbackMultiplier: this.getEnemyKnockbackMultiplier(),
      difficultyScale: this.getGameplayScale()
    });

    this.physicsSystem.update(this.entityManager, deltaTime);
    this.collisionSystem.update(this.entityManager, this.platforms.platforms);

    if (this.player.position.y > GAME_CONST.world.killY) {
      eventBus.emit("player:fallout");
    }

    this.missionTime += deltaTime;
    this.projectiles.update(deltaTime, GAME_CONST.world.width, GAME_CONST.world.killY);
    this.resolveProjectileHits();
    this.pickups.update(deltaTime, {
      player: this.player,
      particles: this.particles,
      audio: this.audio
    });
    this.particles.update(deltaTime);
    this.camera.follow(this.player);
    this.renderSystem.updateAnimations(this.entityManager.getByTag("render"), deltaTime);
    this.entityManager.flush();

    this.input.endFrame();
  }

  resolveProjectileHits() {
    for (const projectile of this.projectiles.projectiles) {
      if (projectile.markedForRemoval) continue;

      const projectileData = projectile.getComponent("projectile");
      const projectileTransform = projectile.getComponent("transform");
      let hit = false;

      if (projectileData.owner === "player") {
        for (const enemy of this.enemies.enemies) {
          if (enemy.entity.markedForRemoval) continue;
          if (Collision.intersects(projectileTransform, enemy.transform)) {
            eventBus.emit("enemy:hit", {
              entity: enemy.entity,
              damage: projectileData.damage,
              knockback: projectileData.knockback
            });
            hit = true;
            break;
          }
        }
      }

      if (!hit && projectileData.owner === "enemy") {
        if (Collision.intersects(projectileTransform, this.player.transform)) {
          eventBus.emit("player:hit", {
            entity: this.player.entity,
            knockback: projectileData.knockback
          });
          hit = true;
        }
      }

      if (hit) {
        projectile.markedForRemoval = true;
      }
    }

    this.projectiles.projectiles = this.projectiles.projectiles.filter(
      (projectile) => !projectile.markedForRemoval
    );
  }

  drawBackground() {
    const assets = serviceLocator.get("assets");
    let bgImg = null;
    if (assets) {
      if (this.currentMapId === "space") bgImg = assets.get("bg-space");
      if (this.currentMapId === "jungle") bgImg = assets.get("bg-jungle");
      if (this.currentMapId === "canyon") bgImg = assets.get("bg-canyon");
      if (this.currentMapId === "laboratory") bgImg = assets.get("bg-laboratory");
      if (this.currentMapId === "warzone") bgImg = assets.get("bg-warzone");
    }

    if (bgImg) {
      this.ctx.drawImage(bgImg, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      const mapData = GAME_CONST.maps[this.currentMapId] || GAME_CONST.maps.space;
      const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      grad.addColorStop(0, mapData.theme.bgTop);
      grad.addColorStop(1, mapData.theme.bgBottom);
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render() {
    if (this.state === "tutorial") {
      this.tutorialManager.draw();
      return;
    }

    this.drawBackground();

    if (["playing", "pause", "victory", "defeat"].includes(this.state)) {
      this.ctx.save();
      this.ctx.scale(this.camera.zoom, this.camera.zoom);
      
      this.platforms.draw(this.ctx, this.camera);
      this.renderSystem.drawByTag(this.ctx, this.camera, this.entityManager, "pickup");
      this.renderSystem.drawByTag(this.ctx, this.camera, this.entityManager, "enemy");
      this.renderSystem.drawByTag(this.ctx, this.camera, this.entityManager, "projectile");
      this.renderSystem.drawByTag(this.ctx, this.camera, this.entityManager, "player");
      this.particles.draw(this.ctx, this.camera);
      
      this.ctx.restore();
    }

    if (["playing", "pause"].includes(this.state)) {
      this.hud.draw(this.ctx, this);
    }
  }
}

export default Game;
