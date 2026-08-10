import type { ItemContribution, ScoreResolution, StageType } from "./types"

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
		scoreResolution: ScoreResolution
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
