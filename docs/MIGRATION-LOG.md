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

### 2026-10-02 Multiplayer and gameplay coverage checkpoint

- Added browser coverage for additional Phaser skill effects, missing scene sprites, encounter route and skill selection, multiplayer lobby and fleet display states, and server race timing boundaries.
- Simplified UI and run-state paths after checking their callers and lifecycle invariants; retained input validation at the multiplayer room boundary.
- Verification: `npm run test` passed (97 tests); `npm run test:coverage` passed at 99.95% statements, 96.76% branches, 100% functions, and 100% lines. The uncovered statement is the static import at `apps/web/src/App.tsx:1`; it executes during module loading and has no independently callable path. No coverage exclusions were added. Branch coverage is still below 100%.
- `npm run test:e2e` passed all 13 Chromium scenarios, including two-player races, challenge modes, menu navigation, responsive HUD, and a complete Shallow Coast run through the Leviathan. `npm run build`, `npm run lint`, `npm run typecheck:rooms`, and `git diff --check` passed. Renderer-retirement audit returned no matches.
- The production build still reports the lazy Phaser renderer chunk at about 1.4 MB, above Vite's 500 kB advisory threshold.

### 2026-10-02 Coverage boundary follow-up

- Added cases for missing multiplayer clock values, a finished local racer, a closed socket, spaces in practice passages, and a non-Error passage-generation failure.
- Verification: `npm run test:coverage` passed (99 tests) at 99.95% statements, 97.17% branches, 100% functions, and 100% lines. The strict 100% coverage target remains unmet; no coverage exclusions were used. The complete Playwright suite remains 13/13 from the preceding checkpoint; this follow-up changes tests only.
- Added rendered waiting-room coverage for the quote and Three Hulls rule summary, a one-second practice session that runs to its deadline, the alternate typing tick cue under a controlled Phaser clock, and ignored navigation keys in the fishing hook. The suite passes 100 tests at 99.95% statements, 97.38% branches, 100% functions, and 100% lines. Remaining branch gaps sit in nullish and reduced-motion fallbacks plus optional fields that current event producers always populate; the report stays unfiltered.

## 2026-10-02 Coverage Checkpoint

- Switched Vitest coverage instrumentation from V8 to Istanbul so executable statements are measured without counting static import declarations as uncovered statements. Coverage covers all 15 tracked production TypeScript files in the active Vite roots (`apps/web/src` and `packages/*/src`), verified against the coverage map; no files, lines, or branches within those roots are excluded. The legacy Next/Overdrive tree is outside the current Vite build and typecheck scope.
- Added browser and unit cases for optional typing-event payload fallbacks, changing route lists during initialization, invalid multiplayer config errors, absent server race boundaries, malformed practice metrics, and default replay options.
- Fixed the typing tick sound selector to alternate on even/odd Phaser clock values; the former `now % 2 > 1` condition could never select the first cue for integer timestamps. Both cues now have a regression assertion.
- Removed the unused `Stat` default parameter; every current caller supplies `hot`, so this preserves rendered behavior and avoids reporting an unreachable default-argument branch.
- Verification: `npm run test:coverage -- --reporter=dot` passed 108 tests at 100% statements (1993/1993), branches (1446/1446), functions (432/432), and lines (1792/1792). `npm run test` passed (108 tests), `npm run test:e2e` passed (13/13), `npm run lint` passed without warnings, `npm run build` passed, and `npm run typecheck:rooms` passed.
- Renderer-retirement audit found no Pixi references. Production build retains Vite's advisory that the lazy Phaser chunk is 1,398.09 kB (364.68 kB gzip); build succeeds.
- Added 100% statement, branch, function, and line thresholds so the coverage gate fails if a later change regresses any category.

## 2026-10-09 Input, progression, pixel assets, and multiplayer audit

### Authorization and active scope

- The user explicitly authorized playable multiplayer despite the original branch restriction, and requested incremental pushes to `app-v2` without a pull request or merge. This pass repairs the existing casual Worker rooms; it does not introduce ranked ratings or account services.
- Active modes are Practice, Adventure, and Multiplayer. The main menu also exposes the working Collection and Settings dialogs. Placeholder shop/leaderboard destinations were removed; gameplay Skills shows the actual equipped skills.

### Findings and repairs

| Finding | Repair | Regression evidence |
| --- | --- | --- |
| Global typing intercepted controls and numeric skill shortcuts | Shared focused native input; Alt+number activates skills; browser shortcuts and IME composition are preserved | Browser tests for modifiers, buttons, mobile input, composition, digits, and focus |
| Passage cursor and progress were hard to follow | Word wrapping, readable whitespace, current-character feedback, local passage scrolling, correct 0–100% progress | Unicode/cursor/scroll tests and responsive Playwright gameplay |
| Practice timer began before the first key and timed WPM stopped at the last key | First-key start; deadline snapshot advances elapsed typing metrics | Timed practice test waits before typing, then reaches the shared duration |
| Multiple mobile characters could continue a challenge after a fatal typo | Synchronous terminal-session flag rejects subsequent characters in the same input event | `xabc` into Perfect Tide with target `abc` remains a loss and never records a best score |
| New expeditions could share reward identity or be replaced by an old transition | Unique run seed, preserved selected loadout, canceled stale transition timer | Two consecutive catches increase XP and count; restart remains at encounter one after the old transition window |
| Progress began with demonstration currency and XP | New collections start at zero; existing saves remain intact | Package/browser tests verify initial values and persisted catch rewards |
| Level-up and skill feedback could overwrite each other | Catch result owns the level banner; Cast Net retains catch/level rewards | Cast Net progress gate and level-reward test |
| Unlock guidance promised unavailable waters | Show the actual skill unlocks and XP remaining; all six unlocked choices become available in preparation | Level/banner tests, full draft, minimum one and maximum three equipped choices |
| Completion could overlap typing controls or describe a loss as a cleared coast | Results and replay actions occupy the encounter flow; completed runs hide inactive controls; victory requires a caught Leviathan | Failed expedition/replay test and full ten-encounter boss run |
| Styling and sprites differed between menus and gameplay | Shared blank pixel button plates, pixel icon pack, selected fish catalog sprites, matching boat/equipment | Asset mapping, atlas refresh, screenshots, desktop/mobile menu traversal |
| Dialogs could lose keyboard focus and leave the timer running | Native modal dialogs, Escape/cancel handlers, restored typing focus, paused gameplay while a HUD panel is open | Browser dialog tests and pause/panel Playwright checks |
| Race clock used the local clock without the server offset | Snapshot-based server offset drives the countdown/deadline display | Time race and deadline tests |
| Leaving a room retained an unavailable lobby member | Explicit leave message removes the member, transfers hosting, and releases capacity immediately | Worker tests and a real two-player lobby departure/replacement scenario |
| Large fleets needed bounded rendering | Local-rank presentation, nearby competitors, fleet minimap, searchable full standings | 100-member browser rendering test and live 100-connection room scenario |
| Mobile race standings and the fixed-height stage pushed typing outside the viewport | Standings follow the main arena; compact in-race chrome, viewport-sized stage, and bounded passage height keep typing visible | Two-player production E2E checks that the whole arena and input are in the viewport at 390×844 and 320×640; screenshots retained |
| Storage denial could crash Practice or Multiplayer | Safe reads/writes preserve the current in-memory session; corrupt/negative best scores fall back to zero | Blocked read/write/remove tests for both modes |
| Hit stop could pause a scene during initialization | Only start a new hold on an active scene; an existing hold can still be extended | Phaser hold-window test includes inactive scene, extension, release, and an already resumed scene |

### Asset production record

- Refreshed 319 atlas cells with `node apps/web/scripts/refresh-ocean-art.mjs`. Atlas frame names, sizes, and pivots remain stable; PNG output shrank from 1,622,411 to 1,261,015 bytes.
- The new blue/gold menu plates were generated by editing the existing Typecade plates, removing baked lettering/icons, and preserving pixel borders and transparent margins. `ASSET-LICENSES.md` records current provenance.
- Pebble Goby retains its multi-frame state strips. Other replacement fish reuse their selected base pose across atlas states; Phaser supplies movement and effects. This pass does not claim new frame-by-frame animation for every species.
- Shortened typo/phase/catch hit stop and bounded the level-up burst. Viewport-scaled monospace callouts sit above the fish. Reduced effects remain available.

### Verification environment

- `npm run test:e2e` builds the production bundle, then Playwright exercises UI and rooms directly through an isolated Worker on `localhost:8788`, with `.wrangler/e2e-state` for persistence. Normal development stays on 3000/8787. The suite owns its server lifecycle and does not reuse another run's server. Earlier overlapping runs exposed local `SQLITE_BUSY`; the Vite proxy also logged connection resets during fleet teardown. Production E2E bypasses that proxy, and fleet members leave sequentially with server-acknowledged closure. Finished rooms cancel their unused alarm.
- Coverage covers every one of the 17 production TypeScript files in the active Vite/package roots. No file, line, branch, or function exclusions were added. The historical Next/Overdrive tree remains outside the active Vite build.

### Final verification results

| Gate | Result |
| --- | --- |
| `npm run test` | 124 tests passed across 13 files |
| `npm run test:coverage` | 100% statements (2096/2096), branches (1519/1519), functions (457/457), and lines (1848/1848); 17 active production files, zero skipped items |
| `npm run build` | Passed; lazy Phaser chunk advisory remains |
| `npm run test:e2e` | 17 Chromium scenarios passed in 4.1 minutes against the production build, including both mobile race viewport assertions |
| `npm run lint` | Passed |
| `npx tsc --noEmit` | Passed |
| `npm run typecheck:rooms` | Passed |
| `git diff --check` | Passed |
| Renderer-retirement audit | No matches in the source/package paths recorded above |

The final E2E server log contains no `ERROR`, `SQLITE`, `Uncaught`, proxy, or failed-operation entries. Node's test-runner color-environment warning is separate from application errors.

Production screenshots retained with this audit:

- [Adventure desktop](reference/ocean-audit-2026-10-09/gameplay-desktop.png)
- [Adventure mobile](reference/ocean-audit-2026-10-09/gameplay-mobile.png)
- [Multiplayer mobile, 390×844](reference/ocean-audit-2026-10-09/race-mobile-390.png)
- [Multiplayer small mobile, 320×640](reference/ocean-audit-2026-10-09/race-mobile-320.png)

### Practical limits

- The live fleet scenario uses 100 local WebSocket connections, capacity overflow rejection, a shared deadline, standings, and search. It is not a test of 100 physical devices typing concurrently across the internet.
- New collections have an earned progression loop, skill unlocks at levels 2/3, repeat-catch counters, and persistent size/quality records. Longer-term retention and balance still require human play sessions; automated tests cannot establish that a game will be addictive.
- The lazy Phaser production chunk remains about 1.40 MB (365 kB gzip), above Vite's 500 kB advisory. No new runtime dependency was introduced. No public deployment was performed in this pass.

## 2026-10-09 Adventure entry after changing modes

- Reproduced the user's failed Set Sail action in the local production browser: Adventure could start from a fresh page, but returning from Practice to Adventure left the preparation screen open. `encounter:started` reached a destroyed Phaser scene and threw `Cannot read properties of undefined (reading 'sys')` in `setZoneBackground`.
- Phaser game destruction emits the scene's `destroy` event without requiring `shutdown`. The scene only cleaned up on `shutdown`, leaving its bridge listeners and hit-stop timer alive. Registered the existing cleanup for `destroy` as well; the fix is one production line.
- Removed the test fixture's synthetic `shutdown` event. Renderer tests now wait for real game destruction. The new lifecycle regression failed before the fix with the same texture error and a delayed attempt to resume the destroyed scene; it passes after the fix.
- Added production Playwright paths for Practice → Main menu → Adventure → Set Sail and Multiplayer → Main menu → Adventure → Set Sail. Both wait for the old canvas to be removed, verify a rendered replacement canvas, type three valid characters, and require an empty application-error list.
- Rechecked the original path manually at `localhost:8787`: Set Sail entered the arena, typing `ombak ` advanced reel progress to 20%, and navigation returned to the main menu.
- Final gates: `npm run test` passed 125 tests across 13 files; coverage remains 100% statements (2097/2097), branches (1519/1519), functions (457/457), and lines (1849/1849). `npm run test:e2e` rebuilt production and passed all 19 Chromium scenarios in 4.4 minutes. ESLint, web/room TypeScript checks, diff validation, and the renderer-retirement audit passed. Final test logs contain no unhandled errors. Vite's existing lazy Phaser chunk advisory remains (364.69 kB gzip).
- [Production screenshot after returning from Practice and starting Adventure](reference/ocean-audit-2026-10-09/adventure-after-practice.png).

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


## Full-passage catches and underwater stage repair, 2026-10-09

### Report and causes

The displayed Adventure passage remained unfinished after a catch because character, word, skill and boss bonuses independently filled the reel meter. The rules settled a catch after each event. The renderer also placed fish at 40% viewport height over a perspective coast whose horizon was around 46%, putting fish in the sky.

### Changes

- Reel progress now follows validated passage progress. Only passage-complete reaches 100%; the active HUD floors the percentage. No skill or boss bonus can skip visible text. Tests require every pre-final character to keep every roster encounter active.
- Cast Net steadies a small common fish at 45% typed, removing 18 tension and repairing 20 line for 35 energy. Reel Mastery removes 8 tension and repairs 5 line every fifth consecutive perfect word. Steel Line, Sonar, Calm Current and Perfect Bait retain their existing effects.
- Boss guard adds 35% idle pressure while intact; three perfect words break it and remove 6 tension. Final-pull milestones remove 8 tension. Labels and typed bridge events describe tension relief rather than nonexistent text progress.
- Generated a palette-matched pixel cutaway coast with the built-in image generation tool, exported to backgrounds/bg_shallow_coast_cutaway.webp. Runtime composition aligns the surface to 30% viewport height, the boat to the surface and fish below it. Existing main menu plates, icons and sprite families remain the visual reference.
- The line begins at the rendered rod tip. The underwater lure uses the existing hook icon. Foam is confined to surface impacts; underwater typing uses bubbles. Fish sizes and word pulses respect both width and height, including mobile. The background uses a centered crop preserving its 16:9 aspect ratio, rather than stretching islands and pixel shapes on phones.
- Removed per-word scene hit-stop and camera zoom. Catch/escape tweens and boss entrance own fish movement while running. New encounters reset alpha and cancel old fish tweens; delayed bite callbacks cannot overwrite terminal states.
- A completed encounter now waits through Pause before starting the next encounter. Restart clears any parked transition. Starting an encounter uses current React state, clears old skill feedback, preserves settings changed during the transition, and retains the catch log.

### Verification

Chromium browser tests include real Phaser catch/escape tweens, an underwater bounding check for all ten fish, native Adventure typing through the final character, skill effects and account rewards. Production Playwright exercises desktop, compact desktop, 390x844 and 320x640, all main-menu destinations, Practice, full Shallow Coast including Leviathan, 100 connected room participants, rematch, host transfer, Perfect Tide, Three Hulls and time mode. Final gate results are recorded below after the last run.

- Missing ambient/expedition/boss audio cannot throw during loop startup; browser tests remove and restore real audio cache entries to verify the fallback.

### Limits

Nine replacement fish still use their approved base poses with Phaser motion; Pebble Goby has distinct state strips. This change does not claim nine newly drawn animation sets. Visual responsiveness and verified gameplay do not establish long-term retention, mobile hardware performance or WAN load capacity.


### Final verification for passage/cutaway repair

- npm run test: 128 tests passed in 13 files.
- npm run test:coverage: statements 2100/2100, branches 1532/1532, functions 456/456, lines 1847/1847, all 100% across 17 active source files. No new source exclusions or lowered thresholds.
- npm run build: passed; the lazy Phaser chunk remains approximately 1.399 MB raw / 365 KB gzip and produces the existing Vite size advisory.
- npm run test:e2e: 19 tests passed in 4.6 minutes on the final stable production build. One earlier run had audio HTTP 500s because dist/web was rebuilt during its asset requests; the final run kept the build stable and recorded no errors in the gameplay smoke checks.
- npm run lint, npx tsc --noEmit and npm run typecheck:rooms: passed.
- Renderer-retirement audit: rg for pixi, PIXI, @pixi, Pixi, pixi-gameplay and data-pixi-host across package manifests, apps, packages, features, e2e, lib, AGENTS.md and .gitignore returned no matches.
- Manual localhost:8787 check: typed all but the final character, observed 97% reel, used Cast Net while the encounter stayed active, typed the last character and received a catch/reward. Paused at the result, observed the same completed passage, resumed into encounter 2 with a fresh cursor.
- Proofs: docs/reference/ocean-audit-2026-10-09/underwater-desktop.png, underwater-mobile.png, underwater-small-mobile.png and underwater-boss.png.
- No new runtime dependencies. Save/collection format is preserved. No deployment, PR or merge performed.

- Final visual follow-up: moved the tension percentage beside its label to keep it clear of Leviathan's tail. npm run test:e2e -- --grep 'renders a nonblank|completes the full' passed all five relevant scenarios in 2.3 minutes after this CSS-only change. Saved proof images were refreshed from that build.
