/** Every attack animation the hero can play. Chosen per completed word; purely presentational. */
export type HeroMove = "slash" | "thrust" | "uppercut" | "twin" | "leap" | "whirl" | "finisher" | "cleave"

/** Context the scene knows when a dash lands. */
export interface MoveContext {
  wordsCompleted: number
  targetLayers: number
  finisher: boolean
  whirl: boolean
}

/** Pose offsets for the hero rig at a given swing progress. Zero is the idle stance. */
export interface HeroPose {
  weaponPitch: number
  weaponYaw: number
  weaponRoll: number
  weaponReach: number
  armPitch: number
  bodyYaw: number
  bodySpin: number
  lift: number
  lean: number
}

/** Seconds each move takes to play out. Heavier moves linger for weight. */
export const moveDuration: Record<HeroMove, number> = {
  slash: .38, thrust: .32, uppercut: .42, twin: .46, leap: .62, whirl: .55, finisher: .9, cleave: .5,
}

const cycle: HeroMove[] = ["slash", "thrust", "uppercut", "twin"]

/** Priority: fatality > whirlwind > leaping strike on armored targets > rotating basic combo. */
export function selectMove({ wordsCompleted, targetLayers, finisher, whirl }: MoveContext): HeroMove {
  if (finisher) return "finisher"
  if (whirl) return "whirl"
  if (targetLayers >= 2) return "leap"
  return cycle[wordsCompleted % cycle.length]!
}

const arc = (t: number) => Math.sin(t * Math.PI)
const easeOutBack = (t: number) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2

/** Pose for a move at progress t in [0, 1]. `side` alternates swing direction (+1 / -1). */
export function heroPose(move: HeroMove, t: number, side: number): HeroPose {
  const swing = arc(t)
  const pose: HeroPose = { weaponPitch: -swing * 1.8, weaponYaw: side * 1.2 * swing, weaponRoll: -swing * .8, weaponReach: 0, armPitch: swing * .45, bodyYaw: Math.sin(t * Math.PI * 1.7) * swing * .35, bodySpin: 0, lift: 0, lean: 0 }
  switch (move) {
    case "thrust":
      return { ...pose, weaponPitch: -1.4 * swing, weaponYaw: 0, weaponReach: swing * .9, lean: swing * .25 }
    case "uppercut":
      return { ...pose, weaponPitch: -swing * 3.1, weaponYaw: side * .4 * swing, lift: swing * .35 }
    case "twin":
      return { ...pose, weaponYaw: side * 1.4 * Math.sin(t * Math.PI * 2), bodyYaw: Math.sin(t * Math.PI * 2) * .45 }
    case "leap":
      return { ...pose, lift: arc(Math.min(1, t * 1.25)) * 1.4, weaponPitch: t < .6 ? -2.6 * easeOutBack(t / .6) : -2.6 + (t - .6) * 6, lean: t < .6 ? -.2 : .35 }
    case "whirl":
      return { ...pose, bodySpin: easeOutBack(t) * Math.PI * 2, weaponYaw: 1.4, weaponPitch: -1.5, lift: swing * .2 }
    case "finisher":
      return { ...pose, lift: arc(Math.min(1, t * 1.4)) * 2.2, bodySpin: Math.min(1, t * 1.6) * Math.PI * 2, weaponPitch: t < .55 ? -3 : -3 + (t - .55) * 8, lean: t > .55 ? .45 : 0 }
    case "cleave":
      return { ...pose, weaponYaw: side * 2 * swing, bodyYaw: swing * .6 }
    default:
      return pose
  }
}
