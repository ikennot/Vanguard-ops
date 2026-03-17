class WeaponSystem {
  constructor() {
    this.weapons = ["pistol", "rifle", "smg", "machinegun", "rocket"];
    this.magSize = { pistol: 12, rifle: 20, smg: 30, machinegun: 40, rocket: 1 };
    this.reloadTime = { pistol: 0.9, rifle: 1.05, smg: 1.1, machinegun: 1.25, rocket: 1.4 };
    this.infiniteAmmo = true;
    this.reset();
  }

  reset() {
    this.current = "rifle";
    this.reserveAmmo = { pistol: 36, rifle: 80, smg: 120, machinegun: 160, rocket: 10 };
    this.magAmmo = { pistol: 0, rifle: 0, smg: 0, machinegun: 0, rocket: 0 };
    this.reloading = false;
    this.reloadTimer = 0;

    for (const weapon of this.weapons) {
      const loaded = Math.min(this.magSize[weapon], this.reserveAmmo[weapon]);
      this.magAmmo[weapon] = loaded;
      this.reserveAmmo[weapon] -= loaded;
    }
  }

  canFire() {
    if (this.infiniteAmmo) return true;
    return !this.reloading && (this.magAmmo[this.current] || 0) > 0;
  }

  consumeAmmo(amount = 1) {
    if (this.infiniteAmmo) return;
    this.magAmmo[this.current] = Math.max(0, (this.magAmmo[this.current] || 0) - amount);
    if (this.magAmmo[this.current] === 0) this.startReload();
  }

  addAmmo(amount = 5) {
    if (this.infiniteAmmo) return;
    this.reserveAmmo[this.current] = (this.reserveAmmo[this.current] || 0) + amount;
    if ((this.magAmmo[this.current] || 0) === 0 && !this.reloading) this.startReload();
  }

  setRandomWeapon() {
    const index = Math.floor(Math.random() * this.weapons.length);
    this.current = this.weapons[index];
    if ((this.magAmmo[this.current] || 0) === 0) this.startReload();
  }

  getCurrentAmmo() {
    if (this.infiniteAmmo) return "INF";
    return this.magAmmo[this.current] || 0;
  }

  getReserveAmmo() {
    if (this.infiniteAmmo) return "INF";
    return this.reserveAmmo[this.current] || 0;
  }

  startReload() {
    if (this.infiniteAmmo) return false;
    if (this.reloading) return false;
    if ((this.reserveAmmo[this.current] || 0) <= 0) return false;
    if ((this.magAmmo[this.current] || 0) >= this.magSize[this.current]) return false;
    this.reloading = true;
    this.reloadTimer = this.reloadTime[this.current] || 1;
    return true;
  }

  update(deltaTime) {
    if (this.infiniteAmmo) {
      this.reloading = false;
      return;
    }
    if (!this.reloading) return;
    this.reloadTimer -= deltaTime;
    if (this.reloadTimer > 0) return;
    this.reloading = false;

    const currentMag = this.magAmmo[this.current] || 0;
    const reserve = this.reserveAmmo[this.current] || 0;
    const need = Math.max(0, this.magSize[this.current] - currentMag);
    const loaded = Math.min(need, reserve);
    this.magAmmo[this.current] = currentMag + loaded;
    this.reserveAmmo[this.current] = reserve - loaded;
  }

  isReloading() {
    if (this.infiniteAmmo) return false;
    return this.reloading;
  }
}

window.WeaponSystem = WeaponSystem;
