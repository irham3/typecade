import type { RunContext } from "./run-state"

export function resetStageTelemetry(ctx: RunContext) {
	ctx.stageAttemptedChars = 0
	ctx.stageCorrectChars = 0
	ctx.stageElapsedMs = 0
	ctx.stageIdleMs = 0
}

export function resetRunTelemetry(ctx: RunContext) {
	ctx.runAttemptedChars = 0
	ctx.runCorrectChars = 0
}

export function updateTypingStats(ctx: RunContext) {
	ctx.state.accuracy = ctx.stageAttemptedChars === 0
		? 100
		: Math.floor((ctx.stageCorrectChars / ctx.stageAttemptedChars) * 100)
	ctx.state.runAccuracy = ctx.runAttemptedChars === 0
		? 100
		: Math.floor((ctx.runCorrectChars / ctx.runAttemptedChars) * 100)

	if (ctx.stageElapsedMs > 0) {
		ctx.state.wpm = Math.floor((ctx.stageCorrectChars / 5) / (ctx.stageElapsedMs / 60_000))
	}
	if (ctx.state.runDurationMs > 0) {
		ctx.state.averageWpm = Math.floor((ctx.runCorrectChars / 5) / (ctx.state.runDurationMs / 60_000))
	}
}
