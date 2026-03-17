class Hud {
  constructor() {
    this.pauseButtonRect = { x: 1220, y: 14, width: 44, height: 44 };
  }

  draw(ctx, game) {
    ctx.save();
    ctx.fillStyle = "rgba(12, 18, 24, 0.72)";
    ctx.fillRect(18, 18, 280, 58);
    ctx.fillStyle = "#f2d17a";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(`KILLS: ${String(game.kills).padStart(2, "0")}/${GAME_CONST.objective.targetKills}`, 28, 54);
    ctx.fillStyle = "#d7ebf2";
    ctx.font = "600 14px sans-serif";
    ctx.fillText(`MAP: ${game.currentMapData.name.toUpperCase()}  TIME: ${game.getFormattedTime()}`, 158, 40);
    ctx.fillText(`THREAT x${game.getDifficultyScale().toFixed(2)}`, 158, 58);

    ctx.fillStyle = "rgba(230, 236, 240, 0.92)";
    ctx.fillRect(18, 604, 228, 86);
    ctx.fillStyle = "#121a20";
    ctx.font = "700 18px sans-serif";
    ctx.fillText("LIVES", 30, 640);
    ctx.fillText(`AMMO (${game.player.weapon.current.toUpperCase()})`, 118, 640);

    ctx.fillStyle = "#121a20";
    ctx.font = "700 16px sans-serif";
    ctx.fillText(String(game.player.lives), 30, 666);
    ctx.fillText(`${game.player.weapon.getCurrentAmmo()}/${game.player.weapon.getReserveAmmo()}`, 118, 666);
    if (game.player.weapon.isReloading()) {
      ctx.fillStyle = "#b8dfe8";
      ctx.font = "600 13px sans-serif";
      ctx.fillText("RELOADING...", 118, 682);
    }

    const p = this.pauseButtonRect;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = "#623f37";
    ctx.fillRect(p.x + 14, p.y + 11, 5, 22);
    ctx.fillRect(p.x + 25, p.y + 11, 5, 22);

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

window.Hud = Hud;
