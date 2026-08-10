import { GLITCHES, KEYCAPS, MACROS } from "./items"
import { MAX_KEYCAPS, MAX_MACROS, type RunContext } from "./run-state"

export type MacroDispatchHooks = {
	completeStage: () => void
	registerInputIntent: () => void
}

function availableKeycapsForRarity(rarity: "common" | "uncommon" | "rare") {
	return Object.values(KEYCAPS).filter((item) => item.rarity === rarity)
}

function randomKeycap(ctx: RunContext): string {
	const roll = ctx.shopRng.next() * 98
	const rarity = roll < 60 ? "common" : roll < 88 ? "uncommon" : "rare"
	const pool = availableKeycapsForRarity(rarity)
	return ctx.shopRng.pick(pool).id
}

export function generateShop(ctx: RunContext) {
	const first = randomKeycap(ctx)
	let second = randomKeycap(ctx)
	for (let attempts = 0; second === first && attempts < 8; attempts += 1) {
		second = randomKeycap(ctx)
	}
	ctx.state.shopKeycaps = [first, second]
	ctx.state.shopMacro = ctx.shopRng.pick(Object.values(MACROS)).id
}

export function buyItem(ctx: RunContext, type: "keycap" | "macro", index: number) {
	if (ctx.state.screen !== "shop") return
	if (type === "keycap") {
		const id = ctx.state.shopKeycaps[index]
		const definition = KEYCAPS[id]
		if (!definition || ctx.state.keycaps.length >= MAX_KEYCAPS || ctx.state.tokens < definition.basePrice) {
			return
		}
		ctx.state.tokens -= definition.basePrice
		ctx.state.keycaps.push(id)
		ctx.runItemData.push({})
		ctx.stageItemData.push({})
		ctx.state.shopKeycaps[index] = ""
		return
	}

	const id = ctx.state.shopMacro
	const definition = id ? MACROS[id] : undefined
	if (!definition || ctx.state.macros.length >= MAX_MACROS || ctx.state.tokens < definition.basePrice) {
		return
	}
	ctx.state.tokens -= definition.basePrice
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
