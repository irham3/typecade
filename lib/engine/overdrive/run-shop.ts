import { FIRMWARE, GLITCHES, KEYCAPS, MACROS } from "./items"
import type { RunContext } from "./run-state"

export type MacroDispatchHooks = {
	completeStage: () => void
	registerInputIntent: () => void
}

function availableKeycapsForRarity(
	rarity: "common" | "uncommon" | "rare" | "legendary",
	owned: readonly string[],
) {
	const unowned = Object.values(KEYCAPS).filter((item) => item.rarity === rarity && !owned.includes(item.id))
	if (unowned.length > 0) return unowned
	return Object.values(KEYCAPS).filter((item) => item.rarity === rarity)
}

function randomKeycap(ctx: RunContext): string {
	const roll = ctx.shopRng.next() * 100
	const betterOdds = ctx.state.firmware.includes("better_odds")
	const rarity = ctx.state.zone < 3
		? (roll < 68 ? "common" : "uncommon")
		: ctx.state.zone < 5
			? (roll < (betterOdds ? 46 : 58) ? "common" : roll < (betterOdds ? 76 : 88) ? "uncommon" : "rare")
			: (roll < (betterOdds ? 42 : 56) ? "common" : roll < (betterOdds ? 70 : 84) ? "uncommon" : roll < (betterOdds ? 96 : 98) ? "rare" : "legendary")
	const pool = availableKeycapsForRarity(rarity, ctx.state.keycaps)
	return ctx.shopRng.pick(pool).id
}

function randomFirmware(ctx: RunContext): string | null {
	const pool = Object.values(FIRMWARE).filter((item) => !ctx.state.firmware.includes(item.id))
	if (pool.length === 0) return null
	return ctx.shopRng.pick(pool).id
}

function priceFor(ctx: RunContext, basePrice: number): number {
	return ctx.state.firmware.includes("discount") ? Math.ceil(basePrice * 0.75) : basePrice
}

export function generateShop(ctx: RunContext) {
	const first = randomKeycap(ctx)
	let second = randomKeycap(ctx)
	for (let attempts = 0; second === first && attempts < 8; attempts += 1) {
		second = randomKeycap(ctx)
	}
	ctx.state.shopKeycaps = [first, second]
	ctx.state.shopMacro = ctx.shopRng.pick(Object.values(MACROS)).id
	ctx.state.shopFirmware = randomFirmware(ctx)
}

export function buyItem(ctx: RunContext, type: "keycap" | "macro" | "firmware", index: number) {
	if (ctx.state.screen !== "shop") return
	if (type === "keycap") {
		const id = ctx.state.shopKeycaps[index]
		const definition = KEYCAPS[id]
		const price = definition ? priceFor(ctx, definition.basePrice) : 0
		if (
			!definition
			|| ctx.state.keycaps.includes(id)
			|| ctx.state.keycaps.length >= ctx.state.maxKeycaps
			|| ctx.state.tokens < price
		) {
			return
		}
		ctx.state.tokens -= price
		ctx.state.keycaps.push(id)
		ctx.runItemData.push({})
		ctx.stageItemData.push({})
		ctx.state.shopKeycaps[index] = ""
		return
	}
	if (type === "firmware") {
		const id = ctx.state.shopFirmware
		if (!id) return
		const definition = id ? FIRMWARE[id] : undefined
		const price = definition ? priceFor(ctx, definition.basePrice) : 0
		if (!definition || ctx.state.firmware.includes(id) || ctx.state.tokens < price) return
		ctx.state.tokens -= price
		ctx.state.firmware.push(id)
		if (id === "extra_slot") ctx.state.maxKeycaps = Math.min(7, ctx.state.maxKeycaps + 1)
		if (id === "macro_pocket") ctx.state.maxMacros = ctx.state.maxMacros + 1
		ctx.state.shopFirmware = null
		return
	}

	const id = ctx.state.shopMacro
	const definition = id ? MACROS[id] : undefined
	const price = definition ? priceFor(ctx, definition.basePrice) : 0
	if (!definition || ctx.state.macros.length >= ctx.state.maxMacros || ctx.state.tokens < price) {
		return
	}
	ctx.state.tokens -= price
	ctx.state.macros.push(definition.id)
	ctx.state.shopMacro = null
}

export function sellKeycap(ctx: RunContext, index: number) {
	if (ctx.state.screen !== "shop") return
	const id = ctx.state.keycaps[index]
	const definition = KEYCAPS[id]
	if (!definition) return
	ctx.state.tokens += Math.floor(definition.basePrice / 2)
	ctx.state.keycaps.splice(index, 1)
	ctx.runItemData.splice(index, 1)
	ctx.stageItemData.splice(index, 1)
}

export function sellMacro(ctx: RunContext, index: number) {
	if (ctx.state.screen !== "shop") return
	const id = ctx.state.macros[index]
	const definition = MACROS[id]
	if (!definition) return
	ctx.state.tokens += Math.floor(definition.basePrice / 2)
	ctx.state.macros.splice(index, 1)
}

export function rerollShop(ctx: RunContext) {
	if (ctx.state.screen !== "shop" || ctx.state.tokens < ctx.state.rerollCost) return
	ctx.state.tokens -= ctx.state.rerollCost
	ctx.state.rerollCost += 1
	generateShop(ctx)
}

export function cancelGlitch(ctx: RunContext) {
	if (!ctx.state.activeGlitch || ctx.state.glitchState?.cancelled === true) return
	const glitch = GLITCHES[ctx.state.activeGlitch]
	if (glitch.onCancel) {
		glitch.onCancel({ events: ctx.events, state: ctx.state, forceFail: false })
	}
	ctx.state.glitchState = { ...(ctx.state.glitchState ?? {}), cancelled: true }
}

export function triggerMacro(ctx: RunContext, hooks: MacroDispatchHooks, index: number) {
	if (ctx.state.screen !== "stage") return
	hooks.registerInputIntent()
	const id = ctx.state.macros[index]
	const definition = MACROS[id]
	if (!definition) return
	if (id === "escape" && !ctx.state.activeGlitch) return
	if (id === "insurance" && ctx.insuranceArmed) return

	const result = definition.onUse({
		events: ctx.events,
		state: ctx.state,
		cancelGlitch: () => {
			cancelGlitch(ctx)
		},
		armInsurance: () => {
			ctx.insuranceArmed = true
		},
	})
	ctx.state.macros.splice(index, 1)
	ctx.events.emit("macro_used", { itemId: id, result })
	if (ctx.state.score >= ctx.state.quota) hooks.completeStage()
}
