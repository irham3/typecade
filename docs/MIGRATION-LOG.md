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
## Interaction and multiplayer continuation audit, 2026-10-09

### Confirmed defects and fixes

| Defect reproduced before the fix | Cause | Fix and regression check |
| --- | --- | --- |
| Adventure starts the next encounter while Collection is open | The result timeout checks explicit Pause but not inactive controls | Park the transition behind any panel or inactive screen. Drain it once controls resume, unless explicit Pause is still active. Hook and real-browser tests complete a passage, hold Collection past the transition deadline, close it and type the next encounter. |
| A Practice character is accepted at the exact time limit | Input trusts the 100 ms display timer to end the session | Check the deadline before processing input. Both the interval and input use one finalization path and the configured duration for metrics. A controlled-clock browser test confirms no extra processKey call. |
| An eliminated leader appears above surviving captains, including as a time-mode winner | Progress sorting runs before elimination status | Place eliminated players below survivors before applying existing progress, finish-time and accuracy rules. Tests cover all four text formats; real two-client time rounds cover Perfect Tide and Three Hulls. |
| Rematch leaves live participants offline and disables Start race | createRacePlayer resets connected to false even for open sockets | Preserve connected for retained room members when resetting gameplay. The two-client browser test now starts and completes a second round, with the other captain winning. |
| A valid JSON null message throws in the room server and client | Parsing JSON does not establish an object envelope | Reject null, arrays and primitive envelopes before reading fields. The server ignores them; the client uses its existing reconnect path. Tests retain room state and exercise malformed JSON too. |
| Short landscape clips menu content after loading and entrance animation | The stacked menu exceeds the available height | Below 500 px height and at least 600 px width, use two columns with the original menu plates: logo/progress left, navigation right. Tests require Settings and Captain progress entirely in view. |
| Interior cards and selected skill copy do not match the menu chrome | Rounded CSS surfaces remain; selected card descriptions override the dark text color | Square interior frames and meters, use the shared gold form accent, and inherit readable text colors on selected skill plates. Keep existing pixel asset families. |

### Scope and data

The fixes reach the shared race ordering function, its Worker snapshot caller, the race screen, Practice input, the Ocean hook's active-controls caller, browser/package regressions, responsive CSS and production E2E flows. No runtime dependency, public API, content roster or save/collection schema changes. Existing collection rewards remain intact. Full-screen panels retain keyboard focus and return typing focus after closing.

### Verification scope

The automated suites cover all five main-menu destinations, prep routes/loadout, Practice text formats and challenges, HUD panels, Pause, skill hooks, account rewards, collection persistence, all ten Adventure encounters including Leviathan, a live 100-participant room, host transfer, ready/start/leave, full leaderboard/search, two-round rematch, Classic, Perfect Tide, Three Hulls and timed elimination combinations. Viewports include 1366x768, 1024x600, 390x844, 320x640 and 800x360.

A focused proof capture navigated the production preview through prep, Practice, Collection and multiplayer setup and recorded no page errors or asset responses with status 400 or above. Manual browser play also completed a passage, held Collection beyond its timeout, then closed it into encounter 2 with a fresh cursor and paused safely.

Proof images in docs/reference/ocean-audit-2026-10-09:
- audit-menu-landscape.png
- audit-prep-desktop.png
- audit-practice-desktop.png
- audit-collection-desktop.png
- audit-multiplayer-desktop.png

### Limits

The 100% source coverage gate measures the active Vite/workspace source, not historical retired Next/Overdrive features or every possible browser/device input. The 100-participant test uses a local Worker and is not a WAN capacity benchmark. No claim of measured retention or guaranteed absence of future bugs. The existing lazy Phaser size advisory remains; reduced-effects behavior and renderer fallbacks are covered, but physical mobile performance needs device testing.
### Gate results

- npm run test: 132 tests passed across 13 files.
- npm run test:coverage: 100% statements (2116/2116), branches (1559/1559), functions (457/457) and lines (1861/1861) across 17 active production files. No thresholds lowered or source files newly excluded.
- npm run test:e2e: all 23 Chromium production scenarios passed in 5.4 minutes, including the complete ten-encounter expedition and two playable multiplayer rounds. An earlier run exposed the landscape clipping; its regression now passes.
- npm run build, npm run lint, npx tsc --noEmit, npm run typecheck:rooms and git diff --check passed. The renderer-retirement audit returned no matches.
- The lazy Phaser chunk remains about 1.399 MB raw / 365 KB gzip and emits the existing Vite advisory. No new renderer dependency was introduced.
- Final CSS/copy follow-up: six relevant production scenarios passed after the selected-skill contrast and shared form-accent changes. The five UI proof images were refreshed from that build.


## Endless Adventure and living underwater fish, 2026-10-10

### User direction and scope

The user requested an arcade Adventure that continues after its boss, with leveling, skills and changing challenges. They also requested fish that visibly remain underwater and look alive. This revision supersedes the finite expedition ending in the earlier Milestone 1 design. It reuses the existing three zones, ten species, six skills, pixel asset family, typed bridge and local account save. No runtime dependency or backend was added.

### Arcade loop

- One voyage contains nine regular catches followed by Leviathan. A successful boss wraps to the next voyage, restores one spare line up to three, secures the zone checkpoint and opens a paused harbor refit.
- Continue voyage keeps the expedition seed, account, collection and selected skills. The player can equip one to three unlocked skills and choose the next route. Double-clicking Continue cannot start two encounters.
- A failed boss uses the same spare-line retry rule as other fish. Game over occurs only when an encounter is lost with no spare line remaining. Earned account rewards remain banked.
- The first three encounters are an unmodified tutorial. Subsequent conditions use a deterministic offset per voyage. Regular fish are shuffled within their own zone from voyage two; Leviathan remains last.
- Later passages combine the fish's vocabulary profile with seeded Indonesian content. Treasure Shoal adds another passage. Every visible character is required; neither skills nor boss phase effects skip text.

| Condition | Rule | Counterplay |
| --- | --- | --- |
| Calm Water | Standard encounter | Keep a steady rhythm; correct the highlighted typo. |
| Rough Current | 45% more idle pressure, 25% more rewards | Perfect words and Calm Current reduce pressure. |
| Fragile Line | 50% more typo damage, 25% more rewards | Steel Line shields the first typo; Reel Mastery repairs the line. |
| Quick Bite | 20% less time, 25% more rewards | Stay accurate and finish the complete passage. |
| Treasure Shoal | Extra passage, 70% more time, 50% more rewards | Longer clean combos build energy and trigger passive skills. |

For depth d = min(voyage - 1, 12): base difficulty is multiplied by 1 + 0.025d; idle pressure by 1 + 0.04d; time by 1 - 0.015d; rewards by 1 + 0.12d. Condition multipliers apply separately. Voyage two onward also gets 40% more base time for the extra content. Bosses retain authored guard/final-pull phases with the Calm Water condition. The cap prevents a mathematically impossible escalation while later seeds continue to vary fish/condition/passages.

### Saves and state boundaries

- Saves without voyage migrate to voyage one. The old completed boss position migrates to the start of voyage two without removing collection records or currency. Invalid voyage values are rejected.
- Restored progress opens a paused refit for its saved zone. Missing route IDs fall back to that zone's first route. Starting again after game over returns to a valid coast loadout.
- Each encounter seed contains the global encounter index across voyages, so later catches of the same species receive distinct idempotency keys. Checkpoints clear secured pending results and retain only the last three checkpoint summaries; the account grant ledger remains intact.
- Returning to the menu and reopening Adventure resumes the paused encounter in the current session. Phaser retains the current fish while hiding it outside gameplay, then restores its visibility on return.

### Underwater animation and layout

- Nine existing pose sprites now have an articulated tail: the final 30% of the same frame is rendered around a tail joint with a 2% overlap. Body and tail share frame, scale, underwater tint, alpha and catch/escape movement. Pebble Goby keeps its authored sprite strips.
- Gentle body pulses and behavior-specific horizontal drift make idle fish move before typing. Tail flick speeds up in struggle. Pause freezes body and tail; Reduced Effects removes idle deformation and tail flick.
- Encounter startup lays out the fish immediately below the 30% water surface. Tests check body bounds and transformed tail corners for every species at 1366×768, 390×844 and 320×640.
- Condition instructions use shorter copy and normal letter spacing. The production regression exposed skills below the 320×640 viewport: mobile typing-panel gaps and input margin are now smaller, the passage has a scrolling 64px height cap, and keyboard shortcut badges are hidden on mobile to remove their extra skill-button row. Skill names, charge/passive status, icons and touch targets remain visible. Mobile boss callouts use a narrow left card and short phase rules, leaving space for the fish on the right. Existing menu plates and pixel icons remain unchanged.

### Verification record

- `npm run test`: 138 tests passed across 13 files.
- `npm run test:coverage`: 100% statements (2191/2191), branches (1642/1642), functions (462/462) and lines (1925/1925) across 17 active production files. No coverage threshold or source exclusion changed.
- Rules tests simulate 100 voyages / 1,000 distinct catches. A 45 WPM simulation covers ten seeds, every fish and voyages 1, 2, 13 and 1,000, applying actual ticks, typing and defensive skills. Difficulty caps at voyage 13; final characters remain mandatory.
- Phaser browser tests inspect all ten species at desktop, mobile and small-mobile sizes, including transformed tail bounds, idle movement, pause, reduced effects and visibility after returning from the menu.
- `npm run test:e2e`: all 23 Chromium production scenarios passed in 7.4 minutes. The final scenario plays twenty catches, refits after both bosses, changes skill/route, reloads the saved third voyage and resumes after visiting the main menu. Navigation, Practice, multiplayer variants and a live 100-participant room also passed.
- `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:rooms` and `git diff --check` passed. The recorded renderer-retirement search returned no matches.
- The earlier production runs exposed small-mobile skill buttons below the viewport. The final run verifies the compact typing panel and skill rows on 320×640, including Leviathan. The twenty-catch E2E scenario has a five-minute budget; assertions and gameplay rules were not relaxed.
- Stable build: CSS 55.19 KB / 12.34 KB gzip, shell JS 355.75 KB / 115.00 KB gzip, lazy Phaser chunk 1,399.99 KB / 365.16 KB gzip. The existing large-chunk advisory remains.

Proofs in `docs/reference/ocean-audit-2026-10-10`, captured from the final passing production build:

- `underwater-gameplay-small-mobile.png`
- `underwater-boss-desktop.png`
- `underwater-boss-small-mobile.png`
- `harbor-voyage-2.png`
- `harbor-voyage-3.png`
- `voyage-3-resumed.png`

Desktop and small-mobile boss screenshots were inspected directly: fish remain below the surface, the phase card stays left of the fish and the typing/skill controls remain on screen. The user's existing local account was preserved through the preview reload and left on the main menu.

### Practical limits

The generated variation uses a finite roster and content pack. It does not create new species or vocabulary forever. Source coverage establishes exercised code paths, not measured retention or every physical device. The local reward ledger grows with successful catches; browser storage capacity still limits very long-lived local accounts. WAN capacity and physical mobile frame rates were not benchmarked. The existing lazy Phaser bundle size advisory remains.

## Hull waterline and original Practice behavior, 2026-10-10

### Reference and scope

The user requested Adventure as the primary menu destination, Practice in third position, a boat that sits on the water and is larger than ordinary fish, living animation for every species, and Practice typing behavior matching the original app. This repository has no `main` ref. The comparison used the fetched remote default `origin/master`, commit `120ff8a81be06d272b5b8a034b6f30db073804dd`, including both original typing views, their hooks and typing core.

Changes reach the menu, the shared typing passage/input, the Practice screen and keyboard, an exported headless Practice session, Phaser boat/fish rendering, responsive CSS, package tests, browser regressions and production E2E fixtures. The existing strict Adventure and multiplayer typing sessions remain in use. No dependency, account grant rule, content roster or save schema changed.

### Fixes

| Finding | Change | Check |
| --- | --- | --- |
| Boat origin followed the foam beneath the hull, leaving a visible air gap | Anchor the hull at 68% of its padded frame, increase responsive scale, constrain bob/tilt and add a surface wake. Rod position follows the boat. | Transformed hull contact stays within 2 px of the waterline at desktop and both mobile sizes; regular fish stay smaller than the boat. |
| Fish lacked eye and gill detail | Add brief pixel blinks and gill movement at measured landmarks for all ten species, alongside existing body/tail motion. | Details follow the sprite; each species animates, Pause freezes it, Reduced Effects removes motion, and menu transitions restore visibility. |
| Practice reused strict race input and a scrollable passage | Add a headless editable Practice session and clipped rolling rows: Modern three rows with the active character on the middle row; Classic two rows with the current word on the top row. | Package tests cover typo/edit/word locks; browser and E2E tests check row height, cursor bounds, upward translation and zero scroll offset. |
| Practice required setup before every first session | Open ready to type, with settings available through a pixel button. Keep Adventure first, Multiplayer second and Practice third. | All menu destinations and Set Sail after returning from Practice/Multiplayer are exercised. |
| Legacy typing shortcuts and timing differed | Restore typo advancement, smart Backspace, word deletion, correct-word locks, Classic Space confirmation including the last word, Tab/Esc restart and Shift+Enter shuffle. Timed sessions append seeded words and pause on lost input focus. | Tests cover wrong input, IME/input changes, keyboard shortcuts, exact deadlines, focus pause and text extension. |
| Shift corrupted the touch Backspace command | Capitalize only single-character keys; Backspace keeps its command and does not consume Shift. | Pixel keyboard tests cover shifted deletion, letters, layout switches, symbols and pointer focus retention. |
| Classic overflow could jump past the following word | Resolve Space from the locked word boundary, retain overflow errors in metrics and cap the visible cursor at that word. | Package and production browser regressions type `waveXX `, require the next word to remain `reef`, and keep accuracy below 100%. |
| Small-mobile Practice and skill feedback hid game content | Put Practice controls in one responsive row, constrain grid width and shorten the touch deletion label; compact short-screen spacing. Place mobile skill feedback in a half-width card on the right. | Require the whole passage, menu button and keyboard inside the viewport. Require mobile skill feedback to stay on the right half. |

Practice retains language, word count, duration, quotes/difficulty, custom text/shuffle, punctuation, numbers, challenges, text size and monospace controls. Input is validated before text generation. The original Modern/Classic typing behavior is restored within the Ocean shell; historical authentication, result services and global theme screens are not copied. Custom passages finish correctly. Config and appearance remain session settings, as the form states; the best WPM remains locally persisted.

### Verification and proof

- `npm run test:e2e`: all 25 Chromium production scenarios passed in 8.0 minutes after responsive layout fixes. Coverage includes every menu destination, multiplayer variants and a live 100-participant room, gameplay HUD at four sizes, two complete voyages, refits and saved voyage-three resume.
- Final headless follow-up: `npm run test:e2e -- --grep 'Practice (modern|classic)'` rebuilt production and passed both Practice regressions in 18.3 seconds, including Classic overflow. No Adventure, multiplayer or renderer production source changed after the full run.
- Final build: CSS 57.00 KB / 12.69 KB gzip, shell JS 362.51 KB / 117.07 KB gzip, lazy Phaser 1,401.60 KB / 365.68 KB gzip. The existing large-chunk advisory remains.
- `npm run test`: 148 tests passed across 14 files.
- `npm run test:coverage`: 100% statements (2381/2381), branches (1841/1841), functions (491/491) and lines (2058/2058) across 19 active production source files. Thresholds and source exclusions were not changed. Tail-struggle checks now drive the event and update explicitly rather than relying on an incidental animation frame.
- `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:rooms` and `git diff --check` passed. The recorded renderer-retirement search returned no matches.

Proof images in `docs/reference/ocean-audit-2026-10-10`:

- `boat-waterline-desktop.png`
- `boat-waterline-small-mobile.png`
- `boat-waterline-boss-desktop.png`
- `boat-waterline-boss-small-mobile.png`
- `practice-modern-rolling.png`
- `practice-classic-rolling.png`

Desktop and 320x640 screenshots were inspected directly. The boat hull meets the visible surface; mobile Sonar feedback leaves the boat visible. Practice screenshots show fixed rolling rows, no scrollbar and no keyboard-label overflow. A manual check in the user's preview also opened both Practice styles at 320x640 and exercised typo correction. The account was preserved, the temporary viewport override was removed, and the preview was left on the main menu.

### Limits

The fish use the existing pose assets with runtime articulation and detail; they are not ten newly drawn animation sets. Source coverage does not measure player retention or guarantee every physical keyboard/browser combination. Mobile frame rates and WAN room capacity still need hardware/network measurement. The lazy Phaser bundle retains its existing size advisory. No deployment, PR or merge is included.

## Adventure typing surface, skill clarity and gameplay references, 2026-10-10

### Scope and references

The user requested a complete usability pass: remove the redundant Adventure input box, explain skill activation, improve stiff feedback and layout, and research lessons from other games. Changes reach Adventure HUD/CSS, the existing shared passage and pixel keyboard callers, the Ocean run hook, headless skill eligibility, content descriptions, responsive Phaser fish placement and their package/browser/E2E checks. Account rewards, content roster, save schema and the multiplayer transport remain unchanged.

Research and concrete adaptations are recorded in [GAMEPLAY-UX-REFERENCES.md](GAMEPLAY-UX-REFERENCES.md). Sources include ZType's developer notes, the official Monkeytype repository, Stardew Valley's fishing wiki, Supergiant's Hades pages and Team17's DREDGE page. No game assets, source code or additional runtime dependency were copied. DREDGE-inspired voyage objectives remain proposals.

### Findings and fixes

| Finding | Change | Verification |
| --- | --- | --- |
| Adventure showed a passage and a second visible text input | Keep the native input for focus/IME/accessibility; visually hide it and make the passage panel focus it on click | Browser test and production E2E require focus restoration and an input box at most 1×1 px |
| Passage could require internal scrolling | Reuse the existing two-row rolling passage | Production E2E requires clipped overflow, upward translation when typing enters the next row, and zero scroll offset |
| Timer and idle pressure started before the player could read | Start them after the first keystroke; exclude initial waiting from typing metrics | Browser and production tests wait before typing and require unchanged time/tension |
| Native mobile typing could consume the game view | Reuse the Practice pixel keyboard with a compact phone HUD; omit Adventure Backspace because the strict engine ignores deletion | Component test and production mobile keyboard click test |
| A skill could show 100% while another gate blocked activation | Share `getFishingSkillBlockReason` between UI eligibility and the existing headless boolean gate | Tests cover energy, encounter status, fish rarity/size, reel threshold and running Calm Current |
| Passive skills were disabled buttons | Render automatic cards with the same blue plate/icon family | Browser/E2E require automatic cards and no passive buttons |
| Skill energy and controls were unclear | Show Energy N/100, clean-word +14, skill costs, gating reasons and desktop Alt+slot; keep full explanations in Skills/preparation | Browser tests and gameplay screenshots |
| Calm Current could be spent again while already running | Block reactivation for the remaining eight-second effect | Rule test requires no energy deduction and allows use after expiry |
| Sonar lost combat usefulness once the route locked | Add five tension relief, clamped at zero, while preserving the twelve-second preview | Rule tests and browser expiry check, including expiry before the first keystroke |
| Skill feedback stayed enlarged and used too much text | Use a finite 350 ms CSS pulse and the first, concise effect sentence | Production screenshots; full descriptions stay in skill panels |
| Mobile typing panel could cover swimming fish | Clamp fish scale and motion within the responsive underwater band | All ten fish are checked at desktop, 390×844 and 320×640, with eye/gill animation, Pause and Reduced Effects |
| Mobile boss phase card hid the boat | Show phase/guard instructions in the passage hint on phones | Production boss screenshot and inline phase assertion |
| Desktop shortcut text inherited an 18 px badge width | Reset width/height for the current pixel cards | Production E2E requires the visible shortcut to fit without clipping |
| Custom Reduced Effects did not govern HUD CSS animation | Add a HUD data attribute and disable CSS animations/transitions in that mode | Browser test checks the active setting; renderer controls are retained |

### Data and practical limits

The user's preview account was preserved. Browser gameplay checks use disposable test contexts. The renderer still uses the existing fish pose assets with articulation; this pass adds no new sprite collection. Source coverage does not establish player retention, physical touch-keyboard accuracy, every browser engine or real WAN room capacity. The lazy Phaser bundle still has its existing size advisory.

### Verification and delivery

- `npm run test`: 150 tests passed across 14 files on the final source.
- Final `npm run test:coverage`: statements 2408/2408, branches 1871/1871, functions 494/494, lines 2078/2078: 100% across all 19 active production source files. Coverage configuration, thresholds and exclusions were unchanged.
- `npm run test:e2e`: all 27 Chromium production scenarios passed in 8.3 minutes. This included menu destinations, Practice rolling/configuration, multiplayer variants, a live 100-player room, HUD sizes, two voyages, refits and saved voyage-three resume.
- After final feedback/card arrangement and inline phone boss phase changes, `npm run test:e2e -- --grep 'one typing surface|nonblank Phaser|two endless voyages'` rebuilt production and passed all seven affected scenarios in 5.2 minutes.
- Final shortcut-width and custom Reduced Effects follow-up: `npm run test:e2e -- --grep 'one typing surface'` rebuilt production and passed both desktop/mobile regressions in 30.6 seconds. No subsequent production source edits were made.
- `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:rooms`, `git diff --check` and the recorded renderer-retirement audit passed. The retirement search returned no matches.
- Final bundle: CSS 59.66 KB / 13.10 KB gzip; shell JS 363.90 KB / 117.58 KB gzip; lazy Phaser 1,401.67 KB / 365.71 KB gzip. The existing large-chunk advisory remains.

Screenshots inspected directly and saved in `docs/reference/ocean-audit-2026-10-10`:

- `adventure-ready-small-mobile.png`: pre-typing state, all phone controls visible, timer ready and no second input box.
- `adventure-typing-skills-desktop.png`: typing remains incomplete after Cast Net, readable shortcuts, aligned cards and concise feedback.
- `adventure-typing-skills-small-mobile.png`: rolling passage, pixel keyboard, skill feedback above the fish and all skill controls on screen.
- `adventure-skills-boss-small-mobile.png`: boss below the waterline, visible boat and inline phase instructions.

The preview was reloaded on the main menu. Its existing Captain level 3, 5/10 discovered species and XP progress remained intact after save restoration. Research was pushed first; gameplay and audit evidence follow as separate commits on `app-v2`. No PR, merge or deployment is included.

## Three.js renderer migration, 2026-10-10

### Authorization and scope

The user approved replacing Phaser after reviewing the proposed pixel 2.5D ocean direction. This overrides the former renderer requirement in AGENTS.md and section 10 of the product design; both are updated. The migration replaces the Adventure renderer. React menus/HUD, headless typing and fishing packages, progression, saves and the room protocol retain their existing implementation. Practice and Multiplayer retain their DOM presentation and release the Adventure canvas when entered.

### Runtime changes

- Three.js 0.186.1 replaces Phaser; matching 0.186 typings are a development dependency. The old runtime dependency and factory tests tied to Phaser configuration are removed. The replacement browser tests use a real WebGL renderer.
- Orthographic camera in CSS-pixel world coordinates, half-resolution drawing buffer, nearest atlas sampling, no mipmaps and pixelated canvas scaling. The current pixel sprites and coast art are reused. This pass does not generate new models, sprite sheets or paid assets.
- Atlas meshes share one texture and select frames by UV coordinates. Nine catalog fish have separate body/tail articulation and measured eye/gill details. Pebble Goby keeps its seven authored state strips. Fish turn slightly in depth; pause freezes the scene, and Reduced Effects removes drift, turns, blink, tail motion and boat tilt.
- A lit water ribbon and the boat's hull contact point share the same two-harmonic surface function. A translucent material in front of the fish adds depth color and quantized light. The scene is an artistic cutaway; it does not simulate physical reflections, refraction or boat buoyancy.
- The existing underwater background stays behind live fish. Active fish and their details stay inside the responsive water band: below 30% viewport height, above 38% on phones or 46% on desktop. Tests cover every species at desktop, 390x844 and 320x640, including early and full reel positions.
- Fishing line begins at the transformed rod tip, follows the fish mouth and changes color for tension or durability danger. Character, word, typo, all six skills, boss phases, guard break, final pull, catch, escape and level-up events drive visual/audio feedback.
- Effects use a fixed pool of 128 instanced pixel particles and six rings; no object creation per burst. Catch/escape interpolation and brief catch hit stop use the renderer clock and freeze when gameplay is paused.
- Native audio uses three bounded loops and at most eight effect voices. It unlocks after a user gesture, respects the four volume categories, pauses when gameplay or the tab is inactive, and releases its sources on teardown. Autoplay rejection is handled.
- Typed domain events remain the only React-to-renderer interface. Asset requests settle before error cleanup so late images cannot retain GPU resources. Teardown disconnects observers/listeners, stops the animation loop/audio, disposes geometry/materials/textures/instance buffers, releases the context and removes the canvas.
- The first frame is rendered before readiness resolves. Adventure is gated during loading and failure; its HUD is inert and the voyage clock does not advance. Failure offers Retry and Main Menu without resetting the saved voyage. Context loss follows the same recovery path. Late readiness/failure after leaving the renderer is ignored.
- Static menus and paused scenes render on demand rather than redrawing the same frame continuously. Hidden documents do not advance or render the scene.

### Verification on the final production source

- `npm run test`: 153 tests across 16 files passed. The new cases include real shader rendering, state replay before asset load, all ten underwater species, wave/hull contact, blink, pause, reduced effects, event VFX, bounded audio/effects, asset failures, late loads and cleanup.
- `npm run test:coverage`: 100% statements (2,363/2,363), branches (1,693/1,693), functions (504/504) and lines (1,886/1,886) across all 22 active production source files. Coverage includes and thresholds are unchanged.
- `npm run test:e2e`: rebuilt production and passed all 27 Chromium scenarios in 3.9 minutes. Includes a live 100-player room, host transfer, rematch, elimination/time variants, all menu destinations, Practice configuration and rolling rows, return-to-Adventure navigation, every HUD panel, renderer nonblank/overlap checks at four sizes, and two complete voyages with boss/refit/save/resume into voyage three.
- `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:rooms` and `git diff --check` passed.
- Renderer-retirement audit returned no matches for the original retired renderer:

  `rg -n 'pixi|PIXI|@pixi|Pixi|pixi-gameplay|data-pixi-host' package.json package-lock.json apps packages features e2e lib AGENTS.md .gitignore`

- The Phaser runtime retirement audit also returned no matches:

  `rg -n '"phaser"|from.+phaser|phaser-gameplay|Phaser\.' package.json package-lock.json apps/web/src packages e2e`

- Final build: shell JS 364.61 KB / 117.78 KB gzip; lazy renderer 557.38 KB / 140.46 KB gzip; CSS 59.84 KB / 13.15 KB gzip. Previous lazy Phaser chunk was 1,401.67 KB / 365.71 KB gzip. This is a measured bundle reduction, not a device FPS benchmark. Vite's existing 500 KB chunk advisory still applies to the renderer.
- The local preview loaded with renderer state `ready` and no captured console errors. Existing Captain level 3, 5/10 species and 53 XP to the next level remained present. The earlier in-app tab entered a network error page during reload; a fresh tab on the same localhost origin loaded successfully and was retained as the preview.

### Visual evidence and limitations

Inspected final Playwright screenshots are saved under `docs/reference/three-ocean-2026-10-10`: `adventure-desktop.png`, `adventure-small-mobile.png` and `boss-small-mobile.png`.

No physical phone GPU, Safari/Firefox, real WAN capacity or sustained device FPS benchmark is claimed. Context-loss testing dispatches the browser lifecycle event and verifies failure/retry handling; a hardware GPU reset is not part of this suite. No Canvas fallback is supplied when WebGL is unavailable.

`npm audit` reports 12 repository dependency findings (11 high, one critical), with the same count before and after adding Three.js. Reported packages are the existing Next/ESLint and Wrangler/Miniflare dependency trees, including proxy-addr, sharp, undici, braces, fast-glob, micromatch and source-map-js. Three.js is not named in the report. These findings remain a separate release risk; passing game tests is not a security audit clearance.

Runtime and architecture changes were pushed as `675fd66` on `app-v2`; this evidence follows in a documentation commit. No PR, merge or deployment is included.

## 2026-10-10 — Release audit follow-up: dependencies

The user requested resolution of the findings above. A fresh npm audit reproduced 12 findings. The normal, non-force `npm audit fix` updated Next to 16.4.0, Wrangler to 4.149.0, undici to 7.29.1, proxy-addr to 2.0.8 and source-map-js to 1.2.2, and removed Miniflare's vulnerable sharp dependency. The running local preview held Miniflare files open on Windows; only the identified preview processes were stopped for the install, then restarted on port 8787 with the same persistence directory.

Five inherited findings remained in eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched braces release as of this audit. The active project uses Vite, so its ESLint configuration now declares the existing React, TypeScript, React Hooks, import and JSX accessibility plugins directly. Their existing rule settings and historical Hooks exceptions remain. Next-specific lint rules and three obsolete inline suppression comments were removed; historical Next source remains available.

`npm install` now audits 750 packages with **zero vulnerabilities**, confirmed by a separate `npm audit`. This resolves the reported package findings; it is not a penetration test or a guarantee against undiscovered vulnerabilities. Lint, both TypeScript checks, build, 154 unit/browser tests and the unchanged 100% coverage thresholds pass on the working tree. Gameplay changes and the expanded browser matrix are verified in the following entry.

## 2026-10-10 — Release audit follow-up: animation, layout and browser coverage

### Findings and fixes

| Finding | Change | Verification |
| --- | --- | --- |
| Fish animations used the session clock, so a bite could begin mid-strip and caught/escape strips could loop. | Each state starts its own clock. Authored playback rates are restored; bite/caught/escape hold their last frame. High tension sustains struggle. Late hook/typo events cannot replace a terminal state. | Real WebGL browser tests assert frame zero, swim/danger loops, terminal frames and late-event handling. |
| The old landscape overlap check passed after the HUD scrolled its header offscreen; typing covered the fish. | Landscape uses three columns: ocean/route/navigation, typing, and skills. The pixel keyboard occupies the lower right. Fish framing reserves the left 32% of the viewport, underwater. The console's GSAP transform is disabled at this breakpoint so it cannot become the keyboard's positioning ancestor. | Screenshot inspection plus full-viewport and overlap assertions at 800×360; all species are checked in the landscape water band. Pure layout tests also include 667×375. |
| The lazy renderer exceeded Vite's 500 KB advisory. | Three's existing core module is cached in a separate lazy chunk. Renderer/gameplay remains lazy. The warning limit stays unchanged. | Build has no chunk-size advisory: core 186.59 KB / 50.12 KB gzip, renderer/gameplay 372.78 KB / 91.84 KB gzip, shell 364.78 KB / 117.90 KB gzip, CSS 62.54 KB / 13.53 KB gzip. Splitting adds a request and does not reduce total renderer bytes. |
| Renderer recovery had only a synthetic context-loss event test. | Added a production E2E case using the browser's `WEBGL_lose_context` extension. | Chromium, Firefox and WebKit all stop the timer, make the HUD inert, rebuild one canvas on Retry, retain the typed prefix and accept the next character. This simulates context loss; it is not a physical driver reset. |
| CI ran browser-backed unit tests without installing their browser, and omitted coverage/E2E gates. | The existing CI job installs all three Playwright engines and checks audit, lint, both TypeScript projects, unit tests, 100% coverage, build and E2E. The duplicate build:worker step is removed. Timeout is 30 minutes. Existing branch/PR triggers remain. | Workflow YAML is parsed locally; the configured commands pass locally. No GitHub-hosted CI run is claimed for this branch. |

### Browser matrix and fixture correction

Playwright now defines Chromium, Firefox and WebKit projects. Each has 29 scenarios, including all menu destinations, both Practice text styles/configuration, Adventure skills/panels/pause, all multiplayer variants, 100-participant standings, two complete voyages/refits/save/resume, five gameplay viewport sizes and WebGL recovery.

The first full matrix ran 84 scenarios in 14.7 minutes: 83 passed and the WebKit 100-participant fixture failed. That fixture opened 99 sockets from one page. Opening them in batches still stalled in WebKit. It now uses Node's existing platform WebSocket API for the 99 simulated peers, while the browser owns its captain's connection and exercises the UI. Connections authenticate against the same real local Worker, all 100 participants must be ready, participant 101 must be rejected, and the browser checks the winner, 100 leaderboard rows and captain search. Peer sockets are cleaned in `finally`, including failure during connection setup. No participant count or assertions were reduced, and no new socket dependency was added.

Final targeted command: `npm run test:e2e -- --grep '100-player|context loss'` rebuilt the same production source and passed all six cases across all three engines in 1.7 minutes. Together with the 81 unaffected full-matrix cases, all **87 distinct current scenarios have successful verification**. The full matrix was not repeated after this test-fixture-only change. The default E2E command now collects all 87 cases.

### Final gates and evidence

- `npm run test`: 154/154 tests, 16 files.
- `npm run test:coverage`: statements 2,376/2,376, branches 1,710/1,710, functions 505/505, lines 1,895/1,895 — all 100% across 22 active production source files. Coverage includes and thresholds remain unchanged.
- `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:rooms`, `npm run build`, `npm audit` and `git diff --check`: passed; audit reports zero findings.
- Both renderer-retirement searches recorded above returned no matches. Headless package sources have no React, Phaser, Three.js imports or `Math.random()` calls.
- Evidence directory: `docs/reference/three-ocean-release-check-2026-10-10`, containing the inspected landscape screenshot, final dependency audit and coverage totals.
- The localhost preview was restarted with existing storage. Captain level 3, five discovered species and 53 XP to the next level remain present. Tests use disposable browser contexts.
- Dependency fixes were committed and pushed as `741e95c` on `app-v2`. Runtime/layout/tests and this evidence follow on the same branch. No PR, merge or deployment is included.

Physical phone GPUs, native Safari on macOS/iOS, sustained FPS/battery behavior, real WAN room capacity and player retention have not been measured. Browser-engine checks on this Windows machine do not establish those results. Existing fish artwork is reused with corrected runtime motion; this pass does not generate replacement sprite collections.
