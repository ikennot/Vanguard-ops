export const GAME_CONST = {
  canvas: { width: 1280, height: 720 },
  world: { width: 1800, height: 720, killY: 940 },
  player: {
    maxHealth: 100,
    maxLives: 5,
    speed: 260,
    jumpForce: -560,
    gravity: 1350,
    jetpackForce: 980,
    jetpackDrain: 30,
    jetpackRegen: 18,
    shootCooldown: 0.16
  },
  enemy: {
    gravity: 1300,
    maxHealth: 100,
    speed: 95,
    shootRange: 420,
    shootCooldown: 1.8,
    damage: 14,
    difficultyStepEveryKills: 4,
    maxDifficultyStep: 3
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
  objective: { targetKills: 15 },
  controls: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", jetpack: "Space", pause: "Escape" },
  maps: {
    space: {
      id: "space",
      name: "Space",
      description: "Balanced open platforms over a hot star surface.",
      theme: { bgTop: "#1d1742", bgBottom: "#37170f", platform: "#9fd2e8" },
      spawn: { x: 620, y: 296 },
      platforms: [
        { x: 580, y: 360, width: 340, height: 24 },
        { x: 250, y: 480, width: 260, height: 20 },
        { x: 1080, y: 480, width: 260, height: 20 },
        { x: 260, y: 210, width: 300, height: 20 },
        { x: 1060, y: 210, width: 300, height: 20 }
      ]
    },
    jungle: {
      id: "jungle",
      name: "Jungle",
      description: "Dense layered platforms for close skirmishes.",
      theme: { bgTop: "#1b3a2d", bgBottom: "#4d5e2c", platform: "#9f7d41" },
      spawn: { x: 700, y: 196 },
      platforms: [
        { x: 480, y: 180, width: 520, height: 22 },
        { x: 390, y: 260, width: 360, height: 22 },
        { x: 910, y: 260, width: 360, height: 22 },
        { x: 520, y: 340, width: 420, height: 22 },
        { x: 320, y: 430, width: 420, height: 22 },
        { x: 900, y: 430, width: 420, height: 22 },
        { x: 420, y: 520, width: 840, height: 24 }
      ]
    },
    canyon: {
      id: "canyon",
      name: "Canyon",
      description: "Narrow central arena with high-risk edge play.",
      theme: { bgTop: "#7f5e3e", bgBottom: "#b18859", platform: "#7a5a3a" },
      spawn: { x: 690, y: 266 },
      platforms: [
        { x: 460, y: 330, width: 560, height: 30 },
        { x: 560, y: 250, width: 190, height: 20 },
        { x: 820, y: 250, width: 190, height: 20 },
        { x: 480, y: 430, width: 170, height: 20 },
        { x: 830, y: 430, width: 170, height: 20 }
      ]
    }
  }
};
