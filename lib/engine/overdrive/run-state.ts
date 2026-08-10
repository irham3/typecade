import { createEmitter } from "./emitter"
import type { EngineEvents } from "./events"
import type {
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
	AEGIS_PROTECTED_ZONE_MAX,
	INTEREST_CAP,
	STAGE_DURATION_BY_TYPE,
} from "./constants"
import { getStageQuota } from "./progression"
import { createRng } from "../rng"
import type { RNG } from "../rng"
import { KEYCAPS, MACROS } from "./items"
import type { BaseItemContext, RuntimeData } from "./items/registry"

export const MAX_KEYCAPS = 5
export const MAX_MACROS = 2
export const SHOP_REROLL_BASE = 5

const BUILD_TRIGGER_BIAS = 0.12
const ANTI_REPEAT_WINDOW = 30
const SAVE_VERSION = 5
const PUNCTUATION = [".", ",", "?", "!"] as const

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

export type RunContext = {
	opts: CreateRunOptions
	events: ReturnType<typeof createEmitter<EngineEvents>>
	startingZone: number
	sourceWords: string[]
	longWords: string[]
	doubleLetterWords: string[]
	homeRowWords: string[]
	rootRng: RNG
	wordsRng: RNG
	shopRng: RNG
	glitchRng: RNG
	recentWords: string[]
	startingKeycaps: string[]
	startingMacros: string[]
	state: RunSnapshot
	scorer: ReturnType<typeof createScorer>
	runItemData: RuntimeData[]
	stageItemData: RuntimeData[]
	stageAttemptedChars: number
	stageCorrectChars: number
	runAttemptedChars: number
	runCorrectChars: number
	preserveMultForWord: boolean
	insuranceArmed: boolean
	stageInterestCap: number
	stageElapsedMs: number
	stageIdleMs: number
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

export function stageDurationMs(stage: StageType): number {
	return STAGE_DURATION_BY_TYPE[stage]
}

export function threatBandForZone(zone: number): ThreatBand {
	if (zone <= 2) return "protected"
	if (zone <= 4) return "pressure"
	if (zone <= 6) return "overclocked"
	return "lethal"
}

function createInitialSnapshot(
	opts: CreateRunOptions,
	startingZone: number,
	startingKeycaps: string[],
	startingMacros: string[],
): RunSnapshot {
	return {
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
		targetOrdinal: 0,
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
}

export function createRunContext(opts: CreateRunOptions): RunContext {
	if (opts.words.length === 0) throw new Error("Overdrive requires a non-empty word pool")

	const startingZone = Math.max(1, Math.floor(opts.startingZone ?? 1))
	const sourceWords = [...new Set(opts.words.map((word) => word.trim()).filter(Boolean))]
	const longWords = sourceWords.filter((word) => word.replace(/[^\p{L}]/gu, "").length >= 8)
	const doubleLetterWords = sourceWords.filter((word) => /(.)\1/i.test(word))
	const homeRowWords = sourceWords.filter((word) => {
		const letters = word.replace(/[^\p{L}]/gu, "")
		return letters.length > 0 && /^[asdfghjkl]+$/i.test(letters)
	})
	const startingKeycaps = (opts.startingKeycaps ?? [])
		.filter((id) => KEYCAPS[id])
		.slice(0, MAX_KEYCAPS)
	const startingMacros = (opts.startingMacros ?? [])
		.filter((id) => MACROS[id])
		.slice(0, MAX_MACROS)
	const rootRng = createRng(opts.seed)

	return {
		opts,
		events: createEmitter<EngineEvents>(),
		startingZone,
		sourceWords,
		longWords,
		doubleLetterWords,
		homeRowWords,
		rootRng,
		wordsRng: rootRng.fork("words"),
		shopRng: rootRng.fork("shop"),
		glitchRng: rootRng.fork("glitch"),
		recentWords: [],
		startingKeycaps,
		startingMacros,
		state: createInitialSnapshot(opts, startingZone, startingKeycaps, startingMacros),
		scorer: createScorer(),
		runItemData: startingKeycaps.map(() => ({})),
		stageItemData: startingKeycaps.map(() => ({})),
		stageAttemptedChars: 0,
		stageCorrectChars: 0,
		runAttemptedChars: 0,
		runCorrectChars: 0,
		preserveMultForWord: false,
		insuranceArmed: false,
		stageInterestCap: INTEREST_CAP,
		stageElapsedMs: 0,
		stageIdleMs: 0,
	}
}

export function resetRng(ctx: RunContext) {
	ctx.rootRng = createRng(ctx.opts.seed)
	ctx.wordsRng = ctx.rootRng.fork("words")
	ctx.shopRng = ctx.rootRng.fork("shop")
	ctx.glitchRng = ctx.rootRng.fork("glitch")
	ctx.recentWords = []
}

export function resetRunSnapshot(ctx: RunContext) {
	ctx.state = {
		...ctx.state,
		screen: "menu",
		zone: ctx.startingZone,
		stage: "warmup",
		endless: false,
		timeLeftMs: stageDurationMs("warmup"),
		stageDurationMs: stageDurationMs("warmup"),
		aegisActive: ctx.startingZone <= AEGIS_PROTECTED_ZONE_MAX,
		aegisRescues: 0,
		stageRescued: false,
		focusPaused: false,
		threatBand: threatBandForZone(ctx.startingZone),
		overdriveCharge: 0,
		targetOrdinal: 0,
		score: 0,
		runScore: 0,
		standardScore: 0,
		endlessScore: 0,
		finalScore: undefined,
		tokenBreakdown: undefined,
		quota: getStageQuota(ctx.startingZone, "warmup"),
		combo: 0,
		maxCombo: 0,
		mult: 1,
		tokens: ctx.opts.startingTokens ?? 0,
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
		keycaps: [...ctx.startingKeycaps],
		macros: [...ctx.startingMacros],
		shopKeycaps: [],
		shopMacro: null,
		rerollCost: SHOP_REROLL_BASE,
		activeGlitch: null,
		glitchState: null,
		stageItemImpact: {},
		runItemImpact: {},
	}
}

export function emptyImpact(): ItemImpact {
	return { triggers: 0, score: 0, tokens: 0, timeMs: 0, protections: 0 }
}

export function cloneImpactMap(source: Record<string, ItemImpact>): Record<string, ItemImpact> {
	return Object.fromEntries(
		Object.entries(source).map(([id, impact]) => [id, { ...impact }]),
	)
}

export function snapshotRun(ctx: RunContext): RunSnapshot {
	const state = ctx.state
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

export function ensureItemRuntime(ctx: RunContext) {
	while (ctx.runItemData.length < ctx.state.keycaps.length) ctx.runItemData.push({})
	while (ctx.stageItemData.length < ctx.state.keycaps.length) ctx.stageItemData.push({})
	ctx.runItemData.length = ctx.state.keycaps.length
	ctx.stageItemData.length = ctx.state.keycaps.length
}

export function recordImpact(
	ctx: RunContext,
	itemId: string,
	contribution: ItemContribution,
) {
	const stageImpact = ctx.state.stageItemImpact[itemId] ?? emptyImpact()
	const runImpact = ctx.state.runItemImpact[itemId] ?? emptyImpact()
	stageImpact.triggers += 1
	runImpact.triggers += 1

	if (contribution.kind === "token") {
		stageImpact.tokens += contribution.amount
		runImpact.tokens += contribution.amount
		ctx.state.totalTokensEarned += Math.max(0, contribution.amount)
	}
	if (contribution.kind === "time") {
		stageImpact.timeMs += contribution.amount
		runImpact.timeMs += contribution.amount
	}
	if (contribution.kind === "protection") {
		stageImpact.protections += Math.max(0, contribution.amount)
		runImpact.protections += Math.max(0, contribution.amount)
	}

	ctx.state.stageItemImpact[itemId] = stageImpact
	ctx.state.runItemImpact[itemId] = runImpact
	ctx.events.emit("item_triggered", { itemId, trigger: contribution.label, contribution })
}

export function recordScoreImpact(ctx: RunContext, itemIds: string[], score: number) {
	if (itemIds.length === 0 || score <= 0) return
	const share = score / itemIds.length
	for (const itemId of itemIds) {
		const stageImpact = ctx.state.stageItemImpact[itemId] ?? emptyImpact()
		const runImpact = ctx.state.runItemImpact[itemId] ?? emptyImpact()
		stageImpact.score += share
		runImpact.score += share
		ctx.state.stageItemImpact[itemId] = stageImpact
		ctx.state.runItemImpact[itemId] = runImpact
	}
}

export function baseItemContext(
	ctx: RunContext,
	index: number,
	itemId: string,
): BaseItemContext {
	ensureItemRuntime(ctx)
	return {
		events: ctx.events,
		state: ctx.state,
		runData: ctx.runItemData[index],
		stageData: ctx.stageItemData[index],
		proc: (_trigger, contribution) => {
			recordImpact(ctx, itemId, contribution)
		},
	}
}

export function forEachKeycap(
	ctx: RunContext,
	callback: (id: string, index: number, context: BaseItemContext) => void,
) {
	ensureItemRuntime(ctx)
	ctx.state.keycaps.forEach((id, index) => {
		if (!KEYCAPS[id]) return
		callback(id, index, baseItemContext(ctx, index, id))
	})
}

export function getBuildBiasedWord(ctx: RunContext): string {
	const trainingPool = ctx.state.zone === 1
		? BEGINNER_SIGNALS[ctx.state.language][ctx.state.stage]
		: ctx.state.zone === 2
			? ctx.sourceWords.filter((word) => {
				const length = word.replace(/[^\p{L}]/gu, "").length
				return length >= 3 && length <= 5
			})
			: null
	if (trainingPool && trainingPool.length > 0) {
		let signal = trainingPool[0]
		for (let attempt = 0; attempt < 24; attempt += 1) {
			signal = ctx.wordsRng.pick(trainingPool)
			if (!ctx.recentWords.includes(signal.toLowerCase())) break
		}
		ctx.recentWords.push(signal.toLowerCase())
		ctx.recentWords = ctx.recentWords.slice(-Math.min(ANTI_REPEAT_WINDOW, trainingPool.length))
		return signal
	}

	const pools: string[][] = []
	if (ctx.state.keycaps.includes("longshot") && ctx.longWords.length > 0) pools.push(ctx.longWords)
	if (ctx.state.keycaps.includes("double_tap") && ctx.doubleLetterWords.length > 0) {
		pools.push(ctx.doubleLetterWords)
	}
	if (ctx.state.keycaps.includes("home_row") && ctx.homeRowWords.length > 0) {
		pools.push(ctx.homeRowWords)
	}

	let candidate = ""
	for (let attempt = 0; attempt < 24; attempt += 1) {
		const useBias = pools.length > 0 && ctx.wordsRng.next() < BUILD_TRIGGER_BIAS
		const pool = useBias ? ctx.wordsRng.pick(pools) : ctx.sourceWords
		candidate = ctx.wordsRng.pick(pool)
		const repeatKey = candidate.toLowerCase()
		if (!ctx.recentWords.includes(repeatKey)) break
	}

	const repeatKey = candidate.toLowerCase()
	ctx.recentWords.push(repeatKey)
	ctx.recentWords = ctx.recentWords.slice(-ANTI_REPEAT_WINDOW)

	if (
		ctx.state.zone >= 3
		&& ctx.state.keycaps.includes("punctuator")
		&& ctx.wordsRng.next() < BUILD_TRIGGER_BIAS
	) {
		candidate += ctx.wordsRng.pick([...PUNCTUATION])
	}
	return candidate
}

export function persistentMult(ctx: RunContext): number {
	let add = 0
	let multiplier = 1
	ctx.state.keycaps.forEach((id, index) => {
		if (id === "snowball") add += Number(ctx.runItemData[index]?.permanentMult ?? 0)
		if (id === "overclock") add += Number(ctx.stageItemData[index]?.bonus ?? 0)
		if (id === "glass_keycap") multiplier *= 3
	})
	return (ctx.scorer.mult + add) * multiplier
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function exportRunState(ctx: RunContext): string {
	const save: SavedRun = {
		version: SAVE_VERSION,
		state: snapshotRun(ctx),
		runItemData: ctx.runItemData,
		stageItemData: ctx.stageItemData,
		naturalMult: ctx.scorer.mult,
		stageAttemptedChars: ctx.stageAttemptedChars,
		stageCorrectChars: ctx.stageCorrectChars,
		runAttemptedChars: ctx.runAttemptedChars,
		runCorrectChars: ctx.runCorrectChars,
		preserveMultForWord: ctx.preserveMultForWord,
		insuranceArmed: ctx.insuranceArmed,
		stageElapsedMs: ctx.stageElapsedMs,
		stageIdleMs: ctx.stageIdleMs,
	}
	return JSON.stringify(save)
}

export function loadRunState(ctx: RunContext, json: string): boolean {
	try {
		const parsed: unknown = JSON.parse(json)
		if (
			!isRecord(parsed)
			|| parsed.version !== SAVE_VERSION
			|| !isRecord(parsed.state)
		) return false
		const save = parsed as unknown as SavedRun
		const savedStage = save.state.stage ?? ctx.state.stage
		const savedZone = Number(save.state.zone ?? ctx.state.zone)
		const savedEndless = Boolean(save.state.endless)
		ctx.state = {
			...ctx.state,
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
			targetOrdinal: Number(save.state.targetOrdinal ?? 0),
			totalTokensEarned: Number(save.state.totalTokensEarned ?? 0),
			keycaps: [...save.state.keycaps],
			macros: [...save.state.macros],
			shopKeycaps: [...save.state.shopKeycaps],
			upcomingWords: [...save.state.upcomingWords],
		}
		ctx.runItemData = save.runItemData.map((data) => ({ ...data }))
		ctx.stageItemData = save.stageItemData.map((data) => ({ ...data }))
		ctx.scorer = createScorer({ combo: ctx.state.combo, mult: save.naturalMult })
		ctx.stageAttemptedChars = save.stageAttemptedChars
		ctx.stageCorrectChars = save.stageCorrectChars
		ctx.runAttemptedChars = save.runAttemptedChars
		ctx.runCorrectChars = save.runCorrectChars
		ctx.preserveMultForWord = save.preserveMultForWord
		ctx.insuranceArmed = save.insuranceArmed
		ctx.stageElapsedMs = save.stageElapsedMs
		ctx.stageIdleMs = Number(save.stageIdleMs ?? 0)
		ensureItemRuntime(ctx)
		return true
	} catch {
		return false
	}
}
