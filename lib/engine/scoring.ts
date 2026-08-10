/**
 * Pure scoring functions for the Typecade typing engine.
 *
 * This module is pure TypeScript — no React, no DOM, no framework imports.
 * All math lives here so it can be unit-tested, shared between Practice
 * and Overdrive, and run server-side for replay validation.
 */

/**
 * Count the number of correctly typed characters by comparing typed input
 * against the target text character-by-character.
 *
 * Only characters up to `min(typed.length, target.length)` are compared.
 */
export function countCorrectChars(typed: string, target: string): number {
  const len = Math.min(typed.length, target.length);
  let correct = 0;
  for (let i = 0; i < len; i++) {
    if (typed[i] === target[i]) {
      correct++;
    }
  }
  return correct;
}

/**
 * Calculate words-per-minute using the standard formula:
 *   WPM = (correctChars / 5) / elapsedMinutes
 *
 * @param correctChars - Number of correctly typed characters.
 * @param elapsedMs    - Active typing time in milliseconds (pauses excluded).
 * @returns WPM as a non-negative integer, or 0 if elapsedMs ≤ 0.
 */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const elapsedMinutes = elapsedMs / 1000 / 60;
  return Math.max(0, Math.floor((correctChars / 5) / elapsedMinutes));
}

/**
 * Calculate accuracy as a percentage.
 *   Accuracy = (correctChars / totalChars) * 100
 *
 * @param correctChars - Number of correctly typed characters.
 * @param totalChars   - Total characters the user attempted.
 * @returns Accuracy as a non-negative integer (0–100), or 100 if totalChars ≤ 0.
 */
export function calculateAccuracy(correctChars: number, totalChars: number): number {
  if (totalChars <= 0) return 100;
  return Math.max(0, Math.floor((correctChars / Math.max(1, totalChars)) * 100));
}
