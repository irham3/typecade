/**
 * Telemetry events for the Overdrive typing mode.
 */

export interface TelemetryEvents {
  run_start: { seed: string };
  stage_clear: { zone: number; stage: string; score: number; tokensEarned: number };
  shop_buy: { itemId: string; price: number; zone: number };
  death_by_zone: { zone: number; stage: string; wpm: number; score: number };
  run_end: { zone: number; finalScore: number; duration: number };
}

export type EventName = keyof TelemetryEvents;

/**
 * Minimal telemetry utility for Overdrive events.
 * Currently uses a console/no-op transport. Will be wired to PostHog later.
 */
export function trackEvent<T extends EventName>(
  eventName: T,
  payload: TelemetryEvents[T]
) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Telemetry] ${eventName}:`, payload);
  }
  
  // TODO: Implement PostHog or Umami tracking for production
}
