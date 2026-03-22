# Level 4 — Boss Arena Integration Plan

## Context

The game follows a consistent per-map pattern:
1. A map entry in `GAME_CONST.maps` in `js/constants.js` (platforms, spawn, targetKills, theme)
2. The map ID added to `this.maps[]` in `js/game.js`
3. Asset keys registered in `assetManifest` in `js/main.js`
4. `updateMapPreview()` in `js/game.js` handles image swaps on the selection screen
5. `PlatformManager.draw()` in `js/platform.js` picks the platform image by `currentMap.id`
6. `Hud.draw()` in `js/hud.js` picks the HUD background by `currentMapId`
7. Unlock logic already exists via `unlockMap()` called inside `registerKill()` when kills >= targetKills

The boss level follows these same patterns exactly.

### New Assets Available (`assets/finalboss/`)
- `bossplatform.png` — platform tile image
- `bossterrain.jpeg` — scrolling background
- `gameinfo_lava.png` — level-info card graphic
- `gamepaused.png` — pause screen card
- `info.png` — HUD background panel
- `modalblur.jpg` — modal overlay blur
- `ok.png` — ok button
- `pause.jpg` — pause button
- `restart.png` — restart button
- `resume.png` — resume button
- `returntomainmenu.png` — back-to-menu button
- `scoreboard.png` — scoreboard overlay panel

### New Select-Map Assets (`assets/select_map/`)
- `Selectboss.png` — unlocked boss map preview card ("LEVEL 4: BOSS")
- `lockboss.png` — locked boss map card ("Complete level 3 to unlock this map")

---

## Step 1 — Register Boss Assets in `js/main.js`

**File:** `js/main.js`
**Action:** Insert after the last `assetManifest` entry (before the closing `];`):

```js
// --- Level 4: Boss / Final Boss Assets ---
{ key: "platform-boss",       src: "assets/finalboss/bossplatform.png",        type: "image" },
{ key: "bg-boss",             src: "assets/finalboss/bossterrain.jpeg",         type: "image" },
{ key: "info-boss",           src: "assets/finalboss/gameinfo_lava.png",        type: "image" },
{ key: "pause-bg-boss",       src: "assets/finalboss/gamepaused.png",           type: "image" },
{ key: "hud-bg-boss",         src: "assets/finalboss/info.png",                 type: "image" },
{ key: "pause-boss",          src: "assets/finalboss/pause.jpg",                type: "image" },
{ key: "resume-boss",         src: "assets/finalboss/resume.png",               type: "image" },
{ key: "restart-boss",        src: "assets/finalboss/restart.png",              type: "image" },
{ key: "return-boss",         src: "assets/finalboss/returntomainmenu.png",     type: "image" },
{ key: "ok-boss",             src: "assets/finalboss/ok.png",                   type: "image" },
{ key: "scoreboard-boss",     src: "assets/finalboss/scoreboard.png",           type: "image" },
{ key: "modalblur-boss",      src: "assets/finalboss/modalblur.jpg",            type: "image" },
```

---

## Step 2 — Add the `boss` Map to `GAME_CONST` in `js/constants.js`

**File:** `js/constants.js`
**Action:** Insert inside the `maps` object after the last existing map entry (e.g. after the `canyon` closing `}`):

```js
boss: {
  id: "boss",
  name: "Boss Arena",
  targetKills: 30,
  description: "The final battle. Survive the lava arena and destroy the boss forces.",
  theme: { bgTop: "#1a0000", bgBottom: "#6b1a00", platform: "#4a1500" },
  spawn: { x: 860, y: 258 },
  platforms: [
    // Central wide platform — main fighting ground
    { x: 490, y: 330, width: 760, height: 35 },
    // Left elevated ledge
    { x: 180, y: 200, width: 280, height: 35 },
    // Right elevated ledge
    { x: 1340, y: 200, width: 280, height: 35 },
    // Lower left pit platform
    { x: 100, y: 500, width: 320, height: 35 },
    // Lower right pit platform
    { x: 1380, y: 500, width: 320, height: 35 },
    // Far left wall shelf (jetpack reachable)
    { x: 20, y: 90, width: 200, height: 35 },
    // Far right wall shelf (jetpack reachable)
    { x: 1580, y: 90, width: 200, height: 35 },
  ]
}
```

> Platform layout spans the full 1800px world width. The tall vertical spread forces jetpack use. **Adjust `x/y/width` values after testing against `bossterrain.jpeg`** to align platforms with the painted terrain.

---

## Step 3 — Register `boss` in the Maps Array in `js/game.js`

**File:** `js/game.js`
**Action:** Find `this.maps = ["space", "jungle", "canyon"];` and change to:

```js
this.maps = ["space", "jungle", "canyon", "boss"];
```

This is the only ordering change needed. `advanceLevel()` and `shiftMap()` automatically support the new entry. `registerKill()` already calls `unlockMap(maps[mapIndex + 1])` when a level is won — completing canyon (`mapIndex 2`) will unlock boss (`mapIndex 3`) with no further logic changes.

---

## Step 4 — Update `updateMapPreview()` in `js/game.js`

**File:** `js/game.js` — method `updateMapPreview()`

### Branch 1 — Background frame image

Replace the `frameImg.src` assignment block with:

```js
const frameImg = document.getElementById("map-select-bg-frame");
if (frameImg) {
  if (this.currentMapId === "boss") {
    frameImg.src = `assets/select_map/Selectboss.png`;
  } else {
    let assetName = this.currentMapId;
    if (assetName === "canyon") assetName = "lava";
    frameImg.src = `assets/sprites/ui/selectmap${assetName}.png`;
  }
}
```

### Branch 2 — Preview card image (locked vs. unlocked)

```js
const previewImg = document.getElementById("map-preview-img");
const isLocked = !this.unlockedMaps.includes(this.currentMapId);

if (previewImg) {
  if (this.currentMapId === "boss") {
    if (isLocked) {
      previewImg.src = `assets/select_map/lockboss.png`;
    } else {
      previewImg.src = `assets/select_map/Selectboss.png`;
    }
  } else {
    let assetName = this.currentMapId;
    if (assetName === "canyon") assetName = "lava";
    if (isLocked) {
      previewImg.src = `assets/select_map/lock${assetName}.jpg`;
    } else {
      previewImg.src = `assets/select_map/${assetName}_selectmap.jpg`;
    }
  }
}
```

### Branch 3 — Level info and level info background

```js
const levelInfoImg = document.getElementById("level-info-img");
const levelInfoBg  = document.getElementById("level-info-bg");
if (levelInfoImg) {
  let infoAsset = `assets/space/gameinfo_space.png`;
  if (this.currentMapId === "jungle") infoAsset = `assets/jungle/gameinfo_jungle.png`;
  if (this.currentMapId === "canyon") infoAsset = `assets/lava/gameinfo_lava.png`;
  if (this.currentMapId === "boss")   infoAsset = `assets/finalboss/gameinfo_lava.png`;
  levelInfoImg.src = infoAsset;
}
if (levelInfoBg) {
  let bgAsset = `assets/space/terrainspace.jpg`;
  if (this.currentMapId === "jungle") bgAsset = `assets/jungle/terrainjungle.jpg`;
  if (this.currentMapId === "canyon") bgAsset = `assets/lava/terrainlava.jpg`;
  if (this.currentMapId === "boss")   bgAsset = `assets/finalboss/bossterrain.jpeg`;
  levelInfoBg.src = bgAsset;
}
```

At the end of `updateMapPreview()`, call the two new helpers from Steps 8 and 9:

```js
this.updatePauseScreen();
this.updateEndScreens();
```

---

## Step 5 — Update `drawBackground()` in `js/game.js`

**File:** `js/game.js` — method `drawBackground()`
**Action:** Add boss case alongside the existing three map cases:

```js
if (this.currentMapId === "space")  bgImg = assets.get("bg-space");
if (this.currentMapId === "jungle") bgImg = assets.get("bg-jungle");
if (this.currentMapId === "canyon") bgImg = assets.get("bg-canyon");
if (this.currentMapId === "boss")   bgImg = assets.get("bg-boss");    // ADD THIS
```

The fallback gradient reads from `GAME_CONST.maps[this.currentMapId].theme` dynamically, so the boss `theme.bgTop`/`bgBottom` values from Step 2 handle the gradient fallback automatically — no further change needed.

---

## Step 6 — Update `PlatformManager.draw()` in `js/platform.js`

**File:** `js/platform.js` — method `draw()`
**Action:** Add the boss branch to the platform image selection block:

```js
if (this.currentMap.id === "space") {
  img = this.assets.get("platform-space");
} else if (this.currentMap.id === "jungle") {
  img = (i % 2 === 0) ? this.assets.get("platform-jungle-1") : this.assets.get("platform-jungle-2");
} else if (this.currentMap.id === "canyon") {
  img = this.assets.get("platform-canyon");
} else if (this.currentMap.id === "boss") {       // ADD THIS BLOCK
  img = this.assets.get("platform-boss");
}
```

---

## Step 7 — Update `Hud.draw()` for Boss HUD Background in `js/hud.js`

**File:** `js/hud.js` — method `draw()`
**Action:** Add the boss case to the hudBgKey selection:

```js
let hudBgKey = "hud-bg-space";
if (game.currentMapId === "jungle") hudBgKey = "hud-bg-space"; // jungle reuses space hud
if (game.currentMapId === "canyon") hudBgKey = "hud-bg-lava";
if (game.currentMapId === "boss")   hudBgKey = "hud-bg-boss";  // ADD THIS
```

---

## Step 8 — Add `updatePauseScreen()` Helper to `js/game.js`

**File:** `js/game.js`
**Action:** Add this new method to the `Game` class. It dynamically swaps the pause screen images to match the active map:

```js
updatePauseScreen() {
  const assetPaths = {
    space:  { card: "assets/space/gamepaused.png",     resume: "assets/space/resume.png",
              restart: "assets/space/restart.png",     back: "assets/space/returntomainmenu.png" },
    jungle: { card: "assets/jungle/gamepaused.png",    resume: "assets/jungle/resume.png",
              restart: "assets/jungle/restart.png",    back: "assets/jungle/returntomainmenu.png" },
    canyon: { card: "assets/lava/gamepaused.png",      resume: "assets/lava/resume.png",
              restart: "assets/lava/restart.png",      back: "assets/lava/returntomainmenu.png" },
    boss:   { card: "assets/finalboss/gamepaused.png", resume: "assets/finalboss/resume.png",
              restart: "assets/finalboss/restart.png", back: "assets/finalboss/returntomainmenu.png" }
  };
  const set     = assetPaths[this.currentMapId] || assetPaths.space;
  const card    = document.querySelector(".pause-card-bg");
  const resume  = document.querySelector("#btn-resume img");
  const restart = document.querySelector("#btn-restart img");
  const back    = document.querySelector("#btn-main img");
  if (card)    card.src    = set.card;
  if (resume)  resume.src  = set.resume;
  if (restart) restart.src = set.restart;
  if (back)    back.src    = set.back;
}
```

---

## Step 9 — Add `updateEndScreens()` Helper to `js/game.js`

**File:** `js/game.js`
**Action:** Add this new method to the `Game` class. It applies the boss `scoreboard.png` as the scoreboard panel background when level 4 is active:

```js
updateEndScreens() {
  const sbVictory = document.getElementById("scoreboard-victory");
  const sbDefeat  = document.getElementById("scoreboard-defeat");
  const bossStyle = "background-image: url('assets/finalboss/scoreboard.png'); background-size: contain; background-repeat: no-repeat; padding: 40px 60px;";
  const clearStyle = "";
  if (sbVictory) sbVictory.style.cssText = this.currentMapId === "boss" ? bossStyle : clearStyle;
  if (sbDefeat)  sbDefeat.style.cssText  = this.currentMapId === "boss" ? bossStyle : clearStyle;
}
```

---

## Step 10 — `btn-victory-next` Logic for Boss Level (Final Map)

**File:** `js/game.js`

The existing handler already handles the last map correctly:

```js
document.getElementById("btn-victory-next").addEventListener("click", () => {
  if (this.mapIndex < this.maps.length - 1) {
    this.setState("upgrade");
  } else {
    this.backToMainMenu();  // called when boss is beaten — no next level
  }
});
```

**No change needed** — when boss is the final map (`mapIndex === 3 === maps.length - 1`), clicking Next routes to `backToMainMenu()` automatically.

---

## Step 11 — Enemy Spawning (30 kills)

**No changes needed to `js/enemy.js`.** The `EnemyManager` reads `killTarget` from `game:scoreChanged` events. Setting `targetKills: 30` in the boss map constant (Step 2) propagates automatically through `initializeMission()` and `registerKill()`. Enemies are wave-spawned using the boss map's platforms array from Step 2 — same rules as all other levels.

---

## Step 12 — localStorage Persistence (Optional but Recommended)

**File:** `js/game.js`
**Why:** Without this, boss unlock resets on page refresh.

In `unlockMap()`:

```js
unlockMap(mapId) {
  if (!this.unlockedMaps.includes(mapId)) {
    this.unlockedMaps.push(mapId);
    localStorage.setItem("vanguard-unlocked-maps", JSON.stringify(this.unlockedMaps));
  }
}
```

In the constructor (after initializing `this.unlockedMaps`):

```js
const savedMaps = localStorage.getItem("vanguard-unlocked-maps");
if (savedMaps) {
  try {
    const parsed = JSON.parse(savedMaps);
    for (const mapId of parsed) this.unlockMap(mapId);
  } catch (e) { /* ignore corrupt saves */ }
}
```

---

## Unlock Flow Summary

1. Player starts with `unlockedMaps = ["space"]`
2. Win space → `unlockMap("jungle")` called
3. Win jungle → `unlockMap("canyon")` called
4. Win canyon → `unlockMap("boss")` called
5. `updateMapPreview()` switches from `lockboss.png` to `Selectboss.png`
6. `confirmMap` handler allows entering boss level
7. Beating boss → `btn-victory-next` routes to `backToMainMenu()` (end of game)

---

## Files to Change — Summary

| File | Change |
|---|---|
| `js/main.js` | Add 12 boss asset entries to `assetManifest` |
| `js/constants.js` | Add `boss` map definition (7 platforms, `targetKills: 30`, spawn, theme) |
| `js/game.js` | Add `"boss"` to `this.maps` array |
| `js/game.js` | Extend `updateMapPreview()` with boss branches (frame, preview card, levelInfo, levelInfoBg) |
| `js/game.js` | Add `if (this.currentMapId === "boss") bgImg = assets.get("bg-boss")` in `drawBackground()` |
| `js/game.js` | Add `updatePauseScreen()` method, call from `updateMapPreview()` |
| `js/game.js` | Add `updateEndScreens()` method, call from `updateMapPreview()` |
| `js/game.js` | Add `localStorage` read/write for unlock persistence (optional) |
| `js/platform.js` | Add `else if (this.currentMap.id === "boss")` branch in `draw()` |
| `js/hud.js` | Add `if (game.currentMapId === "boss") hudBgKey = "hud-bg-boss"` |
