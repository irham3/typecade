import type { RunSnapshot, StageType } from "./types"

export type EnemyRole =
	| "scout"
	| "brute"
	| "healer"
	| "shield-carrier"
	| "corruptor"
	| "mimic"
	| "swarm"
	| "boss"

export type CombatTarget = {
	id: string
	word: string
	queueIndex: number
	active: boolean
	prefix: string
	role: EnemyRole
	hp: number
	maxHp: number
	attackInMs: number
	reward: number
	threatMs: number
	rewardMultiplier: number
	traits: readonly string[]
	statuses: readonly string[]
	tacticalLabel: string
}

export type CombatTargetSnapshotInput =
	Pick<RunSnapshot, "currentWord" | "stage" | "zone" | "targetOrdinal"> & {
		upcomingWords: readonly string[]
	}

const ROLE_LABEL: Record<EnemyRole, string> = {
	scout: "FAST STRIKE",
	brute: "HEAVY REWARD",
	healer: "REPAIRS LANE",
	"shield-carrier": "GUARDS LANE",
	corruptor: "CORRUPTS NEXT",
	mimic: "COPIES TRAIT",
	swarm: "QUICK SWARM",
	boss: "BOSS PHASE",
}

const ROLE_REWARD: Record<EnemyRole, number> = {
	scout: 1,
	brute: 1.4,
	healer: 1.2,
	"shield-carrier": 1.25,
	corruptor: 1.3,
	mimic: 1.25,
	swarm: 0.8,
	boss: 2,
}

const STAGE_THREAT_BASE_MS: Record<StageType, number> = {
	warmup: 7_200,
	rush: 5_800,
	glitch: 4_800,
}

function wordTraits(word: string): string[] {
	const lower = word.toLowerCase()
	const letters = lower.replace(/[^\p{L}]/gu, "")
	const traits: string[] = []
	if (letters.length <= 2) traits.push("swarm")
	if (letters.length <= 4) traits.push("short")
	if (letters.length >= 8) traits.push("long")
	if (/[.,!?;:0-9]/.test(word)) traits.push("corrupt")
	if (/(.)\1/i.test(letters)) traits.push("double")
	if (letters.length > 0 && /^[asdfghjkl]+$/i.test(letters)) traits.push("home-row")
	if (letters.length > 2 && letters === [...letters].reverse().join("")) traits.push("palindrome")
	if (/[xzqj]/i.test(letters)) traits.push("rare-letter")
	return traits
}

function roleForWord(input: {
	word: string
	stage: StageType
	zone: number
	queueIndex: number
	targetOrdinal: number
}): EnemyRole {
	const traits = wordTraits(input.word)
	if (input.stage === "glitch" && input.queueIndex === 0) return "boss"
	if (traits.includes("corrupt")) return "corruptor"
	if (traits.includes("long")) return "brute"
	if (traits.includes("palindrome")) return "mimic"
	if (traits.includes("home-row")) return "shield-carrier"
	if ((input.targetOrdinal + input.queueIndex + input.zone) % 7 === 0) return "healer"
	if (traits.includes("swarm") || traits.includes("short")) return "scout"
	return "scout"
}

function threatFor(input: {
	role: EnemyRole
	stage: StageType
	zone: number
	queueIndex: number
	targetOrdinal: number
}): number {
	const rolePressure: Record<EnemyRole, number> = {
		scout: -1_300,
		brute: 1_800,
		healer: 500,
		"shield-carrier": 900,
		corruptor: 100,
		mimic: 300,
		swarm: -1_600,
		boss: -800,
	}
	const deterministicJitter = ((input.targetOrdinal + input.zone + input.queueIndex) % 5) * 120
	return Math.max(
		1_200,
		STAGE_THREAT_BASE_MS[input.stage]
			+ rolePressure[input.role]
			+ input.queueIndex * 1_600
			+ deterministicJitter,
	)
}

function shortestUniquePrefixes(words: readonly string[]): string[] {
	return words.map((word, index) => {
		const upperWord = word.toUpperCase()
		for (let length = 1; length <= upperWord.length; length += 1) {
			const prefix = upperWord.slice(0, length)
			const unique = words.every((other, otherIndex) => (
				otherIndex === index || !other.toUpperCase().startsWith(prefix)
			))
			if (unique) return prefix
		}
		return upperWord
	})
}

function hpFor(word: string, role: EnemyRole): number {
	const roleHp: Record<EnemyRole, number> = {
		scout: 0,
		brute: 5,
		healer: 3,
		"shield-carrier": 4,
		corruptor: 3,
		mimic: 2,
		swarm: -1,
		boss: 10,
	}
	return Math.max(1, [...word].length + roleHp[role])
}

function statusesFor(traits: readonly string[], role: EnemyRole): string[] {
	const statuses: string[] = []
	if (traits.includes("corrupt")) statuses.push("corrupt")
	if (role === "shield-carrier") statuses.push("guarded")
	if (role === "healer") statuses.push("regen")
	if (role === "boss") statuses.push("armored")
	return statuses
}

export function visibleCombatTargets(input: CombatTargetSnapshotInput): CombatTarget[] {
	const words = [input.currentWord, ...input.upcomingWords.slice(0, 2)]
		.filter((word) => word.length > 0)
	const prefixes = shortestUniquePrefixes(words)
	return words
		.map((word, queueIndex) => {
			const role = roleForWord({
				word,
				stage: input.stage,
				zone: input.zone,
				queueIndex,
				targetOrdinal: input.targetOrdinal,
			})
			const traits = wordTraits(word)
			const threatMs = threatFor({
				role,
				stage: input.stage,
				zone: input.zone,
				queueIndex,
				targetOrdinal: input.targetOrdinal,
			})
			const maxHp = hpFor(word, role)
			const rewardMultiplier = ROLE_REWARD[role]
			return {
				id: `z${input.zone}-${input.stage}-${input.targetOrdinal}-${queueIndex}-${word.toLowerCase()}`,
				word,
				queueIndex,
				active: queueIndex === 0,
				prefix: prefixes[queueIndex],
				role,
				hp: maxHp,
				maxHp,
				attackInMs: threatMs,
				reward: Math.ceil([...word].length * rewardMultiplier),
				threatMs,
				rewardMultiplier,
				traits,
				statuses: statusesFor(traits, role),
				tacticalLabel: ROLE_LABEL[role],
			}
		})
}
