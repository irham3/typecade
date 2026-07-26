import { describe, expect, it } from "vitest"
import {
	validateEnvironmentDefinition,
	SIGNAL_TRENCH_LAYER_ROLES,
	isEnvironmentLayerRole,
	type EnvironmentDefinition,
} from "../environment-definition"

function makeValidManifest(): EnvironmentDefinition {
	return {
		id: "signal-trench-v1",
		source: "public/overdrive/art/source/signal-trench-kit-v1-source.png",
		layers: [
			{
				role: "far",
				src: "/overdrive/art/environment/signal-trench-far-v1.webp",
				width: 748,
				height: 96,
				hasAlpha: true,
				alphaCoverage: 1.0,
				sourceBounds: { x: 0, y: 18, width: 1536, height: 194 },
			},
			{
				role: "machinery",
				src: "/overdrive/art/environment/signal-trench-machinery-v1.webp",
				width: 1496,
				height: 141,
				hasAlpha: true,
				alphaCoverage: 0.55,
				sourceBounds: { x: 0, y: 233, width: 1536, height: 141 },
			},
			{
				role: "midground",
				src: "/overdrive/art/environment/signal-trench-midground-v1.webp",
				width: 1496,
				height: 151,
				hasAlpha: true,
				alphaCoverage: 0.8,
				sourceBounds: { x: 0, y: 388, width: 1536, height: 151 },
			},
			{
				role: "deck",
				src: "/overdrive/art/environment/signal-trench-deck-v1.webp",
				width: 1489,
				height: 129,
				hasAlpha: true,
				alphaCoverage: 0.72,
				sourceBounds: { x: 0, y: 540, width: 1536, height: 129 },
			},
			{
				role: "foreground",
				src: "/overdrive/art/environment/signal-trench-foreground-v1.webp",
				width: 1496,
				height: 166,
				hasAlpha: true,
				alphaCoverage: 0.68,
				sourceBounds: { x: 0, y: 681, width: 1536, height: 167 },
			},
			{
				role: "atmosphere",
				src: "/overdrive/art/environment/signal-trench-atmosphere-v1.webp",
				width: 748,
				height: 66,
				hasAlpha: true,
				alphaCoverage: 0.97,
				sourceBounds: { x: 0, y: 867, width: 1536, height: 133 },
			},
		],
		points: {
			sparks: [
				{ layer: "machinery", x: 0.22, y: 0.68 },
				{ layer: "machinery", x: 0.63, y: 0.54 },
			],
			cables: [
				{ layer: "midground", x: 0.15, y: 0.38 },
			],
			gates: [
				{ layer: "midground", x: 0.9, y: 0.58 },
				{ layer: "machinery", x: 0.52, y: 0.52 },
			],
			lights: [
				{ layer: "far", x: 0.42, y: 0.38 },
			],
		},
	}
}

describe("validateEnvironmentDefinition", () => {
	it("accepts a valid manifest", () => {
		const result = validateEnvironmentDefinition(makeValidManifest())
		expect(result.id).toBe("signal-trench-v1")
		expect(result.layers).toHaveLength(6)
	})

	it("requires all six layer roles", () => {
		const manifest = makeValidManifest()
		manifest.layers = manifest.layers.filter((l) => l.role !== "deck")
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"missing deck",
		)
	})

	it("rejects duplicate roles", () => {
		const manifest = makeValidManifest()
		manifest.layers.push({ ...manifest.layers[0] })
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"Duplicate environment layer",
		)
	})

	it("rejects points with x outside 0–1", () => {
		const manifest = makeValidManifest()
		manifest.points.sparks[0].x = 1.5
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"x must be between 0 and 1",
		)
	})

	it("rejects points with y outside 0–1", () => {
		const manifest = makeValidManifest()
		manifest.points.cables[0].y = -0.1
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"y must be between 0 and 1",
		)
	})

	it("rejects missing authored point arrays", () => {
		const manifest = makeValidManifest()
		const points = manifest.points as Partial<Record<string, unknown>>
		delete points["lights"]
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"missing lights",
		)
	})

	it("rejects layer with invalid alphaCoverage", () => {
		const manifest = makeValidManifest()
		manifest.layers[0].alphaCoverage = 1.5
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"invalid alphaCoverage",
		)
	})

	it("rejects layer with zero width", () => {
		const manifest = makeValidManifest()
		manifest.layers[0].width = 0
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"invalid width",
		)
	})

	it("requires manifest ID", () => {
		const manifest = makeValidManifest() as Partial<EnvironmentDefinition>
		manifest.id = ""
		expect(() => validateEnvironmentDefinition(manifest)).toThrow(
			"missing an ID",
		)
	})

	it("rejects non-object input", () => {
		expect(() => validateEnvironmentDefinition(null)).toThrow(
			"must be an object",
		)
	})
})

describe("SIGNAL_TRENCH_LAYER_ROLES", () => {
	it("contains exactly the six required roles in depth order", () => {
		expect(SIGNAL_TRENCH_LAYER_ROLES).toEqual([
			"far",
			"machinery",
			"midground",
			"deck",
			"foreground",
			"atmosphere",
		])
	})
})

describe("isEnvironmentLayerRole", () => {
	it("returns true for valid roles", () => {
		for (const role of SIGNAL_TRENCH_LAYER_ROLES) {
			expect(isEnvironmentLayerRole(role)).toBe(true)
		}
	})

	it("returns false for unknown strings", () => {
		expect(isEnvironmentLayerRole("sky")).toBe(false)
		expect(isEnvironmentLayerRole(0)).toBe(false)
		expect(isEnvironmentLayerRole(null)).toBe(false)
	})
})
