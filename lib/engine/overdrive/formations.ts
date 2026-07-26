import type { FormationVariantId, StageType } from "./types"

export type FormationRng = {
	next(): number
	pick<T>(values: T[]): T
}

export const FORMATION_VARIANTS_BY_STAGE: Record<
	StageType,
	readonly FormationVariantId[]
> = {
	warmup: ["packet-stalker", "cache-hound", "relay-ram"],
	rush: ["needle-wraith", "vector-mantis", "spine-courier"],
	glitch: ["null-crown", "crown-hand", "void-shard"],
}

export function createFormationSchedule(
	stage: StageType,
	zone: number,
	rng: FormationRng,
	length = 24,
): FormationVariantId[] {
	const count = Math.max(0, Math.floor(length))
	if (count === 0) return []

	const variants = FORMATION_VARIANTS_BY_STAGE[stage]
	const schedule: FormationVariantId[] = [
		zone === 1 ? variants[0] : rng.pick([...variants]),
	]

	while (schedule.length < count) {
		const previous = schedule.at(-1)
		const candidates = variants.filter((variant) => variant !== previous)
		schedule.push(rng.pick([...candidates]))
	}

	return schedule
}
