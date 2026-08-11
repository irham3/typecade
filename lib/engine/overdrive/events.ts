import type { CombatAction } from "./combat-actions"
import type { CombatVerb, ItemContribution, ScoreResolution, StageType } from "./types"

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
		combatActions: CombatAction[]
	}
	typo: { expected: string; got: string; ignored: boolean }
	character_accepted: {
		character: string
		caretIndex: number
		characterIndex: number
		word: string
		targetOrdinal: number
		stage: StageType
		combatVerb: CombatVerb
		actions: CombatAction[]
		charge: number
		becameReady: boolean
	}
	character_rejected: {
		character: string
		expected: string
		bufferIndex: number
		errorPositions: number[]
	}
	overdrive_ready: { charge: number }
	overdrive_released: { word: string; scoreGain: number; executionsRemaining: number }
	core_damage: {
		integrity: number
		maxIntegrity: number
		reason: "dirty-submission" | "enemy-strike" | "glitch"
	}
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
	target_selected: {
		word: string
		previousWord: string
		queueIndex: number
		targetOrdinal: number
		prefix: string
	}
	stage_clear: { zone: number; stage: StageType; tokensEarned: number; timeLeftMs: number }
	stage_fail: { zone: number; stage: StageType; reason: "timeout" | "sudden_death" | "time_penalty" | "core_breach" }
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
