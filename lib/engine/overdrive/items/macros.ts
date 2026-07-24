import type { MacroDef } from "./registry"

export const MACROS: Record<string, MacroDef> = {
	"escape": {
		id: "escape",
		name: "Escape",
		type: "macro",
		description: "Cancel the Glitch effect for this stage",
		rarity: "macro",
		basePrice: 3,
		onUse: ({ modifiers }) => {
			modifiers.glitchCancelled = true
		}
	},
	"time_freeze": {
		id: "time_freeze",
		name: "Time Freeze",
		type: "macro",
		description: "+20 seconds this stage",
		rarity: "macro",
		basePrice: 3,
		onUse: ({ state }) => {
			state.timeLeftMs += 20_000
		}
	},
	"quota_slash": {
		id: "quota_slash",
		name: "Quota Slash",
		type: "macro",
		description: "This stage's quota -25%",
		rarity: "macro",
		basePrice: 4,
		onUse: ({ state }) => {
			state.quota = Math.floor(state.quota * 0.75)
		}
	},
	"ctrl_c": {
		id: "ctrl_c",
		name: "Ctrl+C",
		type: "macro",
		description: "Duplicate 1 owned Common/Uncommon Keycap",
		rarity: "macro",
		basePrice: 4,
		onUse: ({ api }) => {
			api.duplicateRandomKeycap()
		}
	}
}
