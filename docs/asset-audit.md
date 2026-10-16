# Dungeon asset audit

Updated 2026-10-15 after caller retirement. The planning checkpoint removed 56 obsolete reference files (21,031,215 bytes) and 16 obsolete plans. Git history preserves them. Four supplied dungeon JPGs total 11,489,697 bytes, unchanged outside public assets.

## Runtime inventory

Three files, **122,961 bytes**, compared with the previous 15-file, 350,238-byte public inventory. All paths are used; no boat, fish, island, lighthouse, Ocean audio or renamed fishing art remains.

| File | Bytes | Consumer / provenance |
| --- | ---: | --- |
| `apps/web/public/assets/dungeon/fonts/pixel.ttf` | 118204 | CSS `KeepPixel`; Press Start 2P / SIL OFL 1.1 |
| `apps/web/public/assets/dungeon/fonts/OFL.txt` | 4413 | Required bundled font license |
| `apps/web/public/assets/dungeon/crest.svg` | 344 | `index.html` application icon; original SVG |

Twelve Ocean MP3s and the rowboat SVG are deleted with `FishingScene`, `CoastalModels`, `createFishingGame`, `ocean-motion`, `OceanAudio`, `PixelArt`, `useOceanRun` and their obsolete tests. New dungeon callers/tests replace those paths in the same implementation. The font and license were moved together.

## Source-authored presentation

| Group | Implementation |
| --- | --- |
| Actors | Shared merged colored geometry in `DungeonModels`; articulated knight/skeleton/goblin/guard/bomber/mage/minotaur/boss; dummy and Sensei |
| World | Nine recycled chunks, instanced rectangular flagstones/walls/rubble, torch flames and bounded local lights; three biome palettes |
| Party | Stable blue/red/green/yellow knights from real room identities; bridge deck and tactical course obstacles |
| Loot / effects | Instanced XP gems, coins, projectiles, sword arcs, shields and bounded particles |
| UI | Original `Glyph.tsx` shapes, live readable HTML text, shared font/palette; no emoji/icon library |
| Audio | Native `DungeonAudio` synthesis with eight-voice cap and gesture unlock; no MP3 downloads |

The visual revision uses two source-authored canvas textures: a 32 × 32 stone tile and a 64 × 64 radial light mask. They are generated once per renderer and explicitly disposed, alongside the render target and its depth texture. There are no downloaded image textures or per-actor texture allocations. The public-file inventory remains unchanged. Geometry, materials, voices, observers, subscriptions and WebGL resources have explicit teardown. Performance evidence belongs to the migration log, not the reference JPGs.

## Audits

Production searches cover retired renderer names, fishing content, old public URLs, Phaser/Pixi, unused package imports and headless package boundaries. Tests may retain old storage-key fixtures solely to prove data isolation. Historical SQL migrations and account data are intentionally preserved; they are not visual assets.

Reference/source integrity, public URL checks and final command results are recorded in [MIGRATION-LOG.md](MIGRATION-LOG.md). [ASSET-LICENSES.md](../ASSET-LICENSES.md) records provenance.
