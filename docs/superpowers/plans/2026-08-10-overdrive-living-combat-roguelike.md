# Overdrive Living Combat & Roguelike Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Overdrive feel like a living typing-combat roguelike: every accepted character has a readable attack beat, every stage has a distinct visual identity, every purchase changes the player's next decision, and desktop shop copy never clips or overflows.

**Architecture:** Keep the existing headless engine and canonical scoring/economy rules as the authority. Add a semantic presentation pipeline between engine events and Pixi choreography, then split choreography into deterministic encounter sequences (character contact, word resolution, pressure attack, Overdrive, Aegis, stage clear). Build identity is exposed through an exact score trace and a bounded shop/build presentation layer, while visual variety comes from stage presets, authored rig clips, reactive arena layers, and pooled effects—not from hidden rule changes or uncontrolled particle spam.

**Tech Stack:** Next.js 16 App Router, strict TypeScript, PixiJS v8 (gameplay canvas only), Zustand, Vitest, Playwright, Web Audio API, existing Overdrive event scheduler/contact ledger, Tailwind v4 tokens from `docs/design.md`.

## Global Constraints

- `docs/game-design.md`, `docs/prd.md`, and `docs/design.md` remain the source of truth. Any requested mechanical change to Quota, score formula, item values, Glitch behavior, or the 8-zone x 3-stage MVP must be approved as a documentation change before code changes.
- Preserve the current Overdrive MVP scope: the 15 Keycaps, 4 Macros, 5 Glitches, Focus Pause, Aegis Protocol, Overdrive Strike, daily seed, and endless mode. Firmware, Switch difficulty, Copycat, KERNEL PANIC, cosmetics, and the unimplemented v2 item pool stay out of this work.
- New character variety in this plan is visual/choreographic unless a separate GDD amendment explicitly adds a new mechanic. Existing Packet Stalker, Needle Wraith, and Null Crown rules remain unchanged.
- Do not copy Star Rune assets, code, names, or branding. The reference is used only for the design principle that each keystroke should produce a legible action and that abilities should be shown as short, readable demonstrations. See the public reference page: https://www.starrune.net/.
- Engine code remains pure TypeScript: no React, PixiJS, DOM, Zustand, Supabase, Workers, or `Math.random()` in `lib/engine/overdrive`.
- All UI copy, identifiers, comments, and item names remain English. Indonesian remains limited to word-pool data.
- Use only design tokens and the spacing scale `4, 8, 12, 16, 24, 32, 48`. No hardcoded gameplay colors, arbitrary spacing, layout animation, or gameplay Framer Motion.
- The event pipeline is deterministic and replayable. Source sequence, run ID, target ordinal, character index, seed, and stage preset must be enough to reproduce presentation decisions.
- Input is never blocked by effects, transitions, shop purchase animation, or a target defeat animation. The next target is typeable immediately; presentation catches up independently.
- Reduced motion keeps pose changes, contact readability, color/state changes, and popup fades while disabling shake, hitstop, particles, background pulse, and count-up as specified in `docs/design.md`.

---

## 1. Experience contract and acceptance gates

The redesign is successful when a new player can see the causal loop without reading a manual:

1. A printable key visibly launches a Warden attack and breaks the matching signal node.
2. A clean word produces an execution beat, target defeat, score popup, and a compact equation showing where the score came from.
3. A typo produces a readable misfire state and an honest outcome (`AEGIS RECOVERY — BASE ONLY` in Zone 2 or `CORRUPTED — 0 SCORE` in Zone 3+), without screen shake.
4. Overdrive readiness changes the arena and attack language before it changes the score multiplier.
5. At 75% Quota the stage enters `OVERRUN`; at 90% it shows the approximate score remaining. No hidden difficulty adaptation is introduced.
6. A stage clear leaves the arena mounted for the 900ms result ribbon, then opens a one-viewport shop.
7. Buying an item visibly installs it into the build, shows its trigger/effect, and previews the next stage impact using the canonical engine rules.
8. Every item effect is readable at desktop and compact breakpoints; long copy wraps or scrolls inside its card instead of clipping the layout.

### Hard release gates

- Accepted-character cue starts within 50ms and reaches contact within 90ms; those timings are recorded by the existing contact ledger.
- No horizontal overflow and no clipped item effect at `390×844`, `820×1180`, `1366×768`, `1440×900`, or `1920×1080`.
- Worst-case combo and effect load stays at 60fps on the low-end test device with a maximum of 200 live pooled effects and 24 ambient motes.
- All 133+ existing unit tests remain green; new engine/presentation logic has Vitest coverage before UI polish.
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run build:worker`, and the targeted Playwright viewport suite pass.
- A reduced-motion run remains fully understandable without particles, shake, hitstop, background pulse, or score count-up.

## 2. Design pillars

### 2.1 Signal Combat: one keystroke, one action

Use an authored attack grammar rather than a single repeated projectile:

| Input/engine event | Warden verb | Target response | HUD/audio response |
| --- | --- | --- | --- |
| `character_accepted`, first character | `signal-lock` | First node lights, locks, and cracks | Short shot click + cyan contact ring |
| `character_accepted`, middle character | `arc-dash` | Warden crosses to the node; node breaks into a directional shard | Layered shot click, no text popup |
| `character_accepted`, third-or-later chain index | `chain-strike` | Contact trail joins previous node and uses the next authored lane | Combo-colored trail according to design tier |
| Final accepted character before clean submit | `execution-ready` | Target enters a readable stagger/weak-point pose | Rail copy changes to `SPACE — EXECUTE` or the canonical Zone 3 prompt |
| Clean word resolution | `execution` | Target defeat clip, 18 fragments, score popup | Impact layer, equation for 700ms |
| Dirty word resolution | `misfire` | Target phases/recoils; no fake hit or score | Red underline, outcome copy, no ordinary-word shake |
| Full charge + canonical release input | `overdrive-release` | Full-height impact column, snap-return afterimage | Charge lock, rising cue, final multiplier shown in equation |
| Enemy pressure telegraph | `pressure-attack` | Enemy anticipation, directional line, Warden block/recover | Warning color + attack cue; never resembles ambient motion |
| Zone 1–2 timeout rescue | `aegis-block` | Distinct shield plane fractures; lethal attack is visibly deflected | `+30S`, rescue counter, cyan recovery wave |
| Quota reached | `quota-break` | Bar pulses, target exit, arena settles | Quota chime, 50ms hitstop, 6px stage-clear response only |

The first three verbs intentionally give the player the “every stroke is an action” feeling from the Star Rune reference while retaining Typecade’s own signal-node and score rules. The verb is selected by deterministic word/target metadata, never by random animation.

### 2.2 Stage identity without rule drift

Create a `StagePresentationPreset` for each canonical stage family and threat band. A preset controls palette, parallax mix, target lane choreography, clip emphasis, audio layer, and VFX budget; it does not alter Quota, score, item hooks, Glitch rules, or word order.

- `warm-up-protected`: Packet Stalker relay geometry, slow cable parallax, cyan/green signal accents, generous entry spacing.
- `rush-protected`: Needle Wraith flight paths, brighter lane traces, pink combo accents, quicker target promotion.
- `glitch-protected`: Null Crown training silhouette, fractured arena rim, violet warning stamp, no mechanical Glitch in Zone 1.
- `pressure`: denser machinery layers, longer attack telegraphs, red threat accents, no extra health bar.
- `overclocked`: alternating lane choreography, stronger charge trails, higher contrast target entry, still within the same word/scoring contract.
- `lethal`: sparse arena, hard silhouette edges, yellow/red quota state, authored pressure attacks and Glitches remain the only danger sources.

Zone 1’s literal beginner route remains intact: one key → two-key signal → three-letter word, with automatic execution. Visual intensity escalates around the player’s learning path instead of forcing a full-word timer immediately.

### 2.3 Build legibility: make the Balatro-like payoff causal

Do not change the canonical formula. Expose it:

`Base (characters + Base bonuses) → Base multipliers → additive Mult → Mult multipliers → final multipliers → floored word score`

Every clean submission renders one compact equation and stores a structured trace. Every purchased item displays its trigger, the current-stage proc count, and a next-stage preview delta. If an effect cannot be measured exactly without changing the rules, label it `estimated contribution` rather than attributing points to the wrong item.

### 2.4 Spectacle budget, not visual noise

Use the existing pooled effect architecture. Ordinary accepted characters get one contact cue and one target response; only word clear, Mult up, Overdrive, Aegis, Glitch intro, and stage clear receive larger effects. Identical simultaneous item shapes merge and restart, as required by `docs/design.md`.

## 3. Stage rhythm and encounter director

Add a deterministic intensity director that consumes stage progress, not elapsed time alone:

| Band | Trigger | Presentation change | Mechanical change |
| --- | --- | --- | --- |
| `ready` | Before first printable key | Scrim, visible combatants, `TYPE TO ENGAGE` | Timer waits for first printable key |
| `engage` | 0–50% Quota | One active target, two low-contrast previews, regular attack grammar | Canonical scoring only |
| `surge` | 50–75% Quota or combo tier x4+ | Faster authored lane rotation, stronger contact trails, restrained quota riser | No hidden multiplier or WPM scaling |
| `overrun` | 75–90% Quota | `OVERRUN` rail state, arena rim pulse, target cadence/audio riser | Canonical rules unchanged |
| `finish` | 90–100% Quota | Score-needed readout, final-word focus, low-contrast previews fade | Stage clears immediately on Quota |
| `resolution` | Quota reached or stage failure | Quota break/run-over sequence and 900ms ribbon | Shop/run-over state transition |

The director owns stage-local state (`band`, `preset`, `nextTargetLane`, `lastResolvedTarget`) and emits presentation beats. It never owns score, timers, RNG, or item effects.

### Encounter sequence contracts

Create named sequence modules under `features/overdrive/canvas/choreography/sequences/`:

- `character-contact.ts`: consumes `character_accepted` envelope; chooses `signal-lock`, `arc-dash`, or `chain-strike`; schedules rig clip, projectile/line, node break, contact ledger cue/hit.
- `word-resolution.ts`: consumes clean/dirty submission; schedules `execution`, `misfire`, equation, score popup, item acknowledgement, and target promotion.
- `pressure-attack.ts`: consumes deterministic pressure telegraph; schedules enemy anticipation (minimum 240ms), directional line, Warden response, and recovery.
- `overdrive-release.ts`: consumes the canonical Overdrive event; schedules charge lock, `overdrive` clip, 78%-gap impact column, audio layer, and snap-return within 320ms.
- `aegis-rescue.ts`: consumes the canonical rescue event; schedules lethal attack, shield fracture, block pose, `+30S`, rescue counter, and cyan recovery wave.
- `stage-resolution.ts`: consumes quota-clear/failure; schedules quota pulses, hitstop/shake only where allowed, ribbon handoff, and stage-local cleanup.
- `sequence-types.ts`: declares `SequenceContext`, `SequenceOutput`, `PresentationAnchor`, and cancellation rules. Every output carries source sequence, target ordinal, character index (when applicable), due time, priority, and reduced-motion policy.

Refactor `combat-director.ts` into a small facade that wires presets, sequences, `ContactLedger`, actor pools, and scene state. Keep the facade under 300 lines; sequence modules contain the choreography detail.

## 4. Character and enemy variety plan

### Warden

Use the existing articulated Warden rig clips (`idle`, `ready`, `chain-1`, `chain-2`, `chain-3`, `dash`, `execute`, `block`, `hurt`, `recover`, `overdrive`). Add authored pose emphasis per preset rather than swapping a full-body image:

- Protected: compact braced stance, clean cyan signal core.
- Pressure: lower stance, stronger recoil, red warning visor.
- Overclocked: brighter charge conduits and faster follow-through, no extra damage rule.
- Lethal: shield plate partially open, harsher silhouette rim, clearer block pose.

### Enemy families

Keep the three MVP classes but provide stage-specific visual variants in their manifests:

- Packet Stalker: relay body, cable tail, three locomotion accents (`crawl`, `hop`, `skitter`).
- Needle Wraith: spine flight, high/mid/low lane variants, readable anticipation tilt.
- Null Crown: plate orbit, fracture state, boss entry and defeat silhouettes.

Each variant must provide the canonical clips: `locomotion`, `idle`, `anticipation`, `attack`, `hit`, `defeat`, `special`. Add no new gameplay health, damage, or reward system. If a future variant needs a mechanical rule, stop and amend `docs/game-design.md` before implementation.

### Asset and licensing gates

- Store project-owned/commercial-safe art locally under `public/overdrive/art/` and record source/license in `CREDITS.md`.
- Keep the first playable stage under 5MB compressed combat art and two full character atlases resident.
- Author raster sheets with 12% clear padding and validate crisp edges at 0.5 scale.
- Add a manifest test that every stage preset resolves to valid local asset IDs and every rig exposes all required clips.

## 5. Reactive arena and background layers

Replace the “pasted background” feeling with a layered, state-reactive arena while respecting the existing canvas tokens:

1. `arena-background.ts`: owns the base signal-trench master and zone-safe crop.
2. `parallax-layer.ts`: owns distant machinery, cable drift, haze, and foreground cover; clamps movement to 8px from origin.
3. `arena-reactive-state.ts`: maps presentation state (`comboTier`, `quotaBand`, `overdriveReady`, `glitchIntro`, `focusPause`) to tokenized opacity/tint/pulse values.
4. `arena-lanes.ts`: draws the authored high/mid/low attack paths and keeps them outside the command-rail/caret exclusion zone.

Reactive rules:

- Ambient motion is always lower contrast than the active word and combat contact.
- Combo x4+ may add the documented caret trail and particle increase; x8+ may add the documented 0.04 opacity background pulse; x16+ may add the thin edge glow.
- `OVERRUN` changes quota rail, target cadence, and audio riser without introducing a hidden score multiplier.
- Focus Pause cancels attack anticipation, holds the Warden in `ready-high`, and keeps only low-motion ambience.
- Reduced motion freezes ambient animation and all background pulse while retaining state color and pose changes.

## 6. VFX and audio feedback map

Centralize effect descriptors in `features/overdrive/canvas/effects/effect-manifest.ts` and audio descriptors in `features/overdrive/fx/sfx.ts`. The descriptor is data-only and consumed by Pixi/Web Audio adapters.

| Event | Visual | Audio | Budget/guard |
| --- | --- | --- | --- |
| Accepted character | 28px contact ring, 8px smear, node fracture | One shot click | One contact effect per accepted key |
| Chain contact | Joined line between adjacent nodes, violet/pink only at combo tier | Slightly layered shot | Merge same-source decorations |
| Clean word | Execute pose, target dissolve, exactly 18 fragments, `+score` popup, equation | Impact layer | Popup cap 3; fragments pooled |
| Typo | Red underline + 4px rail shake for 80ms | Muted misfire click | Never screen shake |
| Mult up | Number scale 1.0→1.2→1.0, short flash, 50ms hitstop | Harmonic rise | No particle burst beyond tier budget |
| Item proc | Rarity border flash 150ms, one nearby proc label | Short item tick | One visible label; identical shapes merge |
| Overdrive ready/release | Rail lock, aura/rim pulse, impact column, afterimage | Rising cue + release layer | 320ms lifecycle; screen shake max 3px |
| Pressure attack | Articulated anticipation, directional line, contact ring | Warning cue | Anticipation ≥240ms; no ambient lookalike |
| Aegis rescue | Block pose, shield plane fracture, cyan wave, `+30S` | Deflection sting | 600ms; no timer jump without animation |
| Glitch intro | Scanline/title stamp, stage-specific silhouette | Glitch sting | 400ms; do not add KERNEL PANIC |
| Stage clear | Quota pulse, defeat settle, result ribbon handoff | Quota chime | Shake max 6px, hitstop 50ms |

Effect allocation must honor the 200 live-object cap and pool contracts. Under reduced motion, omit particles, shake, hitstop, background pulse, and count-up while keeping the corresponding semantic event and readable state changes.

## 7. Exact score trace and item impact

### Engine contract

Add a pure, immutable trace to the score resolution result without changing numeric outcomes:

```ts
type ScoreTraceOperation = "add" | "multiply" | "floor"

type ScoreTraceStep = {
  readonly id: string
  readonly label: string
  readonly source: "base" | "keycap" | "macro" | "combo" | "overdrive" | "aegis" | "ruleset"
  readonly operation: ScoreTraceOperation
  readonly before: number
  readonly amount: number
  readonly after: number
}

type ScoreResolution = {
  readonly baseScore: number
  readonly mult: number
  readonly finalMultiplier: number
  readonly total: number
  readonly trace: readonly ScoreTraceStep[]
  readonly itemImpacts: readonly ItemImpact[]
}

type ItemImpact = {
  readonly itemId: string
  readonly trigger: string
  readonly kind: "exact" | "estimated"
  readonly scoreDelta: number
  readonly procCount: number
}
```

The trace must be produced by the same ordered operations as the canonical formula. Add a deterministic counterfactual helper for item preview: clone the pure score context, remove one item effect, resolve again, and show the difference as an estimate only when an effect cannot be isolated exactly. Never mutate live run state to produce a preview.

### Presentation

- `features/overdrive/components/score-equation.tsx` renders the latest trace as one compact equation, then exposes an accessible expanded description.
- `features/overdrive/components/build-impact.tsx` renders current-stage proc count, score/protection contribution, and the next-stage preview delta.
- `features/overdrive/components/stage-clear-ribbon.tsx` shows total stage score, Tokens, accuracy, and strongest exact/estimated item contribution as required by the design spec.
- `features/overdrive/components/shop.tsx` receives the previous stage’s `ScoreResolution` and renders it in the top strip without increasing card height.
- Presentation events carry `scoreTraceId` and `itemImpactIds` so Pixi proc feedback, HUD equation, ribbon, and shop facts cannot disagree.

## 8. Shop and desktop overflow redesign

Split the current shop into bounded components:

- `ShopViewport`: owns the one-viewport grid and keyboard focus order.
- `ShopOfferCard`: owns exact name/effect/trigger/price/rarity/capacity state.
- `EffectBlock`: owns long-copy wrapping and accessible full-text disclosure.
- `BuildRail`: owns installed item slots and proc badges.
- `BuildDelta`: owns next-stage Quota and score-impact preview.
- `ShopActionBar`: owns fixed deploy/reroll affordances and keyboard hints.

Layout rules:

- Desktop: three equal columns for two Keycaps + one Macro, with `min-w-0` on every grid/flex child.
- Compact: three short rows with the same information order; no hidden active Macro.
- Effect text uses `overflow-wrap:anywhere`, `break-words`, and a bounded `max-height` with internal scroll only inside the effect block. The page itself never becomes a required scroll surface.
- Additional detail appears on focus/hover without changing layout height. The accessible description remains available to keyboard and screen-reader users.
- Unaffordable prices use opacity 0.4 and the tokenized red price state. Rarity uses border + text label, never color alone.
- Install animation uses transform/opacity only, lasts 600ms, and never blocks another purchase or deploy action.

Add a Playwright fixture containing the longest current item effects and assert:

```ts
await expect(page.locator("[data-testid=shop-viewport]")).toHaveCSS("overflow-x", "hidden")
await expect(page.locator("[data-testid=item-effect]")).toHaveCount(3)
expect(await page.locator("body").evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
```

Also assert that each full effect string is present in the DOM and not visually clipped at all five Definition-of-Done viewport sizes.

## 9. Roguelike decision rhythm and retention

Keep the existing economy values and add clarity around the decision:

1. Stage clear ribbon states what worked: score equation, strongest item contribution, accuracy, Tokens, and time bonus.
2. Shop top strip states `NEXT STAGE`, exact Quota, projected Interest, and the previous stage’s strongest contribution.
3. Buying an item plays a short install sequence: card locks into the build rail, proc label appears, and `NEXT STAGE PREVIEW` updates immediately.
4. Active build slots show trigger tags (`ON CLEAN WORD`, `ON TYPO`, `ON COMBO`, `ON STAGE START`, etc.) using the exact existing item hooks.
5. Reroll and sell actions expose their Token cost/return before confirmation; keyboard controls remain 1/2/3, R, Tab, Enter.
6. The end-of-run view lists the final build, strongest item impact, reached zone, and a clear “one more run” comparison against the local personal best.

This creates the Balatro-like causal loop—buy, see the build work, understand the next risk—without adding a second currency, hidden rarity rules, or an unapproved meta-progression system.

## 10. File map and interfaces

### Create

- `features/overdrive/canvas/choreography/sequence-types.ts`
- `features/overdrive/canvas/choreography/sequences/character-contact.ts`
- `features/overdrive/canvas/choreography/sequences/word-resolution.ts`
- `features/overdrive/canvas/choreography/sequences/pressure-attack.ts`
- `features/overdrive/canvas/choreography/sequences/overdrive-release.ts`
- `features/overdrive/canvas/choreography/sequences/aegis-rescue.ts`
- `features/overdrive/canvas/choreography/sequences/stage-resolution.ts`
- `features/overdrive/canvas/arena-background.ts`
- `features/overdrive/canvas/parallax-layer.ts`
- `features/overdrive/canvas/arena-reactive-state.ts`
- `features/overdrive/canvas/arena-lanes.ts`
- `features/overdrive/canvas/effects/effect-manifest.ts`
- `features/overdrive/canvas/stage-presets.ts`
- `features/overdrive/components/score-equation.tsx`
- `features/overdrive/components/build-impact.tsx`
- `features/overdrive/components/shop-viewport.tsx`
- `features/overdrive/components/shop-offer-card.tsx`
- `features/overdrive/components/effect-block.tsx`
- `features/overdrive/components/build-rail.tsx`
- `features/overdrive/components/build-delta.tsx`
- `lib/engine/overdrive/__tests__/score-trace.test.ts`
- `features/overdrive/canvas/choreography/__tests__/sequence-contracts.test.ts`
- `features/overdrive/canvas/__tests__/stage-presets.test.ts`
- `features/overdrive/canvas/effects/__tests__/effect-manifest.test.ts`
- `features/overdrive/components/__tests__/shop-overflow.spec.ts`

### Modify

- `lib/engine/overdrive/scoring.ts`, `types.ts`, and `events.ts`: exact score trace, item impact metadata, and immutable presentation-safe payloads.
- `lib/engine/overdrive/run.ts` and the existing focused run modules: preserve the public facade while forwarding trace data.
- `features/overdrive/presentation/events.ts`, `scheduler-types.ts`, `scheduler.ts`, and `use-presentation-events.ts`: one semantic envelope path with compatibility removed only after consumers migrate.
- `features/overdrive/canvas/choreography/combat-director.ts`: facade only; wire sequences, stage presets, ledger, pools, and target promotion.
- `features/overdrive/canvas/visual-assets.ts`, `rig/rig-manifests.ts`, and `rig/rig-definition.ts`: tokenized preset/clip/asset lookup.
- `features/overdrive/canvas/combat-scene.ts`, `scene-feedback.ts`, `effects/combat-effects.ts`, `effects/item-presentation.ts`, and pool modules: consume sequence outputs and enforce budgets.
- `features/overdrive/components/hud.tsx`, `gameplay-layer.tsx`, `stage-clear-ribbon.tsx`, `shop.tsx`, and `run-over.tsx`: render equation, item impact, threat bands, and bounded build/shop surfaces.
- `docs/design.md`: add only approved new token names or effect budget clarifications; existing numeric values remain authoritative.
- `CREDITS.md` and local asset manifests: document every new project-owned/commercial-safe asset.

### Interface flow

`EngineEvents → PresentationEventEnvelope → PresentationScheduler → PresentationBeat[] → SequenceOutput → Pixi pools/rigs + HUD presentation events`

`ScoreResolution → ScoreEquation/BuildImpact → StageClearRibbon + ShopViewport preview`

`StageSnapshot + threat band + seed → StagePresentationPreset → deterministic lane/clip/effect choices`

## 11. Task-by-task execution plan

Each task starts with a failing or characterization test, has a bounded implementation surface, and ends with a verification command. Do not skip to visual polish while the corresponding contract is red.

### Task 0 — Baseline and asset inventory

- [ ] Record the current `git status`, existing test count, current shop screenshots, and the three current rig manifests.
- [ ] Confirm all current Overdrive event consumers and mark the compatibility path that will be removed after migration.
- [ ] Create a deterministic stage-preset table test fixture for all 8 zones × 3 stages and the four threat bands.
- [ ] Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `git diff --check` before changes; save the output in the task notes.

Expected result: the baseline is reproducible and no asset or event consumer is lost during the refactor.

### Task 1 — Score trace and item impact contract (R-2, I-1, J-1)

- [ ] Add `lib/engine/overdrive/__tests__/score-trace.test.ts` with failing cases for clean words, Overdrive Strike ordering, Zone 2 Aegis Recovery, Zone 3 dirty zero-score, Mult reset, and a purchase preview that leaves live state unchanged.
- [ ] Add the `ScoreTraceStep`, `ScoreResolution`, and `ItemImpact` types to the headless engine.
- [ ] Implement trace generation in the existing ordered scoring pipeline; assert final totals match every pre-existing scoring test.
- [ ] Implement pure counterfactual preview and label non-isolatable effects as `estimated`.
- [ ] Expose trace data through `word_complete`, stage-clear, and shop-facing snapshots without importing UI code.
- [ ] Run `npx vitest run lib/engine/overdrive/__tests__/scoring.test.ts lib/engine/overdrive/__tests__/score-trace.test.ts lib/engine/overdrive/__tests__/items.test.ts`.
- [ ] Run `npx tsc --noEmit` and `rg -n "react|pixi|zustand|window|document|Math\\.random" lib/engine/overdrive`.

Expected result: existing numeric behavior is byte-for-byte stable while the UI receives a causal, immutable trace.

### Task 2 — Semantic presentation envelopes and sequence contracts (J-1, J-3)

- [ ] Add failing scheduler tests for source order, accepted-character no-drop, item aggregation, critical-beat priority, run reset, and reduced-motion decoration suppression.
- [ ] Define `SequenceContext`, `SequenceOutput`, `PresentationAnchor`, and cancellation contracts in `sequence-types.ts`.
- [ ] Migrate store event adapters to one envelope path carrying run ID, target ordinal, character index, source sequence, stage preset ID, and due time.
- [ ] Keep a compatibility adapter until all Pixi/HUD consumers use envelopes, then delete the duplicate legacy emission path.
- [ ] Run `npx vitest run features/overdrive/presentation` and `npx tsc --noEmit`.

Expected result: every visual beat is traceable to one deterministic engine event, with critical input contacts protected from decorative load.

### Task 3 — Character contact and pressure choreography (J-1)

- [ ] Add failing sequence contract tests for first/middle/chain/final accepted characters, dirty submission, rapid 12-character input, enemy anticipation ≥240ms, and input continuity during defeat.
- [ ] Implement `character-contact.ts`, `word-resolution.ts`, and `pressure-attack.ts` using existing rig clips, target lanes, `ContactLedger`, and pools.
- [ ] Refactor `combat-director.ts` into a facade and remove semantic contact ownership from any render-loop queue.
- [ ] Add rig-manifest validation for required Warden/enemy clips and stage-specific visual variants.
- [ ] Run `npx vitest run features/overdrive/canvas/choreography features/overdrive/canvas/rig features/overdrive/canvas/__tests__/stage-presets.test.ts`.

Expected result: accepted keys visibly chain through the arena without dropped contacts, a fixed firing anchor, or blocked input.

### Task 4 — Reactive arena and stage presets (J-1, J-3)

- [ ] Add failing tests for deterministic preset lookup, lane choreography, quota-band transitions, combo tier transitions, Focus Pause, Overdrive ready, and reduced-motion state.
- [ ] Implement the four arena modules and `stage-presets.ts` using existing `visual-assets.ts` tokens and design geometry.
- [ ] Add background state transitions for `engage`, `surge`, `overrun`, `finish`, `focusPause`, `glitchIntro`, and `overdriveReady`.
- [ ] Verify ambient caps (24 motes, ≤8px parallax offset) and effect caps (200 live objects) through instrumentation tests.
- [ ] Run `npx vitest run features/overdrive/canvas/__tests__/stage-presets.test.ts features/overdrive/canvas/effects/__tests__/effect-manifest.test.ts`.

Expected result: each stage family has a recognizable living arena without changing gameplay math or creating visual attack lookalikes.

### Task 5 — VFX/audio manifest and feedback budget (J-1, J-2, J-3)

- [ ] Add failing manifest tests for every event in the feedback table, required duration/easing token, pool category, reduced-motion policy, and live-object budget.
- [ ] Implement data-only effect descriptors and wire them into combat effects, item presentation, score popup, and SFX adapters.
- [ ] Add three keystroke switch variants and lazy-loaded shot/impact/riser/glitch layers within the documented audio budget.
- [ ] Verify duplicate proc merging, popup cap 3, exactly 18 defeat fragments, and no shake on ordinary words/typos.
- [ ] Run `npx vitest run features/overdrive/canvas/effects features/overdrive/canvas/pools`.

Expected result: spectacle is consistent and readable, not a random particle storm.

### Task 6 — Score equation, stage ribbon, and build impact UI (J-1, I-1)

- [ ] Add component tests for exact equation order, item trigger labels, `exact` vs `estimated`, stage-clear strongest contribution, and keyboard-only navigation.
- [ ] Implement `score-equation.tsx` and `build-impact.tsx` using tokenized typography/color and an accessible expanded description.
- [ ] Update HUD, stage ribbon, and run-over to consume the same `ScoreResolution` IDs as Pixi feedback.
- [ ] Add a Playwright assertion that a clean word’s score popup, equation, and strongest item label agree.
- [ ] Run the focused component/Playwright suite and `npm run lint`.

Expected result: score and item purchases feel useful because the player can see exactly what changed and why.

### Task 7 — One-viewport shop and overflow hardening (I-2, I-3, M3)

- [ ] Add failing Playwright tests with the longest exact item descriptions at `390×844`, `820×1180`, `1366×768`, `1440×900`, and `1920×1080`.
- [ ] Split `shop.tsx` into the bounded components listed above; add `min-w-0`, wrapping, internal effect scrolling, and stable card heights.
- [ ] Add focus/hover detail that does not change layout height; retain full copy for keyboard and screen readers.
- [ ] Add install-to-build animation, next-stage Quota/Interest preview, and the prior-stage strongest contribution.
- [ ] Verify keyboard controls 1/2/3/R/Tab/Enter and no required page scroll.
- [ ] Run `npx playwright test features/overdrive/components/__tests__/shop-overflow.spec.ts`.

Expected result: no truncated item descriptions or desktop overflow, with purchases visibly changing the build rail and preview.

### Task 8 — Integrated stage loop and visual QA (R-1, R-4, J-1, J-3, M3)

- [ ] Play through Zone 1 beginner route, Zone 2 correction/Aegis Recovery, Zone 3 dirty zero-score, one Glitch stage, Overdrive release, and a stage clear.
- [ ] Capture deterministic screenshots/video for accepted-character contact, chain contact, typo, clean execution, Mult up, Overrun, Aegis, Overdrive, stage ribbon, and shop install.
- [ ] Run the five viewport sizes and reduced-motion mode; inspect focus-visible outlines, contrast hotspots, and command-rail/caret exclusion.
- [ ] Instrument p95/p99 accepted cue/contact times, max unsettled contacts, max live effects, and frame time under x16 combo.
- [ ] Run the complete verification set:

  ```bash
  npm test
  npm run lint
  npx tsc --noEmit
  npm run build
  npm run build:worker
  git diff --check
  ```

Expected result: all existing behavior remains intact, the redesigned presentation meets the M3 60fps/no-overlap/readability gate, and reduced motion is demonstrably usable.

### Task 9 — Documentation and asset hygiene

- [ ] Update `docs/design.md` only with approved token/manifest additions and record the final effect budget.
- [ ] Update `CREDITS.md` with every new art/audio source and license.
- [ ] Add a short changelog entry describing the new attack grammar, stage presets, score trace, and shop overflow fix.
- [ ] Confirm no Star Rune asset, copied code, or copied game-specific name entered the repository.
- [ ] Record playtest findings: first-run comprehension, second-run intent, item choice confidence, and “why did I score/die?” answers.

Expected result: the redesign is maintainable, auditable, and ready for a focused implementation PR per requirement ID.

## 12. Open decisions to resolve before implementation

These are explicit gates, not placeholders:

1. **Visual-only variants (recommended for MVP):** approve Packet/Needle/Null material, lane, lighting, and clip variants without new mechanics. Any mechanical variant requires a GDD amendment and new balance tests.
2. **Deterministic choreography (recommended):** use a persisted stage/target choreography table so replays and daily seeds show the same attack language. Do not use animation randomness that cannot be reproduced from the run seed.
3. **Exact score impact (recommended):** use pure counterfactual resolution for isolated item effects and mark the remaining effects `estimated`. Never show a misleading exact number.
4. **Original asset budget (required):** approve the local art/audio budget and licensing owner before adding files under `public/overdrive/art/` or expanding the first-stage resident texture set.

## 13. Self-review checklist

- [ ] Every requested concern is addressed: character variety, stage/background variety, correct/incorrect attack variation, explosions/VFX, score/item meaning, roguelike rhythm, Star Rune-inspired per-keystroke action, and desktop overflow.
- [ ] No plan step changes canonical item values, Quotas, Glitches, or MVP scope without a documentation gate.
- [ ] Every new interface has a producing file, consuming file, and test location.
- [ ] Every implementation task starts with a test or characterization check and ends with an exact command and expected result.
- [ ] No unresolved decision token, invented asset URL, or unbounded “make it feel better” instruction remains.
- [ ] All motion, colors, spacing, particle limits, viewport sizes, and accessibility behavior point back to `docs/design.md`.
- [ ] The final implementation can be split into small requirement-scoped commits (`J-1`, `J-2`, `J-3`, `I-1`, `I-2`, `M3`) without a giant rewrite.
