import { useState } from "react"

const layouts = {
	letters: ["q w e r t y u i o p", "a s d f g h j k l", "Shift z x c v b n m Backspace", "123 , Space . -"],
	symbols: ["1 2 3 4 5 6 7 8 9 0", "@ # $ % & * - + ( )", "More ! \" ' : ; / ? Backspace", "ABC , Space . _"],
	more: ["~ ` | • √ π ÷ × { }", "\\ ^ ° = [ ] < > £ €", "123 ! \" ' : ; / ? Backspace", "ABC , Space . _"],
}

export function PracticeKeyboard({ onKey }: { onKey: (key: string) => void }) {
	const [mode, setMode] = useState<keyof typeof layouts>("letters")
	const [shift, setShift] = useState(false)
	const press = (key: string) => {
		if (key === "Shift") { setShift(!shift); return }
		if (key === "123") { setMode("symbols"); return }
		if (key === "More") { setMode("more"); return }
		if (key === "ABC") { setMode("letters"); setShift(false); return }
		onKey(key === "Space" ? " " : shift && mode === "letters" && key.length === 1 ? key.toUpperCase() : key)
		if (shift && mode === "letters" && key.length === 1) setShift(false)
	}
	return <div className="practice-keyboard" aria-label="On-screen keyboard">{layouts[mode].map((row) => <div key={row}>{row.split(" ").map((key) => <button key={key} type="button" className={key === "Space" ? "space-key" : ""} aria-label={key} aria-pressed={key === "Shift" ? shift : undefined} onPointerDown={(event) => event.preventDefault()} onClick={() => press(key)}>{key === "Backspace" ? "Del" : shift && mode === "letters" ? key.toUpperCase() : key}</button>)}</div>)}</div>
}
