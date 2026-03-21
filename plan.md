# Vanguard Ops — Gameplay Integration Plan
## Phase 1: Hitbox-Only Gameplay (Sprites Later)

**Goal:** Wire all existing game logic into a fully playable session using only colored rectangle hitboxes. No sprite rendering yet — sprites get layered in Phase 2.

---

## Current State Assessment

The game already has all core systems built:
- Player movement, jumping, jetpack, shooting (`player.js`)
- Enemy AI, patrol, shooting, difficulty scaling (`enemy.js`)
- Physics, gravity, platform collision (`PhysicsSystem`, `CollisionSystem`)
- Projectile lifecycle and hit resolution (`projectile.js`, `game.js`)
- Health, damage, knockback, death (`HealthSystem`)
- Pickups, weapon swapping, ammo (`pickup.js`, `weapon.js`)
- HUD (lives, kills, ammo, reticle, timer) (`hud.js`)
- Camera follow with world clamping (`CameraService`)
- Full game state machine: main → map-select → playing → victory/defeat (`game.js`)

The `RenderSystem` already falls back to colored rectangles when no sprite asset is set — this is the hitbox mode we'll use.

---

## Phase 1 — Hitbox-Only Integration

### Step 1: Audit the Game Start Flow

Trace what happens when the player clicks **Start** from the map select screen:

1. `game.js → setState("playing")` is called
2. `startGame(mapId)` must:
   - Reset kill counter, timer, difficulty
   - Spawn the player at the map's spawn point
   - Initialize `EnemyManager` (spawn queue, cooldown reset)
   - Reset `PickupManager` (platforms seeded with pickups)
   - Reset `WeaponSystem` (default weapon + ammo)
   - Reset `HUD` state
   - Clear all entities except player

**Action:** Read `game.js` `startGame()` and `setState()` to confirm all of the above is wired. Identify any missing resets or initialization calls.

---

### Step 2: Strip Sprites — Force Hitbox Rendering

The `RenderSystem.drawByTag()` already draws a colored `fillRect` when the asset is missing. To make this explicit and reliable during Phase 1, add a global **debug flag** that bypasses sprite lookup entirely.

**Where:** `js/constants.js` (or top of `game.js`)

```js
// Phase 1: hitbox-only mode
export const DEBUG_HITBOX_ONLY = true;
```

**In `RenderSystem.js`**, skip asset drawing when the flag is set:

```js
// Before attempting spritesheet draw:
if (!DEBUG_HITBOX_ONLY && sprite && sprite.assetKey) {
  // ... existing sprite draw logic
} else {
  // fallback colored rect (already exists)
  ctx.fillStyle = sprite?.color ?? "#ffffff";
  ctx.fillRect(drawX, drawY, transform.width, transform.height);
}
```

Entity debug colors (already defined in Sprite component fallbacks):
- Player → `#00ff88` (green)
- Enemy → `#ff4444` (red)
- Projectile (player) → `#ffd700` (gold)
- Projectile (enemy) → `#ff8800` (orange)
- Pickup → `#00cfff` (cyan)
- Platform → existing color per map

---

### Step 3: Verify Entity Creation on Game Start

Each entity must have a `Transform` with correct `width` and `height` so the hitbox rect draws at the right size.

Check these dimensions match what we want as placeholder hitbox sizes:

| Entity | Width | Height | File |
|---|---|---|---|
| Player | 40 | 72 | `player.js` |
| Enemy | 44 | 68 | `enemy.js` |
| Player projectile | 10 | 6 | `projectile.js` |
| Enemy projectile | 8 | 6 | `projectile.js` |
| Pickup | 28 | 28 | `pickup.js` |

If sizes are wrong or missing, fix them in the respective entity factory.

---

### Step 4: Confirm All Systems Fire During "playing" State

In `game.js` game loop, ensure these only run when `gameState === "playing"`:

- `player.update(dt)` — movement, shoot input, jetpack
- `enemyManager.update(dt)` — AI patrol, shoot, spawn
- `physicsSystem.update(dt)` — gravity, velocity integration
- `collisionSystem.update(dt)` — platform landing, world bounds
- `projectileManager.update(dt)` — lifetime, bounds removal
- `pickupManager.update(dt)` — collection detection
- `particleSystem.update(dt)` — effects
- `resolveProjectileHits()` — damage resolution
- `healthSystem.update(dt)` — invulnerability timers, knockback
- `camera.follow(player)` — camera tracking
- `hud.draw()` — HUD overlay

**Action:** Read the main game loop block and confirm each system call is present and guarded by the playing state check.

---

### Step 5: Verify Win / Lose Conditions

- **Victory:** Kill counter reaches `GAME_CONST.objective.targetKills` (15) → `setState("victory")`
- **Defeat:** Player lives reaches 0 → `setState("defeat")`
- **Fall death:** Player `y > killY (940)` → lose 1 life → respawn or defeat
- **Enemy fall death:** Enemy `y > killY` → increment kill counter

**Action:** Confirm `entity:death` event handling in `game.js` triggers the correct state transition. Confirm respawn logic resets position to spawn point and grants invulnerability.

---

### Step 6: Smoke Test Checklist

Run the game and verify each of these works with hitboxes only:

- [ ] Main menu → Rules → Map select → Resources → Playing transition works
- [ ] Player spawns as green rectangle at correct spawn point
- [ ] Player moves left/right (A/D), faces correct direction
- [ ] Player jumps (W), lands on platforms
- [ ] Jetpack activates (hold Space in air), fuel drains and regens
- [ ] Player shoots toward mouse cursor (left click), gold projectile fires
- [ ] Enemy spawns as red rectangle on platform
- [ ] Enemy patrols back and forth
- [ ] Enemy shoots orange projectile toward player
- [ ] Player projectile hits enemy — enemy takes knockback, turns white briefly
- [ ] Enemy projectile hits player — player takes knockback, flashes
- [ ] Enemy falls off platform and dies — kill counter increments on HUD
- [ ] Player falls off map — loses 1 life — respawns
- [ ] Pickup (cyan rect) spawns on platform — player walks over it — weapon/ammo changes
- [ ] Reach 15 kills → victory screen
- [ ] Lose all 5 lives → defeat screen
- [ ] Pause (ESC) works and resume continues correctly
- [ ] Restart from pause/defeat/victory resets all state cleanly

---

### Step 7: Known Likely Issues to Fix

Based on the code review, these are the most likely gaps to close:

1. **`startGame()` may not fully reset enemy/pickup/particle state** between restarts — check for leftover entities from a previous run.

2. **Camera may not reset position** when a new game starts — ensure `camera.x` is recalculated from the new spawn point.

3. **WeaponSystem reset** — confirm default weapon is restored and ammo is refilled on `startGame()`.

4. **EnemyManager kill counter** — confirm `spawnedCount` and `killCount` reset to 0 on new game.

5. **Platform rendering without sprites** — platforms use their color field as fallback; confirm map constants define a `color` for each platform for Phase 1.

---

## Phase 2 — Player Spartan Sprite Integration

**Goal:** Replace the green hitbox player rectangle with the Spartan (Master Chief) sprite sheet located at `Adobe Express - file.png`. This plan covers the full integration: copying the asset, measuring it, wiring animation states, and enabling sprite rendering.

---

### Sprite Sheet Analysis

The file `Adobe Express - file.png` contains a single-image spritesheet with the following layout:

```
┌─────────────────────────────────────────────────────────────┐
│  ROW 0: [idle x1] — single centered frame, facing right     │
├─────────────────────────────────────────────────────────────┤
│  ROW 1: [run-left x4] [gap] [run-right x4]                  │
│          4 frames facing left │ 4 frames facing right        │
├─────────────────────────────────────────────────────────────┤
│  ROW 2: [fly+fire-left x3] [gap] [fly+fire-right x3]        │
│          3 frames flying+firing left │ 3 frames right        │
│          (character leans forward, energy blast effect)      │
├─────────────────────────────────────────────────────────────┤
│  ROW 3: [fire-left x2] [gap] [fire-right x2]                │
│          2 frames ground-firing left │ 2 frames right        │
│          (crouched, muzzle flash)                            │
└─────────────────────────────────────────────────────────────┘
```

Each frame is approximately **64 × 80 pixels**. Codex must verify actual pixel dimensions before coding by running this in the browser console after the image loads:

```js
const img = new Image();
img.onload = () => console.log(img.naturalWidth, img.naturalHeight);
img.src = "assets/sprites/player/spartan-sheet.png";
```

Then derive frame dimensions:
- `frameWidth = Math.round(imageWidth / 8)` (8 frames is the widest row)
- `frameHeight = Math.round(imageHeight / 4)` (4 rows)

---

### Animation State Mapping

The game's `playerState.state` has these values: `idle`, `running`, `jumping`, `falling`, `jetpack`.
The shoot action is tracked via `playerState.shootTimer > 0`.

Map each combination to a spritesheet row and frame range:

| Game State | isShooting | Row (frameY) | Left-facing frameX | Right-facing frameX | numFrames | Speed |
|---|---|---|---|---|---|---|
| `idle` | any | 0 | 0 | 0 | 1 | — |
| `running` | false | 1 | 0 | 4 | 4 | 0.12s |
| `running` | true | 1 | 0 | 4 | 4 | 0.12s |
| `jumping` | false | 1 | 0 | 4 | 4 | 0.15s |
| `falling` | false | 1 | 0 | 4 | 4 | 0.15s |
| `jetpack` | false | 2 | 0 | 3 | 3 | 0.10s |
| `jetpack` | true | 2 | 0 | 3 | 3 | 0.10s |
| `idle` + shooting | true | 3 | 0 | 2 | 2 | 0.08s |
| `running` + shooting | true | 3 | 0 | 2 | 2 | 0.08s |

Rules:
- When `facing === 1` (right), use right-facing frameX offset
- When `facing === -1` (left), use left-facing frameX offset (starts at 0)
- The RenderSystem must NOT flip the image for the player since we pick the correct direction from the sheet

---

### Step-by-Step Implementation

#### Step 1 — Copy the sprite sheet

Copy `Adobe Express - file.png` to `assets/sprites/player/spartan-sheet.png`.

```bash
cp "Adobe Express - file.png" assets/sprites/player/spartan-sheet.png
```

---

#### Step 2 — Register the asset in `js/main.js`

In the `assetManifest` array, add:

```js
{ key: "player-spartan", src: "assets/sprites/player/spartan-sheet.png", type: "image" },
```

---

#### Step 3 — Add `noFlip` field to `js/components/Sprite.js`

The player sprite includes both directional variants, so we must disable the RenderSystem's auto-flip. Add `noFlip = false` to the Sprite component:

```js
function createSprite({
  // ... existing fields ...
  noFlip = false
} = {}) {
  return {
    // ... existing fields ...
    noFlip,
    gunColor: null
  };
}
```

---

#### Step 4 — Update `js/systems/RenderSystem.js` to respect `noFlip`

Find the flip conditional (around line 64) and change it so it skips the flip when `sprite.noFlip` is true:

**Before:**
```js
if (sprite.flipX || (transform.facing === -1)) {
```

**After:**
```js
if (sprite.flipX || (!sprite.noFlip && transform.facing === -1)) {
```

No other changes to RenderSystem are needed.

---

#### Step 5 — Update `js/player.js` to drive the Spartan sprite

Replace the sprite update logic at the bottom of `update()` (currently around lines 275–279) with full animation state logic.

**Current code to replace:**
```js
const sprite = this.entity.getComponent("sprite");
sprite.assetKey = "player-soldier";
sprite.numFrames = 1;
sprite.color =
  this.invulnTimer > 0 ? GAME_CONST.entity.player.flashColor : GAME_CONST.entity.player.color;
```

**Replace with:**
```js
const sprite = this.entity.getComponent("sprite");
sprite.assetKey = "player-spartan";
sprite.noFlip = true;
sprite.gunColor = null; // sprite already includes gun

// --- frame dimensions (verify these match measured values) ---
sprite.frameWidth = 64;   // replace with measured value if different
sprite.frameHeight = 80;  // replace with measured value if different

const isShooting = this.shootTimer > 0;
const facingRight = this.facing === 1;

// Determine row and frame range based on state
let frameY = 0;
let leftFrameX = 0;
let rightFrameX = 0;
let numFrames = 1;
let animationSpeed = 0.12;

if (isShooting && (this.state === "idle" || this.state === "running")) {
  frameY = 3;
  leftFrameX = 0;
  rightFrameX = 2;
  numFrames = 2;
  animationSpeed = 0.08;
} else if (this.state === "jetpack") {
  frameY = 2;
  leftFrameX = 0;
  rightFrameX = 3;
  numFrames = 3;
  animationSpeed = 0.10;
} else if (this.state === "running" || this.state === "jumping" || this.state === "falling") {
  frameY = 1;
  leftFrameX = 0;
  rightFrameX = 4;
  numFrames = 4;
  animationSpeed = 0.12;
} else {
  // idle
  frameY = 0;
  leftFrameX = 0;
  rightFrameX = 0;
  numFrames = 1;
}

sprite.frameY = frameY;
sprite.frameX = facingRight ? rightFrameX : leftFrameX;
sprite.numFrames = numFrames;
sprite.animationSpeed = animationSpeed;

// Flash effect on hit — tint via color, sprite still draws
sprite.color =
  this.invulnTimer > 0 ? GAME_CONST.entity.player.flashColor : GAME_CONST.entity.player.color;
```

Also update the **initial sprite component** in `createOrResetEntity()` (around line 81) to use the new asset and set `noFlip`:

```js
.addComponent(
  "sprite",
  createSprite({
    type: "sprite",
    assetKey: "player-spartan",
    frameWidth: 64,   // verify with measured value
    frameHeight: 80,  // verify with measured value
    numFrames: 1,
    animationSpeed: 0.12,
    scale: 1.0,       // adjust if sprite renders too large/small
    noFlip: true,
    color: GAME_CONST.entity.player.color
  })
)
```

---

#### Step 6 — Enable sprite rendering in `js/constants.js`

Change `hitboxOnly` from `true` to `false`:

**Before:**
```js
debug: {
  hitboxOnly: true
},
```

**After:**
```js
debug: {
  hitboxOnly: false
},
```

---

#### Step 7 — Adjust player entity dimensions if needed

The player Transform hitbox is currently `width: 40, height: 72`. The sprite renders at `64 × 80 * scale`. The RenderSystem already centers and bottom-aligns the sprite over the hitbox (`drawX -= (drawW - transform.width) / 2` and `drawY -= (drawH - transform.height)`), so the hitbox alignment should be correct without any further change.

If the sprite appears too large or too small in game, adjust `scale` in the createSprite call (Step 5 above). A scale of `0.9` or `1.0` is recommended as a starting point.

---

### Verification Checklist

After implementing all steps above, verify:

- [ ] Spartan sprite appears in place of the green rectangle
- [ ] `idle` state shows the single standing frame (Row 0)
- [ ] `running` left shows frames from the left-side running group (Row 1, left half)
- [ ] `running` right shows frames from the right-side running group (Row 1, right half)
- [ ] Jetpack/flying state shows the energy-blast lean animation (Row 2)
- [ ] Shooting while idle/running shows the muzzle-flash firing frames (Row 3)
- [ ] No horizontal sprite flip occurs (both directions come from within the sheet)
- [ ] Hit flash still works (sprite briefly tints on damage)
- [ ] Sprite is correctly aligned with the platform — not floating or buried
- [ ] Animation cycles smoothly — no frame pop or freeze

---

### Fallback Behavior

If `player-spartan` image fails to load (missing file, typo in src), the RenderSystem will automatically fall back to drawing the green `color` rectangle. The game remains playable. This is intentional — do not remove the fallback in `RenderSystem.drawFallback()`.

---

## File Map — Where to Make Changes

| Task | File |
|---|---|
| Add `DEBUG_HITBOX_ONLY` flag | `js/constants.js` |
| Bypass sprite draw in hitbox mode | `js/systems/RenderSystem.js` |
| Audit + fix `startGame()` reset | `js/game.js` |
| Player entity dimensions + colors | `js/player.js` |
| Enemy entity dimensions + colors | `js/enemy.js` |
| Projectile dimensions + colors | `js/projectile.js` |
| Pickup dimensions + colors | `js/pickup.js` |
| Platform fallback colors per map | `js/constants.js` |
| Win/lose condition hooks | `js/game.js` |
| Camera reset on game start | `js/services/CameraService.js` |
| Copy spartan sprite sheet | `assets/sprites/player/spartan-sheet.png` |
| Register new asset key | `js/main.js` |
| Add `noFlip` field | `js/components/Sprite.js` |
| Respect `noFlip` in draw | `js/systems/RenderSystem.js` |
| Drive animation from player state | `js/player.js` |
| Enable sprite rendering | `js/constants.js` |

---

## Order of Work

1. Read `game.js` `startGame()` and the main loop — confirm what's already there
2. Add `DEBUG_HITBOX_ONLY` to `constants.js`
3. Update `RenderSystem.js` to respect the flag
4. Fix any missing resets in `startGame()` (enemy count, camera, weapon, particles)
5. Verify entity dimensions and fallback colors
6. Run smoke test checklist above
7. Fix bugs found during smoke test
8. When all checks pass → Phase 2 sprite integration begins
9. Copy `Adobe Express - file.png` → `assets/sprites/player/spartan-sheet.png`
10. Register `player-spartan` asset in `main.js`
11. Add `noFlip` to `Sprite.js`
12. Update `RenderSystem.js` flip logic for `noFlip`
13. Update `player.js` animation state driver
14. Set `hitboxOnly: false` in `constants.js`
15. Verify sprite checklist above — tune `scale` and `frameWidth/frameHeight` if needed
