import { describe, expect, it } from "vitest"
import { visibleCombatTargets } from "../combat-targets"

describe("combat target roles", () => {
	it("classifies visible targets by word trait without changing queue order", () => {
		const targets = visibleCombatTargets({
			currentWord: "run",
			upcomingWords: ["algorithm", "press!"],
			stage: "rush",
			zone: 3,
			targetOrdinal: 7,
		})

		expect(targets.map((target) => ({
			word: target.word,
			role: target.role,
			prefix: target.prefix,
			active: target.active,
		}))).toEqual([
			{ word: "run", role: "scout", prefix: "R", active: true },
			{ word: "algorithm", role: "brute", prefix: "A", active: false },
			{ word: "press!", role: "corruptor", prefix: "P", active: false },
		])
	})

	it("marks a Glitch active target as a Boss and gives later queue slots longer threats", () => {
		const targets = visibleCombatTargets({
			currentWord: "kernel",
			upcomingWords: ["queue", "io"],
			stage: "glitch",
			zone: 8,
			targetOrdinal: 2,
		})

		expect(targets[0]).toMatchObject({
			role: "boss",
			rewardMultiplier: 2,
			tacticalLabel: "BOSS PHASE",
		})
		expect(targets[0].threatMs).toBeLessThan(targets[1].threatMs)
		expect(targets[1].threatMs).toBeLessThan(targets[2].threatMs)
	})

	it("is deterministic for the same stage, zone, target ordinal, and words", () => {
		const input = {
			currentWord: "level",
			upcomingWords: ["asdf", "cipher"],
			stage: "warmup" as const,
			zone: 4,
			targetOrdinal: 11,
		}

		expect(visibleCombatTargets(input)).toEqual(visibleCombatTargets(input))
	})

	it("exposes authoritative combat stats for renderer and simulator", () => {
		const targets = visibleCombatTargets({
			currentWord: "alpha",
			upcomingWords: ["algorithm", "press!"],
			stage: "rush",
			zone: 4,
			targetOrdinal: 12,
		})

		expect(targets[0]).toMatchObject({
			id: "z4-rush-12-0-alpha",
			hp: 5,
			maxHp: 5,
			attackInMs: targets[0].threatMs,
			reward: 5,
			statuses: [],
		})
		expect(targets[1].maxHp).toBeGreaterThan(targets[0].maxHp)
		expect(targets[2].statuses).toContain("corrupt")
	})

	it("uses the shortest unique visible prefix when first letters collide", () => {
		const targets = visibleCombatTargets({
			currentWord: "signal",
			upcomingWords: ["silo", "syntax"],
			stage: "rush",
			zone: 3,
			targetOrdinal: 1,
		})

		expect(targets.map((target) => target.prefix)).toEqual(["SIG", "SIL", "SY"])
	})
})
