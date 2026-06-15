import Phaser from 'phaser'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_TITLE, COLOR_BUTTON, COLOR_BUTTON_HOVER,
  TRAIL_LEFT_X, TRAIL_RIGHT_X, TRAIL_CENTER_X,
} from '../config/gameConfig.js'
import { musicManager } from '../audio/MusicManager.js'

const GROUND_Y = 215   // sky / ground horizon

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    this._drawBackground()
    this._drawObstacleShowcase()

    // Title
    this.add.text(CANVAS_WIDTH / 2, 70, 'EXPLORA', {
      fontFamily: 'monospace', fontSize: '64px', color: COLOR_TITLE,
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(CANVAS_WIDTH / 2, 148, "Don't let the forest stop you!", {
      fontFamily: 'monospace', fontSize: '16px', color: '#d4f5d4',
    }).setOrigin(0.5)

    this._drawCharacterPreview()

    // Play button
    const btnBg = this.add.rectangle(CANVAS_WIDTH / 2, 295, 200, 52, COLOR_BUTTON)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0x27ae60)
    this.add.text(CANVAS_WIDTH / 2, 295, 'PLAY', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5)

    btnBg.on('pointerover', () => btnBg.setFillStyle(COLOR_BUTTON_HOVER))
    btnBg.on('pointerout',  () => btnBg.setFillStyle(COLOR_BUTTON))
    btnBg.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0)
      this.time.delayedCall(300, () => this.scene.start('GameScene'))
    })

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'))
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'))

    const hi = localStorage.getItem('explora_hi') || 0
    this.add.text(CANVAS_WIDTH / 2, 337, `Best: ${Math.floor(hi)} m`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5)

    musicManager.playMenu()
    this._buildMusicToggle()
  }

  // ─── Background ──────────────────────────────────────────────────────────────

  _drawBackground() {
    // Sky — 3-layer gradient
    this.add.rectangle(CANVAS_WIDTH / 2, 40,  CANVAS_WIDTH, 80,  0x3a7ab8)
    this.add.rectangle(CANVAS_WIDTH / 2, 110, CANVAS_WIDTH, 100, 0x5a9ed0)
    this.add.rectangle(CANVAS_WIDTH / 2, 180, CANVAS_WIDTH, 90,  0x87ceeb)

    // Clouds
    this._cloud(130, 55,  1.0)
    this._cloud(560, 38,  0.72)
    this._cloud(730, 75,  0.58)

    // Treeline — 3 depth layers, far → near
    this._treelineLayer(60,  55, 70,  0x2d6e2d, 0.38)   // far, hazy
    this._treelineLayer(46,  68, 90,  0x1e5c1e, 0.70)   // mid
    this._treelineLayer(36,  82, 112, 0x133613, 1.00)   // near, darkest

    // Ground base
    const gH = CANVAS_HEIGHT - GROUND_Y
    const gMidY = GROUND_Y + gH / 2
    this.add.rectangle(CANVAS_WIDTH / 2, gMidY, CANVAS_WIDTH, gH, 0x2d5a1e)

    // Top-down forest trees on sides (y capped before showcase row)
    this._topDownForest()

    // Dirt trail strip
    this.add.rectangle(TRAIL_CENTER_X, gMidY, TRAIL_RIGHT_X - TRAIL_LEFT_X, gH, 0x8B7050)

    // Trail edge lines
    this.add.rectangle(TRAIL_LEFT_X - 2,  gMidY, 4, gH, 0x5c4a2a)
    this.add.rectangle(TRAIL_RIGHT_X + 2, gMidY, 4, gH, 0x5c4a2a)

    // Showcase separator
    this.add.rectangle(CANVAS_WIDTH / 2, 362, CANVAS_WIDTH, 2, 0x333333, 0.8)
    this.add.rectangle(CANVAS_WIDTH / 2, 363, CANVAS_WIDTH, 87, 0x111a11, 0.75)
  }

  // One full row of pine silhouettes, staggered by `step` px
  _treelineLayer(step, offsetX, maxH, color, alpha) {
    for (let i = 0; i * step < CANVAS_WIDTH + step; i++) {
      const x  = i * step + (offsetX % step)
      const h  = Phaser.Math.Between(Math.floor(maxH * 0.7), maxH)
      this._pine(x, GROUND_Y, h, color, alpha)
    }
  }

  // Single pine tree silhouette (3 stacked triangles, side view)
  _pine(x, baseY, h, color, alpha) {
    this.add.triangle(x, baseY,          0, -h * 0.42, -h * 0.27, 0,  h * 0.27, 0,  color, alpha)
    this.add.triangle(x, baseY - h * 0.28, 0, -h * 0.36, -h * 0.21, 0,  h * 0.21, 0,  color, alpha)
    this.add.triangle(x, baseY - h * 0.50, 0, -h * 0.28, -h * 0.15, 0,  h * 0.15, 0,  color, alpha)
  }

  _cloud(x, y, sc) {
    this.add.ellipse(x,          y,          80 * sc, 28 * sc, 0xffffff, 0.82)
    this.add.ellipse(x - 22 * sc, y + 6 * sc, 48 * sc, 22 * sc, 0xffffff, 0.82)
    this.add.ellipse(x + 26 * sc, y + 8 * sc, 44 * sc, 20 * sc, 0xffffff, 0.82)
  }

  // Top-down canopy trees on the forest sides of the trail
  _topDownForest() {
    const trees = [
      // Left side
      { x: 55,  y: 250, r: 26 }, { x: 145, y: 275, r: 22 }, { x: 85,  y: 318, r: 24 },
      { x: 185, y: 295, r: 18 }, { x: 40,  y: 350, r: 20 }, { x: 120, y: 340, r: 21 },
      // Right side
      { x: 660, y: 248, r: 25 }, { x: 730, y: 285, r: 21 }, { x: 608, y: 310, r: 23 },
      { x: 760, y: 340, r: 20 }, { x: 678, y: 345, r: 22 }, { x: 600, y: 265, r: 18 },
    ]

    for (const t of trees) {
      if (t.y > 355) continue  // keep above showcase row
      this.add.ellipse(t.x + 3, t.y + 4, t.r * 2.2, t.r * 1.5, 0x0a1e0a, 0.5)
      this.add.circle(t.x, t.y, t.r, 0x206b1e)
      this.add.circle(t.x - t.r * 0.25, t.y - t.r * 0.2, t.r * 0.75, 0x2e9428, 0.65)
      this.add.circle(t.x + t.r * 0.1,  t.y + t.r * 0.1, t.r * 0.52, 0x124d0f)
      this.add.circle(t.x, t.y, t.r * 0.18, 0x6b4020)
    }
  }

  // ─── Obstacle showcase ───────────────────────────────────────────────────────

  _drawObstacleShowcase() {
    this.add.text(CANVAS_WIDTH / 2, 370, 'W A T C H   O U T   F O R', {
      fontFamily: 'monospace', fontSize: '10px', color: '#666666',
    }).setOrigin(0.5)

    const y = 402
    const items = [
      { x: 82,  type: 'stone' },
      { x: 230, type: 'squirrel' },
      { x: 400, type: 'snake' },
      { x: 572, type: 'log' },
      { x: 710, type: 'trunk' },
    ]

    for (const it of items) {
      this._miniObstacle(it.x, y, it.type)
      const isTrunk = it.type === 'trunk'
      this.add.text(it.x, y + 34, isTrunk ? '↑ MUST JUMP' : it.type.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '10px',
        color: isTrunk ? '#f39c12' : '#888888',
      }).setOrigin(0.5)
    }
  }

  _miniObstacle(x, y, type) {
    switch (type) {
      case 'stone': {
        this.add.ellipse(x + 2, y + 2, 40, 40, 0x5a6060)
        this.add.ellipse(x, y, 38, 38, 0x95a5a6).setStrokeStyle(2, 0x6c7a7d)
        this.add.ellipse(x - 6, y - 4, 25, 25, 0x8d9fa0)
        this.add.ellipse(x - 9, y - 9, 12, 8, 0xd5dcdc, 0.7)
        // Crack
        this.add.rectangle(x + 3, y + 2, 2, 12, 0x5a6565).setRotation(0.4)
        break
      }
      case 'squirrel': {
        // Tail
        this.add.ellipse(x, y - 19, 28, 20, 0xd35400)
        this.add.ellipse(x + 2, y - 17, 20, 13, 0xe67e22)
        this.add.ellipse(x + 1, y - 15, 12, 8, 0xf39c12)
        // Body
        this.add.ellipse(x, y + 2, 28, 26, 0xd35400).setStrokeStyle(1.5, 0x922b00)
        this.add.ellipse(x, y + 4, 14, 12, 0xf0a040)
        // Head
        this.add.circle(x, y + 19, 10, 0xc0471a).setStrokeStyle(1, 0x922b00)
        this.add.circle(x - 4, y + 20, 2, 0x1a1a1a)
        this.add.circle(x + 4, y + 20, 2, 0x1a1a1a)
        this.add.circle(x - 3.5, y + 19.2, 0.8, 0xffffff)
        break
      }
      case 'snake': {
        // S-curve body segments
        this.add.ellipse(x,     y,     62, 16, 0x27ae60).setStrokeStyle(1, 0x1a6b3a)
        this.add.ellipse(x - 18, y + 3, 34, 13, 0x229954).setStrokeStyle(1, 0x1a6b3a)
        this.add.ellipse(x + 18, y - 3, 34, 13, 0x229954).setStrokeStyle(1, 0x1a6b3a)
        // Scale dots
        for (let i = -2; i <= 2; i++) {
          this.add.ellipse(x + i * 10, y + (i % 2 === 0 ? 0 : 2), 6, 4, 0x1e8449)
        }
        // Head
        this.add.ellipse(x + 37, y, 20, 14, 0x1a6b3a).setStrokeStyle(1, 0x0f4020)
        this.add.circle(x + 41, y - 3, 2.5, 0xf39c12)
        this.add.circle(x + 41, y + 3, 2.5, 0xf39c12)
        this.add.circle(x + 41, y - 3, 1.2, 0x1a1a1a)
        this.add.circle(x + 41, y + 3, 1.2, 0x1a1a1a)
        // Tongue
        this.add.rectangle(x + 48, y, 5, 2, 0xe74c3c)
        this.add.rectangle(x + 55, y - 3, 4, 1.5, 0xe74c3c)
        this.add.rectangle(x + 55, y + 3, 4, 1.5, 0xe74c3c)
        break
      }
      case 'log': {
        this.add.rectangle(x + 3, y + 3, 86, 27, 0x000000, 0.28)
        this.add.rectangle(x, y, 85, 26, 0x7a4a1e).setStrokeStyle(2, 0x4a2a0a)
        for (let i = -1; i <= 1; i++) this.add.rectangle(x - 5, y + i * 7, 64, 2, 0x5c3317, 0.6)
        // Left end cap
        this.add.ellipse(x - 41, y, 26, 26, 0xc8803a).setStrokeStyle(2, 0x4a2a0a)
        this.add.ellipse(x - 41, y, 18, 18, 0xb87030)
        this.add.ellipse(x - 41, y, 10, 10, 0xa06020)
        this.add.circle(x - 41, y, 3, 0x5c3317)
        // Right end cap
        this.add.ellipse(x + 41, y, 26, 26, 0xc8803a).setStrokeStyle(2, 0x4a2a0a)
        this.add.ellipse(x + 41, y, 18, 18, 0xb87030)
        this.add.circle(x + 41, y, 3, 0x5c3317)
        // Moss
        this.add.ellipse(x + 8, y - 4, 14, 7, 0x2d6a2d, 0.8)
        break
      }
      case 'trunk': {
        const W = 126, H = 26
        this.add.rectangle(x + 3, y + 4, W + 8, H + 6, 0x000000, 0.3)
        this.add.rectangle(x, y, W, H, 0x6b3a1f).setStrokeStyle(2, 0x3d200e)
        for (let i = -1; i <= 1; i++) this.add.rectangle(x, y + i * 7, W - 28, 2, 0x4a2810, 0.6)
        // Amber warning stripe
        this.add.rectangle(x, y, W - 18, 4, 0xf39c12, 0.45)
        // Left end cap
        this.add.ellipse(x - W / 2, y, H, H, 0xc8803a).setStrokeStyle(2, 0x3d200e)
        this.add.ellipse(x - W / 2, y, H * 0.66, H * 0.66, 0xb07030)
        this.add.circle(x - W / 2, y, 4, 0x5c3317)
        // Right end cap
        this.add.ellipse(x + W / 2, y, H, H, 0xc8803a).setStrokeStyle(2, 0x3d200e)
        this.add.ellipse(x + W / 2, y, H * 0.66, H * 0.66, 0xb07030)
        this.add.circle(x + W / 2, y, 4, 0x5c3317)
        break
      }
    }
  }

  // ─── Character preview ───────────────────────────────────────────────────────

  _drawCharacterPreview() {
    const cx = CANVAS_WIDTH / 2
    const cy = 247
    this.add.rectangle(cx + 2, cy - 2, 22, 36, 0x7a6238)       // backpack
    this.add.rectangle(cx, cy, 30, 44, 0x4b5320)                // jacket body
    this.add.rectangle(cx - 20, cy, 8, 24, 0x4b5320)            // arm L
    this.add.rectangle(cx + 20, cy, 8, 24, 0x4b5320)            // arm R
    this.add.rectangle(cx, cy + 22, 32, 5, 0x2a1e0e)            // belt
    this.add.rectangle(cx, cy + 22, 8, 5, 0xb08020)             // buckle
    this.add.rectangle(cx, cy + 30, 32, 12, 0x3d2e1a)           // pants
    this.add.rectangle(cx - 7, cy + 44, 10, 14, 0x1e120a)       // boot L
    this.add.rectangle(cx + 7, cy + 44, 10, 14, 0x1e120a)       // boot R
    this.add.circle(cx, cy - 26, 14, 0xc8814a)                  // head
    this.add.ellipse(cx, cy - 19, 18, 8, 0x9a5c28)              // beard
    this.add.ellipse(cx, cy - 37, 36, 11, 0x3a3c1e)             // hat brim
    this.add.ellipse(cx, cy - 42, 24, 10, 0x3a3c1e)             // hat crown
    this.add.circle(cx - 4, cy - 27, 3.5, 0xffffff)             // eye white L
    this.add.circle(cx + 4, cy - 27, 3.5, 0xffffff)             // eye white R
    this.add.circle(cx - 4, cy - 27, 2, 0x1a1a2e)               // pupil L
    this.add.circle(cx + 4, cy - 27, 2, 0x1a1a2e)               // pupil R
  }

  // ─── Music toggle ─────────────────────────────────────────────────────────────

  _buildMusicToggle() {
    const x = CANVAS_WIDTH - 46
    const y = 18

    const bg = this.add.rectangle(x, y, 80, 24, 0x222222)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x444444)

    const label = this.add.text(x, y, this._musicLabel(), {
      fontFamily: 'monospace', fontSize: '13px', color: this._musicColor(),
    }).setOrigin(0.5)

    bg.on('pointerover', () => bg.setFillStyle(0x333333))
    bg.on('pointerout',  () => bg.setFillStyle(0x222222))
    bg.on('pointerdown', () => {
      musicManager.toggle()
      label.setText(this._musicLabel())
      label.setColor(this._musicColor())
    })
  }

  _musicLabel() { return musicManager.isMuted() ? '♪ OFF' : '♪ ON' }
  _musicColor() { return musicManager.isMuted() ? '#666666' : '#2ecc71' }
}
