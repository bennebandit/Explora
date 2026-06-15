import Phaser from 'phaser'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_BUTTON, COLOR_BUTTON_HOVER,
  TRAIL_COLOR, GRASS_COLOR,
} from '../config/gameConfig.js'
import { musicManager } from '../audio/MusicManager.js'

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' })
  }

  init(data) {
    this._score = data.score || 0
  }

  create() {
    musicManager.stop()
    this._drawBackground()

    const cx = CANVAS_WIDTH / 2
    const hi = parseInt(localStorage.getItem('explora_hi') || '0', 10)
    const isNewBest = this._score >= hi

    // Dark overlay panel
    this.add.rectangle(cx, CANVAS_HEIGHT / 2, 480, 300, 0x000000, 0.72)
      .setStrokeStyle(2, 0x444444)

    // "Game Over" title
    this.add.text(cx, 120, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#e74c3c',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5)

    // Score
    this.add.text(cx, 195, `${this._score} m`, {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: '#f9ca24',
    }).setOrigin(0.5)

    // New best banner
    if (isNewBest) {
      this.add.text(cx, 238, '✦ New Best! ✦', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#2ecc71',
      }).setOrigin(0.5)
    } else {
      this.add.text(cx, 238, `Best: ${hi} m`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#888888',
      }).setOrigin(0.5)
    }

    // Play Again button
    this._makeButton(cx, 300, 'PLAY AGAIN', () => {
      this.cameras.main.fade(250, 0, 0, 0)
      this.time.delayedCall(250, () => this.scene.start('GameScene'))
    })

    // Menu button
    this._makeButton(cx, 360, 'MENU', () => {
      this.cameras.main.fade(250, 0, 0, 0)
      this.time.delayedCall(250, () => this.scene.start('MenuScene'))
    }, 0x2980b9, 0x1a6fa3)

    // Keyboard shortcuts
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'))
    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'))
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'))

    this.cameras.main.fadeIn(300, 0, 0, 0)
  }

  _makeButton(x, y, label, onClick, color = COLOR_BUTTON, hoverColor = COLOR_BUTTON_HOVER) {
    const bg = this.add.rectangle(x, y, 220, 46, color)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x000000)

    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5)

    bg.on('pointerover', () => bg.setFillStyle(hoverColor))
    bg.on('pointerout', () => bg.setFillStyle(color))
    bg.on('pointerdown', onClick)
  }

  _drawBackground() {
    this.add.rectangle(CANVAS_WIDTH / 2, 80, CANVAS_WIDTH, 160, 0x2c3e50)
    this.add.rectangle(CANVAS_WIDTH / 2, 300, CANVAS_WIDTH, 300, GRASS_COLOR)
    this.add.rectangle(CANVAS_WIDTH / 2, 300, 280, 300, TRAIL_COLOR)
  }
}
