import { createVelocity } from "./Velocity.js";

function createTransform({
  x = 0,
  y = 0,
  vx = 0,
  vy = 0,
  width = 0,
  height = 0,
  gravity = 0,
  facing = 1
} = {}) {
  return {
    position: { x, y },
    prevPosition: { x, y },
    velocity: createVelocity(vx, vy),
    width,
    height,
    gravity,
    onGround: false,
    facing
  };
}

export { createTransform };
