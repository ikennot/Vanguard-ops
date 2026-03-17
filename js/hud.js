class Hud {
  draw(ctx, game) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(20, 20, 260, 110);
    ctx.fillStyle = "#d9edf8";
    ctx.font = "18px sans-serif";
    ctx.fillText(`HP: ${Math.max(0, Math.floor(game.player.health))}/100`, 32, 52);
    ctx.fillText(`Lives: ${game.player.lives}`, 32, 78);
    ctx.fillText(`Kills: ${game.kills}/${GAME_CONST.objective.targetKills}`, 32, 104);
    ctx.restore();
  }
}

window.Hud = Hud;
