import Entity from "./Entity.js";

class EntityManager {
  constructor() {
    this.entities = new Map();
    this.nextId = 1;
  }

  createEntity() {
    const entity = new Entity(this.nextId);
    this.entities.set(this.nextId, entity);
    this.nextId += 1;
    return entity;
  }

  destroyEntity(entity) {
    if (!entity) return;
    entity.markedForRemoval = true;
  }

  getAll() {
    return Array.from(this.entities.values());
  }

  getByTag(tag) {
    return this.getAll().filter((entity) => !entity.markedForRemoval && entity.hasTag(tag));
  }

  getWithComponents(componentNames) {
    return this.getAll().filter(
      (entity) => !entity.markedForRemoval && entity.hasComponents(componentNames)
    );
  }

  flush() {
    for (const [id, entity] of this.entities.entries()) {
      if (entity.markedForRemoval) this.entities.delete(id);
    }
  }

  clear() {
    this.entities.clear();
    this.nextId = 1;
  }
}

export default EntityManager;
