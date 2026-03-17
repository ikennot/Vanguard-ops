export const Physics = {
  applyGravity(entity, deltaTime) {
    entity.velocity.y += entity.gravity * deltaTime;
  },
  integrate(entity, deltaTime) {
    entity.position.x += entity.velocity.x * deltaTime;
    entity.position.y += entity.velocity.y * deltaTime;
  }
};
