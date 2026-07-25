import type { MacroDef } from "./registry"

export const MACROS: Record<string, MacroDef> = {
	escape: {
		id: "escape",
		name: "Escape",
		type: "macro",
		description: "Cancel the Glitch effect for this stage",
		trigger: "Use during a Glitch stage",
		rarity: "macro",
		basePrice: 3,
		onUse: ({ cancelGlitch }) => {
			cancelGlitch()
			return "Glitch cancelled"
		},
	},
	time_freeze: {
		id: "time_freeze",
		name: "Time Freeze",
		type: "macro",
		description: "+20 seconds this stage",
		trigger: "Use during any active stage",
		rarity: "macro",
		basePrice: 3,
		onUse: ({ state }) => {
			state.timeLeftMs += 20_000
			return "+20 seconds"
		},
	},
	quota_slash: {
		id: "quota_slash",
		name: "Quota Slash",
		type: "macro",
		description: "This stage's quota -25%",
		trigger: "Use during any active stage",
		rarity: "macro",
		basePrice: 4,
		onUse: ({ state }) => {
			const previous = state.quota
			state.quota = Math.floor(state.quota * 0.75)
			return `Quota reduced by ${previous - state.quota}`
		},
	},
	insurance: {
		id: "insurance",
		name: "Insurance",
		type: "macro",
		description: "The next typo is fully ignored (no combo reset, does not shatter Glass)",
		trigger: "Use to arm protection for the next typo",
		rarity: "macro",
		basePrice: 3,
		onUse: ({ armInsurance }) => {
			armInsurance()
			return "Next typo ignored"
		},
	},
}
