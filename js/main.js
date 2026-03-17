(function bootstrap() {
  const canvas = document.getElementById("game-canvas");
  const game = new Game(canvas);
  let last = performance.now();

  function loop(now) {
    const deltaTime = Math.min(0.033, (now - last) / 1000);
    last = now;
    game.update(deltaTime);
    game.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
