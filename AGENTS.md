# TYPECADE: OCEAN TYPING RPG - Project Rules

## Source of Truth

For the Ocean migration branch, the governing design is:

- `docs/game-design(new).md` - Ocean Typing RPG product, gameplay, architecture, asset, audio, and testing spec.
- `docs/art-bible.md` - current visual production constraints for the Milestone 0/1 asset set.
- `docs/MIGRATION-LOG.md` - migration decisions, substitutions, self-audits, and verification history.

Older Overdrive docs may remain for historical context only. If they conflict with the Ocean design, the Ocean design wins.

## Current Scope

Implement Milestone 0 and Milestone 1 only:

- Shallow Coast fishing expedition.
- Three zones, nine regular fish, one boss.
- Six MVP temporary skills.
- Typing engine, fishing rules, VFX/audio hooks, checkpoints, permanent collection.
- Local persistence as the account/cloud-save stand-in.

Do not implement Milestone 2+ work in this branch:

- No Colyseus server.
- No ranked matchmaking or Boat Duel.
- No Supabase Auth/Postgres/RLS.
- No match history backend.
- No `apps/game-server`.

## Architecture Rules

1. Headless typing and fishing logic stays in packages with zero React, DOM, or Phaser imports.
2. React owns shell UI, HUD state, menus, collection, settings, local persistence, and accessibility controls.
3. Phaser owns the game canvas, sprites, animation, particles, tweens, camera effects, and audio playback.
4. React and Phaser communicate through typed domain events only; React must not reach into Phaser scene internals.
5. Random gameplay decisions must use seeded deterministic RNG. `Math.random()` is banned in game logic.
6. Indonesian words/passages belong in content packs; UI copy and identifiers stay English.
7. New source must stay inside the Vite/workspace structure: `apps/web` and `packages/*`.
8. Texture atlases, bounded particles, lazy-loaded renderer code, and reduced-effects fallback are preferred for performance.

## Stack

React + TypeScript + Vite for the web shell, Phaser 4 for rendering, Vitest for package tests, Playwright for browser/visual smoke checks.

The previous canvas renderer is retired for this branch. Do not add its dependency or source back.

## Verification

Before handing off meaningful changes, run:

- `npm run test`
- `npm run build`
- `npm run test:e2e`
- Run the renderer-retirement audit recorded in `docs/MIGRATION-LOG.md`.
