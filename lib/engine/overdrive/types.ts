export type StageType = "warmup" | "rush" | "glitch"
export type RunMode = "free" | "daily" | "practice"
export type WordPoolLanguage = "EN" | "ID"
export type ThreatBand = "protected" | "pressure" | "overclocked" | "lethal"

export type Screen =
	| "menu"
	| "stage"
	| "stageResult"
	| "shop"
	| "standardClear"
	| "runOver"

export type TokenBreakdown = {
	clearReward: number
	timeBonus: number
	interest: number
	totalEarned: number
}

export type ItemImpact = {
	triggers: number
	score: number
	tokens: number
	timeMs: number
	protections: number
}

export type RunSnapshot = {
	screen: Screen
	mode: RunMode
	language: WordPoolLanguage
	zone: number
	stage: StageType
	endless: boolean
	timeLeftMs: number
	stageDurationMs: number
	aegisActive: boolean
	aegisRescues: number
	stageRescued: boolean
	focusPaused: boolean
	threatBand: ThreatBand
	overdriveCharge: number
	targetOrdinal: number
	score: number
	runScore: number
	standardScore: number
	endlessScore: number
	finalScore?: number
	tokenBreakdown?: TokenBreakdown
	quota: number
	combo: number
	maxCombo: number
	mult: number
	tokens: number
	totalTokensEarned: number
	accuracy: number
	runAccuracy: number
	wpm: number
	averageWpm: number
	cleanWords: number
	totalCleanWords: number
	highestMult: number
	stageTypos: number
	totalTypos: number
	runDurationMs: number
	seed: string
	currentWord: string
	caretIndex: number
	wordDirty: boolean
	upcomingWords: string[]
	win?: boolean
	keycaps: string[]
	macros: string[]
	shopKeycaps: string[]
	shopMacro: string | null
	rerollCost: number
	activeGlitch: string | null
	glitchState: Record<string, boolean | number | string> | null
	stageItemImpact: Record<string, ItemImpact>
	runItemImpact: Record<string, ItemImpact>
}

export type ItemContribution = {
	kind: "base" | "mult" | "score" | "time" | "token" | "protection" | "quota"
	amount: number
	label: string
}

export type EngineEvents = {
	word_complete: {
		word: string
		characterBase: number
		itemBaseBonus: number
		effectiveBase: number
		effectiveMult: number
		finalMultiplier: number
		scoreGain: number
		overdriveReleased: boolean
		aegisRecovery: boolean
		autoExecuted: boolean
		appliedItemIds: string[]
		combo: number
	}
	typo: { expected: string; got: string; ignored: boolean }
	character_accepted: {
		character: string
		caretIndex: number
		charge: number
		becameReady: boolean
	}
	overdrive_ready: { charge: number }
	overdrive_released: { word: string; scoreGain: number }
	aegis_rescue: {
		zone: number
		stage: StageType
		rescueNumber: number
		timeAddedMs: number
	}
	focus_pause: { idleMs: number }
	focus_resume: { timeLeftMs: number }
	mult_change: { mult: number }
	mult_increased: { mult: number }
	quota_progress: { score: number; quota: number }
	stage_clear: { zone: number; stage: StageType; tokensEarned: number; timeLeftMs: number }
	stage_fail: { zone: number; stage: StageType; reason: "timeout" | "sudden_death" | "time_penalty" }
	run_over: { win: boolean; finalScore: number; zoneReached: number }
	item_triggered: {
		itemId: string
		trigger: string
		contribution: ItemContribution
	}
	macro_used: {
		itemId: string
		result: string
	}
}
