import type {
	RunMode,
	StageType,
	WordPoolLanguage,
} from "@/lib/engine/overdrive"

export const OVERDRIVE_RULESET_VERSION = "mvp-2026-07-26-beginner-route"
export const OVERDRIVE_RNG_VERSION = "mulberry32-v1"
export const OVERDRIVE_WORD_POOL_VERSION = "2026-07-25"

export type TelemetryContext = {
	seed: string
	mode: RunMode
	language: WordPoolLanguage
	rulesetVersion: string
	rngVersion: string
	wordPoolVersion: string
}

export interface TelemetryEvents {
	run_start: TelemetryContext & { zone: number }
	run_abandon: TelemetryContext & { zone: number; stage: StageType; score: number }
	run_restart: TelemetryContext & { previousScore: number }
	stage_start: TelemetryContext & { zone: number; stage: StageType; quota: number }
	stage_clear: TelemetryContext & {
		zone: number
		stage: StageType
		score: number
		tokensEarned: number
		timeLeftMs: number
	}
	run_end: TelemetryContext & {
		win: boolean
		zone: number
		finalScore: number
		durationMs: number
	}
	death_by_zone: TelemetryContext & {
		zone: number
		stage: StageType
		wpm: number
		score: number
	}
	shop_offer: TelemetryContext & {
		zone: number
		keycaps: string[]
		macro: string | null
		firmware?: string | null
		rerollCost: number
	}
	shop_buy: TelemetryContext & {
		itemId: string
		itemType: "keycap" | "macro" | "firmware"
		price: number
		zone: number
	}
	shop_sell: TelemetryContext & {
		itemId: string
		itemType: "keycap" | "macro"
		value: number
		zone: number
	}
	item_proc: TelemetryContext & {
		itemId: string
		trigger: string
		zone: number
		stage: StageType
	}
	macro_use: TelemetryContext & {
		itemId: string
		result: string
		zone: number
		stage: StageType
	}
	glitch_start: TelemetryContext & {
		glitchId: string
		zone: number
	}
	presentation_health: TelemetryContext & {
		scope: "stage" | "run"
		stage: StageType | "run"
		sampleCount: number
		frameP50Ms: number
		frameP95Ms: number
		frameP99Ms: number
		cueLatencyP50Ms: number
		cueLatencyP95Ms: number
		cueLatencyP99Ms: number
		hitLatencyP50Ms: number
		hitLatencyP95Ms: number
		hitLatencyP99Ms: number
		lateCueCount: number
		lateHitCount: number
		decorativeDropCount: number
		peakLiveEffects: number
		peakUnsettledContacts: number
	}
}

export type TelemetryEventName = keyof TelemetryEvents

export type TelemetryEnvelope<T extends TelemetryEventName = TelemetryEventName> = {
	name: T
	payload: TelemetryEvents[T]
	timestamp: number
}

/**
 * Typed transport boundary. Product analytics can subscribe to the browser
 * event without coupling the game to a vendor SDK.
 */
export function trackEvent<T extends TelemetryEventName>(
	name: T,
	payload: TelemetryEvents[T],
): TelemetryEnvelope<T> {
	const envelope: TelemetryEnvelope<T> = {
		name,
		payload,
		timestamp: Date.now(),
	}
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("typecade:telemetry", { detail: envelope }))
	}
	return envelope
}
