# Typecade

Typecade is being redesigned as a **2.5D action-typing roguelike with endless survival**. A blue knight dashes to enemies as their words are completed, collects XP, chooses upgrades by typing and faces recurring armored bosses in a ruined castle.

**Status — 2026-10-15:** planning reset and asset audit. The web application still runs the previous fishing version. Dungeon combat and its other modes are specified, not implemented. The user requested planning and asset preparation before coding on `refactor/roughlike-survival-2.5d`.

## Start with the plan

- [Design index](docs/README.md): authority, reference images and document map.
- [Game design](docs/game-design.md): endless loop, targeting, Tab skills, level drafting and boss phases.
- [Requirements](docs/prd.md) and [delivery checklist](docs/todo.md): all five modes and verifiable gates.
- [Interaction design](docs/design.md), [art bible](docs/art-bible.md) and [asset audit](docs/asset-audit.md).
- [Architecture decisions](docs/decisions.md) and [historical migration log](docs/MIGRATION-LOG.md).

## Run the existing application

```sh
npm install
npm run dev:rooms
npm run dev
```

Vite proxies `/api` to the local Cloudflare Worker on port 8787. Optional account configuration is documented in `env.example`. Local saves work without credentials. Deployment identifiers and database schemas remain unchanged during planning.

## Verification commands

```sh
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run typecheck:rooms
```

Current tests exercise the legacy application. New combat, input, multiplayer and resource checks are specified in the checklist and must pass against the dungeon implementation before release.

## Existing foundation

React, TypeScript and Vite own the shell; Three.js supplies the lazy-loaded renderer. Pure TypeScript packages contain typing, content, contracts and rules. Cloudflare Durable Objects provide real WebSocket rooms; Supabase stores previous Adventure account data. Keep those saves safe while introducing separately versioned dungeon data.

No Phaser or Pixi runtime is allowed. No new dependency, backend, asset generator or desktop wrapper is introduced by this planning change.
