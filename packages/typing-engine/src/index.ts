import type { CompactInputLogEntry, TypingEvent, TypingMetrics } from "@typecade/contracts"

export interface TypingSessionSnapshot {
	targetText: string
	cursor: number
	currentInput: string
	metrics: TypingMetrics
	eventLog: CompactInputLogEntry[]
	complete: boolean
}

export interface TypingSessionOptions {
	startTimestampMs?: number
}

interface WordBoundary {
	start: number
	end: number
	text: string
}

const IGNORED_KEYS = new Set(["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Escape"])

export function normalizeText(text: string): string {
	return text
		.normalize("NFKC")
		.replace(/\r\n/g, "\n")
		.replace(/\u00a0/g, " ")
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201c\u201d]/g, '"')
		.replace(/[\u2013\u2014]/g, "-")
}

export function normalizeKey(key: string): string {
	if (key === "Spacebar") {
		return " "
	}
	if (key === "Enter") {
		return "\n"
	}
	return normalizeText(key)
}

export class TypingSession {
	private readonly targetText: string
	private readonly wordBoundaries: WordBoundary[]
	private cursor = 0
	private correctKeystrokes = 0
	private incorrectKeystrokes = 0
	private combo = 0
	private maxCombo = 0
	private currentWordHadTypo = false
	private currentInput = ""
	private readonly startTimestampMs: number
	private lastTimestampMs: number
	private readonly wordCompletionTimestamps: number[] = []
	private readonly wordAccuracySamples: number[] = []
	private readonly eventLog: CompactInputLogEntry[] = []

	constructor(targetText: string, options: TypingSessionOptions = {}) {
		this.targetText = normalizeText(targetText)
		this.wordBoundaries = getWordBoundaries(this.targetText)
		this.startTimestampMs = options.startTimestampMs ?? 0
		this.lastTimestampMs = this.startTimestampMs
	}

	processKey(key: string, timestampMs = Date.now()): TypingEvent[] {
		this.lastTimestampMs = Math.max(timestampMs, this.lastTimestampMs)
		const normalizedKey = normalizeKey(key)

		if (this.isComplete() || shouldIgnoreKey(key, normalizedKey)) {
			this.eventLog.push({
				t: this.lastTimestampMs,
				k: key,
				i: this.cursor,
				ok: 0,
			})

			return [
				{
					type: "ignored",
					timestampMs: this.lastTimestampMs,
					index: this.cursor,
					key,
					metrics: this.getMetrics(),
				},
			]
		}

		const expected = this.targetText[this.cursor] ?? ""
		const accepted = normalizedKey === expected
		this.eventLog.push({
			t: this.lastTimestampMs,
			k: key,
			i: this.cursor,
			ok: accepted ? 1 : 0,
		})

		if (!accepted) {
			this.incorrectKeystrokes += 1
			this.combo = 0
			this.currentWordHadTypo = true
			return [
				{
					type: "typo",
					timestampMs: this.lastTimestampMs,
					index: this.cursor,
					key: normalizedKey,
					expected,
					metrics: this.getMetrics(),
				},
				{
					type: "combo",
					timestampMs: this.lastTimestampMs,
					index: this.cursor,
					key: normalizedKey,
					combo: this.combo,
					metrics: this.getMetrics(),
				},
			]
		}

		this.cursor += normalizedKey.length
		this.correctKeystrokes += normalizedKey.length
		this.currentInput = this.targetText.slice(0, this.cursor)

		const events: TypingEvent[] = [
			{
				type: "correct-char",
				timestampMs: this.lastTimestampMs,
				index: this.cursor,
				key: normalizedKey,
				expected,
				metrics: this.getMetrics(),
			},
		]

		const completedWord = this.getCompletedWordAtCursor()
		if (completedWord) {
			const perfect = !this.currentWordHadTypo
			this.combo = perfect ? this.combo + 1 : 0
			this.maxCombo = Math.max(this.maxCombo, this.combo)
			this.wordCompletionTimestamps.push(this.lastTimestampMs)
			this.wordAccuracySamples.push(perfect ? 1 : 0)
			this.currentWordHadTypo = false

			events.push({
				type: "word-complete",
				timestampMs: this.lastTimestampMs,
				index: this.cursor,
				key: normalizedKey,
				word: completedWord.text,
				perfect,
				combo: this.combo,
				metrics: this.getMetrics(),
			})

			events.push({
				type: "combo",
				timestampMs: this.lastTimestampMs,
				index: this.cursor,
				key: normalizedKey,
				combo: this.combo,
				metrics: this.getMetrics(),
			})
		}

		if (this.isComplete()) {
			events.push({
				type: "passage-complete",
				timestampMs: this.lastTimestampMs,
				index: this.cursor,
				key: normalizedKey,
				metrics: this.getMetrics(),
			})
		}

		return events
	}

	getSnapshot(): TypingSessionSnapshot {
		return {
			targetText: this.targetText,
			cursor: this.cursor,
			currentInput: this.currentInput,
			metrics: this.getMetrics(),
			eventLog: [...this.eventLog],
			complete: this.isComplete(),
		}
	}

	getMetrics(): TypingMetrics {
		const elapsedMs = Math.max(1, this.lastTimestampMs - this.startTimestampMs)
		const elapsedMinutes = elapsedMs / 60000
		const totalKeystrokes = this.correctKeystrokes + this.incorrectKeystrokes
		const accuracy = totalKeystrokes === 0 ? 100 : (this.correctKeystrokes / totalKeystrokes) * 100

		return {
			wpm: roundMetric(this.correctKeystrokes / 5 / elapsedMinutes),
			rawWpm: roundMetric(totalKeystrokes / 5 / elapsedMinutes),
			accuracy: roundMetric(accuracy),
			combo: this.combo,
			maxCombo: this.maxCombo,
			consistency: roundMetric(this.calculateConsistency()),
			correctKeystrokes: this.correctKeystrokes,
			incorrectKeystrokes: this.incorrectKeystrokes,
			progress: roundMetric(this.cursor / Math.max(1, this.targetText.length)),
			elapsedMs,
		}
	}

	isComplete(): boolean {
		return this.cursor >= this.targetText.length
	}

	private getCompletedWordAtCursor(): WordBoundary | undefined {
		return this.wordBoundaries.find((boundary) => boundary.end === this.cursor)
	}

	private calculateConsistency(): number {
		if (this.wordCompletionTimestamps.length < 2) {
			const typoPenalty = this.incorrectKeystrokes === 0 ? 0 : Math.min(25, this.incorrectKeystrokes * 5)
			return clamp(100 - typoPenalty, 0, 100)
		}

		const intervals = this.wordCompletionTimestamps
			.slice(1)
			.map((timestamp, index) => Math.max(1, timestamp - this.wordCompletionTimestamps[index]!))
		const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length
		const variance = intervals.reduce((sum, value) => sum + (value - average) ** 2, 0) / intervals.length
		const coefficient = Math.sqrt(variance) / average
		const typoRate = this.incorrectKeystrokes / Math.max(1, this.correctKeystrokes + this.incorrectKeystrokes)

		return clamp(100 - coefficient * 45 - typoRate * 35, 0, 100)
	}
}

export function replayInputLog(targetText: string, eventLog: CompactInputLogEntry[], options: TypingSessionOptions = {}): TypingSessionSnapshot {
	const session = new TypingSession(targetText, options)
	for (const entry of eventLog) {
		session.processKey(entry.k, entry.t)
	}
	return session.getSnapshot()
}

function getWordBoundaries(targetText: string): WordBoundary[] {
	const boundaries: WordBoundary[] = []
	const matcher = /\S+/g
	let match: RegExpExecArray | null
	while ((match = matcher.exec(targetText)) !== null) {
		boundaries.push({
			start: match.index,
			end: match.index + match[0].length,
			text: match[0],
		})
	}
	return boundaries
}

function shouldIgnoreKey(rawKey: string, normalizedKey: string): boolean {
	return IGNORED_KEYS.has(rawKey) || normalizedKey.length !== 1
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

function roundMetric(value: number): number {
	return Math.round(value * 100) / 100
}
