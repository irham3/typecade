import { TypingStats, KeystrokeEvent, WordCompleteEvent } from './types';
import { calculateWpm, calculateAccuracy, countCorrectChars } from './scoring';

export type EngineEvent =
  | { type: 'keystroke'; payload: KeystrokeEvent }
  | { type: 'word_complete'; payload: WordCompleteEvent }
  | { type: 'typo'; payload: { word: string; typed: string } }
  | { type: 'mult_change'; payload: { mult: number } };

export type EventListener = (event: EngineEvent) => void;

export class TypingEngine {
  public text: string;
  public typedChars: string = "";
  public lastLockedIndex: number = -1;
  public startTime: number | null = null;
  public accumulatedPause: number = 0;
  private pauseStart: number | null = null;
  
  public errors: number = 0;
  public streak: number = 0;
  public wpm: number = 0;
  public accuracy: number = 100;

  private listeners: EventListener[] = [];

  constructor(text: string = "") {
    this.text = text;
  }

  public reset(text: string) {
    this.text = text;
    this.typedChars = "";
    this.lastLockedIndex = -1;
    this.startTime = null;
    this.accumulatedPause = 0;
    this.pauseStart = null;
    this.errors = 0;
    this.streak = 0;
    this.wpm = 0;
    this.accuracy = 100;
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: EngineEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  public start() {
    if (this.startTime === null) {
      this.startTime = Date.now();
    }
  }

  public pause() {
    if (this.pauseStart === null && this.startTime !== null) {
      this.pauseStart = Date.now();
    }
  }

  public resume() {
    if (this.pauseStart !== null) {
      this.accumulatedPause += Date.now() - this.pauseStart;
      this.pauseStart = null;
    }
  }

  public getElapsedMs(): number {
    if (this.startTime === null) return 0;
    let totalPause = this.accumulatedPause;
    if (this.pauseStart !== null) {
      totalPause += Date.now() - this.pauseStart;
    }
    return Math.max(1, Date.now() - this.startTime - totalPause);
  }

  public handleInput(value: string) {
    if (this.startTime === null && value.length === 1) {
      this.start();
    }

    // Keystroke event firing (forward typing only)
    if (value.length > this.typedChars.length) {
      const char = value[value.length - 1];
      const expected = this.text[value.length - 1] || '';
      const isCorrect = char === expected;
      
      this.emit({
        type: 'keystroke',
        payload: {
          char,
          expected,
          correct: isCorrect,
          timestampMs: this.getElapsedMs()
        }
      });
    }

    // "Per kata" lock & jump logic
    if (value.length > this.typedChars.length) {
      const lastChar = value[value.length - 1];
      if (lastChar === " ") {
        // Jump to next word boundary immediately
        const nextSpaceInText = this.text.indexOf(" ", this.typedChars.length);
        if (nextSpaceInText !== -1) {
          if (nextSpaceInText > value.length - 1) {
            const missedCount = nextSpaceInText - (value.length - 1);
            value = value.substring(0, value.length - 1) + " ".repeat(missedCount) + " ";
          }
        } else {
          if (this.text.length > value.length - 1) {
            const missedCount = this.text.length - (value.length - 1);
            value = value.substring(0, value.length - 1) + " ".repeat(missedCount);
          }
        }

        const currentWordStart = this.lastLockedIndex + 1;
        const currentWordEnd = value.length - 1;
        const typedWordPart = value.substring(currentWordStart, currentWordEnd);
        const targetWordPart = this.text.substring(currentWordStart, currentWordEnd);
        
        const wordIsCorrect = typedWordPart === targetWordPart;

        if (wordIsCorrect && (currentWordEnd >= this.text.length || this.text[currentWordEnd] === " ")) {
          this.lastLockedIndex = currentWordEnd;
        }

        // Fire word complete or typo
        this.emit({
          type: 'word_complete',
          payload: {
            word: targetWordPart,
            typed: typedWordPart,
            correct: wordIsCorrect,
            charCount: targetWordPart.length,
            timestampMs: this.getElapsedMs()
          }
        });

        if (!wordIsCorrect) {
          this.emit({
            type: 'typo',
            payload: {
              word: targetWordPart,
              typed: typedWordPart
            }
          });
        }
      }
    } else if (value.length < this.typedChars.length) {
      if (value.length <= this.lastLockedIndex) {
        value = this.typedChars.substring(0, this.lastLockedIndex + 1);
      }

      // Smart Backspace
      if (this.typedChars[this.typedChars.length - 1] === " ") {
        while (
          value.length > 0 &&
          value.length > this.lastLockedIndex + 1 &&
          value[value.length - 1] === " " &&
          this.text[value.length - 1] !== " "
        ) {
          value = value.slice(0, -1);
        }
      }
    }

    this.typedChars = value;

    // Recalculate stats
    let errCount = 0;
    let currentStreak = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== this.text[i]) {
        errCount++;
        currentStreak = 0;
      } else {
        currentStreak++;
      }
    }
    
    this.errors = errCount;
    this.streak = currentStreak;

    const correctChars = countCorrectChars(value, this.text);
    this.wpm = calculateWpm(correctChars, this.getElapsedMs());
    this.accuracy = calculateAccuracy(correctChars, value.length);
  }

  public tick() {
    if (this.startTime === null) return;
    const correctChars = countCorrectChars(this.typedChars, this.text);
    this.wpm = calculateWpm(correctChars, this.getElapsedMs());
    // Accuracy stays the same since typedChars hasn't changed
  }

  public getStats(): TypingStats {
    const correctChars = countCorrectChars(this.typedChars, this.text);
    return {
      wpm: this.wpm,
      accuracy: this.accuracy,
      correctChars,
      totalChars: this.typedChars.length,
      elapsedMs: this.getElapsedMs()
    };
  }
}
