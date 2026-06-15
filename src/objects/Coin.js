import { LANE_X_POSITIONS, CANVAS_HEIGHT } from '../config/gameConfig.js'

export default class Coin {
  constructor(scene, lane, scrollSpeed) {
    this.scene = scene
    this.lane = lane
    this.scrollSpeed = scrollSpeed
    this._destroyed = false
    this._collected = false
  }

  create() {
    const x = LANE_X_POSITIONS[this.lane]
    const y = -18

    const shadow = this.scene.add.ellipse(3, 4, 30, 14, 0x000000, 0.28)
    const outer  = this.scene.add.circle(0, 0, 13, 0xf1c40f)
    const rim    = this.scene.add.circle(0, 0, 10, 0xd4a017)
    const center = this.scene.add.circle(0, 0,  6, 0xffd700)
    const shine  = this.scene.add.ellipse(-5, -5, 7, 5, 0xffffff, 0.65)

    this._container = this.scene.add.container(x, y, [shadow, outer, rim, center, shine])
    this._container.setDepth(2.5)

    this._pulseTween = this.scene.tweens.add({
      targets: this._container,
      scaleX: 1.12, scaleY: 1.12,
      duration: 380,
      ease: 'Sine.easeInOut',
      yoyo: true,
      loop: -1,
    })

    return this
  }

  get x() { return this._container.x }
  get y() { return this._container.y }

  getLane() { return this.lane }

  isCollected() { return this._collected }

  isOffScreen() {
    return this._container.y > CANVAS_HEIGHT + 30
  }

  collect() {
    if (this._collected) return
    this._collected = true
    if (this._pulseTween) this._pulseTween.stop()

    this.scene.tweens.add({
      targets: this._container,
      scaleX: 2.4, scaleY: 2.4, alpha: 0,
      duration: 300, ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    })
  }

  update(delta) {
    if (this._destroyed) return
    this._container.y += (this.scrollSpeed * delta) / 1000
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true
    if (this._pulseTween) this._pulseTween.destroy()
    this._container.destroy(true)
  }
}
