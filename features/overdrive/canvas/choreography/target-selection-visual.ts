export type StagedTarget = {
	ordinal: number
}

export function selectStagedTarget<T extends StagedTarget>(
	slots: T[],
	queueIndex: number,
	targetOrdinal: number,
): T | null {
	const selectedIndex = queueIndex + 1
	const active = slots[0]
	const selected = slots[selectedIndex]
	if (!active || !selected) return null

	const selectedOrdinal = selected.ordinal
	slots[0] = selected
	slots[selectedIndex] = active
	selected.ordinal = targetOrdinal
	active.ordinal = selectedOrdinal
	return selected
}
