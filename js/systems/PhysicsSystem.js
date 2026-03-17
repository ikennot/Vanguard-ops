import { Physics } from "../physics.js";

class PhysicsSystem {
  update(entityManager, deltaTime) {
    const entities = entityManager.getWithComponents(["transform"]);

    for (const entity of entities) {
      if (!entity.hasTag("physics")) continue;
      const transform = entity.getComponent("transform");
      transform.prevPosition.x = transform.position.x;
      transform.prevPosition.y = transform.position.y;
      transform.onGround = false;

      if (transform.gravity !== 0) Physics.applyGravity(transform, deltaTime);
      Physics.integrate(transform, deltaTime);
    }
  }
}

export default PhysicsSystem;
