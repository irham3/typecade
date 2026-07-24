import { createEmitter } from "./emitter"
import { EngineEvents, StageType, RunSnapshot, Modifiers } from "./types"
import { createScorer } from "./scoring"
import { STAGE_DURATION_MS, QUOTA, ENDLESS_QUOTA_FACTOR, CLEAR_REWARD, TIME_BONUS_PER_10S, INTEREST_PER_5_TOKENS, INTEREST_CAP, WARMUP_SKIP_REWARD } from "./constants"
import { createRng } from "../rng"
import { KEYCAPS, MACROS, GLITCHES, ItemContext } from "./items"

export function createRun(opts: { seed: string; words: string[] }) {
	const events = createEmitter<EngineEvents>()
	const rootRng = createRng(opts.seed)
	const wordsRng = rootRng.fork("words")
	const shopRng = rootRng.fork("shop")
	const glitchRng = rootRng.fork("glitch")
	
	const wordPool = [...opts.words]
	let poolIndex = wordPool.length

	function getNextWord() {
		if (poolIndex >= wordPool.length) {
			wordsRng.shuffle(wordPool)
			poolIndex = 0
		}
		return wordPool[poolIndex++]
	}

	let state: RunSnapshot = {
		screen: "menu",
		zone: 1,
		stage: "warmup",
		timeLeftMs: STAGE_DURATION_MS,
		score: 0,
		quota: QUOTA[1].warmup,
		combo: 0,
		mult: 1,
		tokens: 0,
		accuracy: 100,
		currentWord: "",
		caretIndex: 0,
		wordDirty: false,
		upcomingWords: [],
		keycaps: [],
		macros: [],
		shopKeycaps: [],
		shopMacro: null,
		rerollCost: 5,
		activeGlitch: null,
		glitchState: null,
	}

	let scorer = createScorer(0)
	let totalChars = 0
	let correctChars = 0
	
	// Modifiers that keycaps can alter
	let modifiers: Modifiers = {
		baseBonus: 0,
		multAdd: 0,
		comboBatteryActive: false,
		baseMultiplier: 1,
		finalMultiplier: 1,
		interestCap: INTEREST_CAP,
		multMultiplier: 1,
		preventMultReset: false,
		glitchCancelled: false,
	}

	function snapshot(): RunSnapshot {
		return { ...state }
	}

	function calcQuota(zone: number, stage: StageType) {
		if (zone <= 8) return QUOTA[zone][stage]
		const base = QUOTA[8][stage]
		return Math.floor(base * Math.pow(ENDLESS_QUOTA_FACTOR, zone - 8))
	}

	function startStage() {
		state.screen = "stage"
		state.timeLeftMs = STAGE_DURATION_MS
		state.score = 0
		state.quota = calcQuota(state.zone, state.stage)
		
		state.currentWord = getNextWord()
		state.upcomingWords = Array.from({ length: 8 }, getNextWord)
		state.caretIndex = 0
		state.wordDirty = false
		
		totalChars = 0
		correctChars = 0
		state.accuracy = 100
		
		// Reset modifiers for the new stage
		modifiers.baseBonus = 0
		modifiers.multAdd = 0
		modifiers.comboBatteryActive = false
		modifiers.baseMultiplier = 1
		modifiers.finalMultiplier = 1
		modifiers.interestCap = INTEREST_CAP
		modifiers.multMultiplier = 1
		modifiers.preventMultReset = false
		modifiers.glitchCancelled = false
		
		scorer = createScorer(0)

		// Create item context
		const ctx: ItemContext = {
			events,
			modifiers,
			api: api(),
			state
		}

		// Equip keycaps
		for (const k of state.keycaps) {
			const def = KEYCAPS[k]
			if (def && def.onEquip) {
				def.onEquip(ctx)
			}
		}

		// Apply Glitch if glitch stage
		if (state.stage === "glitch") {
			const keys = Object.keys(GLITCHES)
			state.activeGlitch = keys[Math.floor(glitchRng.next() * keys.length)]
			state.glitchState = {}
		} else {
			state.activeGlitch = null
			state.glitchState = null
		}

		if (state.activeGlitch && !modifiers.glitchCancelled) {
			const glitch = GLITCHES[state.activeGlitch]
			if (glitch.onStageStart) glitch.onStageStart(ctx)
		}
	}

	function start() {
		state.zone = 1
		state.stage = "warmup"
		state.tokens = 0
		state.win = false
		state.keycaps = []
		state.macros = []
		state.rerollCost = 5
		startStage()
	}

	function skipWarmup() {
		if (state.stage !== "warmup") return
		state.tokens += WARMUP_SKIP_REWARD
		state.stage = "rush"
		startStage()
	}

	function feedChar(c: string) {
		if (state.screen !== "stage") return

		if (c === " ") {
			if (state.caretIndex === state.currentWord.length) {
				let shieldMult = false
				if (state.wordDirty) {
					if (modifiers.comboBatteryActive) {
						shieldMult = true
						modifiers.comboBatteryActive = false // consumed
					}
					if (modifiers.preventMultReset) {
						shieldMult = true
					}
				}

				// The base scorer returns (length + baseBonus) * mult
				// Then we apply our own baseMultiplier and multMultiplier
				const res = scorer.completeWord(state.currentWord, state.wordDirty, shieldMult)
				
				let gained = res.gained
				if (res.clean) {
					// We need to inject baseBonus and multipliers since standard scorer doesn't handle them fully
					const basePoints = state.currentWord.length + modifiers.baseBonus
					const modifiedBase = basePoints * modifiers.baseMultiplier
					const finalMult = (res.mult + modifiers.multAdd) * modifiers.multMultiplier
					
					gained = modifiedBase * finalMult * modifiers.finalMultiplier
					
					// Reset finalMultiplier since it usually applies to next word only (e.g. Second Wind)
					modifiers.finalMultiplier = 1
				} else {
					gained = 0
				}

				state.score += gained
				state.combo = res.combo
				state.mult = res.mult + modifiers.multAdd
				
				events.emit("word_complete", { word: state.currentWord, gained, combo: state.combo, mult: state.mult })
				events.emit("quota_progress", { score: state.score, quota: state.quota })
				
				if (state.activeGlitch && !modifiers.glitchCancelled) {
					const glitch = GLITCHES[state.activeGlitch]
					if (glitch.onWordComplete) glitch.onWordComplete({ events, modifiers, api: api(), state })
				}
				
				state.currentWord = state.upcomingWords.shift()!
				state.upcomingWords.push(getNextWord())
				state.caretIndex = 0
				state.wordDirty = false
			}
			return
		}

		if (state.caretIndex < state.currentWord.length) {
			totalChars++
			if (c === state.currentWord[state.caretIndex]) {
				state.caretIndex++
				correctChars++
			} else {
				state.wordDirty = true
				events.emit("typo", { expected: state.currentWord[state.caretIndex], got: c })
				if (state.activeGlitch && !modifiers.glitchCancelled) {
					const glitch = GLITCHES[state.activeGlitch]
					if (glitch.onTypo) glitch.onTypo({ events, modifiers, api: api(), state }, state.currentWord[state.caretIndex], c)
				}
			}
			state.accuracy = Math.floor((correctChars / totalChars) * 100)
			
			if (state.activeGlitch && !modifiers.glitchCancelled) {
				const glitch = GLITCHES[state.activeGlitch]
				if (glitch.onKeystroke) glitch.onKeystroke({ events, modifiers, api: api(), state }, c)
			}
		}
	}

	function backspace() {
		if (state.screen !== "stage") return
		if (state.activeGlitch === "no_backspace" && !modifiers.glitchCancelled) return
		if (state.caretIndex > 0) {
			state.caretIndex--
		}
	}

	function advance(ms: number) {
		if (state.screen !== "stage") return
		
		if (state.activeGlitch && !modifiers.glitchCancelled) {
			const glitch = GLITCHES[state.activeGlitch]
			if (glitch.onTick) glitch.onTick({ events, modifiers, api: api(), state }, ms)
		}
		
		state.timeLeftMs = Math.max(0, state.timeLeftMs - ms)
		
		if (state.timeLeftMs === 0) {
			if (state.activeGlitch && !modifiers.glitchCancelled) {
				const glitch = GLITCHES[state.activeGlitch]
				if (glitch.onStageEnd) glitch.onStageEnd({ events, modifiers, api: api(), state })
			}

			if (state.score >= state.quota) {
				let earned = CLEAR_REWARD[state.stage as keyof typeof CLEAR_REWARD]
				const timeBonus = 0
				let mTokenMultiplier = 1
				if (state.glitchState && state.glitchState.tokenMultiplier) {
					mTokenMultiplier = state.glitchState.tokenMultiplier
				}
				const interest = Math.min(Math.floor(state.tokens / 5) * INTEREST_PER_5_TOKENS, modifiers.interestCap)
				earned += timeBonus + interest
				earned *= mTokenMultiplier
				
				state.tokens += earned
				
				events.emit("stage_clear", { zone: state.zone, stage: state.stage, tokensEarned: earned, timeLeftMs: state.timeLeftMs })
				state.screen = "stageResult"
				
				if (state.zone === 8 && state.stage === "glitch") {
					state.win = true
				}
			} else {
				events.emit("stage_fail", { zone: state.zone, stage: state.stage })
				events.emit("run_over", { win: false, finalScore: state.score, zoneReached: state.zone })
				state.screen = "runOver"
			}
		}
	}

	function getRandomItem(type: "keycap" | "macro"): string {
		if (type === "macro") {
			const keys = Object.keys(MACROS)
			return keys[Math.floor(shopRng.next() * keys.length)]
		}
		
		const r = shopRng.next() * 100
		let targetRarity = "common"
		if (r >= 60 && r < 88) targetRarity = "uncommon"
		else if (r >= 88 && r < 98) targetRarity = "rare"
		else if (r >= 98) targetRarity = "legendary"
		
		const pool = Object.values(KEYCAPS).filter(k => k.rarity === targetRarity)
		if (pool.length === 0) {
			// Fallback if legendary pool empty in MVP
			const anyPool = Object.values(KEYCAPS)
			return anyPool[Math.floor(shopRng.next() * anyPool.length)].id
		}
		
		return pool[Math.floor(shopRng.next() * pool.length)].id
	}

	function generateShop() {
		state.shopKeycaps = [
			getRandomItem("keycap"),
			getRandomItem("keycap")
		]
		state.shopMacro = getRandomItem("macro")
	}

	function continueToNextStage() {
		if (state.screen !== "stageResult") return
		state.screen = "shop"
		state.rerollCost = 5 // reset per visit
		generateShop()
	}

	function leaveShop() {
		if (state.screen !== "shop") return
		
		if (state.stage === "warmup") {
			state.stage = "rush"
		} else if (state.stage === "rush") {
			state.stage = "glitch"
		} else {
			state.zone++
			state.stage = "warmup"
		}
		
		startStage()
	}

	function buyItem(type: "keycap" | "macro", index: number) {
		if (state.screen !== "shop") return
		
		if (type === "keycap") {
			const id = state.shopKeycaps[index]
			if (!id) return
			const def = KEYCAPS[id]
			if (state.tokens >= def.basePrice && state.keycaps.length < 5) {
				state.tokens -= def.basePrice
				state.keycaps.push(id)
				state.shopKeycaps[index] = "" // bought
			}
		} else if (type === "macro") {
			const id = state.shopMacro
			if (!id) return
			const def = MACROS[id]
			if (state.tokens >= def.basePrice && state.macros.length < 2) {
				state.tokens -= def.basePrice
				state.macros.push(id)
				state.shopMacro = null // bought
			}
		}
	}

	function sellItem(type: "keycap" | "macro", index: number) {
		if (state.screen !== "shop") return
		if (type === "keycap") {
			const id = state.keycaps[index]
			if (!id) return
			const def = KEYCAPS[id]
			state.tokens += Math.floor(def.basePrice / 2)
			state.keycaps.splice(index, 1)
		} else {
			const id = state.macros[index]
			if (!id) return
			const def = MACROS[id]
			state.tokens += Math.floor(def.basePrice / 2)
			state.macros.splice(index, 1)
		}
	}

	function rerollShop() {
		if (state.screen !== "shop") return
		if (state.tokens >= state.rerollCost) {
			state.tokens -= state.rerollCost
			state.rerollCost++
			generateShop()
		}
	}

	function duplicateRandomKeycap() {
		const eligible = state.keycaps.filter(id => {
			const r = KEYCAPS[id].rarity
			return r === "common" || r === "uncommon"
		})
		if (eligible.length > 0 && state.keycaps.length < 5) {
			const toDup = eligible[Math.floor(rootRng.next() * eligible.length)] // any rng works here for macro
			state.keycaps.push(toDup)
		}
	}

	function triggerMacro(index: number) {
		if (state.screen !== "stage") return
		const id = state.macros[index]
		if (!id) return
		
		const def = MACROS[id]
		if (def && def.onUse) {
			const ctx: ItemContext = {
				events,
				modifiers,
				api: api(),
				state
			}
			def.onUse(ctx)
			// Macros are consumed on use for now?
			// GDD doesn't explicitly say they are consumed, but usually macros/potions are consumable.
			// Let's assume they are consumable for MVP.
			state.macros.splice(index, 1)
		}
	}

	function restart() {
		start()
	}

	function api() {
		return {
			snapshot,
			events,
			start,
			skipWarmup,
			feedChar,
			backspace,
			advance,
			continueToNextStage,
			leaveShop,
			buyItem,
			sellItem,
			rerollShop,
			duplicateRandomKeycap,
			triggerMacro,
			restart
		}
	}

	return api()
}
