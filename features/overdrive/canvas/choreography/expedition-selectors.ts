import type { TargetLane } from "./target-lanes"

export type EncounterBeat = "ingress" | "relay-breach" | "extraction"

export type AttackVerb =
	| "cannon-burst"
	| "rail-step"
	| "tether-pull"
	| "breach-slide"
	| "recoil-vault"
	| "crossfire-pivot"
	| "execution"
	| "overdrive-breach"

const GROUNDED_SEQUENCE: readonly AttackVerb[] = [
	"rail-step",
	"breach-slide",
	"cannon-burst",
	"crossfire-pivot",
]

function normalizedIndex(index: number, wordLength: number) {
	return Math.min(
		Math.max(0, Math.floor(Number.isFinite(index) ? index : 0)),
		Math.max(0, wordLength - 1),
	)
}

export function selectEncounterBeat(
	score: number,
	quota: number,
): EncounterBeat {
	if (!Number.isFinite(quota) || quota <= 0) return "ingress"
	const ratio = Math.max(0, Number.isFinite(score) ? score : 0) / quota
	if (ratio >= 0.75) return "extraction"
	if (ratio >= 0.4) return "relay-breach"
	return "ingress"
}

export function selectAttackVerb(
	word: string,
	characterIndex: number,
	lane: TargetLane,
	combo: number,
	overdriveReady: boolean,
	triggeredItemIds: readonly string[],
): AttackVerb {
	const wordLength = [...word].length
	if (wordLength <= 1) return "cannon-burst"

	const index = normalizedIndex(characterIndex, wordLength)
	const finalIndex = wordLength - 1
	if (index === finalIndex) {
		return overdriveReady ? "overdrive-breach" : "execution"
	}

	if (wordLength <= 3) {
		return index === 0 ? "cannon-burst" : "rail-step"
	}

	const items = new Set(triggeredItemIds)
	if (index === 0) {
		return items.has("sprinter") ? "rail-step" : "cannon-burst"
	}

	if (wordLength >= 7) {
		const laneAccent = lane === "high"
			? 2
			: lane === "mid"
				? Math.floor((wordLength - 1) / 2)
				: 3
		const accentIndex = Math.min(finalIndex - 1, laneAccent)
		if (index === accentIndex) {
			if (lane === "high" || items.has("longshot")) return "tether-pull"
			if (lane === "mid") return "recoil-vault"
			return "breach-slide"
		}
	}

	if (
		items.has("wasd")
		&& index === Math.min(finalIndex - 1, 2)
	) return "crossfire-pivot"

	if (
		combo >= 8
		&& index === finalIndex - 1
	) return "crossfire-pivot"

	const laneOffset = lane === "low" ? 1 : lane === "high" ? 2 : 0
	return GROUNDED_SEQUENCE[(index - 1 + laneOffset) % GROUNDED_SEQUENCE.length]
}

export function selectFormationVariant<T>(
	formationSchedule: readonly T[],
	targetOrdinal: number,
): T | null {
	if (formationSchedule.length === 0) return null
	const ordinal = Math.max(
		0,
		Math.floor(Number.isFinite(targetOrdinal) ? targetOrdinal : 0),
	)
	return formationSchedule[ordinal % formationSchedule.length]
}
