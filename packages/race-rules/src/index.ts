import { raceQuotes, raceWords } from "../../content/src/race"

export type RaceLanguage = "id" | "en"
export type RaceFormat = "words" | "time" | "quote" | "custom"
export type RaceVariant = "classic" | "perfect" | "three-hulls"
export type RaceStatus = "waiting" | "racing" | "finished" | "out"

export interface RaceConfig {
	language: RaceLanguage
	format: RaceFormat
	wordCount: number
	timeSeconds: number
	difficulty: "easy" | "medium" | "hard"
	customText: string
	shuffle: boolean
	punctuation: boolean
	numbers: boolean
	variant: RaceVariant
	maxPlayers: number
}

export interface RacePlayer {
	id: string
	name: string
	ready: boolean
	connected: boolean
	status: RaceStatus
	cursor: number
	errors: number
	lives: number
	finishedAt: number | null
	lastSeq: number
}

export interface RaceRoomSnapshot {
	code: string
	hostId: string
	phase: "waiting" | "countdown" | "racing" | "finished"
	config: RaceConfig
	text: string
	players: RacePlayer[]
	startsAt: number | null
	endsAt: number | null
	serverNow: number
}

export interface RaceTicket {
	code: string
	playerId: string
	token: string
}

export const defaultRaceConfig: RaceConfig = {
	language: "id",
	format: "words",
	wordCount: 50,
	timeSeconds: 60,
	difficulty: "medium",
	customText: "",
	shuffle: false,
	punctuation: false,
	numbers: false,
	variant: "classic",
	maxPlayers: 10,
}

export function parseRaceConfig(input: unknown): RaceConfig {
	if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid race settings")
	const raw = input as Record<string, unknown>
	const config = { ...defaultRaceConfig, ...raw }
	if (!(["id", "en"] as unknown[]).includes(config.language)) throw new Error("Choose Indonesian or English")
	if (!(["words", "time", "quote", "custom"] as unknown[]).includes(config.format)) throw new Error("Invalid text format")
	if (!(["easy", "medium", "hard"] as unknown[]).includes(config.difficulty)) throw new Error("Invalid quote difficulty")
	if (!(["classic", "perfect", "three-hulls"] as unknown[]).includes(config.variant)) throw new Error("Invalid challenge")
	for (const [key, min, max] of [["wordCount", 1, 1000], ["timeSeconds", 1, 3600], ["maxPlayers", 2, 100]] as const) {
		if (!Number.isInteger(config[key]) || config[key] < min || config[key] > max) throw new Error(`${key} must be ${min}–${max}`)
	}
	for (const key of ["shuffle", "punctuation", "numbers"] as const) {
		if (typeof config[key] !== "boolean") throw new Error(`${key} must be on or off`)
	}
	if (typeof config.customText !== "string") throw new Error("Custom text must be text")
	const customText = cleanRaceText(config.customText)
	if (customText.length > 5000) throw new Error("Custom text is too long")
	if (config.format === "custom" && customText.length < 3) throw new Error("Enter at least three characters")
	return {
		language: config.language,
		format: config.format,
		wordCount: config.wordCount,
		timeSeconds: config.timeSeconds,
		difficulty: config.difficulty,
		customText,
		shuffle: config.shuffle,
		punctuation: config.punctuation,
		numbers: config.numbers,
		variant: config.variant,
		maxPlayers: config.maxPlayers,
	}
}

export function cleanRaceText(value: string): string {
	return value.normalize("NFKC").replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, " ").trim()
}

function createRng(seed: string): () => number {
	let state = 2166136261
	for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619)
	return () => {
		state += 0x6d2b79f5
		let value = state
		value = Math.imul(value ^ (value >>> 15), value | 1)
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296
	}
}

export function generateRaceText(config: RaceConfig, seed: string): string {
	const random = createRng(seed)
	if (config.format === "quote") {
		const quotes = raceQuotes[config.language][config.difficulty]
		return quotes[Math.floor(random() * quotes.length)]!
	}
	if (config.format === "custom") {
		if (!config.shuffle) return config.customText
		const words = config.customText.split(" ")
		for (let index = words.length - 1; index > 0; index -= 1) {
			const other = Math.floor(random() * (index + 1))
			;[words[index], words[other]] = [words[other]!, words[index]!]
		}
		return words.join(" ")
	}
	const source = raceWords[config.language]
	const count = config.format === "time" ? 1000 : config.wordCount
	const words: string[] = []
	for (let index = 0; index < count; index += 1) {
		let word = source[Math.floor(random() * source.length)]!
		if (config.numbers && random() < 0.12) word = String(Math.floor(random() * 100))
		if (config.punctuation && index > 0 && random() < 0.14) word += [",", ".", "!", "?"][Math.floor(random() * 4)]
		words.push(word)
	}
	return words.join(" ")
}

export function createRacePlayer(id: string, name: string, variant: RaceVariant): RacePlayer {
	return { id, name, ready: false, connected: false, status: "waiting", cursor: 0, errors: 0, lives: variant === "three-hulls" ? 3 : variant === "perfect" ? 1 : 0, finishedAt: null, lastSeq: 0 }
}

export interface RaceInputResult {
	player: RacePlayer
	accepted: number
	mistakes: number
}

export function applyRaceInput(player: RacePlayer, target: string, value: string, seq: number, now: number, config: RaceConfig): RaceInputResult {
	if (player.status !== "racing" || !Number.isInteger(seq) || seq <= player.lastSeq || typeof value !== "string" || value.length < 1 || value.length > 32) {
		return { player, accepted: 0, mistakes: 0 }
	}
	const next = { ...player, lastSeq: seq }
	let accepted = 0
	let mistakes = 0
	for (const key of value) {
		if (key < " " || key === "\u007f" || next.status !== "racing") break
		if (next.cursor >= target.length) break
		if (key === target.slice(next.cursor, next.cursor + key.length)) {
			next.cursor += key.length
			accepted += key.length
			if (next.cursor === target.length && config.format !== "time") {
				next.status = "finished"
				next.finishedAt = now
			}
		} else {
			next.errors += 1
			mistakes += 1
			if (config.variant !== "classic") {
				next.lives -= 1
				if (next.lives <= 0) {
					next.status = "out"
					next.finishedAt = now
				}
			}
		}
	}
	return { player: next, accepted, mistakes }
}

export function raceAccuracy(player: RacePlayer): number {
	const total = player.cursor + player.errors
	return total === 0 ? 100 : Math.round(player.cursor / total * 1000) / 10
}

export function rankRacePlayers(players: readonly RacePlayer[], config?: RaceConfig): RacePlayer[] {
	return [...players].sort((a, b) => {
		if (config?.format === "time" && a.cursor !== b.cursor) return b.cursor - a.cursor
		if ((a.status === "finished") !== (b.status === "finished")) return a.status === "finished" ? -1 : 1
		if (a.status === "finished" && b.status === "finished") return (a.finishedAt ?? Infinity) - (b.finishedAt ?? Infinity) || raceAccuracy(b) - raceAccuracy(a)
		if (a.cursor !== b.cursor) return b.cursor - a.cursor
		if (raceAccuracy(a) !== raceAccuracy(b)) return raceAccuracy(b) - raceAccuracy(a)
		return a.id.localeCompare(b.id)
	})
}
