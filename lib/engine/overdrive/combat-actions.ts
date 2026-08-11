export type CombatActionKind =
	| "slash"
	| "dash"
	| "blade"
	| "railgun"
	| "echo"
	| "shield"
	| "bomb"
	| "drain"
	| "overdrive-burst"

export type CombatTargetScope = "active" | "lane" | "all"

export type CombatAction = {
	kind: CombatActionKind
	itemId?: string
	targetScope: CombatTargetScope
	power: number
	characterIndex: number
	overdrive: boolean
	label: string
}

export type CharacterActionInput = {
	word: string
	character: string
	characterIndex: number
	keycapIds: readonly string[]
	overdrive: boolean
}

export type WordActionInput = {
	word: string
	clean: boolean
	keycapIds: readonly string[]
	overdriveReleased: boolean
	characterIndex?: number
}

function action(
	kind: CombatActionKind,
	characterIndex: number,
	options: Omit<CombatAction, "kind" | "characterIndex">,
): CombatAction {
	return { kind, characterIndex, ...options }
}

function has(ids: readonly string[], id: string) {
	return ids.includes(id)
}

function isHomeRowWord(word: string) {
	const letters = word.replace(/[^\p{L}]/gu, "")
	return letters.length > 0 && /^[asdfghjkl]+$/i.test(letters)
}

export function actionsForCharacter(input: CharacterActionInput): CombatAction[] {
	const actions: CombatAction[] = [action("slash", input.characterIndex, {
		targetScope: "active",
		power: 1,
		overdrive: input.overdrive,
		label: "SIGNAL SLASH",
	})]
	const character = input.character.toLowerCase()
	const previous = input.word[input.characterIndex - 1]?.toLowerCase()
	const lettersOnly = input.word.replace(/[^\p{L}]/gu, "")

	if (has(input.keycapIds, "wasd") && input.characterIndex === 0 && /^[wasd]/i.test(input.word)) {
		actions.push(action("dash", input.characterIndex, {
			itemId: "wasd",
			targetScope: input.overdrive ? "all" : "lane",
			power: input.overdrive ? 2 : 1,
			overdrive: input.overdrive,
			label: input.overdrive ? "WASD CROSS-LANE DASH" : "WASD DASH",
		}))
	}

	if (has(input.keycapIds, "vowel_magnet") && /[aeiou]/i.test(character)) {
		actions.push(action("blade", input.characterIndex, {
			itemId: "vowel_magnet",
			targetScope: input.overdrive ? "all" : "active",
			power: input.overdrive ? 2 : 1,
			overdrive: input.overdrive,
			label: input.overdrive ? "TWIN VOWEL BLADES" : "VOWEL BLADE",
		}))
	}

	if (has(input.keycapIds, "longshot") && lettersOnly.length >= 8 && input.characterIndex === 7) {
		actions.push(action("railgun", input.characterIndex, {
			itemId: "longshot",
			targetScope: input.overdrive ? "all" : "lane",
			power: input.overdrive ? Math.max(2, lettersOnly.length - 6) : lettersOnly.length - 6,
			overdrive: input.overdrive,
			label: input.overdrive ? "BOUNCING RAILGUN" : "RAILGUN PIERCE",
		}))
	}

	if (has(input.keycapIds, "double_tap") && previous && previous === character) {
		actions.push(action("echo", input.characterIndex, {
			itemId: "double_tap",
			targetScope: input.overdrive ? "all" : "active",
			power: input.overdrive ? 2 : 1,
			overdrive: input.overdrive,
			label: input.overdrive ? "WORD ECHO" : "DOUBLE TAP ECHO",
		}))
	}

	if (has(input.keycapIds, "home_row") && input.characterIndex === 0 && isHomeRowWord(input.word)) {
		actions.push(action("shield", input.characterIndex, {
			itemId: "home_row",
			targetScope: "active",
			power: input.overdrive ? 2 : 1,
			overdrive: input.overdrive,
			label: input.overdrive ? "COUNTER SHIELD" : "HOME-ROW SHIELD",
		}))
	}

	if (has(input.keycapIds, "punctuator") && /[.,!?;:]/.test(input.character)) {
		actions.push(action("bomb", input.characterIndex, {
			itemId: "punctuator",
			targetScope: input.overdrive ? "all" : "lane",
			power: input.overdrive ? 2 : 1,
			overdrive: input.overdrive,
			label: input.overdrive ? "CLUSTER DETONATION" : "PUNCTUATION BOMB",
		}))
	}

	return actions
}

export function actionsForWord(input: WordActionInput): CombatAction[] {
	if (!input.clean) return []
	const characterIndex = input.characterIndex ?? input.word.length - 1
	const actions: CombatAction[] = []
	if (input.overdriveReleased) {
		actions.push(action("overdrive-burst", characterIndex, {
			targetScope: "all",
			power: 2,
			overdrive: true,
			label: "OVERDRIVE BURST",
		}))
	}
	if (has(input.keycapIds, "vampire")) {
		actions.push(action("drain", characterIndex, {
			itemId: "vampire",
			targetScope: input.overdriveReleased ? "all" : "active",
			power: input.overdriveReleased ? 2 : 1,
			overdrive: input.overdriveReleased,
			label: input.overdriveReleased ? "CRIMSON DRAIN" : "VAMPIRE DRAIN",
		}))
	}
	return actions
}
