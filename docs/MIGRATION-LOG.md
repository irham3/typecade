# Ocean Typing RPG Migration Log

Status: complete for Milestone 0/1 vertical slice
Checkpoint branch: `refactor/ocean-typing-rpg`
Checkpoint commit: `1226cdf` (`checkpoint: pre-refactor snapshot before PixiJS->Phaser migration`)

## PixiJS Audit

PixiJS usage found before migration:

- `features/overdrive/canvas/gameplay-canvas.tsx`
- `features/overdrive/canvas/combat-scene.ts`
- `features/overdrive/canvas/visual-assets.ts`
- `features/overdrive/canvas/scene-feedback.ts`
- `features/overdrive/canvas/command-rail.ts`
- `features/overdrive/canvas/assets/combat-assets.ts`
- `features/overdrive/canvas/fx/particle-system.ts`
- `features/overdrive/canvas/fx/damage-numbers.ts`
- `features/overdrive/canvas/rig/rig-instance.ts`
- `features/overdrive/canvas/effects/combat-effects.ts`
- `features/overdrive/canvas/effects/item-presentation.ts`
- `features/overdrive/canvas/choreography/combat-director.ts`
- `features/overdrive/canvas/pools/actor-pool.ts`
- `features/overdrive/canvas/pools/score-popup-pool.ts`
- `features/overdrive/canvas/pools/signal-node-pool.ts`
- `features/overdrive/canvas/pools/text-pool.ts`
- `features/overdrive/canvas/pools/__tests__/pool-contracts.test.ts`
- `e2e/overdrive.spec.ts`
- `e2e/overdrive-progression.spec.ts`
- `e2e/overdrive-layout.spec.ts`
- `e2e/overdrive-juice.spec.ts`
- `package.json`
- `package-lock.json`

Mismatched pre-refactor assets found under `public/overdrive/art/**`.

## Decisions

- 2026-08-22: Treat `docs/game-design(new).md` plus the user prompt as the implementation source of truth for this pass; `docs/prd.md` and `docs/design.md` describe the old Overdrive/Pixi product and conflict with the requested Ocean Typing RPG migration.
- 2026-08-22: Scope is limited to Milestone 0 and Milestone 1 from `docs/game-design(new).md`; multiplayer, Colyseus, Supabase Auth/Postgres/RLS, matchmaking, and ranked modes remain intentionally unimplemented.
- 2026-08-22: `npm view phaser version` returned `4.2.1`; target Phaser 4 and follow the installed official Phaser v4 skill guidance.
- 2026-08-22: No existing Vite config was present; create `apps/web` as the requested React + TypeScript + Vite shell and route root `npm run dev` to it.
- 2026-08-22: Official Phaser skill installation via `npx skills add phaserjs/phaser` succeeded and installed 28 Phaser subsystem skills.
- 2026-08-22: `gamedev-skills/awesome-gamedev-agent-skills` installation succeeded and installed Phaser/core game-dev workflow skills.
- 2026-08-22: `ianlintner/ai-pixel-art-image-generation` and `jay6697117/game-skills` installed successfully; `0x0funky/agent-sprite-forge` clone was stopped after repeated long-running progress with no install result, so it is treated as unavailable in this runtime.
- 2026-08-22: Use Kenney Fish Pack 2.0 as the free CC0 fallback source for fish/environment base shapes because paid/generated image API credentials were not verified in the environment.
- 2026-08-22: Keep local persistence in `localStorage` only, versioned and idempotent, as requested stand-in for account/cloud save.
- 2026-08-22: Use a deterministic procedural asset generator plus the art bible instead of paid image APIs; this keeps the run unblocked and makes every asset reproducible from `scripts/generate_ocean_assets.py`.
- 2026-08-22: Keep all six MVP skills in the Milestone 1 run by default so the vertical slice demonstrates the full temporary-skill set without a separate unlock flow.
- 2026-08-22: Use a fixed 3-zone encounter order containing all 10 Shallow Coast species, with route choices modifying reward multipliers; this satisfies the 3-zone/full-roster slice while keeping branching lightweight for Milestone 1.
- 2026-08-22: Use transparent PNG sprite frames plus a generated Phaser atlas for fish/UI/VFX, and WebP for backgrounds; this follows the texture-atlas and WebP performance guidance while preserving the required source filenames.
- 2026-08-22: Lazy-load Phaser from the React shell so the menu/HUD chunk remains separate from the game renderer chunk.
- 2026-08-22: Enable `preserveDrawingBuffer` on the Phaser renderer so Playwright can verify nonblank WebGL canvas pixels; accepted as a small prototype/testability tradeoff and noted for future profiling.
- 2026-08-22: Keep Colyseus, Supabase Auth/Postgres/RLS, ranked matchmaking, match history, and `apps/game-server` out of this pass per the user's scope boundary.
- 2026-08-22: Replace the root `AGENTS.md` Overdrive/Pixi guidance with Ocean/Phaser guidance so future tasks do not follow the retired stack.
- 2026-08-23: Add a React-owned main menu and preparation screen before gameplay; this matches game-product expectations without letting React manipulate Phaser scene internals.
- 2026-08-23: Bump `CONTENT_VERSION` to `ocean-m1-2026-08-23-polish` so incompatible pre-polish local saves reset cleanly after rules/UI progression changes.
- 2026-08-23: Regenerate the Ocean asset pack with the deterministic local generator instead of paid image APIs; no paid image key was required, and reproducibility is preferred for this polish pass.
- 2026-08-23: Add MP3 fallbacks beside OGG audio cues and load both in Phaser; this follows browser audio compatibility guidance while preserving the required OGG naming convention.
- 2026-08-23: Use runtime procedural juice for fish life (pull-based positioning, rod bend, line vibration, rings, particles, boss entrance) rather than trying to hand-author unique animation frames for every behavior.
- 2026-08-23: Keep all six Milestone 1 skills available, but expose active skill costs, skill charge, Sonar route reveal, and passive trigger callouts so the build layer is legible in the vertical slice.
- 2026-08-24: Add a Phaser 4 camera displacement map plus vignette post-FX for subtle moving water atmosphere; reduced-motion mode removes the animated displacement while preserving legibility.
- 2026-08-24: Add typed level-up bridge events and transient React feedback banners for active/passive skills and secured XP threshold crossings. Feedback uses sequence ids so repeated skill casts retrigger the same treatment.
- 2026-08-24: Make hit-stop release against the longest overlapping impact deadline so catch, phase, and level-up feedback cannot resume the scene early.

## Asset Production Notes

- Art bible written first in `docs/art-bible.md`.
- Self-evaluated target trio before scaling:
  - Common: `fish_reef_minnow_idle_0.png` has readable compact silhouette, sea-green/cyan palette, thick dark outline, and low texture density.
  - Rare: `fish_moonfin_snapper_idle_0.png` has magenta/blue rarity treatment, glow spots, and distinct moon-fin silhouette.
  - Boss: `fish_crown_leviathan_idle_0.png` uses larger frame size, crown/coral treatment, and a heavier silhouette for phase-based presentation.
- Generated asset count after the 2026-08-23 polish pass: 449 files under `apps/web/public/assets/ocean`:
  - 384 `.png` sprite/UI/VFX files.
  - 17 `.webp` background/map/weather files.
  - 23 `.ogg` audio cues/loops.
  - 23 `.mp3` browser audio fallbacks.
  - 2 atlas files.
- 2026-08-24: Refreshed the tracked Ocean production pack in place without changing runtime paths. The atlas, fish state sprites, ambient sprites, UI chrome, equipment icons, VFX, and OGG cues were replaced with clearer higher-contrast revisions so the verified branch retains the upgraded art/audio set alongside the gameplay fixes.
- Every generated asset is listed in `ASSET-LICENSES.md`; the runtime manifest is `apps/web/public/assets/ocean/manifest.json`.

## 2026-08-23 Game-Feel Polish Self-Audit

- Discovery: React shell now has three explicit screens (`menu`, `prep`, `game`), and Phaser still has one gameplay scene. Source changes are limited to `apps/web`, `packages/contracts`, `packages/game-rules`, tests, docs, and the asset generator.
- Architecture grade: A- maintained. React owns screen flow, HUD, collection, settings, and persistence. Phaser receives only typed bridge events and owns the animated canvas/VFX/audio.
- Performance audit: Particle emitters remain bounded, fish life is procedural, atlas usage remains central, background assets stay WebP, and reduced-effects still gates shake/large flashes.
- API correctness: Phaser audio now loads MP3+OGG arrays. Sound volume updates use a typed fallback helper because Phaser's `BaseSound` type does not expose `setVolume` for every backend.
- Lifecycle/cleanup: Scene shutdown still clears bridge subscriptions, resize listeners, audio loops, and transient arrays; generated float labels/rings self-destroy through tweens.

## Structural Self-Audit

### Discovery

- New app/package TypeScript files: 12.
- New app/package TypeScript lines: 2,680.
- Phaser scenes: 1 (`FishingScene`).
- Test files: 3 new files (`packages/typing-engine`, `packages/game-rules`, `e2e/ocean.spec.ts`).
- New Ocean asset files: 426.

### Architecture Grade

Grade: A- for the Milestone 0/1 scope.

- React owns the shell, HUD, collection/settings overlays, local save wiring, and keyboard dispatch.
- Phaser owns the canvas, parallax layers, fish sprites/animations, line drawing, particles, camera feedback, and audio playback.
- `GameEventBridge` is the only cross-boundary link; React does not manipulate Phaser scene internals directly.
- `packages/typing-engine` and `packages/game-rules` are pure TypeScript with no React, DOM, or Phaser imports.
- `packages/content` owns fish, skill, route, and Indonesian passage data.
- Out-of-scope multiplayer/backend modules were not scaffolded.

### Performance Audit

- Phaser is dynamically imported from React.
- Fish/UI/VFX are packed into `atlas_ocean.png` plus JSON metadata.
- Backgrounds are WebP and loaded by current location variant.
- Particle emitters are bounded with `maxParticles` and reused for bubbles/splashes/sparks.
- Fish motion is procedural using sine drift and animation frames rather than bespoke per-species logic.
- Reduced-effects setting disables major shake/flash paths.
- No physics groups are used because the Milestone 1 fishing scene does not need Arcade/Matter bodies.

### API Correctness

- Phaser version: 4.2.1.
- Scene is added through Phaser's Scene Manager and autostarted with bridge data.
- Phaser 4 particle emitter path uses `this.add.particles`.
- No Pixi imports, containers, tickers, filters, or Pixi input handling remain in active source.
- No Phaser 3-only `setTintFill` or custom pipeline patterns were introduced.

### Lifecycle and Cleanup

- `FishingScene.init` resets per-scene state.
- Bridge subscriptions are collected and disposed on scene shutdown.
- Scale resize listener is removed on shutdown.
- Sounds are stopped on scene shutdown.
- React cleanup clears bridge listeners and destroys the Phaser game instance.
- Texture disposal is left to Phaser's game destroy path for this single-scene vertical slice.

## Verification

### 2026-08-24 Arcade and Asset Pass

- Fixed the decisive typing loop: `passage-complete` now resolves the fishing encounter as `caught`, freezes the old encounter timer, shows the catch result, plays catch feedback, and schedules the next mark.
- Catch rewards are granted immediately through the existing idempotency key, so XP, coins, materials, and level-up feedback land on every successful encounter while checkpoint securing remains duplicate-safe.
- Added deterministic seed-based skill drafts: four level-gated offers, up to three equipped skills, and a fresh default loadout per run. Common skills unlock at level 1, uncommon at level 2, and Reel Mastery at level 3.
- Tuned Cast Net so it remains a finisher only after a small fish reaches 45% reel progress; it cannot bypass the typing gate. Added distinct Phaser VFX for every skill, including passive Steel Line, Perfect Bait, and Reel Mastery triggers.
- Added `bg_shallow_coast_gameplay_ai.webp`, a normalized 1600x900 hero gameplay plate generated from the approved ocean visual direction. It is layered behind the existing zone overlays and registered in the asset manifest and license table.
- Fixed Phaser 4 camera easing by passing easing callbacks to `zoomTo` instead of Phaser 3-style string names.
- Verification: `npx tsc --noEmit` pass; `npm run test` pass (16 tests); `npm run build` pass; `npm run test:e2e` pass (desktop/mobile, catch result visible, no console errors); renderer-retirement audit returns no matches.

- `npm run test`: pass, 12 tests across typing and fishing rules.
- `npm run build`: pass, Vite production build.
- `npm run test:e2e`: pass, desktop/mobile canvas nonblank after scene transition, no major HUD overlap, no console errors.
- Pixi source/package audit: `rg -n "pixi|PIXI|@pixi|Pixi|pixi-gameplay|data-pixi-host" package.json package-lock.json apps packages features e2e lib` returns no matches.
- 2026-08-23 polish verification:
  - `npx tsc --noEmit`: pass.
  - `npm run test`: pass, 14 tests across typing and fishing rules.
  - `npm run build`: pass, Vite production build. Non-failing Phaser chunk-size warning remains expected for the lazy-loaded renderer chunk.
  - `PLAYWRIGHT_BASE_URL=http://localhost:3003 npm run test:e2e`: pass, desktop/mobile main-menu -> prep -> gameplay flow, canvas nonblank, HUD no-overlap. Port 3003 was used locally because port 3000 was occupied by another workspace process.
  - Pixi source/package audit remains clean: `rg -n "pixi|PIXI|@pixi|Pixi|pixi-gameplay|data-pixi-host" package.json package-lock.json apps packages features e2e lib AGENTS.md .gitignore` returns no matches.

### 2026-09-28 Navigation and verification pass

- Raised menu overlay panels above the main-menu layer so Ranked Duel, Shop, Collection, and Leaderboard panels and their Close buttons receive pointer input.
- Moved the skill dock clear of the icon rail and typing console at desktop, compact, and mobile widths. Playwright checks the final layout after entrance animations settle.
- Browser tests now exercise all six main-menu destinations on desktop and mobile, HUD navigation on desktop and mobile, skill selection and use, route selection and locking, settings controls, pause and resume, a catch, all ten Shallow Coast encounters, Sail Again, and return to menu.
- Verification: `npm run test` passed (20 tests); `npm run test:e2e` passed (8 Chromium tests); `npm run build` passed; `npx tsc --noEmit` passed; `npm run lint` passed without warnings; production preview passed two menu/HUD browser tests; `npm audit` found 0 vulnerabilities; `git diff --check` passed.
- Renderer retirement audit: `rg -n 'pixi|PIXI|@pixi|Pixi|pixi-gameplay|data-pixi-host' package.json package-lock.json apps packages features e2e lib AGENTS.md .gitignore` returned no matches.
- Vitest source coverage is 22.69% statements, 17.9% branches, 24.39% functions, and 22.09% lines. This does not meet the requested 100% target. Playwright browser interactions are not counted in these Vitest numbers.
- Ranked Duel still opens a locked placeholder because online multiplayer is outside the Milestone 0/1 scope of this branch. The Phaser lazy chunk also still exceeds Vite's 500 kB size warning.

### 2026-09-28 Practice and menu consistency pass

- Replaced the duplicate Play/Adventure destinations with a dedicated Practice screen and the distinct Adventure preparation screen. The online room entry is labeled Multiplayer.
- Added EN/ID, Words, Time, Quote difficulty, Custom Text/shuffle, punctuation, numbers, Classic, Perfect Tide, Three Hulls, text size, and monospace controls to Practice using the existing race rules and typing engine.
- Replaced stale raster menu labels with the project's pixel icon assets and live text. Sharpened shared menu/gameplay controls to use the same navy/gold square pixel chrome.
- Removed the unrelated 40-species concept preview from Collection. The active Pebble Goby artwork now crops its matching 128x96 pixel animation strip; other fish keep their gameplay sprite assets.
- Added browser coverage for the practice timer, challenge failures, and multiplayer lobby/race/leaderboard states. A server test exposed and fixed rejected async room operations escaping the room error handler.
- Verification: `npm run test:coverage` passed (57 tests); coverage is 88.61% statements, 76.70% branches, 87.26% functions, and 89.70% lines, so the requested 100% target remains unmet. `npm run build`, `npm run lint`, TypeScript check, and `git diff --check` passed. The full Playwright suite passed 12 tests; the added Practice flow passed separately, and multiplayer passed 4/4 after the async error-handling fix. Renderer-retirement audit returned no matches. Vite still reports the lazy Phaser chunk above 500 kB.

### 2026-09-29 Coverage and scene input pass

- Added browser tests for save restoration, invalid storage, route and skill selection, keyboard input, all fish species, boss phases, practice challenges, multiplayer room states, and Worker room lifecycle paths.
- Moved the gameplay backdrop load into Phaser `preload()` so `create()` can see and render the texture.
- Removed dead branches in typing, fishing rewards, practice submission, and Worker broadcast code after confirming their guards could never change the result.
- Verification: `npm run test` passed (85 tests); `npm run test:coverage` passed (85 tests) at 96.95% statements, 91.03% branches, 95.38% functions, and 97.14% lines. `npm run test:e2e` passed (13 Chromium tests); `npm run build`, `npm run lint`, `npm run typecheck:rooms`, and `git diff --check` passed. Renderer retirement audit returned no matches.
- Coverage remains below the requested 100%; remaining gaps are in UI and Phaser lifecycle branches. Production build still warns that the lazy Phaser chunk is about 1.4 MB.

### 2026-10-02 Coverage follow-up

- Added UI cases for word-count practice and timed multiplayer races, including the expired-timer display and socket transport errors.
- Simplified `ResultToast` to require the catch result that its render guard already guarantees, and replaced the encounter-number lookup table with the equivalent zone arithmetic.
- Verification: `npm run test:coverage` passed (87 tests); coverage is 98.17% statements, 91.81% branches, 98.61% functions, and 98.24% lines. This remains below the requested 100% target. The RaceScreen browser test passed independently (10 tests).
- Full Playwright E2E passed (13 tests) with the Worker started by Playwright; build, lint, and `npm run typecheck:rooms` also passed. Renderer-retirement audit remains to be rerun before handoff.
- The remaining coverage gap is concentrated in Phaser scene lifecycle paths, the hook's defensive branches, and a small set of screen render paths.

### 2026-10-02 Coverage callbacks and invariants

- Removed a redundant Phaser `init()` cleanup pass: scene shutdown already disposes and clears bridge listeners before the next `init()`.
- Removed the unreachable null-session branch from Practice keyboard handling; a session is assigned synchronously before the racing phase is rendered.
- Added multiplayer configuration error-path tests and explicit coverage for delayed Phaser animation callbacks.
- Verification: `npm run test:coverage` passed (88 tests) at 98.46% statements, 92.33% branches, 100% functions, and 98.40% lines. Function coverage reached 100%, but the overall 100% target remains unmet. `FishingScene.browser.test.ts` passed independently after synchronizing with Phaser's `create` event.

## Touched Files

This list is updated as files are changed.

- `docs/MIGRATION-LOG.md`
- `docs/art-bible.md`
- `ASSET-LICENSES.md`
- `docs/reference/typecade-ui-reference.jpg`
- `AGENTS.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `apps/web/package.json`
- `apps/web/index.html`
- `apps/web/vite.config.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/App.browser.test.tsx`
- `apps/web/src/main.browser.test.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/practice/PracticeScreen.tsx`
- `apps/web/src/multiplayer/RaceScreen.browser.test.tsx`
- `apps/web/src/server/index.test.ts`
- `apps/web/src/server/index.ts`
- `apps/web/src/bridge/game-event-bridge.ts`
- `apps/web/src/bridge/game-event-bridge.test.ts`
- `apps/web/src/game/createFishingGame.ts`
- `apps/web/src/game/createFishingGame.test.ts`
- `apps/web/src/game/FishingScene.ts`
- `apps/web/src/game/FishingScene.browser.test.ts`
- `apps/web/src/hooks/useOceanRun.ts`
- `apps/web/src/hooks/useOceanRun.browser.test.tsx`
- `apps/web/public/assets/ocean/**`
- `packages/contracts/src/index.ts`
- `packages/race-rules/src/index.ts`
- `packages/race-rules/src/index.test.ts`
- `packages/race-rules/src/__tests__/race-rules.test.ts`
- `packages/content/src/index.ts`
- `packages/content/src/content.test.ts`
- `packages/typing-engine/src/index.ts`
- `packages/typing-engine/src/__tests__/typing-engine.test.ts`
- `packages/game-rules/src/index.ts`
- `packages/game-rules/src/__tests__/fishing-rules.test.ts`
- `e2e/ocean.spec.ts`
- `scripts/generate_ocean_assets.py`
- `lib/engine/overdrive/combat-grammar.ts`
- `features/overdrive/canvas/**` (deleted)
- `public/overdrive/art/**` (deleted)
- `e2e/overdrive.spec.ts` (deleted)
- `e2e/overdrive-progression.spec.ts` (deleted)
- `e2e/overdrive-layout.spec.ts` (deleted)
- `e2e/overdrive-juice.spec.ts` (deleted)
- `.asset-sources/kenney_fish-pack_2.zip`
- `.asset-sources/kenney_fish-pack_2/**`
