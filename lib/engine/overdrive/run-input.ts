import {
	OVERDRIVE_CHARGE_MAX,
	OVERDRIVE_CHARGE_PER_CHARACTER,
	OVERDRIVE_SCORE_MULTIPLIER,
	OVERDRIVE_TYPO_DRAIN,
} from "./constants"
import { GLITCHES, KEYCAPS } from "./items"
import type {
	ScoreItemImpact,
	ScoreResolution,
	ScoreTraceStep,
} from "./types"
import type {
	TypoContext,
	WordPreviewContext,
	WordResolvedContext,
	WordScoreContext,
} from "./items/registry"
import type { StageFailReason } from "./run-lifecycle"
import {
	forEachKeycap,
	getBuildBiasedWord,
	persistentMult,
	recordImpact,
	recordScoreImpact,
	type RunContext,
} from "./run-state"
import { updateTypingStats } from "./run-telemetry-data"
import { combatVerbFor } from "./combat-grammar"
import { actionsForCharacter, actionsForWord } from "./combat-actions"
import { normalizeVisiblePrefixes, selectTarget } from "./target-selection"

type SubmissionMode = "standard" | "overdrive"

export type InputLifecycle = {
	completeStage: () => void
	failStage: (reason: StageFailReason) => void
	rescueWithAegis: () => boolean
}

export function registerInputIntent(ctx: RunContext) {
	ctx.stageIdleMs = 0
	if (!ctx.state.focusPaused) return
	ctx.state.focusPaused = false
	ctx.events.emit("focus_resume", { timeLeftMs: ctx.state.timeLeftMs })
}

export function previewItemTriggers(ctx: RunContext): string[] {
	if (ctx.state.screen !== "stage" || ctx.state.wordDirty) return []
	const triggered: string[] = []
	forEachKeycap(ctx, (id, _index, base) => {
		const definition = KEYCAPS[id]
		if (!definition.previewWord) return
		const context: WordPreviewContext = {
			word: ctx.state.currentWord,
			elapsedMs: ctx.stageElapsedMs,
			combo: ctx.state.combo + 1,
			stageData: { ...base.stageData },
			runData: { ...base.runData },
		}
		if (definition.previewWord(context)) triggered.push(id)
	})
	return triggered
}

function scoreItemImpacts(
	itemIds: readonly string[],
	baselineScore: number,
	scoreGain: number,
	context: {
		baseBonus: number
		baseMultiplier: number
		multAdd: number
		multMultiplier: number
		finalMultiplier: number
	},
): ScoreItemImpact[] {
	if (itemIds.length === 0) return []
	const scoreDelta = Math.max(0, scoreGain - baselineScore)
	if (scoreDelta <= 0) return []
	const kind = context.finalMultiplier !== 1
		? "final"
		: context.multAdd !== 0 || context.multMultiplier !== 1
			? "mult"
			: "base"
	const share = scoreDelta / itemIds.length
	return itemIds.map((itemId) => ({ itemId, kind, scoreDelta: share }))
}

function scoreResolution({
	word,
	characterBase,
	itemBaseBonus,
	effectiveBase,
	effectiveMult,
	finalMultiplier,
	total,
	aegisRecovery,
	overdriveReleased,
	appliedItemIds,
	baselineScore,
	context,
}: {
	word: string
	characterBase: number
	itemBaseBonus: number
	effectiveBase: number
	effectiveMult: number
	finalMultiplier: number
	total: number
	aegisRecovery: boolean
	overdriveReleased: boolean
	appliedItemIds: readonly string[]
	baselineScore: number
	context: {
		baseBonus: number
		baseMultiplier: number
		multAdd: number
		multMultiplier: number
		finalMultiplier: number
	}
}): ScoreResolution {
	const trace: ScoreTraceStep[] = []
	let cursor = characterBase
	trace.push({
		id: "word-base",
		label: "Word base",
		source: "word",
		operation: "add",
		before: 0,
		after: cursor,
	})
	if (itemBaseBonus !== 0 || context.baseMultiplier !== 1) {
		const next = effectiveBase
		trace.push({
			id: "item-base",
			label: "Keycap base",
			source: "item",
			operation: context.baseMultiplier !== 1 ? "multiply" : "add",
			before: cursor,
			after: next,
		})
		cursor = next
	}
	if (aegisRecovery) {
		trace.push({
			id: "aegis-base-only",
			label: "Aegis recovery",
			source: "aegis",
			operation: "floor",
			before: cursor,
			after: total,
		})
	} else {
		const multiplied = effectiveBase * effectiveMult
		trace.push({
			id: "combo-mult",
			label: "Combo Mult",
			source: "combo",
			operation: "multiply",
			before: effectiveBase,
			after: multiplied,
		})
		if (finalMultiplier !== 1 || overdriveReleased) {
			trace.push({
				id: "final-mult",
				label: overdriveReleased ? "Overdrive final" : "Final Mult",
				source: overdriveReleased ? "overdrive" : "item",
				operation: "multiply",
				before: multiplied,
				after: multiplied * finalMultiplier,
			})
		}
		trace.push({
			id: "score-floor",
			label: "Score floor",
			source: "word",
			operation: "floor",
			before: effectiveBase * effectiveMult * finalMultiplier,
			after: total,
		})
	}

	return {
		word,
		characterBase,
		itemBaseBonus,
		effectiveBase,
		effectiveMult,
		finalMultiplier,
		total,
		aegisRecovery,
		overdriveReleased,
		trace,
		itemImpacts: scoreItemImpacts(appliedItemIds, baselineScore, total, context),
	}
}

function submitWord(
	ctx: RunContext,
	lifecycle: InputLifecycle,
	mode: SubmissionMode = "standard",
) {
	const result = ctx.scorer.completeWord(ctx.state.wordDirty, ctx.preserveMultForWord)
	const aegisRecovery = !result.clean
		&& ctx.state.aegisActive
		&& ctx.state.zone === 2
	const releasesOverdrive = result.clean
		&& ctx.state.overdriveCharge >= OVERDRIVE_CHARGE_MAX
		&& (ctx.state.zone <= 2 || mode === "overdrive")
	const elapsedMs = ctx.stageElapsedMs
	const combatActions = actionsForWord({
		word: ctx.state.currentWord,
		keycapIds: ctx.state.keycaps,
		clean: result.clean,
		overdriveReleased: releasesOverdrive,
	})
	const appliedItemIds: string[] = []
	const contextBase = {
		word: ctx.state.currentWord,
		clean: result.clean,
		elapsedMs,
		combo: result.combo,
		naturalMult: result.mult,
		baseBonus: 0,
		baseMultiplier: 1,
		multAdd: 0,
		multMultiplier: 1,
		finalMultiplier: releasesOverdrive ? OVERDRIVE_SCORE_MULTIPLIER : 1,
		appliedItemIds,
	}

	forEachKeycap(ctx, (id, _index, base) => {
		const definition = KEYCAPS[id]
		if (!definition.beforeWordScore) return
		const context: WordScoreContext = { ...base, ...contextBase }
		definition.beforeWordScore(context)
		Object.assign(contextBase, {
			baseBonus: context.baseBonus,
			baseMultiplier: context.baseMultiplier,
			multAdd: context.multAdd,
			multMultiplier: context.multMultiplier,
			finalMultiplier: context.finalMultiplier,
		})
	})

	const effectiveMult = (result.mult + contextBase.multAdd) * contextBase.multMultiplier
	const modifiedBase = (ctx.state.currentWord.length + contextBase.baseBonus)
		* contextBase.baseMultiplier
	const scoreGain = result.clean
		? Math.floor(modifiedBase * effectiveMult * contextBase.finalMultiplier)
		: aegisRecovery
			? Math.floor(modifiedBase)
			: 0
	const baselineScore = result.clean
		? Math.floor(ctx.state.currentWord.length * result.mult)
		: 0

	ctx.state.score += scoreGain
	ctx.state.combo = result.combo
	ctx.state.maxCombo = Math.max(ctx.state.maxCombo, ctx.state.combo)
	ctx.state.mult = effectiveMult
	ctx.state.highestMult = Math.max(ctx.state.highestMult, effectiveMult)
	if (result.clean) {
		ctx.state.cleanWords += 1
		ctx.state.totalCleanWords += 1
	}

	recordScoreImpact(ctx, appliedItemIds, Math.max(0, scoreGain - baselineScore))
	if (releasesOverdrive) ctx.state.overdriveCharge = 0
	const resolvedScore = scoreResolution({
		word: ctx.state.currentWord,
		characterBase: ctx.state.currentWord.length,
		itemBaseBonus: contextBase.baseBonus,
		effectiveBase: modifiedBase,
		effectiveMult: aegisRecovery ? 1 : effectiveMult,
		finalMultiplier: aegisRecovery ? 1 : contextBase.finalMultiplier,
		total: scoreGain,
		aegisRecovery,
		overdriveReleased: releasesOverdrive,
		appliedItemIds,
		baselineScore,
		context: contextBase,
	})
	ctx.state.lastScoreResolution = resolvedScore

	const resolvedBase = {
		...contextBase,
		scoreGain,
	}
	forEachKeycap(ctx, (id, _index, base) => {
		const definition = KEYCAPS[id]
		if (!definition.afterWordScore) return
		const context: WordResolvedContext = { ...base, ...resolvedBase }
		definition.afterWordScore(context)
	})

	ctx.events.emit("word_complete", {
		word: ctx.state.currentWord,
		characterBase: ctx.state.currentWord.length,
		itemBaseBonus: contextBase.baseBonus,
		effectiveBase: modifiedBase,
		effectiveMult: aegisRecovery ? 1 : effectiveMult,
		finalMultiplier: aegisRecovery ? 1 : contextBase.finalMultiplier,
		scoreGain,
		overdriveReleased: releasesOverdrive,
		aegisRecovery,
		autoExecuted: ctx.state.zone === 1,
		appliedItemIds: [...appliedItemIds],
		combo: ctx.state.combo,
		scoreResolution: resolvedScore,
		combatActions,
	})
	if (releasesOverdrive) {
		ctx.events.emit("overdrive_released", {
			word: ctx.state.currentWord,
			scoreGain,
		})
	}
	if (result.multIncreased) {
		ctx.events.emit("mult_increased", { mult: persistentMult(ctx) })
	}
	ctx.events.emit("mult_change", { mult: persistentMult(ctx) })
	ctx.events.emit("quota_progress", { score: ctx.state.score, quota: ctx.state.quota })

	ctx.state.wordDirty = false
	ctx.preserveMultForWord = false
	ctx.state.targetOrdinal += 1
	updateTypingStats(ctx)

	if (ctx.state.score >= ctx.state.quota) {
		lifecycle.completeStage()
		return
	}

	ctx.state.currentWord = ctx.state.upcomingWords.shift() ?? getBuildBiasedWord(ctx)
	ctx.state.upcomingWords.push(getBuildBiasedWord(ctx))
	normalizeVisiblePrefixes(ctx)
	ctx.state.caretIndex = 0
	ctx.state.mult = persistentMult(ctx)
}

export function releaseOverdrive(ctx: RunContext, lifecycle: InputLifecycle) {
	if (
		ctx.state.screen !== "stage"
		|| ctx.state.zone <= 2
		|| ctx.state.overdriveCharge < OVERDRIVE_CHARGE_MAX
		|| ctx.state.wordDirty
		|| ctx.state.caretIndex !== ctx.state.currentWord.length
	) return
	submitWord(ctx, lifecycle, "overdrive")
}

export function feedChar(ctx: RunContext, lifecycle: InputLifecycle, character: string) {
	if (ctx.state.screen !== "stage") return
	registerInputIntent(ctx)

	if (character === " ") {
		if (ctx.state.caretIndex === ctx.state.currentWord.length) submitWord(ctx, lifecycle)
		return
	}
	selectTarget(ctx, character)
	if (ctx.state.caretIndex >= ctx.state.currentWord.length) return

	const expected = ctx.state.currentWord[ctx.state.caretIndex]
	if (character === expected) {
		const previousCharge = ctx.state.overdriveCharge
		ctx.stageAttemptedChars += 1
		ctx.stageCorrectChars += 1
		ctx.runAttemptedChars += 1
		ctx.runCorrectChars += 1
		ctx.state.caretIndex += 1
		ctx.state.overdriveCharge = Math.min(
			OVERDRIVE_CHARGE_MAX,
			ctx.state.overdriveCharge + OVERDRIVE_CHARGE_PER_CHARACTER,
		)
		const characterIndex = ctx.state.caretIndex - 1
		const becameReady = previousCharge < OVERDRIVE_CHARGE_MAX
			&& ctx.state.overdriveCharge === OVERDRIVE_CHARGE_MAX
		ctx.events.emit("character_accepted", {
			character,
			caretIndex: ctx.state.caretIndex,
			characterIndex,
			word: ctx.state.currentWord,
			targetOrdinal: ctx.state.targetOrdinal,
			stage: ctx.state.stage,
			combatVerb: combatVerbFor({
				stage: ctx.state.stage,
				zone: ctx.state.zone,
				characterIndex,
				wordLength: ctx.state.currentWord.length,
				wordDirty: ctx.state.wordDirty,
				combo: ctx.state.combo,
				keycapIds: ctx.state.keycaps,
				overdriveReady: ctx.state.overdriveCharge >= OVERDRIVE_CHARGE_MAX,
				finalCharacter: ctx.state.caretIndex === ctx.state.currentWord.length,
			}),
			actions: actionsForCharacter({
				word: ctx.state.currentWord,
				character,
				characterIndex,
				keycapIds: ctx.state.keycaps,
				overdrive: ctx.state.overdriveCharge >= OVERDRIVE_CHARGE_MAX,
			}),
			charge: ctx.state.overdriveCharge,
			becameReady,
		})
		if (becameReady) ctx.events.emit("overdrive_ready", { charge: ctx.state.overdriveCharge })
		updateTypingStats(ctx)
		if (ctx.state.zone === 1 && ctx.state.caretIndex === ctx.state.currentWord.length) {
			submitWord(ctx, lifecycle)
		}
		return
	}

	if (ctx.insuranceArmed) {
		ctx.insuranceArmed = false
		recordImpact(ctx, "insurance", {
			kind: "protection",
			amount: 1,
			label: "Typo ignored",
		})
		ctx.events.emit("typo", { expected, got: character, ignored: true })
		return
	}

	ctx.stageAttemptedChars += 1
	ctx.runAttemptedChars += 1
	const isFirstTypoInWord = !ctx.state.wordDirty
	const trainingForgiveness = ctx.state.aegisActive && ctx.state.zone === 1
	if (!trainingForgiveness) ctx.state.wordDirty = true
	ctx.state.overdriveCharge = Math.max(0, ctx.state.overdriveCharge - OVERDRIVE_TYPO_DRAIN)
	ctx.state.stageTypos += 1
	ctx.state.totalTypos += 1

	let forceFail = false
	let timePenaltyMs = 0
	forEachKeycap(ctx, (id, _index, base) => {
		const definition = KEYCAPS[id]
		if (!definition.onTypo) return
		const context: TypoContext = {
			...base,
			expected,
			got: character,
			isFirstTypoInWord,
			ignoreTypo: false,
			preserveMult: ctx.preserveMultForWord,
			forceFail,
			timePenaltyMs,
		}
		definition.onTypo(context)
		ctx.preserveMultForWord = ctx.preserveMultForWord || context.preserveMult
		forceFail = forceFail || context.forceFail
		timePenaltyMs = context.timePenaltyMs
	})

	if (timePenaltyMs > 0) {
		ctx.state.timeLeftMs = Math.max(0, ctx.state.timeLeftMs - timePenaltyMs)
	}

	if (ctx.state.activeGlitch) {
		const glitch = GLITCHES[ctx.state.activeGlitch]
		if (glitch.onTypo) {
			const context = { events: ctx.events, state: ctx.state, forceFail }
			glitch.onTypo(context)
			forceFail = forceFail || context.forceFail
		}
	}

	updateTypingStats(ctx)
	ctx.events.emit("typo", { expected, got: character, ignored: false })

	if (forceFail) lifecycle.failStage("sudden_death")
	else if (ctx.state.timeLeftMs <= 0 && !lifecycle.rescueWithAegis()) {
		lifecycle.failStage("time_penalty")
	}
}

export function backspace(ctx: RunContext) {
	if (ctx.state.screen !== "stage") return
	registerInputIntent(ctx)
	if (ctx.state.activeGlitch === "no_backspace" && ctx.state.glitchState?.cancelled !== true) {
		return
	}
	if (ctx.state.caretIndex > 0) ctx.state.caretIndex -= 1
}
