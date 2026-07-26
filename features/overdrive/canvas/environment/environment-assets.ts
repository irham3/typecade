import {
	Assets,
	Texture,
} from "pixi.js"
import {
	SIGNAL_TRENCH_MANIFEST_URL,
	validateEnvironmentDefinition,
	type EnvironmentDefinition,
	type EnvironmentLayerRole,
} from "./environment-definition"

export type LoadedEnvironmentAssets = {
	definition: EnvironmentDefinition
	textures: Record<EnvironmentLayerRole, Texture>
	fallback: boolean
}

let environmentPromise: Promise<LoadedEnvironmentAssets> | null = null

async function loadSignalTrenchEnvironment(): Promise<LoadedEnvironmentAssets> {
	const response = await fetch(SIGNAL_TRENCH_MANIFEST_URL)
	if (!response.ok) {
		throw new Error(
			`Unable to load ${SIGNAL_TRENCH_MANIFEST_URL}: ${response.status}`,
		)
	}
	const definition = validateEnvironmentDefinition(await response.json())

	const textureEntries = await Promise.all(
		definition.layers.map(async (layer) => {
			const texture = await Assets.load<Texture>(layer.src)
			return [layer.role, texture] as const
		}),
	)

	return {
		definition,
		textures: Object.fromEntries(
			textureEntries,
		) as Record<EnvironmentLayerRole, Texture>,
		fallback: false,
	}
}

export function loadEnvironmentAssets(): Promise<LoadedEnvironmentAssets> {
	if (!environmentPromise) {
		environmentPromise = loadSignalTrenchEnvironment()
		environmentPromise.catch(() => {
			environmentPromise = null
		})
	}
	return environmentPromise
}

export function resetEnvironmentCache(): void {
	environmentPromise = null
}
