import type { SequenceContext, SequenceOutput } from "../../../presentation/sequence-types"
import { combatBeat } from "../../../presentation/sequence-types"

export function overdriveReleaseSequence(context: SequenceContext): SequenceOutput {
	return {
		beats: [
			combatBeat(context, {
				suffix: "release",
				dueMs: context.baseDueMs ?? 0,
				durationMs: 320,
				priority: "critical",
				reducedMotion: "keep",
				payload: { kind: "overdrive-release", zone: context.zone },
			}),
		],
		cancelKeys: [`target:${context.targetOrdinal}:ambient`],
	}
}
