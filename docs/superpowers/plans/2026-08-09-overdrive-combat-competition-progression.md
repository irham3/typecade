# Overdrive Combat, Competition, and Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver truthful high-speed combat presentation, full-body Signal Siege animation, verified Daily and endless competition, replay-based social play, and gated non-power cosmetic progression.

**Architecture:** The existing pure TypeScript run engine remains authoritative. A semantic presentation scheduler drives Pixi choreography without blocking input, Next Route Handlers run inside the existing OpenNext Cloudflare Worker, Supabase stores competition and progression data under RLS, and private R2 storage holds M6 replay blobs. Post-retention progression stays disabled until the approved product gates pass.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4, Zustand, PixiJS v8, Framer Motion for menus and Shop, Vitest 4, Playwright 1.61, Supabase Postgres/Auth, OpenNext Cloudflare Workers, Wrangler 4, R2, Web Audio API.

## Global Constraints

- Read `AGENTS.md`, `docs/game-design.md`, `docs/prd.md`, `docs/design.md`, the approved design spec, and the TDD before each PR.
- Engine, scoring, item, replay, and run-state code under `lib/engine/overdrive/` stays pure TypeScript with no React, PixiJS, DOM, Supabase, or Cloudflare imports.
- All randomness in game logic uses the seeded RNG. `Math.random()` remains banned in game logic.
- UI copy, item names, comments, identifiers, tests, migrations, and commits use English.
- All Overdrive surfaces require the base feature flag and preserve Practice behavior.
- Do not change the canonical 8 Zones by 3 stages, 75/70/65 second ceilings, score order, Quotas, item values, or animation timings without editing the governing document first.
- Full-body Warden and enemy actions use 8-12 authored poses where required by `docs/design.md`.
- Accepted-character feedback begins within 50ms and reaches contact within 90ms; Overdrive release remains 320ms.
- Gameplay motion uses transform and opacity. Effects share the 200-object cap.
- Compact gameplay text stays at or above 14px. Controls stay at or above 44 by 44px.
- MVP excludes Firmware, Switch difficulty, full unlocks, cosmetics, Copycat, and KERNEL PANIC.
- Daily and all-time endless leaderboards ship in M4. Replay, Ghost Race, Challenge Link, and anti-cheat ship in M6.
- Account XP, cosmetic currency, catalog, inventory, and equipment remain behind `OVERDRIVE_META` until the retention gate passes.
- Browser code never receives the Supabase service-role key or the R2 binding.
- Exposed Supabase tables enable RLS and receive explicit grants.
- Route handlers validate `unknown` payloads before use and return the common typed error envelope.
- Each task follows red, green, refactor, verification, and a small conventional commit with relevant PRD IDs.

---

## Delivery map

| Wave | Tasks | Exit |
| --- | --- | --- |
| Foundation | 1-4 | Characterization, scheduler, contact truth, health metrics |
| M3 combat | 5-13 | Pools, director split, rigs, choreography, UI, audio, performance, pacing |
| M4 competition | 14-21 | Local Supabase, schema, server auth, Daily, submission, boards, telemetry |
| M6 replay and social | 22-26 | Codec, R2, verification, Ghost Race, Challenge Link, login prompt |
| Post-retention meta | 27-30 | Gate, level curve, progression schema, catalog and safe cosmetics |
| Release | 31-32 | CI, Worker preview, docs, rollout audit |

## File responsibility map

The plan creates or reshapes these boundaries:

- `lib/engine/overdrive/run.ts`: public `createRun()` facade.
- `lib/engine/overdrive/run-*.ts`: focused internal run state, input, lifecycle, and Shop functions.
- `lib/engine/overdrive/replay/`: deterministic replay record, codec, and verifier.
- `features/overdrive/presentation/`: presentation event source, scheduler, policy, and health aggregation.
- `features/overdrive/canvas/choreography/`: actor roster and named combat sequences.
- `features/overdrive/canvas/pools/`: reusable Pixi display objects.
- `features/overdrive/canvas/rig/manifests/`: one actor manifest per file.
- `lib/overdrive/server/`: request-independent server services.
- `app/api/overdrive/`: thin request parsing, authentication, and response mapping.
- `features/overdrive/competition/`: browser API, outbox, hooks, and leaderboard UI.
- `lib/overdrive/meta/`: pure account progression calculation.
- `features/overdrive/meta/`: gated wallet, catalog, inventory, and equip UI.
- `supabase/migrations/`: CLI-owned schema migrations.
- `supabase/tests/database/`: pgTAP access, constraint, and transaction tests.

---

### Task 1: Characterize the existing engine and presentation bridge

**Requirements:** F-1, R-1, R-2, R-6, J-1

**Files:**

- Create: `lib/engine/overdrive/__tests__/run-characterization.test.ts`
- Create: `lib/engine/overdrive/events.ts`
- Create: `lib/engine/overdrive/run-state.ts`
- Create: `lib/engine/overdrive/run-input.ts`
- Create: `lib/engine/overdrive/run-lifecycle.ts`
- Create: `lib/engine/overdrive/run-shop.ts`
- Create: `lib/engine/overdrive/run-telemetry-data.ts`
- Modify: `lib/engine/overdrive/run.ts`
- Modify: `lib/engine/overdrive/types.ts`
- Modify: `lib/engine/overdrive/index.ts`
- Create: `features/overdrive/presentation/__tests__/events.test.ts`
- Modify: `features/overdrive/canvas/rig/__tests__/animation-controller.test.ts`
- Modify: `features/overdrive/canvas/rig/__tests__/interpolate.test.ts`
- Modify: `lib/engine/overdrive/__tests__/run.test.ts`
- Read: `lib/engine/overdrive/run.ts`
- Read: `features/overdrive/store.ts`
- Read: `features/overdrive/presentation/events.ts`

**Interfaces:**

- Consumes: `createRun()`, `RunSnapshot`, `EngineEvents`, and current presentation event functions.
- Produces: regression coverage plus a focused `createRun()` facade that lets Tasks 2, 3, and 6 change presentation internals without changing public engine behavior.

- [ ] **Step 1: Repair baseline Vitest type imports and add a rapid-input engine characterization test**

Add `import { describe, expect, it } from "vitest"` to both existing rig test files so standalone `tsc --noEmit` sees the test globals. Then add the engine characterization:

```ts
it("emits one accepted event for every accepted character in order", () => {
  const api = createRun({ seed: "rapid-input", words: ["signal"], startingZone: 3 })
  const accepted: Array<{ character: string; caretIndex: number }> = []
  api.events.on("character_accepted", ({ character, caretIndex }) => {
    accepted.push({ character, caretIndex })
  })
  api.start()

  for (const character of api.snapshot().currentWord) api.feedChar(character)

  expect(accepted).toEqual([
    { character: "s", caretIndex: 1 },
    { character: "i", caretIndex: 2 },
    { character: "g", caretIndex: 3 },
    { character: "n", caretIndex: 4 },
    { character: "a", caretIndex: 5 },
    { character: "l", caretIndex: 6 },
  ])
})
```

- [ ] **Step 2: Add a save-and-resume RNG characterization test**

Create two runs from the same exported state, submit the same current word, and assert equal current and upcoming words, Shop offers, score, charge, and target ordinal.

```ts
expect(restoredA.snapshot()).toEqual(restoredB.snapshot())
expect(restoredA.snapshot().upcomingWords).toEqual(restoredB.snapshot().upcomingWords)
```

- [ ] **Step 3: Add a presentation event ordering test**

```ts
it("assigns monotonic IDs and retains source order", () => {
  resetPresentationEventsForTests()
  const first = emitPresentationEvent({
    type: "accepted-character",
    character: "s",
    index: 0,
    word: "signal",
    targetOrdinal: 0,
    combo: 0,
    charge: 3,
  })
  const second = emitPresentationEvent({ type: "overdrive-ready" })

  expect(second.id).toBe(first.id + 1)
  expect(getPresentationEvents()).toEqual([first, second])
})
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npx vitest run lib/engine/overdrive/__tests__/run-characterization.test.ts features/overdrive/presentation/__tests__/events.test.ts
```

Expected: PASS with zero failures.

- [ ] **Step 5: Run the full engine suite**

Run: `npm test -- lib/engine/overdrive`

Expected: PASS with zero failures.

- [ ] **Step 6: Commit**

```bash
git add lib/engine/overdrive/__tests__/run-characterization.test.ts lib/engine/overdrive/__tests__/run.test.ts features/overdrive/presentation/__tests__/events.test.ts features/overdrive/canvas/rig/__tests__/animation-controller.test.ts features/overdrive/canvas/rig/__tests__/interpolate.test.ts
git commit -m "test(overdrive): characterize run and presentation contracts (F-1)"
```

- [ ] **Step 7: Split engine event, state, input, lifecycle, Shop, and derived telemetry data**

Move code without changing public behavior or consumption order. `events.ts` owns engine event payloads; `run-state.ts` owns construction, snapshot, and save migration; `run-input.ts` owns feed/backspace/submit/Overdrive input; `run-lifecycle.ts` owns stage, Standard Clear, Endless, and Run Over; `run-shop.ts` owns buy/sell/reroll/Macro dispatch; `run-telemetry-data.ts` derives transport-free aggregate measurements.

- [ ] **Step 8: Keep `createRun()` as the only public orchestration entry**

`run.ts` wires the focused pure modules and stays under 300 lines. `index.ts` preserves current public exports. No new module imports React, PixiJS, Zustand, DOM, Supabase, Cloudflare, or `Math.random()`.

- [ ] **Step 9: Verify the refactor against characterization and the full engine suite**

```bash
npx vitest run lib/engine/overdrive
npx tsc --noEmit
rg -n "react|pixi|zustand|window|document|@supabase|cloudflare|Math\.random" lib/engine/overdrive
```

Expected: tests and typecheck exit 0, the scan reports no forbidden production dependency, and `run.ts` stays under 300 lines.

- [ ] **Step 10: Commit the pure engine split**

```bash
git add lib/engine/overdrive
git commit -m "refactor(overdrive): split the headless run facade (F-1, R-1)"
```

### Task 2: Introduce presentation envelopes and scheduler policy

**Requirements:** J-1, J-3

**Files:**

- Create: `features/overdrive/presentation/scheduler-types.ts`
- Create: `features/overdrive/presentation/scheduler-policy.ts`
- Create: `features/overdrive/presentation/scheduler.ts`
- Create: `features/overdrive/presentation/__tests__/scheduler.test.ts`
- Modify: `features/overdrive/presentation/events.ts`
- Modify: `features/overdrive/presentation/use-presentation-events.ts`

**Interfaces:**

- Consumes: `OverdrivePresentationEvent` and event source order.
- Produces: `PresentationEventEnvelope`, `PresentationBeat`, `PresentationScheduler`, and `createPresentationScheduler()` for Tasks 3, 5, 9, and 11.

- [ ] **Step 1: Write failing priority and no-drop tests**

```ts
it("keeps all accepted-character contacts while dropping expired decoration", () => {
  const scheduler = createPresentationScheduler({ runId: "run-1", now: () => 1_000 })
  for (let sequence = 1; sequence <= 12; sequence += 1) {
    scheduler.enqueue(acceptedEnvelope(sequence, sequence - 1))
  }
  scheduler.enqueue(decorativeEnvelope(13, 500))

  const beats = scheduler.drain(1_050)
  expect(beats.filter((beat) => beat.kind === "contact-cue")).toHaveLength(12)
  expect(beats.some((beat) => beat.kind === "ambient-effect")).toBe(false)
})
```

Add tests for source ordering, item aggregation by item and word sequence, reset by run ID, and late-critical health accounting.

- [ ] **Step 2: Run the scheduler test and confirm red state**

Run: `npx vitest run features/overdrive/presentation/__tests__/scheduler.test.ts`

Expected: FAIL because `createPresentationScheduler` does not exist.

- [ ] **Step 3: Add the exact public contracts**

Copy `PresentationEventEnvelope`, `PresentationPriority`, `PresentationBeat`, and `PresentationScheduler` from TDD sections 8.1 and 8.2 into `scheduler-types.ts`. Export an immutable `PresentationHealthSnapshot` with counts and p95-ready sample arrays.

- [ ] **Step 4: Implement the policy**

```ts
export const PRESENTATION_POLICY = {
  acceptedCueBudgetMs: 50,
  acceptedHitBudgetMs: 90,
  tacticalAggregationWindowMs: 32,
  settledContactHistory: 256,
} as const

export function compareBeats(a: PresentationBeat, b: PresentationBeat): number {
  const rank = { critical: 0, tactical: 1, decorative: 2 } as const
  return rank[a.priority] - rank[b.priority]
    || a.sourceSequence - b.sourceSequence
    || a.dueAtMs - b.dueAtMs
}
```

- [ ] **Step 5: Implement `createPresentationScheduler()`**

Use arrays owned by one scheduler instance. Do not keep scheduler state in module globals. Convert accepted characters into critical contact, rig, and target-hit beats. Aggregate tactical item beats with a map keyed by source word sequence, item ID, and contribution kind.

- [ ] **Step 6: Wrap source events in envelopes**

Change `emitPresentationEvent()` to accept an adapter context containing `runId`, `targetOrdinal`, and `now`. Preserve a compatibility helper during this PR so store wiring can migrate in Task 3 without breaking compilation.

- [ ] **Step 7: Verify**

Run:

```bash
npx vitest run features/overdrive/presentation
npx tsc --noEmit
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/presentation
git commit -m "feat(overdrive): add semantic presentation scheduler (J-1)"
```

### Task 3: Replace pending contact queues with a contact ledger

**Requirements:** J-1

**Files:**

- Create: `features/overdrive/canvas/choreography/contact-ledger.ts`
- Create: `features/overdrive/canvas/choreography/__tests__/contact-ledger.test.ts`
- Modify: `features/overdrive/canvas/rig/animation-controller.ts`
- Modify: `features/overdrive/canvas/rig/__tests__/animation-controller.test.ts`
- Modify: `features/overdrive/store.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`

**Interfaces:**

- Consumes: Task 2 envelopes and beats.
- Produces: `ContactLedger`, `ContactRecord`, and `ClipPlayResult` for scene reconciliation.

- [ ] **Step 1: Write the ledger deadline tests**

```ts
it("settles twelve rapid contacts without dropping identity", () => {
  const ledger = new ContactLedger({ historyLimit: 256 })
  for (let sequence = 1; sequence <= 12; sequence += 1) {
    ledger.accept({ sequence, targetOrdinal: 0, characterIndex: sequence - 1, acceptedAtMs: 0 })
    ledger.markCue(sequence, 20 + sequence)
    ledger.markHit(sequence, 60 + sequence)
  }

  expect(ledger.unsettledCount).toBe(0)
  expect(ledger.snapshot().settled).toHaveLength(12)
  expect(ledger.snapshot().lateCueCount).toBe(0)
  expect(ledger.snapshot().lateHitCount).toBe(0)
})
```

Add failure tests for duplicate sequence, hit before cue, unknown sequence, cue over 50ms, and hit over 90ms.

- [ ] **Step 2: Run red tests**

Run: `npx vitest run features/overdrive/canvas/choreography/__tests__/contact-ledger.test.ts`

Expected: FAIL because `ContactLedger` does not exist.

- [ ] **Step 3: Implement `ContactLedger`**

Use a `Map<number, ContactRecord>` for unsettled records and a fixed-length settled array for diagnostics. Do not cap the unsettled map at two. `markCue()` and `markHit()` settle a record after both timestamps exist.

- [ ] **Step 4: Remove semantic contacts from `AnimationController`**

Delete `MAX_PENDING_CONTACTS`, `pendingContacts`, `queueContact`, and the pending-contact edge in `update()`. Change `play()` to return `ClipPlayResult`.

```ts
if (!requested) return { status: "missing", clip: name }
if (!accepts) return { status: "blocked", activeClip: this.activeClip.name }
this.activeClip = requested
this.localTimeMs = 0
this.contactEmitted = false
return { status: "started", clip: requested.name }
```

- [ ] **Step 5: Route accepted events through the scheduler**

Update `store.ts` to emit an envelope for each `character_accepted`. Update `CombatDirector` to receive beats and mark ledger cue and hit timestamps after the matching Pixi changes render.

- [ ] **Step 6: Add an invariant telemetry snapshot**

Expose unsettled count, late cue count, late hit count, and max unsettled contacts to Task 4.

- [ ] **Step 7: Verify**

Run:

```bash
npx vitest run features/overdrive/canvas/rig features/overdrive/canvas/choreography
npx tsc --noEmit
```

Expected: exit 0 and no assertion about a two-contact cap remains.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/store.ts features/overdrive/canvas/rig features/overdrive/canvas/choreography
git commit -m "fix(overdrive): preserve rapid input contact truth (J-1)"
```

### Task 4: Add presentation health aggregation

**Requirements:** J-1, J-3, M3 exit criteria

**Files:**

- Create: `features/overdrive/presentation/telemetry.ts`
- Create: `features/overdrive/presentation/__tests__/telemetry.test.ts`
- Modify: `lib/telemetry/index.ts`
- Modify: `lib/telemetry/__tests__/telemetry.test.ts`
- Modify: `features/overdrive/store.ts`

**Interfaces:**

- Consumes: scheduler health, contact ledger health, and frame samples.
- Produces: `PresentationHealthCollector` and `presentation_health` telemetry event for Task 20.

- [ ] **Step 1: Write percentile and aggregation tests**

```ts
it("reports stage p95 without sending per-character samples", () => {
  const collector = new PresentationHealthCollector()
  for (const value of [10, 12, 14, 16, 18, 20, 22, 24, 26, 60]) {
    collector.recordCueLatency(value)
  }
  const snapshot = collector.flushStage("warmup")
  expect(snapshot.cueLatencyP95Ms).toBe(60)
  expect(snapshot.sampleCount).toBe(10)
  expect(collector.snapshot().sampleCount).toBe(0)
})
```

- [ ] **Step 2: Run red tests**

Run: `npx vitest run features/overdrive/presentation/__tests__/telemetry.test.ts`

Expected: FAIL because the collector does not exist.

- [ ] **Step 3: Implement bounded histograms**

Store frame, cue, and hit samples in fixed 256-sample rings. Export p50, p95, and p99 through a pure percentile function. Store counts for late critical beats, tactical aggregation, decorative drops, peak effects, pool growth, and peak unsettled contacts.

- [ ] **Step 4: Add the telemetry event contract**

```ts
presentation_health: TelemetryContext & {
  scope: "stage" | "run"
  stage: StageType
  sampleCount: number
  frameP95Ms: number
  cueLatencyP95Ms: number
  hitLatencyP95Ms: number
  lateCueCount: number
  lateHitCount: number
  decorativeDropCount: number
  peakLiveEffects: number
  peakUnsettledContacts: number
}
```

- [ ] **Step 5: Flush at stage and run results**

Connect the collector to existing `stage_clear`, `stage_fail`, and `run_over` transitions. Keep product transport outside the engine.

- [ ] **Step 6: Verify**

Run: `npm test -- features/overdrive/presentation lib/telemetry`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add features/overdrive/presentation lib/telemetry features/overdrive/store.ts
git commit -m "feat(overdrive): measure presentation latency health (J-3)"
```

### Task 5: Pool command-rail, signal-node, and popup objects

**Requirements:** J-1, M3 performance

**Files:**

- Create: `features/overdrive/canvas/pools/text-pool.ts`
- Create: `features/overdrive/canvas/pools/actor-pool.ts`
- Create: `features/overdrive/canvas/pools/signal-node-pool.ts`
- Create: `features/overdrive/canvas/pools/score-popup-pool.ts`
- Create: `features/overdrive/canvas/pools/__tests__/pool-contracts.test.ts`
- Create: `features/overdrive/canvas/command-rail.ts`
- Create: `features/overdrive/canvas/scene-feedback.ts`
- Modify: `features/overdrive/canvas/combat-scene.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`

**Interfaces:**

- Consumes: Task 4 health collector.
- Produces: reusable pools and `CommandRail.render()` for Task 6.

- [ ] **Step 1: Write pool reuse tests**

```ts
it("reuses signal nodes across caret updates", () => {
  const createNode = vi.fn(() => fakeGraphics())
  const pool = new SignalNodePool(createNode)
  pool.render("signal", 0, false)
  pool.render("signal", 4, false)
  expect(createNode).toHaveBeenCalledTimes(6)
  expect(pool.activeCount).toBe(6)
})
```

Add tests for actor reuse, growth on longer words, hiding excess nodes on shorter words, reset before reuse, three-popup cap, and one destroy per owned object at scene destruction.

- [ ] **Step 2: Run red tests**

Run: `npx vitest run features/overdrive/canvas/pools`

Expected: FAIL because the pool modules do not exist.

- [ ] **Step 3: Implement pool ownership**

Each pool accepts a factory and reset function, stores available and active objects, grows on demand, and destroys owned objects once. Pool methods record growth through the health collector.

- [ ] **Step 4: Extract `CommandRail`**

Move glyph, caret, equation, charge, and armed-marker rendering from `CombatScene`. Give it this API:

```ts
export interface CommandRailState {
  word: string
  caretIndex: number
  dirty: boolean
  overdriveCharge: number
  equation: string | null
  armedItemIds: readonly string[]
  reducedMotion: boolean
}

export class CommandRail {
  render(state: CommandRailState): void
  resize(width: number, height: number): void
  destroy(): void
}
```

- [ ] **Step 5: Replace hot-path recreation**

Remove the destroy-and-recreate logic from `drawCommandRail()` and `redrawSignalNodes()`. Update existing objects in place. Preserve current positions and design tokens.

- [ ] **Step 6: Extract bounded scene feedback**

Move shake, hitstop, Quota response, typo response, and Overdrive rim behavior into `SceneFeedback`. It consumes semantic beats, owns no engine state, enforces the documented motion bounds, and offers a reduced-motion path.

- [ ] **Step 7: Add a no-allocation instrumentation assertion**

Render one word to warm pools, advance five characters, and assert no factory calls after warmup.

- [ ] **Step 8: Verify**

Run:

```bash
npx vitest run features/overdrive/canvas/pools
npx tsc --noEmit
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit**

```bash
git add features/overdrive/canvas
git commit -m "perf(overdrive): pool input-path Pixi objects (J-1)"
```

### Task 6: Split CombatDirector into focused choreography modules

**Requirements:** J-1

**Files:**

- Create: `features/overdrive/canvas/choreography/target-roster.ts`
- Create: `features/overdrive/canvas/choreography/warden-travel.ts`
- Create: `features/overdrive/canvas/choreography/pressure-sequence.ts`
- Create: `features/overdrive/canvas/choreography/aegis-sequence.ts`
- Create: `features/overdrive/canvas/choreography/overdrive-sequence.ts`
- Create: `features/overdrive/canvas/choreography/__tests__/target-roster.test.ts`
- Create: `features/overdrive/canvas/choreography/__tests__/sequences.test.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`

**Interfaces:**

- Consumes: scheduler beats, Task 3 contact ledger, Task 5 pools, and existing deterministic target lanes.
- Produces: a `CombatDirector` facade under 300 lines with named sequence modules.

- [ ] **Step 1: Characterize target promotion and sequence timing**

Test one active plus two upcoming targets, resolved ordinal promotion, retiring actor reuse, 240ms pressure anticipation, 120ms attack, 600ms Aegis, 260ms Overdrive ready, and 320ms release.

- [ ] **Step 2: Run red tests**

Run: `npx vitest run features/overdrive/canvas/choreography/__tests__/target-roster.test.ts features/overdrive/canvas/choreography/__tests__/sequences.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Extract `TargetRoster` without behavior changes**

Move staged, retiring, available, promotion, transition, slot lookup, and actor layout logic. Expose read-only actor access and explicit `promote(resolvedOrdinal)`.

- [ ] **Step 4: Extract `WardenTravel`**

Move root travel interpolation and canonical home, mid-field, and contact positions. Keep lane selection deterministic.

- [ ] **Step 5: Extract pressure, Aegis, and Overdrive sequences**

Each sequence owns its timer, start, update, completion, and reset. It receives actor and effect ports through constructor arguments. It cannot query the engine or Zustand.

- [ ] **Step 6: Reduce the director to orchestration**

Route beats, update modules in the TDD section 10.2 order, and destroy modules in reverse ownership order. Leave item scheduling for Task 10.

- [ ] **Step 7: Verify behavior and file size**

Run:

```bash
npx vitest run features/overdrive/canvas/choreography
npx tsc --noEmit
```

Expected: exit 0. `combat-director.ts` stays under 300 lines.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/canvas/choreography
git commit -m "refactor(overdrive): split combat choreography modules (J-1)"
```

### Task 7: Replace monolithic rig data with pose-centric manifests and validation

**Requirements:** J-1, J-3

**Files:**

- Create: `features/overdrive/canvas/rig/rig-pose.ts`
- Create: `features/overdrive/canvas/rig/rig-clip-compiler.ts`
- Create: `features/overdrive/canvas/rig/rig-validator.ts`
- Create: `features/overdrive/canvas/rig/__tests__/rig-clip-compiler.test.ts`
- Create: `features/overdrive/canvas/rig/__tests__/rig-validator.test.ts`
- Create: `features/overdrive/canvas/rig/manifests/warden.ts`
- Create: `features/overdrive/canvas/rig/manifests/packet-stalker.ts`
- Create: `features/overdrive/canvas/rig/manifests/needle-wraith.ts`
- Create: `features/overdrive/canvas/rig/manifests/null-crown.ts`
- Modify: `features/overdrive/canvas/rig/rig-definition.ts`
- Modify: `features/overdrive/canvas/rig/rig-manifests.ts`

**Interfaces:**

```ts
export type PoseName =
  | "idle"
  | "anticipation"
  | "attack"
  | "contact"
  | "recovery"
  | "hurt"
  | "defeat"
  | "victory"

export interface PoseSource {
  readonly name: PoseName
  readonly parts: Readonly<Record<string, PartPose>>
}

export interface ClipSource {
  readonly id: string
  readonly frames: readonly PoseFrame[]
  readonly contactFrame?: number
  readonly loop: boolean
}

export function compileRigManifest(source: RigSource): RigDefinition
export function validateRigManifest(source: RigSource): readonly RigIssue[]
```

- [ ] **Step 1: Write compiler tests before moving production data**

Cover inheritance from the actor base pose, deterministic frame ordering, contact-frame preservation, and rejection of an unknown part name.

```ts
expect(compileRigManifest(source).clips.attack.frames).toHaveLength(8)
expect(compileRigManifest(source).clips.attack.contactFrame).toBe(4)
```

- [ ] **Step 2: Run the focused tests and confirm the red state**

```bash
npx vitest run features/overdrive/canvas/rig/__tests__/rig-clip-compiler.test.ts features/overdrive/canvas/rig/__tests__/rig-validator.test.ts
```

Expected: failure because the compiler and validator modules do not exist.

- [ ] **Step 3: Implement strict validation**

The validator returns stable issue codes for duplicate clip IDs, missing required poses, fewer than 8 or more than 12 authored full-body action poses, invalid contact frames, missing parts, and non-finite transforms. It must never repair invalid source silently.

```ts
export type RigIssueCode =
  | "duplicate_clip"
  | "missing_required_pose"
  | "invalid_pose_count"
  | "invalid_contact_frame"
  | "unknown_part"
  | "non_finite_transform"
```

- [ ] **Step 4: Compile the current Warden and enemies without visual changes**

Move source data into actor files. Keep `rig-manifests.ts` as a compatibility barrel until Tasks 8 and 9 finish. Do not change timing tokens or visible geometry in this step.

- [ ] **Step 5: Add a development-only manifest assertion**

`gameplay-canvas.tsx` may surface validation failures in development, but production must fail closed to a static fallback pose and emit `overdrive:rig_invalid`; it must not crash Practice or the route.

- [ ] **Step 6: Verify**

```bash
npx vitest run features/overdrive/canvas/rig
npx tsc --noEmit
npm run lint
```

Expected: exit 0 and no direct manifest consumer outside the compatibility barrel.

- [ ] **Step 7: Commit**

```bash
git add features/overdrive/canvas/rig features/overdrive/canvas/gameplay-canvas.tsx
git commit -m "refactor(overdrive): add validated pose rig manifests (J-1, J-3)"
```

### Task 8: Rebuild the Warden combat rig around readable full-body actions

**Requirements:** J-1, J-3

**Files:**

- Modify: `features/overdrive/canvas/rig/manifests/warden.ts`
- Create: `features/overdrive/canvas/rig/__tests__/warden-manifest.test.ts`
- Create: `features/overdrive/canvas/rig/animation-lab.ts`
- Create: `features/overdrive/canvas/rig/__tests__/animation-lab.test.ts`
- Modify: `features/overdrive/canvas/rig/rig-instance.ts`
- Modify: `features/overdrive/canvas/assets/combat-assets.ts`

**Interfaces:**

```ts
export interface AnimationLabSample {
  readonly actorId: string
  readonly clipId: string
  readonly poseIndex: number
  readonly elapsedMs: number
  readonly partTransforms: Readonly<Record<string, PartTransform>>
}

export function sampleRigClip(
  rig: RigDefinition,
  clipId: string,
  elapsedMs: number,
): AnimationLabSample
```

- [ ] **Step 1: Lock the required clip inventory in tests**

Assert `idle`, `type-strike`, `combo-finisher`, `overdrive-release`, `hurt`, `defeat`, and `victory`. Attack and release clips each use 8-12 authored full-body poses and expose exactly one contact pose.

- [ ] **Step 2: Confirm the test fails on the current manifest**

```bash
npx vitest run features/overdrive/canvas/rig/__tests__/warden-manifest.test.ts
```

Expected: at least one missing or under-authored action failure.

- [ ] **Step 3: Author silhouette-first poses**

Each action changes the planted foot, hips, torso, shoulders, head, and both hands. Keep the contact pose readable without particles. Use only documented timing and easing tokens; do not add camera shake to conceal weak motion.

- [ ] **Step 4: Add the pure animation-lab sampler**

The sampler exposes any clip at a deterministic elapsed time without a Pixi ticker. Use it in tests to compare anticipation, contact, and recovery silhouettes.

- [ ] **Step 5: Assert pose separation**

```ts
expect(poseDistance(anticipation, contact)).toBeGreaterThan(MIN_FULL_BODY_POSE_DISTANCE)
expect(contact.partTransforms.weapon.rotation).not.toBe(recovery.partTransforms.weapon.rotation)
```

The threshold is a named rig-validation constant derived from normalized part transforms, not a gameplay constant.

- [ ] **Step 6: Verify the Warden in reduced-motion mode**

Reduced motion retains anticipation, contact, and recovery states with shorter travel and no shake. It must not remove hit confirmation.

- [ ] **Step 7: Run checks**

```bash
npx vitest run features/overdrive/canvas/rig
npx tsc --noEmit
npm run lint
```

Expected: exit 0; all required clips pass 8-12-pose validation.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/canvas/rig features/overdrive/canvas/assets/combat-assets.ts
git commit -m "feat(overdrive): rebuild the Warden full-body rig (J-1, J-3)"
```

### Task 9: Give enemy families distinct telegraphs, reactions, and defeat signatures

**Requirements:** J-1, J-3

**Files:**

- Modify: `features/overdrive/canvas/rig/manifests/packet-stalker.ts`
- Modify: `features/overdrive/canvas/rig/manifests/needle-wraith.ts`
- Modify: `features/overdrive/canvas/rig/manifests/null-crown.ts`
- Create: `features/overdrive/canvas/rig/__tests__/enemy-manifests.test.ts`
- Create: `features/overdrive/canvas/choreography/enemy-reactions.ts`
- Create: `features/overdrive/canvas/choreography/__tests__/enemy-reactions.test.ts`
- Modify: `features/overdrive/canvas/choreography/target-roster.ts`

**Interfaces:**

```ts
export type EnemyReaction = "light-hit" | "heavy-hit" | "stagger" | "defeat"

export interface EnemyReactionRequest {
  readonly targetId: string
  readonly family: EnemyFamily
  readonly reaction: EnemyReaction
  readonly impactSide: "left" | "right" | "center"
}
```

- [ ] **Step 1: Add family-contract tests**

Every MVP enemy family must provide `idle`, `telegraph`, `light-hit`, `heavy-hit`, `stagger`, and `defeat`. Tests assert different dominant axes or body-part emphasis for each family so they do not read as palette swaps.

- [ ] **Step 2: Run the tests and record the missing clips**

```bash
npx vitest run features/overdrive/canvas/rig/__tests__/enemy-manifests.test.ts
```

Expected: failure listing the exact missing family/clip pairs.

- [ ] **Step 3: Author family-specific silhouette language**

Use mass, stance, recovery speed, and defeat direction to distinguish families. Do not alter enemy health, stage composition, Quota, RNG consumption, or any canonical gameplay value.

- [ ] **Step 4: Route semantic hits to reaction strength**

The mapping consumes presentation semantics such as ordinary hit, completed word, combo threshold, and defeat. It must not infer damage by reading private engine state.

- [ ] **Step 5: Add deterministic interruption tests**

Verify that heavy-hit supersedes light-hit, defeat supersedes all reactions, and a reaction never drops the contact acknowledgement for its source event.

- [ ] **Step 6: Verify**

```bash
npx vitest run features/overdrive/canvas/rig features/overdrive/canvas/choreography
npx tsc --noEmit
```

Expected: exit 0 and stable reaction selection for an identical event stream.

- [ ] **Step 7: Commit**

```bash
git add features/overdrive/canvas/rig/manifests features/overdrive/canvas/rig/__tests__/enemy-manifests.test.ts features/overdrive/canvas/choreography/enemy-reactions.ts features/overdrive/canvas/choreography/__tests__/enemy-reactions.test.ts features/overdrive/canvas/choreography/target-roster.ts
git commit -m "feat(overdrive): differentiate enemy combat reactions (J-1, J-3)"
```

### Task 10: Make score, combo, item, and Overdrive feedback causally legible

**Requirements:** R-2, I-4, J-1, J-3

**Files:**

- Create: `features/overdrive/presentation/score-breakdown.ts`
- Create: `features/overdrive/presentation/__tests__/score-breakdown.test.ts`
- Modify: `features/overdrive/canvas/effects/combat-effects.ts`
- Modify: `features/overdrive/canvas/effects/item-presentation.ts`
- Modify: `features/overdrive/components/hud.tsx`
- Modify: `features/overdrive/components/stage-impact.ts`
- Modify: `features/overdrive/components/run-over.tsx`

**Interfaces:**

```ts
export interface ScoreFeedbackModel {
  readonly baseScore: number
  readonly accuracyMultiplier: number
  readonly speedMultiplier: number
  readonly comboMultiplier: number
  readonly itemContributions: readonly ItemScoreContribution[]
  readonly finalScore: number
}

export function toScoreFeedback(result: ScoreResult): ScoreFeedbackModel
```

- [ ] **Step 1: Write score-feedback parity tests**

Use canonical scoring fixtures from `lib/engine/overdrive/__tests__/scoring.test.ts`. Assert that the display model preserves the exact engine result and item names character for character.

- [ ] **Step 2: Run the tests in the red state**

```bash
npx vitest run features/overdrive/presentation/__tests__/score-breakdown.test.ts
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement the pure adapter**

Never recompute score in React or Pixi. The adapter formats an already-authoritative engine result and maintains factor ordering from `docs/game-design.md`.

- [ ] **Step 4: Add semantic intensity tiers**

Ordinary character, word completion, combo milestone, item proc, target defeat, and Overdrive release each receive a distinct visual signature. The scheduler may coalesce repeated ordinary hits, but it must never merge item activation or Overdrive release.

- [ ] **Step 5: Show item causality at the point of effect**

Item feedback names the exact Keycap, Macro, or Glitch and points to the affected score, charge, timer, or target. Do not add new lore copy or expose hidden formulas not present in the GDD.

- [ ] **Step 6: Add Run Over score reconciliation**

Display base factors, item contributions, final score, and submission state. The total shown must equal the engine final score in unit and Playwright tests.

- [ ] **Step 7: Verify**

```bash
npx vitest run lib/engine/overdrive/__tests__/scoring.test.ts features/overdrive/presentation/__tests__/score-breakdown.test.ts
npx tsc --noEmit
npm run lint
```

Expected: exit 0 with no duplicate score formula outside the engine.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/presentation features/overdrive/canvas/effects features/overdrive/components/hud.tsx features/overdrive/components/stage-impact.ts features/overdrive/components/run-over.tsx
git commit -m "feat(overdrive): clarify combat and score causality (R-2, I-4, J-1)"
```

### Task 11: Replace one-shot sound calls with a bounded audio mixer

**Requirements:** J-1, J-2, J-3

**Files:**

- Create: `features/overdrive/audio/audio-mixer.ts`
- Create: `features/overdrive/audio/audio-policy.ts`
- Create: `features/overdrive/audio/__tests__/audio-mixer.test.ts`
- Modify: `features/overdrive/fx/sfx.ts`
- Modify: `features/overdrive/settings/store.ts`
- Modify: `features/overdrive/presentation/use-presentation-events.ts`

**Interfaces:**

```ts
export type AudioBus = "keystroke" | "sfx" | "music"

export interface AudioCue {
  readonly id: string
  readonly bus: AudioBus
  readonly priority: PresentationPriority
  readonly gain: number
  readonly sourceEventId: number
}

export interface AudioMixer {
  enqueue(cue: AudioCue): void
  setBusGain(bus: AudioBus, gain: number): void
  setMuted(muted: boolean): void
  suspend(): Promise<void>
  resume(): Promise<void>
  destroy(): void
}
```

- [ ] **Step 1: Test voice bounds and priority behavior**

Assert the documented simultaneous-voice cap, deterministic eviction of the oldest lower-priority voice, no eviction of Overdrive release by ordinary typing, and silence while the page is hidden.

- [ ] **Step 2: Confirm the tests fail**

```bash
npx vitest run features/overdrive/audio/__tests__/audio-mixer.test.ts
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement lazy AudioContext ownership**

Create or resume the context only after user interaction. A single mixer owns nodes, disconnects them on completion, suspends on `visibilitychange`, and respects persisted mute/bus gains.

- [ ] **Step 4: Map semantic events to cues**

Keep cue selection in `audio-policy.ts`. No component or Pixi object should call `AudioContext` directly after migration.

- [ ] **Step 5: Preserve accessibility settings**

Mute and reduced-motion choices stay independent. The visual hit confirmation remains sufficient when audio is muted.

- [ ] **Step 6: Verify**

```bash
npx vitest run features/overdrive/audio
npx tsc --noEmit
npm run lint
```

Expected: exit 0 and `rg "new AudioContext|webkitAudioContext" features/overdrive --glob "!audio-mixer.ts"` returns no production call sites.

- [ ] **Step 7: Commit**

```bash
git add features/overdrive/audio features/overdrive/fx/sfx.ts features/overdrive/settings/store.ts features/overdrive/presentation/use-presentation-events.ts
git commit -m "refactor(overdrive): centralize bounded game audio (J-2, J-3)"
```

### Task 12: Repair mobile hierarchy, readable HUD type, and motion alternatives

**Requirements:** J-3, A-1, A-3

**Files:**

- Modify: `features/overdrive/components/menu.tsx`
- Modify: `features/overdrive/components/gameplay.tsx`
- Modify: `features/overdrive/components/hud.tsx`
- Modify: `features/overdrive/components/shop.tsx`
- Modify: `features/overdrive/components/run-over.tsx`
- Modify: `features/overdrive/components/screen.tsx`
- Modify: `features/overdrive/canvas/gameplay-canvas.tsx`
- Create: `e2e/overdrive-accessibility.spec.ts`
- Create: `e2e/overdrive-mobile.spec.ts`

**Interfaces:**

- Components continue consuming the existing store and design tokens.
- Tests use stable role/name locators and the `overdrive` feature flag, not CSS class selectors.

- [ ] **Step 1: Add failing mobile menu assertions**

At 390 by 844, assert the Play control is visible without scrolling, focusable, at least 44 by 44px, and not covered by the fixed navigation.

- [ ] **Step 2: Add failing gameplay accessibility assertions**

Assert compact HUD labels compute to at least 14px, the typed word has an accessible label, score and timer updates avoid per-keystroke screen-reader spam, and the Shop is keyboard operable.

- [ ] **Step 3: Run the focused Playwright specs**

```bash
npx playwright test e2e/overdrive-mobile.spec.ts e2e/overdrive-accessibility.spec.ts --project=chromium
```

Expected: failure on the current mobile first viewport and compact HUD label size.

- [ ] **Step 4: Reorder the mobile menu hierarchy**

Keep the primary mode statement and Play action in the first viewport. Secondary explanation and settings may follow. Preserve the desktop composition and use only the spacing and type tokens in `docs/design.md`.

- [ ] **Step 5: Repair compact gameplay and Shop controls**

Raise labels to the minimum type token, maintain 44px targets, keep visible keyboard focus, and prevent the software keyboard from hiding the active word or timer.

- [ ] **Step 6: Implement reduced-motion presentation policy**

Preserve state changes and hit confirmation, remove nonessential camera translation, reduce particles, and replace large travel with short opacity/scale transitions using approved durations.

- [ ] **Step 7: Verify desktop and mobile**

```bash
npx playwright test e2e/overdrive-mobile.spec.ts e2e/overdrive-accessibility.spec.ts --project=chromium
npx tsc --noEmit
npm run lint
```

Expected: exit 0 at 390 by 844 and the configured desktop viewport.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/components features/overdrive/canvas/gameplay-canvas.tsx e2e/overdrive-accessibility.spec.ts e2e/overdrive-mobile.spec.ts
git commit -m "fix(overdrive): repair mobile and accessible play surfaces (A-1, A-2, A-3)"
```

### Task 13: Add stress performance coverage and a deterministic pacing simulator

**Requirements:** J-1, J-3, R-2, F-4

**Files:**

- Create: `features/overdrive/presentation/__tests__/stress.test.ts`
- Create: `features/overdrive/canvas/__tests__/pool-stress.test.ts`
- Create: `lib/engine/overdrive/simulation/types.ts`
- Create: `lib/engine/overdrive/simulation/simulate-run.ts`
- Create: `lib/engine/overdrive/simulation/__tests__/simulate-run.test.ts`
- Create: `scripts/simulate-overdrive.mjs`
- Modify: `package.json`

**Interfaces:**

```ts
export interface SimulationProfile {
  readonly id: string
  readonly seed: string
  readonly wpm: number
  readonly accuracy: number
  readonly shopPolicy: "skip" | "cheapest" | "highest-rarity"
}

export interface SimulationReport {
  readonly profileId: string
  readonly finalZone: number
  readonly finalStage: number
  readonly finalScore: number
  readonly quotaMisses: number
  readonly durationMs: number
  readonly purchases: readonly string[]
}
```

- [ ] **Step 1: Add a 200-input presentation burst test**

Assert every source event reaches a terminal scheduler state, contact remains at-most-once, critical events are retained, pooled active objects never exceed the documented 200-object cap, and the scheduler returns to idle.

- [ ] **Step 2: Add deterministic simulator tests**

Two simulations with an identical profile must have byte-equal reports. The simulator consumes the real engine API and seeded RNG; it cannot read React, Pixi, the DOM, or `Math.random()`.

- [ ] **Step 3: Confirm red tests**

```bash
npx vitest run features/overdrive/presentation/__tests__/stress.test.ts features/overdrive/canvas/__tests__/pool-stress.test.ts lib/engine/overdrive/simulation
```

Expected: missing simulator and stress-harness failures.

- [ ] **Step 4: Implement the simulator and CLI**

Add `"simulate:overdrive": "node scripts/simulate-overdrive.mjs"`. The CLI prints stable JSON and accepts explicit seed, WPM, accuracy, and Shop policy arguments.

- [ ] **Step 5: Capture browser performance evidence**

Run a Chrome DevTools performance trace on `/overdrive` for a warm-load combat burst, inspect LCP and layout shifts, then inspect the interaction that has the highest duration. Record the trace conditions and measured values in the implementing PR. Do not claim a pass from Lighthouse alone.

- [ ] **Step 6: Enforce runtime budgets**

The implementation must meet the presentation latency and object-cap gates in `docs/design.md` and the TDD. If the trace misses a gate, fix the measured bottleneck before continuing to M4.

- [ ] **Step 7: Verify**

```bash
npm run simulate:overdrive -- --seed plan-check --wpm 80 --accuracy 0.97 --shop-policy skip
npx vitest run features/overdrive/presentation features/overdrive/canvas lib/engine/overdrive/simulation
npm run build
```

Expected: deterministic JSON, all tests pass, and the production build exits 0.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/presentation features/overdrive/canvas/__tests__ lib/engine/overdrive/simulation scripts/simulate-overdrive.mjs package.json package-lock.json
git commit -m "test(overdrive): add combat stress and pacing simulation (J-1, R-2)"
```

### Task 14: Establish local Supabase development, generated types, and Worker-safe server clients

**Requirements:** F-3, D-1, D-2, A-2

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create via CLI: `supabase/config.toml`
- Create: `lib/supabase/database.types.ts`
- Modify: `lib/supabase/client.ts`
- Rename: `lib/supabase/server.ts` to `lib/supabase/server-auth.ts`
- Create: `lib/supabase/admin.ts`
- Create: `lib/cloudflare/env.ts`
- Modify: `next.config.ts`
- Modify: `env.example`
- Create: `lib/supabase/__tests__/client-config.test.ts`

**Interfaces:**

```ts
export function createBrowserSupabaseClient(): SupabaseClient<Database>
export function createServerAuthClient(accessToken: string): SupabaseClient<Database>
export function createAdminSupabaseClient(): SupabaseClient<Database>

export interface OverdriveServerEnv {
  readonly supabaseUrl: string
  readonly supabasePublishableKey: string
  readonly supabaseServiceRoleKey: string
}
```

- [ ] **Step 1: Add the pinned local CLI and initialize Supabase**

```powershell
npm install --save-dev supabase@2.113.0
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase init
```

Expected: `supabase/config.toml` exists and the lockfile records the CLI version.

- [ ] **Step 2: Add failing environment and client tests**

Test missing variables, publishable-key preference, one-release fallback to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, disabled auth persistence for server clients, and absence of a service-role key in the browser client.

- [ ] **Step 3: Run the focused tests**

```bash
npx vitest run lib/supabase/__tests__/client-config.test.ts
```

Expected: failure because typed factories and environment parsing do not exist.

- [ ] **Step 4: Implement typed clients**

`admin.ts` imports `server-only`, validates the service-role secret, and disables `persistSession`, `autoRefreshToken`, and `detectSessionInUrl`. `server-auth.ts` creates one request-scoped client for bearer-token verification. Browser creation remains lazy and singleton-scoped.

- [ ] **Step 5: Enable Cloudflare bindings in Next development**

Add `initOpenNextCloudflareForDev()` from `@opennextjs/cloudflare` to `next.config.ts` without changing the exported Next configuration.

- [ ] **Step 6: Document the environment migration**

Add these names to `env.example` with non-secret descriptions:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OVERDRIVE_COMPETITIVE=false
NEXT_PUBLIC_OVERDRIVE_COMPETITIVE=false
```

Keep the old anon-key read fallback in code for one compatibility release, but stop advertising it in the example file.

- [ ] **Step 7: Start local services and generate database types**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase start
npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts
```

Expected: local services are healthy and the generated file exports `Database`.

- [ ] **Step 8: Verify**

```bash
npx vitest run lib/supabase
npx tsc --noEmit
npm run lint
```

Expected: exit 0 and `rg "as unknown as" lib/supabase app features/overdrive` reports no newly introduced cast.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json supabase/config.toml lib/supabase lib/cloudflare/env.ts next.config.ts env.example
git commit -m "chore(overdrive): establish typed Supabase development (F-3, A-2)"
```

### Task 15: Create the M4 competition schema, RLS, indexes, and atomic publication functions

**Requirements:** D-1, D-2, A-2

**Files:**

- Create via CLI: the single file matched by `supabase/migrations/*_create_overdrive_competition.sql`
- Create: `supabase/tests/database/overdrive_competition.test.sql`
- Regenerate: `lib/supabase/database.types.ts`
- Modify after approval: `docs/prd.md`

**Migration-path rule:** Generate the migration with the Supabase CLI. The timestamped prefix belongs to the CLI; do not hand-author or rename it.

**Interfaces:**

- Produces the `daily_seeds`, `runs`, `leaderboard_entries`, and `product_events` relations defined in TDD section 17.
- Produces typed `publish_overdrive_daily_entry` and `publish_overdrive_endless_entry` RPCs for server-only publication.
- Consumes `auth.users(id)` as the account identity and exposes only the public-safe leaderboard projection to browser roles.

- [ ] **Step 1: Create the migration shell**

First record and obtain approval for the ADR-4 amendment in `docs/prd.md`: authenticated clients do not insert Overdrive runs directly; same-origin server routes derive the verified user, perform privileged writes, and expose own-row/public-safe reads through RLS. Then create the migration:

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase migration new create_overdrive_competition
```

Expected: exactly one new file ends with `_create_overdrive_competition.sql`.

- [ ] **Step 2: Write pgTAP tests first**

Cover table existence; identity primary keys; UUID public IDs; language, score, status, and mode constraints; foreign-key indexes; the one-Daily-attempt partial unique index; authenticated own-row reads; blocked browser writes; public-safe leaderboard reads; service-role paths; and atomic endless best-score replacement.

```sql
select has_table('public', 'runs');
select has_index('public', 'runs', 'runs_one_daily_attempt_idx');
select throws_ok(
  $$ insert into public.runs (client_run_id, mode, status, seed, language, ruleset_version, rng_version, word_pool_version, client_version)
     values (gen_random_uuid(), 'daily', 'started', 'x', 'EN', '1', '1', '1', 'test') $$,
  '42501'
);
```

- [ ] **Step 3: Confirm the red database test state**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase db reset
npx supabase test db supabase/tests/database --local
```

Expected: pgTAP failures because the competition objects do not exist.

- [ ] **Step 4: Implement the TDD section 17 schema**

Create `daily_seeds`, `runs`, `leaderboard_entries`, and `product_events`. Add all check constraints, partial/composite indexes, `updated_at` handling, and explicit grants. Enable RLS on every exposed table.

- [ ] **Step 5: Implement narrowly scoped policies**

Use `(select auth.uid())` in policies. Authenticated users may select their own `runs`; browser roles cannot mutate them. Public leaderboard reads contain no email, auth metadata, storage key, rejection code, or private replay fields.

- [ ] **Step 6: Implement atomic publication functions**

Create `public.publish_overdrive_daily_entry` and `public.publish_overdrive_endless_entry` with `security definer`, `set search_path = ''`, fully qualified objects, explicit argument validation, `revoke execute from public`, and service-role-only execution. Endless replaces an entry only when score is greater, with finish time and row ID as deterministic tie breakers.

- [ ] **Step 7: Reset, test, lint, and regenerate types**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase db reset
npx supabase test db supabase/tests/database --local
npx supabase db lint --local --level warning --fail-on error
npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts
```

Expected: all pgTAP tests pass, database lint reports no error, and generated RPC signatures replace manual casts.

- [ ] **Step 8: Commit**

```bash
git add docs/prd.md supabase/migrations supabase/tests/database/overdrive_competition.test.sql lib/supabase/database.types.ts
git commit -m "feat(overdrive): add secured competition schema (D-1, D-2, A-2)"
```

### Task 16: Add common API contracts, bounded parsing, authentication, feature gates, and rate limits

**Requirements:** F-3, D-1, D-2, A-2

**Files:**

- Create: `lib/overdrive/server/contracts.ts`
- Create: `lib/overdrive/server/request.ts`
- Create: `lib/overdrive/server/auth.ts`
- Create: `lib/overdrive/server/feature-flags.ts`
- Create: `lib/overdrive/server/rate-limit.ts`
- Create: `lib/overdrive/server/__tests__/request.test.ts`
- Create: `lib/overdrive/server/__tests__/auth.test.ts`
- Create: `lib/overdrive/server/__tests__/rate-limit.test.ts`
- Create: `features/overdrive/competition/contracts.ts`
- Modify: `wrangler.jsonc`
- Generate: `cloudflare-env.d.ts`

**Interfaces:**

```ts
export type ApiSuccess<T> = { ok: true; data: T }
export type ApiFailure = { ok: false; error: ApiError }

export const CLAIM_BODY_MAX_BYTES = 2_048
export const SUBMISSION_BODY_MAX_BYTES = 393_216
export const TELEMETRY_BODY_MAX_BYTES = 65_536

export async function requireUser(request: Request): Promise<AuthResult>
export async function parseJsonBody<T>(
  request: Request,
  options: ParseJsonOptions<T>,
): Promise<ParseResult<T>>
export function requireServerFeature(flag: ServerFeature): ApiFailure | null
export function enforceWriteRateLimit(userId: string, routeFamily: string): Promise<RateLimitResult>
export function enforceTelemetryRateLimit(actorId: string): Promise<RateLimitResult>
```

- [ ] **Step 1: Add parser and auth tests**

Test missing and malformed bearer headers, failed `auth.getUser`, wrong content type, declared or actual oversized bodies, invalid JSON, unknown fields, numeric bounds, UUID format, flag-off `404`, redacted internal failures, stable limiter keys, allowed calls, and common `RATE_LIMITED` mapping.

- [ ] **Step 2: Confirm red tests**

```bash
npx vitest run lib/overdrive/server/__tests__/request.test.ts lib/overdrive/server/__tests__/auth.test.ts lib/overdrive/server/__tests__/rate-limit.test.ts
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement strict request parsing**

Read the request once, enforce UTF-8 JSON, apply the route-specific byte limit, parse into `unknown`, and validate into a named contract. Reject extra security-sensitive fields such as `userId`, `status`, and `verificationState`.

- [ ] **Step 4: Implement request-scoped auth**

Pass the access token to `createServerAuthClient()`, call `auth.getUser(token)`, and return the verified user ID. Do not authorize from `user_metadata`, client body, cookies parsed by custom code, or a client-visible flag.

- [ ] **Step 5: Configure and wrap Worker rate-limit bindings**

Add `OVERDRIVE_WRITE_RATE_LIMITER` with namespace `32026081`, 12 calls per 60 seconds, and `OVERDRIVE_TELEMETRY_RATE_LIMITER` with namespace `32026082`, 30 calls per 60 seconds to `wrangler.jsonc`, then run `npm run cf-typegen`. `rate-limit.ts` obtains request-scoped bindings with `getCloudflareContext()`. Write keys use verified user ID plus route family; telemetry uses a validated session or verified user ID. A failed limit returns HTTP `429` through the common envelope. Tests state explicitly that permissive, location-local counters are abuse controls rather than correctness controls.

- [ ] **Step 6: Centralize safe response mapping**

Use the exact error codes in TDD section 16.1. Log an internal correlation ID, but return no SQL message, stack, secret, or raw payload.

- [ ] **Step 7: Verify**

```bash
npx vitest run lib/overdrive/server
npx tsc --noEmit
npm run lint
```

Expected: exit 0 and every exported parser narrows `unknown` without unchecked casts.

- [ ] **Step 8: Commit**

```bash
git add lib/overdrive/server features/overdrive/competition/contracts.ts wrangler.jsonc cloudflare-env.d.ts
git commit -m "feat(overdrive): add bounded competition API contracts (F-3, A-2)"
```

### Task 17: Move Daily Seed ownership and ranked attempt claims to the server

**Requirements:** D-1, F-4, R-6, A-1, A-2

**Files:**

- Create: `lib/overdrive/server/daily-service.ts`
- Create: `lib/overdrive/server/__tests__/daily-service.test.ts`
- Create: `app/api/overdrive/daily/route.ts`
- Create: `app/api/overdrive/daily/attempt/route.ts`
- Create: `app/api/overdrive/daily/__tests__/route.test.ts`
- Create: `app/api/overdrive/daily/attempt/__tests__/route.test.ts`
- Create: `features/overdrive/competition/api.ts`
- Create: `features/overdrive/competition/use-daily-attempt.ts`
- Modify: `features/overdrive/store.ts`
- Modify: `features/overdrive/use-persisted-run.ts`

**Interfaces:**

```ts
export interface DailySeedResponse {
  readonly date: string
  readonly language: WordPoolLanguage
  readonly seed: string
  readonly rulesetVersion: string
  readonly rngVersion: string
  readonly wordPoolVersion: string
  readonly resetAt: string
  readonly rankedEligibility: "eligible" | "login-required" | "attempt-exists"
}

export interface ClaimDailyAttemptRequest {
  readonly language: WordPoolLanguage
  readonly clientRunId: string
}
```

- [ ] **Step 1: Write service race and date-boundary tests**

Freeze time around 00:00 UTC. Assert the server date, reset time, language/ruleset identity, Web Crypto seed shape, one persisted winner during concurrent creation, retry reuse, and no second attempt for the same user and board.

- [ ] **Step 2: Write route tests**

Cover `GET` query validation and reset-bounded cache headers; authenticated `POST`; anonymous `401`; duplicate claim returning the existing run identity; and flag-off `404`.

- [ ] **Step 3: Run the red suite**

```bash
npx vitest run lib/overdrive/server/__tests__/daily-service.test.ts app/api/overdrive/daily
```

Expected: missing service and route failures.

- [ ] **Step 4: Implement Daily Seed resolution**

Use `crypto.getRandomValues`, encode a stable seed string, insert it with the board uniqueness constraint, and read the winning row after an insert race. Cache only until the returned UTC reset.

- [ ] **Step 5: Implement idempotent attempt claim**

After bearer verification, enforce the write limiter before parsing the claim body. Create a `started` `runs` row for the authenticated user. On the partial unique constraint, fetch and return the existing attempt. Derive user ID and server versions internally.

- [ ] **Step 6: Integrate local and ranked modes**

Anonymous Daily may play with the fetched or same-day cached seed and is labeled `UNRANKED`. Authenticated Daily saves the server public run ID. If the network is unavailable before an authenticated claim, do not present the attempt as ranked.

- [ ] **Step 7: Verify**

```bash
npx vitest run lib/overdrive/server/__tests__/daily-service.test.ts app/api/overdrive/daily features/overdrive
npx tsc --noEmit
npm run lint
```

Expected: exit 0; `dailySeed()` is removed from the browser store; Practice behavior is unchanged.

- [ ] **Step 8: Commit**

```bash
git add lib/overdrive/server/daily-service.ts lib/overdrive/server/__tests__/daily-service.test.ts app/api/overdrive/daily features/overdrive/competition features/overdrive/store.ts features/overdrive/use-persisted-run.ts
git commit -m "feat(overdrive): make Daily attempts server authoritative (D-1, A-2)"
```

### Task 18: Submit results idempotently through a local-first outbox

**Requirements:** D-2, A-1, A-2, F-3

**Files:**

- Create: `lib/overdrive/server/run-service.ts`
- Create: `lib/overdrive/server/__tests__/run-service.test.ts`
- Create: `app/api/overdrive/runs/submit/route.ts`
- Create: `app/api/overdrive/runs/submit/__tests__/route.test.ts`
- Create: `features/overdrive/competition/submission-outbox.ts`
- Create: `features/overdrive/competition/__tests__/submission-outbox.test.ts`
- Create: `features/overdrive/competition/use-run-submission.ts`
- Modify: `features/overdrive/store.ts`
- Modify: `features/overdrive/use-persisted-run.ts`

**Interfaces:**

```ts
export type SubmissionState =
  | "local"
  | "queued"
  | "submitting"
  | "accepted"
  | "verified"
  | "rejected"

export interface SubmissionOutboxEntry {
  readonly clientRunId: string
  readonly createdAt: string
  readonly attempts: number
  readonly nextAttemptAt: string
  readonly submission: RunSubmissionV1
  readonly lastErrorCode: ApiFailure["error"]["code"] | null
  readonly state: Exclude<SubmissionState, "local">
}
```

- [ ] **Step 1: Add server validation tests**

Cover engine result bounds, item manifest membership, Keycap/Macro capacity, board identity, client/server version mismatch, Daily ownership, final-row idempotency, Free-run `(user_id, client_run_id)` idempotency, and M4 `accepted` publication.

- [ ] **Step 2: Add outbox tests**

Use fake IndexedDB and fake timers. Assert enqueue-before-network, one in-flight send, retry only for retryable failures, capped exponential backoff with deterministic jitter from `clientRunId`, terminal rejection, reconnect flush, persistence across store recreation, automatic retry only in the current session, and user-triggered resume after a later session.

- [ ] **Step 3: Run the red suite**

```bash
npx vitest run lib/overdrive/server/__tests__/run-service.test.ts app/api/overdrive/runs/submit features/overdrive/competition/__tests__/submission-outbox.test.ts
```

Expected: missing modules and failing outbox behavior.

- [ ] **Step 4: Implement M4 submission service**

Use the authenticated user, canonical manifests, and Daily Seed identity. Ignore any client-supplied user or publication status. Persist the result, mark valid M4 rows `accepted`, and invoke the correct publication RPC in one idempotent flow.

- [ ] **Step 5: Implement the thin route**

Apply bearer auth and the write limiter before reading the potentially large body, then apply `SUBMISSION_BODY_MAX_BYTES`, strict `RunSubmissionV1` validation, feature flag, and safe error mapping. M4 accepts `replay: null`; it never labels the result verified.

- [ ] **Step 6: Implement browser outbox ownership**

Store the final local result first, enqueue a serialized payload, then submit. Register `online`, authentication, and visibility wakeups. Dispose listeners on teardown. Never block Run Over rendering on the network.

- [ ] **Step 7: Verify**

```bash
npx vitest run lib/overdrive/server app/api/overdrive/runs/submit features/overdrive/competition
npx tsc --noEmit
npm run lint
```

Expected: exit 0; duplicate sends return the same public run ID and leaderboard entry.

- [ ] **Step 8: Commit**

```bash
git add lib/overdrive/server/run-service.ts lib/overdrive/server/__tests__/run-service.test.ts app/api/overdrive/runs/submit features/overdrive/competition features/overdrive/store.ts features/overdrive/use-persisted-run.ts
git commit -m "feat(overdrive): add idempotent result outbox (D-2, A-1, A-2)"
```

### Task 19: Ship Daily and endless leaderboards with stable keyset pagination

**Requirements:** D-2, A-1, A-2, J-3

**Files:**

- Create: `lib/overdrive/server/leaderboard-service.ts`
- Create: `lib/overdrive/server/__tests__/leaderboard-service.test.ts`
- Create: `app/api/overdrive/leaderboards/daily/route.ts`
- Create: `app/api/overdrive/leaderboards/endless/route.ts`
- Create: `app/api/overdrive/leaderboards/__tests__/routes.test.ts`
- Create: `features/overdrive/competition/components/leaderboard-panel.tsx`
- Create: `features/overdrive/competition/components/leaderboard-row.tsx`
- Create: `features/overdrive/competition/components/__tests__/leaderboard-panel.test.tsx`
- Modify: `features/overdrive/components/menu.tsx`
- Modify: `features/overdrive/components/run-over.tsx`

**Interfaces:**

```ts
export interface LeaderboardCursorV1 {
  readonly version: 1
  readonly score: number
  readonly finishedAt: string
  readonly id: string
}

export interface LeaderboardPage {
  readonly entries: readonly LeaderboardEntry[]
  readonly nextCursor: string | null
  readonly boardState: "provisional" | "verified"
}
```

- [ ] **Step 1: Test keyset ordering and cursor validation**

Create tied scores and finish times. Assert stable row-ID ordering, no duplicates or skips across pages, limit default 25 and cap 50, invalid cursor rejection, Daily date identity, and separate English/Indonesian boards.

- [ ] **Step 2: Test the UI states**

Cover loading, empty, error/retry, provisional badge, verified badge, current-player row, pagination, keyboard focus, and no exposure of email or replay storage details.

- [ ] **Step 3: Confirm red tests**

```bash
npx vitest run lib/overdrive/server/__tests__/leaderboard-service.test.ts app/api/overdrive/leaderboards features/overdrive/competition/components
```

Expected: missing service, routes, and components.

- [ ] **Step 4: Implement opaque cursors and indexed queries**

Encode only the versioned keyset tuple, sign or strictly validate its structure, and query the exact index order from TDD section 17. Do not use `OFFSET`.

- [ ] **Step 5: Add safe public caching**

Cache board pages briefly with board identity in the key. Daily cache duration cannot cross UTC reset. Do not cache an authenticated personalized response; merge the current player's result client-side from safe data.

- [ ] **Step 6: Integrate the navigation and Run Over entry points**

Expose `Daily` and `Endless` tabs only when the competition public flag and base flag are on. Preserve the existing Practice leaderboard route and label the Overdrive board distinctly.

- [ ] **Step 7: Verify**

```bash
npx vitest run lib/overdrive/server/__tests__/leaderboard-service.test.ts app/api/overdrive/leaderboards features/overdrive/competition/components
npx playwright test e2e/overdrive.spec.ts --project=chromium
npx tsc --noEmit
```

Expected: exit 0 and stable paging for tied rows.

- [ ] **Step 8: Commit**

```bash
git add lib/overdrive/server/leaderboard-service.ts lib/overdrive/server/__tests__/leaderboard-service.test.ts app/api/overdrive/leaderboards features/overdrive/competition/components features/overdrive/components/menu.tsx features/overdrive/components/run-over.tsx
git commit -m "feat(overdrive): add Daily and endless boards (D-2, A-1, A-2)"
```

### Task 20: Transport privacy-bounded product telemetry

**Requirements:** F-5, A-1, A-2

**Files:**

- Modify: `lib/telemetry/index.ts`
- Modify: `lib/telemetry/__tests__/telemetry.test.ts`
- Create: `features/overdrive/presentation/telemetry-client.ts`
- Create: `features/overdrive/presentation/__tests__/telemetry-client.test.ts`
- Create: `lib/overdrive/server/telemetry-service.ts`
- Create: `lib/overdrive/server/__tests__/telemetry-service.test.ts`
- Create: `app/api/overdrive/telemetry/route.ts`
- Create: `app/api/overdrive/telemetry/__tests__/route.test.ts`

**Interfaces:**

```ts
export interface ProductEventEnvelope {
  readonly eventName: ProductEventName
  readonly eventVersion: 1
  readonly anonymousSessionId: string
  readonly runPublicId: string | null
  readonly occurredAt: string
  readonly payload: ProductEventPayload
}

export interface TelemetryBatch {
  readonly events: readonly ProductEventEnvelope[]
}
```

- [ ] **Step 1: Add allowlist and privacy tests**

Assert a maximum of 50 events and 65,536 bytes; recognized event/version pairs only; bounded numbers and strings; no `character`, `key`, `word`, `typedText`, email, access token, seed replay input, or raw exception body; and user identity derived only after optional auth verification.

- [ ] **Step 2: Add client batching tests**

Test stage/run aggregate buffering, size/count flush, page-hide `sendBeacon`, `fetch(..., { keepalive: true })` fallback, failure drop policy, and teardown. Telemetry may never block input, saving, submission, or navigation.

- [ ] **Step 3: Confirm red tests**

```bash
npx vitest run lib/telemetry features/overdrive/presentation/__tests__/telemetry-client.test.ts lib/overdrive/server/__tests__/telemetry-service.test.ts app/api/overdrive/telemetry
```

Expected: failure because transport, server validation, and route are absent.

- [ ] **Step 4: Implement allowlisted aggregation**

Preserve the existing local CustomEvent for development subscribers. Add a separate bounded transport consumer. Store presentation latency percentiles, dropped decorative beats, pool high-water marks, stage completion, run completion, and submission state; never raw typing.

- [ ] **Step 5: Implement route and storage**

The route works for anonymous or authenticated sessions, validates optional bearer auth and the bounded session identity, enforces the telemetry limiter, rejects forbidden fields, assigns receive time server-side, and inserts only through the admin client.

- [ ] **Step 6: Verify**

```bash
npx vitest run lib/telemetry features/overdrive/presentation lib/overdrive/server app/api/overdrive/telemetry
npx tsc --noEmit
npm run lint
```

Expected: exit 0 and privacy-field mutation tests all reject.

- [ ] **Step 7: Commit**

```bash
git add lib/telemetry features/overdrive/presentation lib/overdrive/server/telemetry-service.ts lib/overdrive/server/__tests__/telemetry-service.test.ts app/api/overdrive/telemetry
git commit -m "feat(overdrive): add privacy-bounded telemetry (F-5, A-1)"
```

### Task 21: Reconcile Run Over, share copy, and navigation with competition truth

**Requirements:** D-2, D-3, A-1, J-3

**Files:**

- Create: `features/overdrive/competition/submission-copy.ts`
- Create: `features/overdrive/competition/__tests__/submission-copy.test.ts`
- Modify: `features/overdrive/components/run-over.tsx`
- Modify: `features/overdrive/components/menu.tsx`
- Modify: `features/overdrive/components/overdrive-app.tsx`
- Modify: `components/navbar.tsx`
- Modify: `e2e/overdrive.spec.ts`

**Interfaces:**

```ts
export function getSubmissionLabel(state: SubmissionState): string
export function createRunShareText(input: RunShareInput): string
```

- [ ] **Step 1: Lock truthful copy in unit tests**

Required labels are `SAVED LOCALLY`, `QUEUED`, `SUBMITTING`, `PROVISIONAL`, `VERIFIED`, and `REJECTED`. M4 accepted results use `PROVISIONAL`; only M6 replay matches use `VERIFIED`.

- [ ] **Step 2: Add end-to-end state transitions**

Mock successful, offline, retryable, and rejected submissions. Assert Run Over renders immediately, retry is available when useful, and navigation remains operable.

- [ ] **Step 3: Run the red tests**

```bash
npx vitest run features/overdrive/competition/__tests__/submission-copy.test.ts
npx playwright test e2e/overdrive.spec.ts --project=chromium
```

Expected: missing copy adapter and incorrect current submission presentation.

- [ ] **Step 4: Integrate authoritative labels and board links**

Show mode, seed identity for Daily, local final score, server state, board link, and safe retry. The navbar keeps an Overdrive entry while the base flag is on; competition children hide when their public flag is off.

- [ ] **Step 5: Constrain M4 share output**

Share mode, score, Zone/Stage, and a route URL. Do not claim replay verification, publish private run IDs, or include an access token, raw seed input stream, email, or replay storage path.

- [ ] **Step 6: Verify M4 as one flow**

```bash
npx vitest run features/overdrive/competition
npx playwright test e2e/overdrive.spec.ts e2e/overdrive-mobile.spec.ts --project=chromium
npm run build:worker
```

Expected: exit 0; the OpenNext Worker build includes Route Handlers, and Practice still passes its existing tests.

- [ ] **Step 7: Commit**

```bash
git add features/overdrive/competition features/overdrive/components components/navbar.tsx e2e/overdrive.spec.ts
git commit -m "feat(overdrive): surface truthful competition states (D-2, D-3, A-1)"
```

### Task 22: Record and encode deterministic replay input in the headless engine

**Requirements:** D-4, R-2, F-4

**Files:**

- Create: `lib/engine/overdrive/replay/types.ts`
- Create: `lib/engine/overdrive/replay/recorder.ts`
- Create: `lib/engine/overdrive/replay/codec.ts`
- Create: `lib/engine/overdrive/replay/__tests__/recorder.test.ts`
- Create: `lib/engine/overdrive/replay/__tests__/codec.test.ts`
- Modify: `lib/engine/overdrive/types.ts`
- Modify: `lib/engine/overdrive/run.ts`
- Modify: `lib/engine/overdrive/index.ts`

**Interfaces:**

```ts
export const REPLAY_CODEC_VERSION = 1
export const REPLAY_MAX_BYTES = 262_144
export const REPLAY_MAX_INPUTS = 20_000
export const REPLAY_MAX_DELTA_MS = 300_000

export type ReplayInputKind =
  | "character"
  | "backspace"
  | "submit"
  | "overdrive"
  | "macro"

export interface ReplayInputV1 {
  readonly deltaMs: number
  readonly kind: ReplayInputKind
  readonly value: string | number | null
}

export function encodeReplay(replay: ReplayV1): Uint8Array
export function decodeReplay(bytes: Uint8Array): ReplayV1
```

- [ ] **Step 1: Add recorder tests before engine integration**

Use a fake monotonic clock. Assert input order, non-negative deltas, character/backspace/submit/Overdrive/Macro values, pause handling, stable header versions, reset behavior, and no presentation event capture.

- [ ] **Step 2: Add codec round-trip and hostile-input tests**

Cover empty and maximum valid replays, multibyte UTF-8 characters from the allowed word pools, truncated varints, invalid kinds, unsupported versions, non-canonical encodings, excessive delta, excessive input count, and byte limit.

- [ ] **Step 3: Run the red suite**

```bash
npx vitest run lib/engine/overdrive/replay
```

Expected: missing replay modules.

- [ ] **Step 4: Implement the versioned binary codec**

Write the versioned header, varint delta, one-byte kind, and bounded value. The decoder validates before allocation and returns immutable domain values. It imports no Node, React, Pixi, DOM, Supabase, or Cloudflare modules.

- [ ] **Step 5: Attach recording at the public engine input boundary**

Record accepted input intent with the same monotonic elapsed-time source that advances the run. Export finalized bytes only after Run Over. Saved runs persist recorder state so reload does not reset the replay timeline.

- [ ] **Step 6: Hash in the browser adapter, not the engine**

Use `crypto.subtle.digest("SHA-256", bytes)` in `features/overdrive/competition/api.ts`. The pure engine returns bytes and has no Web Crypto dependency.

- [ ] **Step 7: Verify determinism and dependency purity**

```bash
npx vitest run lib/engine/overdrive/replay lib/engine/overdrive/__tests__/run.test.ts
npx tsc --noEmit
rg -n "react|pixi|window|document|@supabase|cloudflare|Math\.random" lib/engine/overdrive
```

Expected: tests and typecheck exit 0; the scan reports no forbidden replay dependency or game-logic randomness.

- [ ] **Step 8: Commit**

```bash
git add lib/engine/overdrive features/overdrive/competition/api.ts
git commit -m "feat(overdrive): record deterministic run replays (D-4, R-2)"
```

### Task 23: Store replay blobs privately in R2 and stream authorized reads

**Requirements:** D-4, D-5, F-3, A-2

**Files:**

- Modify: `wrangler.jsonc`
- Modify: `env.example`
- Generate: `cloudflare-env.d.ts`
- Modify: `lib/cloudflare/env.ts`
- Create via CLI: the single file matched by `supabase/migrations/*_create_overdrive_replays.sql`
- Create: `supabase/tests/database/overdrive_replays.test.sql`
- Regenerate: `lib/supabase/database.types.ts`
- Create: `lib/overdrive/server/replay-service.ts`
- Create: `lib/overdrive/server/__tests__/replay-service.test.ts`
- Create: `app/api/overdrive/replays/[runId]/route.ts`
- Create: `app/api/overdrive/replays/[runId]/__tests__/route.test.ts`

**Interfaces:**

```ts
export interface ReplayObjectStore {
  put(key: string, bytes: Uint8Array, sha256: string): Promise<void>
  get(key: string): Promise<R2ObjectBody | null>
  delete(key: string): Promise<void>
}

export function replayObjectKey(input: {
  readonly rulesetVersion: string
  readonly runPublicId: string
}): string
```

- [ ] **Step 1: Add the private R2 binding**

Add `OVERDRIVE_REPLAYS` under `r2_buckets` in `wrangler.jsonc`. Create separate preview and production buckets through Wrangler outside the migration commit; never expose a public bucket URL.

```bash
npx wrangler r2 bucket create typecade-overdrive-replays-preview
npx wrangler r2 bucket create typecade-overdrive-replays
npm run cf-typegen
```

Expected: the buckets exist and `cloudflare-env.d.ts` includes `OVERDRIVE_REPLAYS: R2Bucket`.

- [ ] **Step 2: Create the replay metadata migration with the CLI**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase migration new create_overdrive_replays
```

Implement the `replays` table and indexes from TDD section 17.5. Authenticated users may select only their metadata. Browser roles cannot insert, update, or delete.

- [ ] **Step 3: Write pgTAP and service tests**

Cover ownership RLS, blocked storage-key reads by other users, SHA-256 mismatch, byte-count mismatch, server-owned object key, failed-R2 cleanup, failed-database cleanup, duplicate idempotency, owner reads, verified public leaderboard reads, and private unverified denial.

- [ ] **Step 4: Implement request-scoped R2 access**

Use `getCloudflareContext()` inside the Route Handler request path. Do not create a second Worker, module-scope client, public bucket, or direct Postgres connection.

- [ ] **Step 5: Implement upload ordering and compensation**

Recalculate SHA-256 server-side, validate 262,144-byte and 20,000-input bounds, store under `overdrive/replays/v1/<ruleset-version>/<run-public-id>.bin`, then insert metadata. Delete the object if metadata insertion fails. Retry returns the existing matching metadata; a mismatched retry is rejected.

- [ ] **Step 6: Implement streamed reads**

Allow the owner or any `verified` published leaderboard run. Challenge Links carry conditions and a target score and do not grant private replay access. Stream `object.body` with `application/vnd.typecade.overdrive-replay`, content length, ETag, and `nosniff`.

- [ ] **Step 7: Verify locally and in workerd**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase db reset
npx supabase test db supabase/tests/database --local
npx supabase db lint --local --level warning --fail-on error
npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts
npm run preview
```

Expected: pgTAP and lint pass; the preview starts in workerd and the route sees the R2 binding. Stop the preview after the smoke request.

- [ ] **Step 8: Commit**

```bash
git add wrangler.jsonc env.example cloudflare-env.d.ts lib/cloudflare/env.ts supabase/migrations supabase/tests/database/overdrive_replays.test.sql lib/supabase/database.types.ts lib/overdrive/server/replay-service.ts lib/overdrive/server/__tests__/replay-service.test.ts app/api/overdrive/replays
git commit -m "feat(overdrive): store private replays in R2 (D-4, F-3, A-2)"
```

### Task 24: Verify ranked replays with the shared engine before publication

**Requirements:** D-2, D-4, D-6, R-2, F-4

**Files:**

- Create: `lib/engine/overdrive/replay/verifier.ts`
- Create: `lib/engine/overdrive/replay/__tests__/verifier.test.ts`
- Create: `lib/engine/overdrive/replay/interval-policy.ts`
- Create: `lib/engine/overdrive/replay/__tests__/interval-policy.test.ts`
- Modify: `lib/overdrive/server/run-service.ts`
- Modify: `lib/overdrive/server/replay-service.ts`
- Modify: `app/api/overdrive/runs/submit/route.ts`
- Modify: `supabase/tests/database/overdrive_competition.test.sql`

**Interfaces:**

```ts
export type ReplayVerificationCode =
  | "matched"
  | "unsupported_version"
  | "hash_mismatch"
  | "identity_mismatch"
  | "result_mismatch"
  | "invalid_interval"
  | "invalid_input"

export interface ReplayVerificationResult {
  readonly ok: boolean
  readonly code: ReplayVerificationCode
  readonly computed: RunVerificationSummary | null
}
```

- [ ] **Step 1: Add golden replay fixtures**

Generate fixtures through the recorder and public engine methods. Cover a standard loss, Zone 8 win, endless continuation, Daily run, Macro activation, Overdrive release, backspace, and save/resume.

- [ ] **Step 2: Add mismatch and interval tests**

Mutate one header version, seed, input, delta, build item, score factor, final state, and hash at a time. Assert a stable rejection code. Interval policy uses documented and explicitly reviewed bounds; it reports suspicious input and never changes the score itself.

- [ ] **Step 3: Run the red suite**

```bash
npx vitest run lib/engine/overdrive/replay/__tests__/verifier.test.ts lib/engine/overdrive/replay/__tests__/interval-policy.test.ts
```

Expected: verifier and interval-policy modules are missing.

- [ ] **Step 4: Implement pure deterministic verification**

Load the canonical word pool and versions, create the run with the replay seed, advance time by each delta, call only public engine inputs, and compare every field in TDD section 20.3. Return data; do not read the database or R2 in the pure verifier.

- [ ] **Step 5: Make M6 submission replay-required for ranked publication**

When `OVERDRIVE_REPLAY` is enabled, ranked submissions without replay remain stored but cannot publish. A matching replay sets run and replay `verified` and publishes atomically. A mismatch sets both terminal rejection states with a structured code and no raw input in logs.

- [ ] **Step 6: Test idempotent state transitions**

Assert `submitted -> verified` and `submitted -> rejected` only, final-state retries return the existing result, and an `accepted` M4 row can be upgraded to `verified` after the M6 rollout.

- [ ] **Step 7: Verify**

```bash
npx vitest run lib/engine/overdrive/replay lib/overdrive/server app/api/overdrive/runs/submit
npx tsc --noEmit
npm run lint
```

Expected: exit 0; all golden replays match and every mutation rejects predictably.

- [ ] **Step 8: Commit**

```bash
git add lib/engine/overdrive/replay lib/overdrive/server app/api/overdrive/runs/submit supabase/tests/database/overdrive_competition.test.sql
git commit -m "feat(overdrive): verify ranked run replays (D-4, D-6, R-4)"
```

### Task 25: Add Ghost Race and Challenge Link without changing canonical scoring

**Requirements:** D-5, A-1, A-2, A-3

**Files:**

- Create: `features/overdrive/competition/ghost-runner.ts`
- Create: `features/overdrive/competition/__tests__/ghost-runner.test.ts`
- Create: `features/overdrive/competition/challenge-link.ts`
- Create: `features/overdrive/competition/__tests__/challenge-link.test.ts`
- Create: `features/overdrive/competition/components/ghost-status.tsx`
- Create: `features/overdrive/competition/components/challenge-result.tsx`
- Modify: `features/overdrive/components/menu.tsx`
- Modify: `features/overdrive/components/gameplay.tsx`
- Modify: `features/overdrive/components/run-over.tsx`
- Modify: `features/overdrive/canvas/choreography/target-roster.ts`
- Create: `e2e/overdrive-ghost.spec.ts`

**Interfaces:**

```ts
export interface GhostSnapshot {
  readonly elapsedMs: number
  readonly zone: number
  readonly stage: StageType
  readonly wordProgress: number
  readonly score: number
  readonly finished: boolean
}

export interface ChallengeLinkV1 {
  readonly version: 1
  readonly seed: string
  readonly language: WordPoolLanguage
  readonly rulesetVersion: string
  readonly wordPoolVersion: string
  readonly targetScore: number
  readonly sourceRunId: string
}
```

- [ ] **Step 1: Test the ghost clock as a pure projection**

Advance a decoded replay with a fake clock. Assert pause/resume, seek-free monotonic playback, deterministic snapshots, finish behavior, and zero writes to the player's engine or store.

- [ ] **Step 2: Test Challenge Link parsing**

Accept only versioned, bounded, canonical language/version/seed/score data. Reject malformed, oversized, unsupported, and mismatched links. A Challenge Link sets identical conditions and a target score; it does not grant a leaderboard attempt or replay access.

- [ ] **Step 3: Run red tests**

```bash
npx vitest run features/overdrive/competition/__tests__/ghost-runner.test.ts features/overdrive/competition/__tests__/challenge-link.test.ts
npx playwright test e2e/overdrive-ghost.spec.ts --project=chromium
```

Expected: missing ghost and challenge modules.

- [ ] **Step 4: Implement Ghost Race as presentation-only competition**

Fetch an owned or verified published replay, decode it, and feed a separate ghost projection. Render a distinct non-colliding ghost actor and compact ahead/behind status. The ghost cannot consume RNG, trigger items, block targets, change Quota, or alter score.

- [ ] **Step 5: Implement Challenge Link creation and entry**

Encode the TDD/GDD conditions in the `/overdrive` query string using base64url JSON with strict version validation. The recipient sees the target before play and a won/lost comparison at Run Over. Anonymous play remains available and unranked.

- [ ] **Step 6: Respect reduced motion and privacy**

Reduced motion replaces the animated ghost with a progress marker and ahead/behind text. Share data excludes display name unless the user explicitly chooses public verified board identity; it never includes email, access token, storage key, or raw keystrokes.

- [ ] **Step 7: Verify**

```bash
npx vitest run features/overdrive/competition
npx playwright test e2e/overdrive-ghost.spec.ts e2e/overdrive-accessibility.spec.ts --project=chromium
npx tsc --noEmit
```

Expected: exit 0; the same player run yields the same score with Ghost Race off or on.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/competition features/overdrive/components features/overdrive/canvas/choreography/target-roster.ts e2e/overdrive-ghost.spec.ts
git commit -m "feat(overdrive): add Ghost Race and Challenge Link (D-5, A-3)"
```

### Task 26: Defer login until value is visible and migrate eligible local history safely

**Requirements:** A-1, A-2, A-3, D-2

**Files:**

- Create: `features/overdrive/competition/local-history-migration.ts`
- Create: `features/overdrive/competition/__tests__/local-history-migration.test.ts`
- Create: `features/overdrive/competition/components/login-value-prompt.tsx`
- Modify: `features/overdrive/components/run-over.tsx`
- Modify: `features/overdrive/components/menu.tsx`
- Modify: `components/auth-modal.tsx`
- Modify: `lib/auth/auth-context.tsx`
- Create: `e2e/overdrive-login.spec.ts`

**Interfaces:**

```ts
export interface LocalHistoryMigrationResult {
  readonly eligible: number
  readonly queued: number
  readonly skippedAnonymousDaily: number
  readonly invalid: number
}

export function migrateLocalRunsToOutbox(
  runs: readonly PersistedRun[],
  userId: string,
): LocalHistoryMigrationResult
```

- [ ] **Step 1: Test migration eligibility**

Free runs with supported versions and final results may queue idempotently. Anonymous Daily attempts remain unranked and are never converted into a recorded attempt after completion. Invalid, unfinished, unsupported, and already-migrated records are skipped with a stable reason.

- [ ] **Step 2: Test prompt timing**

The automatic prompt may appear on Run Over only after the local finished-run counter reaches three. A user may explicitly open the existing sign-in action earlier, but that is not an automatic prompt. Neither path interrupts active play, Shop, Standard Clear, or the first anonymous route visit.

- [ ] **Step 3: Confirm red tests**

```bash
npx vitest run features/overdrive/competition/__tests__/local-history-migration.test.ts
npx playwright test e2e/overdrive-login.spec.ts --project=chromium
```

Expected: missing migration module and prompt.

- [ ] **Step 4: Implement value-framed authentication copy**

Explain cross-device history and ranked publication in plain English. Keep a clear `NOT NOW` path and persist dismissal so the prompt does not repeat during the same run/session. Do not promise retroactive Daily ranking, bonus power, currency, or a better score.

- [ ] **Step 5: Migrate after verified session change**

Use the authenticated user from `AuthContext`, queue eligible Free results under their original `clientRunId`, persist migration markers, and let the existing outbox perform network retries. Do not use `user_metadata.username` as authorization.

- [ ] **Step 6: Verify anonymous and authenticated paths**

```bash
npx vitest run features/overdrive/competition lib/auth
npx playwright test e2e/overdrive-login.spec.ts e2e/overdrive.spec.ts --project=chromium
npx tsc --noEmit
```

Expected: exit 0; anonymous full play works, and logging in never creates a ranked historical Daily attempt.

- [ ] **Step 7: Commit**

```bash
git add features/overdrive/competition features/overdrive/components/run-over.tsx features/overdrive/components/menu.tsx components/auth-modal.tsx lib/auth/auth-context.tsx e2e/overdrive-login.spec.ts
git commit -m "feat(overdrive): defer login and migrate local history (A-1, A-2)"
```

### Task 27: Build the progression release gate and versioned curve simulator

**Requirements:** post-retention extension; F-5, J-1, J-3, D-4, D-6

**Start condition:** M4 and M6 telemetry have enough eligible cohorts to calculate every gate in the approved design spec. This task may build and run the evaluator before the gate passes, but Tasks 28-30 stay disabled until the result passes and the GDD amendment in Step 7 is approved.

**Files:**

- Create: `lib/overdrive/meta/types.ts`
- Create: `lib/overdrive/meta/level-curve.ts`
- Create: `lib/overdrive/meta/simulator.ts`
- Create: `lib/overdrive/meta/release-gate.ts`
- Create: `lib/overdrive/meta/__tests__/level-curve.test.ts`
- Create: `lib/overdrive/meta/__tests__/simulator.test.ts`
- Create: `lib/overdrive/meta/__tests__/release-gate.test.ts`
- Create: `scripts/simulate-overdrive-progression.mjs`
- Modify: `package.json`
- Modify after approval: `docs/game-design.md`
- Modify after approval: `docs/prd.md`

**Interfaces:**

```ts
export type LevelCurveVersion = "v1"

export interface LevelCurveConfig {
  readonly version: LevelCurveVersion
  readonly levelThresholds: readonly number[]
}

export interface ProgressionGateInput {
  readonly m4EndToEnd: boolean
  readonly firstRunResolutionBps: number
  readonly secondRunBps: number
  readonly day1RetentionBps: number
  readonly day7RetentionBps: number
  readonly shareRateBps: number
  readonly lowEndFpsP05X100: number
  readonly inputAcknowledgementP95Ms: number
  readonly contactP95Ms: number
  readonly crashFreeRunRateBps: number
  readonly replayVerificationSuccessBps: number
}

export function evaluateProgressionGate(input: ProgressionGateInput): GateReport
export function simulateProgression(
  config: LevelCurveConfig,
  cohorts: readonly ProgressionCohort[],
): ProgressionSimulationReport
```

- [ ] **Step 1: Write release-gate tests from the approved thresholds**

Assert M4 end-to-end; first-run resolution at least 60%; second-run at least 35%; D1 at least 20%; D7 at least 8%; share rate at least 10%; low-end at least 55 FPS; input acknowledgement p95 at most 50ms; contact p95 at most 90ms; and the operational crash-free/verification thresholds approved in the TDD review. Missing, undersized, or mixed-version cohorts return `insufficient-data`, never a pass.

- [ ] **Step 2: Write curve and simulator invariants**

Assert threshold zero for level 1, strictly increasing thresholds, total-XP inverse correctness, finite values, configured maximum level, no WPM multiplier, deterministic cohort reports, first reward eligibility after the first resolved run, and target bands of level 5 in 5-7 runs, level 10 in 15-20, and level 20 in 50-70.

- [ ] **Step 3: Run the red suite**

```bash
npx vitest run lib/overdrive/meta
```

Expected: missing pure meta modules.

- [ ] **Step 4: Implement pure evaluators**

Use integer basis points and versioned immutable configuration. The modules import no engine mutation, React, Pixi, DOM, database, Cloudflare, or Supabase code. Level calculation uses a monotonic threshold lookup and returns `level`, `xpIntoLevel`, and `xpForNextLevel`.

- [ ] **Step 5: Add the simulator CLI**

Add `"simulate:overdrive-progression": "node scripts/simulate-overdrive-progression.mjs"`. The command reads an explicit checked-in candidate configuration, prints stable JSON, and exits nonzero when a milestone falls outside its target band.

- [ ] **Step 6: Produce the gate report from version-matched telemetry**

Record cohort window, sample size, client/ruleset versions, exclusions, each numerator/denominator, confidence interval, low-end device profile, trace conditions, crash-free calculation, and replay-verification failure categories. Do not combine pre-M4 and post-M4 behavior.

- [ ] **Step 7: Stop for the required design amendment**

Present the simulator output and gate report for product approval. The amendment must define, in `docs/game-design.md`, the currency name, XP grant table, currency grant table, level thresholds, maximum level behavior, exact first catalog item IDs and prices, refund policy, and exact achievement requirements/rewards. Add `A-4` for non-power account levels, `A-5` for play-earned cosmetic currency/catalog/inventory, and `A-6` for ranked-safe equipment to `docs/prd.md`, all as gated post-retention requirements. Do not begin Task 28 before the user approves those canonical values.

- [ ] **Step 8: Verify after approval**

```bash
npm run simulate:overdrive-progression
npx vitest run lib/overdrive/meta
npx tsc --noEmit
```

Expected: exit 0; all milestones fit approved bands and `evaluateProgressionGate()` reports `passed` for the approved evidence set.

- [ ] **Step 9: Commit**

```bash
git add lib/overdrive/meta scripts/simulate-overdrive-progression.mjs package.json package-lock.json docs/game-design.md docs/prd.md
git commit -m "docs(overdrive): approve gated account progression rules (A-4, A-5, A-6)"
```

### Task 28: Create the post-retention wallet, inventory, equipment, and ledger schema

**Requirements:** proposed A-4, A-5, A-6 after Task 27 approval; A-2

**Files:**

- Create via CLI: the single file matched by `supabase/migrations/*_create_overdrive_progression.sql`
- Create: `supabase/tests/database/overdrive_progression.test.sql`
- Regenerate: `lib/supabase/database.types.ts`
- Create: `lib/overdrive/meta/catalog.ts`
- Create: `lib/overdrive/meta/__tests__/catalog.test.ts`

**Interfaces:**

```ts
export type CosmeticSlot =
  | "warden-material"
  | "cannon-effect"
  | "caret"
  | "arena-colorway"
  | "profile-frame"
  | "title"
  | "sound-pack"

export interface CosmeticDefinition {
  readonly id: string
  readonly slot: CosmeticSlot
  readonly name: string
  readonly price: number
  readonly catalogVersion: number
  readonly reducedMotionSafe: boolean
  readonly rankedSafe: boolean
}
```

- [ ] **Step 1: Generate the migration only after Task 27 approval**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase migration new create_overdrive_progression
```

- [ ] **Step 2: Write pgTAP tests before schema SQL**

Cover one progression row per user; non-negative XP and balance; immutable ledger; unique `(user_id, idempotency_key)`; unique inventory ownership; one item per user/slot; active catalog reads; own-row RLS; blocked client balance mutation; item-slot compatibility; duplicate-purchase rejection; insufficient funds; and atomic rollback.

- [ ] **Step 3: Confirm red database tests**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase db reset
npx supabase test db supabase/tests/database --local
```

Expected: progression object tests fail because the migration is empty.

- [ ] **Step 4: Implement normalized tables and indexes**

Create `overdrive_progression`, `cosmetic_catalog`, `cosmetic_inventory`, `cosmetic_equipment`, and `progression_ledger` with identity primary keys, UUID user foreign keys, integer balances, timestamps, version columns, constraints, and indexes matching RLS/query columns.

- [ ] **Step 5: Mirror the approved catalog manifest**

The TypeScript manifest and migration seed rows use the exact IDs, names, slots, prices, and safety flags approved in Task 27. A test compares normalized TypeScript entries with selected database rows so drift fails CI.

- [ ] **Step 6: Implement the atomic purchase function**

`purchase_overdrive_cosmetic(cosmetic_id text)` resolves `(select auth.uid())`, locks the progression row, validates an active item and ownership, checks balance, inserts inventory and immutable ledger rows, updates balance, and returns typed rows. Set `search_path = ''`, qualify objects, revoke `PUBLIC`, and grant only `authenticated`.

- [ ] **Step 7: Reset, test, lint, and regenerate types**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npx supabase db reset
npx supabase test db supabase/tests/database --local
npx supabase db lint --local --level warning --fail-on error
npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts
```

Expected: pgTAP and lint pass; generated types include all progression tables and purchase RPC.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations supabase/tests/database/overdrive_progression.test.sql lib/supabase/database.types.ts lib/overdrive/meta/catalog.ts lib/overdrive/meta/__tests__/catalog.test.ts
git commit -m "feat(overdrive): add secured cosmetic progression schema (A-4, A-5, A-6)"
```

### Task 29: Grant rewards idempotently and expose the gated catalog and purchase flow

**Requirements:** proposed A-4 and A-5 after Task 27 approval; A-2, D-4, D-6

**Files:**

- Create: `lib/overdrive/meta/rewards.ts`
- Create: `lib/overdrive/meta/__tests__/rewards.test.ts`
- Create: `lib/overdrive/server/progression-service.ts`
- Create: `lib/overdrive/server/__tests__/progression-service.test.ts`
- Create: `app/api/overdrive/progression/purchase/route.ts`
- Create: `app/api/overdrive/progression/purchase/__tests__/route.test.ts`
- Create: `features/overdrive/meta/api.ts`
- Create: `features/overdrive/meta/store.ts`
- Create: `features/overdrive/meta/components/progression-summary.tsx`
- Create: `features/overdrive/meta/components/catalog.tsx`
- Create: `features/overdrive/meta/components/__tests__/catalog.test.tsx`
- Modify: `features/overdrive/components/run-over.tsx`
- Modify: `features/overdrive/components/menu.tsx`

**Interfaces:**

```ts
export interface RunRewardInput {
  readonly runPublicId: string
  readonly verificationState: "verified"
  readonly resolvedStages: number
  readonly resolvedRun: boolean
  readonly firstDailyCompletion: boolean
  readonly personalBest: boolean
  readonly achievements: readonly ApprovedAchievementId[]
}

export interface RewardGrant {
  readonly idempotencyKey: string
  readonly xp: number
  readonly cosmeticCurrency: number
  readonly sources: readonly RewardSource[]
}
```

- [ ] **Step 1: Test reward purity and idempotency**

Use the approved grant table. Assert same verified run produces the same grant and key; WPM alone never changes XP; rejected/provisional/unresolved runs do not receive ranked-only grants; caps apply exactly; and achievements grant once.

- [ ] **Step 2: Test service and route authorization**

Cover feature-off `404`, anonymous `401`, unknown/inactive item, insufficient balance, duplicate ownership, concurrent duplicate purchase, mismatched slot, success response, and safe errors.

- [ ] **Step 3: Test UI states**

Cover loading, owned, affordable, insufficient balance, purchase pending, purchase retry, reduced-motion/ranked-safe badges, keyboard purchase confirmation, and balance reconciliation from the server response.

- [ ] **Step 4: Run the red suite**

```bash
npx vitest run lib/overdrive/meta lib/overdrive/server/__tests__/progression-service.test.ts app/api/overdrive/progression features/overdrive/meta
```

Expected: missing reward, service, route, store, and components.

- [ ] **Step 5: Implement reward grants at verified publication**

Call pure reward calculation after replay verification, then write ledger and balance atomically under the run-derived idempotency key. A retry returns the existing projection. Run Tokens never enter this service.

- [ ] **Step 6: Implement thin catalog and purchase APIs**

Read active public catalog data with generated types. Purchase verifies auth, enforces the write limiter, calls the authenticated atomic RPC, and returns balance, inventory, and ledger identities. There is no real-money route, random roll, paid currency, or run-power SKU.

- [ ] **Step 7: Gate every surface**

Require base, server meta, and public meta flags as applicable. When disabled, server routes return `404`, menus hide the entry, and existing run/competition behavior remains identical.

- [ ] **Step 8: Verify**

```bash
npx vitest run lib/overdrive/meta lib/overdrive/server app/api/overdrive/progression features/overdrive/meta
npx playwright test e2e/overdrive.spec.ts --project=chromium
npx tsc --noEmit
```

Expected: exit 0; duplicate reward and purchase attempts do not duplicate value or ownership.

- [ ] **Step 9: Commit**

```bash
git add lib/overdrive/meta lib/overdrive/server/progression-service.ts lib/overdrive/server/__tests__/progression-service.test.ts app/api/overdrive/progression features/overdrive/meta features/overdrive/components/run-over.tsx features/overdrive/components/menu.tsx
git commit -m "feat(overdrive): add gated cosmetic rewards and catalog (A-4, A-5)"
```

### Task 30: Equip ranked-safe cosmetics without weakening gameplay readability

**Requirements:** proposed A-6 after Task 27 approval; A-2, J-1, J-3

**Files:**

- Create: `features/overdrive/meta/equipment.ts`
- Create: `features/overdrive/meta/__tests__/equipment.test.ts`
- Create: `features/overdrive/meta/components/equipment.tsx`
- Create: `features/overdrive/meta/components/__tests__/equipment.test.tsx`
- Modify: `features/overdrive/canvas/assets/combat-assets.ts`
- Modify: `features/overdrive/canvas/combat-scene.ts`
- Modify: `features/overdrive/canvas/effects/combat-effects.ts`
- Modify: `features/overdrive/components/hud.tsx`
- Create: `e2e/overdrive-cosmetics.spec.ts`

**Interfaces:**

```ts
export interface EquippedCosmetics {
  readonly bySlot: Readonly<Partial<Record<CosmeticSlot, string>>>
  readonly catalogVersion: number
}

export function resolveRankedSafeLoadout(
  equipped: EquippedCosmetics,
  catalog: readonly CosmeticDefinition[],
): ResolvedCosmeticLoadout
```

- [ ] **Step 1: Write safety fallback tests**

Unknown, unavailable, wrong-slot, version-incompatible, non-ranked-safe, or non-reduced-motion-safe selections fall back to base assets. The resolver never changes animation duration, hitbox, Quota, RNG, score, item behavior, particle cap, or audio bus gain.

- [ ] **Step 2: Add visual behavior tests**

Equip one approved item per shipped slot. Assert actor silhouettes, active-word contrast, enemy telegraphs, 200-object cap, reduced-motion variant, and base-equivalent sound level. Capture stable screenshots for default and equipped desktop/mobile states.

- [ ] **Step 3: Run red tests**

```bash
npx vitest run features/overdrive/meta/__tests__/equipment.test.ts features/overdrive/meta/components/__tests__/equipment.test.tsx
npx playwright test e2e/overdrive-cosmetics.spec.ts --project=chromium
```

Expected: equipment resolver and UI are missing.

- [ ] **Step 4: Implement an asset-selection layer**

Resolve approved visual/audio variants before scene construction and retain the same rig/choreography contracts. Do not branch engine code by cosmetic ID. Dispose replaced textures, filters, and audio buffers under their existing owners.

- [ ] **Step 5: Implement authenticated equip persistence**

Validate inventory ownership and slot compatibility server-side using RLS or a narrow typed service. Apply optimistic UI only with rollback to the last server-confirmed loadout.

- [ ] **Step 6: Add a one-action base reset**

Players can restore every slot to default without losing ownership. The control is keyboard accessible and available even when an equipped asset fails to load.

- [ ] **Step 7: Verify gameplay parity**

```bash
npx vitest run lib/engine/overdrive features/overdrive/meta features/overdrive/canvas
npx playwright test e2e/overdrive-cosmetics.spec.ts e2e/overdrive-accessibility.spec.ts --project=chromium
npm run build:worker
```

Expected: exit 0; engine snapshots and scores are byte-equal for default and cosmetic loadouts under the same input/replay.

- [ ] **Step 8: Commit**

```bash
git add features/overdrive/meta features/overdrive/canvas features/overdrive/components/hud.tsx e2e/overdrive-cosmetics.spec.ts
git commit -m "feat(overdrive): equip ranked-safe cosmetic variants (A-6, J-1)"
```

### Task 31: Add CI gates for engine, database, browser, and OpenNext Worker behavior

**Requirements:** F-2 through F-5, J-1, J-3, D-1 through D-6, A-1 through A-3

**Files:**

- Create: `.github/workflows/overdrive-ci.yml`
- Create: `scripts/check-overdrive-boundaries.mjs`
- Create: `scripts/check-client-secrets.mjs`
- Create: `scripts/smoke-worker.mjs`
- Create: `scripts/__tests__/check-overdrive-boundaries.test.ts`
- Create: `scripts/__tests__/check-client-secrets.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `playwright.config.ts`

**Interfaces:**

```ts
export interface BoundaryViolation {
  readonly file: string
  readonly rule: "engine-import" | "game-randomness" | "client-secret" | "token-literal"
  readonly evidence: string
}

export function checkOverdriveBoundaries(root: string): readonly BoundaryViolation[]
export function checkClientAssets(assetRoot: string): readonly BoundaryViolation[]
```

- [ ] **Step 1: Test the static checks with synthetic fixtures**

Assert failures for React/Pixi/DOM/Supabase/Cloudflare imports in the engine, `Math.random()` in game logic, service-role names or values in public assets, raw hex/spacing values in Overdrive components, and passed fixtures for legitimate Web Crypto or server-only code.

- [ ] **Step 2: Run the check tests in the red state**

```bash
npx vitest run scripts/__tests__/check-overdrive-boundaries.test.ts scripts/__tests__/check-client-secrets.test.ts
```

Expected: missing check modules.

- [ ] **Step 3: Implement deterministic static checks**

Parse imports and scoped source text with explicit allow/deny lists and useful file/line output. Never print secret values. Exit nonzero on a violation.

- [ ] **Step 4: Add package scripts**

```json
{
  "check:overdrive-boundaries": "node scripts/check-overdrive-boundaries.mjs",
  "check:client-secrets": "node scripts/check-client-secrets.mjs .open-next/assets",
  "test:db": "supabase test db supabase/tests/database --local",
  "lint:db": "supabase db lint --local --level warning --fail-on error",
  "smoke:worker": "node scripts/smoke-worker.mjs"
}
```

- [ ] **Step 5: Implement a bounded Worker smoke process**

The script starts `npm run preview` as a child process, waits for the logged local URL with a fixed startup timeout, requests `/`, `/overdrive`, `/api/overdrive/daily?language=EN`, and one flag-off route case, then terminates the exact child process in `finally`. It fails on startup timeout, unexpected status, route exception, or leaked child.

- [ ] **Step 6: Create the CI workflow**

Use an Ubuntu runner and pinned Node major supported by the project. Run in this order:

```text
npm ci
npm run cf-typegen
git diff --exit-code -- cloudflare-env.d.ts
npm run check:overdrive-boundaries
npm run lint
npx tsc --noEmit
npm test
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts
git diff --exit-code -- lib/supabase/database.types.ts
npm run test:db
npm run lint:db
npm run build:worker
npm run check:client-secrets
npm run smoke:worker
npx playwright test --project=chromium
```

Always stop local Supabase services in a final workflow step. Cache dependencies, not build output that could hide a Worker integration error.

- [ ] **Step 7: Add rollout security checks**

The release checklist confirms Cloudflare secrets rather than plain variables for `SUPABASE_SERVICE_ROLE_KEY`, preview/production R2 separation, both Worker rate-limit bindings and their `429` telemetry, RLS and grant tests, no public replay bucket, and no Pages build attached to the production domain.

- [ ] **Step 8: Run the full gate locally**

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npm run cf-typegen
git diff --exit-code -- cloudflare-env.d.ts
npm run check:overdrive-boundaries
npm run lint
npx tsc --noEmit
npm test
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local --schema public > lib/supabase/database.types.ts
git diff --exit-code -- lib/supabase/database.types.ts
npm run test:db
npm run lint:db
npm run build:worker
npm run check:client-secrets
npm run smoke:worker
npx playwright test --project=chromium
npx supabase stop
```

Expected: every command exits 0; the Worker smoke uses workerd, not `next dev`.

- [ ] **Step 9: Commit**

```bash
git add .github/workflows/overdrive-ci.yml scripts package.json package-lock.json playwright.config.ts
git commit -m "ci(overdrive): enforce engine database and Worker gates (F-3, D-6)"
```

### Task 32: Reconcile routes, architecture documentation, rollout, and obsolete project notes

**Requirements:** F-2, F-3, D-1 through D-6, A-1 through A-3

**Files:**

- Modify: `README.md`
- Create: `docs/architecture.md`
- Modify: `docs/decisions.md`
- Modify: `docs/todo.md`
- Modify: `docs/superpowers/specs/2026-08-09-overdrive-technical-design-document.md`
- Modify: `docs/superpowers/plans/2026-08-09-overdrive-combat-competition-progression.md`
- Modify: `env.example`
- Modify: `wrangler.jsonc`

**Interfaces:**

- `README.md` is the contributor and operator entry point; it links rather than redefines canonical gameplay values.
- `docs/architecture.md` owns the durable system and directory boundaries.
- The TDD owns API, schema, replay, security, and rollout contracts for this initiative.
- `docs/decisions.md` records accepted choices and consequences; `docs/todo.md` contains only unresolved, actionable work.

- [ ] **Step 1: Audit the implemented route inventory**

Run `rg --files app | Sort-Object` and compare it with TDD section 16. README must list public pages separately from API routes and state feature/auth requirements. The release inventory includes:

```text
GET  /overdrive
GET  /api/overdrive/daily
POST /api/overdrive/daily/attempt
POST /api/overdrive/runs/submit
GET  /api/overdrive/leaderboards/daily
GET  /api/overdrive/leaderboards/endless
POST /api/overdrive/telemetry
GET  /api/overdrive/replays/[runId]
POST /api/overdrive/progression/purchase
```

Mark replay routes M6 and progression post-retention. Do not describe a route as live before its implementation and flag are present.

- [ ] **Step 2: Create a durable architecture guide**

`docs/architecture.md` explains the pure engine boundary, presentation scheduler, Pixi ownership, Route Handler/service split, Supabase access tiers, R2 replay storage, feature flags, local-first outbox, directory responsibilities, and which governing doc wins. Keep gameplay numbers in the GDD and API/schema detail in the TDD; link rather than duplicate them.

- [ ] **Step 3: Update README for operator and contributor truth**

Document the temporary `/overdrive` route and navbar entry, current feature flags, local Supabase commands, Worker build/preview/deploy commands, Cloudflare dashboard settings, database migration workflow, route map, test matrix, architecture link, design spec, TDD, and implementation plan.

- [ ] **Step 4: Record decisions and cleanse stale notes**

Add dated ADR summaries for one OpenNext Worker, semantic presentation scheduling, Supabase privileged writes, R2 replay blobs, local-first submission, and gated non-power progression. Reduce `docs/todo.md` to unresolved work with owner, requirement ID, gate, and verification command. Remove obsolete copied prompts and repair mojibake only after confirming their decisions are represented in governing docs or `docs/decisions.md`; retain valuable history under a clearly labeled archive section instead of silently deleting it.

- [ ] **Step 5: Execute the Cloudflare cutover**

Create or select the OpenNext Worker deployment, configure public variables and encrypted secrets, create/bind R2, deploy the Worker, verify the generated `workers.dev` URL, then attach the custom domain to the Worker. Remove the same custom domain from the old Pages project first if Cloudflare reports a conflict. After Worker health checks pass, disable Pages production builds or delete the old Pages project so it stops producing failed builds.

- [ ] **Step 6: Run production smoke checks**

Verify Practice `/`, `/overdrive`, Daily Seed reset/cache behavior, anonymous local play, authenticated attempt claim, offline Run Over, retry, provisional/verified labels, leaderboard paging, replay authorization, feature-off `404`, security headers, and no secret or storage-key exposure. Record UTC time, deployed version, ruleset version, and result for each check.

- [ ] **Step 7: Run documentation consistency checks**

```bash
rg -n "Pages|build:worker|/overdrive|OVERDRIVE_COMPETITIVE|OVERDRIVE_REPLAY|OVERDRIVE_META|SUPABASE_SERVICE_ROLE_KEY|OVERDRIVE_REPLAYS" README.md docs env.example wrangler.jsonc
rg -n "Math\.random" docs/superpowers README.md
git diff --check
```

Expected: Cloudflare Pages appears only in migration/cutover context; the Stop Slop prose audit finds no placeholder language; every flag, route, binding, and command agrees across files; whitespace check exits 0.

- [ ] **Step 8: Run the final release gate**

```bash
npm run check:overdrive-boundaries
npm run lint
npx tsc --noEmit
npm test
npm run build:worker
npm run check:client-secrets
npm run smoke:worker
npx playwright test --project=chromium
```

Expected: every command exits 0 with the intended production flags and no Practice regression.

- [ ] **Step 9: Commit**

```bash
git add README.md docs env.example wrangler.jsonc
git commit -m "docs(overdrive): reconcile architecture routes and rollout (F-3, D-1)"
```

---

## Execution handoff

Implement one task per focused branch or PR-sized commit. Before each task, re-read the cited governing sections and this plan's interface block. After each task, run its focused verification before the repository-wide gate. Tasks 28-30 require the explicit gate and GDD amendment in Task 27; a passing test suite cannot waive that approval.
