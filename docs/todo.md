# Dungeon redesign — ordered delivery checklist

Revision: 2026-10-15. Branch: `refactor/roughlike-survival-2.5d`. Current authorized phase: planning and asset preparation. Checked planning items are not gameplay completion.

## P0 — Planning reset, this change

- [x] Preserve supplied GDD verbatim and four reference images outside public assets.
- [x] Replace governing fishing rules, PRD, interaction spec, art bible and decisions.
- [x] Remove old Ocean/Overdrive plans and reference packs; preserve Git history and mark migration log historical.
- [x] Inventory every remaining runtime asset and its callers; record cutover deletion dependencies.
- [x] Map all requested modes, lifecycle, data, tests and performance gates.
- [x] Run and record planning validation and production build; legacy unit/browser/static checks also passed (see migration log).

## M0 — Contract and content baseline

- [ ] Pin a tested balance table: HP, grace, dash, mana/cooldowns, spawn/speed curve, loot and upgrade weights.
- [ ] Reuse typing/RNG helpers; define survival entities, input phases, typed events and snapshot validation.
- [ ] Create EN/ID enemy words, boss passages, skill keywords and upgrade data with distinct draft keywords.
- [ ] Add seeded replay/domain tests and invalid-input cases; verify no framework/DOM/Three imports.
- [ ] Establish server contracts for each multiplayer mode before its implementation gate.

Touches: `packages/contracts`, `packages/content`, `packages/typing-engine`, `packages/game-rules`; new package only if existing boundaries genuinely require it. Update affected imports/exports, Vite/Vitest/TypeScript aliases only if package layout changes. Replace content/fishing fixtures alongside their callers.

## M1 — Playable Endless domain

- [ ] Ready → arena → pause → death → results → restart, with no fixed final stage.
- [ ] Seeded 360-degree spawn, chase/contact, damage grace, one-time drops, bounded entity admission.
- [ ] Stable 4–6 target queue; case-sensitive lock, prefix, typo, cancel, target lifetime and dash.
- [ ] Distinct shield/elite/bomber/mage/barrel/chest rules and safe chained area damage.
- [ ] XP attraction, 50-character streak magnet, overflow levels, frozen typed drafts and eligible upgrade exhaustion fallback.
- [ ] Tab skills preserve prefix; word cooldowns/mana/evolutions and all requested relic families.
- [ ] Five-minute boss schedule, armor break, ten-second paragraph/ultimate, armor rebuild, biome/relic and continued survival.
- [ ] Simulate multiple typing speeds and long-run caps; test death/draft/boss transition precedence.

Touches: domain packages and unit tests. Gate: deterministic rules pass before visual feedback can claim gameplay effects.

## M2 — Dungeon renderer and complete shell

- [ ] Replace `FishingScene`, `CoastalModels`, `createFishingGame`, `ocean-motion` and their tests/callers together.
- [ ] Recycled floor/walls, blue knight, articulated enemies, minotaur, torches, pools for loot/projectiles/effects.
- [ ] Dash/slash, gait, recoil, shield break, death, casting, stagger and camera follow reflect domain events.
- [ ] Replace `useOceanRun`, active Ocean contracts/content and fishing passages with survival integration.
- [ ] Redesign `App.tsx`, `styles.css`, `PixelArt.tsx`, title/mode selection, settings, account and results.
- [ ] React label projection/collision handling; no bottom arena paragraph; skill, draft and boss states readable.
- [ ] Scope key capture, keep accessible input/IME fallback, prevent double events, honor browser focus and shortcuts.
- [ ] Add new isolated persistence/checkpoint integration; do not reinterpret Ocean saves/account tables.
- [ ] Remove incompatible public boat/audio only when their final callers and tests retire; keep licensed font.
- [ ] Replace Ocean/sunset browser scenarios with actual survival equivalents; retain shared engine and safety coverage.

Gate: keyboard-only full start/kill/cast/level/death/restart loop; actual screenshot review at desktop, 320px portrait, mobile landscape and tablet. No fake combat animation standing in for rules.

## M3 — Typing Dojo

- [ ] Reuse `PracticeScreen`, `PracticeKeyboard`, `TypingField` and `PracticeSession` where appropriate.
- [ ] Dungeon training room, dummy/Sensei, lessons and objective progress; no damage or rewards exploit.
- [ ] Preserve word/sentence/custom content, EN/ID, editable input, settings and touch fallback.
- [ ] Browser regression for focus, symbols/case, IME and rolling text.

## M4 — Castle Sprint

- [ ] Reuse `RaceScreen`, `packages/race-rules`, Worker/Durable Object room infrastructure.
- [ ] Replace rowboats and sea lanes with knights/castle course; define course, laps and obstacle words.
- [ ] Authoritative starts/progress/finish/rematch and WPM; reconnect/host-transfer/disconnect handling.
- [ ] Four independent real clients complete a race; invalid/replayed/too-fast events rejected.
- [ ] Keep actual tested participant limits explicit; do not infer WAN capacity from previous 100-peer tests.

## M5 — Bridge Clash / Arena Royale

- [ ] Specify target selection, attack/block timing, shields, score, elimination and tie rules as tested server data.
- [ ] Implement room mode/state, input validation and authoritative combat; reuse existing WS transport.
- [ ] Bridge renderer/HUD shares actors/resources, with clear rival identities.
- [ ] Test 1v1 and four-player combat, simultaneous actions, reconnect and cheating/replay rejection.

## M6 — Co-op Raid

- [ ] Implement initial two DPS/healer/tank composition and explicit scaling for additional participants.
- [ ] Five boss layers, role words, aggro, party healing, downed states and three shared revives.
- [ ] Authoritative team WPM, wipe/victory, leave/rejoin and reward resolution.
- [ ] Four real clients complete/wipe a raid with genuine role effects and shared revive accounting.

## M7 — Retirement and release evidence

- [ ] Remove remaining fishing-only hooks, renderer, content, glyphs, tests, public assets and obsolete names.
- [ ] Rename old deployment/config identifiers only with caller/environment inventory; no accidental production deployment.
- [ ] Complete separately validated dungeon cloud saves, achievements and leaderboard after the persistence contract; preserve old data and test ownership/RLS, conflict handling and verified-result boundaries.
- [ ] Run `npm run test`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`, lint and both TypeScript checks.
- [ ] Run retirement/headless audits; verify all public asset references resolve and have licensing/provenance.
- [ ] Profile 15-minute survival, capped horde/boss, Reduced Effects, pause/visibility/context recovery.
- [ ] Measure repeated navigation: stable heap after warmup, bounded geometries/textures, released audio/listeners.
- [ ] Review all screens and real keyboard play against UX scenarios; save current evidence and limitations.
- [ ] Confirm no unrelated account data loss, no secret leakage and no fake live players.

## Requirement coverage by delivery gate

| Gate | Primary PRD requirements |
| --- | --- |
| M0–M1 | CORE-01 through CORE-05, SKILL-01/02, PROG-01/02, BOSS-01, RUN-01 |
| M2 | UI-01, A11Y-01, DATA-01, PERF-01 |
| M3 | DOJO-01, A11Y-01 |
| M4 | RACE-01, NET-01 |
| M5 | PVP-01, NET-01 |
| M6 | RAID-01, NET-01 |
| M7 | DATA-02, PERF-02, CLEAN-01 and final regression of all requirements |

Do not mark gates complete from code existence, old Ocean screenshots or tests that never exercise the new mechanic.
