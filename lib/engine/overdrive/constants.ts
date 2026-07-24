export const STAGE_DURATION_MS = 60_000
export const WORDS_PER_MULT = 10        // +1 Mult per 10 clean words
export const ENDLESS_QUOTA_FACTOR = 1.8 // quota x1.8^n after Zone 8

// Copy this table 1:1 from docs/game-design.md §3.
export const QUOTA: Record<number, { warmup: number; rush: number; glitch: number }> = {
	1: { warmup: 300, rush: 450, glitch: 600 },
	2: { warmup: 800, rush: 1200, glitch: 1600 },
	3: { warmup: 2000, rush: 3000, glitch: 4000 },
	4: { warmup: 5000, rush: 7500, glitch: 10000 },
	5: { warmup: 11000, rush: 16500, glitch: 22000 },
	6: { warmup: 20000, rush: 30000, glitch: 40000 },
	7: { warmup: 35000, rush: 52000, glitch: 70000 },
	8: { warmup: 50000, rush: 75000, glitch: 100000 },
}

// Economy, from docs/game-design.md §4:
export const CLEAR_REWARD = { warmup: 3, rush: 4, glitch: 5 } as const
export const TIME_BONUS_PER_10S = 1
export const INTEREST_PER_5_TOKENS = 1
export const INTEREST_CAP = 5
export const WARMUP_SKIP_REWARD = 1
