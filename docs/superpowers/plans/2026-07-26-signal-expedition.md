# Signal Expedition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Overdrive arena into a deterministic, typing-driven Signal Expedition with grounded multi-verb combat, readable enemy formations, a travelling camera, a layered living environment, and zero production-browser errors.

**Architecture:** Keep scoring, stage progression, item effects, word selection, and seeded formation schedules in the pure TypeScript engine. Let PixiJS consume immutable snapshots and presentation events through five focused systems: `EnvironmentDirector`, `CameraDirector`, `FormationDirector`, `CombatDirector`, and `CombatEffects`. The HUD and command rail remain screen-space React and Pixi layers while the camera transforms only the world container.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4, Zustand, PixiJS v8, Web Audio API, Vitest, Playwright, Python Pillow asset tooling

## Global Constraints

- `docs/game-design.md`, `docs/prd.md`, and `docs/design.md` remain authoritative and change before implementation.
- The approved product contract is `docs/superpowers/specs/2026-07-26-signal-expedition-design.md`.
- The engine, scoring, item system, and run state machine remain pure TypeScript with no React, PixiJS, DOM, or framework imports.
- All game and presentation variation derives from the run seed, persisted formation schedule, event data, or elapsed time. `Math.random()` remains banned from game logic and choreography.
- Existing scoring, quotas, beginner signals, Focus Pause, Aegis, Keycap values, Macro values, Glitches, economy, and Practice behavior remain unchanged.
- All Overdrive code remains behind the existing feature flag and `/overdrive` route.
- UI copy, item names, comments, identifiers, asset names, and commits use English. Indonesian remains limited to the Indonesian word pool.
- Design values come from the canonical design document. New spacing uses only 4, 8, 12, 16, 24, 32, and 48.
- A stage keeps one Warden atlas, one enemy-family atlas, and one environment kit resident.
- First-stage compressed art stays at or below 5 MB and estimated GPU texture memory stays at or below 64 MB.
- Live combat effects stay capped at 200 and foreground sprites are pooled.
- Full E2E, simulation, lint, production build, and production-browser verification run in Task 15. Focused regression and unit tests run earlier only where the approved red-green contract requires them.
- No stage progression requires scrolling or pointer input.
- No active-flow copy contains slash decoration, filler headings, corrupted punctuation, vague motivational prose, or explanatory paragraphs that compete with the game.

---

## File Map

### Canonical documents

- Modify `docs/game-design.md`: add the Signal Expedition stage journey, action grammar, formations, deterministic schedule, and beginner combat behavior.
- Modify `docs/prd.md`: expand R-1 and J-1 acceptance criteria without changing priority or scope of unrelated epics.
- Modify `docs/design.md`: add world-layer tokens, camera cues, formation alpha, grounded motion, item signatures, accessibility, and performance budgets.

### Regression and UI identity

- Modify `features/overdrive/components/hud.tsx`: use stable slot keys and restart proc animation inside each stable slot.
- Create `e2e/overdrive-inventory-identity.spec.ts`: reproduce duplicate Keycap and Macro identity errors and fail on console warnings.
- Modify `features/overdrive/canvas/gameplay-canvas.tsx`: expose deterministic presentation state for browser assertions.

### Headless engine and selectors

- Modify `lib/engine/overdrive/types.ts`: add formation variant IDs and the persisted formation schedule.
- Create `lib/engine/overdrive/formations.ts`: stage-family variant registry and schedule generation using an injected seeded RNG.
- Modify `lib/engine/overdrive/run.ts`: fork formation RNG, create a schedule at stage start, persist it, and bump save version.
- Modify `lib/engine/overdrive/index.ts`: export formation types and helpers.
- Create `lib/engine/overdrive/__tests__/formations.test.ts`: deterministic schedule and family validation.
- Create `features/overdrive/canvas/choreography/expedition-selectors.ts`: pure beat, verb, and variant selectors.
- Create `features/overdrive/canvas/choreography/__tests__/expedition-selectors.test.ts`: exact boundaries and action grammar.

### Rig motion and variants

- Modify `features/overdrive/canvas/rig/rig-definition.ts`: add grounded Warden clip names and variant definitions.
- Modify `features/overdrive/canvas/rig/rig-manifests.ts`: author grounded Warden tracks and three silhouettes for every enemy family.
- Modify `features/overdrive/canvas/rig/rig-instance.ts`: enable variant parts and environment-light integration sprites.
- Modify `features/overdrive/canvas/rig/animation-controller.ts`: expose active clip and deterministic recovery cancellation.
- Create `features/overdrive/canvas/rig/__tests__/grounded-motion.test.ts`: foot contact, finite transform, contact timing, and recovery contracts.
- Modify `scripts/process-rig-sheet.py`: pack family attachment parts into the existing family atlas.
- Modify `scripts/validate-rig-assets.mjs`: validate variants, grounded clips, dimensions, and art budgets.

### Environment and camera

- Create `features/overdrive/canvas/assets/environment-assets.ts`: strict layer manifest, optional-layer fallback, and cached texture loading.
- Create `features/overdrive/canvas/environment/environment-director.ts`: parallax, cables, machinery pulses, authored sparks, haze, foreground occlusion, and extraction gate.
- Create `features/overdrive/canvas/environment/__tests__/environment-contract.test.ts`: layer manifest and reduced-motion rules.
- Create `features/overdrive/canvas/camera/camera-director.ts`: journey, combat, impact, and accessibility channels.
- Create `features/overdrive/canvas/camera/__tests__/camera-director.test.ts`: exact cue timing, bounds, and reduced-motion behavior.
- Modify `features/overdrive/canvas/visual-assets.ts`: retain visual constants and command rail, remove ownership of the arena background.

### Formation, combat, and effects

- Create `features/overdrive/canvas/choreography/formation-director.ts`: Warden and enemy placement, formation promotion, family variants, alpha, shadows, and depth integration.
- Create `features/overdrive/canvas/choreography/__tests__/formation-director-contract.test.ts`: role count, alpha, promotion, and compact cropping.
- Refactor `features/overdrive/canvas/choreography/combat-director.ts`: map accepted keys to grounded verbs, publish camera cues, and stop moving the world root.
- Modify `features/overdrive/canvas/effects/combat-effects.ts`: add verb-specific paths, class defeats, combo escalation, deck impact light, and a hard live-effect cap.
- Modify `features/overdrive/canvas/effects/item-presentation.ts`: implement all 15 Keycap combat signatures and distinct Macro origins.
- Modify `features/overdrive/presentation/events.ts`: carry the deterministic verb, formation variant, beat, and item IDs required by presentation.
- Modify `features/overdrive/store.ts`: enrich presentation events from immutable run state without changing engine outcomes.
- Modify `features/overdrive/canvas/combat-scene.ts`: coordinate the five focused systems and keep the command rail in screen space.
- Modify `features/overdrive/canvas/gameplay-canvas.tsx`: load environment and family assets, expose readiness and presentation state, and preserve retry behavior.
- Modify `features/overdrive/components/gameplay-layer.tsx`: pause the run on required character asset failure and keep optional environment fallback playable.

### Art pipeline

- Create `public/overdrive/art/source/signal-trench-kit-v1-source.png`.
- Create `public/overdrive/art/source/packet-family-v2-source.png`.
- Create `public/overdrive/art/source/needle-family-v2-source.png`.
- Create `public/overdrive/art/source/null-family-v2-source.png`.
- Create runtime WebP environment layers under `public/overdrive/art/environment/`.
- Replace the three enemy-family runtime atlas files under `public/overdrive/art/rigs/` with validated variant-capable versions.
- Modify `CREDITS.md`: record prompts, generation identifiers, processing steps, and provider terms.
- Create `scripts/process-environment-kit.py`: extract, chroma-clean, trim, resize, and encode environment layers.
- Create `scripts/validate-environment-assets.mjs`: verify exact files, dimensions, alpha, and compressed byte budgets.

### Copy and final verification

- Modify active Overdrive copy under `features/overdrive/components/` and `features/overdrive/presentation/` only where the stop-slop audit finds a concrete issue.
- Modify `e2e/overdrive-juice.spec.ts`: verify attack diversity, beats, formations, variant changes, and reduced motion.
- Modify `e2e/overdrive-layout.spec.ts`: verify the five required viewports and readable silhouette counts.
- Modify `e2e/overdrive-progression.spec.ts`: verify automatic clear-to-Shop flow remains intact.
- Modify `playwright.config.ts`: allow an explicit production server command for the release gate.
- Modify `package.json`: add asset validation and production E2E scripts.

---

### Task 1: Promote the approved Signal Expedition contract

**Files:**
- Modify: `docs/game-design.md`
- Modify: `docs/prd.md`
- Modify: `docs/design.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-26-signal-expedition-design.md`
- Produces: canonical rules for Tasks 2 through 15

- [ ] **Step 1: Add the stage journey to `docs/game-design.md`**

Insert this contract under the moment-to-moment experience section:

```markdown
### Signal Expedition stage journey

Every stage is one continuous journey through Ingress, Relay breach, and Extraction.

- Ingress begins at quota ratio 0.
- Relay breach begins at quota ratio 0.4.
- Extraction begins at quota ratio 0.75.
- Score divided by quota decides the current beat. `targetOrdinal` only orders presentation work when one completed word crosses a threshold.
- Beat transitions never block typing and never use measured WPM.

The stage shows the Keystone Warden, one active target, one upcoming target, and one distant reinforcement when the viewport supports four silhouettes. Compact layouts may crop the distant reinforcement but must keep its entry telegraph.
```

- [ ] **Step 2: Add the exact typing-driven action grammar**

Add the eight Warden verbs, short-word rules, 140 ms cancel window, 400 ms planted hold, single long-word vault limit, grounding rules, Space behavior, Enter override, and typo reaction from the approved spec. Preserve the existing beginner word pools and Focus Pause rules character for character.

- [ ] **Step 3: Update PRD R-1 and J-1**

R-1 keeps the existing run flow and adds:

```markdown
Each stage advances through Ingress, Relay breach, and Extraction by quota ratio without blocking input. The protected beginner route remains playable at validated 1, 5, 10, 12, and 13 WPM profiles.
```

J-1 becomes:

```markdown
Render Signal Expedition on PixiJS with grounded articulated Warden combat, eight deterministic attack verbs, four readable desktop silhouettes, three variants per stage family, a layered travelling Signal Trench, beat-directed camera movement, class-specific defeats, combo escalation, and item-specific combat signatures. The HUD and active command rail remain screen-space. Repeated jump arcs, static wallpaper presentation, duplicate React keys, and wrong-family asset fallbacks do not pass acceptance.
```

- [ ] **Step 4: Add exact visual and motion tokens to `docs/design.md`**

Document:

- role alpha: active 1, upcoming 0.54 desktop and 0.48 compact, reinforcement 0.30 desktop and 0.26 compact
- parallax: far 0.08, machinery 0.2, midground 0.45, deck 1, foreground 1.25
- cable sway maximum 8 px
- beat track 600 ms
- Rail step camera follow maximum 40 px
- Tether pull 2 percent push-in
- Crossfire pivot 120 ms pan and 180 ms settle
- Execution 50 ms hold and 180 ms settle
- Overdrive 3 percent push-in and 3 px shake maximum
- one grounded foot within 4 px of the ground line
- first-stage art 5 MB, texture memory 64 MB, 200 live effects, median 55 fps

- [ ] **Step 5: Audit the canonical documents**

Run:

```powershell
rg -n "\x{00C2}|\x{00C3}|\x{FFFD}|[/]{2}" docs/game-design.md docs/prd.md docs/design.md
```

Expected: zero unintended matches.

- [ ] **Step 6: Commit the canonical rules**

```powershell
git add -- docs/game-design.md docs/prd.md docs/design.md
git commit -m "docs: lock Signal Expedition contract (R-1, J-1)"
```

### Task 2: Reproduce and eliminate duplicate inventory identity

**Files:**
- Create: `e2e/overdrive-inventory-identity.spec.ts`
- Modify: `features/overdrive/components/hud.tsx`

**Interfaces:**
- Consumes: `OVERDRIVE_SAVE_KEY`, persisted `RunSnapshot`, existing HUD slot arrays
- Produces: stable inventory slots for legal duplicate items

- [ ] **Step 1: Add a browser error collector**

Use one helper in the new spec:

```ts
function collectIdentityErrors(page: Page) {
	const messages: string[] = []
	page.on("console", (message) => {
		if (message.type() === "error" || message.type() === "warning") {
			messages.push(message.text())
		}
	})
	page.on("pageerror", (error) => messages.push(error.message))
	return messages
}
```

- [ ] **Step 2: Create a duplicate inventory fixture**

Start a run with:

```ts
createRun({
	seed: "duplicate-inventory",
	words: ["f", "j", "d"],
	startingKeycaps: ["sprinter", "sprinter"],
	startingMacros: ["insurance", "insurance"],
})
```

Export its state, store it under `typecade_overdrive_save`, open `/overdrive`, resume, and enter gameplay.

- [ ] **Step 3: Prove the current regression**

Run only:

```powershell
npx playwright test e2e/overdrive-inventory-identity.spec.ts --project=chromium
```

Expected before the fix: failure containing `sprinter-0`, `same key`, `Encountered two children`, or `unique key`.

- [ ] **Step 4: Stabilize slot identity**

Change HUD keys to:

```tsx
key={`keycap-slot-${index}`}
key={`macro-slot-${index}`}
```

Keep the slot mounted. Put proc replay identity on a nested visual wrapper:

```tsx
<span key={`keycap-proc-${index}-${triggerId ?? 0}`}>
	<ItemGlyph id={id} type="keycap" className="h-7 w-7 sm:h-8 sm:w-8" />
</span>
```

Use the same nested replay pattern for Macro glyphs.

- [ ] **Step 5: Verify the focused regression**

Run the same Playwright command.

Expected: the spec passes with both duplicate Keycaps and duplicate Macros visible and no warning or error.

- [ ] **Step 6: Commit the identity fix**

```powershell
git add -- e2e/overdrive-inventory-identity.spec.ts features/overdrive/components/hud.tsx
git commit -m "fix: stabilize duplicate inventory slots (I-4)"
```

### Task 3: Add pure expedition selectors

**Files:**
- Create: `features/overdrive/canvas/choreography/expedition-selectors.ts`
- Create: `features/overdrive/canvas/choreography/__tests__/expedition-selectors.test.ts`

**Interfaces:**
- Produces: `EncounterBeat`, `AttackVerb`, `selectEncounterBeat`, `selectAttackVerb`, and `selectFormationVariant`

- [ ] **Step 1: Write selector tests**

Cover these exact cases:

```ts
expect(selectEncounterBeat(0, 100, 0)).toBe("ingress")
expect(selectEncounterBeat(39, 100, 9)).toBe("ingress")
expect(selectEncounterBeat(40, 100, 10)).toBe("relay-breach")
expect(selectEncounterBeat(74, 100, 18)).toBe("relay-breach")
expect(selectEncounterBeat(75, 100, 19)).toBe("extraction")
expect(selectEncounterBeat(140, 100, 30)).toBe("extraction")
```

Also assert:

- one-character targets select `cannon-burst`
- the last accepted character selects `execution`
- two and three-character signals use only Cannon burst, Rail step, and Execution
- four to six-character words never select Recoil vault
- seven-character and longer words select at most one Recoil vault
- full Overdrive selects `overdrive-breach` only for the final accepted character
- equal inputs produce equal verbs
- identical schedules and ordinals produce identical variants

- [ ] **Step 2: Define exact types**

```ts
export type EncounterBeat = "ingress" | "relay-breach" | "extraction"

export type AttackVerb =
	| "cannon-burst"
	| "rail-step"
	| "tether-pull"
	| "breach-slide"
	| "recoil-vault"
	| "crossfire-pivot"
	| "execution"
	| "overdrive-breach"
```

- [ ] **Step 3: Implement beat selection**

Clamp score and quota defensively. A non-positive quota returns `ingress`. Use the exact 0.4 and 0.75 thresholds. `targetOrdinal` participates only in the stable transition key consumed by the camera and does not create a WPM-like alternate progression curve.

- [ ] **Step 4: Implement the attack grammar**

Use only word length, character index, lane, combo, Overdrive readiness, and triggered item IDs. Do not import PixiJS and do not use time or randomness. Derive the single long-word vault index from word length and lane so it cannot repeat.

- [ ] **Step 5: Run the selector tests**

```powershell
npx vitest run features/overdrive/canvas/choreography/__tests__/expedition-selectors.test.ts
```

Expected: all selector tests pass.

- [ ] **Step 6: Commit pure selection**

```powershell
git add -- features/overdrive/canvas/choreography/expedition-selectors.ts features/overdrive/canvas/choreography/__tests__/expedition-selectors.test.ts
git commit -m "feat: add deterministic expedition selectors (J-1)"
```

### Task 4: Persist a seeded formation schedule in the headless run

**Files:**
- Modify: `lib/engine/overdrive/types.ts`
- Create: `lib/engine/overdrive/formations.ts`
- Modify: `lib/engine/overdrive/run.ts`
- Modify: `lib/engine/overdrive/index.ts`
- Create: `lib/engine/overdrive/__tests__/formations.test.ts`

**Interfaces:**
- Consumes: the existing root seeded RNG
- Produces: `formationSchedule` in every `RunSnapshot` and persisted save

- [ ] **Step 1: Write formation tests**

Assert:

- equal seeds and stage positions create equal schedules
- different seeds produce at least one different slot across a 24-entry schedule
- Warm-up contains only `packet-stalker`, `cache-hound`, and `relay-ram`
- Rush contains only `needle-wraith`, `vector-mantis`, and `spine-courier`
- Glitch contains only `null-crown`, `crown-hand`, and `void-shard`
- Zone 1 begins with the primary family silhouette and introduces alternatives without loading another family
- exported and loaded runs preserve the schedule exactly
- restarting the same seeded run reproduces the schedule

- [ ] **Step 2: Add headless formation types**

```ts
export type FormationVariantId =
	| "packet-stalker"
	| "cache-hound"
	| "relay-ram"
	| "needle-wraith"
	| "vector-mantis"
	| "spine-courier"
	| "null-crown"
	| "crown-hand"
	| "void-shard"
```

Add `formationSchedule: FormationVariantId[]` to `RunSnapshot`.

- [ ] **Step 3: Implement injected-RNG schedule generation**

`formations.ts` receives a minimal RNG interface:

```ts
export type FormationRng = {
	next(): number
	pick<T>(values: readonly T[]): T
}

export function createFormationSchedule(
	stage: StageType,
	zone: number,
	rng: FormationRng,
	length = 24,
): FormationVariantId[]
```

The function must not construct its own RNG. Avoid adjacent duplicate variants when another valid variant is available.

- [ ] **Step 4: Wire the run RNG**

In `run.ts`:

```ts
let formationRng = rootRng.fork("formation")
```

Reset the fork in `resetRng()`. Generate `state.formationSchedule` inside `startStage()` after stage and zone are final. Clone the schedule in `snapshot()` and `loadState()`. Increment `SAVE_VERSION` from 5 to 6.

- [ ] **Step 5: Run headless formation tests**

```powershell
npx vitest run lib/engine/overdrive/__tests__/formations.test.ts lib/engine/overdrive/__tests__/run.test.ts
```

Expected: formation and run tests pass with no rendering imports in `lib/engine/overdrive`.

- [ ] **Step 6: Commit deterministic formations**

```powershell
git add -- lib/engine/overdrive
git commit -m "feat: persist seeded enemy formations (F-4, J-1)"
```

### Task 5: Author grounded Warden verbs and family variants

**Files:**
- Modify: `features/overdrive/canvas/rig/rig-definition.ts`
- Modify: `features/overdrive/canvas/rig/rig-manifests.ts`
- Modify: `features/overdrive/canvas/rig/rig-instance.ts`
- Modify: `features/overdrive/canvas/rig/animation-controller.ts`
- Create: `features/overdrive/canvas/rig/__tests__/grounded-motion.test.ts`

**Interfaces:**
- Consumes: `AttackVerb`, current rig parts, current animation interpolation
- Produces: grounded named clips and variant attachment visibility

- [ ] **Step 1: Add motion contract tests**

For Cannon burst, Rail step, Tether pull, Breach slide, Crossfire pivot, and Execution:

- sample every 16 ms
- assert every transform value is finite
- assert near or far foot remains within 4 px of the authored ground line
- assert contact occurs after 0 and before `durationMs`
- assert the final recovery sample returns to a planted pose

For Recoil vault, assert it contains one ascent, one apex, one landing, and no second airborne interval.

- [ ] **Step 2: Replace generic Warden clip names**

Extend `AnimationClipName` with:

```ts
| "cannon-burst"
| "rail-step"
| "tether-pull"
| "breach-slide"
| "recoil-vault"
| "crossfire-pivot"
| "execution"
| "overdrive-breach"
```

Keep old clip names only while current callers are migrated in Task 11. Remove them after the final caller moves.

- [ ] **Step 3: Add variant definitions**

```ts
export type RigVariantDefinition = {
	id: FormationVariantId
	enabledPartIds: readonly string[]
	transformOverrides?: Readonly<Record<string, Partial<RigTransform>>>
	baseScale: number
}
```

Every enemy family manifest defines three variants. Optional attachment parts remain hidden unless enabled by the selected variant.

- [ ] **Step 4: Author grounded Warden tracks**

Use root X for ground travel and leg, foot, pelvis, torso, shoulder, forearm, and cannon tracks for weight transfer. Do not animate root Y in grounded verbs. The shadow position follows the weighted foot and is updated by `FormationDirector`, not by a mirrored root arc.

- [ ] **Step 5: Expose deterministic cancellation state**

Add read-only `activeClipName` and `localTime` accessors to `AnimationController`. Keep priority behavior. Permit the next accepted-key verb to force-cancel recovery after the 140 ms cadence rule without clearing pending contact events.

- [ ] **Step 6: Run rig tests**

```powershell
npx vitest run features/overdrive/canvas/rig
```

Expected: interpolation, controller, and grounded motion contracts pass.

- [ ] **Step 7: Commit grounded rig behavior**

```powershell
git add -- features/overdrive/canvas/rig
git commit -m "feat: author grounded combat verbs and variants (J-1)"
```

### Task 6: Produce coherent enemy-family and environment art

**Files:**
- Modify: `scripts/process-rig-sheet.py`
- Create: `scripts/process-environment-kit.py`
- Modify: `scripts/validate-rig-assets.mjs`
- Create: `scripts/validate-environment-assets.mjs`
- Create: `public/overdrive/art/source/signal-trench-kit-v1-source.png`
- Create: `public/overdrive/art/source/packet-family-v2-source.png`
- Create: `public/overdrive/art/source/needle-family-v2-source.png`
- Create: `public/overdrive/art/source/null-family-v2-source.png`
- Create: runtime files under `public/overdrive/art/environment/`
- Modify: runtime family atlases under `public/overdrive/art/rigs/`
- Modify: `CREDITS.md`

**Interfaces:**
- Consumes: existing Warden art bible, current three-quarter perspective, current rig part IDs
- Produces: one layered environment kit and three variant-capable family atlases

- [ ] **Step 1: Generate one coherent environment source sheet**

Use the `imagegen` skill with this direction:

```text
Production game environment layer sheet for an original cyber-industrial typing arcade called Signal Expedition. Premium stylized 3D hard-surface game render converted to polished 2D, three-quarter side camera matching a grounded mechanical hero, blackened steel, worn graphite deck, cyan relay key light, restrained magenta corruption light, deep navy atmosphere. Six isolated horizontal layer panels with identical perspective and lighting: far tower silhouettes and sky, distant relay machinery, midground cables and blast doors, battle deck with perspective markings, foreground gantries and pipes, atmosphere masks with vent haze and light spill. Chroma magenta separation between panels, clean panel edges, no characters, no text, no logos, no UI, no baked particles, no full-scene wallpaper.
```

Keep the strongest coherent result. Record its generation identifier.

- [ ] **Step 2: Generate one source sheet per enemy family**

Each source sheet keeps the existing family materials and lighting while adding only variant attachment parts.

Packet sheet attachment direction:

```text
Packet Stalker family modular attachment sheet. Premium stylized 3D hard-surface render converted to polished 2D. Match the existing low corrupted relay predator, fixed three-quarter side camera, cyan top-left environment rim and restrained red corruption. Isolated non-overlapping parts for Cache Hound: narrow sensor muzzle, split back relay, hooked cable tail. Isolated parts for Relay Ram: reinforced forehead plate, broad shoulder relay, piston foreleg guard. Chroma magenta background, no full character, no text, no shadow, no floor.
```

Needle sheet attachment direction:

```text
Needle Wraith family modular attachment sheet. Match the existing narrow signal hunter, fixed three-quarter side camera and hard-surface materials. Isolated non-overlapping parts for Vector Mantis: paired scythe forearms, angular head fin, bifurcated signal tail. Isolated parts for Spine Courier: cargo spine relay, long rear stabilizer, segmented courier fins. Chroma magenta background, no full character, no text, no shadow, no floor.
```

Null sheet attachment direction:

```text
Null Crown family modular attachment sheet. Match the existing fractured void construct, fixed three-quarter side camera, black crown plates, cyan edge light, restrained violet and red corruption. Isolated non-overlapping parts for Crown Hand: enlarged articulated hand plates, orbiting wrist crown, narrow shoulder shards. Isolated parts for Void Shard: spear-like crown segments, compressed void core casing, long lower shard. Chroma magenta background, no full character, no text, no shadow, no floor.
```

- [ ] **Step 3: Process the environment kit**

`process-environment-kit.py` must:

- locate the six panels from fixed source coordinates
- remove chroma magenta with an alpha feather of at most 2 px
- trim transparent padding
- export far and atmosphere at half resolution
- export machinery, midground, deck, and foreground at full runtime resolution
- encode lossless or visually lossless WebP
- write a JSON manifest with dimensions and authored spark, cable, gate, and light points

- [ ] **Step 4: Process family attachments**

Extend `process-rig-sheet.py` so each family atlas contains base parts plus exact variant attachment frame IDs. Keep Warden art unchanged. Reject any attachment whose alpha bounds overlap another extracted frame.

- [ ] **Step 5: Validate art**

Run:

```powershell
node scripts/validate-rig-assets.mjs
node scripts/validate-environment-assets.mjs
```

Expected:

- all Warden and family parts, pivots, clips, and variants exist
- all six environment roles exist
- first-stage compressed art is at most 5 MB
- atlas dimensions are at most 2048 by 2048
- estimated resident texture memory is at most 64 MB
- no generated text or unintended opaque panel background remains

- [ ] **Step 6: Inspect runtime assets**

Render the source and runtime sheets and inspect them at original resolution. Reject:

- inconsistent camera angle
- mismatched cyan key-light direction
- attachments that look pasted on
- soft or broken alpha edges
- mascot proportions
- unreadable silhouettes at gameplay size
- environment layers that only reconstruct the previous static wallpaper

- [ ] **Step 7: Record provenance and commit**

Add generation identifiers, prompts, processing commands, and provider terms to `CREDITS.md`.

```powershell
git add -- scripts/process-rig-sheet.py scripts/process-environment-kit.py scripts/validate-rig-assets.mjs scripts/validate-environment-assets.mjs public/overdrive/art/source public/overdrive/art/environment public/overdrive/art/rigs CREDITS.md
git commit -m "feat: add Signal Trench and family variant art (J-1)"
```

### Task 7: Build the living environment system

**Files:**
- Create: `features/overdrive/canvas/assets/environment-assets.ts`
- Create: `features/overdrive/canvas/environment/environment-director.ts`
- Create: `features/overdrive/canvas/environment/__tests__/environment-contract.test.ts`
- Modify: `features/overdrive/canvas/visual-assets.ts`

**Interfaces:**
- Consumes: environment manifest, `EncounterBeat`, camera travel, stage, reduced motion
- Produces: layered world background and foreground occlusion

- [ ] **Step 1: Test the environment contract**

Assert that:

- all six roles are present
- parallax ratios are exactly 0.08, 0.2, 0.45, 1, and 1.25
- cable offset never exceeds 8 px
- reduced motion removes continuous parallax, cable sway, and loose sparks
- reduced motion retains contact shadow, light state changes, and atmosphere fades
- authored spark points remain within their owning layer bounds

- [ ] **Step 2: Implement strict asset loading**

`loadEnvironmentAssets()` validates required deck and base layers. Optional atmosphere or foreground failure falls back to an empty matching layer without failing character initialization. Return explicit fallback role IDs for browser assertions.

- [ ] **Step 3: Implement `EnvironmentDirector`**

Required public surface:

```ts
export class EnvironmentDirector {
	readonly backgroundRoot: Container
	readonly foregroundRoot: Container
	resize(width: number, height: number): void
	sync(state: EnvironmentState): void
	setCameraTravel(x: number, zoom: number): void
	handleBeat(beat: EncounterBeat): void
	handleImpact(point: Point, intensity: number): void
	update(deltaMs: number): void
	destroy(): void
}
```

Use deterministic phase offsets derived from stage and authored point index. Do not use runtime randomness.

- [ ] **Step 4: Implement physical beat changes**

- Ingress: closed relay door, low pulse frequency, sparse machinery sparks.
- Relay breach: door opens, machinery shifts, cable anchors change tension, midground light cadence increases.
- Extraction: aperture opens, foreground gantry crosses, deck guide lights lead into the Shop route.

- [ ] **Step 5: Remove old background ownership**

Delete the single-master `createBackground()` implementation from `visual-assets.ts` after all callers move. Retain shared color, scene, motion, effect, and command-rail tokens.

- [ ] **Step 6: Run environment tests**

```powershell
npx vitest run features/overdrive/canvas/environment
```

Expected: environment contract tests pass.

- [ ] **Step 7: Commit the environment system**

```powershell
git add -- features/overdrive/canvas/assets/environment-assets.ts features/overdrive/canvas/environment features/overdrive/canvas/visual-assets.ts
git commit -m "feat: animate the Signal Trench environment (J-1)"
```

### Task 8: Add a bounded camera director

**Files:**
- Create: `features/overdrive/canvas/camera/camera-director.ts`
- Create: `features/overdrive/canvas/camera/__tests__/camera-director.test.ts`

**Interfaces:**
- Consumes: beat transitions and combat camera cues
- Produces: world translation and scale only

- [ ] **Step 1: Write camera tests**

Cover:

- beat transition completes in 600 ms
- Rail step follow never exceeds 40 px
- Tether push-in never exceeds 1.02 scale
- Crossfire pivot uses 120 ms pan and 180 ms settle
- Execution holds for 50 ms and settles in 180 ms
- Overdrive never exceeds 1.03 scale or 3 px shake
- reduced motion removes shake and continuous travel but keeps immediate target framing
- repeated cues compose without producing non-finite values

- [ ] **Step 2: Define camera cues**

```ts
export type CameraCue =
	| { kind: "beat"; beat: EncounterBeat; ordinal: number }
	| { kind: "rail-step"; direction: -1 | 1 }
	| { kind: "tether-pull" }
	| { kind: "crossfire-pivot"; targetX: number }
	| { kind: "execution" }
	| { kind: "overdrive" }
	| { kind: "aegis-rescue" }
	| { kind: "stage-clear" }
```

- [ ] **Step 3: Implement four channels**

Maintain journey, combat, impact, and accessibility state separately. Combine them into one `CameraFrame`:

```ts
export type CameraFrame = {
	x: number
	y: number
	scale: number
	shakeX: number
	shakeY: number
}
```

Apply the frame to a world container supplied by `CombatScene`. Never receive or mutate the command rail or HUD.

- [ ] **Step 4: Run camera tests**

```powershell
npx vitest run features/overdrive/canvas/camera
```

Expected: all cue bounds and timings pass.

- [ ] **Step 5: Commit camera direction**

```powershell
git add -- features/overdrive/canvas/camera
git commit -m "feat: add bounded expedition camera cues (J-1)"
```

### Task 9: Split formation ownership from combat choreography

**Files:**
- Create: `features/overdrive/canvas/choreography/formation-director.ts`
- Create: `features/overdrive/canvas/choreography/__tests__/formation-director-contract.test.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`

**Interfaces:**
- Consumes: loaded Warden and family rigs, formation schedule, target ordinal, viewport
- Produces: active, upcoming, distant, retiring, and available rig handles

- [ ] **Step 1: Add formation contract tests**

Use a display-free placement helper and assert:

- desktop exposes Warden, active, upcoming, and reinforcement roles
- compact exposes Warden, active, upcoming, and a reinforcement telegraph
- active alpha is 1
- upcoming alpha is 0.54 desktop and 0.48 compact
- reinforcement alpha is 0.30 desktop and 0.26 compact
- promotion changes role and ordinal without duplicating a rig handle
- variant IDs follow the persisted schedule
- upcoming and reinforcement positions remain outside the command rail bounds

- [ ] **Step 2: Define focused handles**

```ts
export type FormationTarget = {
	ordinal: number
	variantId: FormationVariantId
	role: "active" | "upcoming" | "reinforcement" | "retiring"
	root: Container
	rig: RigInstance
}
```

`FormationDirector` owns pooling, role transitions, labels, integrity rails, contact shadows, depth desaturation, and variant attachment visibility.

- [ ] **Step 3: Integrate characters with the deck**

For every visible character:

- align the contact shadow to deck perspective
- add a cyan lower rim and low-alpha stage reflection
- let foreground haze cover the lowest leg region
- desaturate by role depth
- position impact light on the deck rather than the screen

- [ ] **Step 4: Remove formation code from `CombatDirector`**

Move enemy allocation, staged arrays, role alpha, promotion, labels, integrity rails, and target positions. `CombatDirector` receives target handles from `FormationDirector` and owns action timing only.

- [ ] **Step 5: Run formation tests**

```powershell
npx vitest run features/overdrive/canvas/choreography/__tests__/formation-director-contract.test.ts
```

Expected: formation placement and identity tests pass.

- [ ] **Step 6: Commit formation ownership**

```powershell
git add -- features/overdrive/canvas/choreography
git commit -m "refactor: separate formation staging from combat (J-1)"
```

### Task 10: Replace the repeated jump arc with typing-driven combat

**Files:**
- Modify: `features/overdrive/presentation/events.ts`
- Modify: `features/overdrive/store.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`
- Modify: `features/overdrive/canvas/choreography/formation-director.ts`

**Interfaces:**
- Consumes: accepted-character and word-completed events, pure selectors, formation handles
- Produces: one visible action per accepted key and camera cues

- [ ] **Step 1: Enrich presentation events**

Accepted-character events carry:

```ts
beat: EncounterBeat
verb: AttackVerb
variantId: FormationVariantId
triggeredItemIds: string[]
```

Word-completed events carry the same beat and variant plus the resolved finisher. Compute these fields in `store.ts` from the immutable engine snapshot and pure selectors. Do not add PixiJS types to engine events.

- [ ] **Step 2: Track input cadence**

`CombatDirector` records presentation-event timestamps from its own update clock:

- 140 ms or less force-cancels recovery into the next verb
- more than 400 ms settles to planted ready
- input never waits for animation completion

- [ ] **Step 3: Map all eight verbs**

- Cannon burst: planted recoil and segmented shot.
- Rail step: heel-to-toe root X step and deck sparks.
- Tether pull: braced rear foot, cable contact, target pull response.
- Breach slide: low root X slide and floor scrape.
- Recoil vault: one long-word authored accent and one landing.
- Crossfire pivot: feet and torso turn before promoted target contact.
- Execution: final contact, recoil, follow-through, backward settle.
- Overdrive breach: explicit full-arena traversal and snap return.

- [ ] **Step 4: Eliminate direct world movement**

Remove stage-root translation, background translation, and camera shake from `CombatDirector`. Publish `CameraCue` values to `CameraDirector`.

- [ ] **Step 5: Preserve beginner readability**

One-character targets resolve with one complete Cannon burst. Two and three-character signals never use Tether pull, Breach slide, or Recoil vault. Focus Pause cancels enemy anticipation and holds the Warden ready.

- [ ] **Step 6: Add representative action tests**

Extend selector and motion tests so a six-stage deterministic route uses Cannon burst, Rail step, Breach slide or Tether pull, and Execution before Overdrive is counted.

- [ ] **Step 7: Run focused combat tests**

```powershell
npx vitest run features/overdrive/canvas/choreography features/overdrive/canvas/rig
```

Expected: action selection, motion, formation, and existing lane tests pass.

- [ ] **Step 8: Commit action grammar**

```powershell
git add -- features/overdrive/presentation/events.ts features/overdrive/store.ts features/overdrive/canvas/choreography
git commit -m "feat: drive grounded combat from typed signals (J-1)"
```

### Task 11: Expand effects, class defeats, and item signatures

**Files:**
- Modify: `features/overdrive/canvas/effects/combat-effects.ts`
- Modify: `features/overdrive/canvas/effects/item-presentation.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`
- Modify: `features/overdrive/canvas/choreography/formation-director.ts`

**Interfaces:**
- Consumes: attack verb, combo, stage family, item-triggered and macro-used events
- Produces: attributable effects without obscuring the active word

- [ ] **Step 1: Add verb-specific effect methods**

Expose:

```ts
emitCannonBurst(from: Point, to: Point, combo: number): void
emitRailStep(origin: Point, direction: -1 | 1, combo: number): void
emitTether(from: Point, to: Point, combo: number): void
emitBreachSlide(origin: Point, direction: -1 | 1, combo: number): void
emitRecoilVault(origin: Point, landing: Point, combo: number): void
emitCrossfirePivot(origin: Point, target: Point, combo: number): void
emitExecution(target: Point, family: StageType, clean: boolean, combo: number): void
```

- [ ] **Step 2: Add class-specific defeat grammar**

- Packet family: relay plates and data sparks.
- Needle family: spine split and thin vector trail.
- Null family: inward collapse followed by crown plate release.
- Dirty word: red corruption phase with no victory burst.

- [ ] **Step 3: Implement combo escalation**

Use the exact four tiers from the canonical design. Keep the active command rail above world effects and ensure no effect covers it for more than one rendered frame.

- [ ] **Step 4: Complete all 15 item combat signatures**

Map every canonical Keycap ID to the exact approved signature. Keep the existing 48 px HUD acknowledgement. Macro effects begin near the Macro rail and then enter world space.

- [ ] **Step 5: Enforce the effect cap**

When 200 live effects are reached, recycle the oldest low-priority ambient effect before contact, protection, defeat, or Overdrive effects.

- [ ] **Step 6: Add pure preset coverage**

Add a test that compares `Object.keys(ITEM_PRESENTATION)` with the exact 15 MVP Keycap IDs and exact 4 Macro IDs. Fail on missing or unknown IDs.

- [ ] **Step 7: Run focused effect tests**

```powershell
npx vitest run features/overdrive/canvas/effects features/overdrive/canvas/choreography
```

Expected: item coverage and choreography tests pass.

- [ ] **Step 8: Commit effects**

```powershell
git add -- features/overdrive/canvas/effects features/overdrive/canvas/choreography
git commit -m "feat: add combat and build effect vocabulary (I-4, J-1)"
```

### Task 12: Coordinate the world, camera, combat, and screen-space rail

**Files:**
- Modify: `features/overdrive/canvas/combat-scene.ts`
- Modify: `features/overdrive/canvas/gameplay-canvas.tsx`
- Modify: `features/overdrive/components/gameplay-layer.tsx`
- Modify: `features/overdrive/canvas/assets/combat-assets.ts`

**Interfaces:**
- Consumes: all directors, environment assets, Warden atlas, one family atlas, scene state
- Produces: one mounted, retryable Signal Expedition scene

- [ ] **Step 1: Build the final display hierarchy**

Use this order:

```text
worldRoot
  environment.backgroundRoot
  formation.worldRoot
  combat.effectRoot
  environment.foregroundRoot
screenRoot
  commandRail
  screenFeedback
```

Only `worldRoot` receives camera transforms.

- [ ] **Step 2: Reduce `CombatScene` to coordination**

`CombatScene`:

- loads no art itself
- creates all directors from validated assets
- forwards `resize`, `sync`, `handle`, `update`, and `destroy`
- selects encounter beat from state
- routes camera travel to environment parallax
- forwards stage clear to the extraction gate
- keeps existing audio calls

- [ ] **Step 3: Load exact assets**

`GameplayCanvas` loads:

- Warden atlas
- the one family atlas matching current stage
- the Signal Trench environment kit

Character atlas failure calls `onInitializationError`. Optional environment fallback sets `data-environment-fallback` and continues.

- [ ] **Step 4: Expose browser state**

Add:

```text
data-encounter-beat
data-attack-verb
data-active-variant
data-visible-silhouettes
data-environment-fallback
data-live-effects
```

Keep existing score, quota, word, caret, zone, stage, rig, and fallback attributes.

- [ ] **Step 5: Preserve retry and pause**

On required character failure:

- pause the run
- retain the existing retry and Main Menu panel
- clear the error only on explicit retry
- never silently substitute another family

- [ ] **Step 6: Run focused scene tests**

```powershell
npx vitest run features/overdrive/canvas
```

Expected: all canvas unit and contract tests pass.

- [ ] **Step 7: Commit scene integration**

```powershell
git add -- features/overdrive/canvas features/overdrive/components/gameplay-layer.tsx
git commit -m "feat: integrate the Signal Expedition scene (J-1)"
```

### Task 13: Remove slop and repair active-flow copy

**Files:**
- Modify only concrete findings under `features/overdrive/components/`
- Modify only concrete findings under `features/overdrive/presentation/`
- Modify only concrete findings under `lib/engine/overdrive/items/`

**Interfaces:**
- Consumes: stop-slop phrase and structure rules
- Produces: concise arcade copy with correct encoding

- [ ] **Step 1: Run the active-flow text audit**

```powershell
rg -n "\x{00C2}|\x{00C3}|\x{FFFD}|[/]{2}|REWIRE YOUR BUILD|NEXT READ|Convert the lead|SYNCING COMBAT LINK|Your typing carried|raw-speed only|stronger build|seamless|unlock|elevate|journey" features/overdrive lib/engine/overdrive/items app/globals.css
```

- [ ] **Step 2: Fix encoding corruption**

Replace mojibake such as `Â·` and `Ã—` with correct characters or plain English punctuation. Do not alter item names, effects, or values.

- [ ] **Step 3: Tighten active instructions**

Keep gameplay instruction to one action line:

- Zone 1: `TYPE THE SIGNAL`
- Zone 2 and later: `TYPE, THEN SPACE`
- full charge in Zone 3 and later: `ENTER: OVERDRIVE`
- Focus Pause: `FOCUS PAUSED · TYPE WHEN READY`

Do not add explanatory paragraphs over gameplay.

- [ ] **Step 4: Check comments and labels**

Remove redundant implementation narration and generated-sounding filler. Preserve comments that explain deterministic state, browser quirks, safety, or non-obvious math.

- [ ] **Step 5: Run the text audit again**

Expected: zero corrupted encoding, slash decoration, or banned filler matches.

- [ ] **Step 6: Commit copy cleanup**

```powershell
git add -- features/overdrive lib/engine/overdrive/items app/globals.css
git commit -m "refactor: tighten Overdrive presentation copy (J-1)"
```

### Task 14: Add production-grade browser coverage

**Files:**
- Modify: `e2e/overdrive-juice.spec.ts`
- Modify: `e2e/overdrive-layout.spec.ts`
- Modify: `e2e/overdrive-progression.spec.ts`
- Modify: `e2e/overdrive.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: browser data attributes and production server
- Produces: release-gate coverage for gameplay, visuals, assets, and console health

- [ ] **Step 1: Centralize browser failure capture**

Fail on:

- `pageerror`
- console warning or error
- failed local asset response
- unhandled rejection
- WebGL context failure
- React duplicate-key warning
- Next.js error overlay

- [ ] **Step 2: Cover the protected beginner route**

Verify:

- one-character Cannon burst auto-resolution
- Focus Pause freezes the clock
- two and three-character grounded chains
- Zone 2 Space submission
- no attack verb reports Recoil vault in short signals

- [ ] **Step 3: Cover expedition variety**

Use deterministic saves to assert:

- Ingress, Relay breach, and Extraction all appear
- four desktop silhouettes and three compact silhouettes remain readable
- one family exposes three variants across target promotion
- a long word uses a permitted vault at most once
- a representative route exposes at least four ordinary verbs
- reduced motion removes travel and loose effects while keeping state changes

- [ ] **Step 4: Cover layouts**

Run at:

- 390 by 844
- 820 by 1180
- 1366 by 768
- 1440 by 900
- 1920 by 1080

Assert no page scroll, no HUD overlap with the command rail, and no active target outside its readable bounds.

- [ ] **Step 5: Cover full flow**

Verify menu, stage, clear ribbon, automatic Shop entry, Shop shortcuts, resume, Run Over, `/overdrive` route availability, and unchanged Practice route.

- [ ] **Step 6: Add release scripts**

Add:

```json
"validate:overdrive-art": "node scripts/validate-rig-assets.mjs && node scripts/validate-environment-assets.mjs",
"test:e2e:production": "playwright test"
```

Allow `PLAYWRIGHT_SERVER_COMMAND` to select `npm run start` while keeping the current development default.

- [ ] **Step 7: Commit browser coverage**

```powershell
git add -- e2e playwright.config.ts package.json
git commit -m "test: cover Signal Expedition release gates (R-1, J-1)"
```

### Task 15: Critique, tune, and run the final release gate

**Files:**
- Modify: only files implicated by failed checks or visual critique

**Interfaces:**
- Consumes: the complete Signal Expedition implementation
- Produces: a clean production build and verified production-browser game

- [ ] **Step 1: Inspect the complete diff**

Run:

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: no accidental edits, whitespace errors, generated cache, or staged `.agents/skills/stop-slop/` directory.

- [ ] **Step 2: Run art validators**

```powershell
npm run validate:overdrive-art
```

Expected: all rigs, variants, environment layers, pivots, dimensions, and byte budgets pass.

- [ ] **Step 3: Run the complete unit suite**

```powershell
npm test
```

Expected: all existing and new Vitest tests pass.

- [ ] **Step 4: Run static checks**

```powershell
npm run lint
npx tsc --noEmit
```

Expected: zero ESLint and TypeScript errors.

- [ ] **Step 5: Run deterministic beginner simulation**

```powershell
node scripts/simulate-overdrive.mjs
```

Expected: validated 1, 5, 10, 12, and 13 WPM profiles retain their protected completion behavior.

- [ ] **Step 6: Create a clean production build**

On Windows, remove only the resolved workspace `.next` directory after confirming it equals `D:\Work\00\typecade\.next`, then run:

```powershell
npm run build
```

Expected: Next.js 16.2.11 production build succeeds with `/overdrive` present and no build error.

- [ ] **Step 7: Run Playwright against production**

Start the built app with `NEXT_PUBLIC_OVERDRIVE=true`, set `PLAYWRIGHT_BASE_URL` to the production server, and run:

```powershell
npm run test:e2e:production
```

Expected: the full Playwright suite passes with zero console warnings, errors, failed local assets, 404s, WebGL failures, or Next.js overlays.

- [ ] **Step 8: Perform a live visual critique**

Inspect Ingress, Relay breach, Extraction, Shop, reduced motion, and compact layout in the browser. Reject the build if any of these remain true:

- Warden locomotion reads as hopping, limping, or mirrored sliding.
- Attacks repeat one visible arc.
- fewer than four desktop combat silhouettes read at a glance.
- variant attachments read as pasted-on pieces.
- characters do not share the environment light or deck plane.
- background motion reads as a drifting poster.
- foreground occlusion hides the active word or target.
- item proc feedback cannot be attributed to its slot.
- stage progress becomes confusing or requires a click below the fold.

- [ ] **Step 9: Tune only evidenced failures**

For every rejected observation, identify the owning director, manifest, effect preset, or token. Add or tighten a regression assertion where the failure is machine-testable. Repeat Steps 2 through 8 after the last change.

- [ ] **Step 10: Run final slop and error scans**

```powershell
rg -n "\x{00C2}|\x{00C3}|\x{FFFD}|[/]{2}|REWIRE YOUR BUILD|NEXT READ|Convert the lead|SYNCING COMBAT LINK" features/overdrive lib/engine/overdrive docs/game-design.md docs/prd.md docs/design.md
rg -n "Math\\.random\\(" lib/engine/overdrive features/overdrive/canvas
```

Expected: zero unintended matches.

- [ ] **Step 11: Commit verified tuning**

```powershell
git add -- docs features/overdrive lib/engine/overdrive e2e scripts public/overdrive package.json playwright.config.ts CREDITS.md
git commit -m "feat: complete Signal Expedition presentation (R-1, I-4, J-1)"
```

- [ ] **Step 12: Record final evidence**

Report:

- asset validation result and first-stage bytes
- Vitest count
- ESLint and TypeScript result
- beginner simulation result
- production build result
- Playwright count and target URL
- browser console result
- inspected viewports and encounter beats
- remaining untracked user-owned files
