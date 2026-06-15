import Phaser from 'phaser'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/gameConfig.js'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Loading bar background
    const barBg = this.add.rectangle(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2,
      400, 20, 0x333333
    ).setOrigin(0.5)

    // Loading bar fill
    const bar = this.add.rectangle(
      CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2,
      0, 16, 0x2ecc71
    ).setOrigin(0, 0.5)

    // Label
    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 36, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5)

    this.load.on('progress', (value) => {
      bar.width = 396 * value
    })

    // No external assets for MVP — placeholders are drawn via code.
    // This scene wires the asset pipeline; real sprites will load here later.
  }

  create() {
    this.scene.start('MenuScene')
  }
}
