import type { FirmwareDef } from "./registry"

export const FIRMWARE: Record<string, FirmwareDef> = {
	extra_slot: {
		id: "extra_slot",
		name: "Extra Slot",
		type: "firmware",
		rarity: "legendary",
		basePrice: 8,
		description: "+1 Keycap slot (max 7)",
	},
	discount: {
		id: "discount",
		name: "Discount",
		type: "firmware",
		rarity: "legendary",
		basePrice: 8,
		description: "All shop prices -25%",
	},
	extended_timer: {
		id: "extended_timer",
		name: "Extended Timer",
		type: "firmware",
		rarity: "legendary",
		basePrice: 8,
		description: "+10 seconds on every stage",
	},
	better_odds: {
		id: "better_odds",
		name: "Better Odds",
		type: "firmware",
		rarity: "legendary",
		basePrice: 8,
		description: "Rare/Legendary odds x2",
	},
	macro_pocket: {
		id: "macro_pocket",
		name: "Macro Pocket",
		type: "firmware",
		rarity: "legendary",
		basePrice: 8,
		description: "+1 Macro slot",
	},
}
