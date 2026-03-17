class InputHandler {
  constructor() {
    this.keys = new Set();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (event) => this.keys.add(event.code));
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
  }

  isDown(code) {
    return this.keys.has(code);
  }
}

window.InputHandler = InputHandler;
