import { afterEach, describe, expect, it, vi } from "vitest"
import { fishSpecies, getFish } from "@typecade/content"
import { resolveCatchResult, startEncounter } from "@typecade/game-rules"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { createFishingGame } from "./createFishingGame"

describe("FishingScene in Chromium", () => {
	let game: ReturnType<typeof createFishingGame> | undefined
	let host: HTMLDivElement | undefined

	afterEach(() => {
		game?.scene.getScene("FishingScene").events.emit("shutdown")
		game?.destroy(true)
		game = undefined
		host?.remove()
		host = undefined
	})

	it("renders the coast and responds to a complete boss encounter event stream", async () => {
		const assetResponse = await fetch("/assets/ocean/atlases/atlas_ocean.json")
		expect(assetResponse.status).toBe(200)
		host = document.createElement("div")
		host.style.cssText = "position:fixed;inset:0;width:1280px;height:720px"
		document.body.append(host)
		const bridge = new GameEventBridge()
		game = createFishingGame(host, bridge)
		await vi.waitFor(() => expect(host?.querySelector("canvas")).not.toBeNull(), { timeout: 10000 })
		await vi.waitFor(() => expect(game?.scene.isActive("FishingScene")).toBe(true), { timeout: 10000 })
		const phaserScene = game.scene.getScene("FishingScene")
		expect(phaserScene.children.list.some((child) => (child as { texture?: { key: string } }).texture?.key === "bg_gameplay_ai")).toBe(true)
		const loadError = vi.spyOn(console, "error").mockImplementation(() => undefined)
		phaserScene.load.emit("loaderror", { key: "missing-test-asset", src: "/missing.webp" })
		expect(loadError).toHaveBeenCalledWith("[typecade] asset load failed", "missing-test-asset", "/missing.webp")
		const openingFish = getFish("crown_leviathan")
		const quietFish = getFish("reef_minnow")
		bridge.emit("encounter:started", { encounter: startEncounter(openingFish, "scene-before-audio", []), fish: openingFish, targetText: "arus" })
		bridge.emit("encounter:started", { encounter: startEncounter(quietFish, "scene-before-audio-common", []), fish: quietFish, targetText: "laut" })
		phaserScene.input.emit("pointerdown")
		phaserScene.input.keyboard?.emit("keydown")
		const audio = phaserScene as unknown as { ambientLoop?: { volume?: number; setVolume?: (value: number) => void } }
		if (audio.ambientLoop) {
			let fallbackVolume = 1
			Object.defineProperty(audio.ambientLoop, "setVolume", { configurable: true, value: undefined })
			Object.defineProperty(audio.ambientLoop, "volume", { configurable: true, get: () => fallbackVolume, set: (value: number) => { fallbackVolume = value } })
			bridge.emit("settings:volumes", { music: 0.25, environment: 0.3, gameplay: 0.4, typing: 0.5 })
			expect(fallbackVolume).toBe(0.3)
		}

		const fish = getFish("crown_leviathan")
		const encounter = startEncounter(fish, "scene-smoke", [])
		bridge.emit("settings:volumes", { music: 0, environment: 0.2, gameplay: 0.4, typing: 0.6 })
		bridge.emit("settings:effects", { reducedMotion: true })
		bridge.emit("screen:changed", { screen: "game" })
		bridge.emit("game:paused", { paused: false })
		bridge.emit("encounter:started", { encounter, fish, targetText: "arus" })
		bridge.emit("fish:hooked", { fish })
		bridge.emit("character:correct", { key: "a", expected: "a", progress: 0.1, combo: 5 })
		bridge.emit("character:correct", { key: "r", expected: "r", progress: 0.2, combo: 6 })
		bridge.emit("word:completed", { word: "arus", perfect: true, combo: 5 })
		bridge.emit("word:completed", { word: "arus", perfect: false, combo: 0 })
		bridge.emit("typo:occurred", { key: "x", expected: "a", ignoredBySteelLine: true })
		bridge.emit("typo:occurred", { key: "x", expected: "a", ignoredBySteelLine: false })
		bridge.emit("line:changed", { tension: 88, durability: 32, progress: 0.5, timeRemainingMs: 1000 })
		bridge.emit("line:changed", { tension: 50, durability: 45, progress: 0.6, timeRemainingMs: 800 })
		bridge.emit("phase:changed", { phase: 2 })
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("phase:changed", { phase: 3 })
		await new Promise((resolve) => window.setTimeout(resolve, 70))
		bridge.emit("character:correct", { key: "u", expected: "u", progress: 0.3, combo: 2 })
		bridge.emit("character:correct", { key: "s", expected: "s", progress: 0.4, combo: 3 })
		bridge.emit("boss:guard-broken", { bonusProgress: 0.08 })
		bridge.emit("boss:final-pull", { bonusProgress: 0.1 })
		for (const skillId of ["cast_net", "calm_current", "sonar", "steel_line", "perfect_bait", "reel_mastery", "unknown"]) bridge.emit("skill:used", { skillId, label: skillId })
		bridge.emit("audio:play", { key: "sfx_correct_tick_a", category: "typing" })
		bridge.emit("audio:play", { key: "missing-sound", category: "typing" })
		bridge.emit("level:up", { fromLevel: 1, toLevel: 2, xp: 90 })
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "caught" }, fish, { wpm: 50, rawWpm: 55, accuracy: 98, combo: 8, maxCombo: 8, consistency: 90, correctKeystrokes: 80, incorrectKeystrokes: 2, progress: 1, elapsedMs: 10000 }, 1) })
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "escaped" }, fish, { wpm: 0, rawWpm: 0, accuracy: 0, combo: 0, maxCombo: 0, consistency: 0, correctKeystrokes: 0, incorrectKeystrokes: 1, progress: 0, elapsedMs: 10000 }, 1) })
		const commonFish = getFish("reef_minnow")
		bridge.emit("encounter:started", { encounter: startEncounter(commonFish, "scene-common", []), fish: commonFish, targetText: "laut" })
		bridge.emit("screen:changed", { screen: "game" })
		bridge.emit("game:paused", { paused: false })
		for (const [index, species] of fishSpecies.entries()) {
			bridge.emit("encounter:started", { encounter: startEncounter(species, `scene-${species.id}`, []), fish: species, targetText: "laut" })
			bridge.emit("line:changed", { tension: index % 2 ? 90 : 20, durability: index % 2 ? 28 : 100, progress: index / fishSpecies.length, timeRemainingMs: 1000 })
			bridge.emit("word:completed", { word: "laut", perfect: index % 2 === 0, combo: index * 5 })
			sceneUpdate(game, index * 900 + 2500)
		}
		bridge.emit("screen:changed", { screen: "race" })
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("screen:changed", { screen: "prep" })
		bridge.emit("screen:changed", { screen: "menu" })
		sceneUpdate(game, 1500)
		bridge.emit("game:paused", { paused: true })
		phaserScene.scene.restart({ bridge })
		await vi.waitFor(() => expect(game?.scene.isActive("FishingScene")).toBe(true), { timeout: 10000 })
		bridge.emit("screen:changed", { screen: "game" })
		bridge.emit("game:paused", { paused: false })
		phaserScene.input.emit("pointerdown")
		bridge.emit("encounter:started", { encounter: startEncounter(commonFish, "scene-restarted", []), fish: commonFish, targetText: "laut" })
		bridge.emit("skill:used", { skillId: "calm_current", label: "Calm Current" })
		bridge.emit("skill:used", { skillId: "sonar", label: "Sonar" })
		bridge.emit("typo:occurred", { key: "x", expected: "l", ignoredBySteelLine: false })
		bridge.emit("word:completed", { word: "laut", perfect: true, combo: 10 })
		bridge.emit("encounter:started", { encounter: startEncounter(openingFish, "scene-boss-audio", []), fish: openingFish, targetText: "arus" })
		bridge.emit("encounter:started", { encounter: startEncounter(commonFish, "scene-boss-audio-fade", []), fish: commonFish, targetText: "laut" })
		await new Promise((resolve) => window.setTimeout(resolve, 800))
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("phase:changed", { phase: 2 })
		bridge.emit("phase:changed", { phase: 3 })
		await new Promise((resolve) => window.setTimeout(resolve, 260))

		expect(host.querySelector("canvas")).not.toBeNull()
	})
})

function sceneUpdate(game: ReturnType<typeof createFishingGame>, time: number): void {
	const scene = game.scene.getScene("FishingScene") as unknown as { update(time: number, delta: number): void }
	scene.update(time, 16)
}
