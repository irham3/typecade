import { describe, expect, it } from "vitest"
import { reactionForVerb } from "../rig-reaction"
import { resolveRigSocket } from "../rig-sockets"
import type { RigDefinition } from "../rig-definition"

const definition: RigDefinition = {
	id: "test",
	atlasUrl: "",
	defaultClip: "idle",
	parts: [{
		id: "cannon_barrel",
		texture: "cannon_barrel",
		pivot: { x: 0, y: 0 },
		defaultTransform: { x: 4, y: 8, rotation: 0.1, scaleX: 1, scaleY: 1, alpha: 1 },
		zIndex: 1,
	}],
	clips: {},
	sockets: {
		impact: { partId: "cannon_barrel", x: 12, y: 3, rotation: 0.2 },
	},
}

describe("rig reactions", () => {
	it("uses distinct clips for lock, dash, chain, ready, and misfire", () => {
		const clips = [
			reactionForVerb("signal-lock", "warmup", 0).clip,
			reactionForVerb("arc-dash", "rush", 0).clip,
			reactionForVerb("chain-strike", "rush", 8).clip,
			reactionForVerb("execution-ready", "glitch", 8).clip,
			reactionForVerb("misfire", "glitch", 8).clip,
		]
		expect(new Set(clips).size).toBe(5)
	})

	it("keeps reaction selection deterministic and readable at combo tiers", () => {
		const first = reactionForVerb("chain-strike", "rush", 10)
		const second = reactionForVerb("chain-strike", "rush", 10)
		expect(first).toEqual(second)
		expect(first.recoilX).toBeGreaterThan(0)
	})

	it("resolves explicit sockets and falls back to a valid part", () => {
		expect(resolveRigSocket(definition, "impact")).toMatchObject({ x: 12, y: 3, fallback: false })
		expect(resolveRigSocket(definition, "missing")).toMatchObject({ partId: "cannon_barrel", fallback: true })
	})
})
