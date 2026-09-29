import { act, useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getRouteNodesForZone } from "@typecade/content"
import { createInitialCollection, createShallowCoastExpedition, serializeOceanSave } from "@typecade/game-rules"
import type { OceanRunControls } from "./useOceanRun"
import { useOceanRun } from "./useOceanRun"

let controls: OceanRunControls | undefined

function Probe({ active = true }: { active?: boolean }) {
	const run = useOceanRun(active)
	useEffect(() => { controls = run }, [run])
	return <div><input aria-label="editable field" /></div>
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

		const completed = { ...expedition, complete: true }
		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave(completed, createInitialCollection()))
		await act(async () => root.unmount())
		root = createRoot(host)
		const restarted = await mount()
		expect(restarted.view.expedition.seed).toBe("shallow-coast-vertical-slice")
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
		const routeBeforeTyping = controls!.view.selectedRoute.id
		const alternative = controls!.view.routeChoices.find((route) => route.id !== routeBeforeTyping)!
		await act(() => controls!.chooseRoute(alternative.id))
		const expected = controls!.view.targetText[controls!.view.cursor]
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: expected, bubbles: true })))
		await act(() => controls!.chooseRoute(routeBeforeTyping))
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
		await act(async () => {
			host.querySelector("input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "9", bubbles: true }))
		})
		expect(controls!.view.isPaused).toBe(false)
		await act(() => controls!.setVolume("music", 0.2))
		await act(() => controls!.setReducedMotion(true))
		expect(controls!.view.volumes.music).toBe(0.2)
		expect(controls!.view.reducedMotion).toBe(true)

		const inactive = await mount(false)
		const inactiveCursor = inactive.view.cursor
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		expect(controls!.view.cursor).toBe(inactiveCursor)
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
