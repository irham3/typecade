import { afterEach, describe, expect, it, vi } from "vitest"
import { NearestFilter, SRGBColorSpace, Texture, TextureLoader } from "three"
import { OceanAssets } from "./OceanAssets"

afterEach(() => vi.restoreAllMocks())
describe("ocean atlas loading", () => {
	it("loads nine shared textures with sharp sampling and releases them", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ frames: { test: { frame: { x: 0, y: 0, w: 128, h: 96 } } } })))
		vi.spyOn(TextureLoader.prototype, "loadAsync").mockImplementation(async () => new Texture())
		const assets = new OceanAssets(); await assets.load()
		expect(assets.textures.size).toBe(9); expect(assets.frames.test.frame.w).toBe(128)
		let disposed = 0
		assets.textures.forEach(texture => {
			expect(texture.magFilter).toBe(NearestFilter); expect(texture.generateMipmaps).toBe(false); expect(texture.colorSpace).toBe(SRGBColorSpace)
			texture.addEventListener("dispose", () => { disposed++ })
		})
		assets.dispose(); assets.dispose(); expect(disposed).toBe(9); expect(assets.textures.size).toBe(0)
	})
	it("waits for late textures before cleaning up HTTP, JSON, or image failure", async () => {
		for (const failure of ["http", "json", "image"]) {
			let disposed = 0
			vi.spyOn(globalThis, "fetch").mockResolvedValue(failure === "http" ? new Response("missing", { status: 404 }) : new Response(failure === "json" ? "bad" : '{"frames":{}}'))
			vi.spyOn(TextureLoader.prototype, "loadAsync").mockImplementation(async url => {
				if (failure === "image" && url.includes("atlas_ocean")) throw new Error("image offline")
				await new Promise(resolve => setTimeout(resolve, 1))
				const texture = new Texture<HTMLImageElement>(); texture.addEventListener("dispose", () => { disposed++ }); return texture
			})
			const assets = new OceanAssets(); await expect(assets.load()).rejects.toThrow()
			 expect(disposed).toBe(failure === "image" ? 8 : 9); expect(assets.textures.size).toBe(0)
		}
	})
})
