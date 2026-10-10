import { describe, expect, it } from "vitest"
import { fishSpecies } from "@typecade/content"
import { fishLayout, surfaceY } from "./ocean-motion"

describe("ocean camera framing", () => {
	it("keeps all ten species below water and above the typing area at every reel stage", () => {
		for (const [width, height] of [[1366, 768], [1024, 768], [390, 844], [320, 640]]) {
			for (const fish of fishSpecies) for (const time of [0, .7, 2, 5]) for (const progress of [0, .5, 1]) {
				const layout = fishLayout(fish, width, height, time, progress, 90, false)
				expect(layout.y - layout.frameHeight * layout.size * 1.06 / 2).toBeGreaterThan(height * .3 + 2)
				expect(layout.y + layout.frameHeight * layout.size * 1.06 / 2).toBeLessThan(layout.waterBottom)
				expect(layout.x).toBeLessThan(width)
			}
		}
	})
	it("pulls fish toward the boat, removes drift for reduced effects, and shares a bounded surface", () => {
		for (const fish of fishSpecies) {
			const start = fishLayout(fish, 1366, 768, 0, 0, 28, true)
			const finish = fishLayout(fish, 1366, 768, 10, 1, 28, true)
			expect(finish.x).toBeLessThan(start.x)
			expect(fishLayout(fish, 1366, 768, 10, 0, 28, true)).toEqual(start)
		}
		for (const time of [0, 1, 5, 8]) for (const x of [0, 200, 700, 1300]) {
			expect(surfaceY(x, 1366, 768, time, true)).toBe(768 * .3)
			expect(Math.abs(surfaceY(x, 1366, 768, time, false) - 768 * .3)).toBeLessThanOrEqual(2)
		}
	})
})
