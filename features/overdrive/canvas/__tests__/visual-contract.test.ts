import { describe, expect, it } from "vitest"
import { SCENE } from "../visual-assets"

describe("Visual Contract Tokens", () => {
	it("ensures Warden desktop max is <= 280", () => {
		expect(SCENE.wardenHeight.desktop.max).toBeLessThanOrEqual(280)
	})

	it("ensures enemy desktop max is <= 245", () => {
		expect(SCENE.targetHeight.desktop.max).toBeLessThanOrEqual(245)
	})

	it("ensures command rail y is >= 0.74", () => {
		expect(SCENE.wordAnchor.y).toBeGreaterThanOrEqual(0.74)
	})

	it("ensures upcoming scale is <= 0.58", () => {
		expect(SCENE.targetStaging.desktop.upcomingScale).toBeLessThanOrEqual(0.58)
		expect(SCENE.targetStaging.compact.upcomingScale).toBeLessThanOrEqual(0.58)
	})

	it("ensures distant scale is <= 0.36", () => {
		expect(SCENE.targetStaging.desktop.distantScale).toBeLessThanOrEqual(0.36)
		expect(SCENE.targetStaging.compact.distantScale).toBeLessThanOrEqual(0.36)
	})

	it("ensures upcoming alpha is <= 0.36", () => {
		expect(SCENE.targetStaging.desktop.upcomingAlpha).toBeLessThanOrEqual(0.36)
		expect(SCENE.targetStaging.compact.upcomingAlpha).toBeLessThanOrEqual(0.36)
	})

	it("ensures distant alpha is <= 0.18", () => {
		expect(SCENE.targetStaging.desktop.distantAlpha).toBeLessThanOrEqual(0.18)
		expect(SCENE.targetStaging.compact.distantAlpha).toBeLessThanOrEqual(0.18)
	})

	it("ensures target anchor + upcoming offset < 0.90", () => {
		const desktopSum = SCENE.targetAnchor.desktop.x + SCENE.targetStaging.desktop.upcomingOffsetX
		expect(desktopSum).toBeLessThan(0.90)

		const compactSum = SCENE.targetAnchor.compact.x + SCENE.targetStaging.compact.upcomingOffsetX
		expect(compactSum).toBeLessThan(0.90)
	})

	it("ensures Warden and target do not use the old 400/360 max values", () => {
		expect(SCENE.wardenHeight.desktop.max).not.toBe(400)
		expect(SCENE.targetHeight.desktop.max).not.toBe(360)
	})
})
