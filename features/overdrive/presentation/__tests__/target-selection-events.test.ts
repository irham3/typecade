import { describe, expect, it } from "vitest"
import {
	emitLegacyPresentationEvent,
	getPresentationEvents,
	resetPresentationEventsForTests,
} from "../events"

describe("target selection presentation", () => {
	it("keeps target selection before the accepted character in the event stream", () => {
		resetPresentationEventsForTests()
		emitLegacyPresentationEvent({
			type: "target-selected",
			word: "charlie",
			previousWord: "alpha",
			queueIndex: 1,
			targetOrdinal: 0,
			prefix: "C",
		})
		emitLegacyPresentationEvent({
			type: "accepted-character",
			character: "c",
			index: 0,
			word: "charlie",
			targetOrdinal: 0,
			combo: 0,
			charge: 3,
			actions: [{
				kind: "slash",
				targetScope: "active",
				power: 1,
				characterIndex: 0,
				overdrive: false,
				label: "SIGNAL SLASH",
			}],
		})

		const events = getPresentationEvents()
		expect(events[0].type).toBe("target-selected")
		expect(events[1]).toMatchObject({
			type: "accepted-character",
			word: "charlie",
			actions: [{ kind: "slash" }],
		})
	})
})
