export type StageType = "warmup" | "rush" | "glitch"

export type Screen = "menu" | "stage" | "stageResult" | "shop" | "runOver"

export type RunSnapshot = {
	screen: Screen
	zone: number
	stage: StageType
	timeLeftMs: number
	score: number
	runScore: number
	finalScore?: number
	tokenBreakdown?: { clearReward:number; timeBonus:number; interest:number; totalEarned:number }
	quota: number
	combo: number
	mult: number
	tokens: number
	accuracy: number
	currentWord: string
	caretIndex: number
	wordDirty: boolean
	upcomingWords: string[]
	win?: boolean
	// Shop & Inventory
	keycaps: string[]
	macros: string[]
	shopKeycaps: string[]
	shopMacro: string | null
	rerollCost: number
	// Glitch state
	activeGlitch: string | null
	glitchState?: any
}

export type EngineEvents = {
	word_complete: { word: string; gained: number; combo: number; mult: number }
	typo: { expected: string; got: string }
	mult_change: { mult: number }
	quota_progress: { score: number; quota: number }
	stage_clear: { zone: number; stage: StageType; tokensEarned: number; timeLeftMs: number }
	stage_fail: { zone: number; stage: StageType }
	run_over: { win: boolean; finalScore: number; zoneReached: number }
}

export type Modifiers = {
	baseBonus: number
	multAdd: number
	comboBatteryActive: boolean
	baseMultiplier: number
	finalMultiplier: number
	interestCap: number
	multMultiplier: number
	preventMultReset: boolean
	glitchCancelled: boolean
}

