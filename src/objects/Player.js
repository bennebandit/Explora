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
    const x    = LANE_X_POSITIONS[this.currentLane]
    const y    = PLAYER_Y
    const halfH = PLAYER_HEIGHT / 2

    // Shadow shown while airborne
    this.shadow = this.scene.add.ellipse(x, y + 4, PLAYER_WIDTH + 16, 14, 0x000000, 0.35)
    this.shadow.setDepth(1)
    this.shadow.setVisible(false)

    // ── Survivor character parts (container-local coords, back → front) ──

    // Backpack (behind body — drawn first)
    const pack     = this.scene.add.rectangle(2, -2, PLAYER_WIDTH - 6, PLAYER_HEIGHT - 8, 0x7a6238)
    const packTop  = this.scene.add.ellipse(2, -halfH + 4, PLAYER_WIDTH - 10, 10, 0x6a5228)
    const strapL   = this.scene.add.rectangle(-5, 2, 3, PLAYER_HEIGHT - 14, 0x5a4820)
    const strapR   = this.scene.add.rectangle( 9, 2, 3, PLAYER_HEIGHT - 14, 0x5a4820)

    // Body — olive military jacket
    const body = this.scene.add.rectangle(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, 0x4b5320)

    // Jacket collar (two angled dark rectangles forming a V-neck)
    const lapelL = this.scene.add.rectangle(-5, -halfH + 8, 5, 14, 0x3d4418)
    lapelL.rotation = -0.35
    const lapelR = this.scene.add.rectangle( 5, -halfH + 8, 5, 14, 0x3d4418)
    lapelR.rotation = 0.35

    // Arms (swing during run animation)
    this._armL  = this.scene.add.rectangle(-PLAYER_WIDTH / 2 - 5, 0,  8, 22, 0x4b5320)
    this._armR  = this.scene.add.rectangle( PLAYER_WIDTH / 2 + 5, 0,  8, 22, 0x4b5320)
    this._gloveL = this.scene.add.circle(-PLAYER_WIDTH / 2 - 5, 13, 4, 0x8b6030)
    this._gloveR = this.scene.add.circle( PLAYER_WIDTH / 2 + 5, 13, 4, 0x8b6030)

    // Belt
    const belt   = this.scene.add.rectangle(0, halfH - 6, PLAYER_WIDTH + 2, 5, 0x2a1e0e)
    const buckle = this.scene.add.rectangle(0, halfH - 6, 8, 5, 0xb08020)

    // Cargo pants
    const pants = this.scene.add.rectangle(0, halfH + 5, PLAYER_WIDTH + 2, 12, 0x3d2e1a)

    // Boots
    this._legL = this.scene.add.rectangle(-6, halfH + 14, 10, 14, 0x1e120a)
    this._legR = this.scene.add.rectangle( 6, halfH + 14, 10, 14, 0x1e120a)
    // Boot highlight
    const bootHL = this.scene.add.rectangle(-8, halfH + 10, 3, 6, 0x3a2818)
    const bootHR = this.scene.add.rectangle( 4, halfH + 10, 3, 6, 0x3a2818)

    // Head — tanned survivor skin
    const head = this.scene.add.circle(0, -halfH - 10, 13, 0xc8814a)

    // Stubble / jaw shadow
    const beard = this.scene.add.ellipse(0, -halfH - 4, 17, 8, 0x9a5c28, 0.6)

    // Boonie hat brim (large flat ellipse)
    const hatBrim = this.scene.add.ellipse(0, -halfH - 19, 34, 11, 0x3a3c1e)
    // Hat crown
    const hatCrown = this.scene.add.ellipse(0, -halfH - 23, 22, 11, 0x3a3c1e)
    // Hat band detail
    const hatBand = this.scene.add.rectangle(0, -halfH - 18, 22, 3, 0x5a5228)

    // Eyes — whites with dark pupils
    const ewL  = this.scene.add.circle(-4, -halfH - 11, 3.5, 0xffffff)
    const ewR  = this.scene.add.circle( 4, -halfH - 11, 3.5, 0xffffff)
    const eyeL = this.scene.add.circle(-4, -halfH - 11, 2,   0x1a1a2e)
    const eyeR = this.scene.add.circle( 4, -halfH - 11, 2,   0x1a1a2e)

    // Build container — order = painter's order (first = behind)
    this.container = this.scene.add.container(x, y, [
      // Backpack layer
      pack, packTop, strapL, strapR,
      // Body
      body,
      // Arms (behind body edges — drawn before jacket details)
      this._armL, this._armR,
      this._gloveL, this._gloveR,
      // Jacket detail
      lapelL, lapelR,
      // Lower body
      belt, buckle, pants,
      // Legs/boots
      this._legL, this._legR, bootHL, bootHR,
      // Head layers (front)
      head, beard,
      hatBrim, hatCrown, hatBand,
      ewL, ewR, eyeL, eyeR,
    ])
    this.container.setDepth(2)

    this.cursors  = this.scene.input.keyboard.createCursorKeys()
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.wKey     = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.aKey     = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.dKey     = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)

    this._legPhase = 0
    this._legTimer = this.scene.time.addEvent({
      delay: 110, callback: this._animateLegs, callbackScope: this, loop: true,
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
    const offset = this._legPhase === 0 ? 5 : -5
    const halfH  = PLAYER_HEIGHT / 2
    this._legL.y  = halfH + 14 + offset
    this._legR.y  = halfH + 14 - offset
    // Arms swing opposite to same-side leg
    this._armL.y   = offset * 0.6
    this._armR.y   = -offset * 0.6
    this._gloveL.y = 13 + offset * 0.6
    this._gloveR.y = 13 - offset * 0.6
  }
}
