import {
  LANE_X_POSITIONS, CANVAS_HEIGHT, OBSTACLE_TYPES, TRAIL_CENTER_X,
} from '../config/gameConfig.js'

// 'trunk' is excluded — it uses a separate weighted spawn path
const TYPE_KEYS = Object.keys(OBSTACLE_TYPES).filter(k => k !== 'trunk')

export default class Obstacle {
  constructor(scene, lane, type, scrollSpeed) {
    this.scene = scene
    this.lane = lane
    this.type = type
    this.scrollSpeed = scrollSpeed
    this.mustJump = (type === 'trunk')
    this._destroyed = false
    this._parts = []
  }

  static randomType() {
    return TYPE_KEYS[Math.floor(Math.random() * TYPE_KEYS.length)]
  }

  create() {
    const cfg = OBSTACLE_TYPES[this.type]
    const x   = this.mustJump ? TRAIL_CENTER_X : LANE_X_POSITIONS[this.lane]
    const y   = -(cfg.height / 2 + 10)

    switch (this.type) {
      case 'snake':    this._buildSnake(x, y, cfg);    break
      case 'log':      this._buildLog(x, y, cfg);      break
      case 'stone':    this._buildStone(x, y, cfg);    break
      case 'squirrel': this._buildSquirrel(x, y, cfg); break
      case 'trunk':    this._buildTrunk(x, y, cfg);    break
    }

    return this
  }

  // ─── Snake ───────────────────────────────────────────────────────────────────
  // Viewed from above — a green snake lying across the trail.

  _buildSnake(x, y, cfg) {
    const W = cfg.width   // 62
    const H = cfg.height  // 16

    // Body shadow
    this._add(this.scene.add.ellipse(x + 2, y + 3, W + 6, H + 4, 0x000000, 0.25))

    // Body — 3 overlapping segments creating gentle S-curve
    const bodyMid  = this.scene.add.ellipse(x,     y,     W,      H,      0x27ae60)
    const bodyLeft = this.scene.add.ellipse(x - 18, y + 3, W * 0.55, H - 2, 0x229954)
    const bodyRgt  = this.scene.add.ellipse(x + 18, y - 3, W * 0.55, H - 2, 0x229954)
    bodyMid.setStrokeStyle(1, 0x1a6b3a)
    bodyLeft.setStrokeStyle(1, 0x1a6b3a)
    bodyRgt.setStrokeStyle(1, 0x1a6b3a)
    this._add(bodyLeft)
    this.rect = bodyMid   // main ref for y-tracking / collision
    this._add(bodyRgt)

    // Scale diamond pattern along body
    for (let i = -2; i <= 2; i++) {
      const dot = this.scene.add.ellipse(x + i * 11, y + (i % 2 === 0 ? 0 : 2), 6, 4, 0x1e8449)
      this._add(dot)
    }

    // Head — broader rounded triangle shape
    const head = this.scene.add.ellipse(x + W / 2 + 6, y, 20, 14, 0x1a6b3a)
    head.setStrokeStyle(1, 0x0f4020)
    this._add(head)

    // Eyes
    this._add(this.scene.add.circle(x + W / 2 + 10, y - 3, 2.5, 0xf39c12))
    this._add(this.scene.add.circle(x + W / 2 + 10, y + 3, 2.5, 0xf39c12))
    this._add(this.scene.add.circle(x + W / 2 + 10, y - 3, 1.2, 0x1a1a1a))
    this._add(this.scene.add.circle(x + W / 2 + 10, y + 3, 1.2, 0x1a1a1a))

    // Forked tongue
    const tongueBase = this.scene.add.rectangle(x + W / 2 + 17, y, 5, 2, 0xe74c3c)
    const tineTop    = this.scene.add.rectangle(x + W / 2 + 24, y - 3, 5, 1.5, 0xe74c3c)
    const tineBot    = this.scene.add.rectangle(x + W / 2 + 24, y + 3, 5, 1.5, 0xe74c3c)
    this._add(tongueBase)
    this._add(tineTop)
    this._add(tineBot)

    // Tail tip (narrow end on left)
    const tail = this.scene.add.ellipse(x - W / 2 - 4, y, 10, 5, 0x229954)
    this._add(tail)

    this._setDepth(3)
  }

  // ─── Log ─────────────────────────────────────────────────────────────────────
  // Fallen log viewed from above — see the bark surface and end cross-sections.

  _buildLog(x, y, cfg) {
    const W = cfg.width   // 85
    const H = cfg.height  // 26

    // Drop shadow
    this._add(this.scene.add.rectangle(x + 3, y + 3, W, H + 4, 0x000000, 0.3))

    // Bark body
    const body = this.scene.add.rectangle(x, y, W, H, 0x7a4a1e)
    body.setStrokeStyle(2, 0x4a2a0a)
    this.rect = body

    // Bark grain lines (horizontal streaks)
    for (let i = -1; i <= 1; i++) {
      const grain = this.scene.add.rectangle(x - 5, y + i * 7, W - 20, 2, 0x5c3317, 0.6)
      this._add(grain)
    }

    // Left end cap (cross-section)
    const endL = this.scene.add.ellipse(x - W / 2 + 1, y, H, H, 0xc8803a)
    endL.setStrokeStyle(2, 0x4a2a0a)
    this._add(endL)
    // Growth rings (left end)
    this._add(this.scene.add.ellipse(x - W / 2 + 1, y, H * 0.72, H * 0.72, 0xb87030))
    this._add(this.scene.add.ellipse(x - W / 2 + 1, y, H * 0.46, H * 0.46, 0xa06020))
    this._add(this.scene.add.ellipse(x - W / 2 + 1, y, H * 0.22, H * 0.22, 0x8a4e18))
    // Pith dot
    this._add(this.scene.add.circle(x - W / 2 + 1, y, 3, 0x5c3317))

    // Right end cap (cross-section — partially visible)
    const endR = this.scene.add.ellipse(x + W / 2 - 1, y, H, H, 0xc8803a)
    endR.setStrokeStyle(2, 0x4a2a0a)
    this._add(endR)
    this._add(this.scene.add.ellipse(x + W / 2 - 1, y, H * 0.6, H * 0.6, 0xb87030))
    this._add(this.scene.add.ellipse(x + W / 2 - 1, y, H * 0.3, H * 0.3, 0x8a4e18))
    this._add(this.scene.add.circle(x + W / 2 - 1, y, 3, 0x5c3317))

    // Moss patches on bark
    this._add(this.scene.add.ellipse(x - 12, y - 4, 14, 7, 0x2d6a2d, 0.8))
    this._add(this.scene.add.ellipse(x + 8,  y + 4, 10, 6, 0x2d6a2d, 0.8))

    this._setDepth(3)
  }

  // ─── Stone ───────────────────────────────────────────────────────────────────
  // Rock/boulder viewed from above.

  _buildStone(x, y, cfg) {
    const W = cfg.width   // 38
    const H = cfg.height  // 38

    // Drop shadow
    this._add(this.scene.add.ellipse(x + 4, y + 4, W + 6, H + 6, 0x000000, 0.3))

    // Dark shadow underside of stone
    this._add(this.scene.add.ellipse(x + 3, y + 3, W, H, 0x5a6060))

    // Main boulder
    const stone = this.scene.add.ellipse(x, y, W, H, 0x95a5a6)
    stone.setStrokeStyle(2, 0x6c7a7d)
    this.rect = stone

    // Second overlapping rock (gives irregular look)
    const rock2 = this.scene.add.ellipse(x - 6, y - 4, W * 0.65, H * 0.65, 0x8d9fa0)
    rock2.setStrokeStyle(1, 0x6c7a7d)
    this._add(rock2)

    // Highlight (sun catching upper-left face)
    this._add(this.scene.add.ellipse(x - 9, y - 9, 12, 8, 0xd5dcdc, 0.7))

    // Crack lines
    const crack1 = this.scene.add.rectangle(x + 3, y + 2, 2, 14, 0x5a6565)
    crack1.rotation = 0.4
    this._add(crack1)
    const crack2 = this.scene.add.rectangle(x - 4, y - 2, 1.5, 10, 0x5a6565)
    crack2.rotation = -0.3
    this._add(crack2)

    // Moss spot
    this._add(this.scene.add.ellipse(x + 8, y + 7, 9, 6, 0x4a7a4a, 0.6))

    this._setDepth(3)
  }

  // ─── Squirrel ────────────────────────────────────────────────────────────────
  // Squirrel viewed from above, facing down-trail (toward player).

  _buildSquirrel(x, y, cfg) {
    const W = cfg.width   // 28
    const H = cfg.height  // 30

    // Drop shadow
    this._add(this.scene.add.ellipse(x + 2, y + 3, W + 6, H + 4, 0x000000, 0.25))

    // Bushy tail — arched above body (3 layered ellipses)
    const tailOuter = this.scene.add.ellipse(x,  y - H / 2 - 12, 28, 20, 0xd35400)
    const tailMid   = this.scene.add.ellipse(x + 2, y - H / 2 - 10, 20, 14, 0xe67e22)
    const tailInner = this.scene.add.ellipse(x + 1, y - H / 2 - 8,  12, 9,  0xf39c12)
    this._add(tailOuter)
    this._add(tailMid)
    this._add(tailInner)

    // Body
    const body = this.scene.add.ellipse(x, y + 2, W, H - 4, 0xd35400)
    body.setStrokeStyle(1.5, 0x922b00)
    this.rect = body

    // Belly patch (lighter underside)
    this._add(this.scene.add.ellipse(x, y + 4, W * 0.5, H * 0.45, 0xf0a040))

    // Head
    const head = this.scene.add.circle(x, y + H / 2 + 6, 10, 0xc0471a)
    head.setStrokeStyle(1, 0x922b00)
    this._add(head)

    // Ears
    this._add(this.scene.add.circle(x - 7, y + H / 2 + 2, 4, 0xd35400))
    this._add(this.scene.add.circle(x + 7, y + H / 2 + 2, 4, 0xd35400))
    this._add(this.scene.add.circle(x - 7, y + H / 2 + 2, 2, 0xf08060))
    this._add(this.scene.add.circle(x + 7, y + H / 2 + 2, 2, 0xf08060))

    // Eyes
    this._add(this.scene.add.circle(x - 4, y + H / 2 + 7, 2, 0x1a1a1a))
    this._add(this.scene.add.circle(x + 4, y + H / 2 + 7, 2, 0x1a1a1a))
    // Eye shine
    this._add(this.scene.add.circle(x - 3.2, y + H / 2 + 6.2, 0.8, 0xffffff))
    this._add(this.scene.add.circle(x + 4.8, y + H / 2 + 6.2, 0.8, 0xffffff))

    // Tiny nose
    this._add(this.scene.add.circle(x, y + H / 2 + 12, 1.5, 0x4a1a00))

    // Front paws (tiny)
    this._add(this.scene.add.circle(x - 10, y + 4, 3, 0xc0471a))
    this._add(this.scene.add.circle(x + 10, y + 4, 3, 0xc0471a))

    this._setDepth(3)
  }

  // ─── Trunk ───────────────────────────────────────────────────────────────────
  // A massive fallen tree crossing ALL THREE lanes — must be jumped.

  _buildTrunk(x, y, cfg) {
    const W = cfg.width   // 260
    const H = cfg.height  // 34

    // Drop shadow
    this._add(this.scene.add.rectangle(x + 5, y + 6, W + 10, H + 8, 0x000000, 0.35))

    // Main bark body
    const body = this.scene.add.rectangle(x, y, W, H, 0x6b3a1f)
    body.setStrokeStyle(2, 0x3d200e)
    this.rect = body

    // Horizontal bark grain lines
    for (let i = -1; i <= 1; i++) {
      this._add(this.scene.add.rectangle(x, y + i * 9, W - 40, 2, 0x4a2810, 0.65))
    }

    // Bark knots
    this._add(this.scene.add.ellipse(x - 55, y + 5,  16, 11, 0x3a1e0a))
    this._add(this.scene.add.ellipse(x + 45, y - 4,  12, 9,  0x3a1e0a))

    // Moss patches
    this._add(this.scene.add.ellipse(x - 20, y + 5,  22, 11, 0x2d6a2d, 0.75))
    this._add(this.scene.add.ellipse(x + 75, y - 3,  17, 10, 0x2d6a2d, 0.70))

    // Amber "jump me" hazard stripe through center
    this._add(this.scene.add.rectangle(x, y, W - 20, 5, 0xf39c12, 0.40))

    // Left end cap (cross-section with growth rings)
    const endL = this.scene.add.ellipse(x - W / 2, y, H, H, 0xc8803a)
    endL.setStrokeStyle(2, 0x3d200e)
    this._add(endL)
    this._add(this.scene.add.ellipse(x - W / 2, y, H * 0.70, H * 0.70, 0xb07030))
    this._add(this.scene.add.ellipse(x - W / 2, y, H * 0.42, H * 0.42, 0x905020))
    this._add(this.scene.add.circle(x - W / 2, y, 4, 0x5c3317))

    // Right end cap
    const endR = this.scene.add.ellipse(x + W / 2, y, H, H, 0xc8803a)
    endR.setStrokeStyle(2, 0x3d200e)
    this._add(endR)
    this._add(this.scene.add.ellipse(x + W / 2, y, H * 0.70, H * 0.70, 0xb07030))
    this._add(this.scene.add.ellipse(x + W / 2, y, H * 0.42, H * 0.42, 0x905020))
    this._add(this.scene.add.circle(x + W / 2, y, 4, 0x5c3317))

    this._setDepth(3)
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  _add(obj) {
    this._parts.push(obj)
    return obj
  }

  _setDepth(d) {
    this.rect.setDepth(d)
    for (const p of this._parts) p.setDepth(d)
  }

  update(delta) {
    if (this._destroyed) return
    const dy = (this.scrollSpeed * delta) / 1000
    this.rect.y += dy
    for (const p of this._parts) p.y += dy
  }

  getLane() { return this.lane }

  isOffScreen() {
    return this.rect.y > CANVAS_HEIGHT + this.rect.height + 20
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true
    this.rect.destroy()
    for (const p of this._parts) p.destroy()
    this._parts = []
  }
}
