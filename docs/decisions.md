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

## MVP Alignment and Signal Siege Rewrite - 2026-07-25

**Decisions:**
- Reconciled `game-design.md`, `prd.md`, and `design.md` around one canonical score lifecycle: dirty words score zero, every 10 clean words adds Mult, and meeting Quota clears immediately with a real remaining-time Token bonus.
- Locked the implementation to the exact §13 manifest: 15 Keycaps, 4 Macros, and 5 Glitches. Firmware, Switch difficulty, Copycat, KERNEL PANIC, cosmetics, and other v2/P2 systems remain outside the MVP.
- Replaced the generic cartoon/space presentation with the code-native **Signal Siege** asset language: Keystone player core, Packet Shards, Needle Signals, Null Crown, and one coherent custom Typecade Glyph family. No raster AI assets or third-party stock art were needed.
- Kept all game randomness inside deterministic, independently forked seeded streams for words, shop offers, and Glitches.
- Added typed vendor-neutral telemetry events for run, stage, shop, item, Macro, and Glitch lifecycle analysis.
- Implemented the local UTC Daily Seed entry point and a 1200x630 PNG share-card export. Server-authoritative daily attempt enforcement, Overdrive leaderboard submission, public run URLs/OG rendering, and replay verification remain part of M4 because this repository has no approved Overdrive Supabase migration or server-secret seed endpoint.

**Verification gates:**
- TypeScript strict check, ESLint, production Next.js build, Vitest engine/telemetry suite, and Playwright desktop/tablet/mobile flows must all pass before enabling the flag.
- Practice remains available and is covered by an Overdrive E2E regression check.
