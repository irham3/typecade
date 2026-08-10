export interface RNG {
  /** Returns a random float between 0 (inclusive) and 1 (exclusive) */
  next: () => number;
  /** Returns a random element from the array */
  pick: <T>(array: T[]) => T;
  /** Returns a new array with the elements shuffled */
  shuffle: <T>(array: T[]) => T[];
  /** Creates a new independent RNG sequence deterministically branched from this one */
  fork: (label: string) => RNG;
  /** Exports the current 32-bit generator state for deterministic persistence */
  exportState: () => number;
  /** Restores a previously exported 32-bit generator state */
  importState: (state: number) => void;
}

/** FNV-1a hash to convert a string seed into a 32-bit integer */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h;
}

/** 
 * Mulberry32 PRNG.
 * Very fast, good enough for game logic, zero dependencies.
 */
export function createRng(seed: string): RNG {
  let state = hashString(seed);

  function next() {
    state |= 0; 
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  function pick<T>(array: T[]): T {
    if (array.length === 0) throw new Error("Cannot pick from an empty array");
    return array[Math.floor(next() * array.length)];
  }

  function shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function fork(label: string): RNG {
    // We append the label and current state so multiple forks 
    // at different times produce different streams.
    return createRng(`${seed}:${label}:${state}`);
  }

  function exportState() {
    return state >>> 0;
  }

  function importState(nextState: number) {
    if (!Number.isInteger(nextState) || nextState < 0 || nextState > 0xFFFFFFFF) {
      throw new Error("RNG state must be an unsigned 32-bit integer");
    }
    state = nextState | 0;
  }

  return { next, pick, shuffle, fork, exportState, importState };
}
