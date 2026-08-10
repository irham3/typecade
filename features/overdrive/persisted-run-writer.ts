export type PersistedRunWriterOptions = {
	delayMs?: number
	serialize: () => string | null
	save: (serialized: string) => void
	schedule: (callback: () => void, delayMs: number) => unknown
	cancel: (handle: unknown) => void
}

export function createPersistedRunWriter({
	delayMs = 750,
	serialize,
	save,
	schedule,
	cancel,
}: PersistedRunWriterOptions) {
	let pending: unknown = null
	let disposed = false

	function flush() {
		if (disposed) return
		if (pending !== null) {
			cancel(pending)
			pending = null
		}
		const serialized = serialize()
		if (serialized !== null) save(serialized)
	}

	function scheduleWrite() {
		if (disposed || pending !== null) return
		pending = schedule(() => {
			pending = null
			flush()
		}, delayMs)
	}

	function dispose() {
		if (pending !== null) cancel(pending)
		pending = null
		disposed = true
	}

	return {
		schedule: scheduleWrite,
		flush,
		dispose,
	}
}
