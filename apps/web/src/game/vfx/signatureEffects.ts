import type { Point } from "@typecade/contracts"

/** Instanced layers the VFX pool exposes to painters. */
export type VfxLayer = "sparks" | "arcs" | "rings" | "bolts" | "glows" | "flares" | "smoke" | "scorch" | "chunks"

/** Places one instance: position, scale, Euler rotation (YXZ), colour and additive intensity. */
export type VfxDraw = (layer: VfxLayer, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number, hex: number, intensity: number) => void

export interface BurstView extends Point { angle: number; power: number; end?: Point; tint?: number }

/** Draws one frame of an effect at normalised age t (0..1) with eased fade. */
export type Painter = (draw: VfxDraw, burst: BurstView, t: number, fade: number, reduced: boolean) => void

export type SignatureEffect = "nova" | "meteor" | "frost" | "whirl" | "finisher" | "spore" | "leap" | "twin" | "zap" | "skybolt" | "impact"

const FLAT = -Math.PI / 2
const easeOut = (t: number) => 1 - (1 - t) ** 3

/** Violet double shockwave with rising rune motes. */
const nova: Painter = (draw, b, t, fade, reduced) => {
  const radius = b.power * easeOut(t)
  draw("rings", b.x, .08, b.z, radius, radius, 1, FLAT, 0, t * 2, 0xc58bff, fade * 1.8)
  draw("rings", b.x, .1, b.z, radius * .82, radius * .82, 1, FLAT, 0, -t * 2, 0xf0d8ff, fade * 1.2)
  draw("glows", b.x, .05, b.z, radius * 2.6, radius * 2.6, 1, FLAT, 0, 0, 0x9a6bff, fade * .5)
  if (reduced) return
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + t
    draw("sparks", b.x + Math.sin(a) * radius, .3 + t * 1.6, b.z + Math.cos(a) * radius, .1, .32, .1, 0, a, 0, i % 2 ? 0xc58bff : 0xffffff, fade * 1.6)
  }
}

/** Burning rock streaking down, then a crater ring with flying embers. */
const meteor: Painter = (draw, b, t, fade, reduced) => {
  const fall = Math.min(1, t / .3)
  if (fall < 1) {
    const height = (1 - fall) * 9
    draw("sparks", b.x - (1 - fall) * 3, height + .4, b.z - (1 - fall) * 3, .5, .5, .5, t * 9, t * 7, 0, 0xffb066, 2.2)
    draw("glows", b.x - (1 - fall) * 3, height + .4, b.z - (1 - fall) * 3, 2.2, 2.2, 1, 0, Math.PI / 4, 0, 0xff7a2a, 1.2)
    draw("sparks", b.x - (1 - fall) * 1.5, height / 2 + .6, b.z - (1 - fall) * 1.5, .14, .14, 4.4, Math.PI / 4.6, Math.PI / 4, 0, 0xff8a3d, 1.4)
    return
  }
  const impact = (t - .3) / .7, fadeImpact = (1 - impact) ** 2
  const radius = b.power * (.4 + easeOut(impact) * .9)
  draw("rings", b.x, .07, b.z, radius, radius, 1, FLAT, 0, 0, 0xff8a3d, fadeImpact * 2)
  draw("glows", b.x, .05, b.z, radius * 3, radius * 3, 1, FLAT, 0, 0, 0xff5a1f, fadeImpact * .8)
  if (reduced) return
  for (let i = 0; i < 10; i++) {
    const a = i * 2.399, r = easeOut(impact) * (1 + i % 3 * .5) * b.power
    draw("sparks", b.x + Math.sin(a) * r, .2 + Math.sin(impact * Math.PI) * (1 + i % 4 * .4), b.z + Math.cos(a) * r, .14, .14, .14, impact * 6, a, 0, i % 3 ? 0xff8a3d : 0xffe0a0, fadeImpact * 2)
  }
}

/** Hexagonal frost ring with ice shards bursting upward. */
const frost: Painter = (draw, b, t, fade, reduced) => {
  const radius = b.power * easeOut(t)
  draw("rings", b.x, .07, b.z, radius, radius, 1, FLAT, 0, 0, 0x9fe6ff, fade * 1.6)
  draw("glows", b.x, .05, b.z, radius * 2.4, radius * 2.4, 1, FLAT, 0, 0, 0x6fd3f0, fade * .45)
  if (reduced) return
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9
    draw("sparks", b.x + Math.sin(a) * radius * .9, .35 + Math.sin(t * Math.PI) * .5, b.z + Math.cos(a) * radius * .9, .1, .7 * (1 - t), .1, .3, a, 0, 0xe8fbff, fade * 1.8)
  }
}

/** Full-circle whirlwind: three stacked spinning arcs and a dust ring. */
const whirl: Painter = (draw, b, t, fade, reduced) => {
  for (let i = 0; i < 3; i++) {
    const radius = 2.2 * (.6 + t * .5) - i * .25
    draw("arcs", b.x, .6 + i * .25, b.z, radius, radius, 1, -1.35, t * 14 + i * 2.1, 0, i === 1 ? 0xffffff : 0x7bdcff, fade * (1.8 - i * .4))
  }
  draw("rings", b.x, .06, b.z, 2.4 * easeOut(t), 2.4 * easeOut(t), 1, FLAT, 0, 0, 0xbfefff, fade)
  if (reduced) return
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + t * 10
    draw("sparks", b.x + Math.sin(a) * 2, .7, b.z + Math.cos(a) * 2, .08, .06, .7, 0, a + Math.PI / 2, 0, 0xe0faff, fade * 1.5)
  }
}

/** Fatality: golden pillar of light, double shockwave, radial blades and a lingering glow. */
const finisher: Painter = (draw, b, t, fade, reduced) => {
  const radius = (2.6 + b.power * .4) * easeOut(t)
  draw("sparks", b.x, 3 * (1 - t * .3), b.z, .35 * fade + .05, 5 * (1 - t * .5), .35 * fade + .05, 0, t * 4, 0, 0xffe39a, fade * 1.1)
  draw("rings", b.x, .08, b.z, radius, radius, 1, FLAT, 0, 0, 0xffd36b, fade * 1.4)
  draw("rings", b.x, .1, b.z, radius * .6, radius * .6, 1, FLAT, 0, 0, 0xfff0c0, fade * .9)
  draw("glows", b.x, .06, b.z, radius * 1.6, radius * 1.6, 1, FLAT, 0, 0, 0xffb347, fade * .3)
  draw("arcs", b.x, 1.2, b.z, 3 * easeOut(t), 3 * easeOut(t), 1, 0, b.angle, t * 5, 0xfff0c0, fade * 1.3)
  if (reduced) return
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, r = radius * (.6 + (i % 3) * .2)
    draw("sparks", b.x + Math.sin(a) * r, .4 + Math.sin(t * Math.PI) * (1.5 + i % 4 * .5), b.z + Math.cos(a) * r, .1, .1, 1.1 * (1 - t), 0, a, 0, i % 2 ? 0xffd36b : 0xfff0c0, fade * 1.4)
  }
  draw("bolts", b.x, .1, b.z, 1.4, 6, 1, 0, b.angle, 0, 0xfff6c8, fade * .8)
}

/** Green spore puff that drifts and expands. */
const spore: Painter = (draw, b, t, fade, reduced) => {
  draw("glows", b.x, .4 + t, b.z, 3 + t * 4, 3 + t * 4, 1, FLAT, 0, 0, 0x8fe07a, fade * .7)
  draw("rings", b.x, .08, b.z, 3 * easeOut(t), 3 * easeOut(t), 1, FLAT, 0, 0, 0xb8ff8a, fade)
  if (reduced) return
  for (let i = 0; i < 12; i++) {
    const a = i * 2.399, r = easeOut(t) * (1 + i % 3) * .9
    draw("sparks", b.x + Math.sin(a + t) * r, .3 + t * 2 + i % 3 * .3, b.z + Math.cos(a + t) * r, .16, .16, .16, t * 3, a, 0, i % 2 ? 0xc8ff9a : 0x6fd38a, fade * 1.3)
  }
}

/** Leaping strike: ground-slam ring and upward debris where the hero lands. */
const leap: Painter = (draw, b, t, fade, reduced) => {
  const radius = 1.8 * easeOut(t)
  draw("rings", b.x, .07, b.z, radius, radius, 1, FLAT, 0, 0, 0x8bd7ff, fade * 1.8)
  draw("arcs", b.x, .9, b.z, 1.8, 2.6, 1, 0, b.angle, -t * 3, 0xd8f6ff, fade * 1.6)
  if (reduced) return
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4
    draw("sparks", b.x + Math.sin(a) * radius, .15 + Math.sin(t * Math.PI) * .8, b.z + Math.cos(a) * radius, .14, .14, .14, t * 5, a, 0, 0x9aa4ae, fade * 1.2)
  }
}

/** Two crossing arcs that read as a quick double cut (drawn at offset angles, never a static cross). */
const twin: Painter = (draw, b, t, fade) => {
  const radius = 1.9 * (.75 + t * .35)
  draw("arcs", b.x, .8, b.z, radius, radius, 1, -1.25, b.angle + t * 2.6, 0, 0x65dfff, fade * 1.7)
  draw("arcs", b.x, 1.1, b.z, radius * .9, radius * .9, 1, -1.9, b.angle - t * 2.6 + 1, 0, 0xffa64f, fade * 1.5 * Math.min(1, t * 3))
}

/** Deterministic hash noise in [-1, 1]; `flicker` re-rolls the bolt shape several times per second. */
export const jitter = (index: number, flicker: number) => {
  const h = Math.sin(index * 127.1 + flicker * 311.7) * 43758.5453
  return (h - Math.floor(h)) * 2 - 1
}

/** Draws a jagged polyline between two 3D points as thin glowing segments. */
export function drawBolt(draw: VfxDraw, from: [number, number, number], to: [number, number, number], segments: number, amplitude: number, flicker: number, width: number, hex: number, intensity: number, seed = 0) {
  const [x0, y0, z0] = from, [x1, y1, z1] = to
  const dx = x1 - x0, dz = z1 - z0, length = Math.hypot(dx, dz) || 1
  const nx = -dz / length, nz = dx / length
  let px = x0, py = y0, pz = z0
  for (let i = 1; i <= segments; i++) {
    const f = i / segments, taper = i === segments ? 0 : Math.sin(f * Math.PI)
    const offset = jitter(i + seed, flicker) * amplitude * taper, lift = jitter(i + seed + 50, flicker) * amplitude * .5 * taper
    const qx = x0 + dx * f + nx * offset, qy = y0 + (y1 - y0) * f + lift, qz = z0 + dz * f + nz * offset
    const sx = qx - px, sy = qy - py, sz = qz - pz, span = Math.hypot(sx, sy, sz)
    draw("sparks", (px + qx) / 2, (py + qy) / 2, (pz + qz) / 2, width, width, span, -Math.atan2(sy, Math.hypot(sx, sz)), Math.atan2(sx, sz), 0, hex, intensity)
    px = qx; py = qy; pz = qz
  }
}

/** Caster-to-target arc (chain lightning, sentry): core + halo bolt, a side branch and an impact burst on the target. */
const zap: Painter = (draw, b, t, fade, reduced) => {
  if (!b.end) return
  const hex = b.tint ?? 0xb3eaff, flicker = Math.floor(t * 26)
  const from: [number, number, number] = [b.x, 1.3, b.z], to: [number, number, number] = [b.end.x, 1, b.end.z]
  drawBolt(draw, from, to, 9, .45, flicker, .05, 0xffffff, fade * 2.2)
  if (!reduced) {
    drawBolt(draw, from, to, 9, .45, flicker, .16, hex, fade * 1.1)
    const mid: [number, number, number] = [b.x + (b.end.x - b.x) * .55, 1.15, b.z + (b.end.z - b.z) * .55]
    drawBolt(draw, mid, [mid[0] + jitter(3, flicker) * 1.2, .2, mid[2] + jitter(4, flicker) * 1.2], 4, .25, flicker, .04, hex, fade * 1.4, 9)
  }
  impactBurst(draw, b.end.x, b.end.z, hex, t, fade, reduced, .9)
}

/** Lightning from the sky onto a struck enemy (Storm skill): vertical bolt, scorch ring and sparks. */
const skybolt: Painter = (draw, b, t, fade, reduced) => {
  const hex = b.tint ?? 0x9fdcff, flicker = Math.floor(t * 30)
  const strike = t < .5 ? 1 : (1 - t) * 2
  drawBolt(draw, [b.x + jitter(1, 0) * 1.5, 9, b.z + jitter(2, 0) * 1.5], [b.x, .9, b.z], 12, 1.1, flicker, .07, 0xffffff, strike * 2.4)
  if (!reduced) drawBolt(draw, [b.x + jitter(1, 0) * 1.5, 9, b.z + jitter(2, 0) * 1.5], [b.x, .9, b.z], 12, 1.1, flicker, .22, hex, strike * 1.1)
  impactBurst(draw, b.x, b.z, hex, t, fade, reduced, 1.2)
}

/** Hit marker on the struck target, coloured by damage source. */
const impact: Painter = (draw, b, t, fade, reduced) => impactBurst(draw, b.x, b.z, b.tint ?? 0xffffff, t, fade, reduced, b.power)

function impactBurst(draw: VfxDraw, x: number, z: number, hex: number, t: number, fade: number, reduced: boolean, size: number) {
  const radius = (.35 + easeOut(t) * 1.1) * size
  draw("rings", x, .08, z, radius, radius, 1, FLAT, 0, 0, hex, fade * 1.8)
  draw("glows", x, 1, z, 1.6 * size * (1 - t * .5), 1.6 * size * (1 - t * .5), 1, 0, Math.PI / 4, 0, hex, fade * .7)
  if (reduced) return
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + .4, r = easeOut(t) * .9 * size
    draw("sparks", x + Math.sin(a) * r, 1 + Math.sin(t * Math.PI) * .5 - t * .4, z + Math.cos(a) * r, .05, .05, .45 * (1 - t), 0, a, 0, i % 2 ? hex : 0xffffff, fade * 2)
  }
}

export const signaturePainters: Record<SignatureEffect, Painter> = { nova, meteor, frost, whirl, finisher, spore, leap, twin, zap, skybolt, impact }

export const signatureLifetimes: Record<SignatureEffect, number> = { nova: .75, meteor: 1, frost: .7, whirl: .55, finisher: 1.2, spore: 1.1, leap: .55, twin: .42, zap: .32, skybolt: .45, impact: .38 }

export const signatureColors: Record<SignatureEffect, number> = { nova: 0xc58bff, meteor: 0xff8a3d, frost: 0x9fe6ff, whirl: 0x7bdcff, finisher: 0xffd36b, spore: 0x8fe07a, leap: 0x8bd7ff, twin: 0x65dfff, zap: 0xb3eaff, skybolt: 0x9fdcff, impact: 0xffffff }

export function isSignatureEffect(kind: string): kind is SignatureEffect { return kind in signaturePainters }
