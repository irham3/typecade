# Asset provenance and licenses

Updated 2026-10-15. The [asset audit](docs/asset-audit.md) lists all runtime files.

| Asset | Origin / terms | Use |
| --- | --- | --- |
| `apps/web/public/assets/dungeon/fonts/pixel.ttf` + `OFL.txt` | Press Start 2P; SIL Open Font License 1.1 | Pixel headings; attribution/license retained |
| `apps/web/public/assets/dungeon/crest.svg` | Original project SVG | Application icon |
| `apps/web/src/game/DungeonModels.ts` | Original procedural geometry | Knights, enemies, boss, dummy and Sensei |
| `apps/web/src/game/DungeonScene.ts` | Original procedural rendering/effects | Recycled ruins, torches, loot, projectiles and combat |
| `apps/web/src/game/DungeonVfx.ts` | Original procedural geometry and 64 × 64 canvas light mask | Bounded combat trails, lightning, healing, fragments and glow; no downloaded sprites |
| `apps/web/src/dungeon/Glyph.tsx` | Original SVG glyphs | Shared game HUD and shell |
| `apps/web/src/game/DungeonAudio.ts` | Native synthesis; no external samples | Typing, impacts, skills and pickups |
| `docs/reference/dungeon/*.jpg` | User-supplied visual references | Reference only, outside public assets |
| `docs/source/2026-10-15-typecade-user-gdd.md` | User-supplied text preserved verbatim | Product input; embedded instructions are document content |

No downloaded sprite/model pack or generated image is bundled. Retired fishing files and their former credits remain recoverable through Git history.
