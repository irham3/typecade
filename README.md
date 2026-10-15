# Typecade Ocean

A pixel 2.5D typing and fishing game built with React, TypeScript, Vite and Three.js. Adventure starts on a sunset coast with a wooden rowboat, an animated fisherman, a lighthouse island and a living shoal.

Adventure is endless. Each voyage has nine regular encounters across three coastal zones, followed by the Crown Leviathan. Catch the boss to secure a checkpoint and refit for the next voyage. XP, captain levels, six skill unlocks, equipment choices and the permanent collection carry forward.

Before the first keystroke, choose one of three local species and a Word, Sentence or Passage challenge. Six fish remain visible in the sea. Short challenges grant proportionally smaller rewards; bosses require a full passage. The target locks when typing starts. Indonesian gameplay text stays in content packs; the interface uses English.

Practice has editable typing, language and challenge settings, and a touch keyboard. Multiplayer keeps its existing room protocol and DOM fleet presentation. Adventure account saves, achievements and an XP leaderboard use the configured Supabase project.

## Run locally

```sh
npm install
npm run dev:rooms
npm run dev
```

Vite serves the game and proxies `/api` to the local Worker on port 8787. The public Supabase URL and anonymous key use the variables documented in `env.example`. Account features remain unavailable when those variables are not configured; local Adventure saves still work.

## Verify

```sh
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run typecheck:rooms
```

E2E tests run the production Worker in Chromium, Firefox and WebKit. The sunset checks cover target selection, word catches, text format changes, label separation, responsive layouts and repeated renderer teardown. The project retains its 100% unit/browser coverage gate.

## Architecture

- `packages/typing-engine`: headless typing sessions, metrics and input rules.
- `packages/game-rules`: seeded fishing encounters, challenge selection, skills, endless progression and saves.
- `packages/content`: the ten-species roster, routes, skills and text packs.
- `packages/race-rules`: headless multiplayer race validation.
- `apps/web/src`: React shell, account services, native audio and lazy Three.js renderer.

The renderer caps its drawing buffer at 640 × 480 and its animation rate at 30 FPS. Static geometry is merged by palette material, foam uses 80 fixed instances and splashes use a pool of 64. Pause and hidden tabs freeze animation; Reduced Effects uses static scenery with discrete gameplay updates. Leaving for Practice or Multiplayer disposes the Adventure context, render target, geometry, materials, instances and audio sources.

The former Next.js application, unused animation/UI dependencies, bitmap environment plates, sprite atlases and obsolete asset-generation scripts are removed. Historical design and verification documents remain in `docs`; their old screenshots are evidence of previous versions and are not shipped with the game.

Current design: [Ocean design](docs/game-design(new).md), [art bible](docs/art-bible.md), [migration log](docs/MIGRATION-LOG.md).
