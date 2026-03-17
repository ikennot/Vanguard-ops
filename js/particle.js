class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(position, color) {
    this.particles.push({ x: position.x, y: position.y, life: 0.3, color });
  }

  update(deltaTime) {
    this.particles = this.particles
      .map((p) => ({ ...p, life: p.life - deltaTime }))
      .filter((p) => p.life > 0);
  }
}

window.ParticleSystem = ParticleSystem;
