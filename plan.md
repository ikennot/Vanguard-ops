# Plan: Replace Level 2 and Level 3 Enemy Sprite Animations

## Background and Architecture

The game has a single `Enemy` class (`js/enemy.js`) used across all maps. There are no subclasses
per level. The active map is passed to `Enemy.update()` via `deps.currentMapId`. The five maps in
order are:

  ["space", "jungle", "canyon", "warzone", "laboratory"]
   level 1   level 2   level 3   level 4    level 5

- **Level 2 map id**: `"jungle"`
- **Level 3 map id**: `"canyon"`

All sprite assets are preloaded at startup via a manifest array in `js/main.js` using
`AssetService.preload()`. Each entry has the shape `{ key, src, type }`. During gameplay,
`Enemy.update()` sets `sprite.assetKey` to a string key and `RenderSystem` looks up the image via
`assets.getImage(sprite.assetKey)`.

### Current Level-1 (space map) Asset Keys and Files

| Asset key             | Source file                                                |
|-----------------------|------------------------------------------------------------|
| `enemy-left`          | `assets/sprites/enemy/enemy-facing-left.png`               |
| `enemy-right`         | `assets/sprites/enemy/enemy-facing-right.png`              |
| `enemy-left-shooting` | `assets/sprites/enemy/enemy-facing-left-shooting.png`      |
| `enemy-right-shooting`| `assets/sprites/enemy/enemy-facing-rigth-shooting.png`     |

The sprite component fields that matter for rendering (set in `Enemy.update()`):

- `sprite.assetKey`      – which image to draw
- `sprite.frameWidth`    – pixel width of one frame on the sheet
- `sprite.frameHeight`   – pixel height of one frame on the sheet
- `sprite.numFrames`     – how many frames are animated
- `sprite.frameX`        – starting frame column offset
- `sprite.frameY`        – row index (always 0 for these enemy sheets)
- `sprite.currentFrame`  – incremented by `RenderSystem.updateAnimations()`
- `sprite.animationSpeed`– seconds per frame advance
- `sprite.noFlip`        – `true` because directional variants are separate images
- `sprite.scale`         – render scale factor (currently `2.5`)
- `sprite.offsetY`       – vertical draw offset (currently `24`)

### New Sprite Files

**Level 2 (jungle)** — directory: `assets/sprites/level-2_enemy/`

| Animation state  | Exact filename                          |
|------------------|-----------------------------------------|
| Facing left      | `level_2-enemy_facing_left.png`         |
| Facing right     | `level_2-enemy_facing_right.png`        |
| Shooting left    | `level_2-enemy-shooting_left.png`       |
| Shooting right   | `level_2-enemy_shooting_right.png`      |

**Level 3 (canyon)** — directory: `assets/sprites/level-3_enemy/`

| Animation state  | Exact filename                          |
|------------------|-----------------------------------------|
| Facing left      | `level_3-enemy-facing_left.png`         |
| Facing right     | `level_3-enemy_facing_right.png`        |
| Shooting left    | `level_3-shooting_left.png`             |
| Shooting right   | `level_3-shooting_right.png`            |

**Naming inconsistency to be aware of:**
- Level 2 uses `level_2-enemy-shooting_left.png` (hyphen before "shooting") but
  `level_2-enemy_shooting_right.png` (no hyphen before "shooting"). Copy the names exactly.
- Level 3 omits "enemy" entirely in the shooting filenames: `level_3-shooting_left.png` and
  `level_3-shooting_right.png`.

---

## Step 1 — Add New Asset Entries to the Manifest in `js/main.js`

File: `/home/kennethdomdom/projects/Vanguard-ops/js/main.js`

Locate the `assetManifest` array. After the four existing `enemy-*` entries, insert the following
eight new entries:

```js
  // Level 2 (jungle) enemy sprites
  { key: "enemy-l2-left",          src: "assets/sprites/level-2_enemy/level_2-enemy_facing_left.png",   type: "image" },
  { key: "enemy-l2-right",         src: "assets/sprites/level-2_enemy/level_2-enemy_facing_right.png",  type: "image" },
  { key: "enemy-l2-left-shooting", src: "assets/sprites/level-2_enemy/level_2-enemy-shooting_left.png", type: "image" },
  { key: "enemy-l2-right-shooting",src: "assets/sprites/level-2_enemy/level_2-enemy_shooting_right.png",type: "image" },
  // Level 3 (canyon) enemy sprites
  { key: "enemy-l3-left",          src: "assets/sprites/level-3_enemy/level_3-enemy-facing_left.png",   type: "image" },
  { key: "enemy-l3-right",         src: "assets/sprites/level-3_enemy/level_3-enemy_facing_right.png",  type: "image" },
  { key: "enemy-l3-left-shooting", src: "assets/sprites/level-3_enemy/level_3-shooting_left.png",       type: "image" },
  { key: "enemy-l3-right-shooting",src: "assets/sprites/level-3_enemy/level_3-shooting_right.png",      type: "image" },
```

No other changes to `js/main.js` are needed.

---

## Step 2 — Add a Helper to Resolve the Correct Asset Key Set in `js/enemy.js`

File: `/home/kennethdomdom/projects/Vanguard-ops/js/enemy.js`

At the top of the file, before the `class Enemy` declaration, add this pure helper function:

```js
function getEnemyAssetKeys(mapId) {
  if (mapId === "jungle") {
    return {
      left:          "enemy-l2-left",
      right:         "enemy-l2-right",
      leftShooting:  "enemy-l2-left-shooting",
      rightShooting: "enemy-l2-right-shooting"
    };
  }
  if (mapId === "canyon") {
    return {
      left:          "enemy-l3-left",
      right:         "enemy-l3-right",
      leftShooting:  "enemy-l3-left-shooting",
      rightShooting: "enemy-l3-right-shooting"
    };
  }
  // Default: level 1 (space) and all other maps
  return {
    left:          "enemy-left",
    right:         "enemy-right",
    leftShooting:  "enemy-left-shooting",
    rightShooting: "enemy-right-shooting"
  };
}
```

---

## Step 3 — Update the Sprite Selection Block in `Enemy.update()` in `js/enemy.js`

File: `/home/kennethdomdom/projects/Vanguard-ops/js/enemy.js`

Locate the sprite selection block inside `Enemy.update()`. It currently hard-codes the asset key
strings. Replace that entire `if (sprite) { ... }` block with the version below:

```js
if (sprite) {
  const isShooting = ai.shootingTimer > 0;
  const isJumping  = ai.isJumping;
  const facingLeft = ai.direction === -1;

  const keys = getEnemyAssetKeys(deps.currentMapId);

  const nextAssetKey = isShooting
    ? (facingLeft ? keys.leftShooting : keys.rightShooting)
    : (facingLeft ? keys.left         : keys.right);

  if (sprite.assetKey !== nextAssetKey) {
    sprite.assetKey = nextAssetKey;
    sprite.currentFrame = 0;
    sprite.animationTimer = 0;
  }

  sprite.type  = "sprite";
  sprite.noFlip = true;
  sprite.frameY = 0;
  sprite.color  = GAME_CONST.entity.enemy.color;

  if (isShooting) {
    sprite.frameX         = 0;
    sprite.numFrames      = 4;
    sprite.animationSpeed = 0.08;
  } else if (isJumping) {
    sprite.frameX         = 1;
    sprite.numFrames      = 2;
    sprite.animationSpeed = 0.12;
  } else {
    sprite.frameX         = 0;
    sprite.numFrames      = 4;
    sprite.animationSpeed = 0.12;
  }

  sprite.currentFrame %= sprite.numFrames;
}
```

The only structural change from the original is:
1. A call to `getEnemyAssetKeys(deps.currentMapId)` to obtain the key set for the active map.
2. The four asset key string literals replaced by `keys.left`, `keys.right`, `keys.leftShooting`,
   `keys.rightShooting`.

All animation logic (`frameX`, `numFrames`, `animationSpeed`) is identical to the existing code.

---

## Step 4 — Verify Frame Dimensions (Important)

The new sprite sheets may have different frame dimensions from the level-1 sheets
(`frameWidth: 48, frameHeight: 48`). Before finalising the implementation:

1. Open each of the eight new PNG files in an image editor and note the pixel dimensions.
2. Divide the image width by the number of animation frames to get `frameWidth`.
3. The image height is `frameHeight`.

If the dimensions differ from `48×48`, update `sprite.frameWidth` and `sprite.frameHeight`
alongside `sprite.assetKey` whenever the key changes (inside the `if (sprite.assetKey !== nextAssetKey)` branch). Example:

```js
if (sprite.assetKey !== nextAssetKey) {
  sprite.assetKey    = nextAssetKey;
  sprite.frameWidth  = /* determined per mapId */;
  sprite.frameHeight = /* determined per mapId */;
  sprite.currentFrame  = 0;
  sprite.animationTimer = 0;
}
```

If all sheets are 48×48 per frame, no change is required.

---

## Files Changed

| File | Change Summary |
|---|---|
| `js/main.js` | Add 8 new entries to `assetManifest` for level-2 and level-3 enemy sprites |
| `js/enemy.js` | Add `getEnemyAssetKeys()` helper; update sprite selection block to use it |

## Files That Do NOT Need Changes

| File | Reason |
|---|---|
| `js/systems/RenderSystem.js` | Already reads `sprite.assetKey` dynamically; no change needed |
| `js/services/AssetService.js` | Generic loader; no change needed |
| `js/constants.js` | No new constants required |
| `js/components/Sprite.js` | No new fields required |

---

## Naming Convention Summary (for reference)

Level-2 filenames use `level_2-enemy_` prefix consistently for facing, but the shooting-left file
breaks the pattern with a hyphen: `level_2-enemy-shooting_left.png` vs
`level_2-enemy_shooting_right.png`. The asset manifest entries above reflect these exact names —
do not "fix" the inconsistency; copy the filenames as-is.

Level-3 shooting filenames drop the word "enemy" entirely: `level_3-shooting_left.png` and
`level_3-shooting_right.png`. The facing files do include it: `level_3-enemy-facing_left.png`.
