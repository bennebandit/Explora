import Phaser from 'phaser'
import {
  LANE_X_POSITIONS, PLAYER_Y, PLAYER_WIDTH, PLAYER_HEIGHT,
  JUMP_DURATION, LANE_SWITCH_DURATION, INPUT_COOLDOWN,
} from '../config/gameConfig.js'

export default class Player {
  constructor(scene) {
    this.scene = scene
    this.currentLane = 1
    this.isJumping = false
    this.isAlive = true
    this._inputCooldown = false
    this._switchTween = null
    this._jumpTween = null
  }

  create() {
    const x = LANE_X_POSITIONS[this.currentLane]
    const y = PLAYER_Y

    // Shadow shown while airborne — sits behind everything
    this.shadow = this.scene.add.ellipse(x, y + 4, PLAYER_WIDTH + 12, 14, 0x000000, 0.35)
    this.shadow.setDepth(1)
    this.shadow.setVisible(false)

    // Character parts (relative to container origin)
    const halfH = PLAYER_HEIGHT / 2
    const body  = this.scene.add.rectangle(0, 2,       PLAYER_WIDTH, PLAYER_HEIGHT, 0x3498db)
    const head  = this.scene.add.circle(0, -halfH - 10, 13, 0xf5cba7)
    const hair  = this.scene.add.ellipse(0, -halfH - 17, 22, 10, 0x5d4037)
    const eyeL  = this.scene.add.circle(-4, -halfH - 12, 2.5, 0x2c3e50)
    const eyeR  = this.scene.add.circle( 4, -halfH - 12, 2.5, 0x2c3e50)
    this._legL  = this.scene.add.rectangle(-6, halfH + 8, 9, 16, 0x27ae60)
    this._legR  = this.scene.add.rectangle( 6, halfH + 8, 9, 16, 0x27ae60)

    this.container = this.scene.add.container(x, y, [
      body, head, hair, eyeL, eyeR, this._legL, this._legR,
    ])
    // Depth 2: sits behind obstacles (depth 3) normally; raised to 5 while jumping
    this.container.setDepth(2)

    this.cursors  = this.scene.input.keyboard.createCursorKeys()
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.wKey     = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.aKey     = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.dKey     = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)

    this._legPhase = 0
    this._legTimer = this.scene.time.addEvent({
      delay: 120, callback: this._animateLegs, callbackScope: this, loop: true,
    })

    return this
  }

  update() {
    if (!this.isAlive) return

    if (!this._inputCooldown) {
      const goLeft  = Phaser.Input.Keyboard.JustDown(this.cursors.left)  ||
                      Phaser.Input.Keyboard.JustDown(this.aKey)
      const goRight = Phaser.Input.Keyboard.JustDown(this.cursors.right) ||
                      Phaser.Input.Keyboard.JustDown(this.dKey)

      if (goLeft)       this._moveToLane(this.currentLane - 1)
      else if (goRight) this._moveToLane(this.currentLane + 1)
    }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)   ||
                        Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                        Phaser.Input.Keyboard.JustDown(this.spaceKey)      ||
                        Phaser.Input.Keyboard.JustDown(this.wKey)
    if (jumpPressed && !this.isJumping) this._jump()

    this.shadow.x = this.container.x
  }

  getLane()  { return this.currentLane }
  isInAir()  { return this.isJumping }

  die() {
    if (!this.isAlive) return
    this.isAlive = false
    this._legTimer.destroy()
    if (this._jumpTween) this._jumpTween.stop()

    this.shadow.setVisible(false)
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0, scaleX: 1.9, scaleY: 1.9,
      duration: 600, ease: 'Power2',
    })
  }

  destroy() {
    this.container && this.container.destroy(true)
    this.shadow    && this.shadow.destroy()
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  _moveToLane(targetLane) {
    if (targetLane < 0 || targetLane >= LANE_X_POSITIONS.length) return

    this.currentLane = targetLane
    this._inputCooldown = true
    this.scene.time.delayedCall(INPUT_COOLDOWN, () => { this._inputCooldown = false })

    if (this._switchTween) this._switchTween.stop()
    this._switchTween = this.scene.tweens.add({
      targets: this.container,
      x: LANE_X_POSITIONS[targetLane],
      duration: LANE_SWITCH_DURATION,
      ease: 'Power2',
    })
  }

  _jump() {
    this.isJumping = true
    this.shadow.setVisible(true)
    this.shadow.setScale(1)

    // Rise above obstacles while airborne
    this.container.setDepth(5)

    this._jumpTween = this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.55, scaleY: 1.55,
      duration: JUMP_DURATION / 2,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.isJumping = false
        this.shadow.setVisible(false)
        this.container.setScale(1)
        // Return behind obstacles on landing
        this.container.setDepth(2)
      },
    })

    this.scene.tweens.add({
      targets: this.shadow,
      scaleX: 0.4, scaleY: 0.4,
      duration: JUMP_DURATION / 2,
      ease: 'Quad.easeOut',
      yoyo: true,
    })
  }

  _animateLegs() {
    if (!this.isAlive || this.isJumping) return
    this._legPhase = (this._legPhase + 1) % 2
    const offset = this._legPhase === 0 ? 4 : -4
    this._legL.y = PLAYER_HEIGHT / 2 + 8 + offset
    this._legR.y = PLAYER_HEIGHT / 2 + 8 - offset
  }
}
