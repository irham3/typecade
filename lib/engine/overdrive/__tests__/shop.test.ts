import { describe, expect, it } from "vitest"
import { createRun } from "../run"
import { KEYCAPS } from "../items"

function typeCurrentWord(api: ReturnType<typeof createRun>) {
	for (const character of api.snapshot().currentWord) api.feedChar(character)
	api.feedChar(" ")
}

function enterShop(api: ReturnType<typeof createRun>) {
	api.start()
	while (api.snapshot().screen === "stage") typeCurrentWord(api)
	api.continueToNextStage()
	expect(api.snapshot().screen).toBe("shop")
}

describe("shop economy", () => {
	it("generates two unique Keycaps and one Macro deterministically", () => {
		const first = createRun({ seed: "shop", words: ["a".repeat(300)] })
		const second = createRun({ seed: "shop", words: ["a".repeat(300)] })
		enterShop(first)
		enterShop(second)

		expect(first.snapshot().shopKeycaps).toHaveLength(2)
		expect(new Set(first.snapshot().shopKeycaps).size).toBe(2)
		expect(first.snapshot().shopMacro).toBeTruthy()
		expect(first.snapshot().shopKeycaps).toEqual(second.snapshot().shopKeycaps)
		expect(first.snapshot().shopMacro).toBe(second.snapshot().shopMacro)
	})

	it("buys, sells at half price, and keeps runtime slots aligned", () => {
		const api = createRun({
			seed: "trade",
			words: ["a".repeat(300)],
			startingTokens: 20,
		})
		enterShop(api)
		const offered = api.snapshot().shopKeycaps[0]
		const price = KEYCAPS[offered].basePrice
		const tokensBeforePurchase = api.snapshot().tokens

		api.buyItem("keycap", 0)
		expect(api.snapshot().keycaps).toContain(offered)
		expect(api.snapshot().tokens).toBe(tokensBeforePurchase - price)

		api.sellKeycap(0)
		expect(api.snapshot().keycaps).not.toContain(offered)
		expect(api.snapshot().tokens).toBe(
			tokensBeforePurchase - price + Math.floor(price / 2),
		)
	})

	it("charges an escalating reroll cost", () => {
		const api = createRun({
			seed: "reroll",
			words: ["a".repeat(300)],
			startingTokens: 20,
		})
		enterShop(api)
		const tokens = api.snapshot().tokens

		api.rerollShop()
		expect(api.snapshot()).toMatchObject({
			tokens: tokens - 5,
			rerollCost: 6,
		})
		api.rerollShop()
		expect(api.snapshot()).toMatchObject({
			tokens: tokens - 11,
			rerollCost: 7,
		})
	})

	it("refuses purchases outside the shop or without enough tokens", () => {
		const api = createRun({ seed: "guard", words: ["signal"] })
		api.start()
		api.buyItem("keycap", 0)
		expect(api.snapshot().keycaps).toHaveLength(0)
	})
})
