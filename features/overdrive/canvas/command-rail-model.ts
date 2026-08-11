export type TargetChoiceCue = {
	role: "ACTIVE" | "NEXT" | "FAR"
	prefix: string
	word: string
	base: number
}

export function targetChoiceCues(
	currentWord: string,
	upcomingWords: readonly string[],
): TargetChoiceCue[] {
	const words = [currentWord, ...upcomingWords.slice(0, 2)]
	if (words.length !== 3 || words.some((word) => word.length === 0)) return []
	const prefixes = words.map((word) => word[0].toUpperCase())
	if (new Set(prefixes).size !== prefixes.length) return []
	const roles = ["ACTIVE", "NEXT", "FAR"] as const
	return words.map((word, index) => ({
		role: roles[index],
		prefix: prefixes[index],
		word,
		base: [...word].length,
	}))
}
