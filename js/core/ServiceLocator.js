class ServiceLocator {
  constructor() {
    this.services = new Map();
  }

  register(key, service) {
    this.services.set(key, service);
    return service;
  }

  get(key) {
    return this.services.get(key) || null;
  }

  has(key) {
    return this.services.has(key);
  }

  clear() {
    this.services.clear();
  }
}

const serviceLocator = new ServiceLocator();

export default serviceLocator;
