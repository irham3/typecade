import { act, useEffect, useLayoutEffect, useRef } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getRouteNodesForZone } from "@typecade/content"
import { createInitialCollection, createShallowCoastExpedition, serializeOceanSave } from "@typecade/game-rules"
import type { OceanRunControls } from "./useOceanRun"
import { useOceanRun } from "./useOceanRun"

let controls: OceanRunControls | undefined
let preInitControls: { skill: boolean; routeId: string } | undefined

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

describe("ocean run browser controls", () => {
	let host: HTMLDivElement
	let root: Root

	beforeEach(() => {
		;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
		host = document.createElement("div")
		document.body.append(host)
		root = createRoot(host)
		controls = undefined
		preInitControls = undefined
	})

	afterEach(async () => {
		await act(async () => root.unmount())
		host.remove()
		localStorage.clear()
		vi.restoreAllMocks()
	})

	async function mount(active = true) {
		await act(async () => root.render(<Probe active={active} />))
		await act(async () => Promise.resolve())
		if (!controls) throw new Error("Hook controls were not initialized")
		return controls
	}

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
		if (usable) await act(() => expect(controls!.useSkill(usable)).toBe(true))

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
		const keyEvent = new KeyboardEvent("keydown", { key: "1", bubbles: true, cancelable: true })
		await act(() => window.dispatchEvent(keyEvent))
		expect(keyEvent.defaultPrevented).toBe(true)
		expect(controls!.view.lastSkillId).toBe(skill.id)
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
