/**
 * Trauma-based camera shake (presentation only). Impacts add trauma; the felt shake is trauma²,
 * so small hits stay subtle and big ones jolt. Offsets come from layered sines (smooth, not jitter)
 * plus a directional kick that springs back, so a strike shoves the view the way the blow went.
 */
export class CameraShake {
  private trauma = 0
  private kickX = 0
  private kickZ = 0
  private time = 0
  /** World-unit offsets and a roll (radians) for this frame. */
  readonly offset = { x: 0, y: 0, z: 0, roll: 0 }

  /** Adds trauma (0..1); `dirX/dirZ` push the view along the blow for a short kick. */
  add(amount: number, dirX = 0, dirZ = 0) {
    this.trauma = Math.min(1, Math.max(this.trauma, amount * .6) + amount * .4)
    const length = Math.hypot(dirX, dirZ)
    if (length > .001) { this.kickX += dirX / length * amount * .55; this.kickZ += dirZ / length * amount * .55 }
  }

  reset() { this.trauma = this.kickX = this.kickZ = 0; Object.assign(this.offset, { x: 0, y: 0, z: 0, roll: 0 }) }

  get level() { return this.trauma }

  /** Advances the shake; `scale` 0 disables it (Reduced Effects / shake setting). */
  update(delta: number, scale: number) {
    this.time += delta
    this.trauma = Math.max(0, this.trauma - delta * 1.6)
    const decay = Math.exp(-delta * 14)
    this.kickX *= decay; this.kickZ *= decay
    const shake = this.trauma * this.trauma * scale, t = this.time
    const n = (a: number, b: number, c: number) => Math.sin(t * a) * .5 + Math.sin(t * b + 1.7) * .3 + Math.sin(t * c + 4.1) * .2
    this.offset.x = n(37, 61, 89) * 1.1 * shake + this.kickX * scale
    this.offset.z = n(43, 71, 97) * 1.1 * shake + this.kickZ * scale
    this.offset.y = n(29, 53, 83) * .45 * shake
    this.offset.roll = n(23, 47, 67) * .035 * shake
  }
}
