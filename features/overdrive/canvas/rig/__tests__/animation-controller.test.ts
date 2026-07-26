import { describe, expect, it } from "vitest"
import { AnimationController } from "../animation-controller"
import type {
	AnimationClip,
	RigDefinition,
	RigTransform,
} from "../rig-definition"

const transform: RigTransform = {
	x: 0,
	y: 0,
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
	alpha: 1,
}

const clips: AnimationClip[] = [
	{
		name: "idle",
		durationMs: 1_200,
		loop: true,
		priority: 0,
		tracks: [],
	},
	{
		name: "chain-1",
		durationMs: 180,
		loop: false,
		priority: 1,
		contactMs: 90,
		recoveryStartMs: 90,
		tracks: [],
	},
	{
		name: "chain-2",
		durationMs: 180,
		loop: false,
		priority: 1,
		contactMs: 90,
		recoveryStartMs: 90,
		tracks: [],
	},
	{
		name: "execute",
		durationMs: 300,
		loop: false,
		priority: 3,
		contactMs: 120,
		recoveryStartMs: 220,
		tracks: [],
	},
	{
		name: "block",
		durationMs: 360,
		loop: false,
		priority: 4,
		contactMs: 120,
		recoveryStartMs: 280,
		tracks: [],
	},
]

const definition: RigDefinition = {
	id: "test",
	atlasUrl: "/test.json",
	defaultClip: "idle",
	parts: [{
		id: "root",
		texture: "root",
		pivot: { x: 0, y: 0 },
		defaultTransform: transform,
		zIndex: 0,
	}],
	clips: Object.fromEntries(clips.map((clip) => [clip.name, clip])),
}

describe("AnimationController", () => {
	it("rejects a lower-priority interruption before recovery", () => {
		const controller = new AnimationController(definition)
		expect(controller.play("execute")).toBe(true)
		controller.update(100)

		expect(controller.play("chain-1")).toBe(false)
		expect(controller.update(0).clip).toBe("execute")
	})

	it("accepts a chain interruption during recovery", () => {
		const controller = new AnimationController(definition)
		controller.play("execute")
		controller.update(240)

		expect(controller.play("chain-1")).toBe(true)
		expect(controller.update(0).clip).toBe("chain-1")
	})

	it("loops idle clips", () => {
		const controller = new AnimationController(definition)
		const frame = controller.update(1_300)

		expect(frame.clip).toBe("idle")
		expect(frame.localTimeMs).toBe(100)
	})

	it("keeps at most two pending contacts", () => {
		const controller = new AnimationController(definition)
		controller.play("block")

		controller.play("chain-1", { queueContact: true })
		controller.play("chain-2", { queueContact: true })
		controller.play("chain-1", { queueContact: true })

		expect(controller.pendingContactCount).toBe(2)
	})

	it("collapses recovery when fast input arrives", () => {
		const controller = new AnimationController(definition)
		controller.play("chain-1")
		controller.update(100)

		expect(controller.play("chain-2")).toBe(true)
		const frame = controller.update(0)
		expect(frame.clip).toBe("chain-2")
		expect(frame.localTimeMs).toBe(0)
	})

	it("exposes cadence state and preserves queued contact on a forced verb", () => {
		const controller = new AnimationController(definition)
		controller.play("block")
		controller.update(40)
		controller.play("chain-1", { queueContact: true })

		expect(controller.activeClipName).toBe("block")
		expect(controller.activeLocalTimeMs).toBe(40)
		expect(controller.pendingContactCount).toBe(1)

		controller.play("chain-2", {
			force: true,
			preservePendingContacts: true,
		})

		expect(controller.activeClipName).toBe("chain-2")
		expect(controller.activeLocalTimeMs).toBe(0)
		expect(controller.pendingContactCount).toBe(1)
	})
})
