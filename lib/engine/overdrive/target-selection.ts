import type { RunSnapshot } from "./types"
import type { RunContext } from "./run-state"

export type TargetCandidate = {
	word: string
	queueIndex: number
	active: boolean
	prefix: string
}

export function visibleTargets(
	snapshot: Pick<RunSnapshot, "currentWord" | "upcomingWords">,
): TargetCandidate[] {
	return [snapshot.currentWord, ...snapshot.upcomingWords.slice(0, 2)]
		.filter((word) => word.length > 0)
		.map((word, queueIndex) => ({
			word,
			queueIndex,
			active: queueIndex === 0,
			prefix: word[0].toUpperCase(),
		}))
}

export function normalizeVisiblePrefixes(ctx: RunContext) {
	const used = new Set<string>()
	const activePrefix = ctx.state.currentWord[0]?.toLowerCase()
	if (activePrefix) used.add(activePrefix)

	for (let visibleIndex = 0; visibleIndex < 2; visibleIndex += 1) {
		const current = ctx.state.upcomingWords[visibleIndex]
		const prefix = current?.[0]?.toLowerCase()
		if (prefix && !used.has(prefix)) {
			used.add(prefix)
			continue
		}

		const replacementIndex = ctx.state.upcomingWords.findIndex((word, index) => (
			index > visibleIndex
			&& word.length > 0
			&& !used.has(word[0].toLowerCase())
		))
		if (replacementIndex < 0) {
			if (prefix) used.add(prefix)
			continue
		}
		const replacement = ctx.state.upcomingWords[replacementIndex]
		ctx.state.upcomingWords[replacementIndex] = current
		ctx.state.upcomingWords[visibleIndex] = replacement
		used.add(replacement[0].toLowerCase())
	}
}

export function selectTarget(ctx: RunContext, character: string): boolean {
	if (
		ctx.state.screen !== "stage"
		|| ctx.state.caretIndex !== 0
		|| character.length !== 1
	) return false

	const normalized = character.toLowerCase()
	const candidates = visibleTargets(ctx.state)
	const matches = candidates.filter((candidate) => candidate.prefix.toLowerCase() === normalized)
	if (matches.length !== 1 || matches[0].active) return false

	const selected = matches[0]
	const queueIndex = selected.queueIndex - 1
	const previousWord = ctx.state.currentWord
	const selectedWord = ctx.state.upcomingWords[queueIndex]
	if (!selectedWord) return false

	ctx.state.currentWord = selectedWord
	ctx.state.upcomingWords[queueIndex] = previousWord
	ctx.events.emit("target_selected", {
		word: selectedWord,
		previousWord,
		queueIndex,
		targetOrdinal: ctx.state.targetOrdinal,
		prefix: selectedWord[0].toUpperCase(),
	})
	return true
}
