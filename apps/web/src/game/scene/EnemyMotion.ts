import type { DungeonEnemy, EnemyKind } from "@typecade/contracts"
import { enemyLunges } from "@typecade/content"

/** Extra body language layered on an enemy's base pose. All zero at rest. */
export interface EnemyMotionPose {
  /** Positive squashes (crouch), negative stretches. */
  squash: number
  /** Vertical offset in world units (leaps up, dives down). */
  lift: number
  /** Lateral tremble during a wind-up, world units. */
  shake: number
  /** Forward (+) / backward (−) lean in radians. */
  lean: number
}

const REST: EnemyMotionPose = { squash: 0, lift: 0, shake: 0, lean: 0 }

/** Kinds whose charge is a leap through the air rather than a ground rush. */
const leapers: ReadonlySet<EnemyKind> = new Set(["ghoul", "wolf", "slime", "spider", "goblin", "mimic"])
/** Flyers swoop downward when they commit. */
const divers: ReadonlySet<EnemyKind> = new Set(["bat", "gargoyle", "wisp"])

/**
 * Reads the domain's attack state (windup → charge/slam → recover) and returns an
 * anticipation-action-recovery pose, the classic animation arc that makes attacks readable.
 */
export function enemyMotionPose(enemy: Pick<DungeonEnemy, "kind" | "id" | "motion" | "motionTime">, elapsed: number, reduced: boolean): EnemyMotionPose {
  const lunge = enemyLunges[enemy.kind]
  if (reduced || !lunge || !enemy.motion) return REST
  const remaining = enemy.motionTime ?? 0
  switch (enemy.motion) {
    case "windup": {
      const progress = 1 - Math.min(1, remaining / lunge.windup)
      return { squash: .16 * progress, lift: 0, shake: Math.sin(elapsed * 55 + enemy.id) * .06 * progress, lean: -.28 * progress }
    }
    case "charge": {
      const progress = 1 - Math.min(1, remaining / Math.max(.01, lunge.time))
      const arc = Math.sin(progress * Math.PI)
      if (divers.has(enemy.kind)) return { squash: -.1, lift: -arc * .8, shake: 0, lean: .55 }
      return { squash: -.14, lift: leapers.has(enemy.kind) ? arc * 1.1 : 0, shake: 0, lean: .4 }
    }
    case "slam": {
      const impact = Math.min(1, remaining / .6)
      return { squash: .22 * impact, lift: 0, shake: 0, lean: .3 * impact }
    }
    default:
      return { squash: 0, lift: 0, shake: 0, lean: -.12 * Math.min(1, remaining / lunge.recover) }
  }
}
