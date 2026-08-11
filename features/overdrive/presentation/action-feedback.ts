import type { OverdrivePresentationEvent } from "./events"

export type KeycapFeedback = {
	eventId: number
	itemId: string
	label: string
}

export function collectKeycapFeedback(
	events: readonly OverdrivePresentationEvent[],
): KeycapFeedback[] {
	const feedback: KeycapFeedback[] = []
	for (const event of events) {
		if (event.type === "item-triggered") {
			feedback.push({
				eventId: event.id,
				itemId: event.itemId,
				label: event.contribution.label,
			})
			continue
		}
		const actions = event.type === "accepted-character"
			? event.actions
			: event.type === "word-completed"
				? event.combatActions
				: undefined
		for (const action of actions ?? []) {
			if (!action.itemId) continue
			feedback.push({
				eventId: event.id,
				itemId: action.itemId,
				label: action.label,
			})
		}
	}
	return feedback
}
