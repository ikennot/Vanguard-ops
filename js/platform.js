class PlatformManager {
  constructor() {
    this.currentMap = GAME_CONST.maps.space;
    this.platforms = this.currentMap.platforms.map((p) => ({ ...p }));
  }

  setMap(mapId) {
    this.currentMap = GAME_CONST.maps[mapId] || GAME_CONST.maps.space;
    this.platforms = this.currentMap.platforms.map((p) => ({ ...p }));
  }

  getSpawnPoint() {
    return { ...this.currentMap.spawn };
  }

  draw(ctx, camera) {
    const color = this.currentMap.theme.platform;
    for (const p of this.platforms) {
      ctx.fillStyle = color;
      ctx.fillRect(p.x - camera.x, p.y - camera.y, p.width, p.height);
      ctx.strokeStyle = "rgba(8, 13, 16, 0.6)";
      ctx.strokeRect(p.x - camera.x, p.y - camera.y, p.width, p.height);
    }
  }
}

window.PlatformManager = PlatformManager;
