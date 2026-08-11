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
	wordDirty?: boolean
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
		label: input.wordDirty ? "MISFIRE" : "SIGNAL SLASH",
	})]
	if (input.wordDirty) return actions
	return actions
}

export function actionsForWord(input: WordActionInput): CombatAction[] {
	if (!input.clean) return []
	const characterIndex = input.characterIndex ?? input.word.length - 1
	const actions: CombatAction[] = []
	const lettersOnly = input.word.replace(/[^\p{L}]/gu, "")
	const overdrive = input.overdriveReleased
	if (has(input.keycapIds, "wasd") && /^[wasd]/i.test(input.word)) {
		actions.push(action("dash", characterIndex, {
			itemId: "wasd",
			targetScope: overdrive ? "all" : "lane",
			power: overdrive ? 2 : 1,
			overdrive,
			label: overdrive ? "WASD CROSS-LANE DASH" : "WASD DASH",
		}))
	}

	const vowels = input.word.match(/[aeiou]/gi)?.length ?? 0
	if (has(input.keycapIds, "vowel_magnet") && vowels > 0) {
		actions.push(action("blade", characterIndex, {
			itemId: "vowel_magnet",
			targetScope: overdrive ? "all" : "active",
			power: overdrive ? vowels * 2 : vowels,
			overdrive,
			label: overdrive ? "TWIN VOWEL BLADES" : "VOWEL BLADE RELEASE",
		}))
	}

	if (has(input.keycapIds, "longshot") && lettersOnly.length >= 8) {
		actions.push(action("railgun", characterIndex, {
			itemId: "longshot",
			targetScope: overdrive ? "all" : "lane",
			power: overdrive ? Math.max(2, lettersOnly.length - 6) : lettersOnly.length - 6,
			overdrive,
			label: overdrive ? "BOUNCING RAILGUN" : "RAILGUN PIERCE",
		}))
	}

	if (has(input.keycapIds, "double_tap") && /(.)\1/i.test(lettersOnly)) {
		actions.push(action("echo", characterIndex, {
			itemId: "double_tap",
			targetScope: overdrive ? "all" : "active",
			power: overdrive ? 2 : 1,
			overdrive,
			label: overdrive ? "WORD ECHO" : "DOUBLE TAP ECHO",
		}))
	}

	if (has(input.keycapIds, "home_row") && isHomeRowWord(input.word)) {
		actions.push(action("shield", characterIndex, {
			itemId: "home_row",
			targetScope: "active",
			power: overdrive ? 2 : 1,
			overdrive,
			label: overdrive ? "COUNTER SHIELD" : "HOME-ROW SHIELD",
		}))
	}

	if (has(input.keycapIds, "punctuator") && /[.,!?;:]/.test(input.word)) {
		actions.push(action("bomb", characterIndex, {
			itemId: "punctuator",
			targetScope: overdrive ? "all" : "lane",
			power: overdrive ? 2 : 1,
			overdrive,
			label: overdrive ? "CLUSTER DETONATION" : "PUNCTUATION BOMB",
		}))
	}

	if (input.overdriveReleased) {
		actions.push(action("overdrive-burst", characterIndex, {
			targetScope: "all",
			power: 2,
			overdrive: true,
			label: "OVERDRIVE BURST",
		}))
	}
	return actions
}
