import type { SequenceContext, SequenceOutput } from "../../../presentation/sequence-types"
import { combatBeat } from "../../../presentation/sequence-types"

export function aegisRescueSequence(context: SequenceContext & { rescueNumber: number; timeAddedMs: number }): SequenceOutput {
	return {
		beats: [
			combatBeat(context, {
				suffix: "block",
				dueMs: context.baseDueMs ?? 0,
				durationMs: 600,
				priority: "critical",
				reducedMotion: "keep",
				payload: {
					kind: "aegis-block",
					rescueNumber: context.rescueNumber,
					timeAddedMs: context.timeAddedMs,
				},
			}),
		],
		cancelKeys: [`target:${context.targetOrdinal}:pressure`],
	}
}
