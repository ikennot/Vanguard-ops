# Vanguard Ops: Tactical Strike

A high-octane 2D tactical side-scroller built with HTML5 Canvas, CSS, and JavaScript.

The player is an elite operative with advanced mobility gear (jetpack), multiple weapons, and a HUD-driven combat loop focused on precision shooting, movement, and resource management.

## Features

- 2D physics-based movement (velocity, acceleration, gravity)
- Jetpack-assisted repositioning with limited fuel
- Weapon system with limited ammo and pickup crates
- Enemy encounters across drones, aliens, and rival mercenaries
- HUD: health, lives, ammo, and kill count
- Menu flow: main menu, pause menu, settings menu
- Win/Loss screens based on match objective
- Sprite-based visuals and particle effect hooks

## Tech Stack

- HTML5 Canvas
- CSS3
- Vanilla JavaScript (modular files)

## Controls

- `W A S D` - Move
- `Left Click` - Shoot
- `Space` - Jetpack / Flight
- `ESC` - Pause
- Mouse - Aim and UI navigation

## Rules and Conditions

### Player Rules

- Player can move across platforms freely
- Player can collect weapon crates and resource pickups
- Falling off the map costs a life
- Lives are limited to 5 per match
- Ammo is limited and must be replenished via pickups
- Jetpack is limited-use and depletes over time

### Victory

- Eliminate `15` enemies by knocking them off stage
- Survive with at least one life remaining

### Loss

- Lose all lives
- Fail to reach target eliminations before lives run out

## Project Structure

```
Vanguard-ops/
|- index.html
|- README.md
|- css/
|  |- style.css
|- js/
|  |- main.js
|  |- game.js
|  |- constants.js
|  |- utils.js
|  |- input.js
|  |- audio.js
|  |- spritesheet.js
|  |- physics.js
|  |- collision.js
|  |- camera.js
|  |- particle.js
|  |- platform.js
|  |- projectile.js
|  |- weapon.js
|  |- pickup.js
|  |- player.js
|  |- enemy.js
|  |- hud.js
|  |- menu.js
|- assets/
|  |- sprites/
|  |  |- player/
|  |  |- enemies/
|  |  |  |- drones/
|  |  |  |- aliens/
|  |  |  |- mercenaries/
|  |  |- weapons/
|  |  |- pickups/
|  |  |- effects/
|  |  |- ui/
|  |  |- environment/
|  |- audio/
|  |  |- bgm/
|  |  |- sfx/
|  |- fonts/
|- docs/
|  |- Vanguard-Ops-FINAL.pdf
|- sprite-reference/
```

## Setup and Run

1. Clone or open this project folder.
2. Use a local static server (recommended):

```bash
# Option A: VS Code Live Server extension
# Right click index.html -> Open with Live Server

# Option B: Python server
python3 -m http.server 5500
```

3. Open your browser:

- Live Server URL, or
- `http://localhost:5500`

4. Start from the main menu and play.

## Asset Notes

- Original raw sprite sheets are stored in `sprite-reference/`.
- Organized runtime-ready asset folders are under `assets/sprites/`.
- Use consistent naming for animation strips:
  - `idle.png`, `run.png`, `jump.png`, `jetpack.png`, `hurt.png`, `death.png`
- Place new VFX sheets in `assets/sprites/effects/` and register frames in `js/spritesheet.js`.

## Current Status

This repository currently includes:

- Complete folder architecture for the game
- Front-end shell (`index.html`, `css/style.css`)
- JavaScript module scaffolding for core systems

Next implementation step is wiring sprite extraction, combat logic, enemy AI, and full HUD rendering into the update/render loop.
