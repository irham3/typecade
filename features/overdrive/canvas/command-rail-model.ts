import type { StageType } from "@/lib/engine/overdrive"
import { visibleCombatTargets, type EnemyRole } from "@/lib/engine/overdrive"

export type TargetChoiceCue = {
	role: "ACTIVE" | "NEXT" | "FAR"
	prefix: string
	word: string
	base: number
	enemyRole: EnemyRole
	threatMs: number
	tacticalLabel: string
	hp: number
	reward: number
	statuses: readonly string[]
}

export function targetChoiceCues(
	currentWord: string,
	upcomingWords: readonly string[],
	context: {
		stage?: StageType
		zone?: number
		targetOrdinal?: number
	} = {},
): TargetChoiceCue[] {
	const words = [currentWord, ...upcomingWords.slice(0, 2)]
	if (words.length !== 3 || words.some((word) => word.length === 0)) return []
	const roles = ["ACTIVE", "NEXT", "FAR"] as const
	const targets = visibleCombatTargets({
		currentWord,
		upcomingWords,
		stage: context.stage ?? "warmup",
		zone: context.zone ?? 1,
		targetOrdinal: context.targetOrdinal ?? 0,
	})
	return targets.map((target, index) => ({
		role: roles[index],
		prefix: target.prefix,
		word: target.word,
		base: [...target.word].length,
		enemyRole: target.role,
		threatMs: target.threatMs,
		tacticalLabel: target.tacticalLabel,
		hp: target.hp,
		reward: target.reward,
		statuses: target.statuses,
	}))
}
