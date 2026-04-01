function createHealth({
  health = 100,
  maxHealth = 100,
  lives = 0,
  maxLives = 0,
  invulnTimer = 0,
  respawnInvuln = false,
  knockbackTimer = 0,
  controlLockTimer = 0,
  knockbackVelocityX = 0,
  killCounted = false,
  wasHitByPlayer = false
} = {}) {
  return {
    health,
    maxHealth,
    lives,
    maxLives,
    invulnTimer,
    respawnInvuln,
    knockbackTimer,
    controlLockTimer,
    knockbackVelocityX,
    killCounted,
    wasHitByPlayer
  };
}

export { createHealth };
