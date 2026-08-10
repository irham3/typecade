import type { StageType, ThreatBand } from "@/lib/engine/overdrive"
import { V } from "./visual-assets"

export type StagePresentationState = {
	stage: StageType
	threatBand: ThreatBand
	combo: number
	quotaRatio: number
	overdriveReady: boolean
	focusPaused: boolean
	activeGlitch: string | null
}

export type StagePresentationPreset = {
	id: string
	accent: number
	secondary: number
	worldAlpha: number
	parallaxAlpha: number
	scanlineAlpha: number
	pressureAlpha: number
	laneOrder: readonly ("high" | "mid" | "low")[]
}

export function getStagePresentationPreset(state: Pick<StagePresentationState, "stage" | "threatBand">): StagePresentationPreset {
	if (state.stage === "glitch") {
		return {
			id: `${state.threatBand}-glitch`,
			accent: V.red,
			secondary: V.violet,
			worldAlpha: 0.68,
			parallaxAlpha: 0.07,
			scanlineAlpha: 0.055,
			pressureAlpha: 0.12,
			laneOrder: ["mid", "high", "low"],
		}
	}
	if (state.stage === "rush") {
		return {
			id: `${state.threatBand}-rush`,
			accent: V.pink,
			secondary: V.cyan,
			worldAlpha: 0.72,
			parallaxAlpha: state.threatBand === "protected" ? 0.035 : 0.06,
			scanlineAlpha: 0,
			pressureAlpha: state.threatBand === "lethal" ? 0.1 : 0.055,
			laneOrder: ["high", "low", "mid"],
		}
	}
	return {
		id: `${state.threatBand}-warmup`,
		accent: V.green,
		secondary: V.cyan,
		worldAlpha: 0.75,
		parallaxAlpha: 0.025,
		scanlineAlpha: 0,
		pressureAlpha: state.threatBand === "protected" ? 0.025 : 0.07,
		laneOrder: ["low", "mid", "high"],
	}
}

export function stageIntensity(state: StagePresentationState) {
	if (state.focusPaused) return 0.18
	const quota = Math.max(0, Math.min(1, state.quotaRatio))
	const combo = state.combo >= 16 ? 1 : state.combo >= 8 ? 0.72 : state.combo >= 4 ? 0.42 : 0
	const overrun = quota >= 0.75 ? 0.35 : 0
	return Math.min(1, quota * 0.45 + combo * 0.3 + overrun + (state.overdriveReady ? 0.25 : 0))
}
