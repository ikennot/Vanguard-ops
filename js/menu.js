class MenuController {
  constructor() {
    this.main = document.getElementById("menu-main");
    this.pause = document.getElementById("menu-pause");
    this.settings = document.getElementById("menu-settings");
    this.rules = document.getElementById("screen-rules");
    this.mapSelect = document.getElementById("screen-map-select");
    this.resources = document.getElementById("screen-resources");
    this.victory = document.getElementById("screen-victory");
    this.defeat = document.getElementById("screen-defeat");
    this.overlays = [
      this.main,
      this.pause,
      this.settings,
      this.rules,
      this.mapSelect,
      this.resources,
      this.victory,
      this.defeat
    ];
  }

  showMain() {
    this.show("main");
  }

  hideAll() {
    for (const overlay of this.overlays) overlay.classList.add("hidden");
  }

  show(state) {
    this.hideAll();
    if (state === "main") this.main.classList.remove("hidden");
    if (state === "settings") this.settings.classList.remove("hidden");
    if (state === "rules") this.rules.classList.remove("hidden");
    if (state === "map-select") this.mapSelect.classList.remove("hidden");
    if (state === "resources") this.resources.classList.remove("hidden");
    if (state === "pause") this.pause.classList.remove("hidden");
    if (state === "victory") this.victory.classList.remove("hidden");
    if (state === "defeat") this.defeat.classList.remove("hidden");
  }
}

window.MenuController = MenuController;
