import { describe, expect, it } from "vitest"
import { ITEM_PRESENTATION } from "../item-presentation"

describe("ITEM_PRESENTATION", () => {
	it("covers exactly 15 MVP Keycap IDs and 4 Macro IDs", () => {
		const mvpItemIds = [
			// 15 Keycaps
			"wasd",
			"vowel_magnet",
			"longshot",
			"sprinter",
			"second_wind",
			"copper_key",
			"home_row",
			"punctuator",
			"combo_battery",
			"overclock",
			"double_tap",
			"snowball",
			"interest_bank",
			"glass_keycap",
			"vampire",
			// 4 Macros
			"escape",
			"time_freeze",
			"quota_slash",
			"insurance",
		]
		const keys = Object.keys(ITEM_PRESENTATION)
		expect(keys).toHaveLength(19)
		expect(keys.sort()).toEqual(mvpItemIds.sort())
	})
})
