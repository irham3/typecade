import { WORDS_PER_MULT } from "./constants"

export type WordResult = { gained: number; clean: boolean; combo: number; mult: number }

export function createScorer(baseBonus = 0) {
	let combo = 0
	let mult = 1
	return {
		get combo() { return combo },
		get mult() { return mult },
		completeWord(word: string, hadTypo: boolean, shieldMult: boolean = false): WordResult {
			if (hadTypo) {
				combo = 0
				if (!shieldMult) {
					mult = 1
				}
				return { gained: 0, clean: false, combo, mult }
			}
			combo += 1
			if (combo > 0 && combo % WORDS_PER_MULT === 0) mult += 1
			return { gained: (word.length + baseBonus) * mult, clean: true, combo, mult }
		},
	}
}
