import type { CombatVerb, StageType } from "@/lib/engine/overdrive"
import type { AnimationClipName } from "./rig-definition"

export type RigReaction = {
	clip: AnimationClipName
	blendMs: number
	recoilX: number
	recoilY: number
	secondaryRotation: number
	interruptible: boolean
}

export function reactionForVerb(
	verb: CombatVerb,
	stage: StageType,
	combo: number,
): RigReaction {
	if (verb === "misfire") {
		return {
			clip: "hurt",
			blendMs: 80,
			recoilX: -8,
			recoilY: 0,
			secondaryRotation: stage === "glitch" ? 0.08 : 0.04,
			interruptible: true,
		}
	}
	if (verb === "arc-dash") {
		return {
			clip: "dash",
			blendMs: 60,
			recoilX: 14,
			recoilY: stage === "rush" ? -4 : 0,
			secondaryRotation: -0.04,
			interruptible: true,
		}
	}
	if (verb === "execution-ready") {
		return {
			clip: "ready",
			blendMs: 100,
			recoilX: 0,
			recoilY: -2,
			secondaryRotation: 0,
			interruptible: true,
		}
	}
	if (verb === "chain-strike") {
		const chain = (Math.max(0, combo) % 3) + 1
		return {
			clip: `chain-${chain}` as AnimationClipName,
			blendMs: 50,
			recoilX: 8 + chain * 2,
			recoilY: chain === 3 ? -4 : 0,
			secondaryRotation: chain === 2 ? 0.06 : -0.04,
			interruptible: true,
		}
	}
	return {
		clip: "chain-1",
		blendMs: 50,
		recoilX: 4,
		recoilY: 0,
		secondaryRotation: 0,
		interruptible: true,
	}
}
