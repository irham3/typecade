# Dungeon redesign — ordered delivery checklist

Revision: 2026-10-16. Branch: `refactor/roughlike-survival-2.5d`. Current authorized phase: verified implementation, after planning checkpoint 6950503 was pushed to GitHub. Evidence is recorded in `MIGRATION-LOG.md` and `verification/dungeon-2026-10-16`.

## P0 — Planning reset, this change

- [x] Preserve supplied GDD verbatim and four reference images outside public assets.
- [x] Replace governing fishing rules, PRD, interaction spec, art bible and decisions.
- [x] Remove old Ocean/Overdrive plans and reference packs; preserve Git history and mark migration log historical.
- [x] Inventory every remaining runtime asset and its callers; record cutover deletion dependencies.
- [x] Map all requested modes, lifecycle, data, tests and performance gates.
- [x] Run and record planning validation and production build; legacy unit/browser/static checks also passed (see migration log).

## M0 — Contract and content baseline

- [x] Pin a tested balance table: HP, grace, dash, mana/cooldowns, spawn/speed curve, loot and upgrade weights.
- [x] Reuse typing/RNG helpers; define survival entities, input phases, typed events and snapshot validation.
- [x] Create EN/ID enemy words, boss passages, skill keywords and upgrade data with distinct draft keywords.
- [x] Add seeded replay/domain tests and invalid-input cases; verify no framework/DOM/Three imports.
- [x] Establish server contracts for each multiplayer mode before its implementation gate.

Touches: `packages/contracts`, `packages/content`, `packages/typing-engine`, `packages/game-rules`; new package only if existing boundaries genuinely require it. Update affected imports/exports, Vite/Vitest/TypeScript aliases only if package layout changes. Replace content/fishing fixtures alongside their callers.

## M1 — Playable Endless domain

- [x] Ready → arena → pause → death → results → restart, with no fixed final stage.
- [x] Seeded 360-degree spawn, chase/contact, damage grace, one-time drops, bounded entity admission.
- [x] Stable 4–6 target queue; case-sensitive lock, prefix, typo, cancel, target lifetime and dash.
- [x] Distinct shield/elite/bomber/mage/barrel/chest rules and safe chained area damage.
- [x] XP attraction, 50-character streak magnet, overflow levels, frozen typed drafts and eligible upgrade exhaustion fallback.
- [x] Tab skills preserve prefix; word cooldowns/mana/evolutions and all requested relic families.
- [x] Five-minute boss schedule, armor break, ten-second paragraph/ultimate, armor rebuild, biome/relic and continued survival.
- [x] Simulate multiple typing speeds and long-run caps; test death/draft/boss transition precedence.

Touches: domain packages and unit tests. Gate: deterministic rules pass before visual feedback can claim gameplay effects.

## M2 — Dungeon renderer and complete shell

- [x] Replace `FishingScene`, `CoastalModels`, `createFishingGame`, `ocean-motion` and their tests/callers together.
- [x] Recycled floor/walls, blue knight, articulated enemies, minotaur, torches, pools for loot/projectiles/effects.
- [x] Dash/slash, gait, recoil, shield break, death, casting, stagger and camera follow reflect domain events.
- [x] Replace `useOceanRun`, active Ocean contracts/content and fishing passages with survival integration.
- [x] Redesign `App.tsx`, `styles.css`, `PixelArt.tsx`, title/mode selection, settings, account and results.
- [x] React label projection/collision handling; no bottom arena paragraph; skill, draft and boss states readable.
- [x] Scope key capture, keep accessible input/IME fallback, prevent double events, honor browser focus and shortcuts.
- [x] Add new isolated persistence/checkpoint integration; do not reinterpret Ocean saves/account tables.
- [x] Remove incompatible public boat/audio only when their final callers and tests retire; keep licensed font.
- [x] Replace Ocean/sunset browser scenarios with actual survival equivalents; retain shared engine and safety coverage.

Gate: scoped browser tests cover start/kill/cast/draft/death/restart and boss fixtures; production E2E covers keyboard play, context recovery, desktop, 320px portrait, landscape and tablet. Final screenshots/matrix remain in the M7 consolidation gate.

## M3 — Typing Dojo

- [x] Reuse `PracticeScreen`, `PracticeKeyboard`, `TypingField` and `PracticeSession` where appropriate.
- [x] Dungeon training room, dummy/Sensei, lessons and objective progress; no damage or rewards exploit.
- [x] Preserve word/sentence/custom content, EN/ID, editable input, settings and touch fallback.
- [x] Browser regression for focus, symbols/case, IME and rolling text.

## M4 — Castle Sprint

- [x] Reuse `RaceScreen`, `packages/race-rules`, Worker/Durable Object room infrastructure.
- [x] Replace rowboats and sea lanes with knights/castle course; define course, laps and obstacle words.
- [x] Authoritative starts/progress/finish/rematch and WPM; reconnect/host-transfer/disconnect handling.
- [x] Four independent real clients complete a race; invalid/replayed/too-fast events rejected.
- [x] Keep actual tested participant limits explicit; do not infer WAN capacity from previous 100-peer tests.

## M5 — Bridge Clash / Arena Royale

- [x] Specify target selection, attack/block timing, shields, score, elimination and tie rules as tested server data.
- [x] Implement room mode/state, input validation and authoritative combat; reuse existing WS transport.
- [x] Bridge renderer/HUD shares actors/resources, with clear rival identities.
- [x] Test 1v1 and four-player combat, simultaneous actions, reconnect and cheating/replay rejection.

## M6 — Co-op Raid

- [x] Implement initial two DPS/healer/tank composition and explicit scaling for additional participants.
- [x] Five boss layers, role words, aggro, party healing, downed states and three shared revives.
- [x] Authoritative team WPM, wipe/victory, leave/rejoin and reward resolution.
- [x] Four real clients complete a raid and record a deadline loss with genuine role effects; authoritative Worker/domain tests additionally verify down/revive/wipe accounting.

## M7 — Retirement and release evidence

- [x] Remove remaining fishing-only hooks, renderer, content, glyphs, tests, public assets and obsolete names.
- [x] Rename old deployment/config identifiers only with caller/environment inventory; no accidental production deployment.
- [x] Complete separately validated dungeon cloud saves, achievements and leaderboard after the persistence contract; preserve old data and test ownership/RLS, conflict handling and verified-result boundaries.
- [x] Run `npm run test`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`, lint and both TypeScript checks.
- [x] Run retirement/headless audits; verify all public asset references resolve and have licensing/provenance.
- [x] Profile 900 active seconds across multiple survival attempts, plus synthetic capped horde/boss and Reduced Effects; verify pause/visibility/context recovery. This is not one uninterrupted 15-minute survival.
- [x] Measure repeated navigation: stable heap after warmup, bounded geometries/textures, released audio/listeners.
- [x] Review all screens and real keyboard play against UX scenarios; save current evidence and limitations.
- [x] Confirm no unrelated account data loss, no secret leakage and no fake live players.

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

## M8 — Visual and combat-feedback revision, 2026-10-16

The user's visual review found that the initial M2 presentation was stiff and did not match the supplied art direction. The earlier functional checks did not establish visual quality.

- [x] Rework chunky character silhouettes, beveled forms, visor/armor/weapon detail and separate arm articulation across shared actors.
- [x] Present eased dash travel, charge-facing, alternating swings, per-kind gait, hit flash/recoil and bounded death poses without changing gameplay destinations or input timing.
- [x] Give CLEAVE, STORM, HEAL, dash, armor hits, pickup and death distinct layered effects; prioritize major bursts under load.
- [x] Carry actual cast identities and boss attack timings through typed party presentation data; animate real peer skills and recipient effects.
- [x] Replace color-edge noise with depth-based outlines; tune integer pixel resolution, camera framing, floor seams, moss, ruins, banners and torch lighting.
- [x] Make target labels lighter while retaining collision avoidance, prefix visibility and responsive placement.
- [x] Expand bilingual enemy/armor/late-word and boss-passage variety, preserve type-specific difficulty and recent-word history through checkpoint restore.
- [x] Refill reachable combat targets after dashes, add arrival feedback and an empty-arena notice, and recalibrate normal spawn pressure.
- [ ] Finish final regression, visual captures, timed profile and resource-disposal evidence for the revised source.

Evidence: `verification/dungeon-visual-2026-10-16`. The persistent dungeon save format, historical account data, endless progression and levelling rules are preserved. No new runtime dependency or public asset file is introduced.


## M9 - Damage clarity, gentler opening, optional training and shared shell polish

- [x] Add actual-damage armor/edge/ring/HP feedback; keep Reduced Effects readable and ignore HP differences from checkpoint loading alone.
- [x] Start with two slower foes and two optional objects; cap pressure at four threats for 90 seconds, six until three minutes, twelve until the first boss.
- [x] Distinguish enemy, loot and explosive labels with text, icons, shape and color; retain non-overlap and exact target input.
- [x] Show real level-up/acquisition pulses, draft rank changes and applied-upgrade benefits.
- [x] Reuse real rules for seven isolated combat lessons; allow skip from the first step, replay through Dojo and direct Begin run without tutorial completion.
- [x] Unify steel/stone/brass controls and restrained interaction/entry animation across shell pages with reduced-motion fallbacks.
- [ ] Finish current-source browser matrix, captures, 900-active-second profile and retirement/resource checks. This supersedes M8's remaining final-profile gate; do not label its old captures as this revision.


## M10 - Adaptive dungeon audio, 2026-10-16

- [x] Replace the single-bleep audio with an original native Web Audio score, beat-scheduled state-driven layers, quiet menu/Dojo/draft arrangements and live boss/critical-HP responses.
- [x] Differentiate hurt, strikes, armor, creature/death, explosive, loot, chest, heal, magnet, level, upgrade, victory and defeat feedback; duck music beneath major cues and bound repeating voices.
- [x] Add compatible persisted master/music/effects controls; stop sources/scheduling when paused, muted, hidden or context-lost and dispose with the renderer.
- [ ] Listening on headphones/speakers, current-source automated suites and timed resource profile. User explicitly deferred testing during this implementation; earlier coverage and partial E2E results do not verify the audio revision.


## M11 - Enemy patterns, readable supplies, equipment and CI repair

- [x] Merge checkpoint PR #8 into main through GitHub's normal merge endpoint at 9229079; CI was pending, not claimed passing.
- [x] Add seeded speed variation, per-type steering, flying bats/hovering mages, ranged cast cues and committed minotaur charge/recovery telegraphs.
- [x] Add typed shield/potion/mana/sentry supplies with distinct models/labels, real shield absorption, one timed attacking tower, visible equipment and compatible save defaults/validation.
- [x] Default new solo vocabulary/selector to Indonesian and raise the music bus without overwriting saved mute/master preferences.
- [x] Restore 100% statements/branches/functions/lines coverage without lowering thresholds: 177 tests, 25 files; see verification/dungeon-encounters-2026-10-16.
- [x] Current-source lint, app/server TypeScript, build, dependency audit, headless/retirement audits and Worker dry-run.
- [ ] Finish the 63-case browser matrix and confirm final GitHub validation; live evidence is on PR #10.
- [ ] Timed 900-active-second hardware profile and headphone/speaker calibration remain deferred; do not infer hardware performance from CI.


## M12 - Exact-case typing consistency, 2026-10-17

- [x] Match skill, draft, enemy/item and passage input to the exact displayed case; remove silent command uppercasing in solo and multiplayer.
- [x] Add Caps Lock and exact-case/modifier highlights to the existing on-screen keyboard; explain case in ready, draft and skill controls.
- [x] EN/ID rule, multiplayer and keyboard regression checks; 179 tests/25 files at unchanged 100% global coverage, lint, both TypeScript checks and build pass locally.
- [ ] Finish current-source browser checks and confirm GitHub validation after enabling an Xvfb display for Firefox WebGL on the Linux runner.


## M13 - Boss continuity, readable combat and local history, 2026-10-17

- [x] Preserve the full finite boss combo through ten-second retaliation cycles; gate lethal damage at the last letter and defer upgrade drafts until boss defeat.
- [x] Add boss guard/counter feedback and safe separation, varied blade poses, directed passive attacks/cooldowns, real chest rewards and resource/level/rank popups.
- [x] Expand authored EN/ID packs, character details, bounded weather/landmark dressing and the heraldic main menu.
- [x] Add bounded local history for Survival, Dojo and real multiplayer rounds; retain save/account isolation.
- [x] Focused real-browser boss/tutorial/gameplay checks: seven Chromium cases passed; earlier 63-case result belongs to the pre-polish source.
- [x] Current-source local checks: 188 tests/27 files, unchanged 100% coverage, lint, app/server types, build, audit and Worker dry-run. See verification/dungeon-polish-2026-10-17.
- [ ] Finish full browser CI and timed production resource evidence before claiming release verification.
- [ ] Supabase backup, migrations, cloud history and leaderboard changes: explicitly postponed by the user until after non-Supabase work.

## M14 - Active boss duel, barricade and natural Indonesian commands

- [x] Replace artificial Indonesian item/upgrade commands and add an alphabetic command-pack invariant.
- [x] Keep boss movement and horde siege active during paragraph input; correct-input retreat, typo rush, word sidestep, telegraphs and a real breakable protective fence preserve the entire line.
- [x] Replace dark block weather with restrained world-anchored ash, leaves and snow; retain Reduced Effects and instance bounds.
- [ ] Final current-source coverage, build, types/lint, browser matrix and timed production profile. The completed pre-duel profile is historical and does not verify M14.
- [ ] Final PR title/body and target master, per the latest user instruction; preserve the existing branch and finish checks first.

## M15 - Rhythm-based duel pressure, per-break barricade and Indonesian word review, 2026-10-17

- [x] Correct duel letters add calm (0.55s each, cap 1.5s); while calm, the boss holds a 3.4-unit standoff outside hammer reach and cannot wind up. Hesitation drains calm; typos clear it and trigger the rush. Simulated hammer damage per duel: 40 WPM 1.10 -> 0.45, 30 WPM 3.05 -> 0.90; 15% typo rate still costs about 2.5.
- [x] Each armor break raises a fresh barricade centred on the hero (fixes a stale wall position and inherited near-zero HP in later combos). Barricade HP 24 -> 30 (about 24-27s under sustained pressure); stakes topple progressively; HUD reads the balance constant.
- [x] Replace non-standard Indonesian words (e.g. dobrakkan, LULUHLANTAK, GEMPAKAN, KELAMNYA, Angkuh, nokta). BLIZZARD stays as the GDD-defined ultimate keyword.
- [x] 198 tests/27 files at 100% coverage, lint, both TypeScript checks and build pass locally.
- [ ] Browser E2E (boss barricade timeout raised to 45s for the larger wall) and the timed production profile; deferred to the final test pass.

## M16 - Bestiary expansion, place weather, controls sheet and onboarding, 2026-10-17

- [x] Fifteen new combatants with distinct movement, attack style, speed, armor, XP, unlock time and depth favourites; models, gait, labels and audio cues.
- [x] Fix black loot/embers/projectiles/telegraphs (missing vertex colour attribute); weather bound to the current depth with per-place motifs; HUD depth name matches.
- [x] Keyboard controls sheet (title, ready, pause), before-run primer with opt-out, and a Backspace cancel lesson with animated visuals.
- [x] Boss duel staged on open floor (no ruins inside the ring), items and shots cleared, horde kept outside the intact fence; BOSS INCOMING / BOSS DUEL banners.
- [x] Boss lines are attributed quotations and peribahasa; everyday vocabulary pack mixed into enemy words.
- [x] 206 tests/27 files at 100% coverage, lint, both TypeScript checks and build pass locally (Chromium headless for browser tests).
- [ ] Playwright E2E matrix and timed production profile.

## M17 - Spectacle pass: weapons, new foes, PBR environment, ornate UI, 2026-10-17

- [x] Automatic weapons (Spirit Blades orbit, Arcane Nova, Meteor Rain, Frost Aura), ranks 1-5, in `packages/game-rules/src/weapons.ts` behind a `CombatPort`; first drafts lead with a weapon. Spawn table moved to `roster.ts` and driven by bestiary unlock times (new silhouette roughly every 30s from the first minute).
- [x] Five new foes (Gargoyle, Mimic, Sporeling, Ghoul, Death Knight); guard redesigned as an Orc Warden so no large foe resembles the hero. Blueprint registry in `apps/web/src/game/models/`.
- [x] Fatality on the final layer of armored foes (shockwave), whirlwind every 8th word; hero move set (slash, thrust, uppercut, twin, leap, whirl, finisher) with hit-stop, flash and zoom punch.
- [x] Native three.js post chain (outline/grade, UnrealBloomPass, OutputPass), procedural albedo+normal textures, vertex-glow emissive parts, sun shadows, rim light; walk-through floor decor (bones, rubble, grass, glowshrooms, candles, crystals, puddles, cracks, runes).
- [x] Cross shapes removed (title crest, heal glyph, shield, potion, banner, dummy, helmet).
- [x] Bestiary with in-engine portraits; title screen, HUD, and all dialogs (pause, defeat, draft, settings, history, controls) restyled with an ornate frame system; SFX recipes and adaptive percussion.
- [x] Push review: production build, web TypeScript, rooms TypeScript and scoped ESLint (`apps/web/src packages e2e`) passed on 2026-10-17; staged diffs checked for whitespace and new module imports.
- [ ] Unit/browser/E2E tests, coverage and production profile were not rerun for M17 at the user's request to stop implementation and push; title markup/model snapshot compatibility and CI remain unverified.

## M18 - Readability, varied ruins and wave director, 2026-10-17

- [x] Contrast pass centralised in `apps/web/src/game/render/environmentGrade.ts`: darker low-noise floor/walls, bloom limited to light sources (threshold 0.92), no grade lift, lower emission, stronger silhouette outline and contact shadows; fatality uses an impact-focus dim instead of a white flash.
- [x] `packages/game-rules/src/terrain.ts`: seeded per-slot ruin archetypes (keep wall, broken arch, watchtower, shrine, palisade, crypt) with their own footprints, ~32% open slots; collision, pathing and rendering (`scene/RuinBuilder.ts`) share it. Footprints are subsets of the legacy rectangle, so old saves stay valid.
- [x] `packages/game-rules/src/director.ts`: opening, then 60s cycles of build-up, surge (themed pack from one direction, faster spawns, +6 threat cap, 15% haste) and breather; an elite leads every third surge. Speed curve retuned (base 0.37, growth capped at +70% plus depth step).
- [x] New committed attacks for skeleton, goblin, slime, bat and spider after their unlock times; veteran archers fire three-arrow fans. `scene/EnemyMotion.ts` adds anticipation/charge/leap/dive/slam poses; HUD wave chip and SURGE banner.
- [ ] Tests, lint, typecheck and production profile not run (per request).

## M19 - Targeted effects, enemy voices and music themes, 2026-10-17

- [x] Every damage source draws on its target: chain lightning and sentry use jagged caster→target arcs (`zap`), Storm drops a sky bolt on each struck enemy, weapons/cleave/explosions leave source-coloured impact bursts (`vfx/signatureEffects.ts`, `hitMarkers` in the scene).
- [x] `audio/enemyVoices.ts`: arrival call and death cry per kind (skeleton rattle, ghoul groan, spider skitter, wolf howl, …); kill confirm and elite kill; layered explosion (sub, crack, rumble, debris) and thunder; surge horn and breather chime.
- [x] `audio/musicTracks.ts`: five depth themes plus title and boss duel themes with their own key, tempo and lead; switches on phrase boundaries (boss cuts in on the next bar).
- [x] `gradeBiome` normalises each depth's floor and fog luminance so the contrast grade holds as depths change.
- [ ] Tests, lint, typecheck and production profile not run (per request).

## M20 - Audible mix and title layout, 2026-10-17

- [x] Gain staging in `apps/web/src/game/audio/mixLevels.ts` (default volume 0.7, effect and music voice make-up gain, glue compressor + limiter). Saved settings without `mix: 2` are lifted to the new default once; an explicit mute is kept. Measured at the limiter output in Chromium: combat RMS peaks about -12.5 dB, true peak about -1.2 dB, music bed about -28.7 dB (was about -41 dB).
- [x] Title menu fills the space between nav and footer (no overlap at 1280×640, 1366×768, 1920×1080); language and controls moved to the footer; duplicate nav wordmark and decorative depth card removed.
- [x] Plain copy for menu, dialogs, settings and bestiary in place of dramatic filler.
- [ ] Tests, lint, typecheck and production profile not run (per request). Copy changes will break text-based assertions in existing tests.

Push checkpoint, 2026-10-17: production build (`npm run build`), web TypeScript (`npx tsc --noEmit`) and staged whitespace checks passed for M18-M20. Full tests, coverage, lint, server TypeScript, E2E and the timed profile were not rerun during this push-only checkpoint.

## M21 - Clean surge audio, distinct kill sounds, build pressure, modal scrolling, 2026-10-17

- [x] Audio: new `sweep` voice primitive (one oscillator, pitch glide, LFO vibrato, soft attack) replaces chopped multi-note glides that clicked when a surge pack called at once; surge cue is a soft two-voice horn with drum hits and ducks music. Death cries ×1.9 with a quiet kill tick, so each kind's death is what you hear. Measured at the limiter during a surge: avg -18.4 dB, peak -0.9 dB.
- [x] Build-scaled pressure (`director.pressureFor`, `buildPowerScore`): weapons/relics/skills raise threat cap, spawn rate, haste and the chance of an extra armor word on regular foes; mid-game spawn intervals tightened. Headless probe (scripted typist, 3 seeds, 7 min): 40 WPM survives ~4 min, 60 WPM needs heals from ~5 min, 90 WPM takes hits from ~6 min.
- [x] Dialogs: frame no longer scrolls (decorations caused 4 px overflow and scrollbars on every modal); content lives in `.dialog-body`, which scrolls only when needed; Bestiary has a single scroll area with a pinned close button.
- [ ] Tests, lint, typecheck and production profile not run (per request).


## M22 - Verification and merge checkpoint, 2026-10-17

- [x] Reviewed and split current changes into Conventional Commits for combat pressure/caps, compact label metadata and dialog focus/scrolling, continuous enemy audio, limb batching/adaptive rendering, browser regression coverage and CI triggers.
- [x] Current-source lint, web TypeScript, rooms TypeScript, production build, zero-vulnerability npm audit, Worker dry-run and retirement/headless audits passed locally. Audit matches were vocabulary, compatibility save keys and test fixtures; no retired renderer dependency or gameplay DOM/RNG violation was found.
- [x] 230 unit/browser tests passed in the latest completed coverage run. Lines/functions reached 100%; the remaining restorative-draft statement/two branches now have a regression that exhausts weapon/relic ranks. A fresh full coverage run is in progress; no threshold was lowered.
- [ ] Complete the fresh coverage run, cross-browser E2E and 900-active-second production profile. An initial Chromium tutorial assertion expected 7 lessons instead of 8; its fixture is corrected and needs rerun. Other completed initial Chromium scenarios passed. Do not treat running checks as successful evidence.
- [ ] Confirm GitHub CI on the merged master commit. The user requested PR creation and merge before the remaining verification finishes. Supabase backup/schema work remains deferred; no database/Auth changes are part of this checkpoint.

## M22 - Medieval orchestra and stone-hall reverb, 2026-10-17

- [x] `audio/instruments.ts`: synthesized lute/harp plucks, choir "ah" pads (formant filters), bowed low strings, horn, flute, crypt bells, pipe organ and a war-drum kit (taiko, tom, frame drum, anvil, shaker); each note is a `NoteGraph` committed to the music bus voice budget.
- [x] `audio/reverb.ts`: generated stone-hall impulse response (3.4 s darkening tail, early reflections) on music and effects sends.
- [x] `audio/score.ts`: per-theme ensembles (Keep: horns + strings + lute + war drums; Crypt: bells + choir; Foundry: horns + organ + anvils; Frost: harp + choir; Verdant: flute + lute; Boss: horns + choir + war drums; Title: harp + choir + bells) with pad, bowed bass, melody, arpeggio and energy-scaled drums.
- [x] Measured at the limiter: title bed about -20 dB before the final 2 dB trim, combat about -19 dB average with peaks at -1.3 dB; no runtime errors.
- [x] `audio/percussion.ts` is no longer used by the engine. Test suite updated; all tests pass.

## M23 - Playtest fixes, recorded audio, hero Armory and coin economy, 2026-10-17

- [x] Lock-free typing (`game-rules/targeting.ts`): every nearby word stays typeable (no one-label-per-first-letter filter, no wall check), the nearest match is focused, Backspace deletes one letter. Labels are never dropped, next armor words show small under the main word, non-matching words dim while typing.
- [x] Typing bar (bottom centre), Kingdom Hearts-style lock reticle and out-of-range floor shading (`scene/TargetFocus.ts`); captions limited to hero events and drawn below enemy words.
- [x] Player status moved top-left, run metrics top-right. UI redesigned on one font (Press Start 2P) and one bevelled iron-panel style (`styles/theme.css`, `dialogs.css`, `title.css`, `hud.css`, `armory.css`); embers, corner flourishes, crest medallions, gem dividers, shimmer and glow halos removed (`ui/Ornament.tsx` deleted).
- [x] Recorded CC0 audio (Kenney SFX; OpenGameArt music by RandomMind, Spring Spring, cynicmusic, Juhani Junkala, TAD, Paul Wortmann), transcoded to OGG and normalised; music streams through `<audio>` (`StreamingDeck`), one-shots decode once (`SampleBank`), synthesis layers on top and remains the fallback. Credits in `CREDITS.md` and `ASSET-LICENSES.md`.
- [x] Hero customization: 8 slots, 57 items (`content/cosmetics.ts`), starter items free, others bought with coins earned per run (`game-rules/economy.ts`, paid once per run seed, daily first-run bonus, 900 cap). Prices 3,600 / 12,000 / 24,000 / 48,000. Profile in localStorage (`profile/heroProfileStore.ts`), validated on load. Armory screen with try-on preview and camera close-up; hero geometry rebuilt and released per change (`scene/HeroAppearance.ts`).
- [x] Painted per-part vertex shading for all models.
- [x] Test pass completed: `Equipment.browser.test.tsx` retired `EmberField` removed; `DungeonAudio.test.ts` updated with StreamingDeck mocks and clean timer disposal. All 33 test files (234 tests) pass.

## M24 - Surface detail, coin rewards, plate-and-text UI, more free cosmetics, 2026-10-17

- [x] Shared surface-detail atlas (`render/surfaceDetail.ts`): one seeded 64×64 RGBA texture with four hand-pixelled height fields (stone/bone grain with cracks, cloth weave, metal/wood streaks with scratches and dents, cellular hide/scales) plus coarse wear patches. Applied object-space and triplanar on the shared actor material with albedo grain, metal sheen and a derivative bump; a per-vertex `surfaceClass` (`models/surfaceClass.ts`, picked from each part's paint; skin and lit parts stay clean) selects the family. Covers every enemy, the hero, floor props, torches, barricades, landmarks, shields and portraits with one texture and one program. Material factory (`DungeonModels.createMaterial`) owns and disposes hero and cloth variants.
- [x] Loot: faceted gems and projectiles (pre-shaded facets under unlit tints), coins rebuilt as rim + face + stamp.
- [x] Pickups: new `gold` effect (one tally per collection, hero-side). Captions are an icon and a number only (`dungeon/feedbackCaptions.ts`): coin `+3`, heart `+2`, shield `+2`, `LV 4`, `RANK 2`, `FATALITY`; no plates. The boxed "SUPPLY COLLECTED / UPGRADE ACTIVE" toast and the visible notice line were removed (notice kept for screen readers); chest notice shortened.
- [x] Coin reward on the result screen (`dungeon/RunReward.tsx`): pixel coin (`ui/CoinIcon.tsx`), counted total, line-by-line sources from `coinBreakdown` (time, kills, level, gold, cap, first-run bonus) and the new purse total; short runs say how to earn. Coin icon used for gold in the HUD, title footer and Armory.
- [x] UI: 9-slice SVG frames (notched corners, bronze inner line, rivets, fine grain) for dialogs, HUD plates, buttons, cards and the typing bar; tabs, stats, mode links, equipment, build chips, how-to steps and footer are now text and icons without boxes. Larger start sigil (54 px socket, 36 px sword). Stale Backspace "lock" copy updated.
- [x] Level-up cards redesigned as upright reward plates in the shared iron frame: family tag, diamond medallion in the family colour, name, rank pips, description, recessed keyword with a cyan fill bar while typing; cards rise in staggered. Only warnings show under the cards. Result screen fits one view (six stats in one row on wide screens).
- [x] Cosmetics: 27 new free items (4 heads, 4 faces, 3 armors, 2 legs, 3 backs, 4 weapons, 3 off-hands, 4 dyes); 44 of 84 items are free. Existing saves receive them automatically on load.
- [x] Test pass completed: CombatFeedback caption assertions updated to match `feedbackCaptions.ts`; gold and reward tests pass.

## M25 - Layer drops, endless pacing, Armory lighting, 2026-10-17

- [x] Enemy layers: one pixel blood drop per remaining word above each foe's word (`ui/LifeDrops.tsx`); more than five collapse to "drop ×N".
- [x] Adaptive director (`game-rules/director.ts`): `typingFactor` reads the run's correct keystrokes against a 50 WPM prior (deterministic) and scales spawn rate, threat cap, approach speed and armor between 0.4× and 2×. Enemy shots share one cooldown (`rangedGap`), so a room of archers fires a readable rhythm. Second wind: one heart back after 20 s without damage.
- [x] Endless escalation from minute 10 with no ceiling: +5% spawn rate, +1 threat and +1.6% speed per minute, rising armor chance, bigger spawn waves every 4 minutes, a veteran word layer every 7 minutes (max +3), two-heart melee hits from minute 28.
- [x] Headless probe (scripted typist, no skills, first upgrade, 3 seeds, 45-minute cap; not a test). Before: 30–45 WPM died at 2–6 min and 80+ WPM plateaued and survived indefinitely. After: 30 WPM 3–11 min, 45 WPM 10–25 min, 60 WPM 16–26 min, 80 WPM 26–36 min, 110 WPM 29 min to 45+ min.
- [x] Armory: showcase key spot, cool fill and floor light pool that fade in only on the Armory (`scene/ShowcaseLight.ts`); lighter screen shade behind the shop.
- [x] Test pass completed: director tests, veteran layers escalation, rangedGap shared cooldown, and LifeDrops tests pass.
- [x] Hero idle animation (`scene/HeroIdle.ts`): breathing, weight shift and sword sway, plus a gesture every 7 s (blade on shoulder, glance left and right, shoulder stretch, blade flick). Blends out instantly on dash, swing, typing charge, cast or hit and eases back in; broader on title and Armory; off with Reduced Effects.
- [x] Playable characters: new `hero` slot (first Armory tab) with five heroes. Aldric, Warden and Kestrel, Cutpurse are free; Brann Ironhide and Lyra Vale are rare (12,000); Morwen the Grey is epic (24,000). Each has its own stature, skin and hair, and signature parts that stay over any outfit (`models/heroArchetypes.ts`): Warden crest; rogue scarf and cloak; dwarf beard and belt; elf ears and long hair; mage robe, collar and bound wisp. Movement personality per hero (`scene/heroStyles.ts`): idle motion (crouch, bounce, hover, sway), three or four own gestures, basic attack combo and dash weight. Presentation only, no stat differences. Old saves default to the Warden.
- [x] English is the default word language (simulation default, run start and first option on the title screen).

## M26 - Impact feel, mistype feedback, skill tree, 15 heroes, 2026-10-17

- [x] Impact: trauma-based `scene/CameraShake.ts` (layered-sine offsets, directional kick that springs back, slight roll; trauma² so small hits stay subtle). Word strikes, kills, elites, finishers, explosions, hurt and boss kills each add their own trauma along the blow. Hit-stop runs on the real clock (55 ms strike, 60 ms kill, 100 ms elite, 130 ms heavy move, 300 ms boss) and never touches the simulation. Screen flash and chromatic split live in the existing grade pass. New Settings slider "Screen shake" (0–1); Reduced Effects forces it off. Transient punches clear immediately when the run pauses, drafts or ends.
- [x] Impact audio: new `strike` cue on every finished word (sub thump, dry crack, body knock, punch sample), heavier `kill`/`kill-elite`, a much bigger explosion, `loot` and `laststand` cues. Typing ticks climb up to a fifth in pitch as the locked word fills.
- [x] Mistype: dull buzz-thud `typo` cue, red cross over the hero, flicker ring, hero flinch, red screen-edge pulse, small shake, and the typing bar plus locked label shake red (CSS, replays without remounting, skipped on mount).
- [x] VFX (`vfx/impactEffects.ts`): camera-facing flares, normal-blended smoke, ground scorch decals and ballistic debris layers. Deaths throw gibs in the foe's colour, a smoke puff and a rising soul; explosions flash, roll a fireball, shockwave, shrapnel, smoke column and scorch; lightning/firebolts gain head and impact flares; enemy shots get a glowing head and burst where they end; chests burst into a coin fountain. Burst cap 40 → 64 with major-effect priority; every new layer is bounded.
- [x] Automatic attack sources: one familiar orb per Nova, Meteor, Frost Aura, Chain Lightning and Vowel Fire circles the hero in that weapon's colour, flares when it fires and draws a tracer to each target; Lightning and Firebolt now start at their orb, sentry hits draw a tracer from the tower.
- [x] Skills: solo recharge 4/6/5 words (Cleave/Storm/Heal; multiplayer keeps its own 3/5/4 via `partyWords`). Mobile-MOBA style buttons: clockwise dark sweep with the remaining word count, mana ring, rank pips, pop when ready. Each rank has its own look (`cleaveSkill`, `stormSkill`, `healSkill`) and Storm L2 now stuns 1.5 s, Heal L2 adds one shield charge; L3 effects unchanged.
- [x] Supplies: barrels spawn beside the densest nearby pack; blast radius 4.6 with knockback and 1 s stun (still one layer). Sentry deploys at the hero.
- [x] Meta progression (`content/talents.ts`, `game-rules/talents.ts`, `profile/talentStore.ts`, `dungeon/SkillTree.tsx`): Embers from every run of 30 s+ (time, kills, words, bosses; Bounty bonus), paid once per seed. Tree: Ember Heart root, then Vitality / Focus / Arsenal branches of four. Bonuses are fixed into the run at start (`DungeonState.talents`, validated on restore; older saves restore with none) and never type for the player. Refund-all. Separate local save `typecade:talents:v1`.
- [x] Heroes: 15 playable (8 male, 7 female; Human, Elf, Dwarf, Northman, Sylvan, Orc, Dragonkin, Avian, Lunarian, Dark Elf, Leonin). Free: Aldric (M), Kestrel (M), Lyra (F). Each hero has a signature kit and dye; buying a hero unlocks its kit; each hero keeps its own saved look (`HeroProfile.looks`). Race features stay over any outfit; own hair shows with an open head slot. Three new movement styles: beast, dancer, ronin.
- [ ] Timed `npm run profile:dungeon` against a production preview with the new VFX layers.

## M27 - External review pass: brighter, faster, readable, upbeat, 2026-10-17

- [x] Music: new major-key synthesized themes (I–V–vi–IV, a two-bar hook stated, answered and repeated, 136–146 BPM) with a four-on-the-floor "drive" kit; the boss duel stays minor but faster. Recorded menu/dungeon/battle beds (gloomy) no longer play; recordings remain for the boss and the defeat sting. Lead levels raised since the synth now carries the mix.
- [x] Visuals: brighter grade (ambient, sun, fill, torches up; fog and vignette down; saturation up; brighter biome floors and fog) and a soft warm key light that follows the hero so outfits and faces read.
- [x] Readability: words to type, the typing bar, boss passages, keywords and dialog body copy use a crisp system monospace with tracking; label outline thinned so letters no longer merge. The pixel face stays for headings, buttons and HUD. (VCR OSD Mono suggested by the reviewer needs a font download and licence check; not added.)
- [x] Urgency: base enemy speed .37 → .43, warm-up 90 → 60 s, opening spawn gap 4 → 3 s, learning gap 2.2 → 1.9 s, smaller opening speed ramp.
- [x] Title: layout unchanged at the user's request; added a standard About page (why, what, how). Mode buttons expose their exact label as the accessible name.
- [x] Endless mode kept by user decision (reviewer suggested timed sessions).
