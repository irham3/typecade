import type { NormalizedEnvironmentPoint } from "../environment/environment-definition"
import type { EnvironmentDirector } from "../environment/environment-director"

export type EnvironmentLayout = {
	deckY: number
	scale: number
	width: number
	height: number
}

export function computeFormationLayout(
	director: EnvironmentDirector,
	width: number,
	height: number,
): EnvironmentLayout {
	// For MVP, we derive a synthetic deck layout matching parallax proportions.
	// Since EnvironmentDirector owns the layout, we approximate scale by checking height.
	const scale = Math.max(width / 1536, height / 768)
	return {
		deckY: height * 0.55,
		scale,
		width,
		height,
	}
}

export function getGateWorldPoint(
	gateIndex: number,
	layout: EnvironmentLayout,
	points: NormalizedEnvironmentPoint[],
): { x: number; y: number } {
	const point = points[gateIndex % Math.max(1, points.length)]
	if (!point) return { x: layout.width * 0.5, y: layout.deckY }
	return {
		x: point.x * layout.width,
		y: point.y * layout.height,
	}
}
