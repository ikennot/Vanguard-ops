class Entity {
  constructor(id) {
    this.id = id;
    this.components = new Map();
    this.tags = new Set();
    this.markedForRemoval = false;
  }

  addComponent(name, component) {
    this.components.set(name, component);
    return this;
  }

  getComponent(name) {
    return this.components.get(name);
  }

  hasComponent(name) {
    return this.components.has(name);
  }

  hasComponents(names) {
    for (const name of names) {
      if (!this.components.has(name)) return false;
    }
    return true;
  }

  removeComponent(name) {
    this.components.delete(name);
    return this;
  }

  addTag(tag) {
    this.tags.add(tag);
    return this;
  }

  hasTag(tag) {
    return this.tags.has(tag);
  }
}

export default Entity;
