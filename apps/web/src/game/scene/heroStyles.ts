import type { HeroStyleId } from "../models/heroArchetypes"
import type { HeroMove } from "./HeroMoves"
import type { IdlePose } from "./HeroIdle"

export type Gesture = (t: number) => Partial<IdlePose>

/** Continuous idle motion; every value is an amplitude or a rate. */
export interface IdleMotion {
  breathRate: number
  breathDepth: number
  swayRate: number
  sway: number
  look: number
  weaponSway: number
  /** Constant forward lean (crouch). */
  crouch: number
  /** Constant height offset (negative crouches, positive hovers). */
  hover: number
  /** Hover bob amplitude. */
  float: number
  /** Light on-the-toes bounce amplitude. */
  bounce: number
  /** Seconds between gestures. */
  gestureEvery: number
}

/**
 * How a character moves: idle motion, its own gestures, the basic attack combo and how high
 * and how far forward it throws itself on a dash. Presentation only; no gameplay stats.
 */
export interface HeroStyle {
  idle: IdleMotion
  gestures: readonly Gesture[]
  combo: readonly HeroMove[]
  dashHeight: number
  lunge: number
}

const ease = (t: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, t)))
/** 0 → 1 with soft ends, for full turns that must land exactly where they started. */
const glide = (t: number) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t)))) / 2

export const heroStyles: Record<HeroStyleId, HeroStyle> = {
  warden: {
    idle: { breathRate: 2.1, breathDepth: .018, swayRate: .7, sway: .035, look: .08, weaponSway: .06, crouch: 0, hover: 0, float: 0, bounce: 0, gestureEvery: 7 },
    gestures: [
      t => ({ weaponPitch: -1.1 * ease(t), weaponRoll: .35 * ease(t), armPitch: -.2 * ease(t) }),
      t => ({ bodyYaw: Math.sin(t * Math.PI * 2) * .45 * ease(t) }),
      t => ({ lean: -.08 * ease(t), armPitch: -.6 * ease(t), armRoll: .25 * ease(t), lift: .04 * ease(t) }),
      t => ({ armPitch: -.5 * ease(t), lean: .05 * ease(t) }),
    ],
    combo: ["slash", "thrust", "uppercut", "twin"], dashHeight: 1, lunge: 1,
  },
  rogue: {
    idle: { breathRate: 3, breathDepth: .014, swayRate: 1.6, sway: .05, look: .16, weaponSway: .1, crouch: .14, hover: -.06, float: 0, bounce: .018, gestureEvery: 5 },
    gestures: [
      // Flip the blade end over end and catch it.
      t => ({ weaponPitch: glide(t) * Math.PI * 2, lift: .05 * ease(t) }),
      // Check over the shoulder, twice.
      t => ({ bodyYaw: Math.sin(t * Math.PI * 4) * .6 * ease(t) }),
      // Sink lower, ready to spring.
      t => ({ lean: .12 * ease(t), lift: -.06 * ease(t), armPitch: .3 * ease(t) }),
    ],
    combo: ["thrust", "twin", "thrust", "slash"], dashHeight: .55, lunge: 1.5,
  },
  brute: {
    idle: { breathRate: 1.5, breathDepth: .03, swayRate: .55, sway: .07, look: .05, weaponSway: .08, crouch: .04, hover: 0, float: 0, bounce: 0, gestureEvery: 6 },
    gestures: [
      // Stomp: rock back, drop down hard.
      t => ({ lift: Math.max(0, Math.sin(t * Math.PI * 2)) * .12, lean: -.06 * ease(t) }),
      // Axe across the shoulder.
      t => ({ weaponPitch: -1.35 * ease(t), weaponRoll: .5 * ease(t) }),
      // Flex: shield arm up, chest out.
      t => ({ armPitch: -1.2 * ease(t), armRoll: .55 * ease(t), breath: .06 * ease(t), lean: -.05 * ease(t) }),
    ],
    combo: ["uppercut", "slash", "leap", "slash"], dashHeight: .6, lunge: .7,
  },
  duelist: {
    idle: { breathRate: 1.8, breathDepth: .012, swayRate: .5, sway: .03, look: .12, weaponSway: .12, crouch: -.02, hover: .02, float: 0, bounce: .01, gestureEvery: 6 },
    gestures: [
      // Twirl the blade in a flat circle.
      t => ({ weaponRoll: Math.sin(t * Math.PI * 4) * .7 * ease(t), weaponPitch: Math.cos(t * Math.PI * 4) * .3 * ease(t) }),
      // Salute: blade to the face, then down.
      t => ({ weaponPitch: -1.45 * ease(t), bodyYaw: .2 * ease(t) }),
      // Full pirouette.
      t => ({ bodyYaw: glide(t) * Math.PI * 2, lift: .06 * ease(t) }),
    ],
    combo: ["thrust", "twin", "slash", "twin"], dashHeight: 1.25, lunge: 1.2,
  },
  mage: {
    idle: { breathRate: 1.6, breathDepth: .014, swayRate: .45, sway: .03, look: .1, weaponSway: .05, crouch: -.03, hover: .22, float: .07, bounce: 0, gestureEvery: 6.5 },
    gestures: [
      // Raise a hand and draw the wisp in.
      t => ({ armPitch: -1.5 * ease(t), armRoll: .3 * ease(t), lift: .08 * ease(t) }),
      // Rise higher, then settle.
      t => ({ lift: .26 * ease(t), lean: -.05 * ease(t) }),
      // Tap the staff down twice.
      t => ({ weaponPitch: Math.max(0, Math.sin(t * Math.PI * 4)) * .35 }),
    ],
    combo: ["slash", "uppercut", "thrust", "slash"], dashHeight: 1.6, lunge: .8,
  },
}

export const styleFor = (id: HeroStyleId): HeroStyle => heroStyles[id] ?? heroStyles.warden
