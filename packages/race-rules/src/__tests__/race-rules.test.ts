import { describe, expect, it } from "vitest"
import { applyRaceInput, createRacePlayer, defaultRaceConfig, generateRaceText, parseRaceConfig, raceAccuracy, rankRacePlayers, type RacePlayer } from "../index"

describe("Ocean Race rules", () => {
	it("validates every shared setting and rejects impossible rooms", () => {
		expect(parseRaceConfig({ language: "en", format: "words", wordCount: 1000, maxPlayers: 100 }).wordCount).toBe(1000)
		for (const input of [null, [], { language: "fr" }, { format: "unknown" }, { difficulty: "extreme" }, { variant: "unknown" }, { maxPlayers: 101 }, { wordCount: 0 }, { timeSeconds: 3601 }, { format: "custom", customText: "  " }, { customText: null }, { customText: "x".repeat(5001) }, { punctuation: "yes" }]) {
			expect(() => parseRaceConfig(input)).toThrow()
		}
	})

	it("generates the same Indonesian and English text for a shared seed", () => {
		for (const language of ["id", "en"] as const) {
			const config = parseRaceConfig({ language, format: "words", wordCount: 25, punctuation: true, numbers: true })
			const text = generateRaceText(config, "room-seed")
			expect(text).toBe(generateRaceText(config, "room-seed"))
			expect(text.split(" ")).toHaveLength(25)
			expect(text).not.toBe(generateRaceText(config, "different-seed"))
		}
	})

	it("supports quote difficulty, time, and deterministic custom shuffle", () => {
		for (const difficulty of ["easy", "medium", "hard"] as const) {
			const text = generateRaceText(parseRaceConfig({ format: "quote", difficulty }), "same")
			expect(text.length).toBeGreaterThan(difficulty === "hard" ? 120 : 20)
		}
		expect(generateRaceText(parseRaceConfig({ format: "time" }), "same").split(" ")).toHaveLength(1000)
		const custom = parseRaceConfig({ format: "custom", customText: "satu dua tiga empat lima", shuffle: true })
		expect(generateRaceText(custom, "same").split(" ").sort()).toEqual(custom.customText.split(" ").sort())
		expect(generateRaceText(custom, "same")).toBe(generateRaceText(custom, "same"))
		expect(generateRaceText(parseRaceConfig({ format: "custom", customText: "tetap urut" }), "same")).toBe("tetap urut")
	})

	it("only advances on correct input and ignores duplicate sequence numbers", () => {
		const player = { ...createRacePlayer("a", "Captain", "classic"), status: "racing" as const }
		const config = { ...defaultRaceConfig, format: "custom" as const }
		const first = applyRaceInput(player, "abc", "ax", 1, 100, config)
		expect(first.player.cursor).toBe(1)
		expect(first.player.errors).toBe(1)
		expect(raceAccuracy(first.player)).toBe(50)
		expect(applyRaceInput(first.player, "abc", "bc", 1, 200, config).player).toEqual(first.player)
		const finished = applyRaceInput(first.player, "abc", "bc", 2, 300, config).player
		expect(finished.status).toBe("finished")
		expect(finished.finishedAt).toBe(300)
		expect(applyRaceInput(finished, "abc", "a", 3, 400, config).player).toEqual(finished)
		expect(applyRaceInput(player, "abc", "", 1, 100, config).player).toEqual(player)
		expect(applyRaceInput(player, "abc", "a".repeat(33), 1, 100, config).player).toEqual(player)
		expect(applyRaceInput(player, "abc", "\n", 1, 100, config).player.cursor).toBe(0)
	})

	it("keeps timed races active until the shared deadline", () => {
		const player = { ...createRacePlayer("a", "Captain", "classic"), status: "racing" as const }
		const result = applyRaceInput(player, "abc", "abc", 1, 100, { ...defaultRaceConfig, format: "time" })
		expect(result.player.cursor).toBe(3)
		expect(result.player.status).toBe("racing")
		expect(applyRaceInput(result.player, "abc", "a", 2, 200, { ...defaultRaceConfig, format: "time" }).player.cursor).toBe(3)
	})

	it("eliminates on one error in Perfect Tide and three in Three Hulls", () => {
		for (const [variant, attempts] of [["perfect", 1], ["three-hulls", 3]] as const) {
			let player: RacePlayer = { ...createRacePlayer("a", "Captain", variant), status: "racing" }
			for (let seq = 1; seq <= attempts; seq += 1) player = applyRaceInput(player, "abc", "x", seq, seq * 100, { ...defaultRaceConfig, variant }).player
			expect(player.status).toBe("out")
			expect(player.errors).toBe(attempts)
			expect(player.lives).toBe(0)
		}
	})

	it("ranks finishers by finish time, then unfinished players by validated progress", () => {
		const a = { ...createRacePlayer("a", "A", "classic"), status: "finished" as const, cursor: 10, finishedAt: 200 }
		const b = { ...createRacePlayer("b", "B", "classic"), status: "finished" as const, cursor: 10, finishedAt: 100 }
		const c = { ...createRacePlayer("c", "C", "classic"), status: "racing" as const, cursor: 9 }
		expect(rankRacePlayers([a, c, b]).map((player) => player.id)).toEqual(["b", "a", "c"])
		const timeLeader = { ...c, status: "finished" as const, cursor: 11, finishedAt: 200 }
		expect(rankRacePlayers([a, timeLeader, b], { ...defaultRaceConfig, format: "time" }).map((player) => player.id)).toEqual(["c", "b", "a"])
	})

	it("keeps standings deterministic with the 100-player room limit", () => {
		const players = Array.from({ length: 100 }, (_, index) => ({ ...createRacePlayer(String(index).padStart(3, "0"), `Captain ${index}`, "classic"), status: "racing" as const, cursor: index }))
		const ranked = rankRacePlayers(players, { ...defaultRaceConfig, maxPlayers: 100 })
		expect(ranked).toHaveLength(100)
		expect(ranked[0]?.cursor).toBe(99)
		expect(ranked.at(-1)?.cursor).toBe(0)
		expect(rankRacePlayers([
			createRacePlayer("b", "Bee", "classic"),
			createRacePlayer("a", "Aye", "classic"),
		]).map(({ id }) => id)).toEqual(["a", "b"])
		const equalProgress = [
			{ ...createRacePlayer("a", "A", "classic"), status: "racing" as const, cursor: 4, errors: 1 },
			{ ...createRacePlayer("b", "B", "classic"), status: "racing" as const, cursor: 4, errors: 0 },
		]
		expect(rankRacePlayers(equalProgress).map(({ id }) => id)).toEqual(["b", "a"])
	})

	it("ranks timed progress first and breaks finished ties by accuracy", () => {
		const inaccurate = { ...createRacePlayer("a", "A", "classic"), status: "finished" as const, cursor: 8, errors: 2, finishedAt: 100 }
		const accurate = { ...createRacePlayer("b", "B", "classic"), status: "finished" as const, cursor: 10, errors: 0, finishedAt: 100 }
		expect(rankRacePlayers([inaccurate, accurate]).map(({ id }) => id)).toEqual(["b", "a"])
		expect(rankRacePlayers([inaccurate, accurate], { ...defaultRaceConfig, format: "time" }).map(({ id }) => id)).toEqual(["b", "a"])
	})
})
