import { createEmitter } from "./emitter"
import type {
	EngineEvents,
	ItemContribution,
	ItemImpact,
	RunMode,
	RunSnapshot,
	StageType,
	ThreatBand,
	WordPoolLanguage,
} from "./types"
import { createScorer } from "./scoring"
import {
	STAGE_DURATION_BY_TYPE,
	AEGIS_PROTECTED_ZONE_MAX,
	AEGIS_RESCUE_MS,
	FOCUS_PAUSE_IDLE_MS,
	OVERDRIVE_CHARGE_MAX,
	OVERDRIVE_CHARGE_PER_CHARACTER,
	OVERDRIVE_TYPO_DRAIN,
	OVERDRIVE_SCORE_MULTIPLIER,
	CLEAR_REWARD,
	TIME_BONUS_PER_10S,
	INTEREST_PER_5_TOKENS,
	INTEREST_CAP,
	WARMUP_SKIP_REWARD,
} from "./constants"
import { getStageQuota, isStandardClear, nextStagePosition } from "./progression"
import { createRng } from "../rng"
import { GLITCHES, KEYCAPS, MACROS } from "./items"
import type {
	BaseItemContext,
	RuntimeData,
	StageEndContext,
	StageStartContext,
	TypoContext,
	WordResolvedContext,
	WordScoreContext,
} from "./items/registry"

const MAX_KEYCAPS = 5
const MAX_MACROS = 2
const SHOP_REROLL_BASE = 5
const BUILD_TRIGGER_BIAS = 0.12
const ANTI_REPEAT_WINDOW = 30
const SAVE_VERSION = 5

function stageDurationMs(stage: StageType): number {
	return STAGE_DURATION_BY_TYPE[stage]
}

function threatBandForZone(zone: number): ThreatBand {
	if (zone <= 2) return "protected"
	if (zone <= 4) return "pressure"
	if (zone <= 6) return "overclocked"
	return "lethal"
}

export type CreateRunOptions = {
	seed: string
	words: string[]
	mode?: RunMode
	language?: WordPoolLanguage
	startingKeycaps?: string[]
	startingMacros?: string[]
	startingTokens?: number
	startingZone?: number
}

type SavedRun = {
	version: number
	state: RunSnapshot
	runItemData: RuntimeData[]
	stageItemData: RuntimeData[]
	naturalMult: number
	stageAttemptedChars: number
	stageCorrectChars: number
	runAttemptedChars: number
	runCorrectChars: number
	preserveMultForWord: boolean
	insuranceArmed: boolean
	stageElapsedMs: number
	stageIdleMs: number
}

const BEGINNER_SIGNALS: Record<WordPoolLanguage, Record<StageType, string[]>> = {
	EN: {
		warmup: ["f", "j", "d", "k", "s", "l", "a", "e", "i", "o"],
		rush: ["as", "in", "it", "to", "of", "on", "up", "go", "we", "no"],
		glitch: ["the", "and", "you", "for", "run", "key", "hit", "win", "tap", "aim"],
	},
	ID: {
		warmup: ["f", "j", "d", "k", "s", "l", "a", "i", "u", "e"],
		rush: ["di", "ke", "ya", "ku", "mu", "ok", "se", "me", "be", "la"],
		glitch: ["dan", "aku", "dia", "ini", "ada", "mau", "dua", "iya", "kau", "nya"],
	},
}

function emptyImpact(): ItemImpact {
	return { triggers: 0, score: 0, tokens: 0, timeMs: 0, protections: 0 }
}

function cloneImpactMap(source: Record<string, ItemImpact>): Record<string, ItemImpact> {
	return Object.fromEntries(
		Object.entries(source).map(([id, impact]) => [id, { ...impact }]),
	)
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function createRun(opts: CreateRunOptions) {
	if (opts.words.length === 0) throw new Error("Overdrive requires a non-empty word pool")

	const events = createEmitter<EngineEvents>()
	const startingZone = Math.max(1, Math.floor(opts.startingZone ?? 1))
	const sourceWords = [...new Set(opts.words.map((word) => word.trim()).filter(Boolean))]
	const longWords = sourceWords.filter((word) => word.replace(/[^\p{L}]/gu, "").length >= 8)
	const doubleLetterWords = sourceWords.filter((word) => /(.)\1/i.test(word))
	const homeRowWords = sourceWords.filter((word) => {
		const letters = word.replace(/[^\p{L}]/gu, "")
		return letters.length > 0 && /^[asdfghjkl]+$/i.test(letters)
	})
	const punctuation = [".", ",", "?", "!"] as const

	let rootRng = createRng(opts.seed)
	let wordsRng = rootRng.fork("words")
	let shopRng = rootRng.fork("shop")
	let glitchRng = rootRng.fork("glitch")
	let recentWords: string[] = []

	const startingKeycaps = (opts.startingKeycaps ?? []).filter((id) => KEYCAPS[id]).slice(0, MAX_KEYCAPS)
	const startingMacros = (opts.startingMacros ?? []).filter((id) => MACROS[id]).slice(0, MAX_MACROS)

	let state: RunSnapshot = {
		screen: "menu",
		mode: opts.mode ?? "free",
		language: opts.language ?? "EN",
		zone: startingZone,
		stage: "warmup",
		endless: false,
		timeLeftMs: stageDurationMs("warmup"),
		stageDurationMs: stageDurationMs("warmup"),
		aegisActive: startingZone <= AEGIS_PROTECTED_ZONE_MAX,
		aegisRescues: 0,
		stageRescued: false,
		focusPaused: false,
		threatBand: threatBandForZone(startingZone),
		overdriveCharge: 0,
		score: 0,
		runScore: 0,
		standardScore: 0,
		endlessScore: 0,
		quota: getStageQuota(startingZone, "warmup"),
		combo: 0,
		maxCombo: 0,
		mult: 1,
		tokens: opts.startingTokens ?? 0,
		totalTokensEarned: 0,
		accuracy: 100,
		runAccuracy: 100,
		wpm: 0,
		averageWpm: 0,
		cleanWords: 0,
		totalCleanWords: 0,
		highestMult: 1,
		stageTypos: 0,
		totalTypos: 0,
		runDurationMs: 0,
		seed: opts.seed,
		currentWord: "",
		caretIndex: 0,
		wordDirty: false,
		upcomingWords: [],
		keycaps: [...startingKeycaps],
		macros: [...startingMacros],
		shopKeycaps: [],
		shopMacro: null,
		rerollCost: SHOP_REROLL_BASE,
		activeGlitch: null,
		glitchState: null,
		stageItemImpact: {},
		runItemImpact: {},
	}

	let scorer = createScorer()
	let runItemData: RuntimeData[] = state.keycaps.map(() => ({}))
	let stageItemData: RuntimeData[] = state.keycaps.map(() => ({}))
	let stageAttemptedChars = 0
	let stageCorrectChars = 0
	let runAttemptedChars = 0
	let runCorrectChars = 0
	let preserveMultForWord = false
	let insuranceArmed = false
	let stageInterestCap = INTEREST_CAP
	let stageElapsedMs = 0
	let stageIdleMs = 0

	function resetRng() {
		rootRng = createRng(opts.seed)
		wordsRng = rootRng.fork("words")
		shopRng = rootRng.fork("shop")
		glitchRng = rootRng.fork("glitch")
		recentWords = []
	}

	function ensureItemRuntime() {
		while (runItemData.length < state.keycaps.length) runItemData.push({})
		while (stageItemData.length < state.keycaps.length) stageItemData.push({})
		runItemData.length = state.keycaps.length
		stageItemData.length = state.keycaps.length
	}

	function snapshot(): RunSnapshot {
		return {
			...state,
			keycaps: [...state.keycaps],
			macros: [...state.macros],
			shopKeycaps: [...state.shopKeycaps],
			upcomingWords: [...state.upcomingWords],
			glitchState: state.glitchState ? { ...state.glitchState } : null,
			stageItemImpact: cloneImpactMap(state.stageItemImpact),
			runItemImpact: cloneImpactMap(state.runItemImpact),
			tokenBreakdown: state.tokenBreakdown ? { ...state.tokenBreakdown } : undefined,
		}
	}

	function recordImpact(itemId: string, contribution: ItemContribution) {
		const stageImpact = state.stageItemImpact[itemId] ?? emptyImpact()
		const runImpact = state.runItemImpact[itemId] ?? emptyImpact()
		stageImpact.triggers += 1
		runImpact.triggers += 1

		if (contribution.kind === "token") {
			stageImpact.tokens += contribution.amount
			runImpact.tokens += contribution.amount
			state.totalTokensEarned += Math.max(0, contribution.amount)
		}
		if (contribution.kind === "time") {
			stageImpact.timeMs += contribution.amount
			runImpact.timeMs += contribution.amount
		}
		if (contribution.kind === "protection") {
			stageImpact.protections += Math.max(0, contribution.amount)
			runImpact.protections += Math.max(0, contribution.amount)
		}

		state.stageItemImpact[itemId] = stageImpact
		state.runItemImpact[itemId] = runImpact
		events.emit("item_triggered", { itemId, trigger: contribution.label, contribution })
	}

	function recordScoreImpact(itemIds: string[], score: number) {
		if (itemIds.length === 0 || score <= 0) return
		const share = score / itemIds.length
		for (const itemId of itemIds) {
			const stageImpact = state.stageItemImpact[itemId] ?? emptyImpact()
			const runImpact = state.runItemImpact[itemId] ?? emptyImpact()
			stageImpact.score += share
			runImpact.score += share
			state.stageItemImpact[itemId] = stageImpact
			state.runItemImpact[itemId] = runImpact
		}
	}

	function baseItemContext(index: number, itemId: string): BaseItemContext {
		ensureItemRuntime()
		return {
			events,
			state,
			runData: runItemData[index],
			stageData: stageItemData[index],
			proc: (trigger, contribution) => {
				recordImpact(itemId, contribution)
			},
		}
	}

	function forEachKeycap(
		callback: (id: string, index: number, context: BaseItemContext) => void,
	) {
		ensureItemRuntime()
		state.keycaps.forEach((id, index) => {
			if (!KEYCAPS[id]) return
			callback(id, index, baseItemContext(index, id))
		})
	}

	function getBuildBiasedWord(): string {
		const trainingPool = state.zone === 1
			? BEGINNER_SIGNALS[state.language][state.stage]
			: state.zone === 2
				? sourceWords.filter((word) => {
					const length = word.replace(/[^\p{L}]/gu, "").length
					return length >= 3 && length <= 5
				})
				: null
		if (trainingPool && trainingPool.length > 0) {
			let signal = trainingPool[0]
			for (let attempt = 0; attempt < 24; attempt += 1) {
				signal = wordsRng.pick(trainingPool)
				if (!recentWords.includes(signal.toLowerCase())) break
			}
			recentWords.push(signal.toLowerCase())
			recentWords = recentWords.slice(-Math.min(ANTI_REPEAT_WINDOW, trainingPool.length))
			return signal
		}

		const pools: string[][] = []
		if (state.keycaps.includes("longshot") && longWords.length > 0) pools.push(longWords)
		if (state.keycaps.includes("double_tap") && doubleLetterWords.length > 0) pools.push(doubleLetterWords)
		if (state.keycaps.includes("home_row") && homeRowWords.length > 0) pools.push(homeRowWords)

		let candidate = ""
		for (let attempt = 0; attempt < 24; attempt += 1) {
			const useBias = pools.length > 0 && wordsRng.next() < BUILD_TRIGGER_BIAS
			const pool = useBias ? wordsRng.pick(pools) : sourceWords
			candidate = wordsRng.pick(pool)
			const repeatKey = candidate.toLowerCase()
			if (!recentWords.includes(repeatKey)) break
		}

		const repeatKey = candidate.toLowerCase()
		recentWords.push(repeatKey)
		recentWords = recentWords.slice(-ANTI_REPEAT_WINDOW)

		if (
			state.zone >= 3
			&& state.keycaps.includes("punctuator")
			&& wordsRng.next() < BUILD_TRIGGER_BIAS
		) {
			candidate += wordsRng.pick([...punctuation])
		}
		return candidate
	}

	function updateTypingStats() {
		state.accuracy = stageAttemptedChars === 0
			? 100
			: Math.floor((stageCorrectChars / stageAttemptedChars) * 100)
		state.runAccuracy = runAttemptedChars === 0
			? 100
			: Math.floor((runCorrectChars / runAttemptedChars) * 100)

		if (stageElapsedMs > 0) {
			state.wpm = Math.floor((stageCorrectChars / 5) / (stageElapsedMs / 60_000))
		}
		if (state.runDurationMs > 0) {
			state.averageWpm = Math.floor((runCorrectChars / 5) / (state.runDurationMs / 60_000))
		}
	}

	function registerInputIntent() {
		stageIdleMs = 0
		if (!state.focusPaused) return
		state.focusPaused = false
		events.emit("focus_resume", { timeLeftMs: state.timeLeftMs })
	}

	function persistentMult(): number {
		let add = 0
		let multiplier = 1
		state.keycaps.forEach((id, index) => {
			if (id === "snowball") add += Number(runItemData[index]?.permanentMult ?? 0)
			if (id === "overclock") add += Number(stageItemData[index]?.bonus ?? 0)
			if (id === "glass_keycap") multiplier *= 3
		})
		return (scorer.mult + add) * multiplier
	}

	function startStage() {
		state.screen = "stage"
		state.stageDurationMs = stageDurationMs(state.stage)
		state.timeLeftMs = state.stageDurationMs
		state.aegisActive = !state.endless && state.zone <= AEGIS_PROTECTED_ZONE_MAX
		state.aegisRescues = 0
		state.stageRescued = false
		state.focusPaused = false
		state.threatBand = threatBandForZone(state.zone)
		state.score = 0
		state.quota = getStageQuota(state.zone, state.stage)
		state.combo = 0
		state.mult = 1
		state.accuracy = 100
		state.wpm = 0
		state.cleanWords = 0
		state.stageTypos = 0
		state.wordDirty = false
		state.caretIndex = 0
		state.stageItemImpact = {}
		state.tokenBreakdown = undefined
		state.glitchState = null
		state.currentWord = getBuildBiasedWord()
		state.upcomingWords = Array.from({ length: 8 }, getBuildBiasedWord)

		scorer = createScorer()
		stageItemData = state.keycaps.map(() => ({}))
		stageAttemptedChars = 0
		stageCorrectChars = 0
		preserveMultForWord = false
		insuranceArmed = false
		stageInterestCap = INTEREST_CAP
		stageElapsedMs = 0
		stageIdleMs = 0

		forEachKeycap((id, _index, base) => {
			const definition = KEYCAPS[id]
			if (!definition.onStageStart) return
			const context: StageStartContext = { ...base, interestCap: stageInterestCap }
			definition.onStageStart(context)
			stageInterestCap = context.interestCap
		})

		if (state.stage === "glitch" && state.zone > 1) {
			const ids = Object.keys(GLITCHES).filter(
				(id) => state.zone >= 3 || id !== "sudden_death",
			)
			state.activeGlitch = glitchRng.pick(ids)
			state.glitchState = {}
			const glitch = GLITCHES[state.activeGlitch]
			if (glitch.onStageStart) {
				const context = { events, state, forceFail: false }
				glitch.onStageStart(context)
			}
		} else {
			state.activeGlitch = null
			state.glitchState = null
		}

		state.mult = persistentMult()
		state.highestMult = Math.max(state.highestMult, state.mult)
	}

	function start() {
		resetRng()
		state = {
			...state,
			screen: "menu",
			zone: startingZone,
			stage: "warmup",
			endless: false,
			timeLeftMs: stageDurationMs("warmup"),
			stageDurationMs: stageDurationMs("warmup"),
			aegisActive: startingZone <= AEGIS_PROTECTED_ZONE_MAX,
			aegisRescues: 0,
			stageRescued: false,
			focusPaused: false,
			threatBand: threatBandForZone(startingZone),
			overdriveCharge: 0,
			score: 0,
			runScore: 0,
			standardScore: 0,
			endlessScore: 0,
			finalScore: undefined,
			tokenBreakdown: undefined,
			quota: getStageQuota(startingZone, "warmup"),
			combo: 0,
			maxCombo: 0,
			mult: 1,
			tokens: opts.startingTokens ?? 0,
			totalTokensEarned: 0,
			accuracy: 100,
			runAccuracy: 100,
			wpm: 0,
			averageWpm: 0,
			cleanWords: 0,
			totalCleanWords: 0,
			highestMult: 1,
			stageTypos: 0,
			totalTypos: 0,
			runDurationMs: 0,
			currentWord: "",
			caretIndex: 0,
			wordDirty: false,
			upcomingWords: [],
			win: false,
			keycaps: [...startingKeycaps],
			macros: [...startingMacros],
			shopKeycaps: [],
			shopMacro: null,
			rerollCost: SHOP_REROLL_BASE,
			activeGlitch: null,
			glitchState: null,
			stageItemImpact: {},
			runItemImpact: {},
		}
		runItemData = state.keycaps.map(() => ({}))
		runAttemptedChars = 0
		runCorrectChars = 0
		startStage()
	}

	function skipWarmup() {
		if (state.screen !== "stage" || state.stage !== "warmup") return
		state.tokens += WARMUP_SKIP_REWARD
		state.stage = "rush"
		startStage()
	}

	function resolveItemStageEnd(cleared: boolean) {
		const remove: number[] = []
		forEachKeycap((id, index, base) => {
			const definition = KEYCAPS[id]
			if (!definition.onStageEnd) return
			const context: StageEndContext = {
				...base,
				cleared,
				accuracy: state.accuracy,
				stageTypos: state.stageTypos,
				removeSelf: false,
			}
			definition.onStageEnd(context)
			if (context.removeSelf) remove.push(index)
		})

		for (const index of remove.sort((a, b) => b - a)) {
			state.keycaps.splice(index, 1)
			runItemData.splice(index, 1)
			stageItemData.splice(index, 1)
		}
	}

	function completeStage() {
		if (state.screen !== "stage") return
		resolveItemStageEnd(true)

		const tokenMultiplier = Number(state.glitchState?.tokenMultiplier ?? 1)
		const clearReward = CLEAR_REWARD[state.stage]
		const timeBonus = state.stageRescued
			? 0
			: Math.floor(state.timeLeftMs / 10_000) * TIME_BONUS_PER_10S
		const interest = Math.min(
			Math.floor(state.tokens / 5) * INTEREST_PER_5_TOKENS,
			stageInterestCap,
		)
		const totalEarned = (clearReward + timeBonus + interest) * tokenMultiplier

		state.tokenBreakdown = {
			clearReward: clearReward * tokenMultiplier,
			timeBonus: timeBonus * tokenMultiplier,
			interest: interest * tokenMultiplier,
			totalEarned,
		}
		state.tokens += totalEarned
		state.totalTokensEarned += totalEarned
		state.runScore += state.score
		if (state.endless) state.endlessScore += state.score
		else state.standardScore += state.score

		events.emit("stage_clear", {
			zone: state.zone,
			stage: state.stage,
			tokensEarned: totalEarned,
			timeLeftMs: state.timeLeftMs,
		})
		state.screen = "stageResult"
		if (isStandardClear(state.zone, state.stage) && !state.endless) state.win = true
	}

	function rescueWithAegis(): boolean {
		if (!state.aegisActive || state.screen !== "stage") return false
		state.aegisRescues += 1
		state.stageRescued = true
		state.timeLeftMs += AEGIS_RESCUE_MS
		events.emit("aegis_rescue", {
			zone: state.zone,
			stage: state.stage,
			rescueNumber: state.aegisRescues,
			timeAddedMs: AEGIS_RESCUE_MS,
		})
		return true
	}

	function failStage(reason: "timeout" | "sudden_death" | "time_penalty") {
		if (state.screen !== "stage") return
		resolveItemStageEnd(false)
		state.runScore += state.score
		if (state.endless) state.endlessScore += state.score
		else state.standardScore += state.score
		state.finalScore = state.runScore
		events.emit("stage_fail", { zone: state.zone, stage: state.stage, reason })
		events.emit("run_over", {
			win: false,
			finalScore: state.finalScore,
			zoneReached: state.zone,
		})
		state.screen = "runOver"
	}

	function submitWord() {
		const result = scorer.completeWord(state.wordDirty, preserveMultForWord)
		const aegisRecovery = !result.clean
			&& state.aegisActive
			&& state.zone === 2
		const releasesOverdrive = result.clean
			&& state.overdriveCharge >= OVERDRIVE_CHARGE_MAX
		const elapsedMs = stageElapsedMs
		const appliedItemIds: string[] = []
		const contextBase = {
			word: state.currentWord,
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

		forEachKeycap((id, _index, base) => {
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
		const modifiedBase = (state.currentWord.length + contextBase.baseBonus) * contextBase.baseMultiplier
		const scoreGain = result.clean
			? Math.floor(modifiedBase * effectiveMult * contextBase.finalMultiplier)
			: aegisRecovery
				? Math.floor(modifiedBase)
				: 0
		const baselineScore = result.clean
			? Math.floor(state.currentWord.length * result.mult)
			: 0

		state.score += scoreGain
		state.combo = result.combo
		state.maxCombo = Math.max(state.maxCombo, state.combo)
		state.mult = effectiveMult
		state.highestMult = Math.max(state.highestMult, effectiveMult)
		if (result.clean) {
			state.cleanWords += 1
			state.totalCleanWords += 1
		}

		recordScoreImpact(appliedItemIds, Math.max(0, scoreGain - baselineScore))
		if (releasesOverdrive) state.overdriveCharge = 0

		const resolvedBase = {
			...contextBase,
			scoreGain,
		}
		forEachKeycap((id, _index, base) => {
			const definition = KEYCAPS[id]
			if (!definition.afterWordScore) return
			const context: WordResolvedContext = { ...base, ...resolvedBase }
			definition.afterWordScore(context)
		})

		events.emit("word_complete", {
			word: state.currentWord,
			characterBase: state.currentWord.length,
			itemBaseBonus: contextBase.baseBonus,
			effectiveBase: modifiedBase,
			effectiveMult: aegisRecovery ? 1 : effectiveMult,
			finalMultiplier: aegisRecovery ? 1 : contextBase.finalMultiplier,
			scoreGain,
			overdriveReleased: releasesOverdrive,
			aegisRecovery,
			autoExecuted: state.zone === 1,
			appliedItemIds: [...appliedItemIds],
			combo: state.combo,
		})
		if (releasesOverdrive) {
			events.emit("overdrive_released", {
				word: state.currentWord,
				scoreGain,
			})
		}
		if (result.multIncreased) {
			events.emit("mult_increased", { mult: persistentMult() })
		}
		events.emit("mult_change", { mult: persistentMult() })
		events.emit("quota_progress", { score: state.score, quota: state.quota })

		state.wordDirty = false
		preserveMultForWord = false
		updateTypingStats()

		if (state.score >= state.quota) {
			completeStage()
			return
		}

		state.currentWord = state.upcomingWords.shift() ?? getBuildBiasedWord()
		state.upcomingWords.push(getBuildBiasedWord())
		state.caretIndex = 0
		state.mult = persistentMult()
	}

	function feedChar(character: string) {
		if (state.screen !== "stage") return
		registerInputIntent()

		if (character === " ") {
			if (state.caretIndex === state.currentWord.length) submitWord()
			return
		}
		if (state.caretIndex >= state.currentWord.length) return

		const expected = state.currentWord[state.caretIndex]
		if (character === expected) {
			const previousCharge = state.overdriveCharge
			stageAttemptedChars += 1
			stageCorrectChars += 1
			runAttemptedChars += 1
			runCorrectChars += 1
			state.caretIndex += 1
			state.overdriveCharge = Math.min(
				OVERDRIVE_CHARGE_MAX,
				state.overdriveCharge + OVERDRIVE_CHARGE_PER_CHARACTER,
			)
			const becameReady = previousCharge < OVERDRIVE_CHARGE_MAX
				&& state.overdriveCharge === OVERDRIVE_CHARGE_MAX
			events.emit("character_accepted", {
				character,
				caretIndex: state.caretIndex,
				charge: state.overdriveCharge,
				becameReady,
			})
			if (becameReady) events.emit("overdrive_ready", { charge: state.overdriveCharge })
			updateTypingStats()
			if (state.zone === 1 && state.caretIndex === state.currentWord.length) {
				submitWord()
			}
			return
		}

		if (insuranceArmed) {
			insuranceArmed = false
			recordImpact("insurance", {
				kind: "protection",
				amount: 1,
				label: "Typo ignored",
			})
			events.emit("typo", { expected, got: character, ignored: true })
			return
		}

		stageAttemptedChars += 1
		runAttemptedChars += 1
		const isFirstTypoInWord = !state.wordDirty
		const trainingForgiveness = state.aegisActive && state.zone === 1
		if (!trainingForgiveness) state.wordDirty = true
		state.overdriveCharge = Math.max(0, state.overdriveCharge - OVERDRIVE_TYPO_DRAIN)
		state.stageTypos += 1
		state.totalTypos += 1

		let forceFail = false
		let timePenaltyMs = 0
		forEachKeycap((id, _index, base) => {
			const definition = KEYCAPS[id]
			if (!definition.onTypo) return
			const context: TypoContext = {
				...base,
				expected,
				got: character,
				isFirstTypoInWord,
				ignoreTypo: false,
				preserveMult: preserveMultForWord,
				forceFail,
				timePenaltyMs,
			}
			definition.onTypo(context)
			preserveMultForWord = preserveMultForWord || context.preserveMult
			forceFail = forceFail || context.forceFail
			timePenaltyMs = context.timePenaltyMs
		})

		if (timePenaltyMs > 0) {
			state.timeLeftMs = Math.max(0, state.timeLeftMs - timePenaltyMs)
		}

		if (state.activeGlitch) {
			const glitch = GLITCHES[state.activeGlitch]
			if (glitch.onTypo) {
				const context = { events, state, forceFail }
				glitch.onTypo(context)
				forceFail = forceFail || context.forceFail
			}
		}

		updateTypingStats()
		events.emit("typo", { expected, got: character, ignored: false })

		if (forceFail) failStage("sudden_death")
		else if (state.timeLeftMs <= 0 && !rescueWithAegis()) failStage("time_penalty")
	}

	function backspace() {
		if (state.screen !== "stage") return
		registerInputIntent()
		if (state.activeGlitch === "no_backspace" && state.glitchState?.cancelled !== true) return
		if (state.caretIndex > 0) state.caretIndex -= 1
	}

	function advance(ms: number) {
		if (state.screen !== "stage" || !Number.isFinite(ms) || ms <= 0) return
		state.runDurationMs += ms
		stageElapsedMs += ms

		let timerDelta = ms
		if (state.aegisActive) {
			const remainingFocusGrace = Math.max(0, FOCUS_PAUSE_IDLE_MS - stageIdleMs)
			timerDelta = Math.min(ms, remainingFocusGrace)
			stageIdleMs += ms
			if (stageIdleMs >= FOCUS_PAUSE_IDLE_MS && !state.focusPaused) {
				state.focusPaused = true
				events.emit("focus_pause", { idleMs: stageIdleMs })
			}
		} else {
			stageIdleMs += ms
			state.focusPaused = false
		}

		const delta = Math.min(timerDelta, state.timeLeftMs)
		state.timeLeftMs = Math.max(0, state.timeLeftMs - delta)
		updateTypingStats()

		if (state.timeLeftMs === 0) {
			if (state.score >= state.quota) completeStage()
			else if (!rescueWithAegis()) failStage("timeout")
		}
	}

	function availableKeycapsForRarity(rarity: "common" | "uncommon" | "rare") {
		return Object.values(KEYCAPS).filter((item) => item.rarity === rarity)
	}

	function randomKeycap(): string {
		const roll = shopRng.next() * 98
		const rarity = roll < 60 ? "common" : roll < 88 ? "uncommon" : "rare"
		const pool = availableKeycapsForRarity(rarity)
		return shopRng.pick(pool).id
	}

	function generateShop() {
		const first = randomKeycap()
		let second = randomKeycap()
		for (let attempts = 0; second === first && attempts < 8; attempts += 1) {
			second = randomKeycap()
		}
		state.shopKeycaps = [first, second]
		state.shopMacro = shopRng.pick(Object.values(MACROS)).id
	}

	function continueToNextStage() {
		if (state.screen !== "stageResult") return
		if (state.win && !state.endless) {
			state.screen = "standardClear"
			return
		}
		state.screen = "shop"
		state.rerollCost = SHOP_REROLL_BASE
		generateShop()
	}

	function leaveShop() {
		if (state.screen !== "shop") return
		const next = nextStagePosition(state.zone, state.stage)
		state.zone = next.zone
		state.stage = next.stage
		startStage()
	}

	function buyItem(type: "keycap" | "macro", index: number) {
		if (state.screen !== "shop") return
		if (type === "keycap") {
			const id = state.shopKeycaps[index]
			const definition = KEYCAPS[id]
			if (!definition || state.keycaps.length >= MAX_KEYCAPS || state.tokens < definition.basePrice) return
			state.tokens -= definition.basePrice
			state.keycaps.push(id)
			runItemData.push({})
			stageItemData.push({})
			state.shopKeycaps[index] = ""
			return
		}

		const id = state.shopMacro
		const definition = id ? MACROS[id] : undefined
		if (!definition || state.macros.length >= MAX_MACROS || state.tokens < definition.basePrice) return
		state.tokens -= definition.basePrice
		state.macros.push(definition.id)
		state.shopMacro = null
	}

	function sellKeycap(index: number) {
		if (state.screen !== "shop") return
		const id = state.keycaps[index]
		const definition = KEYCAPS[id]
		if (!definition) return
		state.tokens += Math.floor(definition.basePrice / 2)
		state.keycaps.splice(index, 1)
		runItemData.splice(index, 1)
		stageItemData.splice(index, 1)
	}

	function sellMacro(index: number) {
		if (state.screen !== "shop") return
		const id = state.macros[index]
		const definition = MACROS[id]
		if (!definition) return
		state.tokens += Math.floor(definition.basePrice / 2)
		state.macros.splice(index, 1)
	}

	function rerollShop() {
		if (state.screen !== "shop" || state.tokens < state.rerollCost) return
		state.tokens -= state.rerollCost
		state.rerollCost += 1
		generateShop()
	}

	function cancelGlitch() {
		if (!state.activeGlitch || state.glitchState?.cancelled === true) return
		const glitch = GLITCHES[state.activeGlitch]
		if (glitch.onCancel) glitch.onCancel({ events, state, forceFail: false })
		state.glitchState = { ...(state.glitchState ?? {}), cancelled: true }
	}

	function triggerMacro(index: number) {
		if (state.screen !== "stage") return
		registerInputIntent()
		const id = state.macros[index]
		const definition = MACROS[id]
		if (!definition) return
		if (id === "escape" && !state.activeGlitch) return
		if (id === "insurance" && insuranceArmed) return

		const result = definition.onUse({
			events,
			state,
			cancelGlitch,
			armInsurance: () => {
				insuranceArmed = true
			},
		})
		state.macros.splice(index, 1)
		events.emit("macro_used", { itemId: id, result })
		if (state.score >= state.quota) completeStage()
	}

	function enterEndless() {
		if (state.screen !== "standardClear") return
		state.endless = true
		const next = nextStagePosition(state.zone, state.stage)
		state.zone = next.zone
		state.stage = next.stage
		startStage()
	}

	function finishStandardRun() {
		if (state.screen !== "standardClear") return
		state.finalScore = state.runScore
		events.emit("run_over", {
			win: true,
			finalScore: state.finalScore,
			zoneReached: state.zone,
		})
		state.screen = "runOver"
	}

	function restart() {
		start()
	}

	function quitToMenu() {
		state.screen = "menu"
	}

	function exportState(): string {
		const save: SavedRun = {
			version: SAVE_VERSION,
			state: snapshot(),
			runItemData,
			stageItemData,
			naturalMult: scorer.mult,
			stageAttemptedChars,
			stageCorrectChars,
			runAttemptedChars,
			runCorrectChars,
			preserveMultForWord,
			insuranceArmed,
			stageElapsedMs,
			stageIdleMs,
		}
		return JSON.stringify(save)
	}

	function loadState(json: string): boolean {
		try {
			const parsed: unknown = JSON.parse(json)
			if (
				!isRecord(parsed)
				|| parsed.version !== SAVE_VERSION
				|| !isRecord(parsed.state)
			) return false
			const save = parsed as unknown as SavedRun
			const savedStage = save.state.stage ?? state.stage
			const savedZone = Number(save.state.zone ?? state.zone)
			const savedEndless = Boolean(save.state.endless)
			state = {
				...state,
				...save.state,
				stageDurationMs: Number(save.state.stageDurationMs ?? stageDurationMs(savedStage)),
				aegisActive: Boolean(
					save.state.aegisActive
					?? (!savedEndless && savedZone <= AEGIS_PROTECTED_ZONE_MAX),
				),
				aegisRescues: Number(save.state.aegisRescues ?? 0),
				stageRescued: Boolean(save.state.stageRescued ?? false),
				focusPaused: Boolean(save.state.focusPaused ?? false),
				threatBand: save.state.threatBand ?? threatBandForZone(savedZone),
				overdriveCharge: Number(save.state.overdriveCharge ?? 0),
				totalTokensEarned: Number(save.state.totalTokensEarned ?? 0),
				keycaps: [...save.state.keycaps],
				macros: [...save.state.macros],
				shopKeycaps: [...save.state.shopKeycaps],
				upcomingWords: [...save.state.upcomingWords],
			}
			runItemData = save.runItemData.map((data) => ({ ...data }))
			stageItemData = save.stageItemData.map((data) => ({ ...data }))
			scorer = createScorer({ combo: state.combo, mult: save.naturalMult })
			stageAttemptedChars = save.stageAttemptedChars
			stageCorrectChars = save.stageCorrectChars
			runAttemptedChars = save.runAttemptedChars
			runCorrectChars = save.runCorrectChars
			preserveMultForWord = save.preserveMultForWord
			insuranceArmed = save.insuranceArmed
			stageElapsedMs = save.stageElapsedMs
			stageIdleMs = Number(save.stageIdleMs ?? 0)
			ensureItemRuntime()
			return true
		} catch {
			return false
		}
	}

	return {
		snapshot,
		events,
		start,
		skipWarmup,
		feedChar,
		backspace,
		advance,
		continueToNextStage,
		enterEndless,
		finishStandardRun,
		leaveShop,
		buyItem,
		sellKeycap,
		sellMacro,
		rerollShop,
		triggerMacro,
		restart,
		quitToMenu,
		exportState,
		loadState,
	}
}
