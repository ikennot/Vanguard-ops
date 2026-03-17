class MenuController {
  constructor() {
    this.main = document.getElementById("menu-main");
    this.pause = document.getElementById("menu-pause");
    this.settings = document.getElementById("menu-settings");
  }

  showMain() {
    this.main.classList.remove("hidden");
    this.pause.classList.add("hidden");
    this.settings.classList.add("hidden");
  }

  hideAll() {
    this.main.classList.add("hidden");
    this.pause.classList.add("hidden");
    this.settings.classList.add("hidden");
  }
}

window.MenuController = MenuController;
