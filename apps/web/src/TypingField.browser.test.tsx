import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { TypingInput, TypingPassage } from "./TypingField"

let host: HTMLDivElement
let root: Root
beforeEach(() => {
	;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
	host = document.createElement("div")
	document.body.append(host)
	root = createRoot(host)
})
afterEach(async () => { await act(() => root.unmount()); host.remove() })

it("types through the focused native input and preserves browser shortcuts", async () => {
	const onType = vi.fn()
	const onEscape = vi.fn()
	await act(() => root.render(<TypingInput label="Typing" onType={onType} onEscape={onEscape} />))
	const input = host.querySelector("input")!
	expect(document.activeElement).toBe(input)
	await act(async () => { await userEvent.keyboard("a{Enter}{Backspace}{Escape}") })
	expect(onType.mock.calls.map(([key]) => key)).toEqual(["a", "Enter", "Backspace"])
	expect(onEscape).toHaveBeenCalledOnce()
	for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, {}]) {
		await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, ...options })))
	}
	expect(onType).toHaveBeenCalledTimes(3)
	const paste = new Event("paste", { bubbles: true, cancelable: true })
	await act(() => input.dispatchEvent(paste))
	expect(paste.defaultPrevented).toBe(true)
	await act(() => root.render(<TypingInput label="Typing" onType={onType} disabled />))
	expect(input.disabled).toBe(true)
	await act(() => root.render(<TypingInput label="Typing" onType={onType} />))
	await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
	expect(onEscape).toHaveBeenCalledOnce()
})

it("accepts mobile input and IME composition once, without treating composition keys as typos", async () => {
	const onType = vi.fn()
	await act(() => root.render(<TypingInput label="Typing" onType={onType} />))
	const input = host.querySelector("input")!
	const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
	await act(() => {
		setValue.call(input, "ab")
		input.dispatchEvent(new InputEvent("input", { bubbles: true }))
	})
	expect(onType.mock.calls.map(([key]) => key)).toEqual(["a", "b"])
	expect(input.value).toBe("")
	await act(() => {
		input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }))
		input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }))
		setValue.call(input, "漢")
		input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }))
	})
	expect(onType).toHaveBeenCalledTimes(2)
	await act(() => input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "漢" })))
	expect(onType.mock.calls.map(([key]) => key)).toEqual(["a", "b", "漢"])
	expect(input.value).toBe("")
})

it("renders codepoint cursors, readable spaces, typo feedback, and follows long passages", async () => {
	await act(() => root.render(<TypingPassage text="a🐟 b" cursor={3} className="test-passage" testId="passage" mistake />))
	expect(host.querySelector(".typing-passage")!.textContent).toBe("a🐟 b")
	expect(host.querySelectorAll(".done")).toHaveLength(2)
	expect(host.querySelector(".next.mistake")!.textContent).toBe(" ")
	await act(() => root.render(<TypingPassage text={"wave ".repeat(100)} cursor={450} className="test-passage" testId="passage" fontSize={24} monospace />))
	const box = host.querySelector<HTMLElement>(".typing-passage")!
	box.style.cssText = "position:relative;width:120px;height:60px;overflow:auto"
	await act(() => root.render(<TypingPassage text={"wave ".repeat(100)} cursor={451} className="test-passage" testId="passage" fontSize={24} monospace />))
	expect(box.scrollTop).toBeGreaterThan(0)
	await act(() => root.render(<TypingPassage text="done" cursor={4} className="test-passage" testId="passage" />))
	expect(host.querySelector(".next")).toBeNull()
})

it("moves complete rows in a clipped two/three-line window and recomputes after resizing", async () => {
	const text = "wave ".repeat(80)
	for (const rollingLines of [2, 3] as const) {
		await act(() => root.render(<TypingPassage text={text} cursor={0} className="test-passage" testId="passage" fontSize={24} rollingLines={rollingLines} typedText="xave" />))
		const box = host.querySelector<HTMLElement>('.typing-passage')!
		box.style.cssText = `position:relative;width:180px;height:${rollingLines * 48}px;overflow:clip;font:24px/2 monospace`
		const content = box.firstElementChild as HTMLElement
		content.style.position = "relative"
		await act(() => root.render(<TypingPassage text={text} cursor={120} className="test-passage" testId="passage" fontSize={24} rollingLines={rollingLines} typedText="xave" />))
		expect(host.querySelectorAll('.incorrect').length).toBeGreaterThan(0)
		expect(box.scrollTop).toBe(0)
		const first = content.style.transform
		expect(first).not.toBe("translateY(-0px)")
		box.style.width = "100px"
		await vi.waitFor(() => expect(content.style.transform).not.toBe(first))
		const next = host.querySelector<HTMLElement>('.next')!
		const translate = Number(content.style.transform.match(/-([\d.]+)/)![1])
		expect(next.offsetTop - translate).toBeLessThan(rollingLines * 48)
		expect(box.scrollTop).toBe(0)
	}
})

it("supports editable practice input, restarts, shuffle, IME deletion and focus callbacks", async () => {
	const onType = vi.fn()
	const onRestart = vi.fn()
	const onShuffle = vi.fn()
	const onFocusChange = vi.fn()
	await act(() => root.render(<TypingInput label="Practice" onType={onType} displayValue="ab" onRestart={onRestart} onShuffle={onShuffle} onFocusChange={onFocusChange} />))
	const input = host.querySelector<HTMLInputElement>('input')!
	for (const options of [{key:"Tab"}, {key:"Tab",shiftKey:true}, {key:"Tab",ctrlKey:true}, {key:"Enter",shiftKey:true}, {key:"ArrowDown"}, {key:"Backspace",ctrlKey:true}, {key:"Backspace",altKey:true}, {key:"x",metaKey:true}]) await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { bubbles:true, cancelable:true, ...options })))
	expect(onRestart).toHaveBeenCalledOnce()
	expect(onShuffle).toHaveBeenCalledOnce()
	expect(onType.mock.calls.map(([key])=>key)).toEqual(["DeleteWord","DeleteWord"])
	const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!
	await act(() => { setValue.call(input,"a"); input.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"deleteContentBackward"})) })
	expect(onType).toHaveBeenLastCalledWith("Backspace")
	await act(() => { input.dispatchEvent(new CompositionEvent("compositionstart",{bubbles:true})); setValue.call(input,"ab漢"); input.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true})); input.dispatchEvent(new CompositionEvent("compositionend",{bubbles:true,data:"漢"})) })
	expect(onType).toHaveBeenLastCalledWith("漢")
	await act(() => input.blur())
	expect(onFocusChange).toHaveBeenCalledWith(false)
	await act(() => root.render(<TypingInput label="Practice" onType={onType} displayValue="ab" onRestart={onRestart} />))
	await act(() => input.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",shiftKey:true,bubbles:true})))
	expect(onShuffle).toHaveBeenCalledOnce()
})
