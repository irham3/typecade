import { create } from "zustand"
import {
	createRun,
	type RunMode,
	type RunSnapshot,
	type WordPoolLanguage,
} from "@/lib/engine/overdrive"
import wordsEN from "@/data/words-en.json"
import wordsID from "@/data/words-id.json"
import {
	OVERDRIVE_RNG_VERSION,
	OVERDRIVE_RULESET_VERSION,
	OVERDRIVE_WORD_POOL_VERSION,
	trackEvent,
	type TelemetryContext,
} from "@/lib/telemetry"
import { KEYCAPS, MACROS } from "@/lib/engine/overdrive/items"
import { emitPresentationEvent } from "./presentation/events"

export const OVERDRIVE_SAVE_KEY = "typecade_overdrive_save"
export const OVERDRIVE_BRIEFING_KEY = "typecade_overdrive_briefing_seen"

type RunApi = ReturnType<typeof createRun>

type GameStore = RunSnapshot & {
	api?: RunApi
	armedItemIds: string[]
	paused: boolean
	stageReady: boolean
	coachingEnabled: boolean
	selectedLanguage: WordPoolLanguage
	resumeAvailable: boolean
	setPaused: (paused: boolean) => void
	engageStage: () => void
	setLanguage: (language: WordPoolLanguage) => void
	setResumeAvailable: (available: boolean) => void
	startNormalRun: () => void
	startPracticeRun: () => void
	startDailyRun: () => void
	resumeRun: () => boolean
	quitToMenu: () => void
}

const initialSnapshot = createRun({
	seed: "menu-preview",
	words: wordsEN,
}).snapshot()

function wordPool(language: WordPoolLanguage) {
	return language === "ID" ? wordsID : wordsEN
}

function dailySeed(language: WordPoolLanguage) {
	return `${new Date().toISOString().slice(0, 10)}-${language.toLowerCase()}`
}

export const useGame = create<GameStore>((set, get) => {
	function telemetryContext(snapshot: RunSnapshot): TelemetryContext {
		return {
			seed: snapshot.seed,
			mode: snapshot.mode,
			language: snapshot.language,
			rulesetVersion: OVERDRIVE_RULESET_VERSION,
			rngVersion: OVERDRIVE_RNG_VERSION,
			wordPoolVersion: OVERDRIVE_WORD_POOL_VERSION,
		}
	}

	function trackStageStart(snapshot: RunSnapshot) {
		trackEvent("stage_start", {
			...telemetryContext(snapshot),
			zone: snapshot.zone,
			stage: snapshot.stage,
			quota: snapshot.quota,
		})
		if (snapshot.stage === "glitch" && snapshot.activeGlitch) {
			trackEvent("glitch_start", {
				...telemetryContext(snapshot),
				glitchId: snapshot.activeGlitch,
				zone: snapshot.zone,
			})
		}
	}

	function attach(api: RunApi) {
		const sync = () => set({
			...api.snapshot(),
			api,
			armedItemIds: api.previewItemTriggers(),
		})
		const transition = (action: () => void) => {
			const before = api.snapshot()
			action()
			const after = api.snapshot()
			const enteredStage = after.screen === "stage"
				&& (
					before.screen !== "stage"
					|| after.stage !== before.stage
					|| after.zone !== before.zone
				)
			if (
				enteredStage
				&& (after.stage !== before.stage || after.zone !== before.zone)
			) {
				emitPresentationEvent({ type: "stage-entered", stage: after.stage })
			}
			sync()
			if (enteredStage) set({ stageReady: true })
		}

		api.events.on("word_complete", (payload) => {
			emitPresentationEvent({
				type: "word-completed",
				word: payload.word,
				characterBase: payload.characterBase,
				itemBaseBonus: payload.itemBaseBonus,
				effectiveBase: payload.effectiveBase,
				effectiveMult: payload.effectiveMult,
				finalMultiplier: payload.finalMultiplier,
				scoreGain: payload.scoreGain,
				overdriveReleased: payload.overdriveReleased,
				aegisRecovery: payload.aegisRecovery,
				autoExecuted: payload.autoExecuted,
				appliedItemIds: payload.appliedItemIds,
				targetOrdinal: api.snapshot().targetOrdinal,
				combo: payload.combo,
			})
			const snapshot = api.snapshot()
			if (get().coachingEnabled && snapshot.totalCleanWords >= 3 && typeof window !== "undefined") {
				window.localStorage.setItem(OVERDRIVE_BRIEFING_KEY, "1")
				set({ coachingEnabled: false })
			}
			sync()
		})
		api.events.on("character_accepted", ({ character, caretIndex, charge }) => {
			emitPresentationEvent({
				type: "accepted-character",
				character,
				index: Math.max(0, caretIndex - 1),
				word: api.snapshot().currentWord,
				targetOrdinal: api.snapshot().targetOrdinal,
				combo: api.snapshot().combo,
				charge,
			})
			sync()
		})
		api.events.on("overdrive_ready", () => {
			emitPresentationEvent({ type: "overdrive-ready" })
			sync()
		})
		api.events.on("aegis_rescue", ({ rescueNumber, timeAddedMs }) => {
			emitPresentationEvent({
				type: "aegis-rescue",
				rescueNumber,
				timeAddedMs,
			})
			sync()
		})
		api.events.on("mult_increased", ({ mult }) => {
			emitPresentationEvent({ type: "mult-increased", mult })
			sync()
		})
		api.events.on("stage_clear", ({ zone, stage, tokensEarned, timeLeftMs }) => {
			const snapshot = api.snapshot()
			trackEvent("stage_clear", {
				...telemetryContext(snapshot),
				zone,
				stage,
				score: snapshot.score,
				tokensEarned,
				timeLeftMs,
			})
			emitPresentationEvent({ type: "stage-cleared" })
			sync()
		})
		api.events.on("run_over", ({ win, finalScore, zoneReached }) => {
			const snapshot = api.snapshot()
			trackEvent("run_end", {
				...telemetryContext(snapshot),
				win,
				zone: zoneReached,
				finalScore,
				durationMs: snapshot.runDurationMs,
			})
			if (!win) {
				trackEvent("death_by_zone", {
					...telemetryContext(snapshot),
					zone: zoneReached,
					stage: snapshot.stage,
					wpm: snapshot.wpm,
					score: finalScore,
				})
			}
			emitPresentationEvent({ type: "run-over" })
			sync()
		})
		api.events.on("item_triggered", ({ itemId, trigger, contribution }) => {
			const snapshot = api.snapshot()
			trackEvent("item_proc", {
				...telemetryContext(snapshot),
				itemId,
				trigger,
				zone: snapshot.zone,
				stage: snapshot.stage,
			})
			emitPresentationEvent({
				type: "item-triggered",
				itemId,
				label: trigger,
				contribution,
			})
			sync()
		})
		api.events.on("macro_used", ({ itemId, result }) => {
			const snapshot = api.snapshot()
			trackEvent("macro_use", {
				...telemetryContext(snapshot),
				itemId,
				result,
				zone: snapshot.zone,
				stage: snapshot.stage,
			})
			emitPresentationEvent({ type: "macro-used", itemId, result })
			sync()
		})
		for (const event of ["typo", "mult_change", "quota_progress", "stage_fail"] as const) {
			api.events.on(event, sync)
		}

		const raw = {
			start: api.start,
			skipWarmup: api.skipWarmup,
			feedChar: api.feedChar,
			releaseOverdrive: api.releaseOverdrive,
			backspace: api.backspace,
			advance: api.advance,
			continueToNextStage: api.continueToNextStage,
			enterEndless: api.enterEndless,
			finishStandardRun: api.finishStandardRun,
			leaveShop: api.leaveShop,
			buyItem: api.buyItem,
			sellKeycap: api.sellKeycap,
			sellMacro: api.sellMacro,
			rerollShop: api.rerollShop,
			triggerMacro: api.triggerMacro,
			restart: api.restart,
			quitToMenu: api.quitToMenu,
			loadState: api.loadState,
		}

		api.start = () => transition(raw.start)
		api.skipWarmup = () => {
			const before = api.snapshot()
			transition(raw.skipWarmup)
			const snapshot = api.snapshot()
			if (before.stage === "warmup" && snapshot.stage === "rush") {
				trackStageStart(snapshot)
			}
		}
		api.feedChar = (character) => transition(() => raw.feedChar(character))
		api.releaseOverdrive = () => transition(raw.releaseOverdrive)
		api.backspace = () => transition(raw.backspace)
		api.advance = (ms) => transition(() => raw.advance(ms))
		api.continueToNextStage = () => {
			transition(raw.continueToNextStage)
			const snapshot = api.snapshot()
			if (snapshot.screen === "shop") {
				trackEvent("shop_offer", {
					...telemetryContext(snapshot),
					zone: snapshot.zone,
					keycaps: [...snapshot.shopKeycaps],
					macro: snapshot.shopMacro,
					rerollCost: snapshot.rerollCost,
				})
			}
		}
		api.enterEndless = () => {
			const before = api.snapshot()
			transition(raw.enterEndless)
			const snapshot = api.snapshot()
			if (before.screen === "standardClear" && snapshot.screen === "stage") {
				trackStageStart(snapshot)
			}
		}
		api.finishStandardRun = () => transition(raw.finishStandardRun)
		api.leaveShop = () => {
			transition(raw.leaveShop)
			trackStageStart(api.snapshot())
		}
		api.buyItem = (type, index) => {
			const before = api.snapshot()
			const itemId = type === "keycap" ? before.shopKeycaps[index] : before.shopMacro
			const price = itemId
				? (type === "keycap" ? KEYCAPS[itemId] : MACROS[itemId])?.basePrice
				: undefined
			transition(() => raw.buyItem(type, index))
			if (itemId && price !== undefined && api.snapshot().tokens < before.tokens) {
				trackEvent("shop_buy", {
					...telemetryContext(api.snapshot()),
					itemId,
					itemType: type,
					price,
					zone: before.zone,
				})
			}
		}
		api.sellKeycap = (index) => {
			const before = api.snapshot()
			const itemId = before.keycaps[index]
			const value = itemId ? Math.floor(KEYCAPS[itemId].basePrice / 2) : 0
			transition(() => raw.sellKeycap(index))
			if (itemId && api.snapshot().keycaps.length < before.keycaps.length) {
				trackEvent("shop_sell", {
					...telemetryContext(api.snapshot()),
					itemId,
					itemType: "keycap",
					value,
					zone: before.zone,
				})
			}
		}
		api.sellMacro = (index) => {
			const before = api.snapshot()
			const itemId = before.macros[index]
			const value = itemId ? Math.floor(MACROS[itemId].basePrice / 2) : 0
			transition(() => raw.sellMacro(index))
			if (itemId && api.snapshot().macros.length < before.macros.length) {
				trackEvent("shop_sell", {
					...telemetryContext(api.snapshot()),
					itemId,
					itemType: "macro",
					value,
					zone: before.zone,
				})
			}
		}
		api.rerollShop = () => {
			const before = api.snapshot()
			transition(raw.rerollShop)
			const snapshot = api.snapshot()
			if (snapshot.rerollCost > before.rerollCost) {
				trackEvent("shop_offer", {
					...telemetryContext(snapshot),
					zone: snapshot.zone,
					keycaps: [...snapshot.shopKeycaps],
					macro: snapshot.shopMacro,
					rerollCost: snapshot.rerollCost,
				})
			}
		}
		api.triggerMacro = (index) => transition(() => raw.triggerMacro(index))
		api.restart = () => transition(raw.restart)
		api.quitToMenu = () => transition(raw.quitToMenu)
		api.loadState = (json) => {
			const loaded = raw.loadState(json)
			if (loaded) sync()
			return loaded
		}

		set({
			...api.snapshot(),
			api,
			armedItemIds: api.previewItemTriggers(),
			paused: false,
		})
		return api
	}

	function startRun(seed: string, mode: RunMode) {
		const previous = get()
		if (previous.screen === "runOver") {
			trackEvent("run_restart", {
				...telemetryContext(previous),
				previousScore: previous.finalScore ?? previous.runScore,
			})
		}
		const language = get().selectedLanguage
		const api = attach(createRun({
			seed,
			words: wordPool(language),
			mode,
			language,
		}))
		api.start()
		const coachingEnabled = typeof window !== "undefined"
			&& window.localStorage.getItem(OVERDRIVE_BRIEFING_KEY) !== "1"
		set({ stageReady: true, coachingEnabled })
		const snapshot = api.snapshot()
		trackEvent("run_start", {
			...telemetryContext(snapshot),
			zone: snapshot.zone,
		})
		trackStageStart(snapshot)
	}

	return {
		...initialSnapshot,
		armedItemIds: [],
		paused: false,
		stageReady: false,
		coachingEnabled: false,
		selectedLanguage: "EN",
		resumeAvailable: false,
		setPaused(paused) {
			set({ paused })
		},
		engageStage() {
			set({ stageReady: false })
		},
		setLanguage(language) {
			set({ selectedLanguage: language })
		},
		setResumeAvailable(available) {
			set({ resumeAvailable: available })
		},
		startNormalRun() {
			startRun(`free-${Date.now()}`, "free")
		},
		startPracticeRun() {
			startRun(`practice-${Date.now()}`, "practice")
		},
		startDailyRun() {
			const language = get().selectedLanguage
			startRun(dailySeed(language), "daily")
		},
		resumeRun() {
			if (typeof window === "undefined") return false
			const saved = window.localStorage.getItem(OVERDRIVE_SAVE_KEY)
			if (!saved) return false
			try {
				const parsed = JSON.parse(saved) as {
					state?: {
						seed?: string
						language?: WordPoolLanguage
						screen?: RunSnapshot["screen"]
					}
				}
				const language = parsed.state?.language === "ID" ? "ID" : "EN"
				const seed = parsed.state?.seed
				const screen = parsed.state?.screen
				if (
					!seed
					|| !screen
					|| !["stage", "stageResult", "shop", "standardClear"].includes(screen)
				) {
					window.localStorage.removeItem(OVERDRIVE_SAVE_KEY)
					set({ resumeAvailable: false })
					return false
				}
				const api = attach(createRun({
					seed,
					words: wordPool(language),
					language,
				}))
				const loaded = api.loadState(saved)
				if (!loaded) {
					window.localStorage.removeItem(OVERDRIVE_SAVE_KEY)
					set({ resumeAvailable: false })
					return false
				}
				set({
					selectedLanguage: language,
					resumeAvailable: false,
					stageReady: api.snapshot().screen === "stage",
					coachingEnabled: false,
				})
				return true
			} catch {
				return false
			}
		},
		quitToMenu() {
			const current = get()
			if (current.screen !== "menu" && current.screen !== "runOver") {
				trackEvent("run_abandon", {
					...telemetryContext(current),
					zone: current.zone,
					stage: current.stage,
					score: current.runScore + (current.screen === "stage" ? current.score : 0),
				})
			}
			if (typeof window !== "undefined") {
				window.localStorage.removeItem(OVERDRIVE_SAVE_KEY)
			}
			const api = get().api
			if (api) api.quitToMenu()
			else set({ ...initialSnapshot, screen: "menu" })
			set({
				paused: false,
				stageReady: false,
				coachingEnabled: false,
				resumeAvailable: false,
			})
		},
	}
})
