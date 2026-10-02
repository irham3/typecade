import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { createInitialCollection, createShallowCoastExpedition, serializeOceanSave } from "@typecade/game-rules"
import { App } from "./App"
import { PracticeScreen } from "./practice/PracticeScreen"

vi.mock("./game/createFishingGame", () => ({ createFishingGame: () => ({ destroy: vi.fn() }) }))

describe("application browser coverage", () => {
	let host: HTMLDivElement
	let root: Root

	beforeEach(() => {
		;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
		host = document.createElement("div")
		document.body.append(host)
		root = createRoot(host)
	})

	afterEach(async () => {
		await act(async () => root.unmount())
		host.remove()
		localStorage.clear()
		history.replaceState(null, "", "/")
	})

	async function mount() { await act(async () => root.render(<App />)) }
	async function click(selector: string) {
		const button = host.querySelector<HTMLElement>(selector)
		if (!button) throw new Error(`Missing control: ${selector}`)
		await act(() => button.click())
	}
	async function sail() {
		await click('button[aria-label="Adventure"]')
		await click('[data-testid="prep-screen"] .prep-header button.primary-action')
	}

	it("disposes a pending renderer import when the application unmounts", async () => {
		await act(() => root.render(<App />))
		await act(() => root.unmount())
		await act(async () => Promise.resolve())
	})

	it("opens menu panels and renders their meaningful content", async () => {
		await mount()
		expect(host.querySelector('[data-testid="main-menu"]')).not.toBeNull()
		for (const label of ["Practice", "Adventure", "Multiplayer", "Shop", "Collection", "Leaderboard"]) expect(host.querySelector(`button[aria-label="${label}"]`)).not.toBeNull()
		await click('button[aria-label="Shop"]')
		expect(host.textContent).toContain("Equipment shopping is reserved")
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
		await click('button[aria-label="Collection"]')
		expect(host.textContent).toContain("0/10 species discovered")
		expect(host.querySelectorAll(".collection-card")).toHaveLength(10)
		expect(host.querySelector(".generated-fish-catalog")).toBeNull()
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
		await click('button[aria-label="Leaderboard"]')
		expect(host.textContent).toContain("Online leaderboard data is out of scope")
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
		await click('button[aria-label="Multiplayer"]')
		expect(host.querySelector(".race-screen")).not.toBeNull()
		await click('.race-header button.secondary-action:last-child')
		expect(host.querySelector('[data-testid="main-menu"]')).not.toBeNull()
	})

	it("opens configurable practice and plays the selected challenge", async () => {
		await mount()
		await click('button[aria-label="Practice"]')
		expect(host.querySelector('[data-testid="practice-screen"]')).not.toBeNull()
		const language = host.querySelector<HTMLSelectElement>('[aria-label="Practice language"]')!
		await act(async () => { await userEvent.selectOptions(language, "en") })
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "custom") })
		const passage = host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!
		await act(async () => { await userEvent.fill(passage, "abc") })
		const challenge = host.querySelector<HTMLSelectElement>('[aria-label="Practice challenge"]')!
		await act(async () => { await userEvent.selectOptions(challenge, "perfect") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		expect(host.querySelector('[data-testid="practice-racing"]')).not.toBeNull()
		await act(async () => {
			for (const key of ["a", "b", "c"]) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
		})
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("Good run")
		expect(Number(localStorage.getItem("typecade:practice:best"))).toBeGreaterThan(0)
		await click('[data-testid="practice-result"] button.pixel-action.primary')
		expect(host.querySelector('[data-testid="practice-racing"]')).not.toBeNull()
	})

	it("starts word-count practice with its selected language and returns to setup", async () => {
		await mount()
		await click('button[aria-label="Practice"]')
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice language"]')!, "en") })
		const words = host.querySelector<HTMLInputElement>('[aria-label="Practice word count"]')!
		await act(async () => { await userEvent.fill(words, "5") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		expect(host.querySelector('[data-testid="practice-racing"]')?.textContent).toContain("English · words")
		expect(host.querySelector('[data-testid="practice-passage"]')?.textContent?.length).toBeGreaterThan(0)
		await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		expect(host.querySelector('[aria-label="Practice word count"]')).not.toBeNull()
	})

	it("validates a custom practice passage and ignores shortcut keys while typing", async () => {
		await mount()
		await click('button[aria-label="Practice"]')
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		const options = host.querySelectorAll<HTMLInputElement>(".practice-options input")
		await act(async () => { await userEvent.click(options[0]!) })
		await act(async () => { await userEvent.click(options[1]!) })
		expect(options[0]?.checked).toBe(true)
		expect(options[1]?.checked).toBe(true)
		await act(async () => { await userEvent.selectOptions(format, "custom") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		expect(host.querySelector('[role="alert"]')?.textContent).toContain("three characters")
		const shuffle = host.querySelector<HTMLInputElement>(".practice-config input[type=checkbox]")!
		await act(async () => { await userEvent.click(shuffle) })
		expect(shuffle.checked).toBe(true)
		const passage = host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!
		await act(async () => { await userEvent.fill(passage, "abc") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "x", ctrlKey: true, bubbles: true })))
		expect(host.querySelector('[data-testid="practice-passage"] .next')?.textContent).toBe("a")
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		expect(host.querySelector('[data-testid="practice-screen"] button[type="submit"]')).not.toBeNull()
		await click(".practice-header button.pixel-action.secondary")
		expect(host.querySelector('[data-testid="main-menu"]')).not.toBeNull()
	})

	it("ends Three Hulls practice after the third mistake", async () => {
		await mount()
		await click('button[aria-label="Practice"]')
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "custom") })
		const passage = host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!
		await act(async () => { await userEvent.fill(passage, "abc") })
		const challenge = host.querySelector<HTMLSelectElement>('[aria-label="Practice challenge"]')!
		await act(async () => { await userEvent.selectOptions(challenge, "three-hulls") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		for (const key of ["x", "y", "z"]) {
			await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })))
		}
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("All hulls lost")
	})

	it("ends Perfect Tide on its first typo", async () => {
		await mount()
		await click('button[aria-label="Practice"]')
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "custom") })
		const passage = host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!
		await act(async () => { await userEvent.fill(passage, "abc") })
		const challenge = host.querySelector<HTMLSelectElement>('[aria-label="Practice challenge"]')!
		await act(async () => { await userEvent.selectOptions(challenge, "perfect") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true })))
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("Perfect Tide broken")
	})

	it("finishes timed practice when the configured clock expires", async () => {
		await mount()
		await click('button[aria-label="Practice"]')
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "time") })
		const duration = host.querySelector<HTMLInputElement>('[aria-label="Practice duration"]')!
		await act(async () => { await userEvent.fill(duration, "1") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1250)) })
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("SESSION COMPLETE")
	})

	it("runs quote practice with monospace text and rejects modified or navigation keys", async () => {
		localStorage.setItem("typecade:practice:best", "999")
		const onBack = vi.fn()
		await act(async () => root.render(<PracticeScreen onBack={onBack} />))
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "quote") })
		const difficulty = host.querySelector<HTMLSelectElement>('[aria-label="Quote difficulty"]')!
		await act(async () => { await userEvent.selectOptions(difficulty, "hard") })
		const monospace = host.querySelector<HTMLInputElement>('.practice-config input[type="checkbox"]')!
		await act(() => monospace.click())
		const size = host.querySelector<HTMLInputElement>('[aria-label="Text size"]')!
		await act(async () => { await userEvent.fill(size, "32") })
		expect(host.querySelector('[data-testid="practice-screen"]')?.textContent).toContain("Best 999 WPM")
		await click('[data-testid="practice-screen"] button[type="submit"]')
		const passage = host.querySelector<HTMLElement>('[data-testid="practice-passage"]')!
		expect(passage.classList.contains("mono")).toBe(true)
		expect(passage.style.fontSize).toBe("32px")
		const initial = host.querySelectorAll('[data-testid="practice-passage"] .done').length
		await act(async () => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true }))
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
		})
		expect(host.querySelectorAll('[data-testid="practice-passage"] .done')).toHaveLength(initial)
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".practice-header button")!) })
		expect(host.querySelector('[data-testid="practice-racing"]')).toBeNull()
		expect(host.querySelector('[aria-label="Quote difficulty"]')).not.toBeNull()
		expect(onBack).not.toHaveBeenCalled()
	})

	it("runs preparation choices, HUD panels, settings, and pause navigation", async () => {
		await mount()
		await click('button[aria-label="Adventure"]')
		expect(host.querySelector('[data-testid="prep-screen"]')).not.toBeNull()
		await click('[data-testid="prep-screen"] .route-choice-grid button:nth-child(2)')
		expect(host.querySelector('[data-testid="prep-screen"] .route-choice-grid button.selected')?.textContent).toContain("Reef Shelf")
		const selectedSkill = host.querySelector<HTMLElement>('.prep-skill[aria-pressed="true"]')
		if (!selectedSkill) throw new Error("Expected an equipped skill")
		await act(() => selectedSkill.click())
		const unselectedSkill = host.querySelector<HTMLElement>('.prep-skill.active[aria-pressed="false"]') ?? host.querySelector<HTMLElement>('.prep-skill[aria-pressed="false"]')
		if (!unselectedSkill) throw new Error("Expected an unequipped skill offer")
		await act(() => unselectedSkill.click())
		expect(unselectedSkill.getAttribute("aria-pressed")).toBe("true")
		await click('[data-testid="prep-screen"] .prep-header button.primary-action')
		expect(host.querySelector('[data-testid="ocean-hud"]')).not.toBeNull()
		expect(host.querySelector('[data-testid="route-strip"]')?.textContent).toContain("Reef Shelf")
		await click('button[aria-label="Fish"]')
		expect(host.querySelector('[data-testid="overlay-panel"]'), host.textContent).not.toBeNull()
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Pebble Goby")
		await click('button[aria-label="Fish"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')).toBeNull()
		await click('button[aria-label="Tasks"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Use Sonar to preview the zone fish")
		await click('[data-testid="overlay-panel"] .route-choice-grid button:nth-child(2)')
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
		await click('button[aria-label="Shop"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Cost")
		await click('button[aria-label="Shop"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')).toBeNull()
		await click('button[aria-label="Shop"]')
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
		await click('button[aria-label="Settings"]')
		await click('button[aria-label="Settings"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')).toBeNull()
		await click('button[aria-label="Settings"]')
		const range = host.querySelector<HTMLInputElement>('.settings-grid input[type="range"]')!
		await act(async () => { await userEvent.fill(range, "0.2") })
		const reducedEffects = host.querySelector<HTMLInputElement>('.settings-grid input[type="checkbox"]')!
		await act(() => reducedEffects.click())
		expect(reducedEffects.checked).toBe(true)
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
		await click('button[aria-label="Pause game"]')
		expect(host.querySelector('[data-testid="pause-panel"]')).not.toBeNull()
		await click('[data-testid="pause-panel"] button.primary-action')
		expect(host.querySelector('[data-testid="pause-panel"]')).toBeNull()
		await click('button[aria-label="Pause game"]')
		await click('[data-testid="pause-panel"] button.secondary-action')
		expect(host.querySelector('[data-testid="main-menu"]')).not.toBeNull()
		await click('button[aria-label="Adventure"]')
		expect(host.querySelector('[data-testid="prep-screen"]')).not.toBeNull()
		await click('[data-testid="prep-screen"] .prep-header button.secondary-action')
	})

	it("resolves a catch, persists it, and locks the route after typing starts", async () => {
		await mount()
		await sail()
		const target = host.querySelector('[data-testid="typing-target"]')?.textContent?.replace(/\u00a0/g, " ") ?? ""
		expect(target.length).toBeGreaterThan(0)
		await act(async () => {
			for (const key of target) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
		})
		expect(host.querySelector('[data-testid="result-toast"]')?.textContent).toContain("Catch secured")
		expect(JSON.parse(localStorage.getItem("typecade:ocean-typing-rpg:m1") ?? "{}").collection.records.reef_minnow?.count).toBe(1)
		await click('button[aria-label="Tasks"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Route locked after typing starts.")
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
	})

	it("reports an escaped fish and retries with the next line", async () => {
		await mount()
		await sail()
		await act(async () => {
			for (let index = 0; index < 50; index += 1) {
				window.dispatchEvent(new KeyboardEvent("keydown", { key: "~", bubbles: true }))
			}
		})
		expect(host.querySelector('[data-testid="result-toast"]')?.textContent).toContain("Line lost")
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1600)) })
		expect(host.querySelector('[data-testid="result-toast"]')).toBeNull()
		expect(host.querySelector('[data-testid="typing-target"]')).not.toBeNull()
	})

	it("reveals catch tables with Sonar and shows newly caught fish records", async () => {
		const collection = { ...createInitialCollection(), xp: 0 }
		localStorage.setItem("typecade:ocean-typing-rpg:m1", serializeOceanSave(createShallowCoastExpedition("sonar-ui-check"), collection))
		await mount()
		await sail()
		const sonar = [...host.querySelectorAll<HTMLButtonElement>(".skill-button")].find((button) => button.title.startsWith("Sonar:"))
		expect(sonar?.disabled).toBe(false)
		await act(() => sonar!.click())
		await click('button[aria-label="Tasks"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Sonar sweep active")
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Pebble Goby")
		await click('button[aria-label="Tasks"]')
		const target = host.querySelector('[data-testid="typing-target"]')?.textContent?.replace(/\u00a0/g, " ") ?? ""
		await act(async () => {
			for (const key of target) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
		})
		await click('button[aria-label="Collection"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("1/10 species discovered")
		await click('button[aria-label="Collection"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')).toBeNull()
		await click('button[aria-label="Collection"]')
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
		await click('button[aria-label="Fish"]')
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Largest")
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
	})

	it("shows level-up feedback when a saved collection crosses its next level", async () => {
		const collection = { ...createInitialCollection(), xp: 23 }
		localStorage.setItem(
			"typecade:ocean-typing-rpg:m1",
			serializeOceanSave(createShallowCoastExpedition("level-up-check"), collection),
		)
		await mount()
		await sail()
		const target = host.querySelector('[data-testid="typing-target"]')?.textContent?.replace(/\u00a0/g, " ") ?? ""
		await act(async () => {
			for (const key of target) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
		})
		expect(host.querySelector('[data-testid="level-up-banner"]')?.textContent).toContain("LEVEL 2")
	})

	it("uses an earned skill, blocks typing while paused, and resumes the same encounter", async () => {
		await mount()
		await sail()
		const target = host.querySelector('[data-testid="typing-target"]')?.textContent?.replace(/\u00a0/g, " ") ?? ""
		const prefixLength = target.split(" ").slice(0, 3).join(" ").length + 1
		await act(async () => {
			for (const key of target.slice(0, prefixLength)) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
		})
		const activeSkill = host.querySelector<HTMLButtonElement>('[data-testid="skill-dock"] .skill-button.active:enabled')
		expect(activeSkill).not.toBeNull()
		await act(() => activeSkill!.click())
		expect(host.querySelector('[data-testid="skill-feedback"]')).not.toBeNull()
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 2700)) })
		expect(host.querySelector('[data-testid="skill-feedback"]')).toBeNull()
		const cursor = host.querySelectorAll('[data-testid="typing-target"] .done').length
		await click('button[aria-label="Pause game"]')
		await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true })))
		expect(host.querySelectorAll('[data-testid="typing-target"] .done')).toHaveLength(cursor)
		await click('[data-testid="pause-panel"] button.primary-action')
		expect(host.querySelector('[data-testid="pause-panel"]')).toBeNull()
	})

	it("completes every expedition zone and the boss, then sails again", async () => {
		await mount()
		await click('button[aria-label="Adventure"]')
		await click('[data-testid="prep-screen"] .prep-header button.primary-action')
		for (let encounter = 1; encounter <= 10; encounter += 1) {
			expect(host.querySelector('[data-testid="route-strip"]')?.textContent).toContain(`Encounter ${encounter}/10`)
			const target = host.querySelector('[data-testid="typing-target"]')?.textContent?.replace(/\u00a0/g, " ") ?? ""
			expect(target.length).toBeGreaterThan(0)
			if (encounter === 10) {
				let sawGuardPhase = false
				for (const key of target) {
					await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })))
					if (host.querySelector('[data-testid="boss-phase-callout"] .boss-guard-pips')) {
						expect(host.querySelector('[data-testid="boss-phase-callout"]')?.textContent).toContain("Crown Guard")
						const activeGuards = host.querySelectorAll('.boss-guard-pips i.active').length
						if (activeGuards === 2) sawGuardPhase = true
					}
				}
				expect(sawGuardPhase).toBe(true)
			} else {
				await act(async () => {
					for (const key of target) window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
				})
			}
			expect(host.querySelector('[data-testid="result-toast"]')?.textContent).toContain("Catch secured")
			if (encounter < 10) await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1850)) })
		}
		expect(host.querySelector('[data-testid="complete-panel"]')?.textContent).toContain("Shallow Coast cleared")
		expect(JSON.parse(localStorage.getItem("typecade:ocean-typing-rpg:m1") ?? "{}").expedition.complete).toBe(true)
		await click('[data-testid="complete-panel"] button')
		expect(host.querySelector('[data-testid="route-strip"]')?.textContent).toContain("Encounter 1/10")
	}, 40000)

	it("starts from the race deep link and returns to the main menu", async () => {
		history.replaceState(null, "", "/?race=ABCDEFGH")
		await mount()
		expect(host.querySelector(".race-screen")).not.toBeNull()
		await click('.race-header button.secondary-action:last-child')
		expect(host.querySelector('[data-testid="main-menu"]')).not.toBeNull()
	})

	it("keeps settings reachable after returning to the main menu from a paused run", async () => {
		await mount()
		await sail()
		await click('button[aria-label="Settings"]')
		await act(async () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		await click('[data-testid="pause-panel"] button.secondary-action')
		expect(host.querySelector('[data-testid="main-menu"]')).not.toBeNull()
		expect(host.querySelector('[data-testid="overlay-panel"]')?.textContent).toContain("Settings")
		await click('[data-testid="overlay-panel"] button[aria-label="Close"]')
	})
})
