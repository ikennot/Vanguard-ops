class InputHandler {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (event) => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    if (!this.pressed.has(code)) return false;
    this.pressed.delete(code);
    return true;
  }

  endFrame() {
    this.pressed.clear();
  }
}

window.InputHandler = InputHandler;
