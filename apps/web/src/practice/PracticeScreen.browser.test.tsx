import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { PracticeSession } from "@typecade/typing-engine"
import { PracticeScreen } from "./PracticeScreen"
import { PracticeKeyboard } from "./PracticeKeyboard"
describe("Typing Dojo",()=>{
 let host:HTMLDivElement,root:Root
 beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement("div");document.body.append(host);root=createRoot(host)})
 afterEach(async()=>{await act(()=>root.unmount());host.remove();localStorage.clear();vi.restoreAllMocks()})
 async function click(selector:string){await act(()=>host.querySelector<HTMLElement>(selector)!.click())}
 async function practice(onBack=vi.fn(),onActivity=vi.fn()){await act(()=>root.render(<PracticeScreen onBack={onBack} onActivity={onActivity}/>));await click(".practice-actions button:first-child")}
 it("uses the on-screen keys, rejects Enter and supports whole-word editing",async()=>{
  const activity=vi.fn();await act(()=>root.render(<PracticeScreen onBack={vi.fn()} onActivity={activity}/>))
  await click('.practice-keyboard button[aria-label="q"]')
  const input=host.querySelector<HTMLInputElement>("input.typing-native-input")!
  await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true})))
  await act(()=>input.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",ctrlKey:true,bubbles:true})))
  expect(activity).toHaveBeenCalled()
  expect(host.querySelector(".expected-key")).not.toBeNull()
 })
	it("opens configurable practice and plays the selected challenge", async () => {
		await act(() => root.render(<PracticeScreen onBack={vi.fn()} />))
		await click('.practice-actions button:first-child')
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
			for (const key of ["a", "b", "c"]) (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }))
		})
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("Good run")
		expect(Number(localStorage.getItem("typecade:practice:best"))).toBeGreaterThan(0)
		await click('[data-testid="practice-result"] button.pixel-action.primary')
		expect(host.querySelector('[data-testid="practice-racing"]')).not.toBeNull()
	})

	it("shows readable spaces and a settings error when a practice passage cannot be built", async () => {
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "custom") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!, "a b") })
		await act(() => host.querySelector<HTMLButtonElement>('[data-testid="practice-screen"] button[type="submit"]')!.click())
		expect(host.querySelector('[data-testid="practice-passage"]')?.textContent).toBe("a b")

		await act(() => (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		await click(".practice-actions button:first-child")
		const now = vi.spyOn(Date, "now").mockImplementation(() => { throw "clock unavailable" })
		try {
			await act(() => host.querySelector<HTMLButtonElement>('[data-testid="practice-screen"] button[type="submit"]')!.click())
			expect(host.querySelector('[role="alert"]')?.textContent).toBe("Check the practice settings.")
		} finally {
			now.mockRestore()
		}
	})

	it("marks each correctly typed practice character as complete", async () => {
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "custom") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!, "abc") })
		await act(() => host.querySelector<HTMLButtonElement>('[data-testid="practice-screen"] button[type="submit"]')!.click())
		await act(() => (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true })))
		expect(host.querySelector('[data-testid="practice-passage"] .done')?.textContent).toBe("a")
	})

	it("starts word-count practice with its selected language and returns to setup", async () => {
		await act(() => root.render(<PracticeScreen onBack={vi.fn()} />))
		await click('.practice-actions button:first-child')
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice language"]')!, "en") })
		const words = host.querySelector<HTMLInputElement>('[aria-label="Practice word count"]')!
		await act(async () => { await userEvent.fill(words, "5") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		expect(host.querySelector('[data-testid="practice-racing"]')?.textContent).toContain("English · words")
		expect(host.querySelector('[data-testid="practice-passage"]')?.textContent?.length).toBeGreaterThan(0)
		await act(() => (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		expect(host.querySelector('[data-testid="practice-racing"]')).not.toBeNull()
		await click(".practice-actions button:first-child")
		expect(host.querySelector('[aria-label="Practice word count"]')).not.toBeNull()
	})

	it("finishes timed practice at its configured deadline", async () => {
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "time") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLInputElement>('[aria-label="Practice duration"]')!, "1") })
		await act(() => host.querySelector<HTMLButtonElement>('[data-testid="practice-screen"] button[type="submit"]')!.click())
		expect(host.querySelector(".practice-clock")?.textContent).toBe("1s")
		await act(() => host.querySelector<HTMLInputElement>(".typing-native-input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true })))
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1100)) })
		expect(host.querySelector(".practice-clock")?.textContent).toBe("1s")
		expect(host.querySelector('[data-testid="practice-result"]')).toBeNull()
		await act(() => host.querySelector<HTMLInputElement>(".typing-native-input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true })))
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1200)) })
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("SESSION COMPLETE")
		await click('[data-testid="practice-result"] button.secondary')
		expect(host.querySelector('[aria-label="Practice duration"]')).not.toBeNull()
	})

	it("rejects input at the practice deadline before the display timer runs", async () => {
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "time") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLInputElement>('[aria-label="Practice duration"]')!, "1") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		const passage = host.querySelector('[data-testid="practice-passage"]')!.textContent!
		const process = vi.spyOn(PracticeSession.prototype, "processKey")
		let now = Date.now()
		vi.spyOn(Date, "now").mockImplementation(() => now)
		await act(() => host.querySelector<HTMLInputElement>(".typing-native-input")!.dispatchEvent(new KeyboardEvent("keydown", { key: passage[0], bubbles: true })))
		now += 1000
		await act(() => host.querySelector<HTMLInputElement>(".typing-native-input")!.dispatchEvent(new KeyboardEvent("keydown", { key: passage[1], bubbles: true })))
		expect(process).toHaveBeenCalledTimes(1)
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("SESSION COMPLETE")
	})

	it("keeps practice readable when the typing engine has no initial metrics snapshot", async () => {
		const snapshots = vi.spyOn(PracticeSession.prototype, "getSnapshot").mockReturnValueOnce(null as never)
		await practice()
		await act(() => host.querySelector<HTMLButtonElement>('[data-testid="practice-screen"] button[type="submit"]')!.click())
		expect(host.querySelector(".practice-clock")?.textContent).toBe("0%")
		expect(host.querySelector(".practice-stats")?.textContent).toContain("100% accuracy")

		await act(async () => root.unmount())
		root = createRoot(host)
		snapshots.mockRestore()
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "time") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLInputElement>('[aria-label="Practice duration"]')!, "1") })
		await act(() => host.querySelector<HTMLButtonElement>('[data-testid="practice-screen"] button[type="submit"]')!.click())
		await act(() => host.querySelector<HTMLInputElement>(".typing-native-input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true })))
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1200)) })
		expect(host.querySelector(".practice-result-stats")?.textContent).toContain("%Accuracy")
	})

	it("validates a custom practice passage and ignores shortcut keys while typing", async () => {
		const back=vi.fn()
		await act(() => root.render(<PracticeScreen onBack={back} />))
		await click('.practice-actions button:first-child')
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
		await act(async () => (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "x", ctrlKey: true, bubbles: true })))
		expect(host.querySelector('[data-testid="practice-passage"] .next')?.textContent).toBe("a")
		await act(async () => (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
		await click(".practice-actions button:first-child")
		expect(host.querySelector('[data-testid="practice-screen"] button[type="submit"]')).not.toBeNull()
		await click(".practice-header button.pixel-action.secondary")
		expect(back).toHaveBeenCalledOnce()
	})

	it("stops a challenge at its first fatal typo even when mobile input commits multiple characters", async () => {
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "custom") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!, "abc") })
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice challenge"]')!, "perfect") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		const input = host.querySelector<HTMLInputElement>(".typing-native-input")!
		await act(() => {
			Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "xabc")
			input.dispatchEvent(new InputEvent("input", { bubbles: true }))
		})
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("Precision lesson ended")
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).not.toContain("Good run")
		expect(localStorage.getItem("typecade:practice:best")).toBeNull()
	})

	it("plays practice with blocked storage and ignores corrupt best scores", async () => {
		localStorage.setItem("typecade:practice:best", "broken")
		await practice()
		expect(host.textContent).toContain("Best 0 WPM")
		localStorage.setItem("typecade:practice:best", "-5")
		await act(() => root.unmount())
		root = createRoot(host)
		await practice()
		expect(host.textContent).toContain("Best 0 WPM")
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked") })
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked") })
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "custom") })
		await act(async () => { await userEvent.fill(host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!, "abc") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		await act(() => { for (const key of "abc") host.querySelector(".typing-native-input")!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })) })
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("Good run")
	})

	it("ends Three Attempts practice after the third mistake", async () => {
		const back=vi.fn()
		await act(() => root.render(<PracticeScreen onBack={back} />))
		await click('.practice-actions button:first-child')
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "custom") })
		const passage = host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!
		await act(async () => { await userEvent.fill(passage, "abc") })
		const challenge = host.querySelector<HTMLSelectElement>('[aria-label="Practice challenge"]')!
		await act(async () => { await userEvent.selectOptions(challenge, "three-hulls") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		for (const key of ["x", "y", "z"]) {
			await act(() => (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })))
		}
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("Three attempts used")
	})

	it("ends Precision on its first typo", async () => {
		const back=vi.fn()
		await act(() => root.render(<PracticeScreen onBack={back} />))
		await click('.practice-actions button:first-child')
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "custom") })
		const passage = host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!
		await act(async () => { await userEvent.fill(passage, "abc") })
		const challenge = host.querySelector<HTMLSelectElement>('[aria-label="Practice challenge"]')!
		await act(async () => { await userEvent.selectOptions(challenge, "perfect") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		await act(() => (host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true })))
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("Precision lesson ended")
	})

	it("finishes timed practice when the configured clock expires", async () => {
		const back=vi.fn()
		await act(() => root.render(<PracticeScreen onBack={back} />))
		await click('.practice-actions button:first-child')
		const format = host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!
		await act(async () => { await userEvent.selectOptions(format, "time") })
		const duration = host.querySelector<HTMLInputElement>('[aria-label="Practice duration"]')!
		await act(async () => { await userEvent.fill(duration, "1") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		await act(() => host.querySelector<HTMLInputElement>(".typing-native-input")!.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true })))
		await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 1250)) })
		expect(host.querySelector('[data-testid="practice-result"]')?.textContent).toContain("SESSION COMPLETE")
	})

	it("runs quote practice with monospace text and rejects modified or navigation keys", async () => {
		localStorage.setItem("typecade:practice:best", "999")
		const onBack = vi.fn()
		await practice(onBack)
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
			;(host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true }))
			;(host.querySelector(".typing-native-input") ?? window).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
		})
		expect(host.querySelectorAll('[data-testid="practice-passage"] .done')).toHaveLength(initial)
		await act(async () => { await userEvent.click(host.querySelector<HTMLButtonElement>(".practice-racing button")!) })
		expect(host.querySelector('[data-testid="practice-racing"]')).toBeNull()
		expect(host.querySelector('[aria-label="Quote difficulty"]')).not.toBeNull()
		expect(onBack).not.toHaveBeenCalled()
	})

	it("edits practice mistakes, restarts the same text and shuffles through buttons and shortcuts", async () => {
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "custom"); await userEvent.fill(host.querySelector<HTMLTextAreaElement>('[aria-label="Custom passage"]')!, "one two three") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		const key = async (key: string, options = {}) => act(() => host.querySelector<HTMLInputElement>('.typing-native-input')!.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,...options})))
		await key("x")
		expect(host.querySelector('.incorrect')?.textContent).toBe("o")
		await key("Backspace")
		expect(host.querySelector('.incorrect')).toBeNull()
		await key("o")
		await key("Tab")
		expect(host.querySelectorAll('.done')).toHaveLength(0)
		expect(host.querySelector('[data-testid="practice-passage"]')?.textContent).toBe("one two three")
		await key("Enter",{shiftKey:true})
		await click('.practice-actions button:nth-child(2)')
		await click('.practice-actions button:last-child')
		expect(document.activeElement).toBe(host.querySelector('.typing-native-input'))
		await click('.practice-actions button:first-child')
		await act(async () => userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice typing style"]')!, "classic"))
		await click('[data-testid="practice-screen"] button[type="submit"]')
		expect(host.querySelector<HTMLElement>('.rolling-passage')!.style.height).toBe("4em")
		await act(() => { for (const key of "one two three") host.querySelector<HTMLInputElement>('.typing-native-input')!.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true})) })
		expect(host.querySelector('[data-testid="practice-result"]')).toBeNull()
		await key(" ")
		expect(host.querySelector('[data-testid="practice-result"]')).not.toBeNull()
	})

	it("extends timed practice and pauses its deadline while input focus is elsewhere", async () => {
		await practice()
		await act(async () => { await userEvent.selectOptions(host.querySelector<HTMLSelectElement>('[aria-label="Practice text format"]')!, "time"); await userEvent.fill(host.querySelector<HTMLInputElement>('[aria-label="Practice duration"]')!, "10") })
		await click('[data-testid="practice-screen"] button[type="submit"]')
		let now = 10000
		vi.spyOn(Date,'now').mockImplementation(()=>now)
		const target = host.querySelector('[data-testid="practice-passage"]')!.textContent!
		await act(() => { for (const key of target) host.querySelector<HTMLInputElement>('.typing-native-input')!.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true})) })
		expect(host.querySelector('[data-testid="practice-passage"]')!.textContent!.length).toBeGreaterThan(target.length)
		await act(() => host.querySelector<HTMLInputElement>('.typing-native-input')!.blur())
		now += 20000
		await act(async () => { await new Promise((resolve)=>setTimeout(resolve,150)) })
		expect(host.querySelector('[data-testid="practice-result"]')).toBeNull()
		await click('.practice-refocus')
		expect(host.querySelector('.practice-refocus')).toBeNull()
		now += 10000
		await act(async () => { await new Promise((resolve)=>setTimeout(resolve,150)) })
		expect(host.querySelector('[data-testid="practice-result"]')).not.toBeNull()
	})

	it("types with the pixel keyboard including shift, numbers, symbols and backspace", async () => {
		const onKey = vi.fn()
		await act(() => root.render(<PracticeKeyboard onKey={onKey} />))
		await click('button[aria-label="Shift"]')
		await click('button[aria-label="Backspace"]')
		const pointer = new PointerEvent('pointerdown',{bubbles:true,cancelable:true})
		await act(() => host.querySelector('button[aria-label="q"]')!.dispatchEvent(pointer))
		expect(pointer.defaultPrevented).toBe(true)
		await click('button[aria-label="q"]')
		await click('button[aria-label="q"]')
		await click('button[aria-label="Space"]')
		await click('button[aria-label="Backspace"]')
		await click('button[aria-label="123"]')
		await click('button[aria-label="1"]')
		await click('button[aria-label="More"]')
		await click('button[aria-label="€"]')
		await click('button[aria-label="123"]')
		await click('button[aria-label="ABC"]')
		await click('button[aria-label="Shift"]')
		await click('button[aria-label="Shift"]')
		expect(onKey.mock.calls.map(([key])=>key)).toEqual(["Backspace","Q","q"," ","Backspace","1","€"])
	})

	it("offers Caps Lock and highlights the case change an expected capital needs", async () => {
		const onKey = vi.fn()
		await act(() => root.render(<PracticeKeyboard onKey={onKey} expectedKey="C" />))
		expect(host.querySelector('button[aria-label="CapsLock"]')!.className).toContain("expected-key")
		expect(host.querySelector('button[aria-label="c"]')!.className).not.toContain("expected-key")
		await click('button[aria-label="CapsLock"]')
		expect(host.querySelector('button[aria-label="CapsLock"]')!.getAttribute("aria-pressed")).toBe("true")
		expect(host.querySelector('button[aria-label="c"]')!.className).toContain("expected-key")
		await click('button[aria-label="c"]')
		await click('button[aria-label="c"]')
		await click('button[aria-label="Shift"]')
		await click('button[aria-label="c"]')
		expect(onKey.mock.calls.map(([key])=>key)).toEqual(["C","C","c"])
		await act(() => root.render(<PracticeKeyboard onKey={onKey} expectedKey="c" />))
		expect(host.querySelector('button[aria-label="c"]')!.textContent).toBe("C")
		expect(host.querySelector('button[aria-label="Shift"]')!.className).toContain("expected-key")
		await click('button[aria-label="CapsLock"]')
		expect(host.querySelector('button[aria-label="CapsLock"]')!.getAttribute("aria-pressed")).toBe("false")
		expect(host.querySelector('button[aria-label="c"]')!.className).toContain("expected-key")
		await act(() => root.render(<PracticeKeyboard onKey={onKey} expectedKey="!" />))
		expect(host.querySelector('button[aria-label="Shift"]')!.className).not.toContain("expected-key")
		await click('button[aria-label="123"]')
		expect(host.querySelector('button[aria-label="!"]')!.className).toContain("expected-key")
	})


})
