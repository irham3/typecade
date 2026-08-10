import { createScorer } from "./scoring"
import {
	AEGIS_PROTECTED_ZONE_MAX,
	AEGIS_RESCUE_MS,
	CLEAR_REWARD,
	FOCUS_PAUSE_IDLE_MS,
	INTEREST_CAP,
	INTEREST_PER_5_TOKENS,
	TIME_BONUS_PER_10S,
	WARMUP_SKIP_REWARD,
} from "./constants"
import { getStageQuota, isStandardClear, nextStagePosition } from "./progression"
import { GLITCHES, KEYCAPS } from "./items"
import type { StageEndContext, StageStartContext } from "./items/registry"
import {
	forEachKeycap,
	getBuildBiasedWord,
	persistentMult,
	resetRng,
	resetRunSnapshot,
	SHOP_REROLL_BASE,
	stageDurationMs,
	threatBandForZone,
	type RunContext,
} from "./run-state"
import {
	resetRunTelemetry,
	resetStageTelemetry,
	updateTypingStats,
} from "./run-telemetry-data"

export type StageFailReason = "timeout" | "sudden_death" | "time_penalty"

function resolveItemStageEnd(ctx: RunContext, cleared: boolean) {
	const remove: number[] = []
	forEachKeycap(ctx, (id, index, base) => {
		const definition = KEYCAPS[id]
		if (!definition.onStageEnd) return
		const context: StageEndContext = {
			...base,
			cleared,
			accuracy: ctx.state.accuracy,
			stageTypos: ctx.state.stageTypos,
			removeSelf: false,
		}
		definition.onStageEnd(context)
		if (context.removeSelf) remove.push(index)
	})

	for (const index of remove.sort((a, b) => b - a)) {
		ctx.state.keycaps.splice(index, 1)
		ctx.runItemData.splice(index, 1)
		ctx.stageItemData.splice(index, 1)
	}
}

export function startStage(ctx: RunContext) {
	ctx.state.screen = "stage"
	ctx.state.stageDurationMs = stageDurationMs(ctx.state.stage)
	ctx.state.timeLeftMs = ctx.state.stageDurationMs
	ctx.state.aegisActive = !ctx.state.endless && ctx.state.zone <= AEGIS_PROTECTED_ZONE_MAX
	ctx.state.aegisRescues = 0
	ctx.state.stageRescued = false
	ctx.state.focusPaused = false
	ctx.state.threatBand = threatBandForZone(ctx.state.zone)
	ctx.state.score = 0
	ctx.state.quota = getStageQuota(ctx.state.zone, ctx.state.stage)
	ctx.state.combo = 0
	ctx.state.mult = 1
	ctx.state.accuracy = 100
	ctx.state.wpm = 0
	ctx.state.cleanWords = 0
	ctx.state.stageTypos = 0
	ctx.state.wordDirty = false
	ctx.state.caretIndex = 0
	ctx.state.stageItemImpact = {}
	ctx.state.tokenBreakdown = undefined
	ctx.state.glitchState = null
	ctx.state.currentWord = getBuildBiasedWord(ctx)
	ctx.state.upcomingWords = Array.from({ length: 8 }, () => getBuildBiasedWord(ctx))

	ctx.scorer = createScorer()
	ctx.stageItemData = ctx.state.keycaps.map(() => ({}))
	resetStageTelemetry(ctx)
	ctx.preserveMultForWord = false
	ctx.insuranceArmed = false
	ctx.stageInterestCap = INTEREST_CAP

	forEachKeycap(ctx, (id, _index, base) => {
		const definition = KEYCAPS[id]
		if (!definition.onStageStart) return
		const context: StageStartContext = { ...base, interestCap: ctx.stageInterestCap }
		definition.onStageStart(context)
		ctx.stageInterestCap = context.interestCap
	})

	if (ctx.state.stage === "glitch" && ctx.state.zone > 1) {
		const ids = Object.keys(GLITCHES).filter(
			(id) => ctx.state.zone >= 3 || id !== "sudden_death",
		)
		ctx.state.activeGlitch = ctx.glitchRng.pick(ids)
		ctx.state.glitchState = {}
		const glitch = GLITCHES[ctx.state.activeGlitch]
		if (glitch.onStageStart) {
			const context = { events: ctx.events, state: ctx.state, forceFail: false }
			glitch.onStageStart(context)
		}
	} else {
		ctx.state.activeGlitch = null
		ctx.state.glitchState = null
	}

	ctx.state.mult = persistentMult(ctx)
	ctx.state.highestMult = Math.max(ctx.state.highestMult, ctx.state.mult)
}

export function startRun(ctx: RunContext) {
	resetRng(ctx)
	resetRunSnapshot(ctx)
	ctx.runItemData = ctx.state.keycaps.map(() => ({}))
	resetRunTelemetry(ctx)
	startStage(ctx)
}

export function skipWarmup(ctx: RunContext) {
	if (
		ctx.state.screen !== "stage"
		|| ctx.state.stage !== "warmup"
		|| ctx.stageAttemptedChars > 0
		|| ctx.stageElapsedMs > 0
	) return
	ctx.state.tokens += WARMUP_SKIP_REWARD
	ctx.state.stage = "rush"
	startStage(ctx)
}

export function completeStage(ctx: RunContext) {
	if (ctx.state.screen !== "stage") return
	resolveItemStageEnd(ctx, true)

	const tokenMultiplier = Number(ctx.state.glitchState?.tokenMultiplier ?? 1)
	const clearReward = CLEAR_REWARD[ctx.state.stage]
	const timeBonus = ctx.state.stageRescued
		? 0
		: Math.floor(ctx.state.timeLeftMs / 10_000) * TIME_BONUS_PER_10S
	const interest = Math.min(
		Math.floor(ctx.state.tokens / 5) * INTEREST_PER_5_TOKENS,
		ctx.stageInterestCap,
	)
	const totalEarned = (clearReward + timeBonus + interest) * tokenMultiplier

	ctx.state.tokenBreakdown = {
		clearReward: clearReward * tokenMultiplier,
		timeBonus: timeBonus * tokenMultiplier,
		interest: interest * tokenMultiplier,
		totalEarned,
	}
	ctx.state.tokens += totalEarned
	ctx.state.totalTokensEarned += totalEarned
	ctx.state.runScore += ctx.state.score
	if (ctx.state.endless) ctx.state.endlessScore += ctx.state.score
	else ctx.state.standardScore += ctx.state.score

	ctx.events.emit("stage_clear", {
		zone: ctx.state.zone,
		stage: ctx.state.stage,
		tokensEarned: totalEarned,
		timeLeftMs: ctx.state.timeLeftMs,
	})
	ctx.state.screen = "stageResult"
	if (isStandardClear(ctx.state.zone, ctx.state.stage) && !ctx.state.endless) {
		ctx.state.win = true
	}
}

export function rescueWithAegis(ctx: RunContext): boolean {
	if (!ctx.state.aegisActive || ctx.state.screen !== "stage") return false
	ctx.state.aegisRescues += 1
	ctx.state.stageRescued = true
	ctx.state.timeLeftMs += AEGIS_RESCUE_MS
	ctx.events.emit("aegis_rescue", {
		zone: ctx.state.zone,
		stage: ctx.state.stage,
		rescueNumber: ctx.state.aegisRescues,
		timeAddedMs: AEGIS_RESCUE_MS,
	})
	return true
}

export function failStage(ctx: RunContext, reason: StageFailReason) {
	if (ctx.state.screen !== "stage") return
	resolveItemStageEnd(ctx, false)
	ctx.state.runScore += ctx.state.score
	if (ctx.state.endless) ctx.state.endlessScore += ctx.state.score
	else ctx.state.standardScore += ctx.state.score
	ctx.state.finalScore = ctx.state.runScore
	ctx.events.emit("stage_fail", { zone: ctx.state.zone, stage: ctx.state.stage, reason })
	ctx.events.emit("run_over", {
		win: false,
		finalScore: ctx.state.finalScore,
		zoneReached: ctx.state.zone,
	})
	ctx.state.screen = "runOver"
}

export function advanceStage(ctx: RunContext, ms: number) {
	if (ctx.state.screen !== "stage" || !Number.isFinite(ms) || ms <= 0) return
	ctx.state.runDurationMs += ms
	ctx.stageElapsedMs += ms

	let timerDelta = ms
	if (ctx.state.aegisActive) {
		const remainingFocusGrace = Math.max(0, FOCUS_PAUSE_IDLE_MS - ctx.stageIdleMs)
		timerDelta = Math.min(ms, remainingFocusGrace)
		ctx.stageIdleMs += ms
		if (ctx.stageIdleMs >= FOCUS_PAUSE_IDLE_MS && !ctx.state.focusPaused) {
			ctx.state.focusPaused = true
			ctx.events.emit("focus_pause", { idleMs: ctx.stageIdleMs })
		}
	} else {
		ctx.stageIdleMs += ms
		ctx.state.focusPaused = false
	}

	const delta = Math.min(timerDelta, ctx.state.timeLeftMs)
	ctx.state.timeLeftMs = Math.max(0, ctx.state.timeLeftMs - delta)
	updateTypingStats(ctx)

	if (ctx.state.timeLeftMs === 0) {
		if (ctx.state.score >= ctx.state.quota) completeStage(ctx)
		else if (!rescueWithAegis(ctx)) failStage(ctx, "timeout")
	}
}

export function continueToNextStage(ctx: RunContext, generateShop: () => void) {
	if (ctx.state.screen !== "stageResult") return
	if (ctx.state.win && !ctx.state.endless) {
		ctx.state.screen = "standardClear"
		return
	}
	ctx.state.screen = "shop"
	ctx.state.rerollCost = SHOP_REROLL_BASE
	generateShop()
}

export function leaveShop(ctx: RunContext) {
	if (ctx.state.screen !== "shop") return
	const next = nextStagePosition(ctx.state.zone, ctx.state.stage)
	ctx.state.zone = next.zone
	ctx.state.stage = next.stage
	startStage(ctx)
}

export function enterEndless(ctx: RunContext) {
	if (ctx.state.screen !== "standardClear") return
	ctx.state.endless = true
	const next = nextStagePosition(ctx.state.zone, ctx.state.stage)
	ctx.state.zone = next.zone
	ctx.state.stage = next.stage
	startStage(ctx)
}

export function finishStandardRun(ctx: RunContext) {
	if (ctx.state.screen !== "standardClear") return
	ctx.state.finalScore = ctx.state.runScore
	ctx.events.emit("run_over", {
		win: true,
		finalScore: ctx.state.finalScore,
		zoneReached: ctx.state.zone,
	})
	ctx.state.screen = "runOver"
}

export function quitToMenu(ctx: RunContext) {
	ctx.state.screen = "menu"
}
