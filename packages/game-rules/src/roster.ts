import type { EnemyKind } from "../../contracts/src/survival"
import { bestiary } from "../../content/src/dungeon"

const SPOTLIGHT_SECONDS = 60
const FAVOURITES_FROM_SECONDS = 150
const OPENING_THREAT_CAP = 2

/** Each depth leans on its own residents once the opening is over. */
const depthFavourites: readonly (readonly EnemyKind[])[] = [
  ["skeleton", "archer", "ghoul"],
  ["wraith", "necromancer", "deathknight"],
  ["imp", "golem", "gargoyle"],
  ["wolf", "wolf", "ghoul"],
  ["spider", "serpent", "sporeling"],
]

const combatants = bestiary.filter(entry => entry.role !== "Object" && entry.role !== "Boss")

/**
 * Weighted spawn table. Bestiary unlock times drive it, so a new silhouette arrives
 * every half minute, and kinds unlocked within the last minute are doubled to spotlight them.
 */
export function spawnRoster(time: number, biome: number, opening: boolean): EnemyKind[] {
  const veteran = biome > 0
  const unlocked = combatants.filter(entry => entry.unlock <= time || veteran)
  const eligible = opening ? unlocked.filter(entry => entry.threat <= OPENING_THREAT_CAP) : unlocked
  const spotlight = eligible.filter(entry => entry.unlock > time - SPOTLIGHT_SECONDS).map(entry => entry.kind)
  const staples: EnemyKind[] = opening ? ["skeleton", "goblin", "skeleton"] : ["skeleton", "goblin", "skeleton", "goblin"]
  const favourites = time >= FAVOURITES_FROM_SECONDS || veteran ? depthFavourites[biome % depthFavourites.length]! : []
  return [...staples, ...eligible.map(entry => entry.kind), ...spotlight, ...favourites]
}
