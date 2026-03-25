# Level 5 Enemy Integration Plan

## Overview

Integrate a regular enemy for the `laboratory` (level 5) map. No stat limitations — enemy is intentionally strong. Spawn is hard-capped at **4 enemies max** to avoid crowding. Uses the sprites in `assets/sprites/level-5-enemy/`.

---

## Files to Modify

| File | What Changes |
|---|---|
| `js/main.js` | Add 4 sprite entries to `assetManifest` |
| `js/enemy.js` | Add sprite routing, stat override, remove lab early-return, enforce 4-cap |
| `js/constants.js` | Add `level5enemy` stats block |

---

## Step-by-Step Implementation

### Step 1 — Register sprites in `main.js`

Add after the level-4 entries in `assetManifest`:

```js
// Level 5 (laboratory) enemy sprites
{ key: "enemy-l5-left",          src: "assets/sprites/level-5-enemy/level_5-enemy_facing_left.png",    type: "image" },
{ key: "enemy-l5-right",         src: "assets/sprites/level-5-enemy/level_5-enemy_facing_right.png",   type: "image" },
{ key: "enemy-l5-left-shooting", src: "assets/sprites/level-5-enemy/level_5-enemy-shooting_left.png",  type: "image" },
{ key: "enemy-l5-right-shooting",src: "assets/sprites/level-5-enemy/level_5-enemy_shooting_right.png", type: "image" },
```

---

### Step 2 — Add `level5enemy` stats in `constants.js`

Add after the `enemy` block in `GAME_CONST`:

```js
level5enemy: {
  maxHealth: 220,
  speed: 130,
  shootRange: 560,
  shootCooldown: 0.32,
  damage: 14,
  threatDamageBonusPerScale: 10,
  color: "#ff2222"
}
```

Stats are elevated on purpose (no limitations requested).

---

### Step 3 — Add sprite routing in `enemy.js` → `getEnemyAssetKeys()`

Add before the default return:

```js
if (mapId === "laboratory") {
  return {
    left: "enemy-l5-left",
    right: "enemy-l5-right",
    leftShooting: "enemy-l5-left-shooting",
    rightShooting: "enemy-l5-right-shooting"
  };
}
```

---

### Step 4 — Add `statOverride` to `Enemy` constructor

Change constructor signature:
```js
constructor(entityManager, x, y, patrolWidth = 180, type = "rival", statOverride = null)
```

Resolve stats in constructor body:
```js
const stats = statOverride || GAME_CONST.enemy;
```

Use `stats.maxHealth`, `stats.speed`, `stats.damage`, etc. throughout. Store on `ai` for use in `update()`:
```js
ai.statOverride = statOverride;
```

---

### Step 5 — Update `spawnFromPlatforms()` to accept `mapId`

```js
spawnFromPlatforms(platforms, mapId) {
  // ...existing spawn logic...
  const statOverride = mapId === "laboratory" ? GAME_CONST.level5enemy : null;
  this.enemies.push(new Enemy(this.entityManager, x, y, patrolWidth, "rival", statOverride));
  this.totalSpawned += 1;
}
```

---

### Step 6 — Remove the laboratory early-return in `EnemyManager.reset()`

Remove this line:
```js
if (mapId === "laboratory") return;   // DELETE THIS
```

Update the seed loop to pass `mapId`:
```js
for (let i = 0; i < 3; i += 1) this.spawnFromPlatforms(platforms, mapId);
```

---

### Step 7 — Enforce the 4-enemy hard cap in `EnemyManager.update()`

```js
const rawDynamicMax = this.maxActive +
  difficultyStep * GAME_CONST.enemy.threatExtraActivePerStep;
const dynamicMaxActive = deps.currentMapId === "laboratory"
  ? Math.min(4, rawDynamicMax)
  : rawDynamicMax;
```

Also update the spawn call to pass `mapId`:
```js
this.spawnFromPlatforms(deps.platforms, deps.currentMapId);
```

---

## Implementation Order

1. `constants.js` — Add `level5enemy` stats block
2. `main.js` — Add 4 asset manifest entries
3. `enemy.js` — Add `laboratory` branch to `getEnemyAssetKeys()`
4. `enemy.js` — Add `statOverride` param to `Enemy` constructor + `update()`
5. `enemy.js` — Update `spawnFromPlatforms()` to accept and use `mapId`
6. `enemy.js` — Remove early-return guard in `reset()`; update seed loop
7. `enemy.js` — Apply 4-cap in `update()`; pass `currentMapId` to spawn call

---

## Sprite Reference

| Asset Key | File |
|---|---|
| `enemy-l5-left` | `level_5-enemy_facing_left.png` |
| `enemy-l5-right` | `level_5-enemy_facing_right.png` |
| `enemy-l5-left-shooting` | `level_5-enemy-shooting_left.png` |
| `enemy-l5-right-shooting` | `level_5-enemy_shooting_right.png` |
