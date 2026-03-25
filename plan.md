# Final Boss Enhancement — Implementation Plan

> **For Codex:** Execute sections in the order listed (Section 1 → Section 3 → Section 2). Each step shows exact file, line(s), and before/after code.

---

## Section 1 — `js/constants.js` (all stat tuning)

### Step 1.1 — Raise max HP: 500 → 1000
**Line 63**
```js
// Before
    maxHealth: 500,
// After
    maxHealth: 1000,
```

### Step 1.2 — Increase movement speed: 130 → 210
**Line 64**
```js
// Before
    speed: 130,
// After
    speed: 210,
```

### Step 1.3 — Extend shoot range: 650 → 900
**Line 65**
```js
// Before
    shootRange: 650,
// After
    shootRange: 900,
```

### Step 1.4 — Reduce shoot cooldown: 0.9 → 0.38 s
**Line 66**
```js
// Before
    shootCooldown: 0.9,
// After
    shootCooldown: 0.38,
```

### Step 1.5 — Increase damage per shot: 8 → 18
**Line 67**
```js
// Before
    damage: 8,
// After
    damage: 18,
```

### Step 1.6 — Increase hover oscillation speed: 1.8 → 3.2
**Line 72**
```js
// Before
    hoverSpeed: 1.8,
// After
    hoverSpeed: 3.2,
```

### Step 1.7 — Add projectileSpeed and projectileKnockback constants
**After line 74 (`projectileColor` line), still inside the `boss: {}` block.**
```js
// Before
    color: "#cc00ff",
    projectileColor: "#ff00cc"
  },

// After
    color: "#cc00ff",
    projectileColor: "#ff00cc",
    projectileSpeed: 680,
    projectileKnockback: 1400
  },
```

### Complete resulting `boss` block for reference:
```js
  boss: {
    maxHealth: 1000,
    speed: 210,
    shootRange: 900,
    shootCooldown: 0.38,
    damage: 18,
    width: 120,
    height: 120,
    chaseYOffset: -60,
    hoverAmplitude: 18,
    hoverSpeed: 3.2,
    color: "#cc00ff",
    projectileColor: "#ff00cc",
    projectileSpeed: 680,
    projectileKnockback: 1400
  },
```

---

## Section 2 — `js/systems/HealthSystem.js`

### Step 2.1 — Boss-specific knockback multiplier in `applyEnemyDamage()`

**Lines 48-52 — replace existing multiplier block:**
```js
// Before
    const healthRatio = Math.max(0, health.health) / Math.max(1, health.maxHealth || 1);
    const multiplier = healthRatio > 0.35 ? 2.6 : 4.2;
    health.knockbackVelocityX += knockback * multiplier;
    transform.velocity.y = -320;
    health.knockbackTimer = healthRatio > 0.35 ? 0.6 : 0.95;

// After
    const isBoss = entity.hasComponent("bossAi");
    const healthRatio = Math.max(0, health.health) / Math.max(1, health.maxHealth || 1);
    const multiplier = isBoss
      ? (healthRatio > 0.35 ? 5.5 : 8.0)
      : (healthRatio > 0.35 ? 2.6 : 4.2);
    health.knockbackVelocityX += knockback * multiplier;
    transform.velocity.y = isBoss ? -480 : -320;
    health.knockbackTimer = isBoss
      ? (healthRatio > 0.35 ? 0.9 : 1.3)
      : (healthRatio > 0.35 ? 0.6 : 0.95);
```

### Step 2.2 — Remove duplicate `isBoss` declaration
**Lines 62-67 — delete the inner `const isBoss` (it is now declared above):**
```js
// Before
    if (health.health <= 0) {
      const isBoss = entity.hasComponent("bossAi");
      if (!isBoss) {
        health.health = Math.floor(GAME_CONST.enemy.maxHealth * 0.4);
      }
    }

// After
    if (health.health <= 0) {
      if (!isBoss) {
        health.health = Math.floor(GAME_CONST.enemy.maxHealth * 0.4);
      }
    }
```

---

## Section 3 — `js/boss.js`

### Step 3.1 — Add burst-fire fields to `bossAi` component (constructor, lines 42-47)
```js
// Before
      .addComponent(
        "bossAi",
        {
          shootTimer: GAME_CONST.boss.shootCooldown * 0.5,
          hoverTime: Math.random() * Math.PI * 2,
          deathFalling: false
        }
      )

// After
      .addComponent(
        "bossAi",
        {
          shootTimer: GAME_CONST.boss.shootCooldown * 0.5,
          hoverTime: Math.random() * Math.PI * 2,
          deathFalling: false,
          burstCount: 0,
          burstCooldown: 0
        }
      )
```

### Step 3.2 — Slow knockback decay and lower zero-threshold (line 85)
```js
// Before
    health.knockbackVelocityX *= 0.92;
    if (Math.abs(health.knockbackVelocityX) < 10) health.knockbackVelocityX = 0;

// After
    health.knockbackVelocityX *= 0.94;
    if (Math.abs(health.knockbackVelocityX) < 6) health.knockbackVelocityX = 0;
```

### Step 3.3 — Replace single-fire shoot block with burst-fire logic (lines 123-146)
```js
// Before
    ai.shootTimer -= deltaTime;
    const distance = Math.hypot(dx, dy);
    if (
      deps.gameState === "playing" &&
      ai.shootTimer <= 0 &&
      distance <= GAME_CONST.boss.shootRange
    ) {
      deps.projectiles.spawn(
        { x: bossCenterX, y: bossCenterY },
        { x: dx, y: dy },
        GAME_CONST.projectile.enemySpeed,
        GAME_CONST.boss.damage,
        "enemy",
        GAME_CONST.boss.projectileColor,
        750 * Math.sign(dx || 1)
      );

      const audioService = serviceLocator.get("audio");
      if (audioService) {
        audioService.playSfx("sfx-laser-gun");
      }

      ai.shootTimer = GAME_CONST.boss.shootCooldown;
    }

// After
    ai.shootTimer -= deltaTime;
    ai.burstCooldown -= deltaTime;
    const distance = Math.hypot(dx, dy);

    const BURST_SIZE = 3;
    const BURST_INTERVAL = 0.12;

    if (deps.gameState === "playing" && distance <= GAME_CONST.boss.shootRange) {
      if (ai.shootTimer <= 0 && ai.burstCount === 0) {
        ai.burstCount = BURST_SIZE;
        ai.burstCooldown = 0;
        ai.shootTimer = GAME_CONST.boss.shootCooldown;
      }

      if (ai.burstCount > 0 && ai.burstCooldown <= 0) {
        deps.projectiles.spawn(
          { x: bossCenterX, y: bossCenterY },
          { x: dx, y: dy },
          GAME_CONST.boss.projectileSpeed,
          GAME_CONST.boss.damage,
          "enemy",
          GAME_CONST.boss.projectileColor,
          GAME_CONST.boss.projectileKnockback * Math.sign(dx || 1)
        );

        const audioService = serviceLocator.get("audio");
        if (audioService) {
          audioService.playSfx("sfx-laser-gun");
        }

        ai.burstCount -= 1;
        ai.burstCooldown = BURST_INTERVAL;
      }
    }
```

---

## Summary Table

| File | Line(s) | What changes | Old | New |
|------|---------|--------------|-----|-----|
| `js/constants.js` | 63 | `boss.maxHealth` | `500` | `1000` |
| `js/constants.js` | 64 | `boss.speed` | `130` | `210` |
| `js/constants.js` | 65 | `boss.shootRange` | `650` | `900` |
| `js/constants.js` | 66 | `boss.shootCooldown` | `0.9` | `0.38` |
| `js/constants.js` | 67 | `boss.damage` | `8` | `18` |
| `js/constants.js` | 72 | `boss.hoverSpeed` | `1.8` | `3.2` |
| `js/constants.js` | after 74 | `boss.projectileSpeed` | _(new)_ | `680` |
| `js/constants.js` | after 74 | `boss.projectileKnockback` | _(new)_ | `1400` |
| `js/systems/HealthSystem.js` | 48-52 | knockback multiplier block | shared | boss-specific |
| `js/systems/HealthSystem.js` | 63 | inner `const isBoss` | present | delete |
| `js/boss.js` | 42-47 | `bossAi` init | no burst fields | add `burstCount`, `burstCooldown` |
| `js/boss.js` | 85-86 | knockback decay | `0.92`, `< 10` | `0.94`, `< 6` |
| `js/boss.js` | 123-146 | shoot block | single-fire | burst-fire (3 shots) |
