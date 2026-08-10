import type { RunSnapshot } from "@/lib/engine/overdrive"

function sameArray(left: readonly string[], right: readonly string[]) {
	return left.length === right.length && left.every((value, index) => value === right[index])
}

export function isTimerOnlyTransition(before: RunSnapshot, after: RunSnapshot) {
	return before.screen === after.screen
		&& before.score === after.score
		&& before.caretIndex === after.caretIndex
		&& before.tokens === after.tokens
		&& before.currentWord === after.currentWord
		&& before.wordDirty === after.wordDirty
		&& before.overdriveCharge === after.overdriveCharge
		&& before.targetOrdinal === after.targetOrdinal
		&& before.aegisRescues === after.aegisRescues
		&& before.stageRescued === after.stageRescued
		&& before.zone === after.zone
		&& before.stage === after.stage
		&& sameArray(before.keycaps, after.keycaps)
		&& sameArray(before.macros, after.macros)
}
