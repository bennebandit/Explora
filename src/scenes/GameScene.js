import Phaser from 'phaser'
import Player from '../objects/Player.js'
import Obstacle from '../objects/Obstacle.js'
import Coin from '../objects/Coin.js'
import { musicManager } from '../audio/MusicManager.js'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  LANE_X_POSITIONS, LANE_COUNT,
  PLAYER_Y, TRAIL_COLOR, GRASS_COLOR,
  TRAIL_CENTER_X, TRAIL_WIDTH, TRAIL_LEFT_X, TRAIL_RIGHT_X,
  INITIAL_SCROLL_SPEED, SPEED_INCREMENT, MAX_SCROLL_SPEED,
  INITIAL_SPAWN_INTERVAL, SPAWN_INTERVAL_DECREMENT, MIN_SPAWN_INTERVAL,
  RAMP_INTERVAL, SCORE_MULTIPLIER,
  COIN_BONUS, COIN_SPAWN_INTERVAL,
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
    this._coins = []

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

    this._coinSpawner = this.time.addEvent({
      delay: COIN_SPAWN_INTERVAL,
      callback: this._spawnCoins,
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

      // Trunk spans all lanes (mustJump); normal obstacles check lane match
      const laneHit = obs.mustJump || obs.getLane() === this._player.getLane()
      if (!this._player.isInAir() && laneHit && this._obstacleReachedPlayer(obs)) {
        this._triggerGameOver()
        return
      }
    }

    for (let i = this._coins.length - 1; i >= 0; i--) {
      const coin = this._coins[i]
      coin.scrollSpeed = this._scrollSpeed
      coin.update(delta)

      if (coin._destroyed || coin.isOffScreen()) {
        if (!coin._destroyed) coin.destroy()
        this._coins.splice(i, 1)
        continue
      }

      if (!coin.isCollected() &&
          coin.getLane() === this._player.getLane() &&
          Math.abs(PLAYER_Y - coin.y) < 24) {
        coin.collect()
        this._score += COIN_BONUS
        this._showCoinBonus(coin.x)
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

    const size = 128
    const g = this.make.graphics({ add: false })

    // Multi-tone forest floor base
    g.fillStyle(0x1a3d18, 1)
    g.fillRect(0, 0, size, size)

    // Irregular ground color patches (depth variation)
    const patches = [
      { x: 20,  y: 10,  w: 40, h: 28, c: 0x213f1a },
      { x: 70,  y: 40,  w: 50, h: 35, c: 0x163014 },
      { x: 10,  y: 70,  w: 35, h: 40, c: 0x22421c },
      { x: 90,  y: 5,   w: 38, h: 30, c: 0x183818 },
      { x: 50,  y: 100, w: 60, h: 28, c: 0x1b3e18 },
    ]
    for (const p of patches) {
      g.fillStyle(p.c, 0.6)
      g.fillEllipse(p.x, p.y, p.w, p.h)
    }

    // Scattered leaf/debris litter
    const litter = [
      { x: 8,   y: 35,  c: 0x4a6a20 }, { x: 42,  y: 8,   c: 0x8a7020 },
      { x: 65,  y: 55,  c: 0x5a4a10 }, { x: 110, y: 25,  c: 0x6a5a18 },
      { x: 30,  y: 95,  c: 0x3a5218 }, { x: 95,  y: 88,  c: 0x7a6820 },
      { x: 18,  y: 60,  c: 0x4e6a1a }, { x: 80,  y: 115, c: 0x5a4a12 },
      { x: 52,  y: 125, c: 0x3a5010 }, { x: 115, y: 60,  c: 0x6a5218 },
    ]
    for (const l of litter) {
      g.fillStyle(l.c, 0.75)
      g.fillEllipse(l.x, l.y, 6, 4)
    }

    // Undergrowth / fern patches (small bush clusters)
    const shrubs = [
      { x: 105, y: 50, r: 7 }, { x: 38, y: 110, r: 6 }, { x: 8, y: 50, r: 5 },
    ]
    for (const s of shrubs) {
      g.fillStyle(0x1a5c1a, 0.8)
      g.fillCircle(s.x - 4, s.y,     s.r)
      g.fillCircle(s.x + 4, s.y - 2, s.r * 0.8)
      g.fillCircle(s.x,     s.y + 4, s.r * 0.7)
      g.fillStyle(0x257225, 0.6)
      g.fillCircle(s.x - 3, s.y - 1, s.r * 0.5)
    }

    // Pine trees — layered canopy with light/shadow zones
    const trees = [
      { x: 26,  y: 28,  r: 20 },
      { x: 84,  y: 16,  r: 16 },
      { x: 56,  y: 74,  r: 18 },
      { x: 104, y: 82,  r: 14 },
      { x: 12,  y: 92,  r: 13 },
      { x: 74,  y: 108, r: 15 },
    ]

    for (const t of trees) {
      // Ground shadow (elongated toward bottom-right)
      g.fillStyle(0x0a1e0a, 0.55)
      g.fillEllipse(t.x + 4, t.y + 5, t.r * 2.1, t.r * 1.5)
      // Outer canopy (mid green)
      g.fillStyle(0x206b1e, 1)
      g.fillCircle(t.x, t.y, t.r)
      // Sun-facing highlight (upper-left arc)
      g.fillStyle(0x2e9428, 0.7)
      g.fillCircle(t.x - t.r * 0.25, t.y - t.r * 0.2, t.r * 0.75)
      // Inner shadow layer
      g.fillStyle(0x124d0f, 1)
      g.fillCircle(t.x + t.r * 0.1, t.y + t.r * 0.1, t.r * 0.52)
      // Trunk
      g.fillStyle(0x6b4020, 1)
      g.fillCircle(t.x, t.y, t.r * 0.18)
      // Canopy tip highlight dot
      g.fillStyle(0x3ab030, 0.5)
      g.fillCircle(t.x - t.r * 0.3, t.y - t.r * 0.35, t.r * 0.22)
    }

    g.generateTexture('forest-tile', size, size)
    g.destroy()
  }

  // Generates a tileable trail texture with baked lane divider dashes
  _createTrailTexture() {
    if (this.textures.exists('trail-tile')) return

    const tileH = 80
    const tileW = TRAIL_WIDTH   // 314

    // Divider X positions relative to the trail's left edge
    const div1 = Math.round((LANE_X_POSITIONS[0] + LANE_X_POSITIONS[1]) / 2) - TRAIL_LEFT_X  // ~105
    const div2 = Math.round((LANE_X_POSITIONS[1] + LANE_X_POSITIONS[2]) / 2) - TRAIL_LEFT_X  // ~210

    const g = this.make.graphics({ add: false })

    // Dirt base — mid tan
    g.fillStyle(0x8B7050, 1)
    g.fillRect(0, 0, tileW, tileH)

    // Color variation patches across the trail surface
    const dirtPatches = [
      { x: 40,  y: 20, w: 80,  h: 30, c: 0x7a6244, a: 0.45 },
      { x: 180, y: 10, w: 60,  h: 25, c: 0x9a8060, a: 0.35 },
      { x: 260, y: 45, w: 70,  h: 30, c: 0x7a6040, a: 0.4  },
      { x: 110, y: 55, w: 100, h: 28, c: 0x917060, a: 0.3  },
      { x: 20,  y: 60, w: 50,  h: 22, c: 0x806050, a: 0.35 },
    ]
    for (const p of dirtPatches) {
      g.fillStyle(p.c, p.a)
      g.fillEllipse(p.x, p.y, p.w, p.h)
    }

    // Inner trail (packed center, slightly darker)
    g.fillStyle(0x7a6245, 0.25)
    g.fillRect(div1 + 8, 0, div2 - div1 - 16, tileH)

    // Edge darkening (shadows at trail sides)
    g.fillStyle(0x5a4830, 0.35)
    g.fillRect(0, 0, 18, tileH)
    g.fillRect(tileW - 18, 0, 18, tileH)

    // Small pebble clusters
    const pebbles = [
      { x: 30,  y: 15 }, { x: 88,  y: 52 }, { x: 145, y: 28 },
      { x: 200, y: 65 }, { x: 255, y: 18 }, { x: 295, y: 55 },
      { x: 60,  y: 70 }, { x: 175, y: 10 }, { x: 240, y: 40 },
    ]
    for (const p of pebbles) {
      g.fillStyle(0x6a5a40, 0.7)
      g.fillCircle(p.x,     p.y,     3.5)
      g.fillStyle(0x7a6a50, 0.7)
      g.fillCircle(p.x + 6, p.y + 4, 2.5)
      g.fillStyle(0x5a4a30, 0.5)
      g.fillCircle(p.x + 3, p.y - 3, 2)
    }

    // Occasional root crossing the trail
    g.fillStyle(0x5a3e20, 0.5)
    g.fillRect(60, 38, 80, 3)
    g.fillStyle(0x6a4e28, 0.35)
    g.fillRect(62, 36, 76, 2)

    // Footprint impressions (two oval tracks down center lane)
    const footY = [8, 28, 48, 68]
    for (const fy of footY) {
      g.fillStyle(0x6a5535, 0.4)
      g.fillEllipse(div1 + 30, fy, 8, 12)
      g.fillEllipse(div1 + 50, fy + 10, 8, 12)
    }

    // Dashed lane dividers
    const dashLen = 32
    const dashY   = 8
    const gap     = tileH - dashLen - dashY   // ~32 px gap
    g.fillStyle(0xc8a870, 0.6)
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
    // 15% chance: spawn a trunk (must-jump, spans all lanes)
    if (Math.random() < 0.15) {
      this._obstacles.push(new Obstacle(this, 1, 'trunk', this._scrollSpeed).create())
      return
    }
    const lane = Phaser.Math.Between(0, LANE_COUNT - 1)
    const type = Obstacle.randomType()
    this._obstacles.push(new Obstacle(this, lane, type, this._scrollSpeed).create())
  }

  _spawnCoins() {
    // Spawn 1–3 coins spread across random lanes in a horizontal cluster
    const count = Phaser.Math.Between(1, 3)
    const lanes = Phaser.Utils.Array.Shuffle([0, 1, 2]).slice(0, count)
    for (const lane of lanes) {
      this._coins.push(new Coin(this, lane, this._scrollSpeed).create())
    }
  }

  // ─── Collision ────────────────────────────────────────────────────────────────

  _obstacleReachedPlayer(obs) {
    const threshold = obs.rect.height / 2 + 18
    return Math.abs(PLAYER_Y - obs.rect.y) < threshold
  }

  // ─── Coin popup ───────────────────────────────────────────────────────────────

  _showCoinBonus(x) {
    const txt = this.add.text(x, PLAYER_Y - 30, `+${COIN_BONUS}m`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#f1c40f',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10)

    this.tweens.add({
      targets: txt,
      y: PLAYER_Y - 90, alpha: 0,
      duration: 850, ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    })
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
    this._coinSpawner.destroy()
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
