# Typing Combat Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Overdrive feel like combat created by typing: each accepted character produces a deterministic, readable attack beat; clean, dirty, Overdrive, Aegis, and item outcomes remain causally visible; and the existing custom Pixi cutout rig, short-run rhythm, and future social hooks are strengthened without changing the canonical MVP rules.

**Architecture:** Keep the pure TypeScript engine as the gameplay authority and keep PixiJS as a presentation subscriber. Extend the existing event/presentation envelope with stable combat metadata, then route it through deterministic choreography sequences that drive the existing sprite-part rig, contact ledger, pooled effects, command rail, HUD, and audio. Preserve the current one active target plus two upcoming targets contract; the brief's 3–5 simultaneous target battlefield, four-sector run, Firmware, Switch difficulty, live 2v2, and other v2 proposals are explicitly outside this implementation because `docs/game-design.md` and `docs/prd.md` are authoritative.

**Tech Stack:** Next.js 16 App Router, strict TypeScript, PixiJS v8, Zustand, Vitest, Playwright, Web Audio API, existing custom 2D cutout rig, existing deterministic RNG and event scheduler.

## Global Constraints

- `docs/game-design.md`, `docs/prd.md`, and `docs/design.md` remain the source of truth for mechanics, values, layout, motion, audio, accessibility, and MVP scope.
- Preserve the canonical 8-zone × 3-stage run, one active target plus two upcoming targets, score formula, quota curve, 15 MVP Keycaps, 4 Macros, 5 Glitches, Focus Pause, Aegis Protocol, Overdrive Strike, daily seed, and endless mode.
- Do not implement Firmware, Switch difficulty, Copycat, KERNEL PANIC, cosmetics, live multiplayer, or any item/mechanic marked v2/P2.
- Do not migrate from PixiJS, add Three.js/Phaser/Spine, add a physics engine, or replace the custom sprite-part rig with full-frame spritesheet animation.
- Engine code under `lib/engine` remains pure TypeScript with no React, PixiJS, DOM, Zustand, Supabase, Workers, or `Math.random()` imports.
- All UI copy, comments, identifiers, item names, and commit messages remain English; Indonesian remains only in word-pool data.
- Use design tokens and the spacing scale `4/8/12/16/24/32/48`; no new arbitrary color, size, duration, easing, or spacing constants in components.
- Presentation must be deterministic from engine event order, seed-derived target ordinal, stage, and existing stage preset; animation randomness is forbidden.
- Input must stay available while an effect, pose transition, target defeat, ribbon, or shop animation is running.
- Reduced motion keeps semantic state changes, pose changes, contact readability, and text feedback while disabling shake, hitstop, particles, background pulse, and count-up as specified by `docs/design.md`.
- Social-loop work is limited to stable result/rematch/share data and non-live hooks; no matchmaking, room server, or opponent input is added.

## File Map

### Create

- `lib/engine/overdrive/combat-grammar.ts` — pure deterministic mapping from accepted-character context and item/build traits to a semantic combat verb.
- `lib/engine/overdrive/__tests__/combat-grammar.test.ts` — contract tests for verb selection, chain indices, stage context, and deterministic output.
- `features/overdrive/presentation/sequence-types.ts` — presentation-only sequence context/output/anchor/cancellation types.
- `features/overdrive/canvas/choreography/sequences/character-contact.ts` — accepted-character sequence output.
- `features/overdrive/canvas/choreography/sequences/word-resolution.ts` — clean/dirty word sequence output.
- `features/overdrive/canvas/choreography/sequences/pressure-attack.ts` — deterministic enemy pressure sequence output.
- `features/overdrive/canvas/choreography/sequences/overdrive-release.ts` — Overdrive readiness/release sequence output.
- `features/overdrive/canvas/choreography/sequences/aegis-rescue.ts` — Aegis block sequence output.
- `features/overdrive/canvas/choreography/sequences/stage-resolution.ts` — clear/failure sequence output.
- `features/overdrive/canvas/choreography/sequences/__tests__/sequence-contracts.test.ts` — sequence ordering, cancellation, timing, and reduced-motion tests.
- `features/overdrive/canvas/rig/rig-reaction.ts` — deterministic clip selection, blend/cancel policy, procedural recoil, and secondary motion for the custom rig.
- `features/overdrive/canvas/rig/rig-sockets.ts` — attachment socket lookup for weapon/effect anchors with fallback-safe coordinates.
- `features/overdrive/canvas/rig/__tests__/rig-reaction.test.ts` — rig reaction and socket tests.
- `features/overdrive/canvas/effects/effect-manifest.ts` — data-only feedback descriptors and budgets for combat verbs.
- `features/overdrive/canvas/effects/__tests__/effect-manifest.test.ts` — descriptor coverage and budget tests.
- `features/overdrive/components/build-impact.tsx` — causal item contribution summary tied to `ScoreResolution`.
- `features/overdrive/components/__tests__/build-impact.test.tsx` — accessible impact rendering tests.
- `features/overdrive/components/result-share.ts` — stable client-side result/rematch/share payload builder; no network write.
- `features/overdrive/components/__tests__/result-share.test.ts` — payload determinism and copy contract tests.

### Modify

- `lib/engine/overdrive/types.ts` — add immutable combat-grammar metadata types and read-only-safe event payload fields without changing scoring values.
- `lib/engine/overdrive/events.ts` — add accepted-character context, pressure, and resolution metadata required by presentation.
- `lib/engine/overdrive/run-input.ts` — attach character index/chain context and emit semantic input outcomes; preserve current score, typo, charge, submit, and stage behavior.
- `lib/engine/overdrive/run-lifecycle.ts` — emit deterministic pressure/resolution events at existing lifecycle points without moving timer/scoring authority.
- `lib/engine/overdrive/run-state.ts` — expose immutable snapshot metadata needed for presentation and keep save/load compatibility.
- `lib/engine/overdrive/index.ts` — export the new headless combat grammar contract.
- `features/overdrive/presentation/events.ts` — carry sequence source, character index, combat verb, score resolution, and stage context through one envelope path; retain compatibility only where current consumers require it.
- `features/overdrive/presentation/scheduler-types.ts` and `features/overdrive/presentation/scheduler.ts` — schedule semantic beats with cancellation and priority while preserving event order and input continuity.
- `features/overdrive/presentation/use-presentation-events.ts` — expose envelopes to HUD and Pixi consumers without duplicating event truth.
- `features/overdrive/store.ts` — adapt engine events to the enriched envelope, remove avoidable legacy-only emissions, and keep telemetry unchanged.
- `features/overdrive/canvas/choreography/combat-director.ts` — become a small facade that delegates to sequence modules and rig reaction helpers.
- `features/overdrive/canvas/rig/rig-instance.ts` and `animation-controller.ts` — support interruptible clip blending/recoil while retaining current atlas/part/pivot behavior.
- `features/overdrive/canvas/assets/combat-assets.ts` and `rig-manifests.ts` — validate optional reaction clips/sockets and use documented fallback poses when an asset is missing.
- `features/overdrive/canvas/combat-scene.ts` — consume semantic beats, keep active text rail stable, and attach effects to rig sockets.
- `features/overdrive/canvas/scene-feedback.ts`, `effects/combat-effects.ts`, `effects/item-presentation.ts`, and pool modules — use the effect manifest, merge duplicate decorations, and enforce reduced-motion/live-object budgets.
- `features/overdrive/canvas/stage-presets.ts`, `visual-assets.ts`, and `gameplay-canvas.tsx` — make stage identity alter clip emphasis/lane/effect presentation only, with no mechanical rule drift.
- `features/overdrive/components/hud.tsx`, `gameplay-layer.tsx`, `score-equation.tsx`, `stage-clear-ribbon.tsx`, `shop.tsx`, and `run-over.tsx` — show attack outcome, exact/estimated item impact, honest dirty-word outcome, and rematch/share affordances using design tokens.
- `features/overdrive/fx/sfx.ts` — map semantic verbs to the existing lazy Web Audio path with reduced-motion-safe audio behavior.
- `features/overdrive/__tests__/store-transition.test.ts` and relevant existing tests — update characterization assertions for enriched payloads without changing canonical numeric outcomes.

## Task 1: Baseline and specification lock

**Files:**
- Read: `docs/game-design.md`, `docs/prd.md`, `docs/design.md`, `AGENTS.md`
- Read: `features/overdrive/canvas/assets/combat-assets.ts`, `features/overdrive/canvas/rig/*`, `features/overdrive/canvas/choreography/*`
- Test: existing Vitest, lint, and TypeScript suites

**Interfaces:**
- Consumes: existing `EngineEvents`, `PresentationEventEnvelope`, `RigDefinition`, `AnimationController`, and stage presets.
- Produces: a reproducible baseline and confirmed acceptance constraints for all following tasks.

- [ ] **Step 1: Record repository state and locate current consumers.**

  Run `git status --short --branch`, `rg -n "emitLegacyPresentationEvent|emitPresentationEvent|character_accepted|word_complete|aegis_rescue|overdrive_ready" features lib` and record the affected files in the implementation notes.

- [ ] **Step 2: Run baseline verification.**

  Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `git diff --check`. Existing failures must be distinguished from regressions before any code change.

- [ ] **Step 3: Confirm the rig contract.**

  Verify the runtime loads sprite parts with pivot/transform tracks and that fallback is a single `fallback` part only when atlas validation fails. Do not add an alternate renderer.

## Task 2: Headless combat grammar

**Files:**
- Create: `lib/engine/overdrive/combat-grammar.ts`
- Create: `lib/engine/overdrive/__tests__/combat-grammar.test.ts`
- Modify: `lib/engine/overdrive/types.ts`, `events.ts`, `run-input.ts`, `index.ts`

**Interfaces:**
- Produces:

  ```ts
  export type CombatVerb = "signal-lock" | "arc-dash" | "chain-strike" | "execution-ready" | "misfire"
  export type CombatGrammarContext = {
    stage: StageType
    zone: number
    characterIndex: number
    wordLength: number
    wordDirty: boolean
    combo: number
    keycapIds: readonly string[]
    overdriveReady: boolean
  }
  export function combatVerbFor(context: CombatGrammarContext): CombatVerb
  ```

- [ ] **Step 1: Write failing grammar tests.**

  Cover index `0` → `signal-lock`, middle index → `arc-dash`, index `2+` → `chain-strike`, final accepted character → `execution-ready`, typo → `misfire`, and identical contexts producing identical results.

- [ ] **Step 2: Run the focused test and verify it fails.**

  Run `npx vitest run lib/engine/overdrive/__tests__/combat-grammar.test.ts`; expected result is a missing-module or missing-export failure.

- [ ] **Step 3: Implement the pure mapping.**

  Use only context values and deterministic ordered rules. Keycaps may add a presentation trait such as `longshot`, `punctuator`, or `double_tap` to event metadata, but they must not alter score or target word selection in this task.

- [ ] **Step 4: Add event metadata without changing numeric behavior.**

  Emit character index, target ordinal, `combatVerb`, stage, and word snapshot from `run-input.ts`; preserve `+3` charge, `-15` typo drain, Zone 1 forgiveness, Zone 2 recovery, Zone 3+ zero score, combo, quota, and Overdrive release behavior.

- [ ] **Step 5: Run focused and existing engine tests.**

  Run `npx vitest run lib/engine/overdrive/__tests__/combat-grammar.test.ts lib/engine/overdrive/__tests__/run.test.ts lib/engine/overdrive/__tests__/scoring.test.ts lib/engine/overdrive/__tests__/items.test.ts` and expect all tests to pass.

## Task 3: Semantic presentation sequence contracts

**Files:**
- Create: `features/overdrive/presentation/sequence-types.ts`
- Create: `features/overdrive/canvas/choreography/sequences/character-contact.ts`
- Create: `features/overdrive/canvas/choreography/sequences/word-resolution.ts`
- Create: `features/overdrive/canvas/choreography/sequences/pressure-attack.ts`
- Create: `features/overdrive/canvas/choreography/sequences/overdrive-release.ts`
- Create: `features/overdrive/canvas/choreography/sequences/aegis-rescue.ts`
- Create: `features/overdrive/canvas/choreography/sequences/stage-resolution.ts`
- Create: `features/overdrive/canvas/choreography/sequences/__tests__/sequence-contracts.test.ts`
- Modify: `features/overdrive/presentation/events.ts`, `scheduler-types.ts`, `scheduler.ts`, `use-presentation-events.ts`, `features/overdrive/store.ts`

**Interfaces:**
- Produces:

  ```ts
  export type SequencePriority = "critical" | "combat" | "feedback" | "ambient"
  export type SequenceBeat = {
    id: string
    sequence: string
    dueMs: number
    durationMs: number
    priority: SequencePriority
    targetOrdinal: number
    characterIndex?: number
    reducedMotion: "keep" | "omit-decoration"
    payload: Record<string, string | number | boolean>
  }
  export type SequenceOutput = { beats: SequenceBeat[]; cancelKeys: string[] }
  ```

- [ ] **Step 1: Write failing sequence tests.**

  Assert accepted-character output begins at `0ms`, contact is no later than `90ms`, pressure anticipation is at least `240ms`, final character precedes execution, duplicate decoration beats merge, critical beats survive reduced motion, and a newer target ordinal cancels stale target beats without dropping input.

- [ ] **Step 2: Run the focused tests and verify failure.**

  Run `npx vitest run features/overdrive/canvas/choreography/sequences/__tests__/sequence-contracts.test.ts`; expected result is missing sequence modules/types.

- [ ] **Step 3: Implement data-only sequence generators.**

  Keep sequence modules free of Pixi imports. They return beats only; `CombatDirector` and scene adapters perform rendering. Use stage preset and event metadata for lane/clip emphasis, never `Math.random()`.

- [ ] **Step 4: Route one envelope path.**

  Extend `PresentationEventEnvelope` with source sequence, stage preset ID, target ordinal, and optional character index. Keep the legacy adapter only for consumers not yet migrated, and ensure it does not emit a second semantic combat beat.

- [ ] **Step 5: Verify scheduler and presentation tests.**

  Run `npx vitest run features/overdrive/presentation features/overdrive/canvas/choreography/sequences` and expect order, cancellation, reduced motion, and existing event tests to pass.

## Task 4: Custom rig reactions, blending, recoil, and sockets

**Files:**
- Create: `features/overdrive/canvas/rig/rig-reaction.ts`
- Create: `features/overdrive/canvas/rig/rig-sockets.ts`
- Create: `features/overdrive/canvas/rig/__tests__/rig-reaction.test.ts`
- Modify: `features/overdrive/canvas/rig/rig-instance.ts`, `animation-controller.ts`, `rig-manifests.ts`, `features/overdrive/canvas/assets/combat-assets.ts`

**Interfaces:**
- Produces:

  ```ts
  export type RigReaction = {
    clip: string
    blendMs: number
    recoilX: number
    recoilY: number
    secondaryRotation: number
    interruptible: boolean
  }
  export function reactionForVerb(verb: CombatVerb, stage: StageType, combo: number): RigReaction
  export function resolveRigSocket(definition: RigDefinition, socket: string): { x: number; y: number; rotation: number }
  ```

- [ ] **Step 1: Write failing rig tests.**

  Cover distinct first/middle/chain/execution/misfire/block/Overdrive reactions, deterministic combo/stage variants, interruption of an ordinary attack by a critical block, preservation of the fallback pose, and stable socket fallback when a socket is absent.

- [ ] **Step 2: Implement the reaction policy.**

  Map semantic verbs to existing authored clips where present, then use documented fallback clips. Add procedural recoil/secondary motion as transform overlays on sprite parts; do not replace the sprite-part rig.

- [ ] **Step 3: Add interruptible blending.**

  Let `ready`/`idle` blend into attack, allow critical `block`, `hurt`, `defeat`, and `overdrive` to interrupt ordinary contact, and return to recover/idle after the clip. Effects must not hold or gate keyboard input.

- [ ] **Step 4: Add socket resolution and manifest validation.**

  Validate optional `weapon`, `core`, `impact`, and `shield` sockets. When absent, return the rig root anchor so existing assets remain playable.

- [ ] **Step 5: Run rig tests and typecheck.**

  Run `npx vitest run features/overdrive/canvas/rig` and `npx tsc --noEmit`; expect all current interpolation/controller tests and new reaction tests to pass.

## Task 5: Combat director and effect/audio budget

**Files:**
- Create: `features/overdrive/canvas/effects/effect-manifest.ts`
- Create: `features/overdrive/canvas/effects/__tests__/effect-manifest.test.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`, `combat-scene.ts`, `scene-feedback.ts`, `effects/combat-effects.ts`, `effects/item-presentation.ts`, pool modules, `stage-presets.ts`, `visual-assets.ts`, `features/overdrive/fx/sfx.ts`

**Interfaces:**
- Produces:

  ```ts
  export type EffectDescriptor = {
    id: string
    verb: CombatVerb | "item-proc" | "stage-clear" | "run-over"
    durationMs: number
    pool: "contact" | "line" | "fragment" | "popup" | "ambient"
    reducedMotion: "keep" | "omit"
    mergeKey: string
  }
  export function effectDescriptorFor(verb: EffectDescriptor["verb"]): EffectDescriptor
  ```

- [ ] **Step 1: Write failing manifest tests.**

  Require every semantic verb to have a descriptor, accepted characters to allocate one contact effect, clean word to use the existing exactly-18-fragment contract, ordinary typo to avoid screen shake, Overdrive/Aegis/stage clear to use only documented motion, and all descriptors to remain within the 200 live-object budget.

- [ ] **Step 2: Implement the manifest and budget guards.**

  Centralize descriptors, merge identical decorations by `mergeKey`, and keep existing pools authoritative for allocation/release.

- [ ] **Step 3: Refactor `CombatDirector` into a facade.**

  Convert engine/presentation beats into sequence outputs, apply rig reactions, resolve sockets, and hand effects to pools. The director must not calculate score, time, quota, RNG, or item effects.

- [ ] **Step 4: Wire stage identity and audio.**

  Use existing stage presets for clip emphasis/lane/lighting and map semantic verbs to lazy Web Audio descriptors. Preserve documented timing, no ambient lookalike for pressure attacks, and reduced-motion audio behavior.

- [ ] **Step 5: Run focused canvas/effect tests.**

  Run `npx vitest run features/overdrive/canvas features/overdrive/presentation` and `npm run lint`.

## Task 6: Causal HUD, score impact, shop, and result social hooks

**Files:**
- Create: `features/overdrive/components/build-impact.tsx`
- Create: `features/overdrive/components/__tests__/build-impact.test.tsx`
- Create: `features/overdrive/components/result-share.ts`
- Create: `features/overdrive/components/__tests__/result-share.test.ts`
- Modify: `features/overdrive/components/hud.tsx`, `gameplay-layer.tsx`, `score-equation.tsx`, `stage-clear-ribbon.tsx`, `shop.tsx`, `run-over.tsx`

**Interfaces:**
- Produces:

  ```ts
  export function buildImpactLabel(resolution: ScoreResolution | undefined, itemId: string): string
  export function createResultSharePayload(snapshot: Pick<RunSnapshot, "seed" | "runScore" | "zone" | "keycaps" | "macros" | "highestMult">): {
    title: string
    text: string
    seed: string
  }
  ```

- [ ] **Step 1: Write failing component/payload tests.**

  Cover exact score equation order, `AEGIS RECOVERY — BASE ONLY`, `CORRUPTED — 0 SCORE`, item trigger labels, no false exact attribution, deterministic result payload, and keyboard-accessible rematch/share buttons.

- [ ] **Step 2: Implement build impact and outcome copy.**

  Render the existing structured `ScoreResolution` trace and item impact metadata; do not recompute score in React. Keep the active word/caret stable and highest contrast.

- [ ] **Step 3: Implement bounded shop/result presentation.**

  Keep one viewport, internal effect scrolling, wrapped copy, stable card heights, 1/2/3/R/Tab/Enter controls, visible build installation, next-stage preview, and prior-stage strongest contribution. Add rematch/share payload actions only where existing result screens have space.

- [ ] **Step 4: Run component and existing UI tests.**

  Run `npx vitest run features/overdrive/components features/overdrive/__tests__` and `npm run lint`.

## Task 7: Integrated verification and regression repair

**Files:**
- Modify: the exact files named by the failing contract or integration test, limited to `lib/engine/overdrive`, `features/overdrive`, and documented E2E wiring.
- Test: `lib/engine/overdrive`, `features/overdrive`, `e2e/overdrive*.spec.ts`

**Interfaces:**
- Consumes: all contracts from Tasks 2–6.
- Produces: a playable, deterministic, reduced-motion-safe Overdrive slice with no Practice regression.

- [ ] **Step 1: Run the full unit/type/lint suite.**

  Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `git diff --check`.

- [ ] **Step 2: Run the build and worker build.**

  Run `npm run build` and `npm run build:worker`; fix only implementation regressions, never by changing canonical gameplay values.

- [ ] **Step 3: Run E2E coverage.**

  Run `npm run test:e2e -- e2e/overdrive.spec.ts e2e/overdrive-progression.spec.ts e2e/overdrive-layout.spec.ts e2e/overdrive-juice.spec.ts` and inspect required viewports `390×844`, `820×1180`, `1366×768`, `1440×900`, and `1920×1080`.

- [ ] **Step 4: Manually verify the complete contract.**

  Verify Zone 1 beginner route, Zone 2 correction/Aegis Recovery, Zone 3 dirty zero score, Focus Pause, accepted-key contact, target promotion, clean/dirty resolution, Overdrive, Aegis rescue, Glitch intro, stage ribbon, shop install, run over, reduced motion, rematch, and share payload.

- [ ] **Step 5: Confirm source-of-truth compliance.**

  Run `rg -n "Math\\.random|from [\"'](react|pixi.js|zustand)|import .*DOM" lib/engine` and review every changed UI value against `docs/design.md`. Confirm no new 3–5 target system, live 2v2, Firmware, Switch, Copycat, KERNEL PANIC, or unapproved item/economy change entered the diff.

## Definition of Done

- Every accepted character has a deterministic semantic combat verb and a visible custom-rig reaction.
- Clean, dirty, Overdrive, Aegis, item, pressure, and stage-resolution outcomes are visible and causally consistent across Pixi, HUD, audio, and score equation.
- The custom sprite-part rig remains the renderer; fallback assets still work; no migration to another engine/runtime is introduced.
- Engine numeric behavior, deterministic RNG, Practice behavior, save/load behavior, telemetry event names, and MVP scope remain intact.
- Reduced motion and required desktop/compact layouts remain usable with no horizontal overflow or clipped item copy.
- Unit tests, lint, typecheck, production build, worker build, and targeted E2E tests pass.
- Result/rematch/share hooks are deterministic and ready for future social features without introducing live multiplayer into MVP.
