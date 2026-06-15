# Explora — CLAUDE.md

## What this is
Top-down endless runner built with **Phaser 3** + **Vite**. The player hikes down a 3-lane forest trail and must dodge obstacles. Pure JavaScript, no TypeScript, no external UI libraries.

## How to run
```
npm run dev   # dev server on http://localhost:3000 (auto-opens browser)
npm run build # output → dist/
```

## File map
```
src/
  main.js                 Phaser game bootstrap — registers scenes, sets physics
  config/gameConfig.js    ALL numeric constants & tuning knobs (single source of truth)
  scenes/
    BootScene.js          Asset preload pipeline (currently no external assets; wires future sprite loads)
    MenuScene.js          Title screen — play button, high score display, music toggle
    GameScene.js          Core gameplay loop — scrolling, spawning, collision, difficulty ramp
    GameOverScene.js      Score display, new-best banner, retry / menu buttons
  objects/
    Player.js             Player container (tween-based lane switching + scale-jump), leg animation
    Obstacle.js           Obstacle factory + per-frame scroll movement; 4 obstacle types
  audio/
    MusicManager.js       Procedural chiptune via Web Audio API — singleton `musicManager`
```

## Architecture in one paragraph
Phaser scene flow: `BootScene → MenuScene → GameScene → GameOverScene → GameScene/MenuScene`. `GameScene` owns the game loop: it drives a `Player` and an `Obstacle[]` array, scrolling tileSprite backgrounds each frame. There are no Phaser physics bodies — collision is manual lane + Y-position comparison. Difficulty ramps every `RAMP_INTERVAL` ms via a second Phaser timer that increases scroll speed and tightens spawn interval.

## Key design facts
- **Perspective**: top-down (bird's eye looking straight down the trail). The player never moves vertically — the world scrolls toward them.
- **Jump is cosmetic**: scale tween makes the player appear to leap over the ground; while `isJumping === true`, collision is skipped entirely.
- **All tuning lives in `gameConfig.js`**: canvas size, lane X positions, obstacle sizes/colors, speed ramp constants, score multiplier. Touch those constants, not magic numbers scattered in scene files.
- **No external assets**: all visuals are drawn with Phaser graphics primitives. Textures (`forest-tile`, `trail-tile`) are generated once at runtime and cached. `BootScene` is where future sprite/audio asset loads go.
- **Music**: two procedural chiptune themes (menu + game) composed as note arrays in `MusicManager.js`. Mute state persists to `localStorage`. Toggle with `M` key in-game.
- **Persistence**: `localStorage` keys — `explora_hi` (high score int), `explora_music_muted` (bool string).
- **Depth layering**: background=0, shadow=1, player=2 (5 while airborne), obstacles=3, HUD=10.

## Obstacle types (defined in `gameConfig.js → OBSTACLE_TYPES`)
| Key | Shape | Notes |
|---|---|---|
| `snake` | ellipse + head circle | green |
| `log` | rectangle + ring | brown, widest |
| `stone` | ellipse | grey |
| `squirrel` | ellipse + tail | orange |

## Controls
- `← / A` — move left
- `→ / D` — move right
- `↑ / Space / W` — jump
- `M` — toggle music (in GameScene only)
