> Prompts for driving an AI coding agent (Claude Code / Cursor) through the milestones in TYPECADE: OVERDRIVE — PRD & Tech Spec v0.1. Assumes the three docs live in the repo at `docs/game-design.md`, `docs/prd.md`, `docs/design.md`.
> 

**How to use:**

1. Save Prompt 0 once as `CLAUDE.md` (or `.cursorrules` / `AGENTS.md`) in the repo root. It applies to every session.
2. Run one milestone prompt per session. Do not mix milestones in one session.
3. Always let the agent show its plan before it writes code. Reject plans that touch files outside the milestone scope.
4. After each step, run the test commands it gives you. Green tests before the next step.

---

# Prompt 0: Rules file (`CLAUDE.md`, permanent)

```markdown
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
4. **Feature flag.** All Overdrive code lives behind the `overdrive` flag (env + `/overdrive` route). Never break the existing typing test (Practice); its behavior must stay unchanged.
5. **Deterministic RNG.** All randomness (word order, shop contents, glitches) flows from a single seeded RNG instance. `Math.random()` is banned in game logic.
6. **MVP scope is locked** to game-design.md §13. Do not implement Firmware, Switch difficulty, Copycat, KERNEL PANIC, cosmetics, or anything marked v2/P2 unless explicitly asked.
7. **Tests before juice.** Engine and scoring logic get Vitest unit tests in the same PR. UI polish never lands before its logic is tested.

## Stack (fixed, see prd.md §3)
Next.js 16 App Router + TS strict, Tailwind v4, Zustand, PixiJS v8 (gameplay canvas only, dynamic import ssr:false), Framer Motion (menus/shop only, never gameplay), Supabase, Cloudflare Workers via OpenNext, Web Audio API, Vitest + Playwright.

## Workflow
- Trunk-based: small branches (`feat/overdrive-*`), conventional commits, PR per requirement ID when possible.
- Reference requirement IDs from prd.md in commits and PRs (e.g. "feat: run state machine (R-1)").
- Item names, effects, and numbers must match game-design.md §5-6 exactly, character for character.
```

---

# Prompt 1: M0 Foundation (F-1, F-4, F-2, F-5)

```markdown
Read CLAUDE.md, then docs/prd.md and docs/game-design.md in full.

We are starting Milestone M0 (Foundation) from prd.md §5. Work through these in order, one PR-sized change at a time:

1. **F-1**: Extract the existing typing engine from the current typing test into `lib/engine/` (or `packages/engine/` if a workspace already exists): input processing, accuracy, WPM, and a typed keystroke/word event stream. The existing Practice mode must consume this module with zero behavior change. Add Vitest tests for accuracy and WPM math BEFORE refactoring, so the refactor is verified against them.
2. **F-4**: Add a seeded RNG module (xoshiro or seedrandom wrapper) with a typed API: `createRng(seed)` returning `next()`, `pick(array)`, `shuffle(array)`, and `fork(label)` for independent sub-streams (words vs shop vs glitches must not share one sequence). Unit test: same seed produces identical sequences; forked streams are independent.
3. **F-2**: Add the `overdrive` feature flag: `NEXT_PUBLIC_OVERDRIVE` env var + hidden `/overdrive` route that renders a placeholder page. Flag off = route 404s.
4. **F-5**: Add a minimal telemetry util that fires run_start, stage_clear, run_end, shop_buy, and death-by-zone events (console/no-op transport for now, PostHog later). Type the event payloads.

Rules for this session:
- Do not start M1 (run state machine) yet.
- Show me a short plan with the file tree you intend to touch before writing code for each step.
- After each step, list what changed and the test commands to verify.

Start with step 1: first show me the current engine-related files and your extraction plan.
```

---

# Prompt 2: F-3 Workers migration (separate session, run manually alongside)

```markdown
This repo currently deploys to Cloudflare Pages via @cloudflare/next-on-pages. Migrate it to Cloudflare Workers using the official @opennextjs/cloudflare adapter.

Steps:
1. Show me the current deploy setup first: package.json scripts, wrangler config, and any Pages-specific code (bindings, env access).
2. Follow the official OpenNext Cloudflare migration guide. Replace next-on-pages, add wrangler.jsonc for Workers, update build/deploy scripts.
3. Preserve all current env vars and Supabase configuration.
4. Verify: `next build` passes, local preview via wrangler works, and list exactly what I must change in the Cloudflare dashboard (new Worker, custom domain typecade.com, env vars).

Do not touch application code beyond what the adapter requires. Branch: chore/migrate-workers.
```

---

# Prompt HOTFIX: Practice regression repair (run this FIRST, own session)

<aside>
🚨

Use when the old app at `/` is broken after a refactor (missing on-screen keyboard, broken navigation). Nothing else may happen in this session.

</aside>

```markdown
The last session broke the existing Practice app. Symptoms on `/`: the on-screen keyboard no longer renders and site navigation is broken. Fixing this is the ONLY goal of this session. Do not refactor, do not improve, do not touch anything Overdrive.

1. Run `git log --oneline -20` and identify the last commit BEFORE the engine extraction (F-1). Report the list and the sha you picked.
2. Run `git diff <sha> HEAD --stat`. List every changed file. Suspects: anything under `features/typing`, `features/learn`, `features/multiplayer`, shared `components/`, and the root `app/` layout/header.
3. Before fixing anything: open `/` in the browser, open the console, and paste every red error here.
4. Most likely root cause: `features/typing/hooks/use-typing-engine.ts` no longer returns the exact same shape the UI expects (keyboard highlight state, per-key events, focus handling, refs). Run `git diff <sha> HEAD -- features/typing/hooks/use-typing-engine.ts` and compare the old vs new PUBLIC return signature. The hook's public API is FROZEN: restore the exact old signature and adapt internally to `lib/engine/core.ts`. UI components must not need a single line of change.
5. If a keyboard/nav component was deleted or its import removed, restore it from git: `git checkout <sha> -- <path>`.
6. Acceptance, verify each in the browser and answer yes/no one by one:
   - `/` renders the typing test WITH the on-screen keyboard, and keys highlight while typing
   - header/nav works: logo and menu links clickable, no dead routes
   - a full 15s test completes and shows the results screen
   - `/race` (multiplayer) loads without console errors
   - `npx vitest run` all green, `npx tsc --noEmit` reports 0 errors
7. If you cannot make the new hook satisfy the old API in this session, cleanly revert the extraction commits (`git revert`) and say so explicitly. A working old app beats a broken refactor.
```

---

# Prompt 3: M1 Playable core (R-1..R-5, I-1 + 5 keycaps)

```markdown
Read CLAUDE.md. Read docs/game-design.md §2 (core loop & score formula), §3 (run structure & quota curve), §4 (economy numbers only, no shop UI yet), and docs/prd.md EPIC 1 + I-1.

Goal of M1: a full 8-zone run playable end to end with an ugly, unstyled DOM UI. No canvas, no animation, no shop screen. "Fun" is the only deliverable.

Build in this order, inside `lib/engine/overdrive/` (headless) + a thin React page at `/overdrive`:

1. **R-3**: `constants.ts` — the quota curve table from game-design.md §3, stage duration (60s), combo rate (+1 Mult per 10 words), endless multiplier (1.8^n). One file, all tuning knobs, no constants scattered elsewhere.
2. **R-1**: Run state machine — states: idle > stage(zone, stageType: warmup|rush|glitch) > stageResult > shopStub > nextStage … > runOver(win|lose). Warm-up is skippable (+1 Token per game-design.md §4). Glitch stages run WITHOUT modifiers in M1 (framework comes in M2), only the higher quota.
3. **R-2**: Scoring engine — `(charCount + baseBonus) x currentMult` per clean word; typo = word scores 0 + Mult resets to 1; combo counter per game-design.md §2. Emits typed events: word_complete, typo, mult_change, quota_progress, stage_clear, stage_fail.
4. **R-4**: Per-stage timer (tick from the UI layer via `advance(ms)` so the engine stays headless and testable) + stage result payload: score, accuracy, time left, tokens earned (clear reward + time bonus + interest per §4).
5. **I-1**: Item event bus — Keycaps are objects subscribing to engine events, registered per run. Then hardcode 5 Keycaps exactly per game-design.md §5: WASD, Vowel Magnet, Sprinter, Combo Battery, Overclock. For M1 the run simply starts with all 5 equipped.
6. **R-5**: Endless mode after Zone 8 (quota x1.8^n).
7. Minimal `/overdrive` DOM UI: word stream (plain text), input handling via the shared engine from M0, quota/timer/combo/mult/score numbers, run over screen with restart. Readable, zero styling effort.

Tests (Vitest, same PR as the code they cover):
- Scoring: table-driven cases for the formula, combo increments at word 10/20/30, typo reset, Combo Battery shield consumed once per stage.
- State machine: clear > shopStub > next stage; fail > runOver; zone 8 clear > endless.
- Determinism: two runs with the same seed and same scripted inputs produce identical final scores.
- Economy math: clear rewards 3/4/5, time bonus +1 per 10s remaining, interest +1 per 5 held (cap +5).

Rules for this session: no PixiJS, no Tailwind polish, no shop UI, no items beyond the 5 listed. Show me your plan and file tree first.
```

---

# Prompt 3B: M1 full build, fully specified (engine + UI + input; for weak agents)

<aside>
🧱

Use INSTEAD of Prompt 3 when the agent cannot plan on its own. Run only AFTER the HOTFIX session is green. Copy from "CONTEXT" to the end of this section as ONE prompt. Result: a complete, playable, styled 8-zone run at `/overdrive`. No drawn/image assets exist in this milestone: the art IS typography + color tokens. Icons and SFX come later in Prompt 5 (icons: game-icons.net CC-BY inline SVG; SFX: sfxr.me / jsfxr, CC0). Never generate AI image sprites for the UI.

</aside>

CONTEXT

Build the Overdrive game mode at `/overdrive`. Numbers come from `docs/game-design.md`, visuals from `docs/design.md`. Everything below is prescriptive: exact files, exact libraries, exact code. Where a sample says "copy from the doc", copy values verbatim; inventing a value is a bug.

Libraries: React (installed), Zustand for UI state (`npm i zustand` if missing). NOTHING else new. No PixiJS, no Framer Motion, no UI kit, no CSS-in-JS. Gameplay is plain DOM styled with the Tailwind tokens.

PREREQUISITE: execute STEP 1-4 of Prompt 5A first (fonts, `@theme` tokens, `app/overdrive/layout.tsx` shell, `components/overdrive/ui.tsx` primitives). Then continue here.

FILE TREE (create exactly this; if you want to deviate, stop and ask first)

```
lib/engine/overdrive/
	constants.ts      // every tuning number lives here, nowhere else
	types.ts          // stage types + engine event map
	emitter.ts        // tiny typed event emitter
	scoring.ts        // combo/mult + word scoring
	run.ts            // run state machine (zones, stages, timer, tokens)
	keycaps.ts        // the 5 M1 keycaps
	index.ts          // barrel
lib/engine/overdrive/__tests__/
	scoring.test.ts
	run.test.ts
features/overdrive/
	store.ts          // zustand bridge: engine events -> React state
	use-game-input.ts // global keyboard capture
	components/
		menu.tsx
		hud.tsx         // layout = Prompt 5A STEP 5b
		word-stream.tsx
		stage-result.tsx
		run-over.tsx
data/
	words-en.json     // ~500 common lowercase English words, 3-9 letters, no duplicates, no proper nouns (source: a standard frequency list)
app/overdrive/
	layout.tsx        // from Prompt 5A STEP 3
	page.tsx          // screen switcher + game loop
```

STEP 1: `constants.ts`

```tsx
export const STAGE_DURATION_MS = 60_000
export const WORDS_PER_MULT = 10        // +1 Mult per 10 clean words
export const ENDLESS_QUOTA_FACTOR = 1.8 // quota x1.8^n after Zone 8

// Copy this table 1:1 from docs/game-design.md §3. Zones 2-7 included. Do not round or "fix" numbers.
export const QUOTA: Record<number, { warmup: number; rush: number; glitch: number }> = {
	1: { warmup: 300, rush: 450, glitch: 600 },
	// ... zones 2-7 exactly from the doc ...
	8: { warmup: 50_000, rush: 75_000, glitch: 100_000 },
}

// Economy, from docs/game-design.md §4:
export const CLEAR_REWARD = { warmup: 3, rush: 4, glitch: 5 } as const
export const TIME_BONUS_PER_10S = 1
export const INTEREST_PER_5_TOKENS = 1
export const INTEREST_CAP = 5
export const WARMUP_SKIP_REWARD = 1
```

STEP 2: typed emitter + event map

```tsx
// emitter.ts
export type Listener<T> = (payload: T) => void

export function createEmitter<Events extends Record<string, unknown>>() {
	const map = new Map<keyof Events, Set<Listener<never>>>()
	return {
		on<K extends keyof Events>(event: K, fn: Listener<Events[K]>) {
			if (!map.has(event)) map.set(event, new Set())
			map.get(event)!.add(fn as Listener<never>)
			return () => { map.get(event)!.delete(fn as Listener<never>) }
		},
		emit<K extends keyof Events>(event: K, payload: Events[K]) {
			map.get(event)?.forEach((fn) => (fn as Listener<Events[K]>)(payload))
		},
	}
}
```

```tsx
// types.ts
export type StageType = "warmup" | "rush" | "glitch"

export type EngineEvents = {
	word_complete: { word: string; gained: number; combo: number; mult: number }
	typo: { expected: string; got: string }
	mult_change: { mult: number }
	quota_progress: { score: number; quota: number }
	stage_clear: { zone: number; stage: StageType; tokensEarned: number; timeLeftMs: number }
	stage_fail: { zone: number; stage: StageType }
	run_over: { win: boolean; finalScore: number; zoneReached: number }
}
```

STEP 3: `scoring.ts`

```tsx
import { WORDS_PER_MULT } from "./constants"

export type WordResult = { gained: number; clean: boolean; combo: number; mult: number }

export function createScorer(baseBonus = 0) {
	let combo = 0
	let mult = 1
	return {
		get combo() { return combo },
		get mult() { return mult },
		completeWord(word: string, hadTypo: boolean): WordResult {
			if (hadTypo) {
				combo = 0
				mult = 1
				return { gained: 0, clean: false, combo, mult }
			}
			combo += 1
			if (combo % WORDS_PER_MULT === 0) mult += 1
			return { gained: (word.length + baseBonus) * mult, clean: true, combo, mult }
		},
	}
}
```

Keycaps may modify `baseBonus`/`mult` via the event bus; keep the scorer itself item-agnostic.

STEP 4: `run.ts` state machine. Public API (implement exactly this surface):

```tsx
export type Screen = "menu" | "stage" | "stageResult" | "runOver"

export type RunSnapshot = {
	screen: Screen
	zone: number
	stage: StageType
	timeLeftMs: number
	score: number        // current stage score
	quota: number
	combo: number
	mult: number
	tokens: number
	accuracy: number     // running, 0-100
	currentWord: string
	caretIndex: number   // typed-so-far length in current word
	wordDirty: boolean   // typo happened in current word
	upcomingWords: string[] // next 8
	win?: boolean
}

export function createRun(opts: { seed: string; words: string[] }): {
	snapshot(): RunSnapshot
	events: ReturnType<typeof createEmitter<EngineEvents>>
	start(): void
	skipWarmup(): void   // only in warmup, +WARMUP_SKIP_REWARD token
	feedChar(c: string): void  // compare to currentWord[caretIndex]; wrong char = typo (word goes dirty, caret stays); space at word end completes the word
	backspace(): void    // move caret back one, free in M1
	advance(ms: number): void  // called from RAF; ticks timer; at 0 decides clear/fail vs quota
	continueToNextStage(): void // from stageResult
	restart(): void
}
```

Rules: word order comes from the M0 seeded RNG (`fork("words")`), shuffled cycle over `words`. Tokens on clear = `CLEAR_REWARD[stage] + floor(timeLeftMs/10000)*TIME_BONUS_PER_10S + min(floor(tokens/5)*INTEREST_PER_5_TOKENS, INTEREST_CAP)`. After Zone 8 glitch clear: endless zones 9+ with `quota(8) * 1.8^(zone-8)`, win flag true on entering endless. Glitch stages in M1 = higher quota only, no modifiers.

STEP 5: `keycaps.ts` — implement the 5 keycaps with names/effects copied character-for-character from docs/game-design.md §5: WASD, Vowel Magnet, Sprinter, Combo Battery, Overclock. Each subscribes to engine events. All 5 auto-equipped at run start in M1. Combo Battery: absorbs the first Mult reset each stage (consume once, re-arm on stage start).

STEP 6: `store.ts` (Zustand bridge)

```tsx
import { create } from "zustand"
import { createRun, type RunSnapshot } from "@/lib/engine/overdrive"
import words from "@/data/words-en.json"

type GameStore = RunSnapshot & { init(seed: string): void; api?: ReturnType<typeof createRun> }

export const useGame = create<GameStore>((set, get) => ({
	...({} as RunSnapshot), screen: "menu",
	init(seed) {
		const api = createRun({ seed, words })
		const sync = () => set({ ...api.snapshot(), api })
		;(["word_complete", "typo", "mult_change", "quota_progress", "stage_clear", "stage_fail", "run_over"] as const)
			.forEach((e) => api.events.on(e, sync))
		set({ ...api.snapshot(), api })
	},
}))
```

Sync also after every `feedChar`/`advance` call (call `sync` from the page loop; snapshot reads are cheap).

STEP 7: `use-game-input.ts` — NO visible input box, global capture:

```tsx
"use client"
import { useEffect } from "react"

export function useGameInput(onChar: (c: string) => void, onBackspace: () => void, enabled: boolean) {
	useEffect(() => {
		if (!enabled) return
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey || e.altKey) return
			if (e.key === "Backspace") { e.preventDefault(); onBackspace(); return }
			if (e.key.length === 1) { e.preventDefault(); onChar(e.key) }
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [onChar, onBackspace, enabled])
}
```

STEP 8: game loop in `app/overdrive/page.tsx` (screen switcher: menu | stage | stageResult | runOver):

```tsx
useEffect(() => {
	if (screen !== "stage") return
	let last = performance.now()
	let raf = 0
	const tick = (now: number) => {
		api.advance(now - last)
		last = now
		raf = requestAnimationFrame(tick)
	}
	raf = requestAnimationFrame(tick)
	return () => cancelAnimationFrame(raf)
}, [screen, api])
```

STEP 9: screens

- `menu.tsx`: exactly Prompt 5A STEP 5a. "Practice" button links to `/`. Play calls `init(String(Date.now()))` then `api.start()`.
- `hud.tsx`: exactly Prompt 5A STEP 5b, values bound to the store. Keycap row renders the 5 equipped keycaps with `KeycapSlot` + name on hover (`title` attribute is enough in M1).
- `word-stream.tsx`: previous line (last completed words) and next line in `text-[28px] text-text-dim`; active word centered `text-5xl font-bold text-acc-green`; within the active word, typed chars `text-text-hi`, caret char underlined, on `wordDirty` the whole word turns `text-acc-red` until corrected.
- `stage-result.tsx`: centered column: "STAGE CLEAR" (`font-pixel text-2xl text-acc-green`) or "QUOTA FAILED" (`text-acc-red`), score vs quota, accuracy, time left, token breakdown (clear + time bonus + interest), then PrimaryButton CONTINUE (label "SHOP" is for M2; here it goes straight to next stage) and in warmup GhostButton "Skip warm-up (+1 token)".
- `run-over.tsx`: exactly Prompt 5A STEP 5d, plus "zone reached" stat. Restart = full reset with a new seed.
- Game screens render inside the Overdrive shell WITHOUT the old site header. Esc during a stage pauses (simple overlay: RESUME / QUIT TO MENU).

STEP 10: tests (Vitest, same session)

- scoring: formula table cases; mult +1 at combo 10/20/30; typo resets combo AND mult; Combo Battery absorbs exactly one reset per stage.
- run: clear > stageResult > next stage; fail > runOver; zone 8 glitch clear > zone 9 endless with quota x1.8; token math incl. interest cap; skipWarmup only in warmup; determinism: same seed + same scripted input = same final score.

STEP 11: acceptance, verify in the browser and report yes/no per item

1. `/overdrive` shows the menu per spec (dark `#0A0E14`, pixel wordmark, 3 buttons + leaderboard link, no old header).
2. PLAY starts Zone 1 warm-up and typing works IMMEDIATELY, no input box, no click needed.
3. Quota bar fills; combo/mult/score update per word; typo turns the word red and resets mult.
4. Timer hits 0 => stageResult with correct token math; CONTINUE advances; failing a quota ends the run.
5. A full run to Zone 8 and into endless is possible (temporarily lower QUOTA in a local test to verify flow, then restore the doc values).
6. Esc pause works; QUIT returns to menu; restart gives a different word order (new seed).
7. Zero console errors; `npx vitest run` green; `npx tsc --noEmit` 0 errors; `/` and `/race` untouched and still working.

Rules for this session: touch ONLY the files in the file tree above (plus the Prompt 5A prerequisite files). If any step is impossible as written, stop and ask; do not improvise.

---

# Prompt 4: M2 Full economy (I-2, I-3, I-4, G-1, G-2)

```markdown
Read CLAUDE.md. Read docs/game-design.md §4 (economy & shop), §5 (Keycaps: only the 15 MVP ones per §13), §6 (Macros: the 4 MVP ones), §8 (Glitches: the 5 MVP ones), and docs/prd.md EPIC 2 + 3.

Goal of M2: complete runs with shop decisions. Build in this order:

1. **I-2 data**: Define all 15 MVP Keycaps + 4 Macros as data + effect handlers on the M1 event bus. Names, rarities, effects, and numbers must match game-design.md §5-6 character for character. Put definitions in `lib/engine/overdrive/items/` with one file per item type, exported from a registry keyed by id.
2. **I-3 shop logic** (headless): shop inventory generation from the seeded RNG shop fork — 2 Keycap slots with rarity odds 60/28/10/2 and prices per §4, 1 Macro slot, reroll (5 Tokens, +1 per use per visit), sell at 50% rounded down, interest cap +5, buy validation (tokens, slot space, max 5 Keycap slots, max 2 Macros).
3. **G-1 glitch framework**: a Glitch is a plugin with lifecycle hooks (onStageStart, onKeystroke, onWordComplete, onTick, onStageEnd) that can alter engine rules and flag rendering hints. Assignment: one random glitch per Glitch stage from the seeded glitch fork.
4. **G-2**: Implement the 5 MVP Glitches per §8: No Backspace, Sudden Death (3 typos = fail), Invisible Ink (rendering hint: word fades 1s after appearing), Blackout (rendering hint: dark except caret radius), Inflation (quota +50%, token reward x2).
5. **I-4 + shop UI**: functional (still unpolished) shop screen between stages and a Keycap slot row with effect tooltips in the gameplay UI. Macro use: click/hotkey during a stage.

Tests:
- Every Keycap and Macro gets at least one unit test proving its effect (e.g. Glass Keycap shatters below 95% stage accuracy; Snowball +0.2 permanent Mult only on zero-typo stages; Midas pays on x/z/q/j).
- Shop: rarity distribution over 10,000 seeded generations within ±2% of 60/28/10/2; reroll price escalation; sell rounding; interest cap.
- Glitches: Sudden Death fails on the 3rd typo; Inflation math; No Backspace blocks correction at the engine level.

Rules: no visual polish yet, no Firmware, no glitches beyond the 5. Plan and file tree first.
```

---

# Prompt 5: M3 Juice pass (J-1, J-2, J-3)

```markdown
Read CLAUDE.md. Read docs/design.md IN FULL — it is the spec for this entire milestone, every number in it is an implementation value. Also re-read docs/prd.md EPIC 4.

Goal of M3: the game looks and feels like the design doc. Build in this order:

1. **Tokens first**: implement design.md §2 (colors) and §3 (typography) as CSS variables + Tailwind v4 theme. Load JetBrains Mono and Press Start 2P via next/font. Delete any placeholder styling from M1/M2.
2. **J-1 canvas gameplay**: replace the DOM gameplay area with a PixiJS v8 canvas (dynamic import, ssr:false). Implement the HUD layout exactly per design.md §5.1 (positions, heights, sizes, colors), the caret spec, and the score popup spec. The canvas layer subscribes to engine events; it never computes game logic.
3. **Motion spec**: implement every row of the design.md §7 event table with its exact duration and easing, the combo escalation tiers, the particle budget (max 200), and the hitstop. Transform/opacity only.
4. **Screens**: restyle Shop (§5.2), Run Over (§5.3), and Main Menu (§5.4) per spec, using the components table (§6). Framer Motion allowed here, not in gameplay.
5. **J-2 audio**: implement the design.md §8 event table with Web Audio: 3 switch click variants, pitch-stepped word blip, mixing rules (sliders, defaults 50/70/0, start after first input, <500KB, lazy-loaded). Generate placeholder SFX with jsfxr-style synthesis or load from /public/sfx if files exist.
6. **J-3 reduced motion**: prefers-reduced-motion + in-game toggle per design.md §7, and the accessibility rules in §10 (keyboard-only gameplay, Esc pause, Tab+Enter shop).
7. **Icons**: Game-icons.net SVGs for the 15 Keycaps + 4 Macros per §9, inline, single-color. Add each icon's attribution to CREDITS.md (CC-BY).

Acceptance = design.md §11 Definition of Done, checked per screen. Also: Chrome DevTools performance trace at x16 combo with 200 particles stays at 60fps with 6x CPU throttle.

Rules: if a value is missing from design.md, ask me instead of inventing one. Plan first, one screen at a time.
```

---

# Prompt 5A: FE restyle for weak agents (mechanical, zero thinking required)

<aside>
🩹

Use this when the agent ran Prompt 5 but the UI still shows the old style. It removes all judgment calls: exact files, exact code, exact class names. Copy everything from "CONTEXT" to the end of this section as ONE prompt. Note: this covers the DOM screens and tokens only; the PixiJS canvas and motion spec stay in Prompt 5 steps 2-3.

</aside>

CONTEXT

The Overdrive UI must match `docs/design.md` exactly, but the app still shows the old Typecade style. Your job is a mechanical restyle. You are not allowed to invent any value: every color, size, and font below is final. Scope: only `app/overdrive/**`, `components/overdrive/**`, `app/fonts.ts`, and one token block in `app/globals.css`. Never touch the Practice pages or their styles. Work one STEP at a time, commit per STEP, and after each STEP stop and report the exact files changed.

STEP 0: DIAGNOSE (change nothing yet)

1. Start the dev server with `NEXT_PUBLIC_OVERDRIVE=true`. Open `/overdrive` (NOT `/`; the homepage keeps the old design until M5 on purpose). Report which file renders that route and list every component file it imports.
2. Grep `app/overdrive` and `components/overdrive` for these patterns and list every hit: `bg-gradient`, `shadow`, `#` hex colors in className/style, `rounded-full`, font classes, and imports of shared UI components from the old app. These hits are your deletion list for STEP 6.

STEP 1: FONTS

Create `app/fonts.ts` exactly:

```tsx
import { JetBrains_Mono, Press_Start_2P } from "next/font/google"

export const fontJbm = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "700"],
	variable: "--font-jbm",
	display: "swap",
})

export const fontPs2 = Press_Start_2P({
	subsets: ["latin"],
	weight: "400",
	variable: "--font-ps2",
	display: "swap",
})
```

STEP 2: DESIGN TOKENS (Tailwind v4)

Add this block to `app/globals.css`. Do not edit any existing style in that file.

```css
@theme {
	/* surfaces */
	--color-bg-0: #0A0E14;
	--color-bg-1: #111623;
	--color-bg-2: #1A2030;
	--color-line: #232B3D;

	/* text */
	--color-text-hi: #E8ECF4;
	--color-text-mid: #9AA3B5;
	--color-text-dim: #4E576B;

	/* accents: one color = one meaning (green=active/success, pink=combo, violet=mult, yellow=money/score, red=danger, cyan=info/macro) */
	--color-acc-green: #3BF562;
	--color-acc-pink: #FF4D9D;
	--color-acc-violet: #9D6BFF;
	--color-acc-yellow: #FFC93B;
	--color-acc-red: #FF3B3B;
	--color-acc-cyan: #35D6E8;

	/* rarity */
	--color-rarity-common: #8A93A6;
	--color-rarity-uncommon: #3BF562;
	--color-rarity-rare: #9D6BFF;
	--color-rarity-legendary: #FFC93B;
	--color-rarity-macro: #35D6E8;

	/* fonts */
	--font-game: var(--font-jbm), "IBM Plex Mono", monospace;
	--font-pixel: var(--font-ps2), monospace;
}
```

Tailwind v4 auto-generates utilities from these tokens: `bg-bg-0`, `text-text-mid`, `border-line`, `text-acc-yellow`, `border-rarity-rare`, `font-game`, `font-pixel`. Use ONLY these for color/font. Any raw hex in a component after this step is a bug.

STEP 3: OVERDRIVE SHELL

Create or replace `app/overdrive/layout.tsx`:

```tsx
import { fontJbm, fontPs2 } from "@/app/fonts"

export default function OverdriveLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className={`${fontJbm.variable} ${fontPs2.variable} min-h-dvh bg-bg-0 font-game text-text-hi antialiased`}>
			{children}
		</div>
	)
}
```

Rule: no element below this shell sets another page background. The gameplay background is plain `bg-bg-0`, no texture, no gradient.

STEP 4: UI PRIMITIVES

Create `components/overdrive/ui.tsx`. Use these implementations as-is:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from "react"

export type Rarity = "common" | "uncommon" | "rare" | "legendary" | "macro"

// Static class maps because Tailwind cannot see dynamic strings like `border-rarity-${rarity}`.
export const RARITY_BORDER: Record<Rarity, string> = {
	common: "border-rarity-common",
	uncommon: "border-rarity-uncommon",
	rare: "border-rarity-rare",
	legendary: "border-rarity-legendary",
	macro: "border-rarity-macro",
}

export const RARITY_BADGE: Record<Rarity, string> = {
	common: "text-rarity-common bg-rarity-common/12",
	uncommon: "text-rarity-uncommon bg-rarity-uncommon/12",
	rare: "text-rarity-rare bg-rarity-rare/12",
	legendary: "text-rarity-legendary bg-rarity-legendary/12",
	macro: "text-rarity-macro bg-rarity-macro/12",
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			className={`h-11 rounded-lg bg-acc-green px-6 text-sm font-bold uppercase tracking-[0.08em] text-bg-0 hover:brightness-110 disabled:opacity-40 ${props.className ?? ""}`}
		/>
	)
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			className={`h-11 rounded-lg border border-line px-6 text-sm font-bold uppercase tracking-[0.08em] text-text-hi hover:bg-bg-2 ${props.className ?? ""}`}
		/>
	)
}

export function HudLabel({ children }: { children: ReactNode }) {
	return <div className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">{children}</div>
}

export function QuotaBar({ current, target }: { current: number; target: number }) {
	const pct = Math.min(current / target, 1)
	return (
		<div className="h-3 overflow-hidden rounded-md bg-bg-2">
			<div
				className="h-full origin-left rounded-md bg-acc-green transition-transform duration-200 ease-out"
				style={{ transform: `scaleX(${pct})` }}
			/>
		</div>
	)
}

export function KeycapSlot({ rarity, children }: { rarity?: Rarity; children?: ReactNode }) {
	if (!rarity) return <div className="size-16 rounded-lg border-2 border-dashed border-line" />
	return (
		<div className={`flex size-16 items-center justify-center rounded-lg border-2 bg-bg-1 ${RARITY_BORDER[rarity]}`}>
			{children}
		</div>
	)
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
	return (
		<span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${RARITY_BADGE[rarity]}`}>{rarity}</span>
	)
}
```

STEP 5: SCREENS

5a. Main menu (per design.md §5.4). Structure:

```tsx
<main className="flex min-h-dvh flex-col items-center justify-center gap-12">
	<div className="text-center">
		<h1 className="font-pixel text-2xl">TYPECADE</h1>
		<p className="mt-4 text-base text-text-mid">
			Type to attack. Craft your Keycap build. Beat quotas that never stop rising.
		</p>
	</div>
	<div className="flex w-72 flex-col gap-3">
		<PrimaryButton className="h-14">Play</PrimaryButton>
		<GhostButton>Daily Seed</GhostButton>
		<GhostButton>Practice</GhostButton>
		<a className="mt-2 text-center text-sm text-text-mid hover:text-text-hi" href="/overdrive/leaderboard">
			Leaderboard
		</a>
	</div>
</main>
```

No carousel, no banner, no modal on load.

5b. Gameplay HUD (DOM version until the PixiJS milestone; layout per design.md §5.1):

```tsx
<main className="grid min-h-dvh grid-rows-[64px_32px_1fr_96px_32px] gap-y-2 px-6">
	{/* Row 1: top bar h-64px */}
	<header className="flex items-center justify-between">
		<span className="font-pixel text-base">TYPECADE</span>
		<span className="text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">Zone 3 - Rush</span>
		<span className="text-2xl font-bold tabular-nums">00:24</span>
		<span className="text-2xl font-bold tabular-nums text-acc-yellow">42</span>
	</header>
	{/* Row 2: quota bar h-32px */}
	<div className="flex items-center gap-3">
		<HudLabel>Quota</HudLabel>
		<div className="flex-1"><QuotaBar current={2450} target={3000} /></div>
		<span className="text-sm tabular-nums text-text-mid">2,450 / 3,000</span>
	</div>
	{/* Row 3: combo/mult left, word stream center, base/score right */}
	<section className="grid grid-cols-[160px_1fr_160px] items-center">
		<div className="flex flex-col gap-6">
			<div><HudLabel>Combo</HudLabel><div className="text-2xl font-bold text-acc-pink tabular-nums">23</div></div>
			<div><HudLabel>Mult</HudLabel><div className="text-2xl font-bold text-acc-violet tabular-nums">x4</div></div>
		</div>
		<div className="flex flex-col items-center gap-4 text-center">
			<p className="text-[28px] text-text-dim">galaxy keyboard synergy arcade photon</p>
			<p className="text-5xl font-bold text-acc-green">performance</p>
			<p className="text-[28px] text-text-dim">stability algorithm quantum victory</p>
		</div>
		<div className="flex flex-col items-end gap-6 text-right">
			<div><HudLabel>Base</HudLabel><div className="text-2xl font-bold tabular-nums">312</div></div>
			<div><HudLabel>Score</HudLabel><div className="text-2xl font-bold text-acc-yellow tabular-nums">3,984</div></div>
		</div>
	</section>
	{/* Row 4: keycap row h-96px */}
	<div className="flex items-center justify-center gap-3">{/* 5x <KeycapSlot/> */}</div>
	{/* Row 5: footer h-32px */}
	<footer className="flex items-center justify-between text-sm text-text-mid">
		<span>100% accuracy</span>
		<span>60 wpm</span>
	</footer>
</main>
```

Bind the placeholder values to the real engine state; keep every class as written. Typed letters inside the active word: `text-text-hi`; untyped remainder inherits `text-acc-green`.

5c. Shop card recipe (per §5.2): card = `w-40 rounded-lg border-2 bg-bg-1 p-3` + `RARITY_BORDER[rarity]`; name = `text-base font-bold`; type/rarity line = `text-sm text-text-mid`; price = `text-acc-yellow tabular-nums` bottom right; unaffordable card = add `opacity-40` and price becomes `text-acc-red`. Reroll = GhostButton, Leave Shop = PrimaryButton.

5d. Run over (per §5.3): container = `mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-6`; title = `font-pixel text-2xl text-acc-red` (win: `text-acc-green`, text "FIRMWARE CLEAR"); score = `text-[64px] font-bold text-acc-yellow tabular-nums`; stats table rows = `text-base`; tokens earned = `text-acc-yellow`; then build icon row; then Share Score (Primary) above Main Menu (Ghost), `gap-3`.

STEP 6: DELETE THE OLD STYLE

Go through the STEP 0 deletion list. Inside the overdrive scope, remove or replace every: gradient, shadow (`shadow-*` is banned in gameplay; elevation = `border border-line`), raw hex color, `rounded-full` (allowed only on RarityBadge), non-token font, emoji in UI, and old shared components. Replace with STEP 4 primitives or token classes.

STEP 7: VERIFY (report results, with screenshots if you can)

1. `/overdrive` background computes to `#0A0E14` (check with DevTools eyedropper), body text renders in JetBrains Mono, the only Press Start 2P on each screen is the wordmark/screen title.
2. Grep check returns zero hits for: `bg-gradient`, `shadow-`, raw `#` hex in overdrive components.
3. Numbers (timer, score, combo) use `tabular-nums` and do not shift width while counting.
4. `/practice` (old app) is pixel-identical to before this session: no shared file it uses was modified.
5. List every file created/changed with one line each on what changed.

---

# Prompt 6: M4 Competitive (D-1, D-2, D-3, A-1, A-2)

```markdown
Read CLAUDE.md. Read docs/prd.md EPIC 5 (D-1..D-3), EPIC 6 (A-1, A-2), §4 (data model), and docs/design.md §5.5 (share card).

Goal of M4: daily seed + leaderboard + share card working end to end. Build in this order:

1. **A-1 local-first**: run history, settings, and unlock state in localStorage with a versioned schema. Everything must work logged out.
2. **Supabase schema**: migrations for profiles, runs, daily_seeds, leaderboard_daily, replays exactly per prd.md §4, including RLS policies (users insert only their own runs; leaderboards public-read). Show me the SQL before applying.
3. **D-1 daily seed**: one global seed per UTC day (daily_seeds row generated deterministically from the date + server secret). /overdrive daily mode: fetch today's seed, one recorded attempt per user per day enforced server-side. Menu shows the reset countdown per design.md §5.4.
4. **D-2 leaderboards**: daily (from daily runs) + all-time endless. Server route validates payload shape and plausibility bounds before insert. Anonymous runs never enter leaderboards (prd.md §6).
5. **A-2 login + migration**: Supabase Auth; on first login, migrate localStorage history to the account (idempotent, no duplicates on re-login).
6. **D-3 share card**: OG image route per design.md §5.5 (1200x630, exact layout) using satori/@vercel/og on Workers, plus a share URL `/r/[runId]` whose OG tags serve the card, plus a copy-link/share button on Run Over.

Tests: seed determinism (same date = same seed), one-attempt enforcement, RLS (a user cannot insert a run for another user), localStorage migration idempotency. Playwright smoke: finish a short run, see it on the leaderboard, share URL renders the card.

Rules: no Ghost Race, no replay upload, no anti-cheat beyond plausibility bounds (those are M6). Plan first.
```

---

# Prompt 7: M5 Launch prep

```markdown
Read CLAUDE.md and docs/prd.md §5 (M5).

Launch checklist session. Work through:

1. **Copy audit**: scan the entire app for non-English strings and any item name/description that drifts from docs/game-design.md §5-6. Output a diff-style list first, then fix.
2. **Homepage swap**: /overdrive becomes the homepage experience; the old typing test moves to /practice with redirects. Landing = wordmark, one-liner from game-design.md §1, PLAY button. Max 2 clicks to typing (design.md §5.4).
3. **SEO/OG**: titles, descriptions, OG images for /, /practice, /leaderboard; sitemap; the old typing-test SEO pages must keep their rankings (no broken URLs, 301s where paths change).
4. **Flag flip plan**: list exactly what changes to open NEXT_PUBLIC_OVERDRIVE to production, and what to monitor in telemetry the first 48h (per-zone death rate funnel, run_start > run_end completion, share rate).
5. **Lighthouse pass** on / and /overdrive: performance and accessibility ≥ 90, no layout shift from font loading.

Do not add features in this session.
```

---

# Prompt 8: M6 Post-launch (D-4, D-5, D-6, A-3)

```markdown
Read CLAUDE.md. Read docs/prd.md EPIC 5 (D-4..D-6), EPIC 6 (A-3), §6 (risks), and docs/game-design.md §15 Phase 1.

Build in this order:

1. **D-4 replay recording**: capture keystroke timestamps per run (delta-encoded, gzipped, a few KB per prd.md §6), upload to storage for logged-in leaderboard runs, referenced from the replays table.
2. **D-6 anti-cheat**: server-side replay validation before a leaderboard entry is marked verified: inhuman inter-keystroke intervals, impossible WPM spikes, replay score recomputed with the headless engine (same code, per prd.md §3 architecture rule) and compared to the submitted score.
3. **D-5 Ghost Race**: race against a replay (another player's or your own PB) — ghost progress rendered as a second quota marker + ghost WPM. Challenge Link: /challenge/[runId] carrying seed + target score, playable logged out.
4. **A-3 login prompt**: after the 3rd finished run, show one non-blocking prompt ("Save your history & enter the leaderboard"), never before, never repeating more than once per week if dismissed.

Tests: replay round-trip (record > encode > decode > identical event stream), recomputed-score mismatch flags the run, challenge link reproduces identical run conditions.
```

---

# Session hygiene (applies to every prompt above)

- One milestone per session. If the agent finishes early, end the session; do not let it "improve" other areas.
- If the agent proposes changing a number (quota, price, duration), the answer is: change the doc first, then the constants file. Never accept silent tuning in code.
- Keep a running `docs/decisions.md` note per session: what was built, what was deferred, open questions for the next session.