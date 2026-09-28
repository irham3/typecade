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
	getFishingSkillUnlockLevel,
	getCurrentFishId,
	getEncounterIndexInRun,
	getFishByEncounter,
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
	useFishingSkill,
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
		const calm = useFishingSkill(start, fish, "calm_current").encounter
		const pressured = tickEncounter(start, fish, 3000, ["calm_current"]).encounter
		const slowed = tickEncounter(calm, fish, 3000, ["calm_current"]).encounter

		expect(slowed.tension).toBeLessThan(pressured.tension)
	})

	it("reports active skill costs for UI and input gating", () => {
		expect(getFishingSkillCost("sonar")).toBe(15)
		expect(getFishingSkillCost("calm_current")).toBe(30)
		expect(getFishingSkillCost("cast_net")).toBe(35)
		expect(getFishingSkillCost("steel_line")).toBe(0)
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
	})

	it("transitions boss phases by progress", () => {
		const boss = getFish("crown_leviathan")
		const start = startEncounter(boss, "boss-test", [])
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
		expect(useFishingSkill(bossStart, boss, "cast_net").events).toHaveLength(0)
		const ready = { ...smallStart, progress: 0.45 }
		expect(canUseFishingSkill(ready, net)).toBe(true)
		expect(useFishingSkill(ready, small, "cast_net").encounter.status).toBe("caught")
	})

	it("uses Calm Current and Sonar once their active conditions are met", () => {
		const fish = getFish("reef_minnow")
		const calmStart = { ...startEncounter(fish, "calm", ["calm_current"]), skillEnergy: 40, tension: 75 }
		const calm = useFishingSkill(calmStart, fish, "calm_current")
		expect(calm.encounter.calmCurrentRemainingMs).toBe(8000)
		expect(calm.encounter.skillEnergy).toBe(10)
		expect(calm.events.map(({ type }) => type)).toEqual(["skill-used", "tension"])
		const sonarStart = { ...startEncounter(fish, "sonar", ["sonar"]), skillEnergy: 30 }
		expect(useFishingSkill(sonarStart, fish, "sonar").encounter.skillEnergy).toBe(15)
		expect(useFishingSkill(sonarStart, fish, "steel_line").events).toEqual([])
	})

	it("covers expedition failure, final completion, save recovery, and rosters", () => {
		const fish = getFish("reef_minnow")
		const expedition = createShallowCoastExpedition("edges")
		const escaped = resolveCatchResult({ ...startEncounter(fish, "edges", []), status: "escaped" }, fish, metrics)
		expect(advanceExpedition(expedition, escaped).spareLines).toBe(1)
		expect(advanceExpedition({ ...expedition, spareLines: 0 }, escaped).complete).toBe(true)
		const bossFailure = resolveCatchResult({ ...startEncounter(getFish("crown_leviathan"), "edges-boss", []), status: "escaped" }, getFish("crown_leviathan"), metrics)
		expect(advanceExpedition(expedition, bossFailure).complete).toBe(true)
		const boss = getFish("crown_leviathan")
		const bossCatch = resolveCatchResult({ ...startEncounter(boss, "last-fish", []), status: "caught" }, boss, metrics)
		expect(advanceExpedition({ ...expedition, currentZoneIndex: 2, currentEncounterIndex: 3 }, bossCatch).complete).toBe(true)

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
				if (encounter.status !== "active") break
			}
			expect(encounter.status, fish.id).toBe("caught")
		}
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
