export const GAME_CONST = {
  debug: {
    hitboxOnly: false
  },
  canvas: { width: 1280, height: 720 },
  world: { width: 1800, height: 720, killY: 940 },
  entity: {
    player: {
      width: 40,
      height: 72,
      color: "#00ff88",
      flashColor: "#f4fff8",
      spriteOffsetY: 24
    },
    enemy: { width: 96, height: 96, color: "#ff4444", flashColor: "#ffffff" },
    projectile: {
      player: { width: 10, height: 6, color: "#ffd700" },
      enemy: { width: 8, height: 6, color: "#ff8800" }
    },
    pickup: { width: 28, height: 28, color: "#00cfff" }
  },
  player: {
    maxHealth: 100,
    maxLives: 5,
    speed: 260,
    jumpForce: -560,
    gravity: 1350,
    jetpackForce: 2000,
    jetpackDrain: 30,
    jetpackRegen: 18,
    shootCooldown: 0.16,
    dropThroughDuration: 0.18,
    dropDownVelocity: 220
  },
  enemy: {
    gravity: 1300,
    maxHealth: 100,
    speed: 95,
    shootRange: 420,
    shootCooldown: 0.5,
    damage: 5,
    difficultyStepEveryKills: 4,
    maxDifficultyStep: 3,
    jumpForce: -480,
    jumpCooldownMin: 2.5,
    jumpCooldownMax: 5.0
  },
  projectile: {
    playerSpeed: 760,
    enemySpeed: 480,
    life: 1.4,
    knockback: 420
  },
  weapons: {
    types: ["pistol", "rifle", "smg", "machinegun", "rocket"],
    magSize: { pistol: 12, rifle: 20, smg: 30, machinegun: 40, rocket: 1 },
    reloadTime: { pistol: 0.9, rifle: 1.05, smg: 1.1, machinegun: 1.25, rocket: 1.4 },
    reserveAmmo: { pistol: 36, rifle: 80, smg: 120, machinegun: 160, rocket: 10 }
  },
  controls: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", jetpack: "Space", pause: "Escape" },
  maps: {
    space: {
      id: "space",
      name: "Space",
      targetKills: 15,
      description: "Balanced open platforms over a hot star surface.",
      theme: { bgTop: "#1d1742", bgBottom: "#37170f", platform: "#9fd2e8" },
      spawn: { x: 620, y: 288 },
      platforms: [
        { x: 580, y: 360, width: 450, height: 120 },
        { x: 250, y: 480, width: 260, height: 120 },
        { x: 1080, y: 480, width: 260, height: 120 },
        { x: 260, y: 210, width: 300, height: 120 },
        { x: 1060, y: 210, width: 300, height: 120 }
      ]
    },
    jungle: {
      id: "jungle",
      name: "Jungle",
      targetKills: 20,
      description: "Dense layered platforms for close skirmishes.",
      theme: { bgTop: "#1b3a2d", bgBottom: "#4d5e2c", platform: "#9f7d41" },
      spawn: { x: 1100, y: 200 },
      platforms: [
        { x: 480, y: 180, width: 1000, height: 60 },
        { x: 1100, y: 365, width: 360, height: 60 },
        { x: 300, y: 365, width: 360, height: 60 },
        { x: 950, y: 525, width: 500, height: 60 }
      ]
    },
    canyon: {
      id: "canyon",
      name: "Canyon",
      targetKills: 25,
      description: "Narrow central arena with high-risk edge play.",
      theme: { bgTop: "#7f5e3e", bgBottom: "#b18859", platform: "#7a5a3a" },
      spawn: { x: 690, y: 258 },
      platforms: [
        { x: 500, y: 330, width: 600, height: 30 },
        { x: 400, y: 500, width: 500, height: 30 },
        { x: 1200, y: 600, width: 400, height: 30 },
      ]
    }
  }
};
