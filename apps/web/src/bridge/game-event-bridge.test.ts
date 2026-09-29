import { describe, expect, it, vi } from "vitest"
import { GameEventBridge } from "./game-event-bridge"

describe("GameEventBridge", () => {
	it("replays the latest state event to late subscribers", () => {
		const bridge = new GameEventBridge()
		const handler = vi.fn()

		bridge.emit("screen:changed", { screen: "game" })
		const unsubscribe = bridge.on("screen:changed", handler)

		expect(handler).toHaveBeenCalledWith({ screen: "game" })
		unsubscribe()
		bridge.emit("screen:changed", { screen: "menu" })
		expect(handler).toHaveBeenCalledTimes(1)
	})

	it("does not replay one-shot events and removes empty listener sets", () => {
		const bridge = new GameEventBridge()
		const handler = vi.fn()
		bridge.emit("level:up", { fromLevel: 1, toLevel: 2, xp: 60 })
		const unsubscribe = bridge.on("level:up", handler)
		expect(handler).not.toHaveBeenCalled()
		bridge.emit("level:up", { fromLevel: 1, toLevel: 2, xp: 60 })
		expect(handler).toHaveBeenCalledTimes(1)
		unsubscribe()
		bridge.emit("level:up", { fromLevel: 2, toLevel: 3, xp: 120 })
		expect(handler).toHaveBeenCalledTimes(1)
	})

	it("clears listeners and cached replay state", () => {
		const bridge = new GameEventBridge()
		const first = vi.fn()
		const late = vi.fn()
		bridge.on("game:paused", first)
		bridge.emit("game:paused", { paused: true })
		bridge.clear()
		bridge.emit("game:paused", { paused: false })
		bridge.on("game:paused", late)

		expect(first).toHaveBeenCalledTimes(1)
		expect(late).toHaveBeenCalledWith({ paused: false })
	})

	it("keeps the shared listener set until its last subscriber leaves", () => {
		const bridge = new GameEventBridge()
		const first = vi.fn()
		const second = vi.fn()
		const unsubscribeFirst = bridge.on("audio:play", first)
		const unsubscribeSecond = bridge.on("audio:play", second)

		unsubscribeFirst()
		bridge.emit("audio:play", { key: "sfx_correct_tick_a", category: "typing" })
		expect(first).not.toHaveBeenCalled()
		expect(second).toHaveBeenCalledOnce()
		unsubscribeSecond()
		bridge.emit("audio:play", { key: "sfx_correct_tick_b", category: "typing" })
		expect(second).toHaveBeenCalledOnce()
	})
})
