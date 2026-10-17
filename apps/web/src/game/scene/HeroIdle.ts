/** Additive offsets layered on the hero rig while nothing else is animating it. Purely presentational. */
export interface IdlePose {
  /** Root height (breathing bob). */
  lift: number
  /** Torso vertical squash, 1 = neutral. */
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

/** Seconds between idle gestures, and how long one plays. */
const GESTURE_EVERY = 7
const GESTURE_LENGTH = 1.6

type Gesture = (t: number) => Partial<IdlePose>

const ease = (t: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, t)))

/** Small set of hand-made gestures, rotated so the knight never repeats the same one twice in a row. */
const gestures: Gesture[] = [
  // Rest the blade on the shoulder, then bring it back to guard.
  t => ({ weaponPitch: -1.1 * ease(t), weaponRoll: .35 * ease(t), armPitch: -.2 * ease(t) }),
  // Glance left, then right.
  t => ({ bodyYaw: Math.sin(t * Math.PI * 2) * .45 * ease(t) }),
  // Roll the shoulders and stretch back.
  t => ({ lean: -.08 * ease(t), armPitch: -.6 * ease(t), armRoll: .25 * ease(t), lift: .04 * ease(t) }),
  // Flick the blade in a short figure-eight.
  t => ({ weaponPitch: Math.sin(t * Math.PI * 4) * .35 * ease(t), weaponRoll: Math.cos(t * Math.PI * 4) * .25 * ease(t) }),
]

/**
 * Idle stance for `time` seconds. Breathing, a slow weight shift and a sword sway run
 * continuously; every few seconds one gesture plays on top. `relaxed` (title and Armory)
 * makes the motion a little broader since nothing else is happening on screen.
 */
export function heroIdlePose(time: number, relaxed: boolean): IdlePose {
  const scale = relaxed ? 1.25 : 1
  const breath = Math.sin(time * 2.1)
  const shift = Math.sin(time * .7)
  const pose: IdlePose = {
    lift: breath * .02 * scale,
    breath: 1 + breath * .018 * scale,
    bodyRoll: shift * .035 * scale,
    bodyYaw: Math.sin(time * .43) * .08 * scale,
    lean: breath * .012,
    weaponPitch: Math.sin(time * 1.3) * .06 * scale,
    weaponRoll: Math.sin(time * .9 + 1) * .05 * scale,
    armPitch: Math.sin(time * 1.1 + 2) * .05 * scale,
    armRoll: 0,
    legRoll: shift * .04 * scale,
  }
  const slot = Math.floor(time / GESTURE_EVERY), into = time - slot * GESTURE_EVERY
  if (into < GESTURE_LENGTH) {
    const extra = gestures[slot % gestures.length]!(into / GESTURE_LENGTH)
    for (const key of Object.keys(extra) as (keyof IdlePose)[]) pose[key] += extra[key]! * scale
  }
  return pose
}
