// Canvas
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 450

// Lanes — 3 lanes across the trail (left, center, right)
export const LANE_COUNT = 3
export const LANE_X_POSITIONS = [295, 400, 505]

// Trail bounds (top-down view — trail is a vertical strip centered on screen)
export const TRAIL_CENTER_X = 400
export const TRAIL_WIDTH = 314          // px wide on screen
export const TRAIL_LEFT_X = 243        // left edge
export const TRAIL_RIGHT_X = 557       // right edge
export const TRAIL_COLOR = 0x8B7355    // dirt brown
export const GRASS_COLOR = 0x3d7a2e   // forest green

// Player (top-down — fixed at bottom of trail)
export const PLAYER_Y = 375
export const PLAYER_WIDTH = 30
export const PLAYER_HEIGHT = 40
export const JUMP_DURATION = 580           // ms for tween-based jump (scale effect)
export const LANE_SWITCH_DURATION = 120    // ms for lane tween
export const INPUT_COOLDOWN = 130

// Obstacles (width = across-trail axis, height = along-trail axis)
// Note: 'trunk' is a special must-jump obstacle — excluded from randomType()
export const OBSTACLE_TYPES = {
  snake:    { color: 0x2ecc71, width: 62,  height: 16, label: 'Snake' },
  log:      { color: 0x8B4513, width: 85,  height: 26, label: 'Log' },
  squirrel: { color: 0xe67e22, width: 28,  height: 30, label: 'Squirrel' },
  stone:    { color: 0x95a5a6, width: 38,  height: 38, label: 'Stone' },
  trunk:    { color: 0x6b3a1f, width: 260, height: 34, label: 'Trunk' },
}

// Coins
export const COIN_BONUS = 50           // meters added per coin collected
export const COIN_SPAWN_INTERVAL = 3200 // ms between coin cluster spawns

// Difficulty / speed
export const INITIAL_SCROLL_SPEED = 280
export const SPEED_INCREMENT = 50
export const MAX_SCROLL_SPEED = 700
export const INITIAL_SPAWN_INTERVAL = 2200
export const SPAWN_INTERVAL_DECREMENT = 120
export const MIN_SPAWN_INTERVAL = 650
export const RAMP_INTERVAL = 8000

// Score
export const SCORE_MULTIPLIER = 0.01

// Colors / UI
export const COLOR_TITLE = '#f9ca24'
export const COLOR_BUTTON = 0x2ecc71
export const COLOR_BUTTON_HOVER = 0x27ae60
