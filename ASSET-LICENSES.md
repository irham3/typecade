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
| `apps/web/src/game/DungeonAudio.ts` + `audio/*.ts` | Native synthesis (instruments, reverb, magic cues) | Fallback score, spell/UI tones, enemy voices |
| `apps/web/public/assets/dungeon/audio/sfx/*.ogg` (52 files) | Kenney "RPG Audio" and "Impact Sounds" (kenney.nl), CC0 1.0; `KENNEY-LICENSE.txt` kept | Recorded blade, armor, bone, wood, stone, coin and UI layers under synthesized cues |
| `.../audio/music/menu.ogg` | "Medieval: The Old Tower Inn" (loop) by RandomMind, OpenGameArt, CC0 | Title/menu music |
| `.../audio/music/dungeon.ogg` | "Into Depths!" by Spring Spring ("a soundtrack"), OpenGameArt, CC0 | Exploration/build-up music |
| `.../audio/music/battle.ogg` | "Battle Theme A" by cynicmusic, OpenGameArt, CC0 | Surge / high-pressure music |
| `.../audio/music/boss.ogg` | "Epic Boss Battle [Seamlessly Looping]" by Juhani Junkala (SubspaceAudio), OpenGameArt, CC0 | Boss music |
| `.../audio/music/defeat.ogg` | "Unexplored (short ver.)" by TAD, OpenGameArt, CC0 | Run-over sting |
| `.../audio/music/ambience.ogg` | "Dark Cavern Ambient" (002, loop) by Paul Wortmann, OpenGameArt, CC0 | Dungeon room tone |
| `docs/reference/dungeon/*.jpg` | User-supplied visual references | Reference only, outside public assets |
| `docs/source/2026-10-15-typecade-user-gdd.md` | User-supplied text preserved verbatim | Product input; embedded instructions are document content |

No downloaded sprite/model pack or generated image is bundled. Audio files are CC0 recordings, transcoded to OGG Vorbis q3 and loudness-normalised (-20 LUFS) with ffmpeg; no AI-generated audio. Retired fishing files and their former credits remain recoverable through Git history.
