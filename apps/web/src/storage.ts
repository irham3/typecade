type StorageKind = "localStorage" | "sessionStorage"

export function readStorage(kind: StorageKind, key: string): string | null {
	try { return window[kind].getItem(key) }
	catch { return null }
}

export function writeStorage(kind: StorageKind, key: string, value: string | null): void {
	try {
		if (value === null) window[kind].removeItem(key)
		else window[kind].setItem(key, value)
	} catch { /* Browser storage may be blocked; the current session remains playable. */ }
}
