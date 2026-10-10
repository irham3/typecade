import { normalizeText, type TypingSessionSnapshot } from "./index"

export type PracticeStyle = "modern" | "classic"

// Practice permits editing mistakes; competitive/fishing sessions keep strict input.
export class PracticeSession {
	private text: string
	private typed = ""
	private locked = 0
	private elapsed = 0
	private mistakes = 0
	private overflow = 0
	private maxCombo = 0
	private finished = false
	private keyTimes: number[] = []

	constructor(text: string, private readonly style: PracticeStyle = "modern") {
		this.text = normalizeText(text)
	}

	appendText(text: string): void {
		this.text += ` ${normalizeText(text)}`
		this.finished = false
	}

	processKey(key: string, elapsedMs: number): { typo: boolean } {
		this.elapsed = Math.max(this.elapsed, elapsedMs)
		if (this.finished) return { typo: false }
		if (key === "Backspace" || key === "DeleteWord") {
			let end = Math.max(this.locked, this.typed.length - (Array.from(this.typed).at(-1)?.length ?? 0))
			if (key === "DeleteWord") end = Math.max(this.locked, this.typed.trimEnd().lastIndexOf(" ") + 1)
			while (end > this.locked && this.typed[end - 1] === " " && this.text[end - 1] !== " ") end--
			this.typed = this.typed.slice(0, end)
			return { typo: false }
		}
		if (Array.from(key).length !== 1) return { typo: false }
		const start = this.style === "classic" ? this.locked : this.typed.lastIndexOf(" ") + 1
		if (key === " " && this.style === "classic" && start === this.typed.length) return { typo: false }
		this.keyTimes.push(this.elapsed)
		const space = this.text.indexOf(" ", this.style === "classic" ? start : this.typed.length)
		const wordEnd = space === -1 ? this.text.length : space
		const typo = key === " " ? this.typed.slice(start) !== this.text.slice(start, wordEnd) : key !== (this.style === "classic" && this.typed.length >= wordEnd ? "\0" : String.fromCodePoint(this.text.codePointAt(this.typed.length) ?? 0))
		if (typo) this.mistakes++
		if (key === " ") {
			const end = wordEnd
			const correctWord = this.typed.slice(start) === this.text.slice(start, end)
			this.overflow += Math.max(0, this.typed.length - end)
			this.typed = this.typed.slice(0, end).padEnd(end, " ") + (end < this.text.length ? " " : "")
			if (correctWord || this.style === "classic") this.locked = this.typed.length
			this.finished = this.typed.length >= this.text.length
		} else {
			this.typed += key
			this.finished = this.style === "modern" && this.typed.length >= this.text.length
		}
		this.maxCombo = Math.max(this.maxCombo, this.getSnapshot().metrics.combo)
		return { typo }
	}

	getSnapshot(elapsedMs = this.elapsed): TypingSessionSnapshot {
		this.elapsed = Math.max(this.elapsed, elapsedMs)
		const nextSpace = this.text.indexOf(" ", this.locked)
		const cursor = Math.min(this.text.length, this.typed.length, this.style === "classic" && nextSpace !== -1 ? nextSpace : this.text.length)
		let correct = 0
		let combo = 0
		for (let index = 0; index < this.typed.length; index++) {
			if (index < cursor && this.typed[index] === this.text[index]) { correct++; combo++ } else combo = 0
		}
		const minutes = Math.max(1000, this.elapsed) / 60000
		const totalTyped = this.typed.length + this.overflow
		const accuracy = totalTyped ? Math.floor(correct / totalTyped * 100) : 100
		const intervals = this.keyTimes.slice(1).map((time, index) => Math.max(1, time - this.keyTimes[index]!))
		const average = intervals.reduce((total, interval) => total + interval, 0) / Math.max(1, intervals.length)
		const variance = intervals.reduce((total, interval) => total + (interval - average) ** 2, 0) / Math.max(1, intervals.length)
		const consistency = intervals.length ? Math.max(0, Math.round(100 - Math.sqrt(variance) / average * 45)) : 100
		return {
			targetText: this.text,
			cursor,
			currentInput: this.typed,
			eventLog: [],
			complete: this.finished,
			metrics: {
				wpm: Math.floor(correct / 5 / minutes), rawWpm: Math.floor(totalTyped / 5 / minutes),
				accuracy, consistency, combo, maxCombo: this.maxCombo,
				correctKeystrokes: correct, incorrectKeystrokes: this.mistakes,
				progress: Math.min(1, this.typed.length / Math.max(1, this.text.length)), elapsedMs: this.elapsed,
			},
		}
	}
}
