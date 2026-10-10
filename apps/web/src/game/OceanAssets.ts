import { NearestFilter, SRGBColorSpace, Texture, TextureLoader } from "three"

export const fishStates = ["idle", "swim", "bite", "struggle", "stunned", "caught", "escape"] as const
export type FishVisualState = typeof fishStates[number]
export const gobyFrames: Record<FishVisualState, number> = { idle: 4, swim: 6, bite: 4, struggle: 6, stunned: 4, caught: 4, escape: 6 }
export interface AtlasFrame { frame: { x: number; y: number; w: number; h: number } }

/** One atlas on the GPU; meshes select their frame through UVs, without cloning textures. */
export class OceanAssets {
	readonly textures = new Map<string, Texture>()
	frames: Record<string, AtlasFrame> = {}

	async load(): Promise<void> {
		const loader = new TextureLoader()
		const images = [
			["atlas", "/assets/ocean/atlases/atlas_ocean.png"],
			["backdrop", "/assets/ocean/backgrounds/bg_shallow_coast_cutaway.webp"],
			...fishStates.map(state => [state, `/assets/ocean/concepts/fish-catalog-v2/animation-sets/pebble-goby/pebble_goby_${state}_${gobyFrames[state]}f.png`]),
		]
		// Settle every request before cleanup: a late texture cannot leak after another request fails.
		const results = await Promise.allSettled([
			fetch("/assets/ocean/atlases/atlas_ocean.json").then(async response => {
				if (!response.ok) throw new Error(`Ocean atlas: HTTP ${response.status}`)
				const data = await response.json() as { frames: Record<string, AtlasFrame> }
				this.frames = data.frames
			}),
			...images.map(async ([key, url]) => {
				const texture = await loader.loadAsync(url)
				texture.magFilter = texture.minFilter = NearestFilter
				texture.generateMipmaps = false
				texture.colorSpace = SRGBColorSpace
				this.textures.set(key, texture)
			}),
		])
		const error = results.find(result => result.status === "rejected")
		if (error?.status === "rejected") {
			this.dispose()
			throw error.reason
		}
	}

	dispose(): void {
		this.textures.forEach(texture => texture.dispose())
		this.textures.clear()
	}
}
