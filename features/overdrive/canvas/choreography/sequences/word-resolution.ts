import type { SequenceContext, SequenceOutput } from "../../../presentation/sequence-types"
import { combatBeat } from "../../../presentation/sequence-types"

export type WordResolutionContext = SequenceContext & {
	word: string
	clean: boolean
	aegisRecovery: boolean
	overdriveReleased: boolean
	scoreGain: number
}

export function wordResolutionSequence(context: WordResolutionContext): SequenceOutput {
	const outcome = context.clean
		? "execution"
		: context.aegisRecovery
			? "aegis-recovery"
			: "misfire"
	return {
		beats: [
			combatBeat(context, {
				suffix: "resolution",
				dueMs: context.baseDueMs ?? 0,
				durationMs: 700,
				priority: "combat",
				reducedMotion: "keep",
				payload: {
					word: context.word,
					outcome,
					scoreGain: context.scoreGain,
					overdriveReleased: context.overdriveReleased,
				},
			}),
		],
		cancelKeys: [`target:${context.targetOrdinal}:contact`],
	}
}
