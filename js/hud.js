import { GAME_CONST } from "./constants.js";
import eventBus from "./core/EventBus.js";
import serviceLocator from "./core/ServiceLocator.js";

class Hud {
  constructor() {
    this.pauseButtonRect = { x: 1220, y: 14, width: 44, height: 44 };
    this.kills = 0;
    this.killTarget = GAME_CONST.objective.targetKills;
    eventBus.on("game:scoreChanged", ({ kills, target }) => {
      this.kills = kills;
      this.killTarget = target;
    });
    this.assets = null;
  }

  draw(ctx, game) {
    if (!this.assets) {
      this.assets = serviceLocator.get("assets");
    }
    ctx.save();
    
    // Top HUD Bar - Score and Map Info
    ctx.fillStyle = "rgba(12, 18, 24, 0.72)";
    ctx.fillRect(18, 18, 280, 58);
    ctx.fillStyle = "#f2d17a";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(`KILLS: ${String(this.kills).padStart(2, "0")}/${this.killTarget}`, 28, 54);
    ctx.fillStyle = "#d7ebf2";
    ctx.font = "600 14px sans-serif";
    ctx.fillText(`MAP: ${game.currentMapData.name.toUpperCase()}  TIME: ${game.getFormattedTime()}`, 158, 40);
    ctx.fillText(`THREAT x${game.getDifficultyScale().toFixed(2)}`, 158, 58);

    // Bottom HUD - Lives and Ammo
    const hudY = 604;
    ctx.fillStyle = "rgba(230, 236, 240, 0.92)";
    ctx.fillRect(18, hudY, 240, 86);
    
    // Life Icon and Count
    const lifeIcon = this.assets.get("hud-life");
    if (lifeIcon) {
      ctx.drawImage(lifeIcon, 30, hudY + 12, 32, 32);
    }
    ctx.fillStyle = "#121a20";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(String(game.player.lives), 72, hudY + 36);

    // Ammo Icon and Count
    const ammoIcon = this.assets.get("hud-bullet");
    if (ammoIcon) {
      ctx.drawImage(ammoIcon, 118, hudY + 12, 24, 24);
    }
    ctx.fillText(`${game.player.weapon.getCurrentAmmo()}/${game.player.weapon.getReserveAmmo()}`, 150, hudY + 32);
    
    // Weapon Icon
    const gunIcon = this.assets.get("hud-gun");
    if (gunIcon) {
      ctx.drawImage(gunIcon, 118, hudY + 44, 32, 24);
    }
    ctx.font = "600 14px sans-serif";
    ctx.fillText(game.player.weapon.current.toUpperCase(), 158, hudY + 62);

    if (game.player.weapon.isReloading()) {
      ctx.fillStyle = "#ff4444";
      ctx.font = "600 13px sans-serif";
      ctx.fillText("RELOADING...", 118, hudY + 80);
    }

    // Pause Button
    const p = this.pauseButtonRect;
    const pauseIcon = this.assets.get("pause-icon");
    if (pauseIcon) {
      ctx.drawImage(pauseIcon, p.x, p.y, p.width, p.height);
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = "#623f37";
      ctx.fillRect(p.x + 14, p.y + 11, 5, 22);
      ctx.fillRect(p.x + 25, p.y + 11, 5, 22);
    }

    // Reticle
    if (game.state === "playing") {
      ctx.beginPath();
      ctx.arc(game.input.mouse.x, game.input.mouse.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}

export default Hud;