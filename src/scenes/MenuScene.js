import Phaser from 'phaser'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_TITLE, COLOR_BUTTON, COLOR_BUTTON_HOVER,
  GRASS_COLOR, TRAIL_COLOR,
} from '../config/gameConfig.js'
import { musicManager } from '../audio/MusicManager.js'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    this._drawBackground()

    // Title
    this.add.text(CANVAS_WIDTH / 2, 100, 'EXPLORA', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: COLOR_TITLE,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5)

    // Subtitle
    this.add.text(CANVAS_WIDTH / 2, 168, "Don't let the forest stop you!", {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#d4f5d4',
    }).setOrigin(0.5)

    // Placeholder character preview
    this._drawCharacterPreview()

    // Play button
    const btnBg = this.add.rectangle(CANVAS_WIDTH / 2, 310, 200, 56, COLOR_BUTTON, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0x27ae60)

    const btnText = this.add.text(CANVAS_WIDTH / 2, 310, 'PLAY', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5)

    btnBg.on('pointerover', () => btnBg.setFillStyle(COLOR_BUTTON_HOVER))
    btnBg.on('pointerout', () => btnBg.setFillStyle(COLOR_BUTTON))
    btnBg.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0)
      this.time.delayedCall(300, () => this.scene.start('GameScene'))
    })

    // Also allow Enter / Space to start
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'))
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'))

    // High score
    const hi = localStorage.getItem('explora_hi') || 0
    this.add.text(CANVAS_WIDTH / 2, 390, `Best: ${Math.floor(hi)} m`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5)

    // Controls hint
    this.add.text(CANVAS_WIDTH / 2, 425, '← → to dodge   ↑ / SPACE to jump', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#888888',
    }).setOrigin(0.5)

    musicManager.playMenu()
    this._buildMusicToggle()
  }

  _buildMusicToggle() {
    const x = CANVAS_WIDTH - 46
    const y = 18

    const bg = this.add.rectangle(x, y, 80, 24, 0x222222)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x444444)

    const label = this.add.text(x, y, this._musicLabel(), {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: this._musicColor(),
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

  _drawBackground() {
    // Sky
    this.add.rectangle(CANVAS_WIDTH / 2, 100, CANVAS_WIDTH, 200, 0x87ceeb)
    // Tree line (silhouette)
    for (let x = 0; x < CANVAS_WIDTH; x += 48) {
      const h = Phaser.Math.Between(60, 110)
      this.add.rectangle(x + 24, 200 - h / 2, 40, h, 0x1e5c1e)
    }
    // Ground / trail
    this.add.rectangle(CANVAS_WIDTH / 2, 300, CANVAS_WIDTH, 200, GRASS_COLOR)
    this.add.rectangle(CANVAS_WIDTH / 2, 300, 280, 200, TRAIL_COLOR)
  }

  _drawCharacterPreview() {
    const cx = CANVAS_WIDTH / 2
    // Body
    this.add.rectangle(cx, 248, 28, 44, 0x3498db)
    // Head
    this.add.circle(cx, 222, 16, 0xf5cba7)
    // Hair
    this.add.rectangle(cx, 210, 30, 10, 0x5d4037)
    // Eyes (two small dots)
    this.add.circle(cx - 5, 220, 3, 0x2c3e50)
    this.add.circle(cx + 5, 220, 3, 0x2c3e50)
    // Legs
    this.add.rectangle(cx - 7, 278, 10, 20, 0x27ae60)
    this.add.rectangle(cx + 7, 278, 10, 20, 0x27ae60)
  }
}
