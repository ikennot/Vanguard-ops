# AGENTS.md — Vanguard Ops

Guidelines for agentic coding agents (Claude Code, Copilot, Cursor, etc.) working in this repository.

---

## Project Overview

Vanguard Ops is a **vanilla HTML5 Canvas 2D side-scrolling shooter** with zero external dependencies.
No npm, no bundler, no TypeScript, no framework. All game logic lives in `js/` as plain ES6+ files
loaded via `<script>` tags in `index.html`. Sprites are in `assets/sprites/`, CSS in `css/style.css`.

---

## Running the Game

There is no build step. Serve the root directory with any static file server:

```bash
# Python (built-in)
python3 -m http.server 5500

# Node.js (if available)
npx serve .

# VS Code: use the Live Server extension (right-click index.html → Open with Live Server)
```

Then open `http://localhost:5500` in a browser.

---

## Build / Lint / Test Commands

| Task         | Command                                      |
|--------------|----------------------------------------------|
| Serve locally | `python3 -m http.server 5500`               |
| Lint (none)  | No linting tooling is configured             |
| Tests (none) | No test framework is configured              |
| Build (none) | No build step — files are used as-is         |

**There are no automated tests.** Verification is done by loading the game in a browser, navigating
through menus (main → map select → playing), and exercising game mechanics manually.

To test a specific system in isolation, temporarily add `console.log` or `debugger` statements
in the relevant `js/*.js` file and reload the browser. Remove all debug statements before committing.

---

## Script Load Order (Dependency Graph)

`index.html` loads scripts in this exact order — **do not reorder without updating `index.html`**:

```
constants.js   → global GAME_CONST (no deps)
utils.js       → window.Utils (no deps)
audio.js       → window.AudioManager
spritesheet.js → window.SpriteSheet
input.js       → window.InputHandler
physics.js     → window.Physics (uses GAME_CONST)
collision.js   → window.Collision (uses Utils)
camera.js      → window.Camera
particle.js    → window.ParticleSystem
platform.js    → window.PlatformManager (uses GAME_CONST)
projectile.js  → window.ProjectileManager (uses GAME_CONST, Physics, Collision)
weapon.js      → window.WeaponSystem (uses GAME_CONST)
pickup.js      → window.PickupManager (uses GAME_CONST, Utils)
hud.js         → window.Hud
menu.js        → window.MenuController
player.js      → window.Player (uses GAME_CONST, Utils, Physics, Collision, WeaponSystem)
enemy.js       → window.Enemy, window.EnemyManager (uses GAME_CONST, Utils, Physics)
game.js        → window.Game (uses everything above)
main.js        → bootstraps game loop (uses Game)
```

Any new file that depends on an existing module must be added **after** that module's `<script>` tag.

---

## Module / Import Style

**No ES modules (`import`/`export`).** All modules communicate via `window.*` globals:

```js
// End of each file — attach to window so later scripts can access it
window.MySystem = MySystem;
```

```js
// Usage in dependent files — reference directly (no import needed)
const manager = new MySystem(GAME_CONST);
```

Never use `import`/`export`, `require()`, or dynamic `import()`. All inter-file dependencies are
resolved through the global `window` object and script load order.

---

## Code Style

### General

- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Double quotes `"..."` for all strings
- **Semicolons:** Always present
- **Line length:** Prefer ≤ 100 characters; constants block may be wider
- **No trailing whitespace**

### Variables

- Use `const` by default; use `let` only when reassignment is needed; never use `var`
- Prefer destructuring for repeated property access: `const { x, y, width, height } = entity`

### Naming Conventions

| Construct              | Convention            | Example                          |
|------------------------|-----------------------|----------------------------------|
| Global namespaces      | `SCREAMING_SNAKE_CASE` | `GAME_CONST`, `Utils`, `Physics` |
| Classes                | `PascalCase`          | `Game`, `Player`, `EnemyManager` |
| Methods & properties   | `camelCase`           | `tryShoot()`, `takeDamage()`     |
| Local variables        | `camelCase`           | `deltaTime`, `difficultyScale`   |
| String IDs / states    | `kebab-case`          | `"weapon-crate"`, `"map-select"` |
| HTML element IDs       | `kebab-case`          | `btn-start`, `game-canvas`       |
| File names             | `kebab-case`          | `player.js`, `hud.js`            |
| Constants (config)     | Nested object keys    | `GAME_CONST.player.jumpForce`    |

### Functions and Methods

- Prefer concise single-responsibility methods (< 30 lines)
- Use arrow functions for callbacks and event listeners: `() => { ... }`
- Use `for...of` for array iteration; use indexed `for` loops only when index is needed

### Classes

- One class (or closely related pair, e.g. `Enemy` + `EnemyManager`) per file
- Constructor receives required dependencies as arguments (no global reads inside constructors
  except `GAME_CONST` and `Utils`)
- Expose a consistent `update(dt)` / `render(ctx, camera)` interface on all game-entity classes

---

## Error Handling

**No `try/catch` blocks.** The project uses defensive guard clauses instead:

```js
// Correct — guard clause / early return
if (this.state !== "playing") return;
if (this.invulnTimer > 0) return;
if (!platforms.length) return;

// Correct — clamp to safe range instead of throwing
this.fuel = Utils.clamp(this.fuel + regen, 0, 100);

// Incorrect — do not do this
try { ... } catch (e) { console.error(e); }
```

Use `Utils.clamp`, `Math.max`, `Math.min` to keep numeric values in bounds rather than asserting.
Never `throw` errors in game-loop code — a thrown error stops the entire `requestAnimationFrame` loop.

---

## Game Constants

All tuneable values live in `js/constants.js` under `window.GAME_CONST`. **Never hardcode magic
numbers in game logic files.** Add a named property to the appropriate sub-object:

```js
// Bad
this.speed = 260;

// Good
this.speed = GAME_CONST.player.speed;
```

Map layouts (platforms, spawn points, themes) are also defined inside `GAME_CONST.maps`.

---

## Entity Removal Pattern

Use the mark-and-sweep idiom for removing entities from arrays mid-update:

```js
// Mark during update
projectile.markedForRemoval = true;

// Sweep at end of update pass
this.projectiles = this.projectiles.filter(p => !p.markedForRemoval);
```

Never splice arrays while iterating over them.

---

## Canvas / Rendering Guidelines

- All rendering happens inside a `render(ctx, camera)` method; never read from the canvas
- Apply camera offset before drawing: `ctx.translate(-camera.x, -camera.y)` (save/restore around it)
- Draw order: background → platforms → pickups → projectiles → enemies → player → particles → HUD
- HUD is drawn in screen space (no camera transform); call `ctx.save()` / `ctx.restore()` around it
- Placeholder colored rectangles are acceptable while sprites are not yet wired in

---

## CSS / HTML Conventions

- All CSS custom properties defined in `:root` in `css/style.css`
- Game UI overlays are `<section>` elements toggled with the `.hidden` class (never `display:none` inline)
- HTML element IDs follow `kebab-case`: `menu-main`, `screen-victory`, `btn-start`

---

## What NOT to Do

- Do not introduce any npm packages, bundlers, or build tools
- Do not convert files to ES modules (`type="module"`) without updating every file and `index.html`
- Do not add TypeScript without a full migration plan agreed upon with the team
- Do not add `try/catch` in the game loop path
- Do not hardcode numeric constants in game-logic files — use `GAME_CONST`
- Do not reorder `<script>` tags in `index.html` without verifying the full dependency graph
- Do not leave `console.log` or `debugger` statements in committed code
