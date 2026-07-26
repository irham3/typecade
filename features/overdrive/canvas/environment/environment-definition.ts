export const SIGNAL_TRENCH_MANIFEST_URL =
	"/overdrive/art/environment/signal-trench-kit-v1.json"

export const SIGNAL_TRENCH_LAYER_ROLES = [
	"far",
	"machinery",
	"midground",
	"deck",
	"foreground",
	"atmosphere",
] as const

export type EnvironmentLayerRole =
	(typeof SIGNAL_TRENCH_LAYER_ROLES)[number]

export type EnvironmentPointRole =
	| "sparks"
	| "cables"
	| "gates"
	| "lights"

export type NormalizedEnvironmentPoint = {
	layer: EnvironmentLayerRole
	x: number
	y: number
}

export type EnvironmentLayerDefinition = {
	role: EnvironmentLayerRole
	src: string
	width: number
	height: number
	hasAlpha: boolean
	alphaCoverage: number
	sourceBounds: {
		x: number
		y: number
		width: number
		height: number
	}
}

export type EnvironmentDefinition = {
	id: string
	source: string
	layers: EnvironmentLayerDefinition[]
	points: Record<EnvironmentPointRole, NormalizedEnvironmentPoint[]>
}

export function isEnvironmentLayerRole(
	value: unknown,
): value is EnvironmentLayerRole {
	return (
		typeof value === "string"
		&& (SIGNAL_TRENCH_LAYER_ROLES as readonly string[]).includes(value)
	)
}

function finite(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value)
}

function assertNormalizedPoint(
	value: unknown,
	label: string,
): asserts value is NormalizedEnvironmentPoint {
	if (!value || typeof value !== "object") {
		throw new Error(`${label} must be an object`)
	}
	const point = value as Partial<NormalizedEnvironmentPoint>
	if (!isEnvironmentLayerRole(point.layer)) {
		throw new Error(`${label} has an invalid layer`)
	}
	if (!finite(point.x) || point.x < 0 || point.x > 1) {
		throw new Error(`${label}.x must be between 0 and 1`)
	}
	if (!finite(point.y) || point.y < 0 || point.y > 1) {
		throw new Error(`${label}.y must be between 0 and 1`)
	}
}

export function validateEnvironmentDefinition(
	value: unknown,
): EnvironmentDefinition {
	if (!value || typeof value !== "object") {
		throw new Error("Environment manifest must be an object")
	}
	const manifest = value as Partial<EnvironmentDefinition>

	if (
		typeof manifest.id !== "string"
		|| manifest.id.length === 0
	) {
		throw new Error("Environment manifest is missing an ID")
	}

	if (
		typeof manifest.source !== "string"
		|| manifest.source.length === 0
	) {
		throw new Error("Environment manifest is missing its source")
	}

	if (!Array.isArray(manifest.layers)) {
		throw new Error("Environment manifest is missing layers")
	}

	const roles = new Set<EnvironmentLayerRole>()
	for (const [index, candidate] of manifest.layers.entries()) {
		if (!candidate || typeof candidate !== "object") {
			throw new Error(`Environment layer ${index} is invalid`)
		}
		const layer = candidate as Partial<EnvironmentLayerDefinition>
		if (!isEnvironmentLayerRole(layer.role)) {
			throw new Error(`Environment layer ${index} has an invalid role`)
		}
		if (roles.has(layer.role)) {
			throw new Error(`Duplicate environment layer: ${layer.role}`)
		}
		roles.add(layer.role)
		if (typeof layer.src !== "string" || layer.src.length === 0) {
			throw new Error(`Environment layer ${layer.role} is missing src`)
		}
		if (!finite(layer.width) || layer.width <= 0) {
			throw new Error(`Environment layer ${layer.role} has invalid width`)
		}
		if (!finite(layer.height) || layer.height <= 0) {
			throw new Error(`Environment layer ${layer.role} has invalid height`)
		}
		if (
			!finite(layer.alphaCoverage)
			|| layer.alphaCoverage < 0
			|| layer.alphaCoverage > 1
		) {
			throw new Error(
				`Environment layer ${layer.role} has invalid alphaCoverage`,
			)
		}
	}

	for (const role of SIGNAL_TRENCH_LAYER_ROLES) {
		if (!roles.has(role)) {
			throw new Error(`Environment manifest is missing ${role}`)
		}
	}

	if (!manifest.points || typeof manifest.points !== "object") {
		throw new Error("Environment manifest is missing authored points")
	}

	const pointRoles: EnvironmentPointRole[] = [
		"sparks",
		"cables",
		"gates",
		"lights",
	]
	for (const pointRole of pointRoles) {
		const points = manifest.points[pointRole]
		if (!Array.isArray(points)) {
			throw new Error(`Environment points are missing ${pointRole}`)
		}
		for (const [index, point] of points.entries()) {
			assertNormalizedPoint(
				point,
				`points.${pointRole}[${index}]`,
			)
		}
	}

	return manifest as EnvironmentDefinition
}
