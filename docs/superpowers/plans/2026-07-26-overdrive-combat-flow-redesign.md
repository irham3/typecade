# Overdrive Combat and Run Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Overdrive into a continuous keyboard-driven arcade run with articulated character combat, meaningful item feedback, and a protected beginner route.

**Architecture:** Keep the deterministic TypeScript engine authoritative for scoring, progression, shop state, and Overdrive release. Add a PixiJS rig and animation layer that consumes engine events without blocking input. Keep the gameplay canvas mounted through stage clear, replace the full result page with a short ribbon, and rebuild the shop as a one-viewport keyboard-first screen.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind v4, Zustand, PixiJS v8, Web Audio API, Vitest, Playwright

## Global Constraints

- `docs/game-design.md`, `docs/prd.md`, and `docs/design.md` remain the source of truth and must change before code when a rule changes.
- The engine, item system, and run state machine remain pure TypeScript with no React, PixiJS, DOM, or framework imports.
- All variation follows persisted deterministic state. `Math.random()` remains banned from game logic and presentation choreography.
- Overdrive code remains behind the existing feature flag and `/overdrive` route.
- UI copy, item names, comments, identifiers, and commits use English.
- Indonesian remains limited to word-pool data.
- The MVP item and Glitch manifests remain unchanged.
- Design values use the canonical tokens and the 4, 8, 12, 16, 24, 32, 48 spacing scale.
- The first playable stage loads no more than 5 MB of compressed combat art.
- The renderer keeps at most 200 live particles and two full character atlases during a stage.
- Full test execution, E2E, simulation, lint, typecheck, and build run only in the final task, per user instruction.
- Logic tests are written before their implementation even though execution waits for the final task.
- Normal stage progression requires no scroll and no pointer input.
- Active-flow copy uses no repeated slash decoration, filler headings, corrupted punctuation, or paragraph-length instruction.

---

## File map

### Canonical documents

- Modify `docs/game-design.md`: manual Overdrive release, continuous result ribbon, keyboard shop, rig animation contract
- Modify `docs/prd.md`: update R-1, R-2, I-4, and J-1 acceptance language
- Modify `docs/design.md`: new motion timing, rig delivery, result ribbon, shop layout, shortcut labels

### Engine and state

- Modify `lib/engine/overdrive/types.ts`: target ordinal and new engine API event fields
- Modify `lib/engine/overdrive/run.ts`: manual Overdrive release, target ordinal persistence, trigger preview API
- Modify `lib/engine/overdrive/items/registry.ts`: pure preview context and hook
- Modify `lib/engine/overdrive/items/keycaps.ts`: preview predicates for the 15 MVP Keycaps
- Modify `lib/engine/overdrive/__tests__/run.test.ts`: Zone 2 automatic and Zone 3 manual Overdrive behavior
- Modify `lib/engine/overdrive/__tests__/items.test.ts`: trigger preview parity

### Flow and UI

- Modify `features/overdrive/store.ts`: expose preview state and preserve stage-clear presentation
- Modify `features/overdrive/use-game-input.ts`: Enter Overdrive input and removal of redundant comments
- Modify `features/overdrive/components/overdrive-app.tsx`: keep Gameplay mounted through `stageResult`
- Modify `features/overdrive/components/gameplay.tsx`: mount result ribbon
- Create `features/overdrive/components/stage-clear-ribbon.tsx`: compact timed stage result
- Replace `features/overdrive/components/stage-result.tsx`: remove it from the normal flow and retain a compact detail export only if still referenced
- Modify `features/overdrive/components/shop.tsx`: one-viewport offer and build layout
- Create `features/overdrive/components/use-shop-shortcuts.ts`: scoped shop shortcuts
- Modify `features/overdrive/components/hud.tsx`: manual Overdrive prompt and armed item markers
- Modify `features/overdrive/components/gameplay-layer.tsx`: item feedback overlay routing
- Modify `app/globals.css`: tokenized rig, ribbon, shop, and proc motion

### Rig and combat presentation

- Create `features/overdrive/canvas/rig/rig-definition.ts`: rig, part, pivot, and clip types
- Create `features/overdrive/canvas/rig/interpolate.ts`: keyframe sampling
- Create `features/overdrive/canvas/rig/animation-controller.ts`: clip priority and cancellation
- Create `features/overdrive/canvas/rig/rig-instance.ts`: PixiJS display hierarchy
- Create `features/overdrive/canvas/rig/rig-manifests.ts`: Warden and enemy manifests
- Create `features/overdrive/canvas/rig/__tests__/interpolate.test.ts`: interpolation behavior
- Create `features/overdrive/canvas/rig/__tests__/animation-controller.test.ts`: priority and backlog behavior
- Create `features/overdrive/canvas/choreography/target-lanes.ts`: deterministic lane schedules
- Create `features/overdrive/canvas/choreography/combat-director.ts`: presentation event to clip mapping
- Create `features/overdrive/canvas/effects/combat-effects.ts`: shared contact, smear, shield, and defeat layers
- Create `features/overdrive/canvas/effects/item-presentation.ts`: exact item and Macro proc grammar
- Create `features/overdrive/canvas/assets/combat-assets.ts`: runtime atlas loading and fallback
- Modify `features/overdrive/canvas/combat-scene.ts`: reduce to scene coordination
- Modify `features/overdrive/canvas/visual-assets.ts`: retain tokens and command rail drawing, remove full-body pose loading
- Modify `features/overdrive/canvas/gameplay-canvas.tsx`: asset readiness and target ordinal state
- Modify `features/overdrive/fx/sfx.ts`: deterministic item audio layers

### Art pipeline

- Create `scripts/process-rig-sheet.py`: crop, clean, pack, and write pivot metadata
- Create `scripts/validate-rig-assets.mjs`: validate files, frames, pivots, dimensions, and byte budgets
- Create `public/overdrive/art/source/warden-rig-v1-source.png`
- Create `public/overdrive/art/source/packet-rig-v1-source.png`
- Create `public/overdrive/art/source/needle-rig-v1-source.png`
- Create `public/overdrive/art/source/null-rig-v1-source.png`
- Create `public/overdrive/art/rigs/warden-v1.webp`
- Create `public/overdrive/art/rigs/packet-v1.webp`
- Create `public/overdrive/art/rigs/needle-v1.webp`
- Create `public/overdrive/art/rigs/null-v1.webp`
- Create matching JSON atlases under `public/overdrive/art/rigs/`
- Modify `CREDITS.md`: source prompts, generation identifiers, processing, and provider terms

### Final verification

- Modify `e2e/overdrive-juice.spec.ts`: continuous result ribbon, automatic shop, shortcuts, and Zone 3 manual Overdrive
- Create `e2e/overdrive-layout.spec.ts`: required viewport and no-scroll checks
- Modify `scripts/simulate-overdrive.mjs`: model Zone 3 manual release decisions

---

### Task 1: Revise the source-of-truth documents

**Files:**
- Modify: `docs/game-design.md`
- Modify: `docs/prd.md`
- Modify: `docs/design.md`

**Interfaces:**
- Consumes: approved design in `docs/superpowers/specs/2026-07-26-overdrive-combat-flow-redesign-design.md`
- Produces: canonical values and acceptance language used by every later task

- [ ] **Step 1: Update the gameplay lifecycle**

Change the Overdrive lifecycle in `docs/game-design.md` to this exact rule:

```markdown
- Zones 1-2 automatically release full Overdrive on the next clean submission.
- Zone 3 and later hold charge at 100. Space submits without consuming charge. Enter submits a completed clean word as an Overdrive Strike, applies the canonical x2 final multiplier, then resets charge.
- Enter does nothing before the word is complete. Dirty submissions never consume charge.
```

- [ ] **Step 2: Replace the full-page result requirement**

Add this exact flow to `docs/game-design.md`:

```markdown
Stage clear keeps the arena mounted. A compact result ribbon shows score, Token payout, accuracy, and the strongest item contribution for 900ms. Enter skips the remaining ribbon time. The shop then opens without a required click or scroll.
```

- [ ] **Step 3: Update PRD acceptance language**

Update R-1, R-2, I-4, and J-1 so they require:

```markdown
R-1: Continuous stage-clear ribbon and automatic shop entry.
R-2: Automatic full-charge release in Zones 1-2 and manual Enter release from Zone 3.
I-4: One-viewport shop with 1, 2, 3, R, Tab, and Enter controls.
J-1: Articulated 2D rigs with named clips, contact continuity, target queue staging, and item-specific proc acknowledgement.
```

- [ ] **Step 4: Replace pose-sheet delivery with rig delivery**

Update `docs/design.md` with these exact requirements:

```markdown
Warden clips: idle, ready, chain-1, chain-2, chain-3, dash, execute, block, hurt, recover, overdrive.
Enemy clips: locomotion, idle, anticipation, attack, hit, defeat, special.
Input response: command rail update within the same frame, visible motion within 50ms, contact within 90ms.
Stage result ribbon: 900ms, Enter skips.
Shop shortcuts: 1, 2, 3 buy; R rerolls; Tab navigates; Enter deploys.
```

- [ ] **Step 5: Run a source text audit without running the application**

Run:

```powershell
rg -n "\x{00C2}|\x{00C3}|\x{FFFD}|REWIRE YOUR BUILD|NEXT READ|Convert the lead" docs features/overdrive lib/engine/overdrive
```

Expected: findings are recorded for Task 10. Do not run tests.

- [ ] **Step 6: Commit the canonical rule update**

```powershell
git add -- docs/game-design.md docs/prd.md docs/design.md
git commit -m "docs: lock continuous Overdrive combat flow (R-1, R-2, J-1)"
```

### Task 2: Add manual Overdrive release and deterministic target state

**Files:**
- Modify: `lib/engine/overdrive/types.ts`
- Modify: `lib/engine/overdrive/run.ts`
- Modify: `lib/engine/overdrive/items/registry.ts`
- Modify: `lib/engine/overdrive/items/keycaps.ts`
- Modify: `lib/engine/overdrive/__tests__/run.test.ts`
- Modify: `lib/engine/overdrive/__tests__/items.test.ts`

**Interfaces:**
- Consumes: existing `RunSnapshot`, `createRun`, `KeycapDef`, and seeded run state
- Produces: `targetOrdinal`, `releaseOverdrive()`, `previewItemTriggers()`, and `WordPreviewContext`

- [ ] **Step 1: Write engine tests before changing implementation**

Add tests with these assertions:

```ts
function typeLetters(api: ReturnType<typeof createRun>) {
	for (const character of api.snapshot().currentWord) api.feedChar(character)
}

function patchRunState(
	api: ReturnType<typeof createRun>,
	patch: Partial<RunSnapshot>,
) {
	const saved = JSON.parse(api.exportState()) as {
		state: RunSnapshot
	}
	Object.assign(saved.state, patch)
	expect(api.loadState(JSON.stringify(saved))).toBe(true)
}

it("releases full Overdrive automatically in Zone 2", () => {
	const api = createRun({
		seed: "protected-overdrive",
		words: ["ace"],
		startingZone: 2,
	})
	api.start()
	patchRunState(api, { overdriveCharge: 100 })
	typeCurrentWord(api)
	expect(api.snapshot().overdriveCharge).toBe(0)
})

it("holds full Overdrive on Space from Zone 3", () => {
	const api = createRun({
		seed: "manual-overdrive",
		words: ["signal"],
		startingZone: 3,
	})
	api.start()
	patchRunState(api, { overdriveCharge: 100 })
	typeLetters(api)
	api.feedChar(" ")
	expect(api.snapshot().overdriveCharge).toBe(100)
})

it("releases full Overdrive on Enter from Zone 3", () => {
	const api = createRun({
		seed: "manual-release",
		words: ["signal"],
		startingZone: 3,
	})
	api.start()
	patchRunState(api, { overdriveCharge: 100 })
	typeLetters(api)
	api.releaseOverdrive()
	expect(api.snapshot().overdriveCharge).toBe(0)
})

it("persists the target ordinal", () => {
	const api = createRun({ seed: "target-order", words: ["a", "s"] })
	api.start()
	api.feedChar("a")
	expect(api.snapshot().targetOrdinal).toBe(1)
	const restored = createRun({ seed: "target-order", words: ["a", "s"] })
	expect(restored.loadState(api.exportState())).toBe(true)
	expect(restored.snapshot().targetOrdinal).toBe(1)
})
```

Import `RunSnapshot` from `../types` for `patchRunState`.

- [ ] **Step 2: Define the preview interface**

Add this interface to `items/registry.ts`:

```ts
export type WordPreviewContext = {
	word: string
	elapsedMs: number
	combo: number
	stageData: Readonly<Record<string, unknown>>
	runData: Readonly<Record<string, unknown>>
}

export type KeycapDef = ItemDef & {
	previewWord?: (ctx: WordPreviewContext) => boolean
	onStageStart?: (ctx: StageStartContext) => void
	onTypo?: (ctx: TypoContext) => void
	beforeWordScore?: (ctx: WordScoreContext) => void
	afterWordScore?: (ctx: WordResolvedContext) => void
	onStageEnd?: (ctx: StageEndContext) => void
}
```

Keep the existing context members that are not shown in the snippet.

- [ ] **Step 3: Add preview predicates**

Add pure `previewWord` functions:

```ts
wasd: ({ word }) => /^[wasd]/i.test(word),
vowel_magnet: ({ word }) => /[aeiou]/i.test(word),
longshot: ({ word }) => word.replace(/[^\p{L}]/gu, "").length >= 8,
sprinter: ({ elapsedMs }) => elapsedMs <= 10_000,
second_wind: ({ stageData }) => stageData.armed === true,
copper_key: ({ runData }) => (Number(runData.correctWords ?? 0) + 1) % 25 === 0,
home_row: ({ word }) => /^[asdfghjkl]+$/i.test(word.replace(/[^\p{L}]/gu, "")),
punctuator: ({ word }) => /[.,!?;:]/.test(word),
overclock: ({ combo }) => combo > 0 && combo % 15 === 0,
double_tap: ({ word }) => /(.)\1/i.test(word),
glass_keycap: () => true,
```

Combo Battery, Snowball, Interest Bank, and Vampire do not preview on a clean current word.

- [ ] **Step 4: Add public state and API**

Add to `RunSnapshot`:

```ts
targetOrdinal: number
```

Add to the returned run API:

```ts
releaseOverdrive(): void
previewItemTriggers(): string[]
```

Initialize `targetOrdinal` to zero, increment it once after each resolved word, serialize it, and restore it with a zero fallback for older saves.

- [ ] **Step 5: Split submission intent**

Use this internal signature:

```ts
type SubmissionMode = "standard" | "overdrive"

function submitWord(mode: SubmissionMode = "standard") {
	const result = scorer.completeWord(state.wordDirty, preserveMultForWord)
	const wantsAutomaticRelease = state.zone <= 2
	const releasesOverdrive = result.clean
		&& state.overdriveCharge >= OVERDRIVE_CHARGE_MAX
		&& (wantsAutomaticRelease || mode === "overdrive")
}
```

`feedChar(" ")` calls `submitWord("standard")`. `releaseOverdrive()` calls `submitWord("overdrive")` only when `screen === "stage"` and the caret equals the word length.

- [ ] **Step 6: Implement preview evaluation**

`previewItemTriggers()` iterates owned Keycaps, passes read-only slot data to `previewWord`, and returns exact item IDs without calling `proc` or changing state.

- [ ] **Step 7: Commit the engine rule**

```powershell
git add -- lib/engine/overdrive
git commit -m "feat: add deliberate Overdrive release (R-2)"
```

Do not run tests yet.

### Task 3: Wire Enter input and presentation state

**Files:**
- Modify: `features/overdrive/store.ts`
- Modify: `features/overdrive/use-game-input.ts`
- Modify: `features/overdrive/presentation/events.ts`
- Modify: `features/overdrive/components/hud.tsx`

**Interfaces:**
- Consumes: `releaseOverdrive()`, `previewItemTriggers()`, `targetOrdinal`
- Produces: `armedItemIds` in the store-facing state and `overdrive-intent` presentation events

- [ ] **Step 1: Expose preview values through the store**

Extend `GameStore`:

```ts
armedItemIds: string[]
```

Update `sync`:

```ts
const sync = () => set({
	...api.snapshot(),
	api,
	armedItemIds: api.previewItemTriggers(),
})
```

Initialize `armedItemIds` to an empty array on the menu snapshot.

- [ ] **Step 2: Add the presentation event**

Add:

```ts
| { id: number; type: "overdrive-intent" }
```

The input handler emits this event immediately before calling `releaseOverdrive()`.

- [ ] **Step 3: Handle Enter before printable input**

Add this branch above the single-character path:

```ts
if (e.key === "Enter") {
	e.preventDefault()
	const state = useGame.getState()
	if (
		state.screen === "stage"
		&& state.zone >= 3
		&& state.caretIndex === state.currentWord.length
		&& state.overdriveCharge >= 100
	) {
		emitPresentationEvent({ type: "overdrive-intent" })
		state.api?.releaseOverdrive()
	}
	return
}
```

Keep Zone 1 auto-execution and Zone 2 Space behavior unchanged.

- [ ] **Step 4: Update the Overdrive footer**

Render:

```tsx
<span className={state.overdriveCharge >= 100 ? "text-acc-yellow" : "text-acc-cyan"}>
	{state.overdriveCharge >= 100 && state.zone >= 3
		? "ENTER: OVERDRIVE"
		: `OVERDRIVE ${state.overdriveCharge}%`}
</span>
```

Mark armed Keycap slots with `data-armed="true"` and a tokenized border change. Do not add a second glow.

- [ ] **Step 5: Remove redundant input comments**

Delete comments that restate the code in `use-game-input.ts`. Preserve comments only when they explain a browser behavior or engine invariant.

- [ ] **Step 6: Commit input wiring**

```powershell
git add -- features/overdrive/store.ts features/overdrive/use-game-input.ts features/overdrive/presentation/events.ts features/overdrive/components/hud.tsx
git commit -m "feat: wire manual Overdrive controls (R-2)"
```

### Task 4: Replace the stage result page with a continuous ribbon

**Files:**
- Create: `features/overdrive/components/stage-clear-ribbon.tsx`
- Modify: `features/overdrive/components/overdrive-app.tsx`
- Modify: `features/overdrive/components/gameplay.tsx`
- Modify: `features/overdrive/components/stage-result.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `screen`, `tokenBreakdown`, `stageItemImpact`, `continueToNextStage()`
- Produces: `StageClearRibbon` with a 900 ms automatic transition and Enter skip

- [ ] **Step 1: Create a compact impact selector**

Export:

```ts
export function strongestImpact(
	impacts: Record<string, ItemImpact>,
): { id: string; impact: ItemImpact } | null
```

Use the existing score, Token, time, protection, and trigger weighting from `stage-result.tsx`.

- [ ] **Step 2: Create the ribbon**

Use this component contract:

```tsx
export function StageClearRibbon() {
	const state = useGame(useShallow((snapshot) => ({
		screen: snapshot.screen,
		score: snapshot.score,
		accuracy: snapshot.accuracy,
		tokenBreakdown: snapshot.tokenBreakdown,
		stageItemImpact: snapshot.stageItemImpact,
		continueToNextStage: snapshot.api?.continueToNextStage,
	})))

	useEffect(() => {
		if (state.screen !== "stageResult") return
		const timer = window.setTimeout(() => state.continueToNextStage?.(), 900)
		const skip = (event: KeyboardEvent) => {
			if (event.key !== "Enter") return
			event.preventDefault()
			window.clearTimeout(timer)
			state.continueToNextStage?.()
		}
		window.addEventListener("keydown", skip)
		return () => {
			window.clearTimeout(timer)
			window.removeEventListener("keydown", skip)
		}
	}, [state.screen, state.continueToNextStage])
}
```

The visible ribbon shows stage score, total Tokens earned, accuracy, and one item contribution. Use `role="status"` and `aria-live="polite"`.

- [ ] **Step 3: Keep gameplay mounted**

Change the app screen branch:

```tsx
{(screen === "stage" || screen === "stageResult") && <Gameplay key="gameplay" />}
```

Remove the normal `StageResult` branch. Keep `useGameInput` enabled only for `screen === "stage"`.

- [ ] **Step 4: Mount the ribbon over the canvas**

Add `<StageClearRibbon />` after `<ReadyGate />` in `gameplay.tsx`.

- [ ] **Step 5: Reduce the old component**

Remove the long recommendation and scroll layout from `stage-result.tsx`. If no import remains, delete the component. Move reusable `strongestImpact` logic to the ribbon file.

- [ ] **Step 6: Add tokenized ribbon motion**

Use existing 150 ms and 250 ms motion tokens. Do not animate layout properties. The ribbon enters with transform and opacity, then leaves when the screen becomes `shop`.

- [ ] **Step 7: Commit continuous stage flow**

```powershell
git add -- features/overdrive/components app/globals.css
git commit -m "feat: keep stage clears in the arena (R-1)"
```

### Task 5: Rebuild the shop as a one-viewport keyboard screen

**Files:**
- Create: `features/overdrive/components/use-shop-shortcuts.ts`
- Modify: `features/overdrive/components/shop.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing shop API methods and `Screen === "shop"`
- Produces: `useShopShortcuts()` and a no-scroll offer/build layout

- [ ] **Step 1: Add scoped shortcut handling**

Create:

```ts
type ShopShortcutActions = {
	buyKeycap: (index: 0 | 1) => void
	buyMacro: () => void
	reroll: () => void
	deploy: () => void
}

export function useShopShortcuts(enabled: boolean, actions: ShopShortcutActions) {
	useEffect(() => {
		if (!enabled) return
		const handler = (event: KeyboardEvent) => {
			if (event.ctrlKey || event.metaKey || event.altKey) return
			if (event.key === "1") actions.buyKeycap(0)
			else if (event.key === "2") actions.buyKeycap(1)
			else if (event.key === "3") actions.buyMacro()
			else if (event.key.toLowerCase() === "r") actions.reroll()
			else if (
				event.key === "Enter"
				&& !(event.target instanceof HTMLButtonElement)
			) actions.deploy()
			else return
			event.preventDefault()
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [actions, enabled])
}
```

Memoize the `actions` object in `Shop` so the effect does not rebind on each render.

- [ ] **Step 2: Replace the scroll container**

Use a grid with these regions:

```tsx
<main className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-bg-0 p-4 sm:p-6">
	<ShopHeader />
	<div className="grid min-h-0 gap-4 py-4 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]">
		<OfferGrid />
		<BuildRail />
	</div>
	<ShopFooter />
</main>
```

At compact widths, offers stay three compact rows and the build becomes a horizontal rail. Do not add an internal required scroll path.

- [ ] **Step 3: Remove promotional copy**

Use these labels:

```text
SHOP
PREVIOUS
OFFERS
BUILD
NEXT
1 BUY
2 BUY
3 BUY
R REROLL
ENTER DEPLOY
```

Show exact effects and trigger labels. Remove `REWIRE YOUR BUILD`, `SIGNAL OFFERS`, and recommendation paragraphs.

- [ ] **Step 4: Add previous-stage facts**

The compact strip shows:

```text
CLEAR  +10 TOKENS  100% ACC  WASD +40 BASE
```

Render only values that exist. Do not create a sentence.

- [ ] **Step 5: Add nonblocking purchase feedback**

A successful purchase sets a local `lastPurchasedId` for 600 ms. The card moves into the build rail with transform and opacity. Invalid purchases keep the existing disabled state and do not play success motion.

- [ ] **Step 6: Commit the shop flow**

```powershell
git add -- features/overdrive/components/shop.tsx features/overdrive/components/use-shop-shortcuts.ts app/globals.css
git commit -m "feat: add one-screen keyboard shop (I-3, I-4)"
```

### Task 6: Build the animation math and controller

**Files:**
- Create: `features/overdrive/canvas/rig/rig-definition.ts`
- Create: `features/overdrive/canvas/rig/interpolate.ts`
- Create: `features/overdrive/canvas/rig/animation-controller.ts`
- Create: `features/overdrive/canvas/rig/__tests__/interpolate.test.ts`
- Create: `features/overdrive/canvas/rig/__tests__/animation-controller.test.ts`

**Interfaces:**
- Consumes: no PixiJS in interpolation and controller tests
- Produces: `RigDefinition`, `AnimationClip`, `sampleTrack()`, and `AnimationController`

- [ ] **Step 1: Define rig and animation types**

Create:

```ts
export type RigTransform = {
	x: number
	y: number
	rotation: number
	scaleX: number
	scaleY: number
	alpha: number
}

export type RigKeyframe = Partial<RigTransform> & {
	atMs: number
	easing?: "linear" | "cubic-out" | "ease-out-back"
}

export type RigTrack = {
	partId: string
	keyframes: readonly RigKeyframe[]
}

export type AnimationClipName =
	| "idle"
	| "ready"
	| "chain-1"
	| "chain-2"
	| "chain-3"
	| "dash"
	| "execute"
	| "block"
	| "hurt"
	| "recover"
	| "overdrive"
	| "locomotion"
	| "anticipation"
	| "attack"
	| "hit"
	| "defeat"
	| "special"

export type AnimationClip = {
	name: AnimationClipName
	durationMs: number
	loop: boolean
	priority: number
	contactMs?: number
	recoveryStartMs?: number
	tracks: readonly RigTrack[]
}
```

Add part texture, parent, pivot, default transform, and z-index types in the same file.

- [ ] **Step 2: Write interpolation tests**

Cover:

```ts
it("interpolates between adjacent keyframes")
it("holds the first and last values outside the track range")
it("inherits missing values from the base transform")
it("applies cubic-out and ease-out-back")
```

- [ ] **Step 3: Implement track sampling**

Export:

```ts
export function sampleTrack(
	keyframes: readonly RigKeyframe[],
	atMs: number,
	base: RigTransform,
): RigTransform
```

Use binary or linear search over the small 8 to 12 keyframe arrays. Clamp time. Interpolate position, rotation, scale, and alpha.

- [ ] **Step 4: Write controller tests**

Cover:

```ts
it("rejects a lower-priority interruption before recovery")
it("accepts a chain interruption during recovery")
it("loops idle clips")
it("keeps at most two pending contacts")
it("collapses recovery when fast input arrives")
```

- [ ] **Step 5: Implement the controller**

Use this public interface:

```ts
export class AnimationController {
	play(name: AnimationClipName, options?: {
		force?: boolean
		queueContact?: boolean
	}): boolean
	update(deltaMs: number): AnimationFrameState
	clear(): void
}
```

`AnimationFrameState` contains clip name, local time, sampled part transforms, and a boolean contact edge. Keep the contact queue capped at two.

- [ ] **Step 6: Commit the animation core**

```powershell
git add -- features/overdrive/canvas/rig
git commit -m "feat: add articulated combat animation core (J-1)"
```

Do not run tests yet.

### Task 7: Build rig instances, manifests, and asset validation

**Files:**
- Create: `features/overdrive/canvas/rig/rig-instance.ts`
- Create: `features/overdrive/canvas/rig/rig-manifests.ts`
- Create: `features/overdrive/canvas/assets/combat-assets.ts`
- Create: `scripts/process-rig-sheet.py`
- Create: `scripts/validate-rig-assets.mjs`

**Interfaces:**
- Consumes: Task 6 rig types and animation controller
- Produces: `RigInstance`, `COMBAT_RIG_MANIFESTS`, `loadCombatRigAssets()`, and validation scripts

- [ ] **Step 1: Create the Pixi rig hierarchy**

Export:

```ts
export class RigInstance {
	readonly root: Container
	readonly controller: AnimationController

	constructor(definition: RigDefinition, textures: Record<string, Texture>)
	play(name: AnimationClipName, options?: { force?: boolean; queueContact?: boolean }): boolean
	update(deltaMs: number): AnimationFrameState
	setTint(color: number): void
	setAlpha(alpha: number): void
	destroy(): void
}
```

Create one `Container` per part. Parent containers according to the manifest, set pivots once, and update transforms from sampled frames. Do not create Sprites during `update`.

- [ ] **Step 2: Define manifests**

Create exact manifest IDs:

```ts
export type CombatRigId = "warden" | "packet" | "needle" | "null"

export const COMBAT_RIG_MANIFESTS: Record<CombatRigId, RigDefinition> = {
	warden: WARDEN_RIG,
	packet: PACKET_RIG,
	needle: NEEDLE_RIG,
	null: NULL_RIG,
}
```

Each manifest references its runtime atlas and all required clips. Initial clip data may use conservative keyframes that match the approved timing. Task 9 tunes motion after real assets exist.

- [ ] **Step 3: Load only required atlases**

Export:

```ts
export async function loadCombatRigAssets(stage: StageType): Promise<{
	warden: LoadedRigAssets
	enemy: LoadedRigAssets
	arena: Texture
}>
```

Map `warmup` to `packet`, `rush` to `needle`, and `glitch` to `null`. Cache successful loads. Reject invalid atlas JSON before constructing a rig.

- [ ] **Step 4: Add a local fallback**

Create a fallback rig from existing local Warden and enemy art. The fallback uses one Sprite per character and only runs when the new atlas fails. It keeps the command rail and scoring playable but records a development warning.

- [ ] **Step 5: Create the processing script**

`process-rig-sheet.py` must:

```text
read a labeled source sheet
remove the chroma background
trim each named part
preserve four pixels of transparent padding
pack parts into a 2048 by 2048 atlas
write frame rectangles and pivot coordinates
write alpha WebP and JSON output
```

Use Pillow from the workspace dependency environment. Fail when a part is missing or touches its source cell edge.

- [ ] **Step 6: Create asset validation**

`validate-rig-assets.mjs` must fail on:

```text
missing atlas or JSON
missing required part
missing required clip
pivot outside a frame
frame outside atlas bounds
atlas larger than 2048 by 2048
first-stage compressed combat art above 5 MB
aggregate resident texture estimate above 64 MB
```

- [ ] **Step 7: Commit the rig loader and pipeline**

```powershell
git add -- features/overdrive/canvas/rig features/overdrive/canvas/assets scripts/process-rig-sheet.py scripts/validate-rig-assets.mjs
git commit -m "feat: add combat rig asset pipeline (J-1)"
```

### Task 8: Produce coherent Warden and enemy rig art

**Files:**
- Create: `public/overdrive/art/source/warden-rig-v1-source.png`
- Create: `public/overdrive/art/source/packet-rig-v1-source.png`
- Create: `public/overdrive/art/source/needle-rig-v1-source.png`
- Create: `public/overdrive/art/source/null-rig-v1-source.png`
- Create: runtime atlas and JSON files under `public/overdrive/art/rigs/`
- Modify: `CREDITS.md`

**Interfaces:**
- Consumes: Task 7 part labels, pivots, and atlas constraints
- Produces: four coherent runtime rigs

- [ ] **Step 1: Read the image generation prompting references**

Read the full ImageGen prompting guide and sample prompts before generation.

- [ ] **Step 2: Generate the Warden source sheet**

Use the current Warden source only as an identity reference, not as an animation frame source. Generate:

```text
A production-ready modular character rig sheet for an original non-human mechanical typing sentinel named Keystone Warden. Premium stylized 3D game render converted to 2D, hard-surface cel shading, broad grounded silhouette, key-switch armor, oversized keycap shoulder, narrow cyan visor, forearm typing cannon, blackened steel and restrained green energy core. Fixed orthographic side-facing three-quarter camera, fixed cool top-left key light, identical materials and proportions across every part. Show separated labeled components with no overlaps: torso, pelvis, head, visor, near shoulder, far shoulder, near upper arm, far upper arm, near forearm, far forearm, cannon barrel, cannon core, near thigh, far thigh, near shin, far shin, near foot, far foot. Flat chroma magenta background, crisp edges, twelve percent padding, no text inside components, no human face, no mascot proportions, no motion blur, no floor, no cast shadow.
```

- [ ] **Step 3: Generate the Packet Stalker source sheet**

Use:

```text
A production-ready modular creature rig sheet for an original corrupted relay predator named Packet Stalker. Premium stylized 3D game render converted to 2D, hard-surface cel shading, low quadruped silhouette, armored relay plates, red sensor slit, exposed cable tendons, restrained green corruption. Fixed orthographic side-facing three-quarter camera and fixed cool top-left key light. Show separated labeled components with no overlaps: core torso, head, jaw, near front upper leg, near front lower leg, far front upper leg, far front lower leg, near rear upper leg, near rear lower leg, far rear upper leg, far rear lower leg, tail base, tail tip, near back plate, far back plate. Flat chroma magenta background, crisp edges, twelve percent padding, no text inside components, no cute features, no floor, no shadow.
```

- [ ] **Step 4: Generate the Needle Wraith source sheet**

Use:

```text
A production-ready modular creature rig sheet for an original fast signal hunter named Needle Wraith. Premium stylized 3D game render converted to 2D, hard-surface cel shading, narrow airborne silhouette, segmented spine, two blade arms, trailing signal fins, violet corruption core, single red sensor. Fixed orthographic side-facing three-quarter camera and fixed cool top-left key light. Show separated labeled components with no overlaps: chest core, head, neck segment, spine front, spine rear, near blade upper arm, near blade forearm, far blade upper arm, far blade forearm, near fin, far fin, tail segment one, tail segment two, tail tip. Flat chroma magenta background, crisp edges, twelve percent padding, no floor, no shadow, no human anatomy, no mascot proportions.
```

- [ ] **Step 5: Generate the Null Crown source sheet**

Use:

```text
A production-ready modular boss rig sheet for an original fractured signal construct named Null Crown. Premium stylized 3D game render converted to 2D, hard-surface cel shading, large floating silhouette, black crown plates around a void core, two articulated heavy arms, segmented cloak fragments, controlled red and violet corruption. Fixed orthographic side-facing three-quarter camera and fixed cool top-left key light. Show separated labeled components with no overlaps: void core, crown center, crown near plate, crown far plate, near shoulder, far shoulder, near upper arm, far upper arm, near forearm, far forearm, near hand, far hand, cloak segment one, cloak segment two, cloak segment three, lower core. Flat chroma magenta background, crisp edges, twelve percent padding, no text inside components, no floor, no shadow, no human face.
```

- [ ] **Step 6: Reject weak generations**

Reject a source when:

```text
parts change material language
left and right limbs use incompatible proportions
the camera changes between parts
a component touches another component
edges contain magenta spill
labels obscure a component
the silhouette loses its typing or signal identity
```

Generate again instead of repairing identity failures with local transforms.

- [ ] **Step 7: Process and document the accepted sources**

Run the processing script for each accepted source. Record generation identifiers, prompts, local processing, provider terms, and runtime output paths in `CREDITS.md`.

- [ ] **Step 8: Commit the art set**

```powershell
git add -- public/overdrive/art/source public/overdrive/art/rigs CREDITS.md
git commit -m "feat: add articulated Signal Siege characters (J-1)"
```

### Task 9: Replace pose swapping with rig choreography

**Files:**
- Create: `features/overdrive/canvas/choreography/target-lanes.ts`
- Create: `features/overdrive/canvas/choreography/combat-director.ts`
- Create: `features/overdrive/canvas/effects/combat-effects.ts`
- Modify: `features/overdrive/canvas/combat-scene.ts`
- Modify: `features/overdrive/canvas/visual-assets.ts`
- Modify: `features/overdrive/canvas/gameplay-canvas.tsx`
- Modify: `features/overdrive/components/gameplay-layer.tsx`

**Interfaces:**
- Consumes: `RigInstance`, `targetOrdinal`, presentation events, current and upcoming words
- Produces: three-target staging and nonblocking articulated combat

- [ ] **Step 1: Define deterministic lanes**

Export:

```ts
export type TargetLane = "low" | "mid" | "high"

const LANE_SEQUENCE: readonly TargetLane[] = [
	"mid", "low", "high", "mid", "high", "low", "mid", "low",
]

export function targetLane(ordinal: number, offset = 0): TargetLane {
	return LANE_SEQUENCE[(ordinal + offset) % LANE_SEQUENCE.length]
}
```

Use stage-specific screen anchors from `docs/design.md`.

- [ ] **Step 2: Define the combat director**

Export:

```ts
export class CombatDirector {
	handle(event: OverdrivePresentationEvent): void
	update(deltaMs: number): void
	sync(state: SceneState): void
	destroy(): void
}
```

Map accepted character indices to chain clips. Map `word-completed` to execute, recover, defeat, and next-target promotion. Map Aegis rescue, enemy pressure attack, and Overdrive to their priority clips.

- [ ] **Step 3: Add three enemy slots**

Maintain `active`, `upcoming`, and `distant` rig instances. Upcoming alpha must remain below active contrast. Promote slots on word resolution. Recycle a defeated slot only after its defeat clip ends.

- [ ] **Step 4: Pass persisted choreography state**

Add `targetOrdinal` to `SceneState`, the GameplayLayer store selector, and the GameplayCanvas props. `CombatDirector.sync()` uses it to place the active and upcoming targets after a remount.

- [ ] **Step 5: Add contact effects**

`combat-effects.ts` owns:

```ts
spawnContact(position, tone)
spawnSmear(from, to, tone)
spawnDefeat(position, stage)
spawnShield(position)
spawnOverdriveColumn(from, to)
update(deltaMs)
clear()
```

Use pooled Graphics and Sprites. Cap all live particles and fragments at 200.

- [ ] **Step 6: Reduce `combat-scene.ts`**

Keep only:

```text
Pixi root setup
background and command rail
CombatDirector construction
event routing
state sync
resize
destroy
```

Remove `setWardenPose`, `setTargetPose`, full-body pose texture tables, and the old attack timer branches.

- [ ] **Step 7: Keep input ahead of animation**

The director never calls engine methods and never blocks the command rail. On a fast chain it skips recoveries and retains the latest two contacts. The next word appears from engine state even when an older defeat clip still runs.

- [ ] **Step 8: Commit rig choreography**

```powershell
git add -- features/overdrive/canvas
git commit -m "feat: direct articulated Signal Siege combat (J-1)"
```

### Task 10: Add item-specific visual and audio feedback

**Files:**
- Create: `features/overdrive/canvas/effects/item-presentation.ts`
- Modify: `features/overdrive/canvas/choreography/combat-director.ts`
- Modify: `features/overdrive/components/gameplay-layer.tsx`
- Modify: `features/overdrive/fx/sfx.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: exact item IDs and `item-triggered` or `macro-used` events
- Produces: `ITEM_PRESENTATION` and `sfx.item(id, contribution)`

- [ ] **Step 1: Define all presentation presets**

Use:

```ts
export type ItemPresentationPreset = {
	shape:
		| "cross-cut"
		| "magnet-arc"
		| "sightline"
		| "afterimage"
		| "reconnect"
		| "token-eject"
		| "key-floor"
		| "punctuation-burst"
		| "battery-shield"
		| "gear-pulse"
		| "double-contact"
		| "core-segment"
		| "vault"
		| "glass"
		| "time-strand"
		| "glitch-tear"
		| "time-ring"
		| "quota-cut"
		| "insurance-shield"
	tone: "base" | "mult" | "score" | "time" | "token" | "protection" | "quota"
	hudTarget: "base" | "mult" | "score" | "time" | "token" | "quota" | "rail"
}
```

Create an explicit record for all 15 Keycaps and 4 Macros. Do not use a generic fallback for a known MVP item.

- [ ] **Step 2: Route proc events**

The director plays the preset near the combat action. The DOM overlay shows only the latest contribution value and item name for 450 ms. It must stay outside the caret exclusion zone.

- [ ] **Step 3: Add deterministic audio layers**

Add:

```ts
item(itemId: string, kind: ItemContribution["kind"]): void
```

Build item cues from the existing `tone` and `noise` helpers. Choose frequencies from static records keyed by item ID. Do not introduce runtime randomness or large audio files.

- [ ] **Step 4: Handle simultaneous procs**

Sort simultaneous effects by contribution kind:

```text
protection
time and quota
mult
base
score
token
```

Show one label and combine compatible combat shapes. Keep all slot flashes so players can locate each triggering item.

- [ ] **Step 5: Commit item feedback**

```powershell
git add -- features/overdrive/canvas/effects features/overdrive/canvas/choreography/combat-director.ts features/overdrive/components/gameplay-layer.tsx features/overdrive/fx/sfx.ts app/globals.css
git commit -m "feat: give every build trigger a combat response (I-4, J-1)"
```

### Task 11: Remove slop, fix encoding, and tune responsive layout

**Files:**
- Modify: `features/overdrive/components/gameplay.tsx`
- Modify: `features/overdrive/components/gameplay-layer.tsx`
- Modify: `features/overdrive/components/hud.tsx`
- Modify: `features/overdrive/components/shop.tsx`
- Modify: `features/overdrive/components/menu.tsx`
- Modify: `features/overdrive/components/overdrive-app.tsx`
- Modify: `features/overdrive/components/run-over.tsx`
- Modify: `features/overdrive/presentation/stage-copy.ts`
- Modify: `lib/engine/overdrive/items/keycaps.ts`
- Modify: `lib/engine/overdrive/items/macros.ts`
- Modify: `lib/engine/overdrive/items/glitches.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: final flow and presentation components
- Produces: clean English copy, valid UTF-8 punctuation, and required viewport layouts

- [ ] **Step 1: Run the stop-slop source scan**

Run:

```powershell
rg -n "REWIRE YOUR BUILD|NEXT READ|Convert the lead|SYNCING COMBAT LINK|Your typing carried|raw-speed only|stronger build|\x{00C2}|\x{00C3}|\x{FFFD}|[/]{2}" features/overdrive lib/engine/overdrive app/globals.css
```

- [ ] **Step 2: Replace active-flow copy**

Use:

```text
LOADING ARENA
CLEAR
PREVIOUS
OFFERS
BUILD
NEXT
ENTER: OVERDRIVE
SPACE: EXECUTE
FOCUS PAUSE
```

Keep exact canonical item descriptions. Remove recommendation paragraphs and promotional subheadings.

- [ ] **Step 3: Remove unnecessary comments**

Delete comments that restate the next statement, narrate implementation steps, or preserve abandoned code. Keep license notices and comments that explain engine invariants.

- [ ] **Step 4: Repair tracked source encoding**

Save changed files as UTF-8. Replace corrupted middle dots, multiplication marks, ellipses, and minus marks with valid source characters or plain ASCII where the UI does not require the symbol.

- [ ] **Step 5: Check all required layouts manually without running E2E**

Use the live browser at:

```text
390 x 844
820 x 1180
1366 x 768
1440 x 900
1920 x 1080
```

Inspect menu, stage, result ribbon, shop, standard clear, and run over. Fix overlap, clipping, and required scrolling with canonical spacing values only.

- [ ] **Step 6: Commit copy and layout polish**

```powershell
git add -- features/overdrive lib/engine/overdrive/items app/globals.css
git commit -m "fix: tighten Overdrive copy and responsive flow (J-1)"
```

### Task 12: Run critique passes and final verification

**Files:**
- Modify: `e2e/overdrive-juice.spec.ts`
- Create: `e2e/overdrive-layout.spec.ts`
- Modify: `scripts/simulate-overdrive.mjs`
- Modify: any file that fails a final gate

**Interfaces:**
- Consumes: all previous tasks
- Produces: verified build with recorded gameplay, animation, flow, and balance evidence

- [ ] **Step 1: Critique silhouette and rig motion**

Inspect slow input at 1 WPM pacing and burst input above 90 WPM. Reject:

```text
floating feet
limb separation
scale jumps
camera changes
recoil in the wrong direction
idle limited to vertical bobbing
contact after the next key
enemy telegraph hidden by the rail
```

Fix each finding before continuing.

- [ ] **Step 2: Critique run flow**

Play from Zone 1 Warm-up through Zone 3. Confirm:

```text
result ribbon appears over the mounted arena
shop opens after 900ms
Enter skips the ribbon
1, 2, and 3 buy valid offers
R rerolls when affordable
Enter deploys
no stage transition requires scroll or pointer input
```

- [ ] **Step 3: Critique item clarity**

Use deterministic starting builds to trigger all 15 Keycaps and all 4 Macros. Record any trigger that cannot be identified from its motion, sound, and contribution. Fix the preset before final tests.

- [ ] **Step 4: Update E2E coverage**

Replace the old stage transition helper with:

```ts
async function waitForShop(page: Page) {
	await expect(page.getByRole("heading", { name: "SHOP", exact: true }))
		.toBeVisible({ timeout: 3_000 })
}

async function deployWithKeyboard(page: Page) {
	await page.keyboard.press("Enter")
	await expect(page.getByTestId("pixi-gameplay")).toBeVisible()
}
```

Add tests for:

```text
Zone 1 automatic submission
Zone 2 automatic full-charge release
Zone 3 Space hold and Enter release
stage clear ribbon and automatic shop
shop 1, 2, 3, R, and Enter shortcuts
no required scroll at all five viewports
canvas remains mounted through stageResult
missing asset fallback remains playable
```

- [ ] **Step 5: Update simulation strategies**

Model Zone 3 and later players with:

```ts
type OverdriveStrategy = "immediate" | "highest-preview-score"
```

The beginner profiles use `immediate`. Build-aware profiles use `highest-preview-score` with no hidden WPM scaling.

- [ ] **Step 6: Run unit tests**

Run:

```powershell
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 7: Run deterministic simulation**

Run:

```powershell
node scripts/simulate-overdrive.mjs
```

Expected:

```text
1, 5, 10, 12, and 13 WPM complete Zones 1 and 2 through protection
40 to 50 WPM reaches Zone 3 to 5 in representative runs
60 WPM with a coherent build can reach Zone 6 to 8
90 WPM without a coherent build does not bypass the build curve
```

- [ ] **Step 8: Run static verification**

Run:

```powershell
npm run lint
npx tsc --noEmit
node scripts/validate-rig-assets.mjs
npm run build
```

Expected: all commands exit zero.

- [ ] **Step 9: Run E2E once**

Run:

```powershell
npm run test:e2e
```

Expected: all Playwright tests pass.

- [ ] **Step 10: Inspect reduced motion**

Enable reduced motion and confirm that:

```text
rig pose changes remain readable
shake, hitstop, particles, and background pulse stop
result and shop transitions retain short opacity changes
typing and shortcuts retain full functionality
```

- [ ] **Step 11: Run final source audit**

Run:

```powershell
rg -n "\x{00C2}|\x{00C3}|\x{FFFD}|REWIRE YOUR BUILD|NEXT READ|Convert the lead|SYNCING COMBAT LINK|[/]{2}" features/overdrive lib/engine/overdrive app/globals.css
git diff --check
git status --short
```

Expected: no slop or encoding findings, no whitespace errors, and only intentional tracked changes.

- [ ] **Step 12: Commit final verification fixes**

```powershell
git add -- e2e scripts features/overdrive lib/engine/overdrive app/globals.css public/overdrive CREDITS.md
git commit -m "test: verify continuous Overdrive arcade run (R-1, R-2, I-4, J-1)"
```
