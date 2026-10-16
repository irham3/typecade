import { useEffect, useRef, type RefObject } from "react"

export function TypingPassage({ text: fullText, cursor: fullCursor, className, testId, fontSize, monospace = false, mistake = false, rollingLines, typedText: fullTypedText }: { text: string; cursor: number; className: string; testId: string; fontSize?: number; monospace?: boolean; mistake?: boolean; rollingLines?: 2 | 3; typedText?: string }) {
	// Keep long endless/timed streams bounded in the DOM while retaining word boundaries.
 const start = fullCursor > 160 ? Math.max(fullCursor - 120, fullText.lastIndexOf(" ", fullCursor - 80) + 1) : 0
	const boundary = fullText.indexOf(" ", fullCursor + 240)
	const end = Math.min(fullCursor + 320, boundary < 0 ? fullText.length : boundary)
	const text = fullText.slice(start, end)
	const cursor = fullCursor - start
	const typedText = fullTypedText?.slice(start, end)
	const container = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const box = container.current!
		const followCursor = () => {
			const next = box.querySelector<HTMLElement>(".next")
			if (!next) return
			if (rollingLines) {
				const content = box.firstElementChild as HTMLElement
				const lineHeight = parseFloat(getComputedStyle(content).lineHeight)
				const word = next.closest<HTMLElement>(".typing-word")!
				const top = rollingLines === 2 && !word.classList.contains("long") ? word.offsetTop : next.offsetTop
				const line = Math.floor((top + 2) / lineHeight)
				content.style.transform = `translateY(-${Math.max(0, line - (rollingLines === 3 ? 1 : 0)) * lineHeight}px)`
			} else box.scrollTop = Math.max(0, next.offsetTop - box.clientHeight / 3)
		}
		followCursor()
		const observer = new ResizeObserver(followCursor)
		observer.observe(box)
		return () => observer.disconnect()
	}, [cursor, text, rollingLines, fontSize])
	let offset = 0
	return <div ref={container} className={`${className} typing-passage ${monospace ? "mono" : ""} ${rollingLines ? "rolling-passage" : ""}`} data-testid={testId} style={{ fontSize, ...(rollingLines ? { height: `${rollingLines * 2}em` } : {}) }} aria-label="Typing passage">
		<div className="typing-lines">
		{text.split(/(\s+)/).map((word, index) => <span className={`typing-word${word.length > 32 ? " long" : ""}`} key={index}>{Array.from(word).map((char) => {
			const position = offset
			offset += char.length
			return <span key={position} className={position < cursor ? typedText !== undefined && typedText.slice(position, position + char.length) !== char ? "incorrect" : "done" : position === cursor ? `next ${mistake ? "mistake" : ""}` : "ghost"}>{char}</span>
		})}</span>)}
		</div>
	</div>
}

export function TypingInput({ label, onType, disabled = false, onEscape, inputRef, testId, displayValue, onRestart, onShuffle, onFocusChange, inputMode }: { label: string; onType: (key: string) => void; disabled?: boolean; onEscape?: () => void; inputRef?: RefObject<HTMLInputElement | null>; testId?: string; displayValue?: string; onRestart?: () => void; onShuffle?: () => void; onFocusChange?: (focused: boolean) => void; inputMode?: "none" }) {
	const ownRef = useRef<HTMLInputElement>(null)
	const ref = inputRef ?? ownRef
	const composing = useRef(false)
	useEffect(() => { if (!disabled) ref.current?.focus({preventScroll:true}) }, [disabled, ref])
	const typeText = (text: string) => { for (const char of text) onType(char) }
	const commitInput = (value: string) => {
		if (displayValue !== undefined && value.length < displayValue.length) {
			for (let index = value.length; index < displayValue.length; index++) onType("Backspace")
		} else typeText(value.slice(displayValue?.length ?? 0))
	}
	return <input ref={ref} className="typing-native-input" aria-label={label} data-testid={testId} value={displayValue} inputMode={inputMode} disabled={disabled} placeholder={disabled ? "Typing paused" : "Type the highlighted character…"} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
		onFocus={() => onFocusChange?.(true)} onBlur={event => { onFocusChange?.(false); if (!onFocusChange&&(!event.relatedTarget||event.relatedTarget===ref.current?.closest("dialog"))) queueMicrotask(() => { if (document.activeElement === document.body || document.activeElement === ref.current?.closest("dialog")) ref.current?.focus({preventScroll:true}) }) }}
		onPaste={(event) => event.preventDefault()}
		onKeyDown={(event) => {
			if (event.repeat) { event.preventDefault(); return }
			if (onRestart && !event.nativeEvent.isComposing && !composing.current) {
				if (!event.ctrlKey && !event.metaKey && !event.altKey) {
					if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Delete"].includes(event.key)) { event.preventDefault(); return }
					if (event.key === "Tab" && !event.shiftKey) { event.preventDefault(); onRestart(); return }
					if (event.key === "Enter" && event.shiftKey && onShuffle) { event.preventDefault(); onShuffle(); return }
				}
				if (event.key === "Backspace" && (event.ctrlKey || event.altKey)) { event.preventDefault(); onType("DeleteWord"); return }
			}
			if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing || composing.current) return
			if (event.key === "Escape" && onEscape) { event.preventDefault(); onEscape(); return }
			if (Array.from(event.key).length === 1 || event.key === "Enter" || event.key === "Backspace") {
				event.preventDefault()
				onType(event.key)
			}
		}}
		onCompositionStart={() => { composing.current = true }}
		onCompositionEnd={(event) => { composing.current = false; commitInput(event.currentTarget.value); if (displayValue === undefined) event.currentTarget.value = "" }}
		onChange={(event) => { if (!composing.current) { commitInput(event.currentTarget.value); if (displayValue === undefined) event.currentTarget.value = "" } }} />
}
