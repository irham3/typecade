import type { ItemContribution, RunSnapshot } from "../types"
import type { EngineEvents } from "../events"
import type { createEmitter } from "../emitter"

export type ItemType = "keycap" | "macro" | "firmware" | "glitch"
export type ItemRarity = "common" | "uncommon" | "rare" | "legendary" | "macro"
export type RuntimeData = Record<string, boolean | number | string>

export interface BaseItem {
	id: string
	name: string
	type: ItemType
	description: string
}

export interface ShopItem extends BaseItem {
	rarity: ItemRarity
	basePrice: number
	trigger?: string
}

export type ItemProc = (
	trigger: string,
	contribution: ItemContribution,
) => void

export type BaseItemContext = {
	events: ReturnType<typeof createEmitter<EngineEvents>>
	state: RunSnapshot
	runData: RuntimeData
	stageData: RuntimeData
	proc: ItemProc
}

export type StageStartContext = BaseItemContext & {
	interestCap: number
}

export type TypoContext = BaseItemContext & {
	expected: string
	got: string
	isFirstTypoInWord: boolean
	ignoreTypo: boolean
	preserveMult: boolean
	forceFail: boolean
	timePenaltyMs: number
}

export type WordScoreContext = BaseItemContext & {
	word: string
	clean: boolean
	elapsedMs: number
	combo: number
	naturalMult: number
	baseBonus: number
	baseMultiplier: number
	multAdd: number
	multMultiplier: number
	finalMultiplier: number
	appliedItemIds: string[]
}

export type WordResolvedContext = WordScoreContext & {
	scoreGain: number
}

export type WordPreviewContext = {
	word: string
	elapsedMs: number
	combo: number
	stageData: Readonly<RuntimeData>
	runData: Readonly<RuntimeData>
}

export type StageEndContext = BaseItemContext & {
	cleared: boolean
	accuracy: number
	stageTypos: number
	removeSelf: boolean
}

export interface KeycapDef extends ShopItem {
	type: "keycap"
	previewWord?: (ctx: WordPreviewContext) => boolean
	onStageStart?: (ctx: StageStartContext) => void
	onTypo?: (ctx: TypoContext) => void
	beforeWordScore?: (ctx: WordScoreContext) => void
	afterWordScore?: (ctx: WordResolvedContext) => void
	onStageEnd?: (ctx: StageEndContext) => void
}

export interface FirmwareDef extends ShopItem {
	type: "firmware"
}

export type MacroContext = {
	events: ReturnType<typeof createEmitter<EngineEvents>>
	state: RunSnapshot
	cancelGlitch: () => void
	armInsurance: () => void
}

export interface MacroDef extends ShopItem {
	type: "macro"
	onUse: (ctx: MacroContext) => string
}

export type GlitchContext = {
	events: ReturnType<typeof createEmitter<EngineEvents>>
	state: RunSnapshot
	forceFail: boolean
}

export interface GlitchDef extends BaseItem {
	type: "glitch"
	onStageStart?: (ctx: GlitchContext) => void
	onTypo?: (ctx: GlitchContext) => void
	onCancel?: (ctx: GlitchContext) => void
}
