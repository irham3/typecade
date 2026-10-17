import type { DamageSource, DungeonEnemy, DungeonState, Point, WeaponId } from "../../contracts/src/survival"
import { dungeonObjects, weaponRules } from "../../content/src/dungeon"

export const weaponIds: readonly WeaponId[] = ["orbit", "nova", "meteor", "frost"]

/** Narrow view of the simulation that automatic weapons may act through (dependency inversion). */
export interface CombatPort {
  readonly state: DungeonState
  hit(enemy: DungeonEnemy, layers: number, preserveLockedWord: boolean, source: DamageSource): void
  effect(kind: "nova" | "meteor" | "frost", at: Point, value: number): void
  random(): number
}

const ORBIT_SPIN_SPEED = 2.6
const ORBIT_CONTACT_RADIUS = 0.95
const METEOR_SEARCH_RADIUS = 8
const NOVA_WAVE_SPACING = 1.2

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)

export function createEmptyWeapons(): DungeonState["weapons"] {
  return { orbit: { level: 0, timer: 0 }, nova: { level: 0, timer: 0 }, meteor: { level: 0, timer: 0 }, frost: { level: 0, timer: 0 } }
}

export function isWeaponId(id: string): id is WeaponId {
  return (weaponIds as readonly string[]).includes(id)
}

/** World position of each spirit blade; shared by the simulation and the renderer so both agree. */
export function orbitBladePositions(state: DungeonState): Point[] {
  const level = state.weapons?.orbit.level ?? 0
  if (!level) return []
  const count = weaponRules.orbit.count[level - 1]!
  const radius = weaponRules.orbit.radius[level - 1]!
  return Array.from({ length: count }, (_, index) => {
    const angle = state.worldTime * ORBIT_SPIN_SPEED + index * Math.PI * 2 / count
    return { x: state.player.x + Math.sin(angle) * radius, z: state.player.z + Math.cos(angle) * radius }
  })
}

/** Living combatants a weapon may strike: never the boss, never loot or supplies. */
function weaponTargets(state: DungeonState) {
  return state.enemies.filter(enemy => enemy.id !== state.boss && !dungeonObjects.includes(enemy.kind))
}

function tickOrbit(port: CombatPort) {
  const { state } = port
  const level = state.weapons.orbit.level
  if (!level) return
  const blades = orbitBladePositions(state)
  const rehitDelay = weaponRules.orbit.interval[level - 1]!
  for (const enemy of weaponTargets(state)) {
    const touched = blades.some(blade => distance(blade, enemy) < ORBIT_CONTACT_RADIUS)
    const ready = (state.orbitHits[enemy.id] ?? -1) <= state.worldTime
    if (!touched || !ready) continue
    state.orbitHits[enemy.id] = state.worldTime + rehitDelay
    port.hit(enemy, 1, true, "orbit")
  }
  for (const id of Object.keys(state.orbitHits)) if (state.orbitHits[id]! <= state.worldTime) delete state.orbitHits[id]
}

function fireNova(port: CombatPort, rank: number) {
  const { state } = port
  const waves = weaponRules.nova.count[rank]!
  const radius = weaponRules.nova.radius[rank]!
  for (let wave = 0; wave < waves; wave++) port.effect("nova", state.player, radius + wave * NOVA_WAVE_SPACING)
  const reach = radius + (waves - 1) * NOVA_WAVE_SPACING
  for (const enemy of weaponTargets(state)) if (distance(enemy, state.player) < reach) port.hit(enemy, 1, true, "nova")
}

function fireMeteors(port: CombatPort, rank: number) {
  const { state } = port
  const radius = weaponRules.meteor.radius[rank]!
  const candidates = weaponTargets(state).filter(enemy => distance(enemy, state.player) < METEOR_SEARCH_RADIUS)
  for (let meteor = 0; meteor < weaponRules.meteor.count[rank]! && candidates.length; meteor++) {
    const impact = candidates.splice(Math.floor(port.random() * candidates.length), 1)[0]!
    port.effect("meteor", impact, radius)
    const caught = [...weaponTargets(state), ...state.enemies.filter(enemy => enemy.kind === "barrel")]
    for (const enemy of caught) if (distance(enemy, impact) < radius) port.hit(enemy, 1, true, "meteor")
  }
}

function fireFrost(port: CombatPort, rank: number) {
  const { state } = port
  const radius = weaponRules.frost.radius[rank]!
  const freezeSeconds = 1 + (rank + 1) * 0.25
  const evolved = rank + 1 >= weaponRules.frost.max
  port.effect("frost", state.player, radius)
  for (const enemy of weaponTargets(state)) {
    if (distance(enemy, state.player) >= radius) continue
    enemy.frozen = Math.max(enemy.frozen, freezeSeconds)
    if (evolved) port.hit(enemy, 1, true, "frost")
  }
}

const timedWeapons = { nova: fireNova, meteor: fireMeteors, frost: fireFrost } as const

/** Advances every owned weapon by `dt` simulated seconds. */
export function tickWeapons(port: CombatPort, dt: number) {
  tickOrbit(port)
  for (const id of Object.keys(timedWeapons) as Array<keyof typeof timedWeapons>) {
    const weapon = port.state.weapons[id]
    if (!weapon.level) continue
    weapon.timer -= dt
    if (weapon.timer > 0) continue
    const rank = weapon.level - 1
    weapon.timer = weaponRules[id].interval[rank]!
    timedWeapons[id](port, rank)
  }
}

/** Shape check for restored saves; older saves receive empty weapons before this runs. */
export function areWeaponsValid(weapons: unknown): weapons is DungeonState["weapons"] {
  if (typeof weapons !== "object" || weapons === null) return false
  const record = weapons as Record<string, { level?: unknown; timer?: unknown }>
  return weaponIds.every(id => {
    const weapon = record[id]
    return !!weapon && Number.isInteger(weapon.level) && (weapon.level as number) >= 0 && (weapon.level as number) <= weaponRules[id].max
      && typeof weapon.timer === "number" && Number.isFinite(weapon.timer) && Math.abs(weapon.timer) <= 60
  })
}
