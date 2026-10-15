# Typecade asset credits

Updated 2026-10-15 for dungeon planning. The dungeon references are design input; the existing runtime is still fishing until implementation.

- Four reference images supplied by the user are stored unchanged under `docs/reference/dungeon`. They are not bundled runtime art. Their inclusion does not establish rights to redistribute them as game assets.
- Press Start 2P comes from the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/pressstart2p), under SIL Open Font License 1.1. Keep `apps/web/public/assets/sunset/OFL.txt` beside the bundled font, including when relocating it.
- Existing `PixelArt.tsx` glyphs, `CoastalModels.ts` procedural models and `assets/sunset/rowboat.svg` are original project work. Fishing-specific art is marked for retirement with its callers.
- Twelve existing MP3 files are project-owned procedural sounds without third-party samples. Ocean-only sounds are marked for removal; generic effects require listening review before dungeon reuse.

Full inventory and retirement dependencies: [asset audit](docs/asset-audit.md). Old Ocean/Overdrive artwork and production references removed from this branch remain recoverable through Git history. No new dungeon runtime assets or production screenshots are claimed by this planning change.
