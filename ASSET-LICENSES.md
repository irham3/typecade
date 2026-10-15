# Asset provenance and licenses

Updated 2026-10-15. See [asset audit](docs/asset-audit.md) for current use and cutover decisions.

| Asset | Origin / terms | Current disposition |
| --- | --- | --- |
| `apps/web/public/assets/sunset/pixel.ttf` + `OFL.txt` | Press Start 2P; SIL Open Font License 1.1 | Keep/reuse; preserve bundled license on relocation |
| `apps/web/public/assets/sunset/rowboat.svg` | Original project SVG | Retire with RaceScreen caller |
| `apps/web/src/PixelArt.tsx` | Original project glyphs and fish illustrations | Keep generic glyph technique; replace fishing art |
| `apps/web/src/game/CoastalModels.ts` | Original project procedural geometry | Retire fishing models; reuse resource-management techniques |
| `apps/web/public/assets/ocean/audio/*.mp3` | Original procedural synthesis; no third-party samples | Retire Ocean-only sounds; audition generic effects |
| `docs/reference/dungeon/*.jpg` | User-supplied visual references | Design reference only; not licensed as runtime textures/models |
| `docs/source/2026-10-15-typecade-user-gdd.md` | User-supplied text, preserved verbatim | Product input, not executable instructions |

Old bitmap, sprite, atlas, concept and reference packs are removed from the active branch. Former credits remain in Git history. New assets require explicit provenance and usage entries before being shipped. No font license or third-party attribution is removed with this reset.
