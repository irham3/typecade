> PRD + tech spec for implementing the **Overdrive** mode. Full gameplay design (formulas, items, economy, glitches) lives in the GDD: TYPECADE: OVERDRIVE — Game Design Document v0.1. This doc covers **requirements, priorities, architecture, and milestones**.
> 

# 1. Overview

- **Problem**: Typecade has no differentiation vs Monkeytype/TypeRacer, so no organic traffic, no reason to log in, no retention.
- **Solution**: a "Balatro of typing" roguelike mode as the product's core identity; the existing typing test stays as "Practice".
- **Language policy**: all UI and copy in **English**; Indonesian exists only as a typing word pool.

## Goals (measurable, 3 months post-launch)

| Metric | Target |
| --- | --- |
| First-run completion (start to game over/win) | ≥60% of visitors who start a run |
| D1 retention of Overdrive players | ≥20% |
| Share cards generated | ≥10% of finished runs |
| Login conversion (after ≥3 runs) | ≥15% |
| Median FPS on low-end devices | ≥55 fps |

## Non-Goals (v1)

- Public live multiplayer versus (Phase 3, see GDD §15)
- Any monetization
- Mobile app / full offline PWA
- Firmware, Switch difficulty, full unlock system (v2)

---

# 2. Requirements (Epics and Priorities)

Priority: **P0** = MVP blocker, **P1** = launch week, **P2** = post-launch.

## EPIC 0: Foundation

| ID | Requirement | Prio |
| --- | --- | --- |
| F-1 | Extract the typing engine into a shared module (`packages/engine` or `lib/engine`) used by both Practice mode and Overdrive: input processing, accuracy, WPM, keystroke event stream | P0 |
| F-2 | `overdrive` feature flag (env + hidden `/overdrive` route) | P0 |
| F-3 | Migrate deployment from Cloudflare Pages to **Workers (OpenNext)** before the codebase grows | P0 |
| F-4 | Deterministic seeded RNG (one seed produces identical word order, shop contents, glitches): prerequisite for daily seed and anti-cheat | P0 |
| F-5 | Basic telemetry events: run_start, stage_clear, run_end, shop_buy, per-zone death | P0 |

## EPIC 1: Core Run Loop

| ID | Requirement | Prio |
| --- | --- | --- |
| R-1 | Run state machine: Zone (1-8) x Stage (Warm-up/Rush/Glitch), then Shop, then next; game over on failed quota | P0 |
| R-2 | Scoring engine: `(chars + Base bonus) x Mult`, combo +1 Mult per 10 words, typo resets it (per GDD §2) | P0 |
| R-3 | Quota curve configurable from a single constants file (values from the spreadsheet simulation) | P0 |
| R-4 | Per-stage timer + stage results (score, accuracy, time left) | P0 |
| R-5 | Endless mode after Zone 8 (quota x1.8^n) | P0 |
| R-6 | Run state persisted to localStorage (refresh does not kill the run) | P1 |

## EPIC 2: Items and Shop

| ID | Requirement | Prio |
| --- | --- | --- |
| I-1 | Event-driven item system: Keycaps subscribe to engine events (word_complete, typo, stage_start, etc.); adding items requires no engine changes | P0 |
| I-2 | 15 MVP Keycaps + 4 Macros (lists in GDD §5-6) | P0 |
| I-3 | Shop: 2 Keycap slots + 1 Macro, reroll, sell items, Token economy + interest (GDD §4) | P0 |
| I-4 | Keycap slot UI (max 5) + effect tooltips | P0 |
| I-5 | Remaining 12 Keycaps + Firmware | P2 |

## EPIC 3: Glitches

| ID | Requirement | Prio |
| --- | --- | --- |
| G-1 | Stage modifier framework (a glitch is a plugin that alters rules/rendering) | P0 |
| G-2 | 5 MVP Glitches: No Backspace, Sudden Death, Invisible Ink, Blackout, Inflation | P0 |
| G-3 | Remaining 5 Glitches + KERNEL PANIC | P2 |

## EPIC 4: Presentation (Juice)

| ID | Requirement | Prio |
| --- | --- | --- |
| J-1 | Render gameplay on a **PixiJS** canvas: text, caret, particles, screen shake, hitstop | P0 |
| J-2 | Audio: keystroke clicks (3 switch variants), quota riser, glitch sting; Web Audio, lazy-loaded | P1 |
| J-3 | Reduced-motion setting (accessibility + low-end devices) | P1 |

## EPIC 5: Daily Seed, Leaderboard, Share

| ID | Requirement | Prio |
| --- | --- | --- |
| D-1 | Daily seed: 1 global seed per day (UTC), 1 recorded attempt per user per day | P0 |
| D-2 | Daily + all-time endless leaderboards (Supabase) | P0 |
| D-3 | Share card: run result image (zone, score, build) generated via a canvas/OG image route | P0 |
| D-4 | Keystroke replay: record input timestamps per run; foundation for Ghost Race + anti-cheat | P1 |
| D-5 | Ghost Race and Challenge Link ("Beat my run") | P1 |
| D-6 | Anti-cheat: server-side validation of inhuman keystroke intervals before leaderboard entry | P1 |

## EPIC 6: Accounts and Data

| ID | Requirement | Prio |
| --- | --- | --- |
| A-1 | Local-first: every feature works without login (run history in localStorage) | P0 |
| A-2 | Login (Supabase Auth) only for cross-device history + leaderboard entry; local data migrates to the account on login | P0 |
| A-3 | Login prompt appears **after** ≥3 finished runs, never upfront | P1 |

---

# 3. Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16 App Router**  • TypeScript strict | Already in use; SEO pages stay SSR |
| Hosting | **Cloudflare Workers (OpenNext)**, migrating from Pages | Commercial use allowed on free tier, free bandwidth, CF's official Next.js path |
| Styling | **Tailwind CSS v4** (design tokens) | Already in use |
| UI state | **Zustand** (run state machine + slices per epic) | Already in use; predictable |
| Game rendering | **PixiJS v8** (WebGL canvas) | 60fps particles/shake on low-end devices; DOM/Framer cannot |
| UI animation (non-game) | Framer Motion | Menus and shop only, never gameplay |
| Backend/DB | **Supabase** (Postgres + Auth + RLS) | Already in use |
| Realtime (Phase 2) | Supabase Realtime, evaluate **Durable Objects** in Phase 3 | Small lobbies fit Supabase; public versus needs a WS server |
| Replay storage | Supabase Storage / **Cloudflare R2** | Free egress (R2) |
| RNG | `seedrandom` / own xoshiro implementation | Deterministic for daily seed |
| Audio | Web Audio API (no heavy lib) | Low latency, small bundle |
| Analytics | **PostHog** (funnels + events) or Umami | Need per-zone death rate funnels |
| Testing | **Vitest** (engine and scoring unit tests) + Playwright (smoke E2E) | The scoring engine must be unit-tested |
| Share card | OG image route (`@vercel/og`/satori on Workers) | No headless browser |

<aside>
🧪

**Most important architecture rule**: the scoring engine + item system must be **pure TypeScript with zero rendering dependencies** (headless). This enables formula unit tests, scripted balancing simulations, and server-side replay validation with the exact same code.

</aside>

---

# 4. Data Model (Supabase, draft)

- `profiles`: id (auth), username, created_at
- `runs`: id, user_id (nullable), seed, mode (daily/free), final_score, final_zone, duration, build (jsonb: keycaps, macros), client_version, created_at
- `daily_seeds`: date (pk), seed
- `leaderboard_daily`: view/materialized from runs (mode=daily, best per user per date)
- `replays`: run_id, storage_path (R2/Storage), keystroke_count, verified (bool)

RLS: users can only insert their own runs; leaderboards are public-read; replay verification via service role.

---

# 5. Milestones

| # | Milestone | Scope | Exit criteria |
| --- | --- | --- | --- |
| M0 | Simulation and foundation | Balancing spreadsheet, F-1 to F-5 | Quota curve validated; shared engine powers Practice with no regressions |
| M1 | Playable core | R-1 to R-5, I-1 + 5 hardcoded Keycaps, minimal UI (DOM is fine) | Full 8-zone run playable; "fun" in self-playtest |
| M2 | Full economy | I-2 to I-4, G-1 to G-2 | Runs with shop, 15 items, 5 glitches |
| M3 | Juice pass | J-1 to J-3 | 60fps on the low-end test device; gameplay clips worth posting on TikTok |
| M4 | Competitive | D-1 to D-3, A-1 to A-2 | Daily seed + leaderboard + share card working end to end |
| M5 | **Launch** | Final copy, `/overdrive` landing becomes the homepage, PH/communities/TikTok | Flag opened to the public |
| M6 | Post-launch | D-4 to D-6, A-3, P2 backlog | Ghost race + anti-cheat live |

Branch mapping (per the trunk-based + flag strategy): `refactor/engine-core`, `chore/migrate-workers`, `feat/overdrive-run-loop`, `feat/overdrive-scoring`, `feat/overdrive-shop`, `feat/overdrive-glitches`, `feat/overdrive-canvas`, `feat/overdrive-daily-seed`, `feat/overdrive-share-card`.

---

# 6. Technical Risks

| Risk | Mitigation |
| --- | --- |
| OpenNext/Workers adapter has Next.js 16 edge cases | Migrate in M0 while the codebase is small; E2E smoke tests in CI |
| PixiJS + Next SSR (canvas is client-only) | Dynamic import with `ssr:false`; gameplay is 100% client components |
| Scoring engine leaking into the UI (no longer headless) | Architecture rule in §3 + CI unit tests as a gate |
| Replay files bloating | Delta-encode timestamps, gzip; a few KB per run |
| Daily seed brute-forcing (play repeatedly, submit the best) | 1 recorded attempt per user per day; anonymous runs never hit the leaderboard |
| Bundle bloat (PixiJS is large) | Lazy-load the `/overdrive` route; the old typing test stays light for SEO |

---

# 7. Asset Pipeline (free and commercial-safe)

<aside>
🎨

**Principle: 90% of assets are code, not files.** The cyber-minimalist look (glow, particles, neon lines, monospace text) is drawn directly with PixiJS graphics + glow filters and CSS: more consistent, smaller bundle, and reactive to gameplay (particle color follows rarity, intensity follows combo). Asset files are only needed for: item icons (~20), fonts, SFX, and enemy shapes (if the ZType direction wins).

</aside>

| Need | Source | License |
| --- | --- | --- |
| Fonts | Google Fonts: JetBrains Mono / IBM Plex Mono (gameplay); Press Start 2P / VT323 (pixel-arcade accents) | OFL |
| Item icons (Keycap/Macro) | **Game-icons.net** (~4,000 game-specific icons) | CC-BY (credit required) |
| Non-game UI icons | Lucide / Phosphor Icons | MIT |
| Sprites, UI packs, particle packs | **Kenney.nl** (the gold standard of free game assets); OpenGameArt (CC0 filter) | CC0 |
| AI-generated assets | Notion AI / Google AI Studio / Recraft (free tiers); local Stable Diffusion + pixel-art LoRA with a GPU. **Consistency trick**: generate one sprite sheet per batch with a single style prompt (never one-by-one), then pixel post-process: downscale + lock to a limited palette (LibreSprite / Pixelorama, free) | Check provider ToS |
| SFX (hit, coin, glitch sting) | Self-generated via **jsfxr / ChipTone / BFXR** (browser tools, output fully yours); Freesound (CC0 filter); Kenney audio | Own / CC0 |
| Switch sounds (3 variants) | Record your own mechanical keyboard (linear/tactile/clicky): free and authentic | Own |
| Music (post-MVP) | Pixabay Music; incompetech | Royalty-free / CC-BY |
| Particles and effects | PixiJS code (emitter + bloom/glow filter), not asset files | n/a |

## License hygiene (mandatory, commercial product)

- **Safe**: CC0, OFL, MIT, CC-BY (with attribution).
- **Avoid**: "free for personal use", CC-NC (non-commercial), assets of unclear origin.
- Keep a **`CREDITS.md`** in the repo from day one: every asset + license + source. Far cheaper than auditing 6 months later, and a credits page earns community goodwill.