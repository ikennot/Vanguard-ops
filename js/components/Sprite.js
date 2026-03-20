function createSprite({
  color = "#ffffff",
  type = "sprite",
  assetKey = null,
  frameX = 0,
  frameY = 0,
  frameWidth = 64,
  frameHeight = 64,
  numFrames = 1,
  animationSpeed = 0.1,
  currentFrame = 0,
  animationTimer = 0,
  loop = true,
  scale = 1,
  flipX = false
} = {}) {
  return {
    color,
    type,
    assetKey,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    numFrames,
    animationSpeed,
    currentFrame,
    animationTimer,
    loop,
    scale,
    flipX,
    gunColor: null
  };
}

export { createSprite };
