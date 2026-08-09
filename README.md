<div align="center">
  <a href="https://typecade.com/">
    <img height="48" src="./public/typecade-logo.svg" alt="Typecade" />
    <br />
    <strong>PLAY TYPECADE</strong>
  </a>
</div>

<br />

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PixiJS](https://img.shields.io/badge/PixiJS-E72264?style=for-the-badge&logo=pixiv&logoColor=white)](https://pixijs.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

# Typecade

Typecade combines a typing test with a keyboard-first roguelike called **Overdrive**. Practice keeps the focused speed-and-accuracy test. Overdrive turns each word into an attack, lets players assemble Keycap builds, and raises the quota across an eight-Zone run.

Overdrive remains behind the `NEXT_PUBLIC_OVERDRIVE` feature flag while the team tests balance, performance, and first-run completion. Its temporary public route is `/overdrive`; when the flag is enabled, the main navbar also shows an Overdrive link. The route should become the homepage only after the M5 launch gate is met.

## Overdrive

The run uses one deterministic seed for word order, shop offers, and Glitches. A free run can continue into Endless after Zone 8. Daily mode derives one seed per UTC day and language.

Each Zone contains three stages:

1. **Warm-up**, with a 75-second ceiling.
2. **Rush**, with a 70-second ceiling.
3. **Glitch**, with a 65-second ceiling and a stage modifier.

Meeting the Quota clears the stage at once and opens the Shop after a short result ribbon. Players spend Tokens on two Keycap offers and one Macro offer, reroll stock, sell items, and carry a build of up to five Keycaps.

### Scoring and Overdrive charge

Clean words use this scoring order:

```text
(characters + Base bonuses) x Mult x final multipliers
```

- Ten consecutive clean words add `+1 Mult`.
- Accepted characters add `3` Overdrive charge.
- A typo removes `15` charge and applies the current Zone's scoring penalty.
- Full charge adds a final `x2` Overdrive Strike.
- Zones 1 and 2 release the Strike on the next clean submission. Zone 3 and later hold it until the player submits a complete clean word with Enter.

### Beginner route

Zone 1 starts with single keys, then two-key signals, then three-letter words. Zone 2 introduces short words and Space execution. Two protection systems keep this route usable for hunt-and-peck players:

- **Focus Pause** stops the stage clock after four seconds without input in standard Zones 1 and 2.
- **Aegis Protocol** adds 30 seconds when the player misses a Quota in those Zones. A rescued stage earns no time bonus.

Zone 2 grants Base-only Aegis Recovery to corrected dirty words. From Zone 3 onward, a dirty word scores zero and an unmet Quota ends the run.

### Current content

- 8 Zones, 3 stages per Zone, and Endless progression at `x1.8` Quota per later Zone.
- 15 Keycaps: WASD, Vowel Magnet, Longshot, Sprinter, Second Wind, Copper Key, Home Row, Punctuator, Combo Battery, Overclock, Double Tap, Snowball, Interest Bank, Glass Keycap, and Vampire.
- 4 Macros: Escape, Time Freeze, Quota Slash, and Insurance.
- 5 Glitches: No Backspace, Sudden Death, Invisible Ink, Blackout, and Inflation.
- English and Indonesian word pools. Interface copy stays in English.
- Local run recovery, local personal bests, typed telemetry events, and a downloadable or native share card.
- Articulated Signal Siege combat with the Keystone Warden, three enemy classes, letter-node attacks, Aegis blocks, and Overdrive effects.

Daily leaderboard persistence, account-linked run history, and replay validation remain server-side launch work in the PRD.

## Practice

Practice provides the existing typing test with real-time WPM and accuracy, English and Indonesian word pools, punctuation and number modifiers, scrolling text, and saved profile statistics. Overdrive stays isolated behind its route and flag so Practice can retain its current behavior.

## Architecture

| Area | Responsibility |
| --- | --- |
| `lib/engine` | Pure TypeScript typing and Overdrive rules with no React, PixiJS, or DOM imports |
| `lib/engine/overdrive` | Seeded run state, scoring, progression, economy, Keycaps, Macros, and Glitches |
| `features/overdrive` | Zustand integration, keyboard input, persistence, menus, Shop, HUD, and run screens |
| `features/overdrive/canvas` | PixiJS combat scene, articulated rigs, choreography, and effects |
| `app/overdrive` | Feature-gated Next.js route |
| `lib/telemetry` | Typed gameplay event envelopes |

Next.js 16 serves the App Router application. Tailwind CSS v4 supplies design tokens, Framer Motion handles menu and Shop transitions, and PixiJS renders gameplay combat. Supabase supports profiles and existing competitive data. OpenNext packages the application for Cloudflare Workers.

## Local development

Install dependencies:

```bash
npm install
```

Create `.env.local` and enable Overdrive:

```dotenv
NEXT_PUBLIC_OVERDRIVE=true
```

Supabase-backed screens also read these public variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000/overdrive](http://localhost:3000/overdrive) for Overdrive or [http://localhost:3000](http://localhost:3000) for Practice. Until launch, `/overdrive` is the intentional feature-flagged route, not the homepage.

## Tests

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Vitest covers the headless engine, scoring, RNG, run progression, Shop, items, Glitches, telemetry, and combat helpers. Playwright covers Overdrive flow, layout, progression, and presentation behavior.

## Cloudflare Workers deployment

The production target is Cloudflare Workers through OpenNext. A Cloudflare Pages build expects a static `out` directory and cannot deploy this Worker bundle.

Build the Worker bundle:

```bash
npm run build:worker
```

Preview it through the OpenNext adapter:

```bash
npm run preview
```

Build and deploy from a configured local Wrangler session:

```bash
npm run deploy
```

Use these commands for Cloudflare Workers Builds:

| Setting | Value |
| --- | --- |
| Build command | `npm run build:worker` |
| Deploy command | `npx wrangler deploy` |
| Root directory | Repository root |

The Worker reads its entry point, static asset directory, compatibility flags, service binding, and observability settings from `wrangler.jsonc`.

## Project documentation

- [`docs/game-design.md`](./docs/game-design.md) defines gameplay rules, item effects, economy, balance, and MVP scope.
- [`docs/prd.md`](./docs/prd.md) defines requirement IDs, priorities, architecture, data, and milestones.
- [`docs/design.md`](./docs/design.md) defines visual tokens, layouts, motion, audio, and accessibility.
- [`CREDITS.md`](./CREDITS.md) records asset sources and licenses.

Read the three design documents before changing Overdrive. Their values and item names take precedence over code and this README.

## Bugs and feature requests

Open a GitHub issue or discussion with reproduction steps, expected behavior, browser details, and screenshots when the problem affects layout or rendering.
