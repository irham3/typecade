import type { KeycapDef } from "./registry"

export const KEYCAPS: Record<string, KeycapDef> = {
	"wasd": {
		id: "wasd",
		name: "WASD",
		type: "keycap",
		description: "Words starting with W/A/S/D: +10 Base",
		rarity: "common",
		basePrice: 4,
		onEquip: ({ events, modifiers }) => {
			events.on("word_complete", (payload) => {
				if (payload.word.match(/^[wasd]/i)) modifiers.baseBonus += 10
			})
		}
	},
	"vowel_magnet": {
		id: "vowel_magnet",
		name: "Vowel Magnet",
		type: "keycap",
		description: "Every typed vowel: +1 Base",
		rarity: "common",
		basePrice: 3,
		onEquip: ({ events, modifiers }) => {
			events.on("word_complete", (payload) => {
				const vowels = payload.word.match(/[aeiou]/gi)
				if (vowels) modifiers.baseBonus += vowels.length
			})
		}
	},
	"longshot": {
		id: "longshot",
		name: "Longshot",
		type: "keycap",
		description: "Words of 8+ letters: Base x2",
		rarity: "common",
		basePrice: 4,
		onEquip: ({ events, modifiers }) => {
			events.on("word_complete", (payload) => {
				if (payload.word.length >= 8) modifiers.baseMultiplier *= 2
			})
		}
	},
	"sprinter": {
		id: "sprinter",
		name: "Sprinter",
		type: "keycap",
		description: "First 10 seconds of each stage: +2 Mult",
		rarity: "common",
		basePrice: 4,
		onEquip: ({ events, modifiers, state }) => {
			events.on("word_complete", () => {
				if (state.timeLeftMs > 50_000) modifiers.multAdd += 2
			})
		}
	},
	"second_wind": {
		id: "second_wind",
		name: "Second Wind",
		type: "keycap",
		description: "First word after a typo: score x3",
		rarity: "common",
		basePrice: 3,
		onEquip: ({ events, modifiers }) => {
			let hadTypo = false
			events.on("typo", () => { hadTypo = true })
			events.on("word_complete", () => {
				if (hadTypo) {
					modifiers.finalMultiplier *= 3
					hadTypo = false
				}
			})
		}
	},
	"copper_key": {
		id: "copper_key",
		name: "Copper Key",
		type: "keycap",
		description: "Every 25 correct words: +1 Token",
		rarity: "common",
		basePrice: 4,
		onEquip: ({ events, state }) => {
			let count = 0
			events.on("word_complete", () => {
				count++
				if (count >= 25) {
					state.tokens += 1
					count = 0
				}
			})
		}
	},
	"home_row": {
		id: "home_row",
		name: "Home Row",
		type: "keycap",
		description: "Words made only of home-row letters (asdfghjkl): +15 Base",
		rarity: "common",
		basePrice: 4,
		onEquip: ({ events, modifiers }) => {
			events.on("word_complete", (payload) => {
				if (payload.word.match(/^[asdfghjkl]+$/i)) modifiers.baseBonus += 15
			})
		}
	},
	"punctuator": {
		id: "punctuator",
		name: "Punctuator",
		type: "keycap",
		description: "Correct punctuation: +3 Base per mark",
		rarity: "common",
		basePrice: 3,
		onEquip: ({ events, modifiers }) => {
			events.on("word_complete", (payload) => {
				const marks = payload.word.match(/[.,!?;:]/g)
				if (marks) modifiers.baseBonus += marks.length * 3
			})
		}
	},
	"combo_battery": {
		id: "combo_battery",
		name: "Combo Battery",
		type: "keycap",
		description: "First typo of each stage does not reset Mult (1 shield/stage)",
		rarity: "uncommon",
		basePrice: 6,
		onEquip: ({ modifiers }) => {
			modifiers.comboBatteryActive = true
		}
	},
	"overclock": {
		id: "overclock",
		name: "Overclock",
		type: "keycap",
		description: "Every 15-word streak: +1 Mult, permanent for the stage",
		rarity: "uncommon",
		basePrice: 6,
		onEquip: ({ events, modifiers }) => {
			let stageMult = 0
			events.on("word_complete", (payload) => {
				if (payload.combo > 0 && payload.combo % 15 === 0) {
					stageMult += 1
				}
				modifiers.multAdd += stageMult
			})
		}
	},
	"favorite_letter": {
		id: "favorite_letter",
		name: "Favorite Letter",
		type: "keycap",
		description: "Pick 1 letter on purchase; that letter gives +2 Base per occurrence",
		rarity: "uncommon",
		basePrice: 5,
		onEquip: ({ events, modifiers }) => {
			events.on("word_complete", (payload) => {
				const eCount = payload.word.match(/e/gi)
				if (eCount) modifiers.baseBonus += eCount.length * 2
			})
		}
	},
	"snowball": {
		id: "snowball",
		name: "Snowball",
		type: "keycap",
		description: "Finish a stage with zero typos: +0.2 Mult, permanent for the whole run",
		rarity: "uncommon",
		basePrice: 6,
		onEquip: ({ events, modifiers }) => {
			let permanentMult = 0
			let hadTypo = false
			events.on("typo", () => { hadTypo = true })
			events.on("stage_clear", () => {
				if (!hadTypo) permanentMult += 0.2
				hadTypo = false
			})
			events.on("word_complete", () => {
				modifiers.multAdd += Math.floor(permanentMult) 
			})
		}
	},
	"interest_bank": {
		id: "interest_bank",
		name: "Interest Bank",
		type: "keycap",
		description: "Interest cap rises from +5 to +10",
		rarity: "uncommon",
		basePrice: 5,
		onEquip: ({ modifiers }) => {
			modifiers.interestCap = 10
		}
	},
	"glass_keycap": {
		id: "glass_keycap",
		name: "Glass Keycap",
		type: "keycap",
		description: "Mult x3, shatters if stage accuracy <95%",
		rarity: "rare",
		basePrice: 8,
		onEquip: ({ events, modifiers, state }) => {
			let shattered = false
			events.on("word_complete", () => {
				if (!shattered) modifiers.multMultiplier *= 3
			})
			events.on("stage_clear", () => {
				if (state.accuracy < 95) shattered = true
			})
		}
	},
	"vampire": {
		id: "vampire",
		name: "Vampire",
		type: "keycap",
		description: "Typos do not reset Mult, but cost -3 seconds",
		rarity: "rare",
		basePrice: 8,
		onEquip: ({ events, state, modifiers }) => {
			events.on("typo", () => {
				state.timeLeftMs = Math.max(0, state.timeLeftMs - 3000)
				modifiers.preventMultReset = true
			})
		}
	}
}
