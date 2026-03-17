class WeaponSystem {
  constructor() {
    this.current = "rifle";
    this.ammo = { pistol: 60, rifle: 120, smg: 180, machinegun: 200, rocket: 10, bomb: 5 };
  }

  canFire() {
    return (this.ammo[this.current] || 0) > 0;
  }

  consumeAmmo(amount = 1) {
    this.ammo[this.current] = Math.max(0, (this.ammo[this.current] || 0) - amount);
  }
}

window.WeaponSystem = WeaponSystem;
