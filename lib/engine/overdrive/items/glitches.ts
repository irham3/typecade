import type { GlitchDef } from "./registry"

export const GLITCHES: Record<string, GlitchDef> = {
	invisible_ink: {
		id: "invisible_ink",
		name: "Invisible Ink",
		type: "glitch",
		description: "Words fade out 1 second after appearing",
	},
	no_backspace: {
		id: "no_backspace",
		name: "No Backspace",
		type: "glitch",
		description: "Backspace is locked",
	},
	sudden_death: {
		id: "sudden_death",
		name: "Sudden Death",
		type: "glitch",
		description: "3 typos = instant stage fail",
		onStageStart: ({ state }) => {
			state.glitchState = { typos: 0 }
		},
		onTypo: (ctx) => {
			const typos = Number(ctx.state.glitchState?.typos ?? 0) + 1
			ctx.state.glitchState = { ...(ctx.state.glitchState ?? {}), typos }
			if (typos >= 3) ctx.forceFail = true
		},
	},
	scrambler: {
		id: "scrambler",
		name: "Scrambler",
		type: "glitch",
		description: "Words appear one at a time with a per-word timer",
		onStageStart: ({ state }) => {
			state.glitchState = {
				...(state.glitchState ?? {}),
				perWordTimerMs: 4_000,
				hideUpcomingWords: true,
			}
		},
	},
	the_censor: {
		id: "the_censor",
		name: "The Censor",
		type: "glitch",
		description: "1 random letter per word is censored",
		onStageStart: ({ state }) => {
			state.glitchState = {
				...(state.glitchState ?? {}),
				censorLetters: 1,
			}
		},
	},
	speed_demon: {
		id: "speed_demon",
		name: "Speed Demon",
		type: "glitch",
		description: "Quota only counts while live WPM meets the threshold",
		onStageStart: ({ state }) => {
			state.glitchState = {
				...(state.glitchState ?? {}),
				minScoringWpm: 45,
			}
		},
	},
	blackout: {
		id: "blackout",
		name: "Blackout",
		type: "glitch",
		description: "Screen is dark except a small radius around the caret",
	},
	inflation: {
		id: "inflation",
		name: "Inflation",
		type: "glitch",
		description: "Quota +50%, Token reward x2",
		onStageStart: ({ state }) => {
			state.quota = Math.floor(state.quota * 1.5)
			state.glitchState = {
				...(state.glitchState ?? {}),
				tokenMultiplier: 2,
				inflatedQuota: true,
			}
		},
		onCancel: ({ state }) => {
			if (state.glitchState?.inflatedQuota === true) {
				state.quota = Math.round(state.quota / 1.5)
			}
			state.glitchState = {
				...(state.glitchState ?? {}),
				tokenMultiplier: 1,
				inflatedQuota: false,
			}
		},
	},
	drunk_caret: {
		id: "drunk_caret",
		name: "Drunk Caret",
		type: "glitch",
		description: "Text sways and tilts as a visual pressure modifier",
		onStageStart: ({ state }) => {
			state.glitchState = {
				...(state.glitchState ?? {}),
				drunkCaret: true,
			}
		},
	},
	the_leech: {
		id: "the_leech",
		name: "The Leech",
		type: "glitch",
		description: "Score drains over time",
		onStageStart: ({ state }) => {
			state.glitchState = {
				...(state.glitchState ?? {}),
				scoreDrainPerSecond: 2,
			}
		},
	},
	kernel_panic: {
		id: "kernel_panic",
		name: "KERNEL PANIC",
		type: "glitch",
		description: "Final Glitch: two Glitches at once plus a full quota",
		onStageStart: ({ state }) => {
			state.quota = Math.max(state.quota, state.quota + Math.floor(state.quota * 0.25))
			state.glitchState = {
				...(state.glitchState ?? {}),
				kernelPanic: true,
				hideUpcomingWords: true,
				scoreDrainPerSecond: 2,
			}
		},
	},
}
