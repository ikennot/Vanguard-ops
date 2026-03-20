import { GAME_CONST } from "./constants.js";
import serviceLocator from "./core/ServiceLocator.js";

class PlatformManager {
  constructor() {
    this.currentMap = GAME_CONST.maps.space;
    this.platforms = this.currentMap.platforms.map((p) => ({ ...p }));
    this.assets = null;
  }

  setMap(mapId) {
    this.currentMap = GAME_CONST.maps[mapId] || GAME_CONST.maps.space;
    this.platforms = this.currentMap.platforms.map((p) => ({ ...p }));
  }

  getSpawnPoint() {
    return { ...this.currentMap.spawn };
  }

  draw(ctx, camera) {
    if (!this.assets) this.assets = serviceLocator.get("assets");
    
    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      let img = null;
      
      if (this.currentMap.id === "space") {
        img = this.assets.get("platform-space");
      } else if (this.currentMap.id === "jungle") {
        // Simple logic for choosing jungle platform variants
        img = (i % 2 === 0) ? this.assets.get("platform-jungle-1") : this.assets.get("platform-jungle-2");
      } else if (this.currentMap.id === "canyon") {
        img = this.assets.get("platform-canyon");
      }
      
      if (img) {
        ctx.drawImage(img, p.x - camera.x, p.y - camera.y, p.width, p.height);
      } else {
        const color = this.currentMap.theme.platform;
        ctx.fillStyle = color;
        ctx.fillRect(p.x - camera.x, p.y - camera.y, p.width, p.height);
      }
    }
  }
}

export default PlatformManager;
