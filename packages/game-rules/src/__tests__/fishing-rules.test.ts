import { describe, expect, it } from "vitest"
import { getFish, getIndonesianPassage, getSkill } from "@typecade/content"
import type { TypingEvent } from "@typecade/contracts"
import { TypingSession } from "@typecade/typing-engine"
import {
	advanceExpedition,
	applyTypingEvents,
	canUseFishingSkill,
	createInitialCollection,
	createSeededRng,
	createShallowCoastExpedition,
	getAccountLevelProgress,
	getBossPhaseForProgress,
	getFishingSkillCost,
	getFishingSkillBlockReason,
	getFishingSkillUnlockLevel,
	getCurrentFishId,
	getEncounterIndexInRun,
	getFishByEncounter,
	getAdventureCondition,
	getExpeditionPassage,
	getFishRosterForMilestone,
	getSkillRosterForMilestone,
	getSkillDraft,
	restoreOceanSave,
	grantCatchResult,
	resolveCatchResult,
	serializeOceanSave,
	secureCheckpoint,
	startEncounter,
	tickEncounter,
	useFishingSkill as activateFishingSkill,
} from "../index"

const metrics = {
	wpm: 42,
	rawWpm: 45,
	accuracy: 96,
	combo: 4,
	maxCombo: 6,
	consistency: 88,
	correctKeystrokes: 80,
	incorrectKeystrokes: 3,
	progress: 1,
	elapsedMs: 60000,
}

function typingEvent(type: TypingEvent["type"], overrides: Partial<TypingEvent> = {}): TypingEvent {
	return {
		type,
		timestampMs: 1000,
		index: 0,
		key: "x",
		expected: "a",
		metrics,
		...overrides,
	}
}

describe("fishing rules", () => {

	it("continues 100 voyages with unique rewards, bounded checkpoints and repeatable encounters", () => {
		let expedition = createShallowCoastExpedition("endless-sweep")
		let collection = createInitialCollection()
		const conditions = new Set<string>()
		const orders: string[][] = []
		for (let voyage = 1; voyage <= 100; voyage += 1) {
			const order: string[] = []
			for (let index = 0; index < 10; index += 1) {
				expect(getEncounterIndexInRun(expedition)).toBe((voyage - 1) * 10 + index)
				const fish = getFishByEncounter(expedition)
				order.push(fish.id)
				conditions.add(getAdventureCondition(expedition).id)
				expect(getFishByEncounter({ ...expedition })).toEqual(fish)
				expect(getExpeditionPassage({ ...expedition })).toBe(getExpeditionPassage(expedition))
				const encounter = startEncounter(fish, `${expedition.seed}:${getEncounterIndexInRun(expedition)}`, [])
				const result = resolveCatchResult({ ...encounter, status: "caught", progress: 1 }, fish, metrics)
				collection = grantCatchResult(collection, result)
				const beforeZone = expedition.currentZoneIndex
				expedition = advanceExpedition(expedition, result)
				if (expedition.currentZoneIndex !== beforeZone) {
					const secured = secureCheckpoint(expedition, collection)
					expedition = secured.expedition
					collection = secured.collection
					expect(expedition.pendingResults).toHaveLength(0)
				}
				expect(expedition.complete).toBe(false)
				expect(expedition.checkpoints.length).toBeLessThanOrEqual(3)
			}
			expect(order[9]).toBe("crown_leviathan")
			expect(new Set(order).size).toBe(10)
			orders.push(order)
		}
		expect(expedition.voyage).toBe(101)
		expect(new Set(orders.map((order) => order.join(","))).size).toBeGreaterThan(10)
		expect(conditions).toEqual(new Set(["calm", "surge", "fragile", "quick", "shoal"]))
		expect(collection.grantedResultKeys).toHaveLength(1000)
		expect(new Set(collection.grantedResultKeys).size).toBe(1000)
		expect(collection.records.crown_leviathan.count).toBe(100)
		expect(getAccountLevelProgress(collection.xp).level).toBeGreaterThan(3)
	})

	it("keeps late voyages beatable at 45 WPM with a defensive loadout and requires every character", () => {
		const skills = ["calm_current", "steel_line", "reel_mastery"]
		for (const voyage of [1, 2, 13, 1000]) {
			for (let seed = 0; seed < 10; seed += 1) {
				let expedition = { ...createShallowCoastExpedition(`balance-${seed}`, skills), voyage }
				for (let index = 0; index < 10; index += 1) {
					const fish = getFishByEncounter(expedition)
					const passage = getExpeditionPassage(expedition)
					const session = new TypingSession(passage, { startTimestampMs: 0 })
					let encounter = startEncounter(fish, `${seed}:${voyage}:${index}`, skills)
					for (let char = 0; char < passage.length; char += 1) {
						encounter = tickEncounter(encounter, fish, 60000 / (45 * 5), skills).encounter
						if (encounter.tension > 55 && canUseFishingSkill(encounter, getSkill("calm_current"))) encounter = activateFishingSkill(encounter, fish, "calm_current").encounter
						expect(encounter.status, `${voyage}:${index}:${getAdventureCondition(expedition).id}:${char}`).toBe("active")
						encounter = applyTypingEvents(encounter, fish, session.processKey(passage[char]!, encounter.elapsedMs), skills).encounter
						if (char < passage.length - 1) expect(encounter.status).toBe("active")
					}
					expect(encounter.status).toBe("caught")
					const result = resolveCatchResult(encounter, fish, session.getSnapshot().metrics)
					expedition = advanceExpedition(expedition, result)
				}
			}
		}
		const late = { ...createShallowCoastExpedition("capped"), voyage: 1000, currentZoneIndex: 2, currentEncounterIndex: 3 }
		expect(getFishByEncounter(late)).toEqual(getFishByEncounter({ ...late, voyage: 13 }))
	})

	it("migrates finished legacy voyages without losing account rewards and rejects invalid voyage values", () => {
		const expedition = createShallowCoastExpedition("legacy")
		const legacy = JSON.parse(serializeOceanSave(expedition, { ...createInitialCollection(), xp: 500, coins: 900 }))
		delete legacy.expedition.voyage
		expect(restoreOceanSave(JSON.stringify(legacy))?.expedition.voyage).toBe(1)
		legacy.expedition = { ...legacy.expedition, complete: true, currentZoneIndex: 2, currentEncounterIndex: 4 }
		const restored = restoreOceanSave(JSON.stringify(legacy))!
		expect(restored.expedition).toMatchObject({ voyage: 2, complete: false, currentZoneIndex: 0, currentEncounterIndex: 0 })
		expect(restored.collection).toMatchObject({ xp: 500, coins: 900 })
		for (const voyage of [0, -1, 1.5, "2"]) expect(restoreOceanSave(JSON.stringify({ ...legacy, expedition: { ...legacy.expedition, voyage } }))).toBeNull()
		legacy.expedition.currentEncounterIndex = 3
		expect(restoreOceanSave(JSON.stringify(legacy))?.expedition.complete).toBe(true)
	})

	it("creates deterministic random streams for identical seeds", () => {
		const left = createSeededRng("same-seed")
		const right = createSeededRng("same-seed")

		expect([left.nextFloat(), left.nextFloat(), left.nextInt(1, 9)]).toEqual([
			right.nextFloat(),
			right.nextFloat(),
			right.nextInt(1, 9),
		])
		expect(() => left.pick([])).toThrow("Cannot pick from an empty list")
		expect(createSeededRng("pick-one").pick(["only-item"])).toBe("only-item")
	})

	it("changes tension and durability after typos", () => {
		const fish = getFish("kelp_darter")
		const start = startEncounter(fish, "typo-test", [])
		const applied = applyTypingEvents(start, fish, [typingEvent("typo")], [])

		expect(applied.encounter.tension).toBeGreaterThan(start.tension)
		expect(applied.encounter.durability).toBeLessThan(start.durability)
	})

	it("resolves a catch when the typing passage is complete", () => {
		const fish = getFish("reef_minnow")
		const start = startEncounter(fish, "passage-complete-test", [])
		const applied = applyTypingEvents(start, fish, [typingEvent("passage-complete")], [])

		expect(applied.encounter.progress).toBe(1)
		expect(applied.encounter.status).toBe("caught")
		expect(applied.events.some((event) => event.type === "caught")).toBe(true)
	})

	it("orders Steel Line before typo damage", () => {
		const fish = getFish("reef_minnow")
		const start = startEncounter(fish, "steel-line-test", ["steel_line"])
		const first = applyTypingEvents(start, fish, [typingEvent("typo")], ["steel_line"])
		const second = applyTypingEvents(first.encounter, fish, [typingEvent("typo")], ["steel_line"])

		expect(first.encounter.tension).toBe(start.tension)
		expect(first.encounter.durability).toBe(start.durability)
		expect(first.events.some((event) => event.label === "Steel Line")).toBe(true)
		expect(second.encounter.tension).toBeGreaterThan(first.encounter.tension)
		expect(second.encounter.durability).toBeLessThan(first.encounter.durability)
	})

	it("applies Calm Current before idle pressure", () => {
		const fish = getFish("reef_shark")
		const start = { ...startEncounter(fish, "calm-test", ["calm_current"]), skillEnergy: 50 }
		const calm = activateFishingSkill(start, fish, "calm_current").encounter
		const pressured = tickEncounter(start, fish, 3000, ["calm_current"]).encounter
		const slowed = tickEncounter(calm, fish, 3000, ["calm_current"]).encounter

		expect(slowed.tension).toBeLessThan(pressured.tension)
	})

	it("reports active skill costs for UI and input gating", () => {
		expect(getFishingSkillCost("sonar")).toBe(15)
		expect(getFishingSkillCost("calm_current")).toBe(30)
		expect(getFishingSkillCost("cast_net")).toBe(35)
		expect(getFishingSkillCost("steel_line")).toBe(0)
		expect(getFishingSkillUnlockLevel("unknown_skill")).toBe(99)
	})

	it("calculates account level progress from earned XP", () => {
		const fresh = getAccountLevelProgress(0)
		const progressed = getAccountLevelProgress(96)
		const veteran = getAccountLevelProgress(10_000_000)

		expect(fresh.level).toBe(1)
		expect(fresh.progress).toBe(0)
		expect(progressed.level).toBeGreaterThan(1)
		expect(progressed.currentXp).toBe(96)
		expect(progressed.nextLevelXp).toBeGreaterThan(progressed.currentLevelXp)
		expect(progressed.progress).toBeGreaterThanOrEqual(0)
		expect(progressed.progress).toBeLessThanOrEqual(1)
		expect(veteran.level).toBeGreaterThan(100)
	})

	it("builds a deterministic level-gated skill draft with both play styles", () => {
		const first = getSkillDraft("run-a", 2)
		const repeat = getSkillDraft("run-a", 2)
		const otherRun = getSkillDraft("run-b", 2)

		expect(first.map((skill) => skill.id)).toEqual(repeat.map((skill) => skill.id))
		expect(first.some((skill) => skill.type === "active")).toBe(true)
		expect(first.some((skill) => skill.type === "passive")).toBe(true)
		expect(first.every((skill) => getFishingSkillUnlockLevel(skill.id) <= 2)).toBe(true)
		expect(otherRun.map((skill) => skill.id)).not.toEqual(first.map((skill) => skill.id))
		const draftTypes = new Set(Array.from({ length: 40 }, (_, index) => getSkillDraft(`size-two-${index}`, 3, 2)[0]?.type))
		expect(draftTypes).toEqual(new Set(["active", "passive"]))
		expect(getSkillDraft("no-offers", 1, 0)).toEqual([])
	})

	it("secures checkpoint rewards idempotently", () => {
		const fish = getFish("reef_minnow")
		const expedition = createShallowCoastExpedition("checkpoint-test")
		const caught = { ...startEncounter(fish, "checkpoint-test", expedition.selectedSkillIds), progress: 1, status: "caught" as const }
		const result = resolveCatchResult(caught, fish, metrics)
		const advanced = advanceExpedition(expedition, result)
		const collection = createInitialCollection()

		const first = secureCheckpoint({ ...advanced, currentZoneIndex: 1 }, collection)
		const second = secureCheckpoint(first.expedition, first.collection)

		expect(first.collection.grantedResultKeys).toContain(result.idempotencyKey)
		expect(second.collection.coins).toBe(first.collection.coins)
		expect(second.collection.records.reef_minnow?.count).toBe(1)
		expect(grantCatchResult(first.collection, result)).toBe(first.collection)
		expect(grantCatchResult(collection, { ...result, caught: false })).toBe(collection)
		expect(grantCatchResult(collection, result).records.reef_minnow?.count).toBe(1)
		const once = grantCatchResult(collection, result)
		const another = grantCatchResult(once, { ...result, idempotencyKey: `${result.idempotencyKey}:again`, sizeKg: result.sizeKg + 1 })
		expect(another.records.reef_minnow?.count).toBe(2)

		const final = secureCheckpoint({ ...advanced, complete: true, currentZoneIndex: 2 }, first.collection)
		expect(final.checkpoint.zoneId).toBe("zone_3")
		const recoveredZone = secureCheckpoint({ ...advanced, complete: true, currentZoneIndex: 99 }, collection)
		expect(recoveredZone.checkpoint.zoneId).toBe("zone_3")
	})

	it("transitions boss phases by progress", () => {
		const boss = getFish("crown_leviathan")
		const start = startEncounter(boss, "boss-test", [])
		const guarded = { ...start, bossPhase: 2 as const, bossGuard: 3 }
		expect(tickEncounter(guarded, boss, 1000, []).encounter.tension).toBeGreaterThan(tickEncounter({ ...guarded, bossGuard: 0 }, boss, 1000, []).encounter.tension)
		const phaseTwo = tickEncounter({ ...start, progress: 0.35 }, boss, 16, []).encounter
		const phaseThree = tickEncounter({ ...phaseTwo, progress: 0.7 }, boss, 16, []).encounter

		expect(getBossPhaseForProgress(0.1)).toBe(1)
		expect(phaseTwo.bossPhase).toBe(2)
		expect(phaseThree.bossPhase).toBe(3)
	})

	it("limits Cast Net to small fish after the reel threshold", () => {
		const net = getSkill("cast_net")
		const small = getFish("reef_minnow")
		const boss = getFish("crown_leviathan")
		const smallStart = { ...startEncounter(small, "small-net", []), skillEnergy: 50 }
		const bossStart = { ...startEncounter(boss, "boss-net", []), skillEnergy: 50, progress: 0.7 }
		expect(canUseFishingSkill(smallStart, net)).toBe(false)
		expect(canUseFishingSkill(bossStart, net)).toBe(false)
		expect(activateFishingSkill(bossStart, boss, "cast_net").events).toHaveLength(0)
		const ready = { ...smallStart, progress: 0.45 }
		expect(canUseFishingSkill(ready, net)).toBe(true)
		expect(activateFishingSkill(ready, small, "cast_net").encounter.status).toBe("active")
	})

	it("uses Calm Current and Sonar once their active conditions are met", () => {
		const fish = getFish("reef_minnow")
		const calmStart = { ...startEncounter(fish, "calm", ["calm_current"]), skillEnergy: 40, tension: 75 }
		const calm = activateFishingSkill(calmStart, fish, "calm_current")
		expect(calm.encounter.calmCurrentRemainingMs).toBe(8000)
		expect(calm.encounter.skillEnergy).toBe(10)
		expect(calm.events.map(({ type }) => type)).toEqual(["skill-used", "tension"])
		const sonarStart = { ...startEncounter(fish, "sonar", ["sonar"]), skillEnergy: 30 }
		expect(activateFishingSkill(sonarStart, fish, "sonar").encounter.skillEnergy).toBe(15)
		expect(activateFishingSkill(sonarStart, fish, "sonar").encounter.tension).toBe(sonarStart.tension - 5)
		expect(activateFishingSkill({ ...sonarStart, tension: 2 }, fish, "sonar").encounter.tension).toBe(0)
		expect(activateFishingSkill(sonarStart, fish, "steel_line").events).toEqual([])
	})

	it("explains skill gates and prevents spending energy on an effect already running", () => {
		const fish = getFish("reef_minnow")
		const start = { ...startEncounter(fish, "skill-gates", []), skillEnergy: 100 }
		expect(getFishingSkillBlockReason(start, getSkill("steel_line"))).toBe("Automatic")
		expect(getFishingSkillBlockReason({ ...start, status: "caught" }, getSkill("sonar"))).toBe("Encounter ended")
		expect(getFishingSkillBlockReason(start, getSkill("cast_net"))).toBe("Reel 45% first")
		expect(getFishingSkillBlockReason({ ...start, fishId: "crown_leviathan" }, getSkill("cast_net"))).toBe("Common ≤2.2kg only")
		expect(getFishingSkillBlockReason({ ...start, fishId: "shellback_puffer" }, getSkill("cast_net"))).toBe("Common ≤2.2kg only")
		expect(getFishingSkillBlockReason({ ...start, skillEnergy: 3 }, getSkill("sonar"))).toBe("Need 12E")
		expect(getFishingSkillBlockReason({ ...start, progress: 0.45 }, getSkill("cast_net"))).toBeNull()
		const calm = activateFishingSkill(start, fish, "calm_current").encounter
		expect(getFishingSkillBlockReason(calm, getSkill("calm_current"))).toBe("Active 8s")
		expect(activateFishingSkill(calm, fish, "calm_current")).toEqual({ encounter: calm, events: [] })
		const expired = tickEncounter(calm, fish, 8000, ["calm_current"]).encounter
		expect(canUseFishingSkill(expired, getSkill("calm_current"))).toBe(true)
	})

	it("covers expedition failure, voyage continuation, save recovery, and rosters", () => {
		const fish = getFish("reef_minnow")
		const expedition = createShallowCoastExpedition("edges")
		const escaped = resolveCatchResult({ ...startEncounter(fish, "edges", []), status: "escaped" }, fish, metrics)
		expect(advanceExpedition(expedition, escaped).spareLines).toBe(1)
		expect(advanceExpedition({ ...expedition, spareLines: 0 }, escaped).complete).toBe(true)
		const bossFailure = resolveCatchResult({ ...startEncounter(getFish("crown_leviathan"), "edges-boss", []), status: "escaped" }, getFish("crown_leviathan"), metrics)
		expect(advanceExpedition(expedition, bossFailure).complete).toBe(false)
		const boss = getFish("crown_leviathan")
		const bossCatch = resolveCatchResult({ ...startEncounter(boss, "last-fish", []), status: "caught" }, boss, metrics)
		expect(advanceExpedition({ ...expedition, currentZoneIndex: 2, currentEncounterIndex: 3 }, bossCatch)).toMatchObject({ complete: false, voyage: 2, currentZoneIndex: 0, currentEncounterIndex: 0, spareLines: 3 })

		const saved = serializeOceanSave(expedition, createInitialCollection())
		expect(restoreOceanSave(saved)?.expedition.seed).toBe("edges")
		expect(restoreOceanSave("{")).toBeNull()
		expect(restoreOceanSave(JSON.stringify({ contentVersion: "old", expedition: { contentVersion: "old" } }))).toBeNull()
		expect(restoreOceanSave(null)).toBeNull()

		const outOfBounds = { ...expedition, currentZoneIndex: 99, currentEncounterIndex: 99 }
		expect(getCurrentFishId(outOfBounds)).toBe("crown_leviathan")
		expect(getEncounterIndexInRun(outOfBounds)).toBeGreaterThan(0)
		expect(getFishByEncounter(outOfBounds).id).toBe("crown_leviathan")
		expect(getFishRosterForMilestone()).toHaveLength(10)
		expect(getSkillRosterForMilestone()).toHaveLength(6)
	})

	it("handles passive skill milestones and terminal encounter edges", () => {
		const fish = getFish("reef_shark")
		const mastery = { ...startEncounter(fish, "mastery", ["reel_mastery"]), combo: 4 }
		const perfect = applyTypingEvents(mastery, fish, [typingEvent("word-complete", { perfect: true })], ["reel_mastery"])
		expect(perfect.events.map(({ label }) => label)).toContain("Reel Mastery")
		const bait = { ...startEncounter(fish, "bait", ["perfect_bait"]), perfectWords: 3 }
		expect(applyTypingEvents(bait, fish, [typingEvent("word-complete", { perfect: true })], ["perfect_bait"]).events.map(({ label }) => label)).toContain("Perfect Bait")
		expect(tickEncounter({ ...mastery, status: "caught" }, fish, 1000, []).events).toEqual([])
		const baitFish = getFish("glass_eel")
		const baitTickState = { ...startEncounter(baitFish, "passive-tick", []), tension: 30, perfectWords: 4 }
		const withoutBait = tickEncounter(baitTickState, baitFish, 1000, []).encounter.tension
		const withBait = tickEncounter(baitTickState, baitFish, 1000, ["perfect_bait"]).encounter.tension
		expect(withBait).toBeCloseTo(withoutBait - 0.35)
		expect(tickEncounter({ ...mastery, timeRemainingMs: 0 }, fish, 1, []).encounter.status).toBe("escaped")
		expect(getAccountLevelProgress(-20).level).toBe(1)
		const imperfect = applyTypingEvents(startEncounter(fish, "imperfect-word", []), fish, [typingEvent("word-complete", { perfect: false })], [])
		expect(imperfect.encounter.combo).toBe(0)
		expect(imperfect.encounter.skillEnergy).toBe(7)
	})

	it("applies selected route risk to encounter pressure", () => {
		const fish = getFish("reef_shark")
		const encounter = startEncounter(fish, "route-risk", [])
		const safe = tickEncounter(encounter, fish, 5000, [], 0.85).encounter
		const risky = tickEncounter(encounter, fish, 5000, [], 1.35).encounter
		expect(risky.tension).toBeGreaterThan(safe.tension)
		const typedSafe = applyTypingEvents(encounter, fish, [typingEvent("typo")], [], 0.85).encounter
		const typedRisky = applyTypingEvents(encounter, fish, [typingEvent("typo")], [], 1.35).encounter
		expect(typedRisky.durability).toBeLessThan(typedSafe.durability)
		const highTension = tickEncounter({ ...encounter, tension: 90 }, fish, 1000, []).encounter
		const lowTension = tickEncounter({ ...encounter, tension: 20 }, fish, 1000, []).encounter
		expect(highTension.durability).toBeLessThan(encounter.durability)
		expect(lowTension.durability).toBe(encounter.durability)
	})

	it("keeps every fish beatable at a steady typing pace", () => {
		for (const [index, fish] of [
			"reef_minnow", "kelp_darter", "sunny_guppy", "shellback_puffer", "tide_skipper",
			"coral_fry", "glass_eel", "moonfin_snapper", "reef_shark", "crown_leviathan",
		].map((id) => getFish(id)).entries()) {
			const passage = getIndonesianPassage(index, fish.typingProfile)
			const session = new TypingSession(passage)
			let encounter = startEncounter(fish, `full-roster:${index}`, [])
			for (const [keyIndex, key] of [...passage].entries()) {
				encounter = tickEncounter(encounter, fish, 300, []).encounter
				if (encounter.status !== "active") break
				encounter = applyTypingEvents(encounter, fish, session.processKey(key, (keyIndex + 1) * 300), []).encounter
				if (keyIndex < passage.length - 1) expect(encounter.status, `${fish.id}: character ${keyIndex}`).toBe("active")
			}
			expect(encounter.status, fish.id).toBe("caught")
			expect(session.getMetrics().progress, fish.id).toBe(1)
		}
	})

	it("skills preserve passage progress while protecting a damaged line", () => {
		const fish = getFish("reef_minnow")
		const damaged = { ...startEncounter(fish, "net-help", []), progress: 0.6, tension: 60, durability: 40, skillEnergy: 70 }
		const net = activateFishingSkill(damaged, fish, "cast_net").encounter
		expect(net).toMatchObject({ progress: 0.6, status: "active", tension: 42, durability: 60, skillEnergy: 35 })
		const mastery = applyTypingEvents({ ...damaged, combo: 4 }, fish, [typingEvent("word-complete", { perfect: true })], ["reel_mastery"]).encounter
		expect(mastery.progress).toBe(0.6)
		expect(mastery.durability).toBe(45)
		expect(mastery.tension).toBeCloseTo(49.8)
		const roundedLastChar = applyTypingEvents(damaged, fish, [typingEvent("correct-char")], []).encounter
		expect(roundedLastChar.status).toBe("active")
		expect(roundedLastChar.progress).toBeLessThan(1)
	})

	it("plays the boss guard and final pull before the catch", () => {
		const boss = getFish("crown_leviathan")
		const passage = getIndonesianPassage(9, boss.typingProfile)
		const session = new TypingSession(passage)
		let encounter = startEncounter(boss, "boss-playthrough", [])
		const ruleEvents: string[] = []
		for (const key of passage) {
			const applied = applyTypingEvents(encounter, boss, session.processKey(key), [])
			encounter = applied.encounter
			ruleEvents.push(...applied.events.map((event) => event.type))
			if (encounter.status !== "active") break
		}
		expect(ruleEvents).toContain("boss-guard-broken")
		expect(ruleEvents).toContain("boss-final-pull")
		expect(ruleEvents.filter((event) => event === "phase-changed")).toHaveLength(2)
		expect(encounter.status).toBe("caught")
	})
})
