import type { DungeonEnemy, Point } from "../../contracts/src/survival"

/** Enemies that can be typed this frame (have a word showing). */
type Candidate = Pick<DungeonEnemy, "id" | "x" | "z" | "words">

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)

/**
 * Lock-free typing: every visible word stays a candidate while you type. Given the typed
 * text so far, returns the enemy it should point at, or null when no visible word starts
 * with it (a typo).
 *
 * The current focus is kept while it still matches, so the reticle does not jump between
 * enemies on every key; otherwise the nearest matching enemy wins.
 */
export function pickTypingTarget<T extends Candidate>(candidates: readonly T[], typed: string, from: Point, currentId: number | null): T | null {
  if (!typed) return null
  const matches = candidates.filter(enemy => enemy.words[0]?.startsWith(typed))
  if (!matches.length) return null
  const exact = matches.filter(enemy => enemy.words[0] === typed)
  const pool = exact.length ? exact : matches
  const current = pool.find(enemy => enemy.id === currentId)
  if (current) return current
  return pool.reduce((best, enemy) => distance(enemy, from) < distance(best, from) ? enemy : best)
}
