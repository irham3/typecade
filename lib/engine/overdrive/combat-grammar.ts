import type { CombatVerb, StageType } from "./types"

export type { CombatVerb } from "./types"

export type CombatGrammarContext = {
	stage: StageType
	zone: number
	characterIndex: number
	wordLength: number
	wordDirty: boolean
	combo: number
	keycapIds: readonly string[]
	overdriveReady: boolean
	finalCharacter: boolean
}

/**
 * Maps typing intent to a readable combat verb. This is deliberately pure:
 * Pixi decides how a verb looks, while the engine decides which verb happened.
 */
export function combatVerbFor(context: CombatGrammarContext): CombatVerb {
	if (context.wordDirty) return "misfire"
	if (context.finalCharacter) return "execution-ready"
	if (context.characterIndex === 0) return "signal-lock"
	if (context.characterIndex === 1) return "arc-dash"
	return "chain-strike"
}
