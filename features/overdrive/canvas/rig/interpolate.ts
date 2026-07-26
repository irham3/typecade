import type {
	RigKeyframe,
	RigTransform,
} from "./rig-definition"

const TRANSFORM_PROPERTIES = [
	"x",
	"y",
	"rotation",
	"scaleX",
	"scaleY",
	"alpha",
] as const

function clampUnit(value: number) {
	return Math.max(0, Math.min(1, value))
}

function applyEasing(
	value: number,
	easing: RigKeyframe["easing"] = "linear",
) {
	const progress = clampUnit(value)
	if (easing === "cubic-out") return 1 - (1 - progress) ** 3
	if (easing === "ease-out-back") {
		const back = 1.70158
		const shifted = progress - 1
		return 1 + (back + 1) * shifted ** 3 + back * shifted ** 2
	}
	return progress
}

function resolveKeyframe(
	keyframe: RigKeyframe,
	base: RigTransform,
): RigTransform {
	const resolved = { ...base }
	for (const property of TRANSFORM_PROPERTIES) {
		const value = keyframe[property]
		if (value !== undefined) resolved[property] = value
	}
	return resolved
}

function interpolateTransform(
	from: RigTransform,
	to: RigTransform,
	progress: number,
): RigTransform {
	return {
		x: from.x + (to.x - from.x) * progress,
		y: from.y + (to.y - from.y) * progress,
		rotation: from.rotation + (to.rotation - from.rotation) * progress,
		scaleX: from.scaleX + (to.scaleX - from.scaleX) * progress,
		scaleY: from.scaleY + (to.scaleY - from.scaleY) * progress,
		alpha: from.alpha + (to.alpha - from.alpha) * progress,
	}
}

export function sampleTrack(
	keyframes: readonly RigKeyframe[],
	atMs: number,
	base: RigTransform,
): RigTransform {
	if (keyframes.length === 0) return { ...base }
	const first = keyframes[0]
	const last = keyframes[keyframes.length - 1]
	if (atMs <= first.atMs) return resolveKeyframe(first, base)
	if (atMs >= last.atMs) return resolveKeyframe(last, base)

	for (let index = 1; index < keyframes.length; index += 1) {
		const next = keyframes[index]
		if (atMs > next.atMs) continue
		const previous = keyframes[index - 1]
		const duration = Math.max(1, next.atMs - previous.atMs)
		const progress = applyEasing(
			(atMs - previous.atMs) / duration,
			next.easing,
		)
		return interpolateTransform(
			resolveKeyframe(previous, base),
			resolveKeyframe(next, base),
			progress,
		)
	}

	return resolveKeyframe(last, base)
}
