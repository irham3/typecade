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
}
