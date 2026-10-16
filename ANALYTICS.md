# Dungeon measurement plan

Revision: 2026-10-15. Implemented measurement workflow; see the migration log for actual results. The previous Next.js/Umami/Search Console setup guide is retired because it refers to removed application paths and environment variables.

No analytics dependency, remote collection or third-party account is added in this reset. Measure playability with local test/profile evidence. `npm run profile:dungeon` defaults to 900 active simulation seconds against `http://localhost:4173` and writes a hardware-labelled JSON report plus screenshot under `test-results/dungeon-profile`. Its bot uses real keyboard events, chooses upgrades and handles boss paragraphs; its WPM is an automated input profile, not a human study.

## Required local evidence

- First-run keyboard start and completion of a kill/cast/level/death/restart loop.
- Time to first hit and level, HP loss, draft decisions and survival at declared typing profiles.
- Correct/incorrect accepted input, WPM and accuracy using active real time rather than slow-motion time.
- Target-label collisions and offscreen/clipped HUD across the supported viewports.
- Frame-time p50/p95, draw calls and live enemy/loot/projectile counts at cap and boss stagger.
- Heap and renderer allocation plateau after warmup, repeated navigation and context recovery.
- Real-client multiplayer starts, finishes, disconnects/reconnects, validation failures and authoritative outcomes.

Keep samples reproducible with seed, ruleset, input log, viewport, browser and hardware. Do not log raw passwords, auth tokens, custom practice text or personal keystroke streams to a remote service.

## Later product analytics

If explicitly requested, define minimal typed events and retention/privacy policy before choosing a provider. Completion, restart and return-session measures need a real implementation and meaningful sample size; no retention claim is inferred from artwork or automated tests. No old analytics variables or deleted adapters are requirements for the dungeon release.
