import { afterEach, describe, expect, it, vi } from "vitest"
import { fishSpecies, getFish } from "@typecade/content"
import { resolveCatchResult, startEncounter } from "@typecade/game-rules"
import type { FishSpecies } from "@typecade/contracts"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { createFishingGame } from "./createFishingGame"
import { FishingScene } from "./FishingScene"

describe("FishingScene in Chromium", () => {
	let game: ReturnType<typeof createFishingGame> | undefined
	let host: HTMLDivElement | undefined

	afterEach(async () => {
		if (game) {
			game.destroy(true)
			await vi.waitFor(() => expect(host?.querySelector("canvas")).toBeNull(), { timeout: 10000 })
		}
		game = undefined
		host?.remove()
		host = undefined
	})

	it("keeps fish underwater and lets catch and escape movement finish", async () => {
		host = document.createElement("div")
		host.style.cssText = "position:fixed;inset:0;width:1280px;height:720px"
		document.body.append(host)
		const bridge = new GameEventBridge()
		game = createFishingGame(host, bridge)
		await vi.waitFor(() => expect(game?.scene.isActive("FishingScene")).toBe(true), { timeout: 10000 })
		const scene = game.scene.getScene("FishingScene") as FishingScene
		const visual = scene as unknown as { fish?: Phaser.GameObjects.Sprite; rod?: Phaser.GameObjects.Image; updateLine(): void }
		const audio = scene as unknown as { startLoops(): void; ensureBossLayer(): void; loopsStarted: boolean; bossLoop?: Phaser.Sound.BaseSound }
		for (const key of ["sfx_ambient_ocean_loop", "sfx_music_expedition_loop"]) {
			const data = scene.cache.audio.get(key)
			scene.cache.audio.remove(key)
			expect(() => audio.startLoops()).not.toThrow()
			expect(audio.loopsStarted).toBe(false)
			scene.cache.audio.add(key, data)
		}
		audio.startLoops()
		const bossAudio = scene.cache.audio.get("sfx_music_boss_layer")
		scene.cache.audio.remove("sfx_music_boss_layer")
		expect(() => audio.ensureBossLayer()).not.toThrow()
		expect(audio.bossLoop).toBeUndefined()
		scene.cache.audio.add("sfx_music_boss_layer", bossAudio)
		const species = getFish("reef_minnow")
		const encounter = startEncounter(species, "underwater-lifecycle", [])
		bridge.emit("screen:changed", { screen: "game" })
		bridge.emit("game:paused", { paused: false })
		bridge.emit("settings:effects", { reducedMotion: true })
		bridge.emit("encounter:started", { encounter, fish: species, targetText: "ombak" })
		await new Promise((resolve) => setTimeout(resolve, 400))
		const sprite = visual.fish!
		expect(sprite.y - sprite.displayHeight / 2).toBeGreaterThan(scene.scale.height * 0.3)
		const startX = sprite.x
		const metrics = { wpm: 40, rawWpm: 40, accuracy: 100, combo: 1, maxCombo: 1, consistency: 100, correctKeystrokes: 5, incorrectKeystrokes: 0, progress: 1, elapsedMs: 1500 }
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "caught" }, species, metrics) })
		await vi.waitFor(() => expect(sprite.alpha).toBe(0))
		expect(sprite.x).toBeLessThan(startX)
		bridge.emit("encounter:started", { encounter, fish: species, targetText: "ombak" })
		expect(sprite.alpha).toBe(1)
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "escaped" }, species, metrics) })
		await vi.waitFor(() => expect(sprite.alpha).toBe(0))
		expect(sprite.x).toBeGreaterThan(scene.scale.width)
		visual.rod = undefined
		expect(() => visual.updateLine()).not.toThrow()
		visual.fish = undefined
		expect(() => bridge.emit("encounter:started", { encounter, fish: species, targetText: "ombak" })).not.toThrow()
	})

	it("releases bridge listeners when the game is destroyed without scene shutdown", async () => {
		host = document.createElement("div")
		host.style.cssText = "position:fixed;inset:0;width:1280px;height:720px"
		document.body.append(host)
		const bridge = new GameEventBridge()
		game = createFishingGame(host, bridge)
		await vi.waitFor(() => expect(game?.scene.isActive("FishingScene")).toBe(true), { timeout: 10000 })
		const scene = game.scene.getScene("FishingScene") as FishingScene
		const visuals = scene as unknown as { setZoneBackground(zone: string): void; hitStop(duration: number): void }
		const setBackground = vi.spyOn(visuals, "setZoneBackground")
		visuals.hitStop(200)
		game.destroy(true)
		await vi.waitFor(() => expect(host?.querySelector("canvas")).toBeNull(), { timeout: 10000 })
		game = undefined
		const fish = getFish("reef_minnow")
		expect(() => bridge.emit("encounter:started", { encounter: startEncounter(fish, "after-destroy", []), fish, targetText: "ombak" })).not.toThrow()
		expect(setBackground).not.toHaveBeenCalled()
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
		const clock = phaserScene.time
		const originalNow = clock.now
		const sceneAudio = phaserScene as unknown as { lastTickSfxAt: number; playAudio(key: string, category: string, volume?: number): void }
		const tickAudio = vi.spyOn(sceneAudio, "playAudio")
		sceneAudio.lastTickSfxAt = 0
		Reflect.set(clock, "now", 100)
		bridge.emit("character:correct", { key: "u", expected: "u", progress: 0.3, combo: 2 })
		expect(tickAudio).toHaveBeenCalledWith("sfx_correct_tick_a", "typing", 0.38)
		Reflect.set(clock, "now", 151)
		bridge.emit("character:correct", { key: "s", expected: "s", progress: 0.4, combo: 3 })
		expect(tickAudio).toHaveBeenCalledWith("sfx_correct_tick_b", "typing", 0.38)
		Reflect.set(clock, "now", originalNow)
		tickAudio.mockRestore()
		bridge.emit("word:completed", { word: "arus", perfect: true, combo: 5 })
		bridge.emit("word:completed", { word: "arus", perfect: false, combo: 0 })
		bridge.emit("typo:occurred", { key: "x", expected: "a", ignoredBySteelLine: true })
		bridge.emit("typo:occurred", { key: "x", expected: "a", ignoredBySteelLine: false })
		bridge.emit("line:changed", { tension: 88, durability: 32, progress: 0.5, timeRemainingMs: 1000 })
		bridge.emit("line:changed", { tension: 50, durability: 45, progress: 0.6, timeRemainingMs: 800 })
		bridge.emit("line:changed", { tension: 70, durability: 80, progress: 0.7, timeRemainingMs: 700 })
		sceneUpdate(game, 1200)
		await new Promise((resolve) => window.setTimeout(resolve, 500))
		bridge.emit("phase:changed", { phase: 2 })
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("phase:changed", { phase: 3 })
		await new Promise((resolve) => window.setTimeout(resolve, 70))
		bridge.emit("character:correct", { key: "u", expected: "u", progress: 0.3, combo: 2 })
		bridge.emit("character:correct", { key: "s", expected: "s", progress: 0.4, combo: 3 })
		bridge.emit("boss:guard-broken", { tensionRelief: 0.08 })
		bridge.emit("boss:final-pull", { tensionRelief: 0.1 })
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
			const sprite = (phaserScene as unknown as { fish: Phaser.GameObjects.Sprite }).fish
			phaserScene.tweens.killTweensOf(sprite)
			sceneUpdate(game, index * 900 + 2500)
			expect(sprite.y - sprite.displayHeight / 2, species.id).toBeGreaterThanOrEqual(phaserScene.scale.height * 0.3)
			expect(sprite.y + sprite.displayHeight / 2, species.id).toBeLessThanOrEqual(phaserScene.scale.height * 0.46)
		}
		bridge.emit("screen:changed", { screen: "race" })
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("screen:changed", { screen: "prep" })
		bridge.emit("screen:changed", { screen: "menu" })
		bridge.emit("typo:occurred", { key: "x", expected: "a", ignoredBySteelLine: false })
		sceneUpdate(game, 1500)
		bridge.emit("game:paused", { paused: true })
		const restartedSceneCreated = new Promise<void>((resolve) => phaserScene.events.once("create", () => resolve()))
		phaserScene.scene.restart({ bridge })
		await restartedSceneCreated
		bridge.emit("screen:changed", { screen: "game" })
		bridge.emit("game:paused", { paused: false })
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("fish:hooked", { fish: commonFish })
		const scheduledCallbacks: Array<{ timer: Phaser.Time.TimerEvent; run: () => void }> = []
		const originalDelayedCall = phaserScene.time.delayedCall.bind(phaserScene.time)
		const delayedCall = vi.spyOn(phaserScene.time, "delayedCall").mockImplementation((delay, callback, args, scope) => {
			const timer = originalDelayedCall(delay, callback, args, scope)
			scheduledCallbacks.push({ timer, run: () => callback.apply(scope ?? phaserScene, args ?? []) })
			return timer
		})
		bridge.emit("encounter:started", { encounter: startEncounter(commonFish, "scene-restarted", []), fish: commonFish, targetText: "laut" })
		bridge.emit("skill:used", { skillId: "calm_current", label: "Calm Current" })
		bridge.emit("skill:used", { skillId: "sonar", label: "Sonar" })
		bridge.emit("typo:occurred", { key: "x", expected: "l", ignoredBySteelLine: false })
		for (const callback of scheduledCallbacks) {
			callback.timer.remove(false)
			callback.run()
		}
		delayedCall.mockRestore()
		bridge.emit("word:completed", { word: "laut", perfect: true, combo: 10 })
		bridge.emit("encounter:started", { encounter: startEncounter(openingFish, "scene-boss-audio", []), fish: openingFish, targetText: "arus" })
		phaserScene.input.emit("pointerdown")
		bridge.emit("encounter:started", { encounter: startEncounter(commonFish, "scene-boss-audio-fade", []), fish: commonFish, targetText: "laut" })
		await new Promise((resolve) => window.setTimeout(resolve, 800))
		bridge.emit("settings:effects", { reducedMotion: false })
		bridge.emit("phase:changed", { phase: 2 })
		bridge.emit("phase:changed", { phase: 3 })
		await new Promise((resolve) => window.setTimeout(resolve, 260))

		expect(host.querySelector("canvas")).not.toBeNull()
		const objects = phaserScene as unknown as { fish?: Phaser.GameObjects.Sprite; currentFish?: FishSpecies }
		const animationScene = phaserScene as unknown as { playFishAnimation(species: FishSpecies, state: "caught" | "idle" | "struggle"): void }
		animationScene.playFishAnimation(commonFish, "caught")
		animationScene.playFishAnimation(commonFish, "idle")
		animationScene.playFishAnimation(commonFish, "struggle")
		animationScene.playFishAnimation(openingFish, "idle")
		objects.currentFish = undefined
		bridge.emit("word:completed", { word: "laut", perfect: false, combo: 0 })
		objects.fish = undefined
		const impact = vi.spyOn((phaserScene as unknown as { bubbleEmitter: Phaser.GameObjects.Particles.ParticleEmitter }).bubbleEmitter, "explode")
		const ring = vi.spyOn(phaserScene as unknown as { ringBurst(x: number, y: number, tint: number, scale?: number): void }, "ringBurst")
		bridge.emit("word:completed", { word: "laut", perfect: false, combo: 5 })
		expect(impact).toHaveBeenCalledWith(18, phaserScene.scale.width * 0.62, phaserScene.scale.height * 0.4)
		expect(ring).toHaveBeenCalledWith(phaserScene.scale.width * 0.61, phaserScene.scale.height * 0.5, 0xf5c240)
		impact.mockRestore()
		ring.mockRestore()
		const typoCallbacks: Array<{ timer: Phaser.Time.TimerEvent; run: () => void }> = []
		const typoOriginalDelayedCall = phaserScene.time.delayedCall.bind(phaserScene.time)
		const typoDelayedCall = vi.spyOn(phaserScene.time, "delayedCall").mockImplementation((delay, callback, args, scope) => {
			const timer = typoOriginalDelayedCall(delay, callback, args, scope)
			typoCallbacks.push({ timer, run: () => callback.apply(scope ?? phaserScene, args ?? []) })
			return timer
		})
		objects.currentFish = commonFish
		bridge.emit("typo:occurred", { key: "x", expected: "a", ignoredBySteelLine: false })
		objects.currentFish = undefined
		for (const callback of typoCallbacks) {
			callback.timer.remove(false)
			callback.run()
		}
		typoDelayedCall.mockRestore()
		sceneUpdate(game, 3000)
		bridge.emit("phase:changed", { phase: 2 })
		bridge.emit("boss:guard-broken", { tensionRelief: 0.08 })
		bridge.emit("boss:final-pull", { tensionRelief: 0.1 })
		bridge.emit("skill:used", { skillId: "unknown", label: "Unknown skill" })
		bridge.emit("level:up", { fromLevel: 2, toLevel: 3, xp: 200 })
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "caught" }, fish, { wpm: 50, rawWpm: 55, accuracy: 98, combo: 8, maxCombo: 8, consistency: 90, correctKeystrokes: 80, incorrectKeystrokes: 2, progress: 1, elapsedMs: 10000 }, 1) })
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "escaped" }, fish, { wpm: 0, rawWpm: 0, accuracy: 0, combo: 0, maxCombo: 0, consistency: 0, correctKeystrokes: 0, incorrectKeystrokes: 1, progress: 0, elapsedMs: 10000 }, 1) })
		bridge.emit("settings:effects", { reducedMotion: true })
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "caught" }, fish, { wpm: 50, rawWpm: 55, accuracy: 98, combo: 8, maxCombo: 8, consistency: 90, correctKeystrokes: 80, incorrectKeystrokes: 2, progress: 1, elapsedMs: 10000 }, 1) })
		bridge.emit("catch:resolved", { result: resolveCatchResult({ ...encounter, status: "escaped" }, fish, { wpm: 0, rawWpm: 0, accuracy: 0, combo: 0, maxCombo: 0, consistency: 0, correctKeystrokes: 0, incorrectKeystrokes: 1, progress: 0, elapsedMs: 10000 }, 1) })
		bridge.emit("level:up", { fromLevel: 3, toLevel: 4, xp: 300 })
		phaserScene.textures.remove("water_distortion")
		const filters = phaserScene.cameras.main.filters.external
		vi.spyOn(filters, "addDisplacement").mockImplementation(() => { throw new Error("WebGL filter unavailable") })
		const fallbackScene = phaserScene as unknown as { createWaterPostFx(): void; waterDisplacement?: unknown; waterVignette?: unknown }
		fallbackScene.createWaterPostFx()
		expect(fallbackScene.waterDisplacement).toBeUndefined()
		expect(fallbackScene.waterVignette).toBeUndefined()
		bridge.emit("game:paused", { paused: true })
		sceneUpdate(game, 4000)
	})

	it("keeps the procedural coast visible if the hero backdrop texture is unavailable", async () => {
		host = document.createElement("div")
		host.style.cssText = "position:fixed;inset:0;width:1280px;height:720px"
		document.body.append(host)
		game = createFishingGame(host, new GameEventBridge())
		await vi.waitFor(() => expect(host?.querySelector("canvas")).not.toBeNull(), { timeout: 10000 })
		await vi.waitFor(() => expect(game?.scene.isActive("FishingScene")).toBe(true), { timeout: 10000 })
		const scene = game.scene.getScene("FishingScene")
		const textureExists = scene.textures.exists.bind(scene.textures)
		vi.spyOn(scene.textures, "exists").mockImplementation((key) => key === "bg_gameplay_ai" ? false : textureExists(key))
		for (const child of scene.children.list) {
			if ((child as { texture?: { key: string } }).texture?.key === "bg_gameplay_ai") child.destroy()
		}
		const internals = scene as unknown as { gameplayBackdrop?: Phaser.GameObjects.Image; bgLayers: Phaser.GameObjects.Image[] }
		internals.gameplayBackdrop = undefined
		internals.bgLayers = []
		;(scene as FishingScene).create()
		expect(scene.children.list.some((child) => (child as { texture?: { key: string } }).texture?.key === "bg_gameplay_ai")).toBe(false)
		expect(scene.children.list.some((child) => (child as Phaser.GameObjects.Image).texture?.key === "bg_zone1_sky" && (child as Phaser.GameObjects.Image).visible)).toBe(true)
	})

	it("safely skips visual updates before scene objects and bridge are ready", () => {
		const scene = new FishingScene()
		const methods = scene as unknown as {
			animateWaterPostFx(time: number): void
			bossEntrance(): void
			drawSaggingLine(from: { x: number; y: number }, to: { x: number; y: number }, jitter: number, time: number, segments: number): void
			emitLinePulse(tint: number): void
			playFishAnimation(fish: FishSpecies, state: "idle"): void
			popFish(amount: number): void
			setZoneBackground(habitat: FishSpecies["habitat"]): void
			subscribeToBridge(): void
			updateLine(time: number): void
		}
		const updateState = scene as unknown as { gamePaused: boolean; update(time: number, delta: number): void }

		expect(() => {
			scene.init({})
			updateState.update(0, 16)
			Object.defineProperty(scene, "scale", { configurable: true, value: { width: 1280, height: 720 } })
			updateState.gamePaused = false
			updateState.update(16, 16)
			methods.animateWaterPostFx(0)
			methods.bossEntrance()
			methods.drawSaggingLine({ x: 0, y: 0 }, { x: 10, y: 10 }, 0, 0, 2)
			methods.emitLinePulse(0xffffff)
			methods.playFishAnimation(getFish("reef_minnow"), "idle")
			methods.popFish(1)
			methods.setZoneBackground("zone_2")
			methods.subscribeToBridge()
			methods.updateLine(0)
		}).not.toThrow()
	})

	it("routes every skill through its matching visual effect with missing sprites", () => {
		const scene = new FishingScene()
		const emit = vi.fn()
		const delayedCall = vi.fn((_delay: number, callback: () => void) => callback())
		const probe = scene as unknown as {
			bubbleEmitter: { explode: typeof emit }
			cameras: { main: { setBackgroundColor: typeof emit; shake: typeof emit } }
			emitLinePulse: typeof emit
			emitSkillVfx(skillId: string, label: string): void
			emitWaterImpact: typeof emit
			floatText: typeof emit
			playAudio: typeof emit
			reducedMotion: boolean
			ringBurst: typeof emit
			scale: { width: number; height: number }
			sparkEmitter: { explode: typeof emit }
			time: { delayedCall: typeof delayedCall }
		}
		Object.defineProperties(scene, {
			scale: { configurable: true, value: { width: 1280, height: 720 } },
			time: { configurable: true, value: { delayedCall } },
			cameras: { configurable: true, value: { main: { setBackgroundColor: emit, shake: emit } } },
		})
		probe.bubbleEmitter = { explode: emit }
		probe.sparkEmitter = { explode: emit }
		probe.emitLinePulse = emit
		probe.emitWaterImpact = emit
		probe.floatText = emit
		probe.playAudio = emit
		probe.ringBurst = emit
		for (const skillId of ["cast_net", "calm_current", "sonar", "steel_line", "perfect_bait", "reel_mastery", "unknown"]) {
			probe.reducedMotion = false
			probe.emitSkillVfx(skillId, skillId)
		}
		probe.reducedMotion = true
		probe.emitSkillVfx("reel_mastery", "Reel Mastery")
		expect(emit).toHaveBeenCalled()
		expect(delayedCall).toHaveBeenCalledTimes(4)
	})

	it("plays common fish struggle animations at the faster frame rate", () => {
		const scene = new FishingScene()
		const create = vi.fn()
		const probe = scene as unknown as {
			anims: { create: typeof create; exists(key: string): boolean; generateFrameNames(key: string, range: { prefix: string; start: number; end: number; suffix: string }): string[] }
			fish: { play(key: string, ignoreIfPlaying?: boolean): void; setTexture(key: string, frame?: string | number): void }
			playFishAnimation(fish: FishSpecies, state: "struggle"): void
		}
		Object.defineProperties(scene, {
			anims: { configurable: true, value: { create, exists: () => false, generateFrameNames: () => [] } },
			fish: { configurable: true, value: { play: vi.fn(), setTexture: vi.fn() } },
		})
		probe.playFishAnimation(getFish("kelp_darter"), "struggle")
		expect(create).toHaveBeenCalledWith(expect.objectContaining({ frameRate: 12, repeat: -1 }))
	})

	it("retries hit-stop release after the hold window is extended", async () => {
		const scene = new FishingScene()
		const controls = scene as unknown as { hitStop(duration: number): void }
		const pause = vi.fn()
		const resume = vi.fn()
		const isActive = vi.fn(() => false)
		Object.defineProperty(scene, "scene", { configurable: true, value: { pause, resume } })
		Object.defineProperty(scene, "sys", { configurable: true, value: { isActive } })
		vi.useFakeTimers()
		const now = vi.spyOn(performance, "now").mockReturnValue(1000)
		try {
			controls.hitStop(100)
			expect(pause).not.toHaveBeenCalled()
			isActive.mockReturnValue(true)
			controls.hitStop(100)
			isActive.mockReturnValue(false)
			controls.hitStop(250)
			vi.setSystemTime(1100)
			now.mockReturnValue(1100)
			await vi.advanceTimersByTimeAsync(100)
			expect(pause).toHaveBeenCalledTimes(1)
			vi.setSystemTime(1300)
			now.mockReturnValue(1300)
			await vi.advanceTimersByTimeAsync(150)
			expect(resume).toHaveBeenCalledOnce()
			isActive.mockReturnValue(true)
			controls.hitStop(50)
			now.mockReturnValue(1400)
			await vi.advanceTimersByTimeAsync(50)
			expect(resume).toHaveBeenCalledOnce()
		} finally {
			now.mockRestore()
			vi.useRealTimers()
		}
	})
})

function sceneUpdate(game: ReturnType<typeof createFishingGame>, time: number): void {
	const scene = game.scene.getScene("FishingScene") as unknown as { update(time: number, delta: number): void }
	scene.update(time, 16)
}
