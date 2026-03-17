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

  clear() {
    this.services.clear();
  }
}

const serviceLocator = new ServiceLocator();

export default serviceLocator;
