import type { GameEventMap } from "@typecade/contracts"

type GameEventKey = keyof GameEventMap
type Handler<K extends GameEventKey> = (payload: GameEventMap[K]) => void

export class GameEventBridge {
	private readonly handlers = new Map<GameEventKey, Set<(payload: unknown) => void>>()

	on<K extends GameEventKey>(eventName: K, handler: Handler<K>): () => void {
		const listeners = this.handlers.get(eventName) ?? new Set<(payload: unknown) => void>()
		const wrapped = handler as (payload: unknown) => void
		listeners.add(wrapped)
		this.handlers.set(eventName, listeners)

		return () => {
			listeners.delete(wrapped)
			if (listeners.size === 0) {
				this.handlers.delete(eventName)
			}
		}
	}

	emit<K extends GameEventKey>(eventName: K, payload: GameEventMap[K]): void {
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
	}
}
