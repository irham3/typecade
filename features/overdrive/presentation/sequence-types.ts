import type { CombatVerb, StageType } from "@/lib/engine/overdrive"

export type SequencePriority = "critical" | "combat" | "feedback" | "ambient"

export type SequenceBeat = {
	id: string
	sequence: string
	dueMs: number
	durationMs: number
	priority: SequencePriority
	targetOrdinal: number
	characterIndex?: number
	reducedMotion: "keep" | "omit-decoration"
	payload: Readonly<Record<string, string | number | boolean>>
}

export type SequenceOutput = {
	beats: readonly SequenceBeat[]
	cancelKeys: readonly string[]
}

export type SequenceContext = {
	sequenceId: string
	targetOrdinal: number
	stage: StageType
	zone: number
	combo: number
	baseDueMs?: number
}

export type CharacterContactContext = SequenceContext & {
	character: string
	characterIndex: number
	word: string
	combatVerb: CombatVerb
}

export function beatId(context: SequenceContext, suffix: string) {
	return `${context.sequenceId}:${suffix}`
}

export function combatBeat(
	context: SequenceContext,
	options: Omit<SequenceBeat, "id" | "sequence" | "targetOrdinal"> & { suffix: string },
): SequenceBeat {
	return {
		id: beatId(context, options.suffix),
		sequence: context.sequenceId,
		targetOrdinal: context.targetOrdinal,
		...options,
	}
}
