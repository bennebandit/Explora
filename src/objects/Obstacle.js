import {
  LANE_X_POSITIONS, CANVAS_HEIGHT, OBSTACLE_TYPES,
} from '../config/gameConfig.js'

const TYPE_KEYS = Object.keys(OBSTACLE_TYPES)

export default class Obstacle {
  constructor(scene, lane, type, scrollSpeed) {
    this.scene = scene
    this.lane = lane
    this.type = type
    this.scrollSpeed = scrollSpeed
    this._destroyed = false
  }

  static randomType() {
    return TYPE_KEYS[Math.floor(Math.random() * TYPE_KEYS.length)]
  }

  create() {
    const cfg = OBSTACLE_TYPES[this.type]
    const x   = LANE_X_POSITIONS[this.lane]
    const y   = -(cfg.height / 2 + 10)

    switch (this.type) {
      case 'stone':
        this.rect = this.scene.add.ellipse(x, y, cfg.width, cfg.height, cfg.color)
        this.rect.setStrokeStyle(3, 0x7f8c8d)
        this.rect.setDepth(3)
        break

      case 'snake':
        this.rect = this.scene.add.ellipse(x, y, cfg.width, cfg.height, cfg.color)
        this.rect.setStrokeStyle(2, 0x27ae60)
        this.rect.setDepth(3)
        this._head = this.scene.add.circle(x, y + cfg.height / 2 + 6, 7, cfg.color)
        this._head.setStrokeStyle(1, 0x1a8a47)
        this._head.setDepth(3)
        break

      case 'squirrel':
        this.rect = this.scene.add.ellipse(x, y, cfg.width, cfg.height, cfg.color)
        this.rect.setDepth(3)
        this._tail = this.scene.add.ellipse(x, y - cfg.height / 2 - 8, 20, 14, 0xd35400)
        this._tail.setDepth(3)
        break

      default: // log
        this.rect = this.scene.add.rectangle(x, y, cfg.width, cfg.height, cfg.color)
        this.rect.setStrokeStyle(2, 0x6d3b0f)
        this.rect.setDepth(3)
        this._ring = this.scene.add.circle(x, y, cfg.height / 2 - 3, 0x6d3b0f)
        this._ring.setStrokeStyle(2, 0x5c3317)
        this._ring.setDepth(3)
        break
    }

    return this
  }

  update(delta) {
    if (this._destroyed) return
    const dy = (this.scrollSpeed * delta) / 1000
    this.rect.y  += dy
    if (this._head) this._head.y += dy
    if (this._tail) this._tail.y += dy
    if (this._ring) this._ring.y += dy
  }

  getLane() { return this.lane }

  isOffScreen() {
    return this.rect.y > CANVAS_HEIGHT + this.rect.height + 20
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true
    this.rect.destroy()
    if (this._head) this._head.destroy()
    if (this._tail) this._tail.destroy()
    if (this._ring) this._ring.destroy()
  }
}
