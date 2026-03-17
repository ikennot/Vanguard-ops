class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseButtons = new Set();
    this.mousePressed = new Set();
    this.mouse = { x: 0, y: 0 };
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("keydown", (event) => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));

    if (!this.canvas) return;

    this.canvas.addEventListener("mousemove", (event) => {
      const position = this.getCanvasPosition(event.clientX, event.clientY);
      this.mouse.x = position.x;
      this.mouse.y = position.y;
    });

    this.canvas.addEventListener("mousedown", (event) => {
      if (!this.mouseButtons.has(event.button)) this.mousePressed.add(event.button);
      this.mouseButtons.add(event.button);

      const position = this.getCanvasPosition(event.clientX, event.clientY);
      this.mouse.x = position.x;
      this.mouse.y = position.y;
    });

    window.addEventListener("mouseup", (event) => {
      this.mouseButtons.delete(event.button);
    });
  }

  getCanvasPosition(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    if (!this.pressed.has(code)) return false;
    this.pressed.delete(code);
    return true;
  }

  isMouseDown(button = 0) {
    return this.mouseButtons.has(button);
  }

  wasMousePressed(button = 0) {
    if (!this.mousePressed.has(button)) return false;
    this.mousePressed.delete(button);
    return true;
  }

  endFrame() {
    this.pressed.clear();
    this.mousePressed.clear();
  }
}

window.InputHandler = InputHandler;
