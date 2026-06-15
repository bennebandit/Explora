import Phaser from 'phaser'
import Player from '../objects/Player.js'
import Obstacle from '../objects/Obstacle.js'
import { musicManager } from '../audio/MusicManager.js'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  LANE_X_POSITIONS, LANE_COUNT,
  PLAYER_Y, TRAIL_COLOR, GRASS_COLOR,
  TRAIL_CENTER_X, TRAIL_WIDTH, TRAIL_LEFT_X, TRAIL_RIGHT_X,
  INITIAL_SCROLL_SPEED, SPEED_INCREMENT, MAX_SCROLL_SPEED,
  INITIAL_SPAWN_INTERVAL, SPAWN_INTERVAL_DECREMENT, MIN_SPAWN_INTERVAL,
  RAMP_INTERVAL, SCORE_MULTIPLIER,
} from '../config/gameConfig.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this._score = 0
    this._scrollSpeed = INITIAL_SCROLL_SPEED
    this._spawnInterval = INITIAL_SPAWN_INTERVAL
    this._gameOver = false
    this._obstacles = []

    this._buildBackground()
    this._buildHUD()

    this._player = new Player(this).create()

    this._spawnerTimer = this.time.addEvent({
      delay: this._spawnInterval,
      callback: this._spawnObstacle,
      callbackScope: this,
      loop: true,
    })

    this._rampTimer = this.time.addEvent({
      delay: RAMP_INTERVAL,
      callback: this._ramp,
      callbackScope: this,
      loop: true,
    })

    this.cameras.main.fadeIn(400, 0, 0, 0)
    musicManager.playGame()

    this.input.keyboard.on('keydown-M', () => musicManager.toggle())
  }

  update(_time, delta) {
    if (this._gameOver) return

    // Decrement tilePositionY to scroll texture downward (new content enters from top)
    const scroll = (this._scrollSpeed * delta) / 1000
    this._trailTile.tilePositionY   -= scroll
    this._bgForestL.tilePositionY   -= scroll
    this._bgForestR.tilePositionY   -= scroll

    this._player.update()

    for (let i = this._obstacles.length - 1; i >= 0; i--) {
      const obs = this._obstacles[i]
      obs.scrollSpeed = this._scrollSpeed
      obs.update(delta)

      if (obs.isOffScreen()) {
        obs.destroy()
        this._obstacles.splice(i, 1)
        continue
      }

      // Collision: same lane, obstacle at player Y, player on ground
      if (!this._player.isInAir() &&
          obs.getLane() === this._player.getLane() &&
          this._obstacleReachedPlayer(obs)) {
        this._triggerGameOver()
        return
      }
    }

    this._score += delta * SCORE_MULTIPLIER
    this._scoreText.setText(`${Math.floor(this._score)} m`)
  }

  // ─── Background ──────────────────────────────────────────────────────────────

  _buildBackground() {
    const w = CANVAS_WIDTH
    const h = CANVAS_HEIGHT

    this._createForestTexture()

    // Scrolling pine forest on both sides of the trail
    const leftW  = TRAIL_LEFT_X
    const rightW = w - TRAIL_RIGHT_X

    this._bgForestL = this.add.tileSprite(leftW / 2, h / 2, leftW, h, 'forest-tile').setDepth(0)
    this._bgForestR = this.add.tileSprite(TRAIL_RIGHT_X + rightW / 2, h / 2, rightW, h, 'forest-tile').setDepth(0)

    // Dirt trail with baked-in lane dashes — scrolls as one unit
    this._createTrailTexture()
    this._trailTile = this.add.tileSprite(TRAIL_CENTER_X, h / 2, TRAIL_WIDTH, h, 'trail-tile').setDepth(0)

    // Trail edge lines
    this.add.rectangle(TRAIL_LEFT_X - 2,  h / 2, 4, h, 0x5c4a2a).setDepth(0)
    this.add.rectangle(TRAIL_RIGHT_X + 2, h / 2, 4, h, 0x5c4a2a).setDepth(0)
  }

  // Generates a tileable top-down pine forest texture once per game session
  _createForestTexture() {
    if (this.textures.exists('forest-tile')) return

    const size = 120
    const g = this.make.graphics({ add: false })

    // Forest floor
    g.fillStyle(0x1f4a1f, 1)
    g.fillRect(0, 0, size, size)

    // Pine trees — each drawn as layered circles (outer canopy → inner shadow → trunk)
    const trees = [
      { x: 24, y: 26, r: 19 },
      { x: 82, y: 18, r: 15 },
      { x: 55, y: 72, r: 17 },
      { x: 100, y: 80, r: 13 },
      { x: 14, y: 88, r: 12 },
      { x: 72, y: 105, r: 14 },  // wraps into next tile row — creates continuity
    ]

    for (const t of trees) {
      // Drop shadow (offset)
      g.fillStyle(0x0f2a0f, 0.5)
      g.fillCircle(t.x + 2, t.y + 3, t.r)
      // Outer canopy
      g.fillStyle(0x1e6b1e, 1)
      g.fillCircle(t.x, t.y, t.r)
      // Inner darker layer (pine depth)
      g.fillStyle(0x14520f, 1)
      g.fillCircle(t.x, t.y, t.r * 0.55)
      // Trunk/center hole
      g.fillStyle(0x5d3a1a, 1)
      g.fillCircle(t.x, t.y, t.r * 0.2)
    }

    g.generateTexture('forest-tile', size, size)
    g.destroy()
  }

  // Generates a tileable trail texture with baked lane divider dashes
  _createTrailTexture() {
    if (this.textures.exists('trail-tile')) return

    const tileH = 64
    const tileW = TRAIL_WIDTH   // 314

    // Divider X positions relative to the trail's left edge
    const div1 = Math.round((LANE_X_POSITIONS[0] + LANE_X_POSITIONS[1]) / 2) - TRAIL_LEFT_X  // ~105
    const div2 = Math.round((LANE_X_POSITIONS[1] + LANE_X_POSITIONS[2]) / 2) - TRAIL_LEFT_X  // ~210

    const g = this.make.graphics({ add: false })

    // Dirt base
    g.fillStyle(0x8B7355, 1)
    g.fillRect(0, 0, tileW, tileH)

    // Subtle dirt variation
    g.fillStyle(0x7a6548, 0.4)
    g.fillRect(0, 0, tileW, 2)
    g.fillRect(0, tileH - 2, tileW, 2)

    // Dashed lane dividers baked into the tile (dash then gap per tile height)
    const dashLen = 26
    const dashY   = 6
    g.fillStyle(0xc8a96e, 0.55)
    g.fillRect(div1 - 1, dashY, 2, dashLen)
    g.fillRect(div2 - 1, dashY, 2, dashLen)

    g.generateTexture('trail-tile', tileW, tileH)
    g.destroy()
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────

  _buildHUD() {
    const D = 10  // HUD always on top
    this.add.rectangle(CANVAS_WIDTH / 2, 20, CANVAS_WIDTH, 40, 0x000000, 0.5).setDepth(D)

    this.add.text(20, 20, 'EXPLORA', {
      fontFamily: 'monospace', fontSize: '18px', color: '#f9ca24',
    }).setOrigin(0, 0.5).setDepth(D)

    this._scoreText = this.add.text(CANVAS_WIDTH - 20, 20, '0 m', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(D)

    const hi = localStorage.getItem('explora_hi') || 0
    this.add.text(CANVAS_WIDTH / 2, 20, `Best: ${Math.floor(hi)} m`, {
      fontFamily: 'monospace', fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0.5, 0.5).setDepth(D)
  }

  // ─── Spawning ─────────────────────────────────────────────────────────────────

  _spawnObstacle() {
    const lane = Phaser.Math.Between(0, LANE_COUNT - 1)
    const type = Obstacle.randomType()
    const obs  = new Obstacle(this, lane, type, this._scrollSpeed).create()
    this._obstacles.push(obs)
  }

  // ─── Collision ────────────────────────────────────────────────────────────────

  _obstacleReachedPlayer(obs) {
    const threshold = obs.rect.height / 2 + 18
    return Math.abs(PLAYER_Y - obs.rect.y) < threshold
  }

  // ─── Difficulty ───────────────────────────────────────────────────────────────

  _ramp() {
    this._scrollSpeed = Math.min(this._scrollSpeed + SPEED_INCREMENT, MAX_SCROLL_SPEED)
    this._spawnInterval = Math.max(
      this._spawnInterval - SPAWN_INTERVAL_DECREMENT,
      MIN_SPAWN_INTERVAL
    )
    this._spawnerTimer.destroy()
    this._spawnerTimer = this.time.addEvent({
      delay: this._spawnInterval,
      callback: this._spawnObstacle,
      callbackScope: this,
      loop: true,
    })
  }

  // ─── Game Over ────────────────────────────────────────────────────────────────

  _triggerGameOver() {
    if (this._gameOver) return
    this._gameOver = true

    this._spawnerTimer.destroy()
    this._rampTimer.destroy()
    this._player.die()

    this.cameras.main.shake(350, 0.018)
    this.cameras.main.flash(200, 200, 0, 0)

    const score = Math.floor(this._score)
    const prev  = parseInt(localStorage.getItem('explora_hi') || '0', 10)
    if (score > prev) localStorage.setItem('explora_hi', score)

    this.time.delayedCall(900, () => {
      this.cameras.main.fade(300, 0, 0, 0)
      this.time.delayedCall(300, () => this.scene.start('GameOverScene', { score }))
    })
  }
}
