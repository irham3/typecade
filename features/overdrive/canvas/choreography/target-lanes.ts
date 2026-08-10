export type TargetLane = "low" | "mid" | "high"

const LANE_SEQUENCE: readonly TargetLane[] = [
	"mid",
	"low",
	"high",
	"mid",
	"high",
	"low",
	"mid",
	"low",
]

export function targetLane(ordinal: number, offset = 0): TargetLane {
	const normalized = Math.max(0, Math.floor(ordinal + offset))
	return LANE_SEQUENCE[normalized % LANE_SEQUENCE.length]
}
