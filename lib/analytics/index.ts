export const ANALYTICS_EVENTS = [
	"landing_view",
	"play_clicked",
	"game_loaded",
	"run_started",
	"tutorial_step_completed",
	"first_stage_completed",
	"overdrive_first_released",
	"shop_opened",
	"item_purchased",
	"stage_failed",
	"run_finished",
	"second_run_started",
	"auth_prompt_shown",
	"auth_started",
	"auth_completed",
	"result_shared",
	"challenge_opened",
	"challenge_run_started",
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number]

export type AnalyticsProperty = string | number | boolean
export type AnalyticsProperties = Record<string, AnalyticsProperty>

const PRIVATE_KEYS = new Set([
	"email", "name", "display_name", "username", "user_id", "userId",
	"profile", "text", "word", "words", "typed", "typed_words",
])

function isAnalyticsProperty(value: unknown): value is AnalyticsProperty {
	return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
}

export function sanitizeProperties(properties: Record<string, unknown> = {}): AnalyticsProperties {
	const sanitized: AnalyticsProperties = {}
	for (const [key, value] of Object.entries(properties)) {
		if (!PRIVATE_KEYS.has(key) && isAnalyticsProperty(value)) sanitized[key] = value
	}
	return sanitized
}

type UmamiClient = {
	track: (eventName: string, properties?: AnalyticsProperties) => void
}

declare global {
	interface Window {
		umami?: UmamiClient
	}
}

/** Product analytics boundary. Without a website id this is a no-op. */
export function track(
	eventName: AnalyticsEventName,
	properties: Record<string, unknown> = {},
): void {
	if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return

	const client = window.umami
	if (!client?.track) return

	try {
		client.track(eventName, sanitizeProperties(properties))
	} catch {
		// Analytics must never affect gameplay or navigation.
	}
}
