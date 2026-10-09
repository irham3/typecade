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
