export type StageType = "warmup" | "rush" | "glitch"
export type RunMode = "free" | "daily" | "practice"
export type WordPoolLanguage = "EN" | "ID"
export type ThreatBand = "protected" | "pressure" | "overclocked" | "lethal"

export type CombatVerb =
	| "signal-lock"
	| "arc-dash"
	| "chain-strike"
	| "execution-ready"
	| "misfire"

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

export type ScoreTraceOperation = "add" | "multiply" | "floor"

export type ScoreTraceSource = "word" | "item" | "combo" | "overdrive" | "aegis"

export type ScoreTraceStep = {
	id: string
	label: string
	source: ScoreTraceSource
	operation: ScoreTraceOperation
	before: number
	after: number
}

export type ScoreItemImpact = {
	itemId: string
	kind: "base" | "mult" | "final"
	scoreDelta: number
}

export type ScoreResolution = {
	word: string
	characterBase: number
	itemBaseBonus: number
	effectiveBase: number
	effectiveMult: number
	finalMultiplier: number
	total: number
	aegisRecovery: boolean
	overdriveReleased: boolean
	trace: ScoreTraceStep[]
	itemImpacts: ScoreItemImpact[]
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
	lastScoreResolution?: ScoreResolution
}

export type ItemContribution = {
	kind: "base" | "mult" | "score" | "time" | "token" | "protection" | "quota"
	amount: number
	label: string
}
