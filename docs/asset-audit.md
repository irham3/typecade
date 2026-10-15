# Asset audit — dungeon planning reset

Date: 2026-10-15. Scope: tracked design/reference assets and all public runtime assets. Status: planning completed; runtime retirement remains staged with caller replacement.

## Removed from this branch

- 56 obsolete reference files: 21,031,215 bytes total. Includes Ocean/sunset verification screenshots, old UI reference, three ocean-race concept images and their historical JSON reports.
- 16 obsolete planning/review documents: the old GDD, two fishing/multiplayer plans, twelve Overdrive/Signal plans/specifications and one Overdrive design critique.
- Git history retains these materials. Historical migration-log evidence links may refer to deleted records; its header now identifies their historical status.

## Added design input

Four user-provided dungeon reference JPGs are copied byte-for-byte to `docs/reference/dungeon`, totaling 11,489,697 bytes. The original GDD is copied verbatim to `docs/source/2026-10-15-typecade-user-gdd.md`. None is served by Vite public assets or used as a game background. File hashes are checked against the supplied originals.

## Public asset inventory

15 files, 350,238 bytes. Zero confirmed orphan files; zero missing referenced files at audit time. All twelve MP3 keys are called by FishingScene/OceanAudio; the boat is called by RaceScreen; the font is called by CSS and requires its license. File-format and listening quality for dungeon suitability are not yet verified. Naming is historical, so these paths do not meet the future dungeon naming convention.

| Existing file | Bytes | Decision |
| --- | ---: | --- |
| apps/web/public/assets/ocean/audio/sfx_ambient_ocean_loop.mp3 | 48946 | Retire with FishingScene/OceanAudio callers |
| apps/web/public/assets/ocean/audio/sfx_catch_impact_a.mp3 | 4747 | Retire with FishingScene/OceanAudio callers |
| apps/web/public/assets/ocean/audio/sfx_combo_milestone_b.mp3 | 3493 | Audition for dungeon; retain only if used |
| apps/web/public/assets/ocean/audio/sfx_correct_tick_a.mp3 | 1612 | Audition for dungeon; retain only if used |
| apps/web/public/assets/ocean/audio/sfx_escape_snap_a.mp3 | 3806 | Retire with FishingScene/OceanAudio callers |
| apps/web/public/assets/ocean/audio/sfx_music_boss_layer.mp3 | 72769 | Audition for dungeon; retain only if used |
| apps/web/public/assets/ocean/audio/sfx_music_expedition_loop.mp3 | 72769 | Retire with FishingScene/OceanAudio callers |
| apps/web/public/assets/ocean/audio/sfx_reward_sting_a.mp3 | 6941 | Audition for dungeon; retain only if used |
| apps/web/public/assets/ocean/audio/sfx_skill_activate_a.mp3 | 3493 | Audition for dungeon; retain only if used |
| apps/web/public/assets/ocean/audio/sfx_splash_a.mp3 | 3179 | Retire with FishingScene/OceanAudio callers |
| apps/web/public/assets/ocean/audio/sfx_typo_thud_a.mp3 | 2239 | Audition for dungeon; retain only if used |
| apps/web/public/assets/ocean/audio/sfx_word_complete_a.mp3 | 2866 | Audition for dungeon; retain only if used |
| apps/web/public/assets/sunset/OFL.txt | 4413 | Keep; preserve license on relocation |
| apps/web/public/assets/sunset/pixel.ttf | 118204 | Keep; preserve license on relocation |
| apps/web/public/assets/sunset/rowboat.svg | 761 | Retire with RaceScreen caller |

## Caller retirement map

| Asset/source | Current consumer | Required same-change cutover |
| --- | --- | --- |
| Rowboat SVG | `apps/web/src/multiplayer/RaceScreen.tsx` | Knight/course presentation and its browser tests; then delete boat |
| Ocean-only MP3s | `apps/web/src/game/OceanAudio.ts`, `FishingScene.ts` | Replace loop/event mapping and audio tests; then delete retired sounds |
| Generic MP3 effects | Same audio/renderer callers | Audition typing/skill/reward/boss cues; keep only approved mapped sounds |
| Pixel font/license | `apps/web/src/styles.css` | Keep; move together to `assets/dungeon/fonts` when CSS is replaced |
| Procedural coast/fish | `CoastalModels.ts`, `FishingScene.ts`, `ocean-motion.ts`, `PixelArt.tsx` | Replace models/render events/glyphs and tests, then delete fishing-only source |

Deleting still-referenced public files now would create known missing image/audio requests. This phase removes unused references and planning, while keeping the existing web runnable until source replacement. Six public files (boat plus five Ocean-only sounds) are definite cutover deletions; seven audio files need audition; two font/license files are retained. This does not mean all old runtime art has already been removed.

## Dungeon replacement manifest

| Group | Required content | Preferred production |
| --- | --- | --- |
| Knight | Blue primary; red/green/yellow variants, sword/shield, animation states | Shared procedural geometry and palette |
| Enemies | Skeleton, goblin, shielded, bomber, mage, elite/minotaur, boss | Shared geometry, instancing or bounded rigs |
| Dojo | Dummy, Sensei, candles | Reuse dungeon palette/modules |
| World | Floor, broken wall, column, rubble, torch, bridge/course obstacles | Recycled instanced/merged chunks |
| Interactables | Barrel, chest | Small shared models |
| Loot | XP gem variants, gold, mana | Bounded shared instances |
| Effects | Sword arc, shield break, dash, magic, heal/freeze, pickups | Bounded geometry/particles; no giant sprite pack |
| UI | Skills, relic glyphs, player/status markers | Authored SVG/HTML; no baked labels or icon dependency |
| Audio | Sword, armor, magic, heal, pickups, torch room tone, boss, result | Native synthesis or individually approved existing cues |

No new runtime files are required before their callers exist. Use lowercase snake_case for future file assets, with provenance/license and a measured size budget. Do not rename old fishing art to imply it became dungeon art. Source images/prompts are reference material and cannot replace animated gameplay.

## Review outcome

Unused design assets removed. Existing public references remain intact. Dungeon suitability of seven generic sounds is pending listening review; duration/sample-rate analysis and new model/render profiling belong to implementation. No new game asset, measured FPS result or completed dungeon scene is claimed.
