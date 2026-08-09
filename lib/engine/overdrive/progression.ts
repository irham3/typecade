import type { StageType } from "./types"
import { QUOTA, ENDLESS_QUOTA_FACTOR } from "./constants"

export const STANDARD_ZONE_COUNT = 8
export const STAGES_PER_ZONE = 3

export function getStageQuota(zone: number, stage: StageType): number {
	if (zone < 1) throw new Error("Zone must be >= 1")
	if (zone <= STANDARD_ZONE_COUNT) {
		return QUOTA[zone][stage]
	}
	const base = QUOTA[STANDARD_ZONE_COUNT][stage]
	const exponent = zone - STANDARD_ZONE_COUNT
	return Math.round(base * Math.pow(ENDLESS_QUOTA_FACTOR, exponent))
}

export function nextStagePosition(
	zone: number,
	stage: StageType,
): { zone: number; stage: StageType; standardCleared: boolean } {
	if (stage === "warmup") return { zone, stage: "rush", standardCleared: false }
	if (stage === "rush") return { zone, stage: "glitch", standardCleared: false }
	
	const standardCleared = (zone === STANDARD_ZONE_COUNT && stage === "glitch")
	return {
		zone: zone + 1,
		stage: "warmup",
		standardCleared
	}
}

export function isStandardClear(zone: number, stage: StageType): boolean {
	return zone === STANDARD_ZONE_COUNT && stage === "glitch"
}
