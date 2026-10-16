export interface SeededRng {
	nextFloat(): number
	nextInt(minInclusive: number, maxExclusive: number): number
	pick<T>(items: readonly T[]): T
}

export function createSeededRng(seed: string): SeededRng {
	let state = hashSeed(seed)

	return {
		nextFloat() {
			state += 0x6d2b79f5
			let next = state
			next = Math.imul(next ^ (next >>> 15), next | 1)
			next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
			return ((next ^ (next >>> 14)) >>> 0) / 4294967296
		},
		nextInt(minInclusive: number, maxExclusive: number) {
			return Math.floor(this.nextFloat() * (maxExclusive - minInclusive)) + minInclusive
		},
		pick<T>(items: readonly T[]): T {
			if (items.length === 0) {
				throw new Error("Cannot pick from an empty list")
			}
			return items[this.nextInt(0, items.length)]!
		},
	}
}

function hashSeed(seed: string): number {
	let hash = 2166136261
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index)
		hash = Math.imul(hash, 16777619)
	}
	return hash >>> 0
}
