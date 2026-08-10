import { describe, expect, it } from "vitest"
import { createPersistedRunWriter } from "../persisted-run-writer"

describe("persisted run writer", () => {
	it("coalesces timer writes and flushes the latest state", () => {
		let scheduled: (() => void) | null = null
		const writes: string[] = []
		let serialized = "first"
		const writer = createPersistedRunWriter({
			delayMs: 750,
			serialize: () => serialized,
			save: (value) => writes.push(value),
			schedule: (callback) => {
				scheduled = callback
				return 1
			},
			cancel: () => {
				scheduled = null
			},
		})

		writer.schedule()
		serialized = "latest"
		writer.schedule()
		expect(writes).toEqual([])
		expect(scheduled).not.toBeNull()

		const callback = scheduled as (() => void) | null
		callback?.()
		expect(writes).toEqual(["latest"])
	})

	it("flushes immediately at semantic boundaries", () => {
		const writes: string[] = []
		const writer = createPersistedRunWriter({
			serialize: () => "semantic",
			save: (value) => writes.push(value),
			schedule: () => 1,
			cancel: () => undefined,
		})

		writer.schedule()
		writer.flush()

		expect(writes).toEqual(["semantic"])
	})
})
