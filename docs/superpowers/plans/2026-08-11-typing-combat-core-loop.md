# Typing Combat Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current “type one word, then watch score feedback” loop with a playable tactical loop where the player selects one of three visible targets and the equipped Keycaps produce distinct, deterministic attack patterns during typing.

**Architecture:** The engine keeps the canonical scoring, quota, stage, and Overdrive rules. It will expose a target-selection command and a pure combat-action resolver; these produce immutable events consumed by the existing presentation envelope. Pixi will label all three targets, highlight the selected target, and render item-specific action geometry through the existing rig/effect pools. React remains responsible only for low-frequency HUD/build summaries.

**Tech Stack:** Pure TypeScript/Vitest, existing Zustand store, PixiJS v8 custom cutout rig, existing pooled effects and Web Audio.

## Global Constraints

- Preserve `docs/game-design.md` score formula, 8-zone × 3-stage run, 75/70/65-second clocks, Focus Pause, Aegis, Overdrive Strike, 15 MVP Keycaps, 4 Macros, and 5 MVP Glitches.
- Use the existing one active target plus two upcoming targets contract as three selectable signal targets; do not add a separate 5-target battlefield or a second simulation.
- Target selection never changes score, Quota, timer, RNG order, or leaderboard rules. It only swaps the current target with a visible upcoming target before the first character is accepted.
- Keycap combat actions are presentation/combat feedback events. They do not silently change canonical numeric item effects.
- All combat actions are deterministic and headless. No React, PixiJS, DOM, Zustand, or `Math.random()` in `lib/engine/overdrive`.
- Every target is still typeable immediately; target defeat animation and effect playback never block keyboard input.
- Use existing design tokens, stage presets, rig clips, effect pools, reduced-motion policy, and 200-object budget.
- UI copy remains English; only word-pool data may contain Indonesian.

## Task 1: Target selection in the headless engine

**Files:**
- Create: `lib/engine/overdrive/target-selection.ts`
- Create: `lib/engine/overdrive/__tests__/target-selection.test.ts`
- Modify: `lib/engine/overdrive/types.ts`, `events.ts`, `run-input.ts`, `run-lifecycle.ts`, `run-state.ts`, `index.ts`

**Interfaces:**

```ts
export type TargetCandidate = {
  word: string
  queueIndex: number
  active: boolean
  prefix: string
}

export function visibleTargets(snapshot: Pick<RunSnapshot, "currentWord" | "upcomingWords">): TargetCandidate[]
export function selectTarget(ctx: RunContext, character: string): boolean
```

- [x] Write tests for three visible candidates, unique-prefix selection, keeping the previous active word in the queue, rejecting ambiguous prefixes, no selection after a word has started, deterministic queue promotion, and unchanged `targetOrdinal`.
- [x] Implement target candidate derivation from `currentWord` + the first two `upcomingWords`; preserve queue order except for the active/upcoming swap.
- [x] Normalize the first three visible prefixes at stage start and after promotion by swapping deterministic queue entries when unique alternatives exist.
- [x] In `feedChar`, before expected-character validation, allow a first-character input to select a unique upcoming target and then process that same character normally.
- [x] Emit `target_selected` with selected word, previous word, visible queue index, and current target ordinal.
- [x] Run focused target-selection and run-state tests.

## Task 2: Build-driven combat action resolver

**Files:**
- Create: `lib/engine/overdrive/combat-actions.ts`
- Create: `lib/engine/overdrive/__tests__/combat-actions.test.ts`
- Modify: `lib/engine/overdrive/types.ts`, `events.ts`, `run-input.ts`, `index.ts`

**Interfaces:**

```ts
export type CombatActionKind = "slash" | "dash" | "blade" | "railgun" | "echo" | "shield" | "bomb" | "drain" | "overdrive-burst"
export type CombatTargetScope = "active" | "lane" | "all"
export type CombatAction = {
  kind: CombatActionKind
  itemId?: string
  targetScope: CombatTargetScope
  power: number
  characterIndex: number
  overdrive: boolean
  label: string
}
export function actionsForCharacter(input: CharacterActionInput): CombatAction[]
export function actionsForWord(input: WordActionInput): CombatAction[]
```

- [x] Write tests proving baseline slash, WASD dash, Vowel Magnet blade, Longshot railgun at character 8, Double Tap echo on repeated letters, Home Row shield, Punctuator bomb, Vampire drain, and Overdrive amplification are all deterministic and build-dependent.
- [x] Implement action resolution from word traits and current character. Always include one baseline slash; add item actions only when their documented trigger pattern is present.
- [x] Implement clean-word resolution actions for Overdrive burst, Vampire drain, and other word-level patterns without modifying score calculation.
- [x] Add `combatActions` to `character_accepted` and `word_complete` payloads.
- [x] Run focused action tests and all existing scoring/item tests.

## Task 3: Presentation event and target-choice UI

**Files:**
- Modify: `features/overdrive/presentation/events.ts`, `features/overdrive/store.ts`, `features/overdrive/presentation/scheduler.ts`
- Modify: `features/overdrive/canvas/combat-scene.ts`, `features/overdrive/canvas/choreography/combat-director.ts`, `features/overdrive/canvas/command-rail.ts`
- Modify: `features/overdrive/components/hud.tsx`, `features/overdrive/components/gameplay-layer.tsx`
- Create: `features/overdrive/presentation/__tests__/target-selection-events.test.ts`

- [x] Add accepted-character actions, word-resolution actions, and `target-selected` to presentation events while preserving compatibility fixtures.
- [x] Show current target as `ACTIVE`, upcoming target one as `NEXT`, and upcoming target two as `FAR`; render their actual words and first-letter selection cue. Keep the command rail/caret stable.
- [x] On `target-selected`, refresh actor staging so the selected actor becomes active and the previous target becomes visibly queued.
- [x] Add a compact HUD target rail derived from the visible prefixes; hide it when prefixes are ambiguous.
- [x] Add tests that the selected target event is rendered and the same character both selects and advances the target.

## Task 4: Item-specific Pixi combat feedback

**Files:**
- Modify: `features/overdrive/canvas/effects/combat-effects.ts`, `effect-manifest.ts`, `item-presentation.ts`, `combat-director.ts`, `combat-scene.ts`, `visual-assets.ts`
- Modify: `features/overdrive/fx/sfx.ts`
- Create: `features/overdrive/canvas/effects/__tests__/combat-actions-presentation.test.ts`

- [x] Add pooled geometry for blade orbit, railgun line, echo duplicate, shield plane, punctuation bomb, Vampire drain, and Overdrive burst using existing tokens and caps.
- [x] Map `CombatAction` to distinct Warden clips, target scopes, effects, and audio cues; do not use the same smear/contact effect for every item.
- [x] Make Overdrive release visibly amplify the action scope/power while retaining canonical x2 scoring.
- [x] Preserve existing pooled effect caps and reduced-motion manifest semantics while keeping gameplay input non-blocking.
- [x] Test that each action kind resolves to a distinct descriptor and stays within the existing live-effect cap.

## Task 5: Integration, regression, and player-feel verification

**Files:**
- Modify: existing focused tests and E2E fixtures only where contracts change.
- Test: `lib/engine/overdrive`, `features/overdrive`, `e2e/overdrive*.spec.ts`

- [x] Run full unit tests, lint, typecheck, production build, worker build, and `git diff --check`.
- [x] Run the full Overdrive E2E suite, including rig loading, target promotion, Zone 2 submission, layout, progression, and Practice regression.
- [x] Verify the visible target labels/HUD cue and action-specific rig/effect/audio mappings answer why a target was chosen and what a Keycap did.
- [x] Confirm no unapproved multiplayer, Firmware, Switch, Copycat, KERNEL PANIC, or 5-target system entered the diff.

## Definition of Done

- The player makes a target decision before typing instead of always accepting a forced word.
- The same word produces visibly different attacks under different Keycap builds.
- Each accepted character has a readable attack and item-specific action feedback.
- Typo, target choice, target defeat, Overdrive, and score outcome are visibly causally connected.
- Existing canonical scoring/economy/run rules and Practice behavior remain unchanged.
- All automated verification passes.
