import { sampleTrack } from "../interpolate"
import type { RigTransform } from "../rig-definition"

const base: RigTransform = {
	x: 4,
	y: 8,
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
	alpha: 1,
}

describe("sampleTrack", () => {
	it("interpolates between adjacent keyframes", () => {
		const sampled = sampleTrack([
			{ atMs: 0, x: 0, rotation: 0, alpha: 1 },
			{ atMs: 100, x: 20, rotation: 1, alpha: 0.5 },
		], 50, base)

		expect(sampled.x).toBeCloseTo(10)
		expect(sampled.rotation).toBeCloseTo(0.5)
		expect(sampled.alpha).toBeCloseTo(0.75)
	})

	it("holds the first and last values outside the track range", () => {
		const keyframes = [
			{ atMs: 20, x: 6 },
			{ atMs: 80, x: 18 },
		] as const

		expect(sampleTrack(keyframes, -100, base).x).toBe(6)
		expect(sampleTrack(keyframes, 500, base).x).toBe(18)
	})

	it("inherits missing values from the base transform", () => {
		const sampled = sampleTrack([
			{ atMs: 0, x: 0 },
			{ atMs: 100, x: 20 },
		], 50, base)

		expect(sampled.y).toBe(base.y)
		expect(sampled.scaleX).toBe(base.scaleX)
		expect(sampled.scaleY).toBe(base.scaleY)
		expect(sampled.alpha).toBe(base.alpha)
	})

	it("applies cubic-out and ease-out-back", () => {
		const cubic = sampleTrack([
			{ atMs: 0, x: 0 },
			{ atMs: 100, x: 10, easing: "cubic-out" },
		], 50, base)
		const back = sampleTrack([
			{ atMs: 0, x: 0 },
			{ atMs: 100, x: 10, easing: "ease-out-back" },
		], 75, base)

		expect(cubic.x).toBeCloseTo(8.75)
		expect(back.x).toBeGreaterThan(10)
	})
})
