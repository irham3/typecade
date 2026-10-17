import type { HeroStyle } from "./heroStyles"

/** Additive offsets layered on the hero rig while nothing else is animating it. Purely presentational. */
export interface IdlePose {
  /** Root height (breathing bob). */
  lift: number
  /** Torso vertical squash added to 1. */
  breath: number
  bodyRoll: number
  bodyYaw: number
  lean: number
  weaponPitch: number
  weaponRoll: number
  armPitch: number
  armRoll: number
  /** Opposite roll per leg for a weight shift. */
  legRoll: number
}

/** How long one gesture plays, in seconds. */
const GESTURE_LENGTH = 1.6

/**
 * Idle stance for `time` seconds in a character's style: breathing, weight shift, sway and
 * (for some) a crouch, bounce or hover run continuously; every few seconds one of the
 * character's own gestures plays on top. `relaxed` (title and Armory) broadens the motion.
 */
export function heroIdlePose(time: number, relaxed: boolean, style: HeroStyle): IdlePose {
  const m = style.idle, scale = relaxed ? 1.25 : 1
  const breath = Math.sin(time * m.breathRate)
  const shift = Math.sin(time * m.swayRate)
  const pose: IdlePose = {
    lift: (breath * .02 + Math.sin(time * 1.4) * m.float + Math.abs(Math.sin(time * 4.2)) * m.bounce) * scale,
    breath: breath * m.breathDepth * scale,
    bodyRoll: shift * m.sway * scale,
    bodyYaw: Math.sin(time * .43) * m.look * scale,
    lean: m.crouch + breath * .012,
    weaponPitch: Math.sin(time * 1.3) * m.weaponSway * scale,
    weaponRoll: Math.sin(time * .9 + 1) * m.weaponSway * .8 * scale,
    armPitch: Math.sin(time * 1.1 + 2) * .05 * scale,
    armRoll: 0,
    legRoll: shift * m.sway * 1.1 * scale,
  }
  const slot = Math.floor(time / m.gestureEvery), into = time - slot * m.gestureEvery
  if (into < GESTURE_LENGTH && style.gestures.length) {
    const extra = style.gestures[slot % style.gestures.length]!(into / GESTURE_LENGTH)
    for (const key of Object.keys(extra) as (keyof IdlePose)[]) pose[key] += extra[key]! * scale
  }
  return pose
}
