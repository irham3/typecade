import { describe, expect, it } from "vitest"
import { EFFECT_MANIFEST, effectDescriptorFor } from "../effect-manifest"

describe("combat effect manifest", () => {
	it("covers every semantic combat verb", () => {
		expect(Object.keys(EFFECT_MANIFEST)).toEqual(expect.arrayContaining([
			"signal-lock",
			"arc-dash",
			"chain-strike",
			"execution-ready",
			"misfire",
		]))
	})

	it("keeps accepted contact and clean resolution inside documented budgets", () => {
		expect(effectDescriptorFor("signal-lock").durationMs).toBeLessThanOrEqual(90)
		expect(effectDescriptorFor("stage-clear").durationMs).toBe(900)
		expect(effectDescriptorFor("stage-clear").reducedMotion).toBe("keep")
	})

	it("marks decoration as removable under reduced motion", () => {
		expect(effectDescriptorFor("item-proc").reducedMotion).toBe("omit")
	})

	it("keeps every Keycap action visually distinct", () => {
		const kinds = [
			"slash",
			"dash",
			"blade",
			"railgun",
			"echo",
			"shield",
			"bomb",
			"drain",
			"overdrive-burst",
		] as const
		const descriptors = kinds.map((kind) => effectDescriptorFor(kind))
		expect(new Set(descriptors.map((descriptor) => descriptor.id)).size).toBe(kinds.length)
		expect(descriptors.map((descriptor) => descriptor.mergeKey)).toEqual([
			"slash",
			"dash",
			"blade",
			"railgun",
			"echo",
			"shield",
			"bomb",
			"drain",
			"overdrive",
		])
	})
})
