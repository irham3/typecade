export type Listener<T> = (payload: T) => void

export function createEmitter<Events extends Record<string, unknown>>() {
	const map = new Map<keyof Events, Set<Listener<never>>>()
	return {
		on<K extends keyof Events>(event: K, fn: Listener<Events[K]>) {
			if (!map.has(event)) map.set(event, new Set())
			map.get(event)!.add(fn as Listener<never>)
			return () => { map.get(event)!.delete(fn as Listener<never>) }
		},
		emit<K extends keyof Events>(event: K, payload: Events[K]) {
			map.get(event)?.forEach((fn) => (fn as Listener<Events[K]>)(payload))
		},
	}
}
