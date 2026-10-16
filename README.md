# Typecade — The Ruined Keep

A live 2.5D dungeon typing roguelike. Type an enemy word to dash and strike, collect XP, draft a build by typing its keyword and face a recurring armored boss. Endless Survival, Typing Dojo, Castle Sprint, Bridge Clash and Co-op Raid share the dungeon presentation.

The fishing runtime, boat, sea audio and old renderer contracts are retired. The redesign uses the existing React/TypeScript/Vite, Three.js, native Web Audio and Cloudflare Durable Object stack, with no new runtime dependency. The four supplied JPGs are design references, never game backgrounds.

## Run locally

```sh
npm install
npm run dev:rooms
npm run dev
```

Vite proxies `/api` to the Worker on port 8787. Local survival checkpoints need no account. Optional Supabase public configuration is in `env.example`; never put a service-role key in client configuration. Dungeon account storage uses a separate schema; previous account saves remain intact. See [database setup and verification](supabase/README.md).

## Play

- **Endless:** choose any visible word by its exact first letter; complete it to move and strike. Backspace cancels a lock. Tab slows time and opens typed skills without losing the word prefix. Escape pauses. Level drafts freeze time. Boss armor breaks into a ten-second typing phase.
- **Dojo:** configure EN/ID words, passages or custom text; the dummy gives feedback without survival damage. Editable/native input and optional on-screen keys remain available.
- **Castle Sprint:** create/share a room; two or more real players ready up. Tactical obstacle words affect distance through two laps.
- **Bridge Clash:** two or more real players attack clockwise, build shields and cast skills. HP and outcomes belong to the room server.
- **Co-op Raid:** at least four players, with two DPS, one healer and one tank. Words apply role effects against five boss layers; the party shares three revives.

The renderer shows the local knight and up to five actual nearby peers. Standings retain all participants. A 100-connection local check is not a claim of 100 rendered actors or WAN capacity. Solo community records are explicitly browser reported; multiplayer results are validated by the room server.

## Verify

```sh
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run lint
npx tsc --noEmit --incremental false
npm run typecheck:rooms
```

For the real-time resource profile, build and run `npm run preview -- --port 4173` in one terminal, then `npm run profile:dungeon` in another. It runs 900 active simulation seconds and writes hardware, frame intervals, entity/draw counts, heap retention and screenshots under `test-results/dungeon-profile`. `PROFILE_URL` selects another local preview; `PROFILE_SECONDS` shortens a diagnostic run. Do not substitute a short diagnostic for the full gate.

Current results and remaining physical-device/WAN limits: [migration log](docs/MIGRATION-LOG.md) and [delivery checklist](docs/todo.md). Architecture and retirement audits: [decisions](docs/decisions.md). Product rules, visual references and screen specifications: [design index](docs/README.md).
