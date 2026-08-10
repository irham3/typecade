/**
 * Shared types for the Typecade typing engine.
 *
 * This module is pure TypeScript — no React, no DOM, no framework imports.
 * Everything else (hooks, components, Overdrive) subscribes to these types.
 */

/** Aggregated stats snapshot for a typing session. */
export interface TypingStats {
  /** Words per minute (standard: correctChars / 5 / minutes). */
  wpm: number;
  /** Accuracy percentage (0–100). */
  accuracy: number;
  /** Total correctly typed characters. */
  correctChars: number;
  /** Total characters the user attempted. */
  totalChars: number;
  /** Active typing time in milliseconds (pauses excluded). */
  elapsedMs: number;
}

// ---------------------------------------------------------------------------
// Event stream types — minimal for M0, expanded in M1 (R-1 / I-1).
// ---------------------------------------------------------------------------

/** Fired for every keystroke the engine processes. */
export interface KeystrokeEvent {
  /** The character the user typed. */
  char: string;
  /** The character that was expected. */
  expected: string;
  /** Whether the keystroke was correct. */
  correct: boolean;
  /** Timestamp in ms (relative to session start). */
  timestampMs: number;
}

/** Fired when a complete word is submitted. */
export interface WordCompleteEvent {
  /** The target word. */
  word: string;
  /** What the user actually typed. */
  typed: string;
  /** Whether the entire word was correct. */
  correct: boolean;
  /** Character count of the target word. */
  charCount: number;
  /** Timestamp in ms (relative to session start). */
  timestampMs: number;
}
