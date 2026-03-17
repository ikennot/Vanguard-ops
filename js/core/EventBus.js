class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    const handlers = this.listeners.get(eventName);
    if (!handlers) return;
    handlers.delete(callback);
    if (handlers.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  emit(eventName, ...args) {
    const handlers = this.listeners.get(eventName);
    if (!handlers) return;
    for (const callback of handlers) {
      callback(...args);
    }
  }
}

const eventBus = new EventBus();

export default eventBus;
