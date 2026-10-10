import { act, useEffect, useLayoutEffect, useRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getRouteNodesForZone } from "@typecade/content"
import * as oceanContent from "@typecade/content"
import { createInitialCollection, createShallowCoastExpedition, serializeOceanSave } from "@typecade/game-rules"
import * as gameRules from "@typecade/game-rules"
import { TypingSession } from "@typecade/typing-engine"
import type { OceanRunControls } from "./useOceanRun"
import { useOceanRun } from "./useOceanRun"

vi.mock("@typecade/game-rules", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@typecade/game-rules")>()
	return { ...actual, applyTypingEvents: vi.fn(actual.applyTypingEvents) }
})

vi.mock("@typecade/content", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@typecade/content")>()
	return { ...actual, getRouteNodesForZone: vi.fn(actual.getRouteNodesForZone) }
})

let controls: OceanRunControls | undefined
let preInitControls: { skill: boolean; routeId: string } | undefined
let initialRouteId: string | undefined

function Probe({ active = true }: { active?: boolean }) {
	const run = useOceanRun(active)
	useEffect(() => { controls = run }, [run])
	return <div><input aria-label="editable field" /></div>
}

function PreInitProbe() {
	const run = useOceanRun()
	const didProbe = useRef(false)
	useLayoutEffect(() => {
		if (didProbe.current) return
		didProbe.current = true
		const routeId = run.view.selectedRoute.id
		const skill = run.useSkill("sonar")
		run.chooseRoute("reef_shelf")
		preInitControls = { skill, routeId: controls?.view.selectedRoute.id ?? routeId }
	}, [run])
	return null
}

function InitialRouteProbe() {
	const run = useOceanRun()
	const didProbe = useRef(false)
	useLayoutEffect(() => {
		if (didProbe.current) return
		didProbe.current = true
		initialRouteId = run.view.selectedRoute.id
	}, [run])
	return null
}

describe("ocean run browser controls", () => {
	let host: HTMLDivElement
	let root: Root

	it("grants repeat-run rewards once per new expedition and cancels stale encounter transitions", async () => {
		await mount()
		await act(() => controls!.startFreshRun())
		const firstSeed = controls!.view.expedition.seed
		const passage = controls!.view.targetText
		await act(() => { for (const key of passage) controls!.typeKey(key) })
		const firstXp = controls!.view.collection.xp
		expect(firstXp).toBeGreaterThan(0)
		await act(() => controls!.startFreshRun())
		expect(controls!.view.expedition.seed).not.toBe(firstSeed)
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1900)) })
		expect(controls!.view.expedition.currentEncounterIndex).toBe(0)
		expect(controls!.view.cursor).toBe(0)
		await act(() => { for (const key of controls!.view.targetText) controls!.typeKey(key) })
		expect(controls!.view.collection.xp).toBeGreaterThan(firstXp)
		expect(controls!.view.collection.records.reef_minnow.count).toBe(2)
	})

	it("excludes paused time from typing metrics and ignores browser shortcuts and UI buttons", async () => {
		await mount()
		await act(() => controls!.startFreshRun())
		await act(() => controls!.togglePause())
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1100)) })
		await act(() => controls!.togglePause())
		await act(() => controls!.typeKey("o"))
		expect(controls!.view.metrics.elapsedMs).toBeLessThan(500)
		const errors = controls!.view.metrics.incorrectKeystrokes
		const button = document.createElement("button")
		host.append(button)
		await act(() => {
			button.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "x", ctrlKey: true, bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "x", metaKey: true, bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "x", altKey: true, bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "x", isComposing: true, bubbles: true }))
		})
		expect(controls!.view.metrics.incorrectKeystrokes).toBe(errors)
		await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true })))
		expect(controls!.view.metrics.incorrectKeystrokes).toBe(errors + 1)
		expect(controls!.view.lastSkillId).not.toBe("cast_net")
	})

	it("waits for the first keystroke before applying time and idle pressure", async () => {
		await mount()
		await act(() => controls!.startFreshRun())
		const initial = controls!.view.encounter
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1100)) })
		expect(controls!.view.encounter.timeRemainingMs).toBe(initial.timeRemainingMs)
		expect(controls!.view.encounter.tension).toBe(initial.tension)
		await act(() => expect(controls!.useSkill("sonar")).toBe(true))
		expect(controls!.view.sonarRevealed).toBe(true)
		const future = Date.now() + 13000
		const date = vi.spyOn(Date, "now").mockReturnValue(future)
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 300)) })
		expect(controls!.view.sonarRevealed).toBe(false)
		expect(controls!.view.encounter.timeRemainingMs).toBe(initial.timeRemainingMs)
		date.mockRestore()
		await act(() => controls!.typeKey(controls!.view.targetText[0]!))
		expect(controls!.view.metrics.elapsedMs).toBeLessThan(100)
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 600)) })
		expect(controls!.view.encounter.timeRemainingMs).toBeLessThan(initial.timeRemainingMs - 250)
	})

	it("keeps the completed passage frozen while its next encounter is paused", async () => {
		await mount()
		await act(() => controls!.startFreshRun())
		await act(() => expect(controls!.useSkill("sonar")).toBe(true))
		expect(controls!.view.feedback?.kind).toBe("skill")
		const text = controls!.view.targetText
		await act(() => { for (const key of text) controls!.typeKey(key) })
		await act(() => controls!.togglePause())
		await act(() => controls!.setVolume("music", 0.31))
		await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1900)) })
		expect(controls!.view.targetText).toBe(text)
		expect(controls!.view.lastResult?.caught).toBe(true)
		await act(() => controls!.togglePause())
		expect(controls!.view.expedition.currentEncounterIndex).toBe(1)
		expect(controls!.view.cursor).toBe(0)
		expect(controls!.view.isPaused).toBe(false)
		expect(controls!.view.feedback).toBeUndefined()
		expect(controls!.view.lastSkillId).toBeUndefined()
		expect(controls!.view.volumes.music).toBe(0.31)
		expect(controls!.view.log.some((line) => line.startsWith("Caught Pebble Goby"))).toBe(true)
	})

	it("parks result transitions behind panels and advances only after controls resume", async () => {
		await mount()
		await act(() => controls!.startFreshRun())
		const text = controls!.view.targetText
		await act(() => { for (const key of text) controls!.typeKey(key) })
		await mount(false)
		await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1900)) })
		expect(controls!.view.targetText).toBe(text)
		expect(controls!.view.lastResult?.caught).toBe(true)
		await mount(true)
		expect(controls!.view.expedition.currentEncounterIndex).toBe(1)
		expect(controls!.view.cursor).toBe(0)
		await act(() => { for (const key of controls!.view.targetText) controls!.typeKey(key) })
		await act(() => controls!.togglePause())
		await mount(false)
		await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1900)) })
		await mount(true)
		expect(controls!.view.lastResult?.caught).toBe(true)
		expect(controls!.view.isPaused).toBe(true)
		await act(() => controls!.togglePause())
		expect(controls!.view.expedition.currentEncounterIndex).toBe(2)
		expect(controls!.view.cursor).toBe(0)
	})

	beforeEach(() => {
		;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
		host = document.createElement("div")
		document.body.append(host)
		root = createRoot(host)
		controls = undefined
		preInitControls = undefined
		initialRouteId = undefined
	})

	afterEach(async () => {
		await act(async () => root.unmount())
		host.remove()
		localStorage.clear()
		vi.mocked(oceanContent.getRouteNodesForZone).mockReset()
		const actualContent = await vi.importActual<typeof import("@typecade/content")>("@typecade/content")
		vi.mocked(oceanContent.getRouteNodesForZone).mockImplementation(actualContent.getRouteNodesForZone)
		vi.restoreAllMocks()
	})

	async function mount(active = true) {
		await act(async () => root.render(<Probe active={active} />))
		await act(async () => Promise.resolve())
		if (!controls) throw new Error("Hook controls were not initialized")
		return controls
	}

	 it("pauses at harbor, equips newly unlocked skills and resumes without resetting the voyage", async () => {
		const expedition = { ...createShallowCoastExpedition("harbor"), currentZoneIndex: 2, currentEncounterIndex: 3, selectedRouteId: "leviathan_trench" }
		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave(expedition, { ...createInitialCollection(), xp: 500 }))
		await mount()
		expect(controls!.view.isRefitting).toBe(true)
		await act(() => controls!.chooseRoute("missing"))
		await act(() => controls!.continueVoyage())
		expect(controls!.view.fish.id).toBe("crown_leviathan")
		await act(() => { for (const key of controls!.view.targetText) controls!.typeKey(key) })
		expect(controls!.view.expedition.voyage).toBe(2)
		expect(controls!.view.isRefitting).toBe(true)
		await act(() => { controls!.togglePause(); controls!.typeKey("x") })
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1900)) })
		expect(controls!.view.lastResult?.caught).toBe(true)
		await act(() => controls!.setSkillLoadout(["calm_current", "steel_line", "reel_mastery"]))
		await act(() => controls!.chooseRoute("reef_shelf"))
		await act(() => { controls!.continueVoyage(); controls!.continueVoyage() })
		expect(controls!.view).toMatchObject({ isRefitting: false, isPaused: false, cursor: 0 })
		expect(controls!.view.expedition).toMatchObject({ voyage: 2, seed: "harbor", selectedRouteId: "reef_shelf", selectedSkillIds: ["calm_current", "steel_line", "reel_mastery"] })
		await act(() => controls!.continueVoyage())
		expect(controls!.view.expedition.voyage).toBe(2)
		await act(() => { for (const key of controls!.view.targetText) controls!.typeKey(key) })
		expect(controls!.view.collection.grantedResultKeys).toHaveLength(2)
	 })

	it("restores a saved expedition and restarts completed saves with their collection", async () => {
		const expedition = createShallowCoastExpedition("saved-run")
		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave(expedition, createInitialCollection()))
		const restored = await mount()
		expect(restored.view.expedition.seed).toBe("saved-run")

		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave({ ...expedition, selectedRouteId: "missing-route" }, createInitialCollection()))
		await act(async () => root.unmount())
		root = createRoot(host)
		const routeRecovered = await mount()
		expect(routeRecovered.view.selectedRoute.id).toBe(getRouteNodesForZone("zone_1")[0]!.id)

		const completed = { ...expedition, complete: true }
		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave(completed, createInitialCollection()))
		await act(async () => root.unmount())
		root = createRoot(host)
		const restarted = await mount()
		expect(restarted.view.expedition.seed).toBe("shallow-coast-vertical-slice")
	})

	it("ignores route and skill controls before the first encounter is restored", async () => {
		await act(async () => root.render(<PreInitProbe />))
		expect(preInitControls?.skill).toBe(false)
		expect(preInitControls?.routeId).toBe("lagoon_gate")
	})

	it("falls back to the first route when the route list changes during initialization", async () => {
		const routes = getRouteNodesForZone("zone_1")
		let lookup = 0
		vi.mocked(oceanContent.getRouteNodesForZone).mockImplementation(() => [routes[lookup++ === 0 ? 0 : 1]!])
		await act(async () => root.render(<InitialRouteProbe />))
		expect(initialRouteId).toBe(routes[1]!.id)
	})

	it("chooses valid prep routes, sanitizes skill loadouts, and starts with both selections", async () => {
		const run = await mount(false)
		const initialRoute = run.view.selectedRoute.id
		await act(() => run.chooseRoute("not-a-route"))
		expect(run.view.selectedRoute.id).toBe(initialRoute)
		const selectedRoute = getRouteNodesForZone("zone_1")[1]!
		await act(() => run.chooseRoute(selectedRoute.id))
		const offeredIds = run.view.skillOffers.map((skill) => skill.id)
		const selection = offeredIds.slice(0, 3)
		await act(() => run.setSkillLoadout([selection[0]!, selection[0]!, "missing", selection[1]!, selection[2]!]))
		const configuredSkills = controls!.view.expedition.selectedSkillIds
		await act(() => run.setSkillLoadout([]))
		expect(controls!.view.expedition.selectedSkillIds).toEqual(configuredSkills)
		await act(async () => run.startFreshRun())
		expect(controls!.view.selectedRoute.id).toBe(selectedRoute.id)
		expect(controls!.view.expedition.selectedSkillIds).toEqual(selection)
		const passive = selection.find((id) => run.view.skillOffers.find((skill) => skill.id === id)?.type === "passive")
		if (passive) await act(() => expect(controls!.useSkill(passive)).toBe(false))
		const usable = selection.find((id) => id !== "cast_net" && run.view.skillOffers.find((skill) => skill.id === id)?.type === "active")
		if (usable) await act(() => expect(controls!.useSkill(usable)).toBe(false))

		await act(async () => root.unmount())
		root = createRoot(host)
		const activeRun = await mount()
		await act(async () => activeRun.startFreshRun())
		const initialActiveRoute = controls!.view.selectedRoute.id
		const alternative = controls!.view.routeChoices.find((route) => route.id !== initialActiveRoute)!
		await act(() => controls!.chooseRoute(alternative.id))
		expect(controls!.view.selectedRoute.id).toBe(alternative.id)
		const expected = controls!.view.targetText[controls!.view.cursor]
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: expected, bubbles: true })))
		await act(() => controls!.chooseRoute(initialActiveRoute))
		expect(controls!.view.selectedRoute.id).toBe(alternative.id)
	})

	it("handles pause, typing, shortcuts, editable targets, settings, and inactive controls", async () => {
		const run = await mount()
		const startCursor = run.view.cursor
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
		})
		expect(controls!.view.cursor).toBe(startCursor)
		expect(controls!.view.isPaused).toBe(false)
		const expected = controls!.view.targetText[controls!.view.cursor]
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: expected, bubbles: true })))
		expect(controls!.view.cursor).toBe(startCursor + 1)
		const activeCursor = controls!.view.cursor
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
			host.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "9", bubbles: true }))
		})
		expect(controls!.view.isPaused).toBe(false)
		expect(controls!.view.cursor).toBe(activeCursor)
		await act(() => controls!.setVolume("music", 0.2))
		await act(() => controls!.setReducedMotion(true))
		expect(controls!.view.volumes.music).toBe(0.2)
		expect(controls!.view.reducedMotion).toBe(true)

		const inactive = await mount(false)
		const inactiveCursor = inactive.view.cursor
		const inactivePaused = inactive.view.isPaused
		await act(() => inactive.togglePause())
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		expect(controls!.view.cursor).toBe(inactiveCursor)
		expect(controls!.view.isPaused).toBe(inactivePaused)
	})

	it("activates an equipped active skill from its number shortcut", async () => {
		const run = await mount()
		const skill = run.skillOffers.find((offer) => offer.type === "active" && offer.id !== "cast_net")
		if (!skill) throw new Error("Expected an immediately usable active skill offer")
		await act(() => run.setSkillLoadout([skill.id]))
		await act(async () => run.startFreshRun())
		const prefixLength = run.view.targetText.split(" ").slice(0, 3).join(" ").length + 1
		await act(async () => {
			for (const key of run.view.targetText.slice(0, prefixLength)) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
		})
		const keyEvent = new KeyboardEvent("keydown", { key: "1", altKey: true, bubbles: true, cancelable: true })
		await act(() => window.dispatchEvent(keyEvent))
		expect(keyEvent.defaultPrevented).toBe(true)
		expect(controls!.view.lastSkillId).toBe(skill.id)
	})

	it("gates Cast Net without skipping typing and retains full-passage level rewards", async () => {
		const collection = { ...createInitialCollection(), xp: 23 }
		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave(createShallowCoastExpedition("cast-net-reward"), collection))
		await mount()
		await act(() => controls!.setSkillLoadout(["cast_net", "steel_line"]))
		await act(() => controls!.startFreshRun())
		await act(() => expect(controls!.useSkill("cast_net")).toBe(false))
		await act(() => expect(controls!.useSkill("steel_line")).toBe(false))
		const text = controls!.view.targetText
		await act(() => { for (const key of text.slice(0, Math.ceil(text.length * 0.6))) controls!.typeKey(key) })
		expect(controls!.view.encounter.progress).toBeGreaterThanOrEqual(0.45)
		await act(() => expect(controls!.useSkill("cast_net")).toBe(true))
		expect(controls!.view.encounter.status).toBe("active")
		await act(() => { for (const key of text.slice(Math.ceil(text.length * 0.6))) controls!.typeKey(key) })
		expect(controls!.view.lastResult?.caught).toBe(true)
		expect(controls!.view.feedback?.kind).toBe("level")
		expect(controls!.view.collection.xp).toBeGreaterThan(23)
	})

	it("normalizes optional fields at the typing engine boundary", async () => {
		const run = await mount()
		await act(async () => run.startFreshRun())
		const now = performance.now()
		const eventBase = { timestampMs: now, index: 0, key: "x", metrics: run.view.metrics }
		const sessionKeys = ["a", " ", "x", "b"]
		const processKey = vi.spyOn(TypingSession.prototype, "processKey")
			.mockReturnValueOnce([{ ...eventBase, type: "correct-char" }])
			.mockReturnValueOnce([{ ...eventBase, type: "word-complete", word: "word" }])
			.mockReturnValueOnce([{ ...eventBase, type: "typo" }])
			.mockReturnValueOnce([{ ...eventBase, type: "combo" }])
		const correct = vi.fn()
		const word = vi.fn()
		const typo = vi.fn()
		const combo = vi.fn()
		const unsubscribe = [
			run.bridge.on("character:correct", correct),
			run.bridge.on("word:completed", word),
			run.bridge.on("typo:occurred", typo),
			run.bridge.on("combo:changed", combo),
		]
		try {
			await act(async () => {
				for (const key of sessionKeys) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
			})
			expect(processKey).toHaveBeenCalledTimes(4)
			expect(correct).toHaveBeenCalledWith(expect.objectContaining({ key: "x", expected: "x" }))
			expect(word).toHaveBeenCalledWith(expect.objectContaining({ word: "word", perfect: false, combo: 0 }))
			expect(typo).toHaveBeenCalledWith(expect.objectContaining({ key: "x", expected: "" }))
			expect(combo).toHaveBeenCalledWith({ combo: 0 })
			const skillUsed = vi.fn()
			const bossGuard = vi.fn()
			const stopSkill = run.bridge.on("skill:used", skillUsed)
			const stopBoss = run.bridge.on("boss:guard-broken", bossGuard)
			vi.mocked(gameRules.applyTypingEvents)
				.mockReturnValueOnce({ encounter: run.view.encounter, events: [{ type: "skill-triggered" }] })
				.mockReturnValueOnce({ encounter: run.view.encounter, events: [{ type: "boss-guard-broken" }] })
			processKey.mockReturnValueOnce([{ ...eventBase, type: "correct-char" }])
			await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true })))
			expect(skillUsed).toHaveBeenCalledWith({ skillId: "passive", label: "Skill" })
			processKey.mockReturnValueOnce([{ ...eventBase, type: "correct-char" }])
			await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true })))
			expect(bossGuard).toHaveBeenCalledWith({ tensionRelief: 0 })
			stopSkill()
			stopBoss()
		} finally {
			unsubscribe.forEach((stop) => stop())
			processKey.mockRestore()
		}
	})

	it("uses the neutral route risk after recovering a missing route value", async () => {
		const expedition = createShallowCoastExpedition("route-risk-fallback")
		expedition.selectedRouteId = "missing-route"
		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave(expedition, createInitialCollection()))
		const route = getRouteNodesForZone("zone_1")[1]!
		vi.mocked(oceanContent.getRouteNodesForZone).mockReturnValue([route])
		const run = await mount()
		expect(run.view.selectedRoute.id).toBe(route.id)
		vi.mocked(oceanContent.getRouteNodesForZone).mockReturnValue([{ ...route, risk: undefined }] as never)
		await act(async () => run.startFreshRun())
		const expected = run.view.targetText[run.view.cursor]
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: expected, bubbles: true })))
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 300)) })
		expect(controls!.view.encounter.status).toBe("active")
	})

	it("falls back cleanly when local storage cannot be read or written", async () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("storage unavailable") })
		const run = await mount()
		expect(run.view.expedition.seed).toBe("shallow-coast-vertical-slice")
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage unavailable") })
		await act(async () => run.startFreshRun())
		expect(run.view.encounter.status).toBe("active")
	})
})
