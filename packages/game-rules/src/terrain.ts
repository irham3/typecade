import type { Point } from "../../contracts/src/survival"
import { dungeonTerrain as T } from "../../content/src/dungeon"

/**
 * Obstacle archetypes. Each has its own footprint (half extents, world units), so the
 * battlefield mixes long walls, compact towers, shrines and low barricades instead of one
 * repeated block. Every footprint fits inside the legacy 4.5 × 2.5 rectangle, so any point
 * that was walkable in older saves is still walkable.
 */
export const ruinArchetypes = {
  keepWall: { halfWidth: 4.5, halfDepth: 2.5, weight: 2 },
  brokenArch: { halfWidth: 3.4, halfDepth: 1.2, weight: 3 },
  watchTower: { halfWidth: 2.2, halfDepth: 2.2, weight: 3 },
  shrine: { halfWidth: 2.4, halfDepth: 2.0, weight: 2 },
  palisade: { halfWidth: 4.0, halfDepth: .8, weight: 3 },
  crypt: { halfWidth: 3.0, halfDepth: 1.8, weight: 2 },
} as const

export type RuinArchetype = keyof typeof ruinArchetypes

export interface Ruin extends Point {
  archetype: RuinArchetype
  halfWidth: number
  halfDepth: number
  /** Stable per-ruin seed for visual variation. */
  seed: number
}

/** Each chunk has two candidate slots, diagonally offset by half a chunk. */
const SLOT_OFFSETS = [0, 16] as const
/** Probability a slot is left open floor, so some areas become arenas and others chokepoints. */
const OPEN_SLOT_CHANCE = .32

const archetypeList = Object.keys(ruinArchetypes) as RuinArchetype[]
const totalWeight = archetypeList.reduce((sum, id) => sum + ruinArchetypes[id].weight, 0)

/** Cheap integer hash → [0, 1). Runs inside pathing loops, so it avoids string seeding. */
function hash01(cx: number, cz: number, slot: number) {
  let h = Math.imul(cx | 0, 374761393) ^ Math.imul(cz | 0, 668265263) ^ Math.imul(slot + 1, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function pickArchetype(roll: number): RuinArchetype {
  let target = roll * totalWeight
  for (const id of archetypeList) {
    target -= ruinArchetypes[id].weight
    if (target < 0) return id
  }
  return archetypeList[archetypeList.length - 1]!
}

/** Obstacles owned by the chunk at integer chunk coordinates (cx, cz) = floor(world / chunkSize). */
export function ruinsInChunk(cx: number, cz: number): Ruin[] {
  const ruins: Ruin[] = []
  SLOT_OFFSETS.forEach((offset, slot) => {
    const presence = hash01(cx, cz, slot * 2)
    if (presence < OPEN_SLOT_CHANCE) return
    const archetype = pickArchetype(hash01(cx, cz, slot * 2 + 1))
    const { halfWidth, halfDepth } = ruinArchetypes[archetype]
    ruins.push({
      archetype, halfWidth, halfDepth,
      x: cx * T.chunkSize + T.ruinX + offset,
      z: cz * T.chunkSize + T.ruinZ + offset,
      seed: Math.floor(presence * 1e9),
    })
  })
  return ruins
}

const chunkOf = (value: number) => Math.floor(value / T.chunkSize)

/** Ruins of the chunk containing a point. Footprints never cross chunk borders (slot centres 10/26, half-width ≤ 4.5). */
export function ruinsNear(point: Point): Ruin[] {
  return ruinsInChunk(chunkOf(point.x), chunkOf(point.z))
}

export function ruinContains(ruin: Ruin, point: Point) {
  return Math.abs(point.x - ruin.x) <= ruin.halfWidth && Math.abs(point.z - ruin.z) <= ruin.halfDepth
}

export function isWalkable(point: Point) {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) return false
  return !ruinsNear(point).some(ruin => ruinContains(ruin, point))
}

/** True when the straight segment a→b crosses no ruin (slab test per footprint). */
export function hasClearPath(a: Point, b: Point) {
  if (Math.hypot(a.x - b.x, a.z - b.z) > T.chunkSize) return false
  for (let cx = chunkOf(Math.min(a.x, b.x)); cx <= chunkOf(Math.max(a.x, b.x)); cx++) {
    for (let cz = chunkOf(Math.min(a.z, b.z)); cz <= chunkOf(Math.max(a.z, b.z)); cz++) {
      for (const ruin of ruinsInChunk(cx, cz)) if (segmentHitsRuin(a, b, ruin)) return false
    }
  }
  return true
}

function segmentHitsRuin(a: Point, b: Point, ruin: Ruin) {
  let enter = 0, exit = 1
  for (const [axis, half] of [["x", ruin.halfWidth], ["z", ruin.halfDepth]] as const) {
    const delta = b[axis] - a[axis], low = ruin[axis] - half, high = ruin[axis] + half
    if (delta === 0) { if (a[axis] < low || a[axis] > high) return false; continue }
    const t0 = (low - a[axis]) / delta, t1 = (high - a[axis]) / delta
    enter = Math.max(enter, Math.min(t0, t1))
    exit = Math.min(exit, Math.max(t0, t1))
  }
  return enter <= exit
}

/** The ruin blocking `point`, if any; used by steering to route around its corners. */
export function ruinAt(point: Point): Ruin | undefined {
  return ruinsNear(point).find(ruin => ruinContains(ruin, point))
}
