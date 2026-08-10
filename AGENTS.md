# TYPECADE: OVERDRIVE — Project Rules

## Source of truth
Three docs govern this project. Read them before writing any code, and re-read the relevant section before each task:
- `docs/game-design.md` — gameplay design: score formula, run structure, quota curve, all Keycaps/Macros/Glitches, economy, balancing targets, MVP scope (§13)
- `docs/prd.md` — requirements with IDs (F-1..A-3) and priorities (P0/P1/P2), tech stack, data model, milestones M0-M6, risks
- `docs/design.md` — visual/motion/audio spec: color tokens, typography, per-screen layouts, motion durations/easings, audio events, accessibility

If code and docs disagree, the docs win. If a doc value seems wrong, stop and ask; do not improvise a new value.

## Hard rules
1. **Headless engine.** The scoring engine, item system, and run state machine are pure TypeScript with zero rendering or framework imports. No React, no PixiJS, no DOM APIs inside engine code. Everything else subscribes to engine events.
2. **Design tokens only.** Every color, size, spacing, duration, and easing comes from `docs/design.md`. No hardcoded hex values or magic numbers in components. Spacing scale is 4/8/12/16/24/32/48; anything else is a bug.
3. **English everywhere.** All UI copy, item names, comments, commit messages, and identifiers in English. Indonesian appears only inside word-pool data files.
4. **Feature flag.** All Overdrive code lives behind the `overdrive` flag (env + `/overdrive` route). Never break the existing typing test (Practice); it must pass existing behavior unchanged.
5. **Deterministic RNG.** All randomness (word order, shop contents, glitches) flows from a single seeded RNG instance. `Math.random()` is banned in game logic.
6. **MVP scope is locked** to game-design.md §13. Do not implement Firmware, Switch difficulty, Copycat, KERNEL PANIC, cosmetics, or anything marked v2/P2 unless explicitly asked.
7. **Tests before juice.** Engine and scoring logic get Vitest unit tests in the same PR. UI polish never lands before its logic is tested.

## Stack (fixed, see prd.md §3)
Next.js 16 App Router + TS strict, Tailwind v4, Zustand, PixiJS v8 (gameplay canvas only, dynamic import ssr:false), Framer Motion (menus/shop only, never gameplay), Supabase, Cloudflare Workers via OpenNext, Web Audio API, Vitest + Playwright.

## Workflow
- Trunk-based: small branches (`feat/overdrive-*`), conventional commits, PR per requirement ID when possible.
- Reference requirement IDs from prd.md in commits and PRs (e.g. "feat: run state machine (R-1)").
- Item names, effects, and numbers must match game-design.md §5-6 exactly, character for character.