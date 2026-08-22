import { describe, expect, it } from "vitest"
import { normalizeText, replayInputLog, TypingSession } from "../index"

describe("TypingSession", () => {
	it("tracks correct character sequences and word combo", () => {
		const session = new TypingSession("laut biru", { startTimestampMs: 0 })
		const events = [
			...session.processKey("l", 1000),
			...session.processKey("a", 2000),
			...session.processKey("u", 3000),
			...session.processKey("t", 4000),
			...session.processKey(" ", 5000),
			...session.processKey("b", 6000),
			...session.processKey("i", 7000),
			...session.processKey("r", 8000),
			...session.processKey("u", 9000),
		]

		expect(events.filter((event) => event.type === "word-complete")).toHaveLength(2)
		expect(session.getSnapshot().metrics.combo).toBe(2)
		expect(session.getSnapshot().complete).toBe(true)
	})

	it("logs typos without advancing the cursor", () => {
		const session = new TypingSession("ikan", { startTimestampMs: 0 })
		const typo = session.processKey("u", 1000)
		expect(typo[0]?.type).toBe("typo")
		expect(session.getSnapshot().cursor).toBe(0)

		session.processKey("i", 2000)
		expect(session.getSnapshot().cursor).toBe(1)
		expect(session.getSnapshot().metrics.accuracy).toBe(50)
	})

	it("ignores backspace during gameplay", () => {
		const session = new TypingSession("karang", { startTimestampMs: 0 })
		const events = session.processKey("Backspace", 1000)

		expect(events[0]?.type).toBe("ignored")
		expect(session.getSnapshot().cursor).toBe(0)
		expect(session.getSnapshot().metrics.correctKeystrokes).toBe(0)
	})

	it("calculates WPM, raw WPM, accuracy, combo, and consistency", () => {
		const session = new TypingSession("abcde", { startTimestampMs: 0 })
		for (const [index, key] of Array.from("abcde").entries()) {
			session.processKey(key, (index + 1) * 12000)
		}

		const metrics = session.getSnapshot().metrics
		expect(metrics.wpm).toBe(1)
		expect(metrics.rawWpm).toBe(1)
		expect(metrics.accuracy).toBe(100)
		expect(metrics.combo).toBe(1)
		expect(metrics.consistency).toBe(100)
	})

	it("normalizes Unicode punctuation consistently", () => {
		expect(normalizeText("ombak\u00a0besar \u201cmulai\u201d")).toBe('ombak besar "mulai"')
	})

	it("replays compact logs into identical deterministic output", () => {
		const session = new TypingSession("arus tenang", { startTimestampMs: 0 })
		for (const [index, key] of Array.from("arus tenang").entries()) {
			session.processKey(key, (index + 1) * 700)
		}

		const first = session.getSnapshot()
		const replayed = replayInputLog(first.targetText, first.eventLog, { startTimestampMs: 0 })

		expect(replayed.metrics).toEqual(first.metrics)
		expect(replayed.cursor).toBe(first.cursor)
		expect(replayed.complete).toBe(true)
	})
})
