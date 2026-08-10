export const STAGE_DURATION_BY_TYPE = {
	warmup: 75_000,
	rush: 70_000,
	glitch: 65_000,
} as const
export const STAGE_DURATION_MS = STAGE_DURATION_BY_TYPE.warmup
export const AEGIS_PROTECTED_ZONE_MAX = 2
export const AEGIS_RESCUE_MS = 30_000
export const FOCUS_PAUSE_IDLE_MS = 4_000
export const OVERDRIVE_CHARGE_MAX = 100
export const OVERDRIVE_CHARGE_PER_CHARACTER = 3
export const OVERDRIVE_TYPO_DRAIN = 15
export const OVERDRIVE_SCORE_MULTIPLIER = 2
export const WORDS_PER_MULT = 10
export const ENDLESS_QUOTA_FACTOR = 1.8

export const QUOTA: Record<number, { warmup: number; rush: number; glitch: number }> = {
	1: { warmup: 5, rush: 8, glitch: 12 },
	2: { warmup: 8, rush: 12, glitch: 18 },
	3: { warmup: 60, rush: 90, glitch: 130 },
	4: { warmup: 180, rush: 260, glitch: 380 },
	5: { warmup: 500, rush: 700, glitch: 1000 },
	6: { warmup: 1200, rush: 1800, glitch: 2500 },
	7: { warmup: 3000, rush: 4500, glitch: 6000 },
	8: { warmup: 7000, rush: 9000, glitch: 12000 },
}

export const CLEAR_REWARD = { warmup: 3, rush: 4, glitch: 5 } as const
export const TIME_BONUS_PER_10S = 1
export const INTEREST_PER_5_TOKENS = 1
export const INTEREST_CAP = 5
export const WARMUP_SKIP_REWARD = 1
