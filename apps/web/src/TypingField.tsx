import { useEffect, useRef, type RefObject } from "react"

export function TypingPassage({ text, cursor, className, testId, fontSize, monospace = false, mistake = false }: { text: string; cursor: number; className: string; testId: string; fontSize?: number; monospace?: boolean; mistake?: boolean }) {
	const container = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const box = container.current!
		const next = box.querySelector<HTMLElement>(".next")
		if (next) box.scrollTop = Math.max(0, next.offsetTop - box.offsetTop - box.clientHeight / 3)
	}, [cursor, text])
	let offset = 0
	return <div ref={container} className={`${className} typing-passage ${monospace ? "mono" : ""}`} data-testid={testId} style={{ fontSize }} aria-label="Typing passage">
		{text.split(/(\s+)/).map((word, index) => <span className="typing-word" key={index}>{Array.from(word).map((char) => {
			const position = offset
			offset += char.length
			return <span key={position} className={position < cursor ? "done" : position === cursor ? `next ${mistake ? "mistake" : ""}` : "ghost"}>{char}</span>
		})}</span>)}
	</div>
}

export function TypingInput({ label, onType, disabled = false, onEscape, inputRef, testId }: { label: string; onType: (key: string) => void; disabled?: boolean; onEscape?: () => void; inputRef?: RefObject<HTMLInputElement | null>; testId?: string }) {
	const ownRef = useRef<HTMLInputElement>(null)
	const ref = inputRef ?? ownRef
	const composing = useRef(false)
	useEffect(() => { if (!disabled) ref.current?.focus() }, [disabled, ref])
	const typeText = (text: string) => { for (const char of text) onType(char) }
	return <input ref={ref} className="typing-native-input" aria-label={label} data-testid={testId} disabled={disabled} placeholder={disabled ? "Typing paused" : "Type the highlighted character…"} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
		onPaste={(event) => event.preventDefault()}
		onKeyDown={(event) => {
			if (event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing || composing.current) return
			if (event.key === "Escape" && onEscape) { event.preventDefault(); onEscape(); return }
			if (Array.from(event.key).length === 1 || event.key === "Enter" || event.key === "Backspace") {
				event.preventDefault()
				onType(event.key)
			}
		}}
		onCompositionStart={() => { composing.current = true }}
		onCompositionEnd={(event) => { composing.current = false; typeText(event.currentTarget.value); event.currentTarget.value = "" }}
		onChange={(event) => { if (!composing.current) { typeText(event.currentTarget.value); event.currentTarget.value = "" } }} />
}
