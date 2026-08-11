import type { CharacterContactContext, SequenceOutput } from "../../../presentation/sequence-types"
import { combatBeat } from "../../../presentation/sequence-types"

export function characterContactSequence(context: CharacterContactContext): SequenceOutput {
	const due = context.baseDueMs ?? 0
	const payload = {
		character: context.character,
		word: context.word,
		verb: context.combatVerb,
		stage: context.stage,
		zone: context.zone,
		combo: context.combo,
	}

	return {
		beats: [
			combatBeat(context, {
				suffix: "cue",
				dueMs: due,
				durationMs: 80,
				priority: "critical",
				characterIndex: context.characterIndex,
				reducedMotion: "keep",
				payload: { ...payload, kind: "contact-cue" },
			}),
			combatBeat(context, {
				suffix: "hit",
				dueMs: due + 90,
				durationMs: 120,
				priority: "critical",
				characterIndex: context.characterIndex,
				reducedMotion: "keep",
				payload: { ...payload, kind: "target-hit" },
			}),
		],
		cancelKeys: [`target:${context.targetOrdinal}:decorative`],
	}
}
