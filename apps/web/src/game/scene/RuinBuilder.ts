import type { Ruin } from "@typecade/game-rules"
import { environmentGrade } from "../render/environmentGrade"

/** One solid block in world space (size in world units, yaw in radians). */
export interface RuinBlock { x: number; y: number; z: number; sx: number; sy: number; sz: number; yaw: number; color: number }
export interface RuinPoint { x: number; y: number; z: number }

/** Everything a ruin contributes to the scene. All blocks stay inside the ruin's collision footprint. */
export interface RuinPieces {
  blocks: RuinBlock[]
  torches: RuinPoint[]
  banners: RuinPoint[]
  landmark: { x: number; z: number; yaw: number; scale: number } | null
}

type Random = () => number
type Place = (lx: number, y: number, lz: number, sx: number, sy: number, sz: number, color: number, yaw?: number) => void

const S = environmentGrade.surfaces
const wood = 0x6b4a30, darkWood = 0x4c3422, iron = 0x4b4f58, slab = 0x5f6068, moss = 0x4f6b46

/** Shared helpers bound to one ruin: local→world transform with a seeded mirror, jittered stone colour. */
function context(ruin: Ruin, random: Random) {
  const pieces: RuinPieces = { blocks: [], torches: [], banners: [], landmark: null }
  const flipX = random() < .5 ? -1 : 1, flipZ = random() < .5 ? -1 : 1
  const world = (lx: number, lz: number) => ({ x: ruin.x + lx * flipX, z: ruin.z + lz * flipZ })
  const place: Place = (lx, y, lz, sx, sy, sz, color, yaw = 0) => {
    const at = world(lx, lz)
    pieces.blocks.push({ x: at.x, y, z: at.z, sx, sy, sz, yaw: yaw * flipX * flipZ, color })
  }
  const stone = (upper = false) => {
    const base = upper ? S.wallUpper : S.wallBase
    return scale(base, S.wallJitterMin + random() * S.wallJitterRange)
  }
  const torch = (lx: number, y: number, lz: number) => { const at = world(lx, lz); pieces.torches.push({ x: at.x, y, z: at.z }) }
  const banner = (lx: number, y: number, lz: number) => { const at = world(lx, lz); pieces.banners.push({ x: at.x, y, z: at.z }) }
  /** Low scattered rubble that hugs the footprint edge. */
  const rubble = (count: number) => {
    for (let i = 0; i < count; i++) {
      const lx = (random() * 2 - 1) * (ruin.halfWidth - .3), lz = (random() * 2 - 1) * (ruin.halfDepth - .3)
      place(lx, .1, lz, .3 + random() * .45, .14 + random() * .2, .3 + random() * .45, scale(0x56564f, .8 + random() * .3), random() * 3)
    }
  }
  return { pieces, place, stone, torch, banner, rubble, world }
}

function scale(hex: number, factor: number) {
  const r = Math.min(255, ((hex >> 16) & 255) * factor), g = Math.min(255, ((hex >> 8) & 255) * factor), b = Math.min(255, (hex & 255) * factor)
  return (r << 16) | (g << 8) | b
}

/** Classic curtain wall with two flanking towers, crenellations and a central banner. */
function keepWall(ruin: Ruin, random: Random) {
  const c = context(ruin, random)
  const length = ruin.halfWidth * 2 - 1.6
  for (let row = 0; row < 4; row++) for (let i = 0; i < Math.round(length); i++) {
    if (row > 1 && random() > .55) continue
    c.place(-length / 2 + .5 + i + (row % 2) * .25, .36 + row * .76, 0, 1.06, .74, .9, c.stone(row > 0))
  }
  for (const side of [-1, 1]) {
    const tx = side * (ruin.halfWidth - .8)
    for (let level = 0; level < 5; level++) c.place(tx, .36 + level * .73, -.4, 1.4, .74, 1.4, level % 2 ? S.pillarDark : S.pillarLight)
    c.place(tx, 3.8, -.4, 1.7, .3, 1.7, 0x87909c)
    c.torch(tx, 2.5, .5)
  }
  c.banner(0, 1.35, .5)
  c.rubble(10)
  return c.pieces
}

/** Two pillars and a half-fallen arch: reads as a gate the horde must funnel around. */
function brokenArch(ruin: Ruin, random: Random) {
  const c = context(ruin, random)
  const span = ruin.halfWidth - .7
  for (const side of [-1, 1]) {
    const height = side < 0 ? 4 : 2 + Math.floor(random() * 2)
    for (let level = 0; level < height; level++) c.place(side * span, .4 + level * .78, 0, 1.1, .78, 1.1, c.stone(level > 1))
  }
  for (let i = 0; i < 4; i++) c.place(-span + .9 + i * .95, 3.5 + Math.sin(i / 3 * Math.PI) * .35, 0, 1, .55, 1, c.stone(true))
  for (let i = 0; i < 3; i++) c.place(span - .6 - i * .8, .25, .45 - i * .3, .9, .5, .8, c.stone(), random())
  c.torch(-span, 3.4, .7)
  c.rubble(8)
  return c.pieces
}

/** Squat watchtower, tapering upward, with a brazier on top as a beacon. */
function watchTower(ruin: Ruin, random: Random) {
  const c = context(ruin, random)
  const levels = 4 + Math.floor(random() * 2)
  for (let level = 0; level < levels; level++) {
    const size = 3.4 - level * .3
    c.place(0, .4 + level * .8, 0, size, .8, size, level % 2 ? S.pillarDark : c.stone(true))
    if (level === 1 || level === 3) c.place(0, .4 + level * .8, size / 2 + .02, .25, .5, .05, 0x141820)
  }
  const top = .4 + levels * .8
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) c.place(x * 1, top, z * 1, .5, .6, .5, c.stone(true))
  c.place(0, top - .1, 0, .9, .3, .9, iron)
  c.torch(0, top + .2, 0)
  c.rubble(6)
  return c.pieces
}

/** Stepped shrine with a crystal obelisk and candle posts: a landmark you can navigate by. */
function shrine(ruin: Ruin, random: Random) {
  const c = context(ruin, random)
  c.place(0, .15, 0, ruin.halfWidth * 2 - .4, .3, ruin.halfDepth * 2 - .4, slab)
  c.place(0, .45, 0, ruin.halfWidth * 2 - 1.4, .3, ruin.halfDepth * 2 - 1.4, scale(slab, 1.15))
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    c.place(x * (ruin.halfWidth - .6), .9, z * (ruin.halfDepth - .6), .35, 1.2, .35, c.stone(true))
  }
  c.torch(-(ruin.halfWidth - .6), 1.7, ruin.halfDepth - .6)
  c.torch(ruin.halfWidth - .6, 1.7, -(ruin.halfDepth - .6))
  const center = c.world(0, 0)
  c.pieces.landmark = { x: center.x, z: center.z, yaw: random() * Math.PI, scale: 1 }
  if (random() < .5) c.place(.9, .75, .4, .5, .3, .5, moss)
  return c.pieces
}

/** Sharpened stake palisade with lashed crossbeams, crates and barrels: a siege line. */
function palisade(ruin: Ruin, random: Random) {
  const c = context(ruin, random)
  const stakes = Math.floor((ruin.halfWidth * 2 - .6) / .55) + 1
  for (let i = 0; i < stakes; i++) {
    if (random() < .12) continue
    const height = 1.4 + random() * .8
    c.place(-ruin.halfWidth + .3 + i * .55, height / 2, (random() - .5) * .2, .38, height, .38, scale(wood, .8 + random() * .4), (random() - .5) * .2)
  }
  for (const y of [.55, 1.15]) c.place(0, y, .22, ruin.halfWidth * 2 - .4, .14, .12, darkWood)
  c.place(ruin.halfWidth - 1.1, .4, -.35, .8, .8, .6, darkWood)
  c.place(-ruin.halfWidth + 1.2, .45, -.3, .6, .9, .6, scale(wood, 1.1))
  c.torch(ruin.halfWidth - .3, 2.2, .3)
  c.banner(-ruin.halfWidth + 2.2, 1.35, .35)
  return c.pieces
}

/** Crypt slab with sarcophagi and a broken back wall. */
function crypt(ruin: Ruin, random: Random) {
  const c = context(ruin, random)
  c.place(0, .12, 0, ruin.halfWidth * 2 - .3, .24, ruin.halfDepth * 2 - .3, slab)
  for (const side of [-1, 1]) {
    c.place(side * 1.2, .55, .3, 1.0, .65, 2.2, scale(slab, 1.25))
    c.place(side * 1.2, .95, .3, 1.1, .15, 2.3, scale(slab, 1.4))
  }
  for (let i = 0; i < 5; i++) {
    if (random() < .3) continue
    c.place(-ruin.halfWidth + .6 + i * 1.15, .7 + (i % 2) * .3, -ruin.halfDepth + .35, 1, 1.2 + random() * .9, .5, c.stone(true))
  }
  c.torch(0, 1.6, -ruin.halfDepth + .5)
  c.rubble(5)
  return c.pieces
}

const builders: Record<Ruin["archetype"], (ruin: Ruin, random: Random) => RuinPieces> = { keepWall, brokenArch, watchTower, shrine, palisade, crypt }

/** Builds the visual pieces for one ruin. Deterministic for a given ruin seed. */
export function buildRuin(ruin: Ruin, random: Random): RuinPieces {
  return builders[ruin.archetype](ruin, random)
}
