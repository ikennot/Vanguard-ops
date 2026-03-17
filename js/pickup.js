class PickupManager {
  constructor() {
    this.pickups = [];
  }

  spawn(type, x, y, value) {
    this.pickups.push({ type, x, y, value });
  }
}

window.PickupManager = PickupManager;
