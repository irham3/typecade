import {
	createRunContext,
	exportRunState,
	loadRunState,
	snapshotRun,
	type CreateRunOptions,
} from "./run-state"
import {
	advanceStage,
	completeStage,
	continueToNextStage as continueStage,
	enterEndless as enterEndlessRun,
	failStage,
	finishStandardRun as finishRun,
	leaveShop as leaveShopScreen,
	quitToMenu as quitRunToMenu,
	rescueWithAegis,
	skipWarmup as skipStageWarmup,
	startRun,
	type StageFailReason,
} from "./run-lifecycle"
import {
	backspace as backspaceInput,
	feedChar as feedInput,
	previewItemTriggers as previewInputItemTriggers,
	registerInputIntent,
	releaseOverdrive as releaseInputOverdrive,
	type InputLifecycle,
} from "./run-input"
import {
	buyItem as buyShopItem,
	generateShop,
	rerollShop as rerollCurrentShop,
	sellKeycap as sellShopKeycap,
	sellMacro as sellShopMacro,
	triggerMacro as triggerRunMacro,
	type MacroDispatchHooks,
} from "./run-shop"

export type { CreateRunOptions } from "./run-state"

export function createRun(opts: CreateRunOptions) {
	const ctx = createRunContext(opts)

	const inputLifecycle: InputLifecycle = {
		completeStage: () => {
			completeStage(ctx)
		},
		failStage: (reason: StageFailReason) => {
			failStage(ctx, reason)
		},
		rescueWithAegis: () => rescueWithAegis(ctx),
	}

	const macroHooks: MacroDispatchHooks = {
		completeStage: () => {
			completeStage(ctx)
		},
		registerInputIntent: () => {
			registerInputIntent(ctx)
		},
	}

	return {
		snapshot: () => snapshotRun(ctx),
		events: ctx.events,
		start: () => {
			startRun(ctx)
		},
		skipWarmup: () => {
			skipStageWarmup(ctx)
		},
		feedChar: (character: string) => {
			feedInput(ctx, inputLifecycle, character)
		},
		releaseOverdrive: () => {
			releaseInputOverdrive(ctx, inputLifecycle)
		},
		previewItemTriggers: () => previewInputItemTriggers(ctx),
		backspace: () => {
			backspaceInput(ctx)
		},
		advance: (ms: number) => {
			advanceStage(ctx, ms)
		},
		continueToNextStage: () => {
			continueStage(ctx, () => {
				generateShop(ctx)
			})
		},
		enterEndless: () => {
			enterEndlessRun(ctx)
		},
		finishStandardRun: () => {
			finishRun(ctx)
		},
		leaveShop: () => {
			leaveShopScreen(ctx)
		},
		buyItem: (type: "keycap" | "macro" | "firmware", index: number) => {
			buyShopItem(ctx, type, index)
		},
		sellKeycap: (index: number) => {
			sellShopKeycap(ctx, index)
		},
		sellMacro: (index: number) => {
			sellShopMacro(ctx, index)
		},
		rerollShop: () => {
			rerollCurrentShop(ctx)
		},
		triggerMacro: (index: number) => {
			triggerRunMacro(ctx, macroHooks, index)
		},
		restart: () => {
			startRun(ctx)
		},
		quitToMenu: () => {
			quitRunToMenu(ctx)
		},
		exportState: () => exportRunState(ctx),
		loadState: (json: string) => loadRunState(ctx, json),
	}
}
