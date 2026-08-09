import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';

describe('RNG (Mulberry32)', () => {
  it('produces deterministic sequences from the same seed', () => {
    const rng1 = createRng('test-seed-123');
    const rng2 = createRng('test-seed-123');

    for (let i = 0; i < 10; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('produces different sequences from different seeds', () => {
    const rng1 = createRng('seed-A');
    const rng2 = createRng('seed-B');
    
    // Highly unlikely to match on first pull
    expect(rng1.next()).not.toBe(rng2.next());
  });

  it('pick() selects deterministically', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const rng1 = createRng('pick-seed');
    const rng2 = createRng('pick-seed');

    for (let i = 0; i < 5; i++) {
      expect(rng1.pick(items)).toBe(rng2.pick(items));
    }
  });

  it('shuffle() shuffles deterministically', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng1 = createRng('shuffle-seed');
    const rng2 = createRng('shuffle-seed');

    expect(rng1.shuffle(items)).toEqual(rng2.shuffle(items));
    expect(rng1.shuffle(items)).not.toEqual(items); // Should actually shuffle
  });

  it('fork() creates independent, deterministic streams', () => {
    const root1 = createRng('root-seed');
    const root2 = createRng('root-seed');

    const words1 = root1.fork('words');
    const shop1 = root1.fork('shop');

    const words2 = root2.fork('words');
    const shop2 = root2.fork('shop');

    // words1 and words2 should match
    expect(words1.next()).toBe(words2.next());
    // shop1 and shop2 should match
    expect(shop1.next()).toBe(shop2.next());
    
    // words and shop should NOT match each other
    expect(words1.next()).not.toBe(shop1.next());
  });
});
