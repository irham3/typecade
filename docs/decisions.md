# Dungeon redesign — architecture and migration decisions

Revision: 2026-10-15. These replace the former Overdrive session notes and Ocean milestone restrictions. Planning only; no runtime change in this reset.

## D-01 — Product reset

The direct user request cancels fishing. Preserve the supplied GDD verbatim, use normalized [game design](game-design.md) as implementation authority, and remove stale plans/reference packs. Keep the migration log explicitly historical; past passing tests are not dungeon verification. No new branch is needed.

## D-02 — Reuse the working stack

Keep React/TypeScript/Vite, Three.js and native audio, Vitest/Playwright, existing Worker/Durable Object WebSocket transport and optional Supabase account facilities. No dependency change is required for planning. Phaser, Pixi, Next/OpenNext runtime, GSAP, Framer Motion, Howler and other retired packages stay retired.

The GDD's Colyseus/PartyKit examples are implementation suggestions. Existing server transport already supports real rooms; use it before adding a second server framework. Event-only synchronization does not establish anti-cheat: each mode needs authoritative input/timing/result validation.

## D-03 — Domain, shell and renderer boundaries

Extend existing headless packages for seeded combat, input, content, progression and snapshots. Reuse typing helpers and seeded RNG without dragging fishing contracts into new domain types. Reuse event bridge patterns; inventory every subscriber and fixture when changing event payloads.

React owns keyboard state, text labels, menus and accessibility. Three.js receives typed snapshots/events and owns models, projections, effects and camera. The renderer never applies combat damage. A bounded fixed-step domain clock is independent of render FPS. Keep key acceptance low latency without allowing duplicate input from the native fallback.

## D-04 — Input accessibility over literal blueprint

Direct keyboard input is scoped to an active game, with native composition/touch/accessibility fallback using the same event path. Do not follow the source's blanket ban on HTML input where that would break IME, forms or assistive access. Tab-to-cast applies only in arena; forms and paused menus retain normal navigation.

## D-05 — Persistence isolation

Do not clear localStorage, rewrite old save versions or reuse Ocean account XP/achievements as dungeon results. New versioned dungeon checkpoints include RNG/simulation/input state and validate at load. Preserve previous valid data on migration errors. Account schema changes require explicit dungeon validation; no database mutation or deployment happens in planning.

## D-06 — Asset deletion follows caller retirement

Remove unused documents/reference art now. All 15 remaining public asset files have active callers or a required font license; record them in [asset audit](asset-audit.md). Keep these files until the matching runtime caller is retired, then delete incompatible files in that same change. This avoids known audio/image 404s between planning and coding.

Reuse the licensed font and audit compatible effects. Do not retain fishing art in the completed dungeon under a renamed file. References stay outside the runtime bundle. No generated/new game asset is claimed in this phase.

## D-07 — Performance supersedes screenshot spectacle

Use low-resolution pixel rendering, shared/instanced geometry, bounded pools and recycled chunks. Start without a global bloom chain or shadow maps. Measure before adding effects; provide Reduced Effects and adaptive resolution/rate. Preserve real actor motion and game feedback within the documented caps.

## D-08 — Delivery and evidence

Deliver in ordered gates without dropping Dojo/PvP/raid from scope. Do not enable a mode as complete until independent real-client validation passes. Keep unfinished features clearly unavailable. Old race capacity checks cannot prove new mode behavior, native mobile performance or WAN stability.

For runtime changes run the documented unit/build/E2E matrix, coverage, lint and both TS checks. For the current docs/assets preparation, verify links, byte-identical inputs, asset references, runtime diff and production build; any additional baseline tests must be labelled legacy.

## Retirement and boundary audits

Run with ripgrep; exit 1 means no matches and is the expected clean result. Exclude tests when checking production logic and distinguish historical documentation from runtime.

```powershell
rg -n -i 'phaser|pixi' package.json package-lock.json apps/web/src packages
rg -n -e 'Math\.random\s*\(' -e 'from.*(react|three|phaser)' -e '\b(document|window|HTMLElement|HTMLCanvasElement|HTMLAudioElement)\b' packages --glob '!*.test.*'
rg -n -i 'fishing|rowboat|lighthouse|leviathan|captain|ocean|sunset' apps/web/src packages apps/web/public
```

The first two audits must remain clean. The third intentionally finds legacy callers now and must be resolved at M7; review legitimate historical/data-compatibility references explicitly. Check public asset URLs, dynamically assembled audio keys and CSS font paths in addition to literal imports.
