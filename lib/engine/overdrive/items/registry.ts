import type { Rarity } from "@/components/overdrive/ui"

export type ItemType = "keycap" | "macro" | "firmware" | "glitch"

export interface BaseItem {
	id: string
	name: string
	type: ItemType
	description: string
}

export interface ShopItem extends BaseItem {
	rarity: Rarity
	basePrice: number
}

import type { EngineEvents, Modifiers, RunSnapshot } from "../types"
import type { createEmitter } from "../emitter"
import type { createRun } from "../run"

export type ItemContext = {
	events: ReturnType<typeof createEmitter<EngineEvents>>
	modifiers: Modifiers
	api: ReturnType<typeof createRun>
	state: RunSnapshot
}

export interface KeycapDef extends ShopItem {
	type: "keycap"
	// Called when equipped at the start of a run or stage
	onEquip?: (ctx: ItemContext) => void
}

export interface MacroDef extends ShopItem {
	type: "macro"
	// Called when the player triggers the macro
	onUse?: (ctx: ItemContext) => void
}

export interface GlitchDef extends BaseItem {
	type: "glitch"
	// Lifecycle hooks
	onStageStart?: (ctx: ItemContext) => void
	onKeystroke?: (ctx: ItemContext, key: string) => void
	onTypo?: (ctx: ItemContext, expected: string, got: string) => void
	onWordComplete?: (ctx: ItemContext) => void
	onTick?: (ctx: ItemContext, ms: number) => void
	onStageEnd?: (ctx: ItemContext) => void
}


