import { afterEach, describe, expect, it, vi } from "vitest"
import { Box3, Group, InstancedMesh, Line, Mesh, MeshBasicMaterial, PlaneGeometry, ShaderMaterial } from "three"
import { fishSpecies, getFish, fishingSkills } from "@typecade/content"
import { startEncounter, resolveCatchResult } from "@typecade/game-rules"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { createFishingGame } from "./createFishingGame"
import { OceanAssets } from "./OceanAssets"
import { surfaceY } from "./ocean-motion"

type PixelMesh = Mesh<PlaneGeometry, MeshBasicMaterial>
interface Inspection {
	tick(time: number): void; resize(): void; updateWorld(delta: number): void
	time: number; endTime: number; stateUntil: number; fishState: string
	boat: PixelMesh; fish: Group; fishBody: PixelMesh; fishTail: PixelMesh; eyelid: PixelMesh; eyeLine: PixelMesh; gill: PixelMesh
	line: Line; lure: PixelMesh; water: Mesh<PlaneGeometry, ShaderMaterial>
	pool: Array<{ x: number; y: number; life: number; bubble: boolean }>
	rings: Array<{ life: number }>; particles: InstancedMesh
}
const metrics = { wpm: 40, rawWpm: 40, accuracy: 100, combo: 1, maxCombo: 1, consistency: 100, correctKeystrokes: 5, incorrectKeystrokes: 0, progress: 1, elapsedMs: 1500 }
let game: ReturnType<typeof createFishingGame> | undefined
let host: HTMLDivElement | undefined
afterEach(() => { game?.destroy(); host?.remove(); vi.restoreAllMocks(); game = undefined })

async function setup(bridge = new GameEventBridge()) {
	host = document.createElement("div")
	host.style.cssText = "width:1366px;height:768px;position:fixed;inset:0"
	document.body.append(host)
	game = createFishingGame(host, bridge)
	await game.ready
	await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
	game.renderer.setAnimationLoop(null)
	const view = game as unknown as Inspection
	return { bridge, view, game, host }
}
function encounter(bridge: GameEventBridge, fish = fishSpecies[0]) {
	const state = startEncounter(fish, "three-renderer-tests", [])
	bridge.emit("encounter:started", { encounter: state, fish, targetText: "ombak" })
	return state
}

describe("Three.js ocean renderer with a real WebGL context", () => {
	it("replays state before assets load, compiles shaders and renders a nonblank ocean", async () => {
		const bridge = new GameEventBridge()
		bridge.emit("screen:changed", { screen: "game" }); bridge.emit("game:paused", { paused: false })
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("settings:volumes", { music: 0, typing: 0, gameplay: 0, environment: 0 })
		encounter(bridge)
		const { game, view } = await setup(bridge)
		view.tick(100); view.tick(116)
		expect(view.fish.visible).toBe(true)
		const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 64
		const context = canvas.getContext("2d")!
		context.drawImage(game.renderer.domElement, 0, 0, 64, 64)
		const pixels = context.getImageData(0, 0, 64, 64).data
		expect(pixels.some((value, index) => index % 4 !== 3 && value > 80)).toBe(true)
		expect(game.renderer.info.render.calls).toBeGreaterThan(5)
		expect(game.renderer.domElement.style.imageRendering).toBe("pixelated")
	})
	it("keeps every fish underwater, animates eyes and tails, and anchors the hull to its wave", async () => {
		const { bridge, view, host } = await setup()
		bridge.emit("screen:changed", { screen: "game" }); bridge.emit("game:paused", { paused: false })
		for (const [width, height] of [[1366, 768], [390, 844], [320, 640]]) {
			host.style.width = `${width}px`; host.style.height = `${height}px`; view.resize()
			for (const fish of fishSpecies) {
				encounter(bridge, fish)
				for (const t of [.2, .8, 2]) {
					view.time = t; view.updateWorld(.016)
					const box = new Box3().setFromObject(view.fish)
					expect(-box.max.y).toBeGreaterThan(height * .3 + 2)
					expect(-box.min.y).toBeLessThan(height * (width <= 640 ? .38 : .46))
					const hullY = -view.boat.position.y + view.boat.scale.y * .18
					expect(hullY).toBeCloseTo(surfaceY(view.boat.position.x, width, height, t, false))
				}
				// Blink landmarks have a fixed phase for each species.
				let sawBlink = false
				for (let t = 0; t < 4; t += .05) { view.time = t; view.updateWorld(0); sawBlink ||= view.eyelid.visible }
				expect(sawBlink).toBe(true)
				bridge.emit("settings:effects", { reducedMotion: true })
				view.time = 5; view.updateWorld(0)
				expect(view.eyelid.visible).toBe(false); expect(view.fishTail.rotation.y).toBe(0); expect(view.boat.rotation.z).toBe(0)
				bridge.emit("settings:effects", { reducedMotion: false })
			}
		}
	})
	it("freezes world and effects on pause, colors line danger and delivers every domain effect", async () => {
		const { bridge, view, game } = await setup()
		bridge.emit("screen:changed", { screen: "game" }); bridge.emit("game:paused", { paused: false })
		window.dispatchEvent(new Event("pointerdown")); window.dispatchEvent(new Event("keydown"))
		encounter(bridge, getFish("crown_leviathan"))
		view.tick(100); view.tick(140)
		bridge.emit("fish:hooked", { fish: fishSpecies[0] })
		bridge.emit("character:correct", { key: "a", expected: "a", combo: 1, progress: .1 })
		bridge.emit("character:correct", { key: "b", expected: "b", combo: 2, progress: .2 })
		for (const [perfect, combo] of [[true, 5], [false, 0], [true, 1]] as const) bridge.emit("word:completed", { word: "air", perfect, combo })
		for (const ignoredBySteelLine of [false, true]) {
			bridge.emit("typo:occurred", { key: "x", expected: "a", ignoredBySteelLine }); view.updateWorld(.016)
			expect(view.fishState).toBe(ignoredBySteelLine ? "stunned" : "struggle")
		}
		for (const [tension, durability, expected] of [[90, 100, 0xf05a5e], [90, 100, 0xf05a5e], [60, 100, 0xf5c240], [28, 20, 0xf05a5e], [28, 100, 0xe7fbff]]) {
			bridge.emit("line:changed", { tension, durability, progress: .5, timeRemainingMs: 1000 }); view.updateWorld(.016)
			expect((view.line.material as MeshBasicMaterial).color.getHex()).toBe(expected)
		}
		bridge.emit("phase:changed", { phase: 2 }); bridge.emit("phase:changed", { phase: 3 })
		bridge.emit("boss:guard-broken", { tensionRelief: 15 }); bridge.emit("boss:final-pull", { tensionRelief: 15 })
		for (const skill of fishingSkills) bridge.emit("skill:used", { skillId: skill.id, label: skill.name })
		bridge.emit("level:up", { fromLevel: 1, toLevel: 2, xp: 100 })
		bridge.emit("audio:play", { key: "sfx_splash_a", category: "gameplay" })
		expect(view.pool.filter(p => p.life > 0).length).toBeLessThanOrEqual(128)
		expect(view.rings.filter(r => r.life > 0)).toHaveLength(6)
		const before = view.time, position = view.fish.position.clone()
		bridge.emit("game:paused", { paused: true }); view.tick(300); view.tick(340)
		expect(view.time).toBe(before); expect(view.fish.position).toEqual(position)
		bridge.emit("screen:changed", { screen: "prep" }); expect(view.fish.visible).toBe(false)
		bridge.emit("screen:changed", { screen: "game" }); bridge.emit("game:paused", { paused: false })
		const render = vi.spyOn(game.renderer, "render")
		vi.spyOn(document, "hidden", "get").mockReturnValue(true)
		document.dispatchEvent(new Event("visibilitychange")); view.tick(400)
		expect(render).not.toHaveBeenCalled()
		vi.restoreAllMocks(); document.dispatchEvent(new Event("visibilitychange")); view.tick(500)
		view.pool[0].y = 0; view.pool[0].life = .5; view.pool[0].bubble = true
		view.pool[1].life = .5; view.pool[1].bubble = false
		view.updateWorld(.02); expect(view.pool[0].life).toBe(0)
		view.updateWorld(2); expect(view.pool.every(p => p.life === 0)).toBe(true)
	})
	it("finishes catch and escape animations, resets for the next encounter and cleans GPU resources", async () => {
		const { bridge, view, game, host } = await setup()
		bridge.emit("screen:changed", { screen: "game" }); bridge.emit("game:paused", { paused: false })
		const geometryDisposals: number[] = []
		game.scene.traverse(object => { if (object instanceof Mesh || object instanceof Line) object.geometry.addEventListener("dispose", () => geometryDisposals.push(1)) })
		for (const reducedMotion of [false, true]) for (const fish of [fishSpecies[0], getFish("reef_shark")]) for (const caught of [true, false]) {
			bridge.emit("settings:effects", { reducedMotion }); const state = encounter(bridge, fish)
			view.time += 1; view.updateWorld(.016)
			const x = view.fish.position.x
			bridge.emit("catch:resolved", { result: resolveCatchResult({ ...state, status: caught ? "caught" : "escaped" }, fish, metrics) })
			view.tick(1000); view.tick(1016); view.tick(1116)
			view.time += 1; view.updateWorld(1)
			// End pose stays terminal; events cannot change it back into idle swimming.
			expect(view.fishBody.material.opacity).toBe(0)
			expect(caught ? view.fish.position.x < x : view.fish.position.x > 1366).toBe(true)
			encounter(bridge, fish); expect(view.fishBody.material.opacity).toBe(1)
		}
		host.style.width = "0px"; host.style.height = "0px"; view.resize()
		expect(game.renderer.domElement.width).toBe(1)
		game.destroy(); game.destroy(); view.tick(5000)
		expect(geometryDisposals.length).toBeGreaterThan(10); expect(host.querySelector("canvas")).toBeNull()
		bridge.emit("screen:changed", { screen: "game" })
	})
	it("handles context loss and interrupted or failed asset loading without leaked canvases", async () => {
		const run = await setup()
		const failed = vi.fn(); run.host.addEventListener("renderer:error", failed)
		run.game.renderer.domElement.dispatchEvent(new Event("webglcontextlost", { cancelable: true }))
		run.view.tick(100); expect(failed).toHaveBeenCalledOnce(); run.game.destroy()
		let release!: () => void
		const realLoad = OceanAssets.prototype.load
		vi.spyOn(OceanAssets.prototype, "load").mockImplementation(async function(this: OceanAssets) { await new Promise<void>(resolve => { release = resolve }); await realLoad.call(this) })
		game = createFishingGame(run.host, run.bridge); game.destroy(); release(); await game.ready
		expect(run.host.querySelector("canvas")).toBeNull()
		vi.restoreAllMocks()
		vi.spyOn(OceanAssets.prototype, "load").mockRejectedValue(new Error("offline"))
		game = createFishingGame(run.host, run.bridge)
		await expect(game.ready).rejects.toThrow("offline"); expect(run.host.querySelector("canvas")).toBeNull()
	})
})
