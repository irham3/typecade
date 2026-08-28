import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
	CatchResult,
	CollectionState,
	EncounterState,
	ExpeditionState,
	FishSpecies,
	RouteNode,
	TypingEvent,
	TypingMetrics,
} from "@typecade/contracts"
import { CONTENT_VERSION } from "@typecade/contracts"
import {
	fishingSkills,
	getIndonesianPassage,
	getRouteNodesForZone,
	getSkill,
} from "@typecade/content"
import {
	advanceExpedition,
	applyTypingEvents,
	canUseFishingSkill,
	createInitialCollection,
	createShallowCoastExpedition,
	getAccountLevelProgress,
	getDefaultSkillLoadout,
	getEncounterIndexInRun,
	getFishByEncounter,
	getSkillDraft,
	grantCatchResult,
	resolveCatchResult,
	restoreOceanSave,
	secureCheckpoint,
	serializeOceanSave,
	startEncounter,
	tickEncounter,
	useFishingSkill,
} from "@typecade/game-rules"
import { TypingSession } from "@typecade/typing-engine"
import { GameEventBridge } from "../bridge/game-event-bridge"

const SAVE_KEY = "typecade:ocean-typing-rpg:m1"
const starterSeed = "shallow-coast-vertical-slice"

export interface OceanRunView {
	expedition: ExpeditionState
	collection: CollectionState
	encounter: EncounterState
	fish: FishSpecies
	targetText: string
	currentInput: string
	cursor: number
	metrics: TypingMetrics
	lastResult?: CatchResult
	routeChoices: RouteNode[]
	selectedRoute: RouteNode
	log: string[]
	volumes: VolumeState
	reducedMotion: boolean
	sonarRevealed: boolean
	lastSkillId?: string
	feedback?: OceanUiFeedback
	skillOffers: typeof fishingSkills
	isPaused: boolean
}

export interface OceanUiFeedback {
	id: number
	kind: "skill" | "level"
	title: string
	detail: string
}

export interface VolumeState {
	music: number
	environment: number
	gameplay: number
	typing: number
}

export interface OceanRunControls {
	bridge: GameEventBridge
	view: OceanRunView
	activeSkills: typeof fishingSkills
	skillOffers: typeof fishingSkills
	chooseRoute(nodeId: string): void
	setSkillLoadout(skillIds: string[]): void
	useSkill(skillId: string): boolean
	setVolume(category: keyof VolumeState, value: number): void
	setReducedMotion(value: boolean): void
	startFreshRun(): void
	togglePause(): void
}

export function useOceanRun(controlsActive = true): OceanRunControls {
	const bridge = useMemo(() => new GameEventBridge(), [])
	const sessionRef = useRef<TypingSession | null>(null)
	const expeditionRef = useRef<ExpeditionState | null>(null)
	const collectionRef = useRef<CollectionState | null>(null)
	const encounterRef = useRef<EncounterState | null>(null)
	const fishRef = useRef<FishSpecies | null>(null)
	const selectedRouteRef = useRef<RouteNode | null>(null)
	const handledEncounterRef = useRef<string | null>(null)
	const lastTickRef = useRef<number>(0)
	const controlsActiveRef = useRef(controlsActive)
	const pausedRef = useRef(true)
	const sonarRevealedUntilRef = useRef(0)
	const feedbackSequenceRef = useRef(0)
	const pendingSkillLoadoutRef = useRef<string[] | null>(null)
	const [view, setView] = useState<OceanRunView>(() => createInitialView())
	const activeSkills = useMemo(
		() => fishingSkills.filter((skill) => view.expedition.selectedSkillIds.includes(skill.id)),
		[view.expedition.selectedSkillIds],
	)

	useEffect(() => {
		controlsActiveRef.current = controlsActive
	}, [controlsActive])

	const persist = useCallback((expedition: ExpeditionState, collection: CollectionState) => {
		try {
			window.localStorage.setItem(SAVE_KEY, serializeOceanSave(expedition, collection, new Date().toISOString()))
		} catch {
			// Persistence is best-effort for the local vertical slice.
		}
	}, [])

	const syncView = useCallback((patch: Partial<OceanRunView> = {}) => {
		const session = sessionRef.current
		const expedition = expeditionRef.current
		const collection = collectionRef.current
		const encounter = encounterRef.current
		const fish = fishRef.current
		const selectedRoute = selectedRouteRef.current

		if (!session || !expedition || !collection || !encounter || !fish || !selectedRoute) {
			return
		}

		const snapshot = session.getSnapshot()
		setView((previous) => ({
			...previous,
			expedition,
			collection,
			encounter,
			fish,
			targetText: snapshot.targetText,
			currentInput: snapshot.currentInput,
			cursor: snapshot.cursor,
			metrics: snapshot.metrics,
			routeChoices: getRouteNodesForZone(fish.habitat),
			selectedRoute,
			sonarRevealed: sonarRevealedUntilRef.current > Date.now(),
			...patch,
		}))
	}, [])

	const chooseRoute = useCallback((nodeId: string) => {
		const fish = fishRef.current
		if (!fish) {
			return
		}
		const choices = getRouteNodesForZone(fish.habitat)
		const selected = choices.find((node) => node.id === nodeId) ?? choices[0]
		selectedRouteRef.current = selected
		syncView({ log: [`Route locked: ${selected.name}`, ...viewLogTail(view.log)] })
	}, [syncView, view.log])

	const startEncounterFromExpedition = useCallback((expedition: ExpeditionState, collection: CollectionState, logLine?: string) => {
		const fish = getFishByEncounter(expedition)
		const encounterIndex = getEncounterIndexInRun(expedition)
		const passage = getIndonesianPassage(encounterIndex)
		const startMs = performance.now()
		const session = new TypingSession(passage, { startTimestampMs: startMs })
		const encounter = startEncounter(fish, `${expedition.seed}:${encounterIndex}`, expedition.selectedSkillIds)
		const routeChoices = getRouteNodesForZone(fish.habitat)
		const selectedRoute = routeChoices[encounterIndex % routeChoices.length] ?? routeChoices[0]
		if (!selectedRoute) {
			throw new Error(`No route nodes configured for ${fish.habitat}`)
		}

		sessionRef.current = session
		expeditionRef.current = expedition
		collectionRef.current = collection
		encounterRef.current = encounter
		fishRef.current = fish
		selectedRouteRef.current = selectedRoute
		handledEncounterRef.current = null
		lastTickRef.current = startMs

		const snapshot = session.getSnapshot()
		const nextView: OceanRunView = {
			...view,
			isPaused: pausedRef.current,
			expedition,
			collection,
			encounter,
			fish,
			targetText: snapshot.targetText,
			currentInput: snapshot.currentInput,
			cursor: snapshot.cursor,
			metrics: snapshot.metrics,
			lastResult: undefined,
			routeChoices,
			selectedRoute,
			sonarRevealed: sonarRevealedUntilRef.current > Date.now(),
			skillOffers: getSkillDraft(expedition.seed, getAccountLevelProgress(collection.xp).level),
			log: [logLine ?? `Hooked: ${fish.name}`, ...viewLogTail(view.log)],
		}
		setView(nextView)

		bridge.emit("encounter:started", { encounter, fish, targetText: passage })
		bridge.emit("fish:hooked", { fish })
		bridge.emit("line:changed", {
			tension: encounter.tension,
			durability: encounter.durability,
			progress: encounter.progress,
			timeRemainingMs: encounter.timeRemainingMs,
		})
	}, [bridge, view])

	const finishEncounter = useCallback((encounter: EncounterState) => {
		const fish = fishRef.current
		const session = sessionRef.current
		const expedition = expeditionRef.current
		const collection = collectionRef.current
		const route = selectedRouteRef.current
		if (!fish || !session || !expedition || !collection || !route || handledEncounterRef.current === encounter.id) {
			return
		}

		handledEncounterRef.current = encounter.id
		const result = resolveCatchResult(encounter, fish, session.getSnapshot().metrics, route.rewardMultiplier)
		bridge.emit("catch:resolved", { result })

		const beforeZone = expedition.currentZoneIndex
		const beforeLevel = getAccountLevelProgress(collection.xp).level
		let nextExpedition = advanceExpedition(expedition, result)
		// Reward the arcade loop immediately. The pending result is still secured at
		// a checkpoint, while its idempotency key prevents a duplicate grant there.
		let nextCollection = result.caught ? grantCatchResult(collection, result) : collection
		const securedAtBoundary = result.caught && (nextExpedition.currentZoneIndex !== beforeZone || nextExpedition.complete)

		if (securedAtBoundary) {
			const secured = secureCheckpoint(nextExpedition, nextCollection)
			nextExpedition = secured.expedition
			nextCollection = secured.collection
			bridge.emit("run:checkpoint", { checkpoint: secured.checkpoint })
		}
		const nextLevel = getAccountLevelProgress(nextCollection.xp).level
		const leveledUp = nextLevel > beforeLevel
		if (leveledUp) {
			bridge.emit("level:up", {
				fromLevel: beforeLevel,
				toLevel: nextLevel,
				xp: nextCollection.xp,
			})
		}

		expeditionRef.current = nextExpedition
		collectionRef.current = nextCollection
		encounterRef.current = encounter
		persist(nextExpedition, nextCollection)

		const outcome = result.caught ? `Caught ${fish.name} (${result.sizeKg} kg)` : `${fish.name} escaped`
		syncView({
			lastResult: result,
			feedback: leveledUp
				? {
						id: ++feedbackSequenceRef.current,
						kind: "level",
						title: `LEVEL ${nextLevel}`,
						detail: "New waters unlocked. Keep the current rolling.",
					}
				: undefined,
			log: [outcome, ...viewLogTail(view.log)],
		})

		if (nextExpedition.complete) {
			bridge.emit("run:completed", { expedition: nextExpedition, collection: nextCollection })
			return
		}

		window.setTimeout(() => {
			startEncounterFromExpedition(nextExpedition, nextCollection, result.caught ? "Sailing to the next mark" : "Spare line tied, retrying")
		}, result.caught ? 1800 : 1500)
	}, [bridge, persist, startEncounterFromExpedition, syncView, view.log])

	const applyRuleEvents = useCallback((nextEncounter: EncounterState, events: ReturnType<typeof applyTypingEvents>["events"]) => {
		const fish = fishRef.current
		if (!fish) {
			return
		}

		encounterRef.current = nextEncounter
		let lastSkillId: string | undefined
		for (const event of events) {
			if (event.type === "skill-triggered") {
				lastSkillId = normalizeSkillId(event.label ?? "passive")
				bridge.emit("skill:used", {
					skillId: lastSkillId,
					label: event.label ?? "Skill",
				})
			}
			if (event.type === "phase-changed") {
				bridge.emit("phase:changed", { phase: nextEncounter.bossPhase })
			}
		}
		bridge.emit("line:changed", {
			tension: nextEncounter.tension,
			durability: nextEncounter.durability,
			progress: nextEncounter.progress,
			timeRemainingMs: nextEncounter.timeRemainingMs,
		})
		syncView(lastSkillId ? {
			lastSkillId,
			feedback: {
				id: ++feedbackSequenceRef.current,
				kind: "skill",
				title: eventLabel(lastSkillId),
				detail: "Passive skill triggered",
			},
			log: [`${eventLabel(lastSkillId)} triggered`, ...viewLogTail(view.log)],
		} : undefined)
		if (nextEncounter.status !== "active") {
			finishEncounter(nextEncounter)
		}
	}, [bridge, finishEncounter, syncView, view.log])

	const handleTypingEvents = useCallback((typingEvents: TypingEvent[]) => {
		const encounter = encounterRef.current
		const fish = fishRef.current
		const expedition = expeditionRef.current
		if (!encounter || !fish || !expedition || encounter.status !== "active") {
			return
		}

		for (const event of typingEvents) {
			if (event.type === "correct-char") {
				bridge.emit("character:correct", {
					key: event.key,
					expected: event.expected ?? event.key,
					progress: encounter.progress,
					combo: encounter.combo,
				})
			}
			if (event.type === "word-complete" && event.word) {
				bridge.emit("word:completed", {
					word: event.word,
					perfect: event.perfect === true,
					combo: event.combo ?? 0,
				})
				bridge.emit("audio:play", { key: "sfx_word_complete_a", category: "typing" })
			}
			if (event.type === "typo") {
				bridge.emit("typo:occurred", {
					key: event.key,
					expected: event.expected ?? "",
					ignoredBySteelLine: encounter.steelLineAvailable && expedition.selectedSkillIds.includes("steel_line"),
				})
			}
			if (event.type === "combo") {
				bridge.emit("combo:changed", { combo: event.combo ?? 0 })
			}
		}

		const applied = applyTypingEvents(encounter, fish, typingEvents, expedition.selectedSkillIds)
		applyRuleEvents(applied.encounter, applied.events)
	}, [applyRuleEvents, bridge])

	const useSkill = useCallback((skillId: string): boolean => {
		const encounter = encounterRef.current
		const fish = fishRef.current
		if (!encounter || !fish) {
			return false
		}

		const skill = getSkill(skillId)
		if (!canUseFishingSkill(encounter, skill)) {
			return false
		}
		const applied = useFishingSkill(encounter, fish, skillId)
		if (applied.events.length === 0) {
			return false
		}

		if (skillId === "sonar") {
			sonarRevealedUntilRef.current = Date.now() + 12000
		}
		bridge.emit("skill:used", { skillId, label: skill.name })
		applyRuleEvents(applied.encounter, applied.events)
		syncView({
			sonarRevealed: sonarRevealedUntilRef.current > Date.now(),
			lastSkillId: skillId,
			feedback: {
				id: ++feedbackSequenceRef.current,
				kind: "skill",
				title: skill.name,
				detail: skill.description,
			},
			log: [`${skill.name} used`, ...viewLogTail(view.log)],
		})
		return true
	}, [applyRuleEvents, bridge, syncView, view.log])

	const setVolume = useCallback((category: keyof VolumeState, value: number) => {
		setView((previous) => {
			const volumes = { ...previous.volumes, [category]: value }
			bridge.emit("settings:volumes", volumes)
			return { ...previous, volumes }
		})
	}, [bridge])

	const setReducedMotion = useCallback((value: boolean) => {
		setView((previous) => ({ ...previous, reducedMotion: value }))
		bridge.emit("settings:effects", { reducedMotion: value })
	}, [bridge])

	const setSkillLoadout = useCallback((skillIds: string[]) => {
		const offerIds = new Set(view.skillOffers.map((skill) => skill.id))
		const nextSkillIds = skillIds.filter((skillId, index) => offerIds.has(skillId) && skillIds.indexOf(skillId) === index).slice(0, 3)
		if (nextSkillIds.length === 0) {
			return
		}
		pendingSkillLoadoutRef.current = nextSkillIds
		const nextExpedition = { ...view.expedition, selectedSkillIds: nextSkillIds }
		expeditionRef.current = nextExpedition
		setView((previous) => ({ ...previous, expedition: nextExpedition }))
	}, [view.expedition, view.skillOffers])

	const startFreshRun = useCallback(() => {
		const seed = `${starterSeed}:${Date.now()}`
		const collection = collectionRef.current ?? createInitialCollection(new Date().toISOString())
		const level = getAccountLevelProgress(collection.xp).level
		const selectedSkillIds = pendingSkillLoadoutRef.current ?? getDefaultSkillLoadout(seed, level)
		const expedition = createShallowCoastExpedition(seed, selectedSkillIds)
		pausedRef.current = false
		bridge.emit("game:paused", { paused: false })
		pendingSkillLoadoutRef.current = null
		persist(expedition, collection)
		startEncounterFromExpedition(expedition, collection, "New Shallow Coast expedition")
	}, [persist, startEncounterFromExpedition])

	const togglePause = useCallback(() => {
		if (!controlsActiveRef.current) {
			return
		}
		const paused = !pausedRef.current
		pausedRef.current = paused
		setView((previous) => ({ ...previous, isPaused: paused }))
		bridge.emit("game:paused", { paused })
	}, [bridge])

	useEffect(() => {
		const restored = restoreFromLocalStorage()
		const expedition = restored?.expedition ?? createShallowCoastExpedition(starterSeed)
		const collection = restored?.collection ?? createInitialCollection(new Date().toISOString())
		startEncounterFromExpedition(expedition, collection, restored ? "Restored Shallow Coast expedition" : "New Shallow Coast expedition")
		bridge.emit("settings:volumes", view.volumes)
		bridge.emit("settings:effects", { reducedMotion: view.reducedMotion })
	}, [])

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!controlsActiveRef.current || isEditableTarget(event.target)) {
				return
			}
			if (event.key === "Escape") {
				event.preventDefault()
				togglePause()
				return
			}
			if (pausedRef.current) {
				return
			}

			const skillIndex = Number.parseInt(event.key, 10)
			if (skillIndex >= 1 && skillIndex <= activeSkills.length) {
				event.preventDefault()
				const skill = activeSkills[skillIndex - 1]
				if (skill) {
					useSkill(skill.id)
				}
				return
			}

			if (event.key.length === 1 || event.key === "Backspace") {
				event.preventDefault()
				const session = sessionRef.current
				if (!session) {
					return
				}
				handleTypingEvents(session.processKey(event.key, performance.now()))
			}
		}

		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [activeSkills, handleTypingEvents, togglePause, useSkill])

	useEffect(() => {
		const interval = window.setInterval(() => {
			if (!controlsActiveRef.current || pausedRef.current) {
				return
			}
			const encounter = encounterRef.current
			const fish = fishRef.current
			const expedition = expeditionRef.current
			if (!encounter || !fish || !expedition || encounter.status !== "active") {
				return
			}
			const now = performance.now()
			const delta = Math.min(500, now - lastTickRef.current)
			lastTickRef.current = now
			const applied = tickEncounter(encounter, fish, delta, expedition.selectedSkillIds)
			applyRuleEvents(applied.encounter, applied.events)
		}, 250)

		return () => window.clearInterval(interval)
	}, [applyRuleEvents])

	return {
		bridge,
		view,
		activeSkills: fishingSkills.filter((skill) => view.expedition.selectedSkillIds.includes(skill.id)),
		skillOffers: view.skillOffers,
		chooseRoute,
		setSkillLoadout,
		useSkill,
		setVolume,
		setReducedMotion,
		startFreshRun,
		togglePause,
	}
}

function createInitialView(): OceanRunView {
	const expedition = createShallowCoastExpedition(starterSeed)
	const collection = createInitialCollection(new Date().toISOString())
	const fish = getFishByEncounter(expedition)
	const encounter = startEncounter(fish, `${expedition.seed}:0`, expedition.selectedSkillIds)
	const session = new TypingSession(getIndonesianPassage(0), { startTimestampMs: 0 })
	const snapshot = session.getSnapshot()
	const routeChoices = getRouteNodesForZone(fish.habitat)

	return {
		expedition,
		collection,
		encounter,
		fish,
		targetText: snapshot.targetText,
		currentInput: snapshot.currentInput,
		cursor: snapshot.cursor,
		metrics: snapshot.metrics,
		routeChoices,
		selectedRoute: routeChoices[0]!,
		skillOffers: getSkillDraft(starterSeed, getAccountLevelProgress(collection.xp).level),
		log: [`Content ${CONTENT_VERSION}`],
		volumes: {
			music: 0.45,
			environment: 0.55,
			gameplay: 0.72,
			typing: 0.38,
		},
		reducedMotion: false,
		sonarRevealed: false,
		isPaused: true,
	}
}

function restoreFromLocalStorage(): { expedition: ExpeditionState; collection: CollectionState } | null {
	try {
		const restored = restoreOceanSave(window.localStorage.getItem(SAVE_KEY))
		if (!restored || restored.expedition.complete) {
			return restored
				? {
						expedition: createShallowCoastExpedition(starterSeed),
						collection: restored.collection,
					}
				: null
		}
		return {
			expedition: restored.expedition,
			collection: restored.collection,
		}
	} catch {
		return null
	}
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false
	}
	return target.matches("input, textarea, select, [contenteditable='true']")
}

function viewLogTail(log: string[]): string[] {
	return log.slice(0, 5)
}

function normalizeSkillId(label: string): string {
	return label.toLowerCase().replace(/\s+/g, "_")
}

function eventLabel(skillId: string): string {
	return skillId
		.split("_")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ")
}
