import { describe, expect, it } from "vitest"
import { AnimationController } from "../animation-controller"
import type {
	AnimationClipName,
	AnimationFrameState,
	RigDefinition,
	RigTransform,
} from "../rig-definition"
import {
	NEEDLE_RIG,
	NULL_RIG,
	PACKET_RIG,
	WARDEN_RIG,
} from "../rig-manifests"

type Matrix = {
	a: number
	b: number
	c: number
	d: number
	tx: number
	ty: number
}

const groundedClips = [
	"cannon-burst",
	"rail-step",
	"tether-pull",
	"breach-slide",
	"crossfire-pivot",
	"execution",
] as const

function localMatrix(transform: RigTransform): Matrix {
	const cosine = Math.cos(transform.rotation)
	const sine = Math.sin(transform.rotation)
	return {
		a: cosine * transform.scaleX,
		b: sine * transform.scaleX,
		c: -sine * transform.scaleY,
		d: cosine * transform.scaleY,
		tx: transform.x,
		ty: transform.y,
	}
}

function compose(parent: Matrix, local: Matrix): Matrix {
	return {
		a: parent.a * local.a + parent.c * local.b,
		b: parent.b * local.a + parent.d * local.b,
		c: parent.a * local.c + parent.c * local.d,
		d: parent.b * local.c + parent.d * local.d,
		tx: parent.a * local.tx + parent.c * local.ty + parent.tx,
		ty: parent.b * local.tx + parent.d * local.ty + parent.ty,
	}
}

function worldMatrix(
	definition: RigDefinition,
	frame: AnimationFrameState,
	partId: string,
	cache = new Map<string, Matrix>(),
): Matrix {
	const cached = cache.get(partId)
	if (cached) return cached
	const part = definition.parts.find((candidate) => candidate.id === partId)
	if (!part) throw new Error(`Missing rig part ${partId}`)
	const local = localMatrix(frame.transforms[partId])
	const world = part.parentId
		? compose(worldMatrix(definition, frame, part.parentId, cache), local)
		: local
	cache.set(partId, world)
	return world
}

function sampledFrames(name: AnimationClipName) {
	const clip = WARDEN_RIG.clips[name]
	if (!clip) throw new Error(`Missing clip ${name}`)
	const controller = new AnimationController(WARDEN_RIG)
	expect(controller.play(name, { force: true })).toBe(true)
	const frames: AnimationFrameState[] = [controller.update(0)]
	for (let elapsed = 16; elapsed < clip.durationMs; elapsed += 16) {
		frames.push(controller.update(16))
	}
	frames.push(controller.update(clip.durationMs % 16 || 16))
	return { clip, frames }
}

describe("grounded Warden motion", () => {
	const idleFrame = new AnimationController(WARDEN_RIG).update(0)
	const groundY = Math.max(
		worldMatrix(WARDEN_RIG, idleFrame, "near_foot").ty,
		worldMatrix(WARDEN_RIG, idleFrame, "far_foot").ty,
	)

	it.each(groundedClips)("%s keeps a planted foot and valid recovery", (name) => {
		const { clip, frames } = sampledFrames(name)
		expect(frames.some((frame) => frame.contactEdge)).toBe(true)
		expect(clip.contactMs).toBeGreaterThan(0)
		expect(clip.contactMs).toBeLessThan(clip.durationMs)

		for (const frame of frames) {
			for (const transform of Object.values(frame.transforms)) {
				expect(Object.values(transform).every(Number.isFinite)).toBe(true)
			}
			const nearY = worldMatrix(WARDEN_RIG, frame, "near_foot").ty
			const farY = worldMatrix(WARDEN_RIG, frame, "far_foot").ty
			expect(Math.min(
				Math.abs(nearY - groundY),
				Math.abs(farY - groundY),
			)).toBeLessThanOrEqual(4)
		}

		const recovery = frames.at(-1)
		expect(recovery?.transforms.torso.x).toBe(0)
		expect(recovery?.transforms.torso.y).toBe(0)
	})

	it("recoil-vault contains one airborne interval and one landing", () => {
		const { frames } = sampledFrames("recoil-vault")
		let airborneIntervals = 0
		let airborne = false

		for (const frame of frames) {
			const nextAirborne = frame.transforms.torso.y < -4
			if (nextAirborne && !airborne) airborneIntervals += 1
			airborne = nextAirborne
		}

		expect(airborneIntervals).toBe(1)
		expect(frames.at(-1)?.transforms.torso.y).toBe(0)
	})
})

describe("enemy family variants", () => {
	it.each([
		[
			PACKET_RIG,
			["packet-stalker", "cache-hound", "relay-ram"],
		],
		[
			NEEDLE_RIG,
			["needle-wraith", "vector-mantis", "spine-courier"],
		],
		[
			NULL_RIG,
			["null-crown", "crown-hand", "void-shard"],
		],
	] as const)("$id exposes three valid silhouettes", (rig, expectedIds) => {
		expect(rig.variants?.map((variant) => variant.id)).toEqual(expectedIds)
		const partIds = new Set(rig.parts.map((part) => part.id))
		for (const variant of rig.variants ?? []) {
			expect(variant.enabledPartIds.length).toBeGreaterThan(0)
			expect(variant.enabledPartIds.every((partId) => partIds.has(partId))).toBe(true)
			expect(variant.baseScale).toBeGreaterThan(0)
		}
	})
})
