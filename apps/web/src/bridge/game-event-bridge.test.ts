import { describe, expect, it, vi } from "vitest"
import { GameEventBridge } from "./game-event-bridge"

describe("GameEventBridge", () => {
	it("replays the latest state event to late subscribers", () => {
		const bridge = new GameEventBridge()
		const handler = vi.fn()

		bridge.emit("screen", "endless")
		const unsubscribe = bridge.on("screen", handler)

		expect(handler).toHaveBeenCalledWith("endless")
		unsubscribe()
		bridge.emit("screen", "title")
		expect(handler).toHaveBeenCalledTimes(1)
	})

	it("does not replay one-shot events and removes empty listener sets", () => {
		const bridge = new GameEventBridge()
		const handler = vi.fn()
		bridge.emit("training", { correct: 1, words: 0, errors: 0 })
		const unsubscribe = bridge.on("training", handler)
		expect(handler).not.toHaveBeenCalled()
		bridge.emit("training", { correct: 1, words: 0, errors: 0 })
		expect(handler).toHaveBeenCalledTimes(1)
		unsubscribe()
		bridge.emit("training", { correct: 2, words: 0, errors: 0 })
		expect(handler).toHaveBeenCalledTimes(1)
	})

	it("clears listeners and cached replay state", () => {
		const bridge = new GameEventBridge()
		const first = vi.fn()
		const late = vi.fn()
		bridge.on("screen", first)
		bridge.emit("screen", "endless")
		bridge.clear()
		bridge.emit("screen", "title")
		bridge.on("screen", late)

		expect(first).toHaveBeenCalledTimes(1)
		expect(late).toHaveBeenCalledWith("title")
	})

	it("keeps the shared listener set until its last subscriber leaves", () => {
		const bridge = new GameEventBridge()
		const first = vi.fn()
		const second = vi.fn()
		const unsubscribeFirst = bridge.on("training", first)
		const unsubscribeSecond = bridge.on("training", second)

		unsubscribeFirst()
		bridge.emit("training", { correct: 1, words: 0, errors: 0 })
		expect(first).not.toHaveBeenCalled()
		expect(second).toHaveBeenCalledOnce()
		unsubscribeSecond()
		bridge.emit("training", { correct: 2, words: 0, errors: 0 })
		expect(second).toHaveBeenCalledOnce()
	})
})
