import { GAME_CONST } from "./constants.js";

class WeaponSystem {
  constructor() {
    this.weapons = [...GAME_CONST.weapons.types];
    this.magSize = { ...GAME_CONST.weapons.magSize };
    this.reloadTime = { ...GAME_CONST.weapons.reloadTime };
    this.infiniteAmmo = false;
    this.reset();
  }

  reset() {
    this.current = "machinegun";
    this.reserveAmmo = { ...GAME_CONST.weapons.reserveAmmo };
    this.magAmmo = { pistol: 0, rifle: 0, smg: 0, machinegun: 0, rocket: 0 };
    this.reloading = false;
    this.reloadTimer = 0;

    for (const weapon of this.weapons) {
      this.magAmmo[weapon] = this.magSize[weapon];
      this.reserveAmmo[weapon] = 0;
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
    this.magAmmo[this.current] = Math.min(
      this.magSize[this.current],
      (this.magAmmo[this.current] || 0) + amount
    );
    this.reloading = false;
  }

  setRandomWeapon() {
    this.current = "machinegun";
    if ((this.magAmmo[this.current] || 0) === 0) this.startReload();
  }

  getCurrentAmmo() {
    if (this.infiniteAmmo) return "INF";
    return this.magAmmo[this.current] || 0;
  }

  getReserveAmmo() {
    if (this.infiniteAmmo) return "INF";
    return this.magSize[this.current];
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

export default WeaponSystem;
