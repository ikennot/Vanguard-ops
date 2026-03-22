# Enemy Jump Implementation Plan

## Architecture Summary

- **Enemy update loop** (`js/enemy.js`, `Enemy.update()`): handles AI direction patrol, knockback, shooting. Currently sets `sprite.numFrames = 4` unconditionally and picks walk/shooting asset keys. No jump state exists.
- **Physics** (`js/systems/PhysicsSystem.js`): gravity applied and position integrated for all `physics`-tagged entities (enemies included).
- **Collision** (`js/systems/CollisionSystem.js`): sets `transform.onGround = true` on landing. Enemies already have `platform-collide` tag — `transform.onGround` is accurate and usable.
- **Transform component**: has `position`, `velocity`, `onGround`, `gravity`. Everything needed for jump is already present.
- **Sprite rendering** (`js/systems/RenderSystem.js`, line 78):
  ```js
  const frameX = (sprite.frameX + sprite.currentFrame) * sprite.frameWidth;
  ```
  Setting `sprite.frameX = 1` and `sprite.numFrames = 2` displays frames 1 and 2 (0-indexed) — no RenderSystem changes needed.
- **Asset manifest** (`js/main.js`): `enemy-left` and `enemy-right` are already registered. Jump frames live in those same sheets — no new assets needed.

## Jump Trigger Strategy

Use a **periodic timer jump**: the enemy jumps every N seconds when on the ground.
- Works on all maps without platform-edge geometry
- Easy to tune
- Follows the existing `shootTimer` pattern in `enemyAi`

---

## Step 1 — Add Jump Constants to `js/constants.js`

Inside the `enemy` object, add three new fields after `maxDifficultyStep`:

```js
enemy: {
  gravity: 1300,
  maxHealth: 100,
  speed: 95,
  shootRange: 420,
  shootCooldown: 0.5,
  damage: 5,
  difficultyStepEveryKills: 4,
  maxDifficultyStep: 3,
  // --- NEW ---
  jumpForce: -480,         // upward velocity (negative = up)
  jumpCooldownMin: 2.5,    // min seconds between jumps
  jumpCooldownMax: 5.0     // max seconds between jumps
},
```

---

## Step 2 — Extend the `enemyAi` Component in `js/enemy.js`

In the `.addComponent("enemyAi", {...})` call, add two new fields:

```js
.addComponent(
  "enemyAi",
  {
    direction: -1,
    patrolMinX: x - patrolWidth * 0.5,
    patrolMaxX: x + patrolWidth * 0.5,
    shootTimer: Utils.randomRange(0.2, GAME_CONST.enemy.shootCooldown),
    shootingTimer: 0,
    type,
    // --- NEW ---
    jumpTimer: Utils.randomRange(GAME_CONST.enemy.jumpCooldownMin, GAME_CONST.enemy.jumpCooldownMax),
    isJumping: false
  }
)
```

`jumpTimer` is initialised with a random offset so enemies spawned simultaneously do not jump in sync.

---

## Step 3 — Implement Jump Logic in `Enemy.update()` (`js/enemy.js`)

### 3a — Tick the jump timer and trigger the jump

Insert this block after the knockback decay lines and before the patrol boundary check:

```js
// Jump logic
ai.jumpTimer -= deltaTime;
if (ai.jumpTimer <= 0 && transform.onGround) {
  transform.velocity.y = GAME_CONST.enemy.jumpForce;
  transform.onGround = false;
  ai.isJumping = true;
  ai.jumpTimer = Utils.randomRange(
    GAME_CONST.enemy.jumpCooldownMin,
    GAME_CONST.enemy.jumpCooldownMax
  );
}
// Clear jumping flag when landed
if (transform.onGround) {
  ai.isJumping = false;
}
```

### 3b — Update the sprite selection block

Replace the existing sprite block with:

```js
if (sprite) {
  const isShooting = ai.shootingTimer > 0;
  const isJumping  = ai.isJumping;
  const facingLeft = ai.direction === -1;

  const nextAssetKey = isShooting
    ? (facingLeft ? "enemy-left-shooting" : "enemy-right-shooting")
    : (facingLeft ? "enemy-left" : "enemy-right");

  if (sprite.assetKey !== nextAssetKey) {
    sprite.assetKey = nextAssetKey;
    sprite.currentFrame = 0;
    sprite.animationTimer = 0;
  }

  sprite.type = "sprite";
  sprite.noFlip = true;
  sprite.frameY = 0;
  sprite.color = GAME_CONST.entity.enemy.color;

  if (isShooting) {
    // Shooting: all 4 frames quickly
    sprite.frameX = 0;
    sprite.numFrames = 4;
    sprite.animationSpeed = 0.08;
  } else if (isJumping) {
    // Jump: frames 1 and 2 only
    sprite.frameX = 1;       // offset into the strip
    sprite.numFrames = 2;    // 2 frames starting at index 1
    sprite.animationSpeed = 0.12;
  } else {
    // Walk/idle: all 4 frames
    sprite.frameX = 0;
    sprite.numFrames = 4;
    sprite.animationSpeed = 0.12;
  }

  sprite.currentFrame %= sprite.numFrames;
}
```

**Frame math**: `(sprite.frameX + sprite.currentFrame) * frameWidth`
- `frameX = 1`, `currentFrame` cycles 0→1 → source X: `48` and `96` → frames 1 and 2 ✓

---

## Step 4 — No Changes Needed to Other Files

| File | Status | Reason |
|---|---|---|
| `js/systems/PhysicsSystem.js` | No change | Already applies gravity to all `physics`-tagged entities |
| `js/systems/CollisionSystem.js` | No change | Already sets `transform.onGround` for `platform-collide` entities |
| `js/systems/RenderSystem.js` | No change | `frameX` offset pattern already supports frame windowing |
| `js/main.js` | No change | `enemy-left` and `enemy-right` already registered; jump frames are in those sheets |
| `js/components/Transform.js` | No change | `onGround` and `velocity.y` already exist |

---

## Files to Change

| File | Change |
|---|---|
| `js/constants.js` | Add `jumpForce`, `jumpCooldownMin`, `jumpCooldownMax` to `GAME_CONST.enemy` |
| `js/enemy.js` | Add `jumpTimer` + `isJumping` to `enemyAi`; add jump timer logic in `update()`; update sprite block |

---

## New Variables / Constants Reference

| Name | Location | Type | Value | Purpose |
|---|---|---|---|---|
| `GAME_CONST.enemy.jumpForce` | `constants.js` | number | `-480` | Upward velocity applied on jump |
| `GAME_CONST.enemy.jumpCooldownMin` | `constants.js` | number | `2.5` | Min seconds between jumps |
| `GAME_CONST.enemy.jumpCooldownMax` | `constants.js` | number | `5.0` | Max seconds between jumps |
| `ai.jumpTimer` | `enemyAi` component | number | random [2.5, 5.0] | Countdown to next jump |
| `ai.isJumping` | `enemyAi` component | boolean | `false` | Whether enemy is airborne from a jump |

---

## Edge Cases

1. **Shooting while jumping**: `isShooting` takes sprite priority over `isJumping` — shooting animation shows mid-air. Jump state and timer remain active underneath.
2. **Knockback while in air**: `knockbackVelocityX` applies to `velocity.x` only. No interaction with jump logic.
3. **Patrol boundary reversal mid-air**: Only modifies `ai.direction` / `velocity.x`. Does not affect `velocity.y`.
4. **Spawn settling**: Initial `jumpTimer` random delay (2.5–5 s) ensures the enemy is grounded before the first jump attempt.
