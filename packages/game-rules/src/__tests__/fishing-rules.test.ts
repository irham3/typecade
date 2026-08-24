import { describe, expect, it } from "vitest"
import { getFish } from "@typecade/content"
import type { TypingEvent } from "@typecade/contracts"
import {
	advanceExpedition,
	applyTypingEvents,
	createInitialCollection,
	createSeededRng,
	createShallowCoastExpedition,
	getAccountLevelProgress,
	getBossPhaseForProgress,
	getFishingSkillCost,
	resolveCatchResult,
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
	})

	it("changes tension and durability after typos", () => {
		const fish = getFish("kelp_darter")
		const start = startEncounter(fish, "typo-test", [])
		const applied = applyTypingEvents(start, fish, [typingEvent("typo")], [])

		expect(applied.encounter.tension).toBeGreaterThan(start.tension)
		expect(applied.encounter.durability).toBeLessThan(start.durability)
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

		expect(fresh.level).toBe(1)
		expect(fresh.progress).toBe(0)
		expect(progressed.level).toBeGreaterThan(1)
		expect(progressed.currentXp).toBe(96)
		expect(progressed.nextLevelXp).toBeGreaterThan(progressed.currentLevelXp)
		expect(progressed.progress).toBeGreaterThanOrEqual(0)
		expect(progressed.progress).toBeLessThanOrEqual(1)
	})

	it("secures checkpoint rewards idempotently", () => {
		const fish = getFish("reef_minnow")
		const expedition = createShallowCoastExpedition("checkpoint-test")
		const caught = { ...startEncounter(fish, "checkpoint-test", expedition.selectedSkillIds), progress: 1, status: "caught" as const }
		const result = resolveCatchResult(caught, fish, metrics)
		const advanced = advanceExpedition(expedition, result)
		const collection = createInitialCollection("2026-08-17T00:00:00.000Z")

		const first = secureCheckpoint({ ...advanced, currentZoneIndex: 1 }, collection)
		const second = secureCheckpoint(first.expedition, first.collection)

		expect(first.collection.grantedResultKeys).toContain(result.idempotencyKey)
		expect(second.collection.coins).toBe(first.collection.coins)
		expect(second.collection.records.reef_minnow?.count).toBe(1)
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
})
