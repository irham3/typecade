import type { SequenceContext, SequenceOutput } from "../../../presentation/sequence-types"
import { combatBeat } from "../../../presentation/sequence-types"

export function stageResolutionSequence(context: SequenceContext & { cleared: boolean }): SequenceOutput {
	return {
		beats: [
			combatBeat(context, {
				suffix: context.cleared ? "clear" : "failure",
				dueMs: context.baseDueMs ?? 0,
				durationMs: 900,
				priority: "critical",
				reducedMotion: "keep",
				payload: { kind: context.cleared ? "quota-break" : "run-over" },
			}),
		],
		cancelKeys: [`target:${context.targetOrdinal}:ambient`, `target:${context.targetOrdinal}:contact`],
	}
}
