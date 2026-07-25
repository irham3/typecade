import { WORDS_PER_MULT } from "./constants"

export type WordResult = {
	clean: boolean
	combo: number
	mult: number
	multIncreased: boolean
}

/**
 * Natural typing streak state. Item bonuses are deliberately evaluated by the
 * item hooks in run.ts so the scorer remains deterministic and item-agnostic.
 */
export function createScorer(initial?: { combo?: number; mult?: number }) {
	let combo = initial?.combo ?? 0
	let mult = initial?.mult ?? 1

	return {
		get combo() {
			return combo
		},
		get mult() {
			return mult
		},
		completeWord(hadTypo: boolean, preserveMult = false): WordResult {
			if (hadTypo) {
				combo = 0
				if (!preserveMult) mult = 1
				return { clean: false, combo, mult, multIncreased: false }
			}

			combo += 1
			const multIncreased = combo % WORDS_PER_MULT === 0
			if (multIncreased) mult += 1
			return { clean: true, combo, mult, multIncreased }
		},
	}
}
