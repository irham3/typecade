import { describe, it, expect } from 'vitest';
import { calculateWpm, calculateAccuracy, countCorrectChars } from '../scoring';

// ---------------------------------------------------------------------------
// countCorrectChars
// ---------------------------------------------------------------------------
describe('countCorrectChars', () => {
  it('returns 0 for empty strings', () => {
    expect(countCorrectChars('', '')).toBe(0);
  });

  it('returns 0 when typed is empty', () => {
    expect(countCorrectChars('', 'hello')).toBe(0);
  });

  it('returns 0 when target is empty', () => {
    expect(countCorrectChars('hello', '')).toBe(0);
  });

  it('counts all correct for an exact match', () => {
    expect(countCorrectChars('hello', 'hello')).toBe(5);
  });

  it('counts partial matches', () => {
    // "hxllo" vs "hello" → h, l, l, o = 4 correct
    expect(countCorrectChars('hxllo', 'hello')).toBe(4);
  });

  it('handles typed longer than target (extra chars ignored)', () => {
    // Only compares up to min length
    expect(countCorrectChars('hello world', 'hello')).toBe(5);
  });

  it('handles typed shorter than target', () => {
    expect(countCorrectChars('hel', 'hello')).toBe(3);
  });

  it('returns 0 when every character is wrong', () => {
    expect(countCorrectChars('xxxxx', 'hello')).toBe(0);
  });

  it('handles spaces as characters', () => {
    expect(countCorrectChars('a b', 'a b')).toBe(3);
    expect(countCorrectChars('a_b', 'a b')).toBe(2); // underscore ≠ space
  });
});

// ---------------------------------------------------------------------------
// calculateWpm
// ---------------------------------------------------------------------------
describe('calculateWpm', () => {
  it('returns 0 when elapsedMs is 0', () => {
    expect(calculateWpm(100, 0)).toBe(0);
  });

  it('returns 0 when elapsedMs is negative', () => {
    expect(calculateWpm(100, -1000)).toBe(0);
  });

  it('returns 0 when correctChars is 0', () => {
    expect(calculateWpm(0, 60000)).toBe(0);
  });

  it('calculates WPM correctly for 1 minute', () => {
    // 300 correct chars / 5 = 60 words, over 1 minute = 60 WPM
    expect(calculateWpm(300, 60_000)).toBe(60);
  });

  it('calculates WPM correctly for 30 seconds', () => {
    // 150 correct chars / 5 = 30 words, over 0.5 min = 60 WPM
    expect(calculateWpm(150, 30_000)).toBe(60);
  });

  it('floors the result', () => {
    // 7 correct chars / 5 = 1.4 words, over 1 min = 1.4 → floor = 1
    expect(calculateWpm(7, 60_000)).toBe(1);
  });

  it('handles very short elapsed time (high WPM)', () => {
    // 50 chars / 5 = 10 words, over 1 second = 600 WPM
    expect(calculateWpm(50, 1_000)).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// calculateAccuracy
// ---------------------------------------------------------------------------
describe('calculateAccuracy', () => {
  it('returns 100 when totalChars is 0 (no input yet)', () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it('returns 100 when totalChars is negative', () => {
    expect(calculateAccuracy(0, -1)).toBe(100);
  });

  it('returns 100 for perfect accuracy', () => {
    expect(calculateAccuracy(50, 50)).toBe(100);
  });

  it('returns 0 for zero correct chars', () => {
    expect(calculateAccuracy(0, 50)).toBe(0);
  });

  it('calculates partial accuracy correctly', () => {
    // 45/50 = 90%
    expect(calculateAccuracy(45, 50)).toBe(90);
  });

  it('floors the result', () => {
    // 2/3 = 66.666... → 66
    expect(calculateAccuracy(2, 3)).toBe(66);
  });

  it('clamps to 0 minimum (never negative)', () => {
    // This shouldn't happen in practice but the function should be safe
    expect(calculateAccuracy(-5, 10)).toBe(0);
  });
});
