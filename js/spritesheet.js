import serviceLocator from "./core/ServiceLocator.js";

class SpriteSheet {
  constructor(path, assetService = serviceLocator.get("assets")) {
    this.path = path;
    this.assetService = assetService;
    this.image = this.assetService?.getImage(path) || null;

    if (!this.image && this.assetService) {
      this.assetService.loadImage(path, path).then((image) => {
        this.image = image;
      }).catch(() => {
        this.image = null;
      });
    }
  }
}

export default SpriteSheet;
