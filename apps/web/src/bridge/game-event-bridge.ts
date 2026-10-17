import type { DungeonEvents } from "@typecade/contracts"
const replayableEvents = new Set<PropertyKey>(["frame", "screen", "settings", "appearance"])

export class GameEventBridge<M extends object = DungeonEvents> {
	constructor(private readonly replay: ReadonlySet<PropertyKey> = replayableEvents) {}
	private readonly handlers = new Map<keyof M, Set<(payload: unknown) => void>>()
	private readonly lastPayloads = new Map<keyof M, unknown>()

	on<K extends keyof M>(eventName: K, handler: (payload: M[K]) => void): () => void {
		const listeners = this.handlers.get(eventName) ?? new Set<(payload: unknown) => void>()
		const wrapped = handler as (payload: unknown) => void
		listeners.add(wrapped)
		this.handlers.set(eventName, listeners)
		if (this.replay.has(eventName) && this.lastPayloads.has(eventName)) {
			wrapped(this.lastPayloads.get(eventName))
		}

		return () => {
			listeners.delete(wrapped)
			if (listeners.size === 0) {
				this.handlers.delete(eventName)
			}
		}
	}

	emit<K extends keyof M>(eventName: K, payload: M[K]): void {
		if (this.replay.has(eventName)) {
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
