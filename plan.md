# Player Sprite Animation Implementation Plan

## Context

The existing player uses a single sprite sheet (`spartan-sheet.png`) with row/column frame selection.
The new sprites follow the **enemy pattern**: one PNG per state+direction, each animated horizontally.

All 6 new player sprites are **240×48 px** → **5 frames of 48×48 px** each.

```
assets/sprites/player/
  flying_left.png          (240×48)  5 frames
  flying_right.png         (240×48)  5 frames
  running_facing_left.png  (240×48)  5 frames
  running_facing_right.png (240×48)  5 frames
  shooting_left.png        (240×48)  5 frames
  shooting_right.png       (240×48)  5 frames
```

---

## Step 1 — Register new assets in `js/main.js`

Add 6 entries to the `assetManifest` array (lines 22-60), after the existing player entries:

```js
{ key: "player-running-left",  src: "assets/sprites/player/running_facing_left.png",  type: "image" },
{ key: "player-running-right", src: "assets/sprites/player/running_facing_right.png", type: "image" },
{ key: "player-flying-left",   src: "assets/sprites/player/flying_left.png",          type: "image" },
{ key: "player-flying-right",  src: "assets/sprites/player/flying_right.png",         type: "image" },
{ key: "player-shooting-left", src: "assets/sprites/player/shooting_left.png",        type: "image" },
{ key: "player-shooting-right",src: "assets/sprites/player/shooting_right.png",       type: "image" },
```

---

## Step 2 — Update initial sprite component in `js/player.js`

Find the `.addComponent("sprite", createSprite({...}))` call (~line 81) and replace its values:

```js
.addComponent(
  "sprite",
  createSprite({
    type: "sprite",
    assetKey: "player-running-right",   // default starting asset
    frameWidth: 48,
    frameHeight: 48,
    numFrames: 5,
    animationSpeed: 0.1,
    scale: 3,
    noFlip: true,
    color: GAME_CONST.entity.player.color,
    offsetY: 0,
  })
)
```

---

## Step 3 — Rewrite sprite state logic in `player.update()` (`js/player.js`)

Replace the entire block that currently sets `sprite.assetKey`, `frameY`, `frameX`, `numFrames`,
`animationSpeed` (approximately lines 276-328) with the following logic:

```js
const sprite = this.entity.getComponent("sprite");
if (sprite) {
  const isShooting  = this.shootTimer > 0;
  const facingLeft  = this.facing === -1;
  const isFlying    = this.state === "jetpack";
  const isMoving    = ["running", "jumping", "falling"].includes(this.state);

  // Determine the correct asset key based on state priority:
  // shooting > flying > running/jumping/falling > idle (reuse running, frame 0)
  let nextAssetKey;
  if (isShooting) {
    nextAssetKey = facingLeft ? "player-shooting-left" : "player-shooting-right";
  } else if (isFlying) {
    nextAssetKey = facingLeft ? "player-flying-left" : "player-flying-right";
  } else {
    // running, jumping, falling, and idle all use the running sprite
    nextAssetKey = facingLeft ? "player-running-left" : "player-running-right";
  }

  // Reset animation when switching state
  if (sprite.assetKey !== nextAssetKey) {
    sprite.assetKey       = nextAssetKey;
    sprite.currentFrame   = 0;
    sprite.animationTimer = 0;
  }

  // Frame & speed config
  sprite.type          = "sprite";
  sprite.noFlip        = true;
  sprite.frameX        = 0;
  sprite.frameY        = 0;
  sprite.frameWidth    = 48;
  sprite.frameHeight   = 48;
  sprite.scale         = 3;

  if (isShooting) {
    sprite.numFrames      = 5;
    sprite.animationSpeed = 0.08;   // faster when shooting
  } else if (isFlying) {
    sprite.numFrames      = 5;
    sprite.animationSpeed = 0.1;
  } else if (isMoving) {
    sprite.numFrames      = 5;
    sprite.animationSpeed = 0.1;
  } else {
    // idle — freeze on first frame
    sprite.numFrames      = 1;
    sprite.animationSpeed = 0.12;
  }

  // Keep currentFrame in bounds after numFrames change
  sprite.currentFrame %= sprite.numFrames;

  // Flash color when invulnerable
  sprite.color =
    this.invulnTimer > 0
      ? GAME_CONST.entity.player.flashColor
      : GAME_CONST.entity.player.color;
}
```

---

## Step 4 — Verify `RenderSystem` draws frames correctly

`js/systems/RenderSystem.js` already computes the source X as:

```js
const frameX = (sprite.frameX + sprite.currentFrame) * sprite.frameWidth;
const frameY = sprite.frameY * sprite.frameHeight;
```

With the new sprites:
- `sprite.frameX = 0` (always start from column 0)
- `sprite.frameY = 0` (all sprites are single-row)
- `sprite.currentFrame` walks 0 → 4

**No changes needed in `RenderSystem.js`** — the existing logic handles it correctly.

---

## Step 5 — Clean up old sprite fields in `js/player.js`

Remove the following local variables that belong to the old row/column system:
- `frameY`, `leftFrameX`, `rightFrameX` local variables inside `player.update()`
- Any remaining reference to `assetKey: "player-spartan"`
- `sprite.gunColor = null` (no longer needed)

---

## Player State → Asset Key Mapping (Summary)

| Player State        | Facing | Asset Key               | Frames | Speed |
|---------------------|--------|-------------------------|--------|-------|
| idle                | left   | player-running-left     | 1      | 0.12  |
| idle                | right  | player-running-right    | 1      | 0.12  |
| running             | left   | player-running-left     | 5      | 0.10  |
| running             | right  | player-running-right    | 5      | 0.10  |
| jumping             | left   | player-running-left     | 5      | 0.10  |
| jumping             | right  | player-running-right    | 5      | 0.10  |
| falling             | left   | player-running-left     | 5      | 0.10  |
| falling             | right  | player-running-right    | 5      | 0.10  |
| jetpack             | left   | player-flying-left      | 5      | 0.10  |
| jetpack             | right  | player-flying-right     | 5      | 0.10  |
| shooting (any)      | left   | player-shooting-left    | 5      | 0.08  |
| shooting (any)      | right  | player-shooting-right   | 5      | 0.08  |

> **Priority:** shooting > flying (jetpack) > running/jumping/falling > idle

---

## Files to Change

| File                          | Change                                           |
|-------------------------------|--------------------------------------------------|
| `js/main.js`                  | Add 6 new asset entries to `assetManifest`       |
| `js/player.js`                | Update initial `createSprite()` call             |
| `js/player.js`                | Replace sprite state block in `player.update()`  |
| `js/systems/RenderSystem.js`  | No changes needed                                |
