import type { SequenceContext, SequenceOutput } from "../../../presentation/sequence-types"
import { combatBeat } from "../../../presentation/sequence-types"

export function pressureAttackSequence(context: SequenceContext): SequenceOutput {
	const due = context.baseDueMs ?? 0
	return {
		beats: [
			combatBeat(context, {
				suffix: "telegraph",
				dueMs: due,
				durationMs: 240,
				priority: "combat",
				reducedMotion: "keep",
				payload: { kind: "pressure-telegraph", stage: context.stage },
			}),
			combatBeat(context, {
				suffix: "impact",
				dueMs: due + 240,
				durationMs: 160,
				priority: "critical",
				reducedMotion: "keep",
				payload: { kind: "pressure-impact", stage: context.stage },
			}),
		],
		cancelKeys: [`target:${context.targetOrdinal}:ambient`],
	}
}
