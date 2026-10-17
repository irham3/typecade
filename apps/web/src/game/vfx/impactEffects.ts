import { drawBolt, jitter, type Painter, type VfxDraw } from "./signatureEffects"

/**
 * Heavy, readable impact effects: kills burst into debris and a rising soul, explosions throw a
 * fireball, smoke, shrapnel and leave a scorch mark, finished words land with a flash and speed
 * lines, and each automatic weapon draws a tracer from its familiar to the target.
 * Presentation only; every value is derived from the burst's own normalised age.
 */
export type ImpactEffect = "gore" | "explosion" | "strike" | "typo" | "bolthit" | "tracer" | "cleaveSkill" | "stormSkill" | "healSkill" | "laststand" | "loot"

const FLAT = -Math.PI / 2
const GRAVITY = 26
const easeOut = (t: number) => 1 - (1 - t) ** 3
/** Stable 0..1 noise per index and burst position, so two bursts never share the same spray. */
const hash = (i: number, x: number, z: number) => { const h = Math.sin(i * 91.7 + x * 12.9898 + z * 78.233) * 43758.5453; return h - Math.floor(h) }
const shade = (hex: number, factor: number) => {
  const c = (shift: number) => Math.max(0, Math.min(255, Math.round((hex >> shift & 255) * factor)))
  return c(16) << 16 | c(8) << 8 | c(0)
}

/** Ballistic debris: launched up and out, falls under gravity, settles and shrinks on the floor. */
function debris(draw: VfxDraw, x: number, z: number, life: number, t: number, count: number, speed: number, size: number, colors: readonly number[], seedY = 1) {
  const time = t * life
  for (let i = 0; i < count; i++) {
    const a = hash(i, x, z) * Math.PI * 2, out = speed * (.45 + hash(i + 7, x, z) * .75), up = speed * (.9 + hash(i + 13, x, z) * .9)
    const flight = up * 2 / GRAVITY, airborne = Math.min(time, flight)
    const drift = out * airborne + out * .15 * Math.max(0, time - flight)
    const y = Math.max(.06, seedY + up * airborne - GRAVITY * airborne * airborne / 2 - (time > flight ? seedY : 0))
    const spin = time < flight ? time * (8 + i) : flight * (8 + i)
    const s = size * (.6 + hash(i + 3, x, z) * .8) * (t > .7 ? 1 - (t - .7) / .3 : 1)
    draw("chunks", x + Math.sin(a) * drift, y, z + Math.cos(a) * drift, s, s * .8, s, spin, a, spin * .6, colors[i % colors.length]!, 1)
  }
}

function smokePuffs(draw: VfxDraw, x: number, z: number, t: number, count: number, spread: number, rise: number, size: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const a = hash(i + 40, x, z) * Math.PI * 2, r = easeOut(t) * spread * (.4 + hash(i + 41, x, z) * .6)
    const s = size * (.6 + t * 1.4) * (.7 + hash(i + 42, x, z) * .6)
    draw("smoke", x + Math.sin(a) * r, .5 + t * rise * (.6 + hash(i + 43, x, z) * .8), z + Math.cos(a) * r, s, s, 1, 0, 0, a + t, 0xffffff, alpha * (1 - t) * Math.min(1, t * 8))
  }
}

/** Enemy death: white pop, gibs in the foe's colour, a smoke puff and its soul drifting up. */
const gore: Painter = (draw, b, t, fade, reduced) => {
  const tint = b.tint ?? 0xe5caa1, big = b.power
  if (t < .16) draw("flares", b.x, 1.1 * big, b.z, 3.2 * big * (1 - t * 3), 3.2 * big * (1 - t * 3), 1, 0, 0, 0, 0xffffff, 2.6)
  const ring = (.4 + easeOut(t) * 2.2) * big
  draw("rings", b.x, .07, b.z, ring, ring, 1, FLAT, 0, 0, tint, fade * 1.3)
  draw("glows", b.x, .05, b.z, 3 * big, 3 * big, 1, FLAT, 0, 0, tint, fade * .35)
  draw("flares", b.x, 1.2 + easeOut(t) * 2.4, b.z, (.9 + t * .4) * big, (1.2 + t * .5) * big, 1, 0, 0, 0, shade(tint, 1.4) | 0x303030, fade * 1.3)
  if (reduced) return
  debris(draw, b.x, b.z, 1.1, t, Math.round(9 * Math.min(2, big)), 4.2 * Math.sqrt(big), .2 * big, [tint, shade(tint, .6), shade(tint, .8), 0xe8e0d0], .9)
  smokePuffs(draw, b.x, b.z, t, 3, 1.2 * big, 1.4, 1.3 * big, .45)
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + b.angle, r = easeOut(t) * 2.4 * big
    draw("sparks", b.x + Math.sin(a) * r, 1 + Math.sin(t * Math.PI) * .6, b.z + Math.cos(a) * r, .05, .05, .6 * (1 - t), 0, a, 0, i % 2 ? tint : 0xffffff, fade * 2)
  }
}

/** Barrel, bomber and blast: flash, rolling fireball, shockwave, shrapnel, smoke column and a scorch mark. */
const explosion: Painter = (draw, b, t, fade, reduced) => {
  const p = b.power
  if (t < .12) draw("flares", b.x, 1.2, b.z, 10 * p * (1 - t * 4), 10 * p * (1 - t * 4), 1, 0, 0, 0, 0xfff2c0, 3.2)
  const shock = Math.min(1, t / .35), ring = 4.6 * p * easeOut(shock)
  if (shock < 1) {
    draw("rings", b.x, .1, b.z, ring, ring, 1, FLAT, 0, 0, 0xffd28a, (1 - shock) * 2.4)
    draw("rings", b.x, .12, b.z, ring * .8, ring * .8, 1, FLAT, 0, 0, 0xff7a2a, (1 - shock) * 1.6)
  }
  draw("glows", b.x, .05, b.z, 9 * p, 9 * p, 1, FLAT, 0, 0, 0xff6a20, fade * .9)
  // Scorch: dark, lingering, fades last.
  draw("scorch", b.x, .03, b.z, 4.2 * p, 4.2 * p, 1, FLAT, 0, b.angle, 0xffffff, .7 * (1 - t ** 4))
  const balls = reduced ? 2 : 7
  for (let i = 0; i < balls; i++) {
    const a = i * 2.399 + b.angle, r = easeOut(Math.min(1, t * 2.2)) * 1.5 * p * (.5 + (i % 3) * .25)
    const heat = Math.max(0, 1 - t * 1.7), size = (1.6 + t * 2.2) * p * (.7 + (i % 2) * .4)
    draw("flares", b.x + Math.sin(a) * r, .9 + t * 2.2 + (i % 3) * .35, b.z + Math.cos(a) * r, size, size, 1, 0, 0, a, i % 3 ? 0xff7a2a : 0xffc060, heat * 2.2)
  }
  if (reduced) return
  smokePuffs(draw, b.x, b.z, Math.max(0, t - .08) / .92, 8, 2.4 * p, 3.6, 2.2 * p, .62)
  debris(draw, b.x, b.z, 1.6, t, 16, 6.5, .22 * p, [0x5a3a22, 0x7a5232, 0x2a2420, 0xff8a3d, 0x9a7048], .6)
  for (let i = 0; i < 12; i++) {
    const a = hash(i + 60, b.x, b.z) * Math.PI * 2, r = easeOut(t) * (2 + hash(i + 61, b.x, b.z) * 3) * p
    draw("sparks", b.x + Math.sin(a) * r, .4 + Math.sin(t * Math.PI) * (1.5 + i % 4 * .6), b.z + Math.cos(a) * r, .07, .07, .45 * (1 - t), 0, a, 0, i % 3 ? 0xffb050 : 0xfff0c0, fade * 2.4)
  }
}

/** A finished word lands: white flash, speed lines along the blow and a tight impact ring. */
const strike: Painter = (draw, b, t, fade, reduced) => {
  const p = b.power, flash = Math.max(0, 1 - t * 2.6)
  draw("flares", b.x, 1.15, b.z, 3.4 * p * (.5 + flash * .5), 3.4 * p * (.5 + flash * .5), 1, 0, 0, b.angle, b.tint ?? 0xffffff, flash * 3)
  draw("rings", b.x, .9, b.z, (.3 + easeOut(t) * 1.4) * p, (.3 + easeOut(t) * 1.4) * p, 1, FLAT + .5, b.angle, 0, b.tint ?? 0xdff6ff, fade * 2)
  if (reduced) return
  for (let i = 0; i < 9; i++) {
    const spread = (i - 4) * .22, a = b.angle + spread, r = .4 + easeOut(t) * (1.6 + (i % 3) * .5) * p
    draw("sparks", b.x + Math.sin(a) * r, 1.05 + (i % 3 - 1) * .25, b.z + Math.cos(a) * r, .06, .06, (1.1 - Math.abs(spread)) * (1 - t) * p, 0, a, 0, i % 2 ? 0xffffff : b.tint ?? 0x9fe6ff, fade * 2.6)
  }
}

/** Mistyped letter: a red cross pops over the hero's head with a short flicker ring. */
const typo: Painter = (draw, b, t, fade) => {
  const pop = 1 + Math.sin(Math.min(1, t * 3) * Math.PI) * .35, y = 3.4 + t * .4
  draw("sparks", b.x, y, b.z, .1, .1, .7 * pop, Math.PI / 4, b.angle + Math.PI / 2, 0, 0xff4a4a, fade * 2.6)
  draw("sparks", b.x, y, b.z, .1, .1, .7 * pop, -Math.PI / 4, b.angle + Math.PI / 2, 0, 0xff4a4a, fade * 2.6)
  draw("flares", b.x, y, b.z, 1.2 * pop, 1.2 * pop, 1, 0, 0, 0, 0xff3030, fade * 1.2)
  draw("rings", b.x, .08, b.z, .9 + t * .6, .9 + t * .6, 1, FLAT, 0, 0, 0xff5050, fade * (t * 40 % 2 < 1 ? 1.4 : .5))
}

/** An enemy shot bursts: violet flash, a ring and splinters. */
const bolthit: Painter = (draw, b, t, fade, reduced) => {
  const hex = b.tint ?? 0xc58bff
  draw("flares", b.x, .9, b.z, 2.4 * (1 - t * .6), 2.4 * (1 - t * .6), 1, 0, 0, t * 4, hex, fade * 2.4)
  draw("rings", b.x, .08, b.z, .3 + easeOut(t) * 1.3, .3 + easeOut(t) * 1.3, 1, FLAT, 0, 0, hex, fade * 1.8)
  if (reduced) return
  for (let i = 0; i < 7; i++) {
    const a = i * .9 + b.angle, r = easeOut(t) * 1.2
    draw("sparks", b.x + Math.sin(a) * r, .9 + Math.sin(t * Math.PI) * .5, b.z + Math.cos(a) * r, .05, .05, .4 * (1 - t), 0, a, 0, i % 2 ? 0xffffff : hex, fade * 2.2)
  }
}

/** Weapon source → target: a bright beam from the familiar that fired, with flares at both ends. */
const tracer: Painter = (draw, b, t, fade, reduced) => {
  if (!b.end) return
  const hex = b.tint ?? 0xffffff, dx = b.end.x - b.x, dz = b.end.z - b.z, length = Math.hypot(dx, dz), angle = Math.atan2(dx, dz)
  const from = 2.1, to = 1.1, travel = Math.min(1, t * 3)
  const pitch = -Math.atan2(to - from, length)
  draw("sparks", b.x + dx * travel / 2, from + (to - from) * travel / 2, b.z + dz * travel / 2, reduced ? .05 : .09, reduced ? .05 : .09, length * travel, pitch, angle, 0, hex, fade * 2.4)
  if (!reduced) draw("sparks", b.x + dx * travel / 2, from + (to - from) * travel / 2, b.z + dz * travel / 2, .03, .03, length * travel, pitch, angle, 0, 0xffffff, fade * 2.8)
  draw("flares", b.x, from, b.z, 1.4 * fade + .3, 1.4 * fade + .3, 1, 0, 0, 0, hex, fade * 2.2)
  if (travel >= 1) draw("flares", b.end.x, to, b.end.z, 2 * fade, 2 * fade, 1, 0, 0, t * 5, hex, fade * 2.4)
}

/** CLEAVE by level: L1 crimson arc; L2 double full-circle sweep with flying blades; L3 crimson tempest. */
const cleaveSkill: Painter = (draw, b, t, fade, reduced) => {
  const level = Math.round(b.angle) || 1, radius = b.power, sweep = easeOut(t)
  const arcs = level === 1 ? 1 : level === 2 ? 2 : 4
  for (let i = 0; i < arcs; i++) {
    const r = radius * (.55 + sweep * .45) * (1 - i * .08), spin = (i % 2 ? -1 : 1) * t * (level === 3 ? 16 : 9) + i * 1.6
    draw("arcs", b.x, .7 + i * .22, b.z, r, r, 1, -1.35, spin, 0, i % 2 ? 0xffe0c0 : level === 3 ? 0xff3a4a : 0xff8a4f, fade * (2 - i * .25))
  }
  draw("rings", b.x, .08, b.z, radius * sweep, radius * sweep, 1, FLAT, 0, 0, level === 3 ? 0xff4a5a : 0xffa64f, fade * 1.8)
  draw("glows", b.x, .05, b.z, radius * 2.4, radius * 2.4, 1, FLAT, 0, 0, level === 3 ? 0xff2a3a : 0xff7a3a, fade * .5)
  if (t < .15) draw("flares", b.x, 1.2, b.z, 4 + level * 2, 4 + level * 2, 1, 0, 0, 0, 0xffd0a0, 2.4)
  if (reduced) return
  const blades = level * 6
  for (let i = 0; i < blades; i++) {
    const a = i * Math.PI * 2 / blades + t * (level === 3 ? 9 : 4), r = radius * (.3 + sweep * .7)
    draw("sparks", b.x + Math.sin(a) * r, .8 + Math.sin(t * Math.PI + i) * .3, b.z + Math.cos(a) * r, .08, .05, .9 * (1 - t), 0, a + Math.PI / 2, 0, i % 2 ? 0xffffff : 0xff5a4a, fade * 2.2)
  }
  if (level === 3) for (let i = 0; i < 6; i++) {
    // Ground cracks radiating out with the tempest.
    const a = i * Math.PI / 3 + b.x, length = radius * sweep
    draw("sparks", b.x + Math.sin(a) * length / 2, .05, b.z + Math.cos(a) * length / 2, .12, .02, length, 0, a, 0, 0xff3a2a, fade * 1.8)
  }
}

/** STORM by level: L1 thunderclap; L2 adds a dark cloud ring and a bolt barrage; L3 a blizzard of ice and lightning. */
const stormSkill: Painter = (draw, b, t, fade, reduced) => {
  const level = Math.round(b.angle) || 1, radius = Math.min(12, b.power), flicker = Math.floor(t * 24)
  const hex = level === 3 ? 0xc8f4ff : 0x9fdcff
  if (t < .1) draw("flares", b.x, 2, b.z, 14, 14, 1, 0, 0, 0, 0xe8f6ff, 2.4)
  draw("rings", b.x, .08, b.z, radius * easeOut(t), radius * easeOut(t), 1, FLAT, 0, 0, hex, fade * 1.6)
  draw("glows", b.x, .05, b.z, radius * 2.2, radius * 2.2, 1, FLAT, 0, 0, level === 3 ? 0x6fd3f0 : 0x5a8aff, fade * .55)
  // Classic forked bolts stay on the ground around the caster at every level.
  for (let i = 0; i < 4; i++) draw("bolts", b.x + Math.sin(i * 1.57 + t) * 1.6, .15, b.z + Math.cos(i * 1.57 + t) * 1.6, 1.5, 5.5, 1, 0, i * 1.1, 0, 0xc4efff, fade * (.7 + Math.abs(Math.sin(t * 40 + i)) * .6))
  const bolts = reduced ? 2 : level * 4
  for (let i = 0; i < bolts; i++) {
    const a = i * 2.399, r = 1.5 + (i % 4) * radius * .2, x = b.x + Math.sin(a) * r, z = b.z + Math.cos(a) * r
    const strike = Math.max(0, 1 - Math.abs(t - i / bolts * .6) * 6)
    if (strike > 0) drawBolt(draw, [x + jitter(i, 0) * 1.5, 9, z + jitter(i + 1, 0) * 1.5], [x, .2, z], 9, .9, flicker, .07, 0xffffff, strike * 2.4, i * 7)
  }
  if (reduced) return
  if (level >= 2) for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 + t * .8
    draw("smoke", b.x + Math.sin(a) * radius * .55, 7.5, b.z + Math.cos(a) * radius * .55, 4, 3, 1, 0, 0, a, 0xffffff, .55 * fade * Math.min(1, t * 6))
  }
  if (level === 3) for (let i = 0; i < 28; i++) {
    const a = i * 2.399 + t * 3, r = (i % 7) * radius * .13 + 1
    draw("sparks", b.x + Math.sin(a) * r, 4 - ((t * 3 + i * .13) % 1) * 4, b.z + Math.cos(a) * r, .1, .1, .1, t * 9, a, 0, 0xf4fbff, fade * 1.8)
  }
}

/** HEAL by level: L1 rising green motes; L2 adds a leaf ring and a bigger bloom; L3 a golden aegis dome. */
const healSkill: Painter = (draw, b, t, fade, reduced) => {
  const level = Math.round(b.power) || 1, hex = level === 3 ? 0xffd36b : 0x8cffad
  draw("rings", b.x, .08, b.z, .6 + easeOut(t) * (1.4 + level * .6), .6 + easeOut(t) * (1.4 + level * .6), 1, FLAT, 0, 0, hex, fade * 1.6)
  draw("flares", b.x, 1.3, b.z, 2.5 + level, 2.5 + level, 1, 0, 0, 0, hex, fade * 1.4)
  if (level === 3) for (let i = 0; i < 4; i++) {
    // Aegis: stacked rings shrinking with height read as a translucent dome.
    const h = i * .55, r = Math.sqrt(Math.max(0, 2.6 ** 2 - (h * 1.4) ** 2)) * easeOut(Math.min(1, t * 2))
    draw("rings", b.x, .2 + h, b.z, r, r, 1, FLAT, 0, t * 2 + i, 0xffe9a8, fade * (1.6 - i * .25))
  }
  if (reduced) return
  const motes = 8 + level * 6
  for (let i = 0; i < motes; i++) {
    const a = i * 2.399 + t * 2, r = .7 + (i % 3) * .35 + (level >= 2 ? Math.sin(t * Math.PI) * .6 : 0)
    const y = .4 + ((t * 1.2 + i * .07) % 1) * (2.6 + level * .6)
    draw("sparks", b.x + Math.sin(a) * r, y, b.z + Math.cos(a) * r, i % 2 ? .07 : .18, i % 2 ? .18 : .07, .07, 0, a, 0, i % 3 ? hex : 0xffffff, fade * 1.8)
  }
}

/** Last Stand: a golden pillar and ring when the fatal blow is refused. */
const laststand: Painter = (draw, b, t, fade, reduced) => {
  draw("sparks", b.x, 3, b.z, .5 * fade + .1, 6, .5 * fade + .1, 0, t * 3, 0, 0xffe39a, fade * 1.6)
  draw("rings", b.x, .08, b.z, 1 + easeOut(t) * 4, 1 + easeOut(t) * 4, 1, FLAT, 0, 0, 0xffd36b, fade * 2)
  draw("flares", b.x, 1.4, b.z, 5 * (1 - t * .5), 5 * (1 - t * .5), 1, 0, 0, 0, 0xfff0c0, fade * 2.2)
  if (!reduced) smokePuffs(draw, b.x, b.z, t, 4, 2, 1, 1.2, .3)
}

/** Chest burst: a coin fountain that arcs out and rains back down, with a golden flash. */
const loot: Painter = (draw, b, t, fade, reduced) => {
  if (t < .2) draw("flares", b.x, 1.3, b.z, 4.5 * (1 - t * 4), 4.5 * (1 - t * 4), 1, 0, 0, 0, 0xfff0a0, 2.6)
  draw("glows", b.x, .05, b.z, 4, 4, 1, FLAT, 0, 0, 0xffc040, fade * .7)
  draw("rings", b.x, .08, b.z, .5 + easeOut(t) * 2.4, .5 + easeOut(t) * 2.4, 1, FLAT, 0, 0, 0xffd36b, fade * 1.8)
  if (reduced) return
  debris(draw, b.x, b.z, 1.4, t, 18, 4.6, .16, [0xffd36b, 0xffe9a0, 0xe8a83a, 0x9ff0ff], 1)
  debris(draw, b.x + .01, b.z, 1.4, t, 6, 3, .26, [0x7a5232, 0x5a3a22], .8)
}

export const impactPainters: Record<ImpactEffect, Painter> = { gore, explosion, strike, typo, bolthit, tracer, cleaveSkill, stormSkill, healSkill, laststand, loot }
export const impactLifetimes: Record<ImpactEffect, number> = { gore: 1.1, explosion: 1.6, strike: .32, typo: .42, bolthit: .4, tracer: .3, cleaveSkill: .7, stormSkill: 1.1, healSkill: 1.1, laststand: 1.3, loot: 1.4 }
export const impactColors: Record<ImpactEffect, number> = { gore: 0xe5caa1, explosion: 0xff8645, strike: 0xffffff, typo: 0xff4a4a, bolthit: 0xc58bff, tracer: 0xffffff, cleaveSkill: 0xff8a4f, stormSkill: 0x9fdcff, healSkill: 0x8cffad, laststand: 0xffd36b, loot: 0xffd36b }

export function isImpactEffect(kind: string): kind is ImpactEffect { return kind in impactPainters }
