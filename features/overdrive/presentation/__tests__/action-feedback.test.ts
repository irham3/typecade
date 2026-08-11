import { describe, expect, it } from "vitest"
import type { OverdrivePresentationEvent } from "../events"
import { collectKeycapFeedback } from "../action-feedback"

describe("collectKeycapFeedback", () => {
	it("attributes character and word combat actions to their Keycaps", () => {
		const events: OverdrivePresentationEvent[] = [
			{
				id: 4,
				type: "accepted-character",
				character: "a",
				index: 0,
				word: "arcade",
				targetOrdinal: 2,
				combo: 0,
				charge: 3,
				actions: [{
					kind: "blade",
					itemId: "vowel_magnet",
					targetScope: "active",
					power: 1,
					characterIndex: 0,
					overdrive: false,
					label: "VOWEL BLADE",
				}],
			},
			{
				id: 5,
				type: "word-completed",
				word: "arcade",
				characterBase: 6,
				itemBaseBonus: 0,
				effectiveBase: 6,
				effectiveMult: 1,
				finalMultiplier: 1,
				scoreGain: 6,
				overdriveReleased: false,
				aegisRecovery: false,
				autoExecuted: false,
				appliedItemIds: ["vampire"],
				targetOrdinal: 2,
				combo: 1,
				combatActions: [{
					kind: "drain",
					itemId: "vampire",
					targetScope: "active",
					power: 1,
					characterIndex: 5,
					overdrive: false,
					label: "VAMPIRE DRAIN",
				}],
			},
		]

		expect(collectKeycapFeedback(events)).toEqual([
			{ eventId: 4, itemId: "vowel_magnet", label: "VOWEL BLADE" },
			{ eventId: 5, itemId: "vampire", label: "VAMPIRE DRAIN" },
		])
	})
})
