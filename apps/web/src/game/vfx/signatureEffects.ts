import type { Point } from "@typecade/contracts"

/** Instanced layers the VFX pool exposes to painters. */
export type VfxLayer = "sparks" | "arcs" | "rings" | "bolts" | "glows"

/** Places one instance: position, scale, Euler rotation (YXZ), colour and additive intensity. */
export type VfxDraw = (layer: VfxLayer, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number, hex: number, intensity: number) => void

export interface BurstView extends Point { angle: number; power: number; end?: Point; tint?: number }

/** Draws one frame of an effect at normalised age t (0..1) with eased fade. */
export type Painter = (draw: VfxDraw, burst: BurstView, t: number, fade: number, reduced: boolean) => void

export type SignatureEffect = "nova" | "meteor" | "frost" | "whirl" | "finisher" | "spore" | "leap" | "twin"

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
  draw("sparks", b.x, 3 * (1 - t * .3), b.z, .9 * fade + .1, 6 * (1 - t * .5), .9 * fade + .1, 0, t * 4, 0, 0xffe39a, fade * 2.4)
  draw("rings", b.x, .08, b.z, radius, radius, 1, FLAT, 0, 0, 0xffd36b, fade * 2.2)
  draw("rings", b.x, .1, b.z, radius * .6, radius * .6, 1, FLAT, 0, 0, 0xffffff, fade * 1.8)
  draw("glows", b.x, .06, b.z, radius * 3.2, radius * 3.2, 1, FLAT, 0, 0, 0xffb347, fade * .9)
  draw("arcs", b.x, 1.2, b.z, 3 * easeOut(t), 3 * easeOut(t), 1, 0, b.angle, t * 5, 0xfff0c0, fade * 2)
  if (reduced) return
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, r = radius * (.6 + (i % 3) * .2)
    draw("sparks", b.x + Math.sin(a) * r, .4 + Math.sin(t * Math.PI) * (1.5 + i % 4 * .5), b.z + Math.cos(a) * r, .1, .1, 1.1 * (1 - t), 0, a, 0, i % 2 ? 0xffd36b : 0xffffff, fade * 2)
  }
  draw("bolts", b.x, .1, b.z, 2, 7, 1, 0, b.angle, 0, 0xfff6c8, fade * 1.4)
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

export const signaturePainters: Record<SignatureEffect, Painter> = { nova, meteor, frost, whirl, finisher, spore, leap, twin }

export const signatureLifetimes: Record<SignatureEffect, number> = { nova: .75, meteor: 1, frost: .7, whirl: .55, finisher: 1.2, spore: 1.1, leap: .55, twin: .42 }

export const signatureColors: Record<SignatureEffect, number> = { nova: 0xc58bff, meteor: 0xff8a3d, frost: 0x9fe6ff, whirl: 0x7bdcff, finisher: 0xffd36b, spore: 0x8fe07a, leap: 0x8bd7ff, twin: 0x65dfff }

export function isSignatureEffect(kind: string): kind is SignatureEffect { return kind in signaturePainters }
