import type { GameEventMap } from "@typecade/contracts"

type GameEventKey = keyof GameEventMap
type Handler<K extends GameEventKey> = (payload: GameEventMap[K]) => void
const replayableEvents = new Set<GameEventKey>([
	"game:paused",
	"encounter:started",
	"line:changed",
	"settings:volumes",
	"settings:effects",
	"screen:changed",
])

export class GameEventBridge {
	private readonly handlers = new Map<GameEventKey, Set<(payload: unknown) => void>>()
	private readonly lastPayloads = new Map<GameEventKey, unknown>()

	on<K extends GameEventKey>(eventName: K, handler: Handler<K>): () => void {
		const listeners = this.handlers.get(eventName) ?? new Set<(payload: unknown) => void>()
		const wrapped = handler as (payload: unknown) => void
		listeners.add(wrapped)
		this.handlers.set(eventName, listeners)
		if (replayableEvents.has(eventName) && this.lastPayloads.has(eventName)) {
			wrapped(this.lastPayloads.get(eventName))
		}

		return () => {
			listeners.delete(wrapped)
			if (listeners.size === 0) {
				this.handlers.delete(eventName)
			}
		}
	}

	emit<K extends GameEventKey>(eventName: K, payload: GameEventMap[K]): void {
		if (replayableEvents.has(eventName)) {
			this.lastPayloads.set(eventName, payload)
		}
		const listeners = this.handlers.get(eventName)
		if (!listeners) {
			return
		}
		for (const handler of listeners) {
			handler(payload)
		}
	}

	clear(): void {
		this.handlers.clear()
		this.lastPayloads.clear()
	}
}
