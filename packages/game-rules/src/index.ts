import type {
	CatchResult,
	CollectionRecord,
	CollectionState,
	EncounterState,
	ExpeditionCheckpoint,
	ExpeditionState,
	FishSpecies,
	FishingSkill,
	RewardTable,
	TypingEvent,
	TypingMetrics,
	ZoneId,
} from "@typecade/contracts"
import { CONTENT_VERSION } from "@typecade/contracts"
import { fishSpecies, getFish, getSkill, shallowCoastZoneOrder } from "@typecade/content"

export interface SeededRng {
	nextFloat(): number
	nextInt(minInclusive: number, maxExclusive: number): number
	pick<T>(items: readonly T[]): T
}

export interface RuleApplication {
	encounter: EncounterState
	events: FishingRuleEvent[]
}

export interface FishingRuleEvent {
	type:
		| "progress"
		| "tension"
		| "durability"
		| "skill-triggered"
		| "skill-used"
		| "phase-changed"
		| "caught"
		| "escaped"
	value?: number
	label?: string
}

export interface SerializedOceanSave {
	contentVersion: typeof CONTENT_VERSION
	expedition: ExpeditionState
	collection: CollectionState
	savedAt: string
}

export const expeditionFishOrder = [
	["reef_minnow", "kelp_darter", "sunny_guppy"],
	["shellback_puffer", "tide_skipper", "coral_fry"],
	["glass_eel", "moonfin_snapper", "reef_shark", "crown_leviathan"],
] as const

const bossPhaseThresholds = [0, 0.34, 0.67] as const

export function createSeededRng(seed: string): SeededRng {
	let state = hashSeed(seed)

	return {
		nextFloat() {
			state += 0x6d2b79f5
			let next = state
			next = Math.imul(next ^ (next >>> 15), next | 1)
			next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
			return ((next ^ (next >>> 14)) >>> 0) / 4294967296
		},
		nextInt(minInclusive: number, maxExclusive: number) {
			return Math.floor(this.nextFloat() * (maxExclusive - minInclusive)) + minInclusive
		},
		pick<T>(items: readonly T[]): T {
			if (items.length === 0) {
				throw new Error("Cannot pick from an empty list")
			}
			return items[this.nextInt(0, items.length)]!
		},
	}
}

export function createInitialCollection(nowIso = new Date(0).toISOString()): CollectionState {
	return {
		records: {},
		coins: 12450,
		materials: 685,
		xp: 24,
		grantedResultKeys: [],
	}
}

export function createShallowCoastExpedition(
	seed: string,
	selectedSkillIds: string[] = ["cast_net", "steel_line", "sonar", "calm_current", "perfect_bait", "reel_mastery"],
): ExpeditionState {
	validateSkills(selectedSkillIds)
	return {
		seed,
		contentVersion: CONTENT_VERSION,
		currentZoneIndex: 0,
		currentEncounterIndex: 0,
		spareLines: 2,
		selectedSkillIds,
		checkpoints: [],
		pendingResults: [],
		complete: false,
	}
}

export function getCurrentFishId(expedition: ExpeditionState): string {
	const zone = expeditionFishOrder[expedition.currentZoneIndex]
	if (!zone) {
		return "crown_leviathan"
	}
	return zone[Math.min(expedition.currentEncounterIndex, zone.length - 1)]!
}

export function getEncounterIndexInRun(expedition: ExpeditionState): number {
	return expeditionFishOrder
		.slice(0, expedition.currentZoneIndex)
		.reduce((total, zone) => total + zone.length, 0) + expedition.currentEncounterIndex
}

export function startEncounter(fish: FishSpecies, seed: string, selectedSkillIds: string[]): EncounterState {
	validateSkills(selectedSkillIds)
	return {
		id: `${seed}:${fish.id}`,
		seed,
		fishId: fish.id,
		status: "active",
		progress: 0,
		tension: 28,
		durability: 100,
		combo: 0,
		perfectWords: 0,
		skillEnergy: selectedSkillIds.includes("sonar") ? 15 : 0,
		elapsedMs: 0,
		timeRemainingMs: fish.baseTimeMs,
		steelLineAvailable: selectedSkillIds.includes("steel_line"),
		calmCurrentRemainingMs: 0,
		bossPhase: 1,
		lastEventId: 0,
	}
}

export function applyTypingEvents(
	encounter: EncounterState,
	fish: FishSpecies,
	typingEvents: readonly TypingEvent[],
	selectedSkillIds: readonly string[],
): RuleApplication {
	let next = { ...encounter }
	const events: FishingRuleEvent[] = []

	for (const event of typingEvents) {
		if (next.status !== "active") {
			break
		}

		if (event.type === "correct-char") {
			next = {
				...next,
				progress: clamp(next.progress + getCorrectCharacterProgress(fish), 0, 1),
				tension: clamp(next.tension - 0.1, 0, 100),
			}
			events.push({ type: "progress", value: next.progress })
		}

		if (event.type === "typo") {
			if (selectedSkillIds.includes("steel_line") && next.steelLineAvailable) {
				next = { ...next, steelLineAvailable: false }
				events.push({ type: "skill-triggered", label: "Steel Line" })
			} else {
				const tension = clamp(next.tension + fish.tensionOnTypo, 0, 100)
				const durability = clamp(next.durability - fish.durabilityOnTypo * (1 + tension / 180), 0, 100)
				next = { ...next, tension, durability, combo: 0 }
				events.push({ type: "tension", value: tension })
				events.push({ type: "durability", value: durability })
			}
		}

		if (event.type === "word-complete") {
			const perfect = event.perfect === true
			const combo = perfect ? next.combo + 1 : 0
			const masteryBonus = selectedSkillIds.includes("reel_mastery") && perfect && combo % 5 === 0 ? 0.08 : 0
			const progressGain = fish.progressPerWord * getBehaviorProgressModifier(fish) * (1 + Math.min(combo, 12) * 0.018) + masteryBonus
			next = {
				...next,
				combo,
				perfectWords: perfect ? next.perfectWords + 1 : next.perfectWords,
				skillEnergy: clamp(next.skillEnergy + (perfect ? 14 : 7), 0, 100),
				progress: clamp(next.progress + progressGain, 0, 1),
				tension: clamp(next.tension - (perfect ? 2.2 : 0.8), 0, 100),
			}
			events.push({ type: "progress", value: next.progress })
			if (masteryBonus > 0) {
				events.push({ type: "skill-triggered", label: "Reel Mastery" })
			}
		}

		next = applyBossPhase(next, events)
		next = settleEncounterStatus(next, events)
	}

	return { encounter: next, events }
}

export function tickEncounter(
	encounter: EncounterState,
	fish: FishSpecies,
	deltaMs: number,
	selectedSkillIds: readonly string[],
): RuleApplication {
	if (encounter.status !== "active") {
		return { encounter, events: [] }
	}

	const deltaSeconds = Math.max(0, deltaMs) / 1000
	const calmFactor = encounter.calmCurrentRemainingMs > 0 ? 0.35 : 1
	const pressure = fish.idlePressurePerSecond * calmFactor * deltaSeconds
	const highTensionDamage = encounter.tension > 78 ? (encounter.tension - 78) * 0.012 * deltaSeconds : 0

	let next: EncounterState = {
		...encounter,
		elapsedMs: encounter.elapsedMs + deltaMs,
		timeRemainingMs: Math.max(0, encounter.timeRemainingMs - deltaMs),
		tension: clamp(encounter.tension + pressure, 0, 100),
		durability: clamp(encounter.durability - highTensionDamage, 0, 100),
		calmCurrentRemainingMs: Math.max(0, encounter.calmCurrentRemainingMs - deltaMs),
	}
	const events: FishingRuleEvent[] = [{ type: "tension", value: next.tension }]

	if (selectedSkillIds.includes("perfect_bait") && next.perfectWords >= 4 && fish.rarity !== "common") {
		next = { ...next, tension: clamp(next.tension - 0.35 * deltaSeconds, 0, 100) }
	}

	next = applyBossPhase(next, events)
	next = settleEncounterStatus(next, events)

	return { encounter: next, events }
}

export function useFishingSkill(encounter: EncounterState, fish: FishSpecies, skillId: string): RuleApplication {
	const skill = getSkill(skillId)
	if (skill.type !== "active" || encounter.status !== "active") {
		return { encounter, events: [] }
	}

	let next = { ...encounter }
	const events: FishingRuleEvent[] = []

	if (skill.id === "cast_net" && next.skillEnergy >= 35) {
		events.push({ type: "skill-used", label: skill.name })
		const instantCapture = fish.rarity === "common" && fish.baseSizeKg <= 2.2 && next.progress >= 0.2
		next = {
			...next,
			skillEnergy: next.skillEnergy - 35,
			progress: instantCapture ? 1 : clamp(next.progress + 0.32, 0, 1),
			tension: clamp(next.tension + 6, 0, 100),
		}
		events.push({ type: "progress", value: next.progress })
	}

	if (skill.id === "calm_current" && next.skillEnergy >= 30) {
		events.push({ type: "skill-used", label: skill.name })
		next = {
			...next,
			skillEnergy: next.skillEnergy - 30,
			calmCurrentRemainingMs: 8000,
			tension: clamp(next.tension - 10, 0, 100),
		}
		events.push({ type: "tension", value: next.tension })
	}

	if (skill.id === "sonar" && next.skillEnergy >= 15) {
		events.push({ type: "skill-used", label: skill.name })
		next = {
			...next,
			skillEnergy: next.skillEnergy - 15,
		}
	}

	next = applyBossPhase(next, events)
	next = settleEncounterStatus(next, events)
	return { encounter: next, events }
}

export function resolveCatchResult(
	encounter: EncounterState,
	fish: FishSpecies,
	metrics: TypingMetrics,
	routeRewardMultiplier = 1,
): CatchResult {
	const rng = createSeededRng(`${encounter.seed}:${fish.id}:result`)
	const caught = encounter.status === "caught"
	const difficultyScore = clamp((fish.baseDifficulty - 0.65) / 1.35, 0, 1)
	const comboScore = clamp(metrics.maxCombo / 9, 0, 1)
	const quality = caught
		? clamp(metrics.accuracy / 100 * 0.45 + metrics.consistency / 100 * 0.25 + comboScore * 0.2 + difficultyScore * 0.1, 0.05, 1)
		: 0
	const sizeVariation = 0.9 + quality * 0.48 + rng.nextFloat() * 0.12
	const rewards = scaleRewards(fish.reward, quality * routeRewardMultiplier)

	return {
		idempotencyKey: `${encounter.id}:result`,
		fishId: fish.id,
		caught,
		quality: round(quality),
		sizeKg: round(fish.baseSizeKg * sizeVariation),
		rewards,
		secured: false,
		bossPhase: encounter.bossPhase,
	}
}

export function advanceExpedition(expedition: ExpeditionState, result: CatchResult): ExpeditionState {
	const currentZone = expeditionFishOrder[expedition.currentZoneIndex]
	const nextPending = result.caught ? [...expedition.pendingResults, result] : [...expedition.pendingResults]
	const failedMandatoryBoss = !result.caught && result.fishId === "crown_leviathan"

	if ((!result.caught && expedition.spareLines <= 0) || failedMandatoryBoss) {
		return {
			...expedition,
			spareLines: Math.max(0, expedition.spareLines - (result.caught ? 0 : 1)),
			pendingResults: nextPending,
			complete: true,
		}
	}

	if (!result.caught) {
		return {
			...expedition,
			spareLines: expedition.spareLines - 1,
			pendingResults: nextPending,
		}
	}

	const nextEncounterIndex = expedition.currentEncounterIndex + 1
	if (currentZone && nextEncounterIndex < currentZone.length) {
		return {
			...expedition,
			currentEncounterIndex: nextEncounterIndex,
			pendingResults: nextPending,
		}
	}

	const nextZoneIndex = expedition.currentZoneIndex + 1
	if (nextZoneIndex >= expeditionFishOrder.length) {
		return {
			...expedition,
			currentEncounterIndex: nextEncounterIndex,
			pendingResults: nextPending,
			complete: true,
		}
	}

	return {
		...expedition,
		currentZoneIndex: nextZoneIndex,
		currentEncounterIndex: 0,
		pendingResults: nextPending,
	}
}

export function secureCheckpoint(expedition: ExpeditionState, collection: CollectionState): {
	expedition: ExpeditionState
	collection: CollectionState
	checkpoint: ExpeditionCheckpoint
} {
	const checkpointZoneIndex = expedition.complete ? expedition.currentZoneIndex : Math.max(0, expedition.currentZoneIndex - 1)
	const zoneId = shallowCoastZoneOrder[checkpointZoneIndex] ?? "zone_3"
	const securedKeys = new Set(collection.grantedResultKeys)
	let nextCollection: CollectionState = {
		...collection,
		records: { ...collection.records },
		grantedResultKeys: [...collection.grantedResultKeys],
	}
	let checkpointRewards: RewardTable = { coins: 0, materials: 0, xp: 0 }
	const securedResults = expedition.pendingResults.map((result) => {
		if (!result.caught || securedKeys.has(result.idempotencyKey)) {
			return { ...result, secured: true }
		}

		securedKeys.add(result.idempotencyKey)
		nextCollection = grantCatchResult(nextCollection, result)
		checkpointRewards = addRewards(checkpointRewards, result.rewards)
		return { ...result, secured: true }
	})

	const checkpoint: ExpeditionCheckpoint = {
		zoneId,
		securedResultKeys: securedResults.map((result) => result.idempotencyKey),
		rewards: checkpointRewards,
	}

	return {
		expedition: {
			...expedition,
			pendingResults: securedResults,
			checkpoints: [...expedition.checkpoints, checkpoint],
		},
		collection: nextCollection,
		checkpoint,
	}
}

export function grantCatchResult(collection: CollectionState, result: CatchResult, nowIso = new Date(0).toISOString()): CollectionState {
	if (!result.caught || collection.grantedResultKeys.includes(result.idempotencyKey)) {
		return collection
	}

	const existing = collection.records[result.fishId]
	const record: CollectionRecord = existing
		? {
				...existing,
				largestSizeKg: Math.max(existing.largestSizeKg, result.sizeKg),
				bestQuality: Math.max(existing.bestQuality, result.quality),
				count: existing.count + 1,
				lastCaughtAt: nowIso,
			}
		: {
				fishId: result.fishId,
				largestSizeKg: result.sizeKg,
				bestQuality: result.quality,
				count: 1,
				firstCaughtAt: nowIso,
				lastCaughtAt: nowIso,
			}

	return {
		...collection,
		records: {
			...collection.records,
			[result.fishId]: record,
		},
		coins: collection.coins + result.rewards.coins,
		materials: collection.materials + result.rewards.materials,
		xp: collection.xp + result.rewards.xp,
		grantedResultKeys: [...collection.grantedResultKeys, result.idempotencyKey],
	}
}

export function serializeOceanSave(expedition: ExpeditionState, collection: CollectionState, savedAt = new Date(0).toISOString()): string {
	const payload: SerializedOceanSave = {
		contentVersion: CONTENT_VERSION,
		expedition,
		collection,
		savedAt,
	}
	return JSON.stringify(payload)
}

export function restoreOceanSave(raw: string | null): SerializedOceanSave | null {
	if (!raw) {
		return null
	}
	try {
		const parsed = JSON.parse(raw) as SerializedOceanSave
		if (parsed.contentVersion !== CONTENT_VERSION || parsed.expedition.contentVersion !== CONTENT_VERSION) {
			return null
		}
		return parsed
	} catch {
		return null
	}
}

export function getBossPhaseForProgress(progress: number): 1 | 2 | 3 {
	if (progress >= bossPhaseThresholds[2]) {
		return 3
	}
	if (progress >= bossPhaseThresholds[1]) {
		return 2
	}
	return 1
}

export function getFishByEncounter(expedition: ExpeditionState): FishSpecies {
	return getFish(getCurrentFishId(expedition))
}

export function getFishRosterForMilestone(): FishSpecies[] {
	return fishSpecies
}

export function getSkillRosterForMilestone(): FishingSkill[] {
	return ["cast_net", "steel_line", "sonar", "calm_current", "perfect_bait", "reel_mastery"].map(getSkill)
}

function applyBossPhase(encounter: EncounterState, events: FishingRuleEvent[]): EncounterState {
	if (encounter.fishId !== "crown_leviathan") {
		return encounter
	}
	const bossPhase = getBossPhaseForProgress(encounter.progress)
	if (bossPhase !== encounter.bossPhase) {
		events.push({ type: "phase-changed", value: bossPhase })
		return { ...encounter, bossPhase }
	}
	return encounter
}

function settleEncounterStatus(encounter: EncounterState, events: FishingRuleEvent[]): EncounterState {
	if (encounter.progress >= 1) {
		events.push({ type: "caught", value: 1 })
		return { ...encounter, status: "caught", progress: 1 }
	}
	if (encounter.durability <= 0 || encounter.timeRemainingMs <= 0) {
		events.push({ type: "escaped", value: 0 })
		return { ...encounter, status: "escaped" }
	}
	return encounter
}

function getCorrectCharacterProgress(fish: FishSpecies): number {
	return fish.behavior === "armored" ? 0.0025 : 0.0035
}

function getBehaviorProgressModifier(fish: FishSpecies): number {
	switch (fish.behavior) {
		case "calm":
			return 1.08
		case "darting":
			return 0.96
		case "armored":
			return 0.82
		case "tricky":
			return 0.92
		case "swarm":
			return 1.02
		case "predator":
			return 0.9
		case "boss":
			return 0.78
	}
}

function validateSkills(skillIds: readonly string[]): void {
	for (const skillId of skillIds) {
		getSkill(skillId)
	}
}

function scaleRewards(reward: RewardTable, multiplier: number): RewardTable {
	return {
		coins: Math.round(reward.coins * multiplier),
		materials: Math.round(reward.materials * multiplier),
		xp: Math.round(reward.xp * multiplier),
	}
}

function addRewards(left: RewardTable, right: RewardTable): RewardTable {
	return {
		coins: left.coins + right.coins,
		materials: left.materials + right.materials,
		xp: left.xp + right.xp,
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

function round(value: number): number {
	return Math.round(value * 100) / 100
}

function hashSeed(seed: string): number {
	let hash = 2166136261
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index)
		hash = Math.imul(hash, 16777619)
	}
	return hash >>> 0
}
