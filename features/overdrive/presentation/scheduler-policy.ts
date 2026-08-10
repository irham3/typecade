import type { PresentationBeat } from "./scheduler-types"

export const PRESENTATION_POLICY = {
  acceptedCueBudgetMs: 50,
  acceptedHitBudgetMs: 90,
  tacticalAggregationWindowMs: 32,
  settledContactHistory: 256,
} as const

export function compareBeats(a: PresentationBeat, b: PresentationBeat): number {
  const rank = { critical: 0, tactical: 1, decorative: 2 } as const
  return rank[a.priority] - rank[b.priority]
    || a.sourceSequence - b.sourceSequence
    || a.dueAtMs - b.dueAtMs
}
