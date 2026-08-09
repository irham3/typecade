import type {
	KeycapDef,
	WordScoreContext,
} from "./registry"

function markApplied(ctx: WordScoreContext, id: string) {
	if (!ctx.appliedItemIds.includes(id)) ctx.appliedItemIds.push(id)
}

function addBase(
	ctx: WordScoreContext,
	id: string,
	amount: number,
	trigger: string,
) {
	ctx.baseBonus += amount
	markApplied(ctx, id)
	ctx.proc(trigger, { kind: "base", amount, label: `+${amount} Base` })
}

export const KEYCAPS: Record<string, KeycapDef> = {
	wasd: {
		id: "wasd",
		name: "WASD",
		type: "keycap",
		description: "Words starting with W/A/S/D: +10 Base",
		trigger: "Word starts with W, A, S, or D",
		rarity: "common",
		basePrice: 4,
		previewWord: ({ word }) => /^[wasd]/i.test(word),
		beforeWordScore: (ctx) => {
			if (ctx.clean && /^[wasd]/i.test(ctx.word)) {
				addBase(ctx, "wasd", 10, "WASD")
			}
		},
	},
	vowel_magnet: {
		id: "vowel_magnet",
		name: "Vowel Magnet",
		type: "keycap",
		description: "Every typed vowel: +1 Base",
		trigger: "Every vowel in a clean word",
		rarity: "common",
		basePrice: 3,
		previewWord: ({ word }) => /[aeiou]/i.test(word),
		beforeWordScore: (ctx) => {
			if (!ctx.clean) return
			const vowels = ctx.word.match(/[aeiou]/gi)?.length ?? 0
			if (vowels > 0) addBase(ctx, "vowel_magnet", vowels, "Vowel Magnet")
		},
	},
	longshot: {
		id: "longshot",
		name: "Longshot",
		type: "keycap",
		description: "Words of 8+ letters: Base x2",
		trigger: "Clean word has at least 8 letters",
		rarity: "common",
		basePrice: 4,
		previewWord: ({ word }) => word.replace(/[^\p{L}]/gu, "").length >= 8,
		beforeWordScore: (ctx) => {
			if (ctx.clean && ctx.word.replace(/[^\p{L}]/gu, "").length >= 8) {
				ctx.baseMultiplier *= 2
				markApplied(ctx, "longshot")
				ctx.proc("Longshot", { kind: "base", amount: 2, label: "×2 Base" })
			}
		},
	},
	sprinter: {
		id: "sprinter",
		name: "Sprinter",
		type: "keycap",
		description: "First 10 seconds of each stage: +2 Mult",
		trigger: "Clean word during the first 10 seconds",
		rarity: "common",
		basePrice: 4,
		previewWord: ({ elapsedMs }) => elapsedMs <= 10_000,
		beforeWordScore: (ctx) => {
			if (ctx.clean && ctx.elapsedMs <= 10_000) {
				ctx.multAdd += 2
				markApplied(ctx, "sprinter")
				ctx.proc("Sprinter", { kind: "mult", amount: 2, label: "+2 Mult" })
			}
		},
	},
	second_wind: {
		id: "second_wind",
		name: "Second Wind",
		type: "keycap",
		description: "First word after a typo: score x3",
		trigger: "First clean word after a typo",
		rarity: "common",
		basePrice: 3,
		previewWord: ({ stageData }) => stageData.armed === true,
		onTypo: (ctx) => {
			ctx.stageData.armed = true
		},
		beforeWordScore: (ctx) => {
			if (ctx.clean && ctx.stageData.armed === true) {
				ctx.finalMultiplier *= 3
				ctx.stageData.armed = false
				markApplied(ctx, "second_wind")
				ctx.proc("Second Wind", { kind: "score", amount: 3, label: "×3 Score" })
			}
		},
	},
	copper_key: {
		id: "copper_key",
		name: "Copper Key",
		type: "keycap",
		description: "Every 25 correct words: +1 Token",
		trigger: "Every 25 clean words across the run",
		rarity: "common",
		basePrice: 4,
		previewWord: ({ runData }) => (Number(runData.correctWords ?? 0) + 1) % 25 === 0,
		afterWordScore: (ctx) => {
			if (!ctx.clean) return
			const count = Number(ctx.runData.correctWords ?? 0) + 1
			ctx.runData.correctWords = count
			if (count % 25 === 0) {
				ctx.state.tokens += 1
				ctx.proc("Copper Key", { kind: "token", amount: 1, label: "+1 Token" })
			}
		},
	},
	home_row: {
		id: "home_row",
		name: "Home Row",
		type: "keycap",
		description: "Words made only of home-row letters (asdfghjkl): +15 Base",
		trigger: "Clean word uses only A/S/D/F/G/H/J/K/L",
		rarity: "common",
		basePrice: 4,
		previewWord: ({ word }) => {
			const letters = word.replace(/[^\p{L}]/gu, "")
			return letters.length > 0 && /^[asdfghjkl]+$/i.test(letters)
		},
		beforeWordScore: (ctx) => {
			const letters = ctx.word.replace(/[^\p{L}]/gu, "")
			if (ctx.clean && letters.length > 0 && /^[asdfghjkl]+$/i.test(letters)) {
				addBase(ctx, "home_row", 15, "Home Row")
			}
		},
	},
	punctuator: {
		id: "punctuator",
		name: "Punctuator",
		type: "keycap",
		description: "Correct punctuation: +3 Base per mark",
		trigger: "Every punctuation mark in a clean word",
		rarity: "common",
		basePrice: 3,
		previewWord: ({ word }) => /[.,!?;:]/.test(word),
		beforeWordScore: (ctx) => {
			if (!ctx.clean) return
			const marks = ctx.word.match(/[.,!?;:]/g)?.length ?? 0
			if (marks > 0) addBase(ctx, "punctuator", marks * 3, "Punctuator")
		},
	},
	combo_battery: {
		id: "combo_battery",
		name: "Combo Battery",
		type: "keycap",
		description: "First typo of each stage does not reset Mult (1 shield/stage)",
		trigger: "First typo in each stage",
		rarity: "uncommon",
		basePrice: 6,
		onStageStart: (ctx) => {
			ctx.stageData.ready = true
		},
		onTypo: (ctx) => {
			if (ctx.stageData.ready === true) {
				ctx.stageData.ready = false
				ctx.preserveMult = true
				ctx.proc("Combo Battery", {
					kind: "protection",
					amount: 1,
					label: "Mult protected",
				})
			}
		},
	},
	overclock: {
		id: "overclock",
		name: "Overclock",
		type: "keycap",
		description: "Every 15-word streak: +1 Mult, permanent for the stage",
		trigger: "Clean streak reaches 15, 30, 45…",
		rarity: "uncommon",
		basePrice: 6,
		previewWord: ({ combo }) => combo > 0 && combo % 15 === 0,
		beforeWordScore: (ctx) => {
			let bonus = Number(ctx.stageData.bonus ?? 0)
			if (ctx.clean && ctx.combo > 0 && ctx.combo % 15 === 0) {
				bonus += 1
				ctx.stageData.bonus = bonus
				ctx.proc("Overclock", { kind: "mult", amount: 1, label: "+1 stage Mult" })
			}
			ctx.multAdd += bonus
			if (bonus > 0) markApplied(ctx, "overclock")
		},
	},
	double_tap: {
		id: "double_tap",
		name: "Double Tap",
		type: "keycap",
		description: "Words with a double letter (ll, ss, tt...): +4 Mult for that word",
		trigger: "Clean word contains a repeated letter",
		rarity: "uncommon",
		basePrice: 5,
		previewWord: ({ word }) => /(.)\1/i.test(word),
		beforeWordScore: (ctx) => {
			if (ctx.clean && /(.)\1/i.test(ctx.word)) {
				ctx.multAdd += 4
				markApplied(ctx, "double_tap")
				ctx.proc("Double Tap", { kind: "mult", amount: 4, label: "+4 Mult" })
			}
		},
	},
	snowball: {
		id: "snowball",
		name: "Snowball",
		type: "keycap",
		description: "Finish a stage with zero typos: +0.2 Mult, permanent for the whole run",
		trigger: "Clear a stage with zero typos",
		rarity: "uncommon",
		basePrice: 6,
		beforeWordScore: (ctx) => {
			const bonus = Number(ctx.runData.permanentMult ?? 0)
			if (bonus > 0) {
				ctx.multAdd += bonus
				markApplied(ctx, "snowball")
			}
		},
		onStageEnd: (ctx) => {
			if (ctx.cleared && ctx.stageTypos === 0) {
				const bonus = Number(ctx.runData.permanentMult ?? 0) + 0.2
				ctx.runData.permanentMult = Number(bonus.toFixed(1))
				ctx.proc("Snowball", {
					kind: "mult",
					amount: 0.2,
					label: "+0.2 permanent Mult",
				})
			}
		},
	},
	interest_bank: {
		id: "interest_bank",
		name: "Interest Bank",
		type: "keycap",
		description: "Interest cap rises from +5 to +10",
		trigger: "Interest is calculated after a clear",
		rarity: "uncommon",
		basePrice: 5,
		onStageStart: (ctx) => {
			ctx.interestCap = 10
		},
	},
	glass_keycap: {
		id: "glass_keycap",
		name: "Glass Keycap",
		type: "keycap",
		description: "Mult x3, shatters if stage accuracy <95%",
		trigger: "Every clean word while accuracy stays at least 95%",
		rarity: "rare",
		basePrice: 8,
		previewWord: () => true,
		beforeWordScore: (ctx) => {
			if (!ctx.clean) return
			ctx.multMultiplier *= 3
			markApplied(ctx, "glass_keycap")
			ctx.proc("Glass Keycap", { kind: "mult", amount: 3, label: "×3 Mult" })
		},
		onStageEnd: (ctx) => {
			if (ctx.accuracy < 95) {
				ctx.removeSelf = true
				ctx.proc("Glass Keycap shattered", {
					kind: "protection",
					amount: -1,
					label: "Shattered",
				})
			}
		},
	},
	vampire: {
		id: "vampire",
		name: "Vampire",
		type: "keycap",
		description: "Typos do not reset Mult, but cost -3 seconds",
		trigger: "Every typo",
		rarity: "rare",
		basePrice: 8,
		onTypo: (ctx) => {
			ctx.preserveMult = true
			ctx.timePenaltyMs += 3_000
			ctx.proc("Vampire", { kind: "time", amount: -3_000, label: "−3 seconds" })
		},
	},
}
