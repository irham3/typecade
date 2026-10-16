export interface TypingMetrics {
	wpm: number
	rawWpm: number
	accuracy: number
	combo: number
	maxCombo: number
	consistency: number
	correctKeystrokes: number
	incorrectKeystrokes: number
	progress: number
	elapsedMs: number
}

export type TypingEventType =
	| "correct-char"
	| "typo"
	| "word-complete"
	| "combo"
	| "passage-complete"
	| "ignored"

export interface TypingEvent {
	type: TypingEventType
	timestampMs: number
	index: number
	key: string
	expected?: string
	word?: string
	perfect?: boolean
	combo?: number
	metrics: TypingMetrics
}

export interface CompactInputLogEntry {
	t: number
	k: string
	i: number
	ok: 0 | 1
}

export * from "./survival"
