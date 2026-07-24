# Typecade Overdrive - Decisions & Session Notes

## Milestone 0 (Foundation) - Session 1

**What was built:**
- **F-1 (Headless Typing Engine)**: Extracted core typing logic (keystrokes, word boundaries, smart backspace, accuracy/WPM math) into a pure TypeScript class `TypingEngine` (`lib/engine/core.ts`). 
- **F-4 (Seeded RNG)**: Created a fast, dependency-free deterministic PRNG (Mulberry32) in `lib/engine/rng.ts`, supporting `.next()`, `.pick()`, `.shuffle()`, and independent `.fork()` streams.
- **F-2 (Feature Flag)**: Added `NEXT_PUBLIC_OVERDRIVE` env var and `/overdrive` placeholder page that 404s when the flag is disabled.
- **F-5 (Telemetry)**: Implemented a minimal telemetry event bus (`lib/telemetry/index.ts`) with typed payloads for `run_start`, `stage_clear`, `shop_buy`, `death_by_zone`, and `run_end`.
- **Tests**: Created comprehensive Vitest unit tests for scoring math and RNG sequences (`npm run test` passes).

**What was deferred:**
- **F-3 (Cloudflare Workers Migration)**: Discovered that `@opennextjs/cloudflare` and `wrangler.jsonc` were already configured for the repository. Verified that `npm run build:worker` works. Did not need to touch application code.

**Open Questions for Next Session:**
- We are ready to start Milestone 1 (M1). The next step is building the headless run state machine and the UI timer. Should we implement the state machine using a dedicated library like XState, or manage it entirely in a custom Zustand slice?

## Milestone 3 (Juice & Presentation) - Pixi Combat Update
Pixi combat presentation selected; headless engine unchanged; procedural vector assets used; multiplayer/daily/auth deferred.
