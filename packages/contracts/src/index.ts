export const CONTENT_VERSION = "ocean-m1-2026-08-23-polish" as const

export type Rarity = "common" | "uncommon" | "rare" | "boss"

export type FishBehavior =
	| "calm"
	| "darting"
	| "armored"
	| "tricky"
	| "swarm"
	| "predator"
	| "boss"

export type FishState =
	| "idle"
	| "swim"
	| "bite"
	| "struggle"
	| "stunned"
	| "caught"
	| "escape"

export type SkillType = "active" | "passive"

export type SkillEffect =
	| "instant_small_capture"
	| "ignore_first_typo_per_encounter"
	| "reveal_route_rewards"
	| "slow_fish_pressure"
	| "perfect_streak_rare_odds"
	| "fifth_perfect_word_bonus_progress"

export type ZoneId = "zone_1" | "zone_2" | "zone_3"

export interface RewardTable {
	coins: number
	materials: number
	xp: number
}

export interface FishSpecies {
	id: string
	name: string
	rarity: Rarity
	habitat: ZoneId
	behavior: FishBehavior
	typingProfile: "short_steady" | "short_burst" | "long_words" | "tricky_pairs" | "many_short" | "medium_burst" | "boss_mixed"
	baseSizeKg: number
	baseDifficulty: number
	baseTimeMs: number
	progressPerWord: number
	tensionOnTypo: number
	durabilityOnTypo: number
	idlePressurePerSecond: number
	assetKey: string
	lore: string
	reward: RewardTable
}

export interface FishingSkill {
	id: string
	name: string
	type: SkillType
	rarity: "common" | "uncommon" | "rare"
	effect: SkillEffect
	rankedAllowed: false
	description: string
}

export interface RouteNode {
	id: string
	zoneId: ZoneId
	name: string
	risk: number
	rewardMultiplier: number
	fishIds: string[]
}

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

export type EncounterStatus = "active" | "caught" | "escaped"

export interface EncounterState {
	id: string
	seed: string
	fishId: string
	status: EncounterStatus
	progress: number
	tension: number
	durability: number
	combo: number
	perfectWords: number
	skillEnergy: number
	elapsedMs: number
	timeRemainingMs: number
	steelLineAvailable: boolean
	calmCurrentRemainingMs: number
	bossPhase: 1 | 2 | 3
	lastEventId: number
}

export interface CatchResult {
	idempotencyKey: string
	fishId: string
	caught: boolean
	quality: number
	sizeKg: number
	rewards: RewardTable
	secured: boolean
	bossPhase: 1 | 2 | 3
}

export interface CollectionRecord {
	fishId: string
	largestSizeKg: number
	bestQuality: number
	count: number
	firstCaughtAt: string
	lastCaughtAt: string
}

export interface CollectionState {
	records: Record<string, CollectionRecord>
	coins: number
	materials: number
	xp: number
	grantedResultKeys: string[]
}

export interface AccountLevelProgress {
	level: number
	currentXp: number
	currentLevelXp: number
	nextLevelXp: number
	progress: number
}

export interface ExpeditionCheckpoint {
	zoneId: ZoneId
	securedResultKeys: string[]
	rewards: RewardTable
}

export interface ExpeditionState {
	seed: string
	contentVersion: typeof CONTENT_VERSION
	currentZoneIndex: number
	currentEncounterIndex: number
	spareLines: number
	selectedSkillIds: string[]
	checkpoints: ExpeditionCheckpoint[]
	pendingResults: CatchResult[]
	complete: boolean
}

export interface GameEventMap {
	"game:paused": {
		paused: boolean
	}
	"character:correct": {
		key: string
		expected: string
		progress: number
		combo: number
	}
	"encounter:started": {
		encounter: EncounterState
		fish: FishSpecies
		targetText: string
	}
	"fish:hooked": {
		fish: FishSpecies
	}
	"word:completed": {
		word: string
		perfect: boolean
		combo: number
	}
	"typo:occurred": {
		key: string
		expected: string
		ignoredBySteelLine: boolean
	}
	"combo:changed": {
		combo: number
	}
	"line:changed": {
		tension: number
		durability: number
		progress: number
		timeRemainingMs: number
	}
	"skill:used": {
		skillId: string
		label: string
	}
	"phase:changed": {
		phase: 1 | 2 | 3
	}
	"catch:resolved": {
		result: CatchResult
	}
	"run:checkpoint": {
		checkpoint: ExpeditionCheckpoint
	}
	"run:completed": {
		expedition: ExpeditionState
		collection: CollectionState
	}
	"level:up": {
		fromLevel: number
		toLevel: number
		xp: number
	}
	"audio:play": {
		key: string
		category: "music" | "environment" | "gameplay" | "typing"
	}
	"settings:volumes": {
		music: number
		environment: number
		gameplay: number
		typing: number
	}
	"settings:effects": {
		reducedMotion: boolean
	}
	"screen:changed": {
		screen: "menu" | "prep" | "game"
	}
}
