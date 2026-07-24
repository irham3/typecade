import type { GlitchDef } from "./registry"
import { CLEAR_REWARD } from "../constants"

export const GLITCHES: Record<string, GlitchDef> = {
	"invisible_ink": {
		id: "invisible_ink",
		name: "Invisible Ink",
		type: "glitch",
		description: "Words fade 1s after appearing",
		// This is mostly a rendering hint for the UI, no engine logic needed other than UI reading active glitch
	},
	"no_backspace": {
		id: "no_backspace",
		name: "No Backspace",
		type: "glitch",
		description: "Backspace is disabled",
		// Implementation is handled in run.ts backspace() by checking active glitch
	},
	"sudden_death": {
		id: "sudden_death",
		name: "Sudden Death",
		type: "glitch",
		description: "3 typos = fail",
		onStageStart: ({ state }) => {
			// We can store a counter in state or use a local variable via closure?
			// The plugin instances are singletons in the registry, so we shouldn't use closures here.
			// Actually, we can just use `events.on` inside `run.ts` if we don't have state extensions.
			// Let's add a general `glitchState` to RunSnapshot.
		},
		onTypo: ({ state, events }) => {
			if (!state.glitchState) state.glitchState = { typos: 0 }
			state.glitchState.typos = (state.glitchState.typos || 0) + 1
			if (state.glitchState.typos >= 3) {
				// Instant fail
				state.timeLeftMs = 0 // force fail on next advance, or directly fail
			}
		}
	},
	"blackout": {
		id: "blackout",
		name: "Blackout",
		type: "glitch",
		description: "Dark except caret radius",
		// Rendering hint only
	},
	"inflation": {
		id: "inflation",
		name: "Inflation",
		type: "glitch",
		description: "Quota +50%, Token reward x2",
		onStageStart: ({ state }) => {
			state.quota = Math.floor(state.quota * 1.5)
			if (!state.glitchState) state.glitchState = {}
			state.glitchState.tokenMultiplier = 2
		}
	}
}
