# Overdrive Combat and Run Flow Redesign

Status: approved direction  
Date: 2026-07-26  
Scope: Overdrive MVP presentation, stage flow, shop flow, Overdrive input, and item feedback

## 1. Problem

The current build exposes the scoring engine through a presentation that feels detached from player input.

- Each character uses eight unrelated pose images. Texture swaps create visible changes in anatomy, perspective, and scale.
- The renderer moves one sprite through a 180 ms attack. It has no articulated joints, contact continuity, locomotion cycle, or follow-through.
- One enemy occupies the arena. The next target appears after the current target resolves, so the field has no visible pressure or spatial variation.
- Stage clear replaces gameplay with a long result page. The player must scroll to a button, enter the shop, then use another button to start the next stage.
- Item effects change score, time, or protection, but most triggers share one text label and one slot flash.
- Several UI strings use promotional filler. Some rendered separators and multiplication signs contain encoding corruption.
- Overdrive consumes itself on the next clean submission. The player cannot save it for a high-value item trigger.

The redesign must make each accepted character produce a readable combat action, preserve the beginner route, and remove navigation friction between stages.

## 2. Goals

1. Show input response within 50 ms and a readable contact frame within 90 ms.
2. Animate the Warden and all three enemy classes with continuous articulated motion at 60 fps.
3. Keep the next two enemies visible without reducing active-word contrast.
4. Move from stage clear to the shop without scrolling or a required pointer click.
5. Let the player operate the shop and start the next stage from the keyboard.
6. Give every MVP Keycap and Macro a distinct visual response.
7. Give Zone 3 and later players control over Overdrive release.
8. Preserve deterministic engine behavior, the 1 to 13 WPM route, and the fixed MVP item set.
9. Remove corrupted characters, decorative separators, filler, and paragraph-length instructions from the active run flow.

## 3. Non-goals

- Live 3D rendering
- A new rendering framework
- New Keycaps, Macros, Glitches, Firmware, cosmetics, or meta-progression
- A second health system
- Hidden WPM-based quota scaling
- Changes to the Base and Mult formula
- Full sentence mode

## 4. Approved visual architecture

### 4.1 Modular 2D rigs from 3D-style renders

The game will replace full-body pose swapping with articulated 2D rigs built from coherent, cel-shaded 3D-style source art.

The Warden rig will contain 14 to 18 parts:

- torso
- pelvis
- head
- visor
- near and far shoulder
- near and far upper arm
- near and far forearm
- cannon barrel
- cannon core
- near and far thigh
- near and far shin
- near and far foot

Enemy rigs may use fewer parts when their silhouette does not require humanoid articulation. Packet Stalker needs articulated legs and jaw plates. Needle Wraith needs a segmented spine, blade arms, and trailing fins. Null Crown needs a floating core, crown plates, arms, and cloak fragments.

Each source character uses one orthographic three-quarter camera, one light direction, one material palette, and one ground line. The source pipeline produces:

- a front three-quarter identity render
- a side-facing neutral rig sheet
- separated body-part sheets with clear padding
- pivot metadata
- a runtime texture atlas

Source images remain versioned under `public/overdrive/art/source/`. Runtime atlases live under `public/overdrive/art/rigs/`. `CREDITS.md` records the generation prompt, source identifier, local processing, and license or provider terms.

PNG remains the editable source format. Runtime atlases may use alpha WebP after a browser compatibility check. The first playable stage may download at most 5 MB of compressed combat art. The renderer loads the Warden, arena, and current stage enemy. It does not load all enemy atlases at startup.

### 4.2 Animation clips

The Warden ships with these clips:

- `idle`
- `ready`
- `chain-1`
- `chain-2`
- `chain-3`
- `dash`
- `execute`
- `block`
- `hurt`
- `recover`
- `overdrive`

Each enemy ships with:

- `locomotion`
- `idle`
- `anticipation`
- `attack`
- `hit`
- `defeat`
- `special`

Each clip contains 8 to 12 authored key poses when the action requires a full-body change. The runtime interpolates transforms at the renderer frame rate. Idle clips use breathing, weight transfer, visor tracking, weapon settling, cable drag, or plate movement. A vertical bob on a full-body image does not qualify as an idle animation.

The animation controller uses this priority:

1. Overdrive, Aegis rescue, and defeat
2. hit, block, execute, and enemy attack
3. chain attack and locomotion
4. ready and idle

An accepted character may cancel the recovery section of a chain clip. It may not skip anticipation and contact on the first strike of a word. The controller keeps at most two pending contact events. Faster input collapses older recovery motion instead of delaying the next word.

### 4.3 Combat staging

The arena shows three target positions:

- one active enemy at full gameplay contrast
- one upcoming enemy at low contrast
- one distant upcoming enemy as a silhouette

Only the active enemy owns signal nodes. Upcoming enemies cannot overlap the command rail or imitate an attack telegraph.

Target lanes follow a fixed choreography table indexed by the run's persisted target ordinal. The renderer uses no `Math.random()`. A refresh restores the target ordinal and produces the same lane sequence.

Accepted characters cycle through `chain-1`, `chain-2`, and `chain-3`. The Warden advances through home, mid-field, and contact positions. Long words can extend the chain without returning home. Submission triggers `execute`, `recover`, or Overdrive. The next target becomes typeable before the previous defeat clip finishes.

## 5. Input and combat rhythm

### 5.1 Accepted characters

An accepted character performs these steps:

1. The command rail updates with no transition.
2. The Warden starts or continues a chain clip.
3. A contact frame breaks the matching signal node.
4. The active enemy plays a directional hit reaction.
5. The renderer emits the item-specific layer when a character trigger applies.

The command rail and engine accept the next key without waiting for animation.

### 5.2 Word submission

Zone 1 keeps automatic execution. Zone 2 keeps Space execution and automatic Overdrive release. These zones retain Focus Pause and Aegis protection.

Zone 3 and later use two clean submission actions when charge reaches 100:

- Space submits the word without consuming Overdrive.
- Enter submits the word with the x2 Overdrive final multiplier and resets charge.

Enter does nothing before the current word is complete. A dirty word may submit through Space but cannot consume Overdrive. Charge remains run-persistent.

At full charge, the command rail displays `SPACE: EXECUTE` and `ENTER: OVERDRIVE`. Equipped Keycaps that will trigger on the current clean word receive a compact armed marker. This preview uses the same pure condition helpers as scoring and does not run item side effects.

The manual release rule requires updates to `docs/game-design.md`, `docs/prd.md`, and `docs/design.md` before engine code changes.

## 6. Stage clear and shop flow

### 6.1 Stage clear

The normal clear path keeps the gameplay canvas mounted.

1. The final hit applies 50 ms hitstop.
2. A compact result ribbon appears over the arena.
3. The ribbon shows stage score, Tokens earned, accuracy, and the strongest item contribution.
4. The shop opens after 900 ms.
5. Enter skips the remaining ribbon time.

The result ribbon contains no recommendation paragraph. The shop retains a compact previous-stage summary so a player can inspect the result after the transition.

The full Stage Result screen leaves the normal run path. It may remain as a debug or accessibility detail view, but no run requires it.

### 6.2 Shop

The shop must fit one viewport at 390 x 844, 820 x 1180, 1366 x 768, 1440 x 900, and 1920 x 1080. It contains:

- a compact previous-stage strip
- two Keycap offers and one Macro offer
- current Tokens and projected Interest
- one-row active build rail
- next stage and Quota
- a fixed deploy action

Cards show the exact effect, price, trigger, and capacity state. Additional explanation appears on focus or hover and does not change layout height.

Keyboard controls:

- 1 buys the first Keycap offer
- 2 buys the second Keycap offer
- 3 buys the Macro offer
- R rerolls
- Tab moves through offers, build slots, and sell actions
- Enter deploys into the next stage when a purchase control does not hold focus

Mouse and touch controls remain available. Shortcuts never fire outside the shop.

Buying an item moves its icon into the build rail and plays a short preview of its proc grammar. The preview must not block further input.

## 7. Item presentation grammar

The engine continues to emit `item_triggered` and `macro_used`. Presentation maps each exact item ID to a visual preset, audio layer, HUD response, and purchase preview.

| Item | Runtime acknowledgement |
| --- | --- |
| WASD | four-direction cut mark and cannon recoil |
| Vowel Magnet | vowel nodes arc into the cannon core |
| Longshot | extended sightline and long-range impact ring |
| Sprinter | Warden afterimage and leg-drive trail during its active window |
| Second Wind | broken combo line reconnects into a three-hit score pulse |
| Copper Key | one physical Token ejects toward the Token HUD |
| Home Row | a nine-key floor pattern rises under the Warden |
| Punctuator | punctuation-shaped impact fragments |
| Combo Battery | a battery cell discharges into the Mult shield |
| Overclock | cannon vents open and the Mult rail gains a stepped gear pulse |
| Double Tap | two authored contact frames land on the same target |
| Snowball | one persistent core segment lights after a perfect stage |
| Interest Bank | the shop Token stack gains a capped vault indicator |
| Glass Keycap | glass armor covers the cannon core and fractures on loss |
| Vampire | a red time strand feeds the protected Mult rail |
| Escape | the Glitch layer tears away from the arena |
| Time Freeze | the timer receives a cyan stop-frame ring |
| Quota Slash | a diagonal cut removes the exact quota amount |
| Insurance | a single-use shield marker attaches to the command rail |

These effects use the canonical color meanings. They do not add permanent glow to the interface. Audio uses layered synthesis variants rather than one large sound file per item.

The item slot still flashes for 150 ms. It acts as a locator, while the signature effect explains what happened.

## 8. Copy and encoding rules

Functional labels may use uppercase where the design system requires it. Promotional headings and explanatory filler leave the active run.

Examples:

- `REWIRE YOUR BUILD` is removed.
- `NEXT READ` is removed.
- `Convert the lead into a stronger build` is removed.
- `SYNCING COMBAT LINK` becomes `LOADING ARENA`.
- Result recommendations become measured facts such as `WASD +40 BASE` or `2 TYPOS`.

Active-flow copy may use one short sentence or one data line. Item tooltips may use two short lines. No UI copy uses repeated slash separators as decoration. The implementation must remove replacement glyphs and double-encoded punctuation from tracked source files.

## 9. Components and boundaries

The current `combat-scene.ts` and `visual-assets.ts` combine too many responsibilities. The redesign will split them into:

- `combat-scene.ts`: scene coordination and event routing
- `rig/rig-definition.ts`: rig and pivot types
- `rig/rig-instance.ts`: Pixi display hierarchy
- `animation/clip.ts`: clip data and interpolation
- `animation/controller.ts`: state priority, cancellation, and timing
- `choreography/target-lanes.ts`: deterministic lane schedules
- `choreography/combat-director.ts`: event-to-animation mapping
- `effects/item-presentation.ts`: item and Macro visual grammar
- `effects/combat-effects.ts`: shared impacts, smears, and particles
- `assets/combat-assets.ts`: atlas loading, validation, and fallback

The headless engine keeps scoring, progression, item effects, and run state. Rendering modules import engine types and subscribe to events. Engine modules never import PixiJS, React, Zustand, DOM APIs, or presentation files.

The shop shortcut handler stays in the shop component. It calls the existing store API and does not duplicate economy rules.

## 10. Failure handling

- The stage ready gate remains visible until required atlases load.
- A failed enemy atlas uses a local silhouette fallback and keeps the run playable.
- A missing clip falls back to `ready` or `idle`, records a development warning, and does not crash the engine.
- An invalid pivot or atlas frame fails asset validation during the final verification pass.
- The renderer caps pending visual events so rapid input cannot create an unbounded animation backlog.
- Reduced motion keeps articulated pose changes and contact readability, while it disables shake, hitstop, particles, and background pulse.

## 11. Performance budgets

- 60 fps target on the existing low-end test device
- 200 live particles maximum
- two full character atlases resident during a stage
- 64 MB target GPU texture memory for arena, Warden, current enemy, and effects
- 5 MB maximum compressed combat art before the first stage becomes playable
- transform, rotation, scale, alpha, and tint animation only
- no per-frame texture creation
- no layout animation during gameplay

## 12. Validation and critique passes

Implementation will use separate critique passes before the final test run.

### Pass 1: silhouette and rig

- Parts keep one identity across all clips.
- Feet remain grounded unless the clip includes a jump or dash.
- Cannon, shoulder, and torso follow the same force direction.
- No chroma remnants, broken joints, or scale jumps remain.

### Pass 2: input response

- Slow typing shows complete attacks and recovery.
- Fast typing chains attacks without visual backlog.
- Every accepted character creates a visible contact.
- The caret remains stable.

### Pass 3: run flow

- Stage clear needs no scroll or pointer.
- The shop opens after the result ribbon.
- Shop actions and deploy work from keyboard.
- The next stage starts from its ready gate.

### Pass 4: item clarity

- Each owned item can be identified from its trigger response.
- Contribution values match engine events.
- Simultaneous procs remain readable and do not cover the active word.

### Pass 5: copy and layout

- Active-flow copy passes the project `stop-slop` review.
- No corrupted punctuation remains.
- All required viewports fit without overlap or required scrolling.

Full verification runs after these critique passes:

- Vitest engine and presentation tests
- deterministic balance simulation for 1, 5, 10, 12, 13, 20, 40, 60, and 90 WPM profiles
- ESLint
- TypeScript strict check
- production build
- Playwright E2E
- reduced-motion inspection
- desktop and compact visual inspection

## 13. Acceptance criteria

The redesign passes when:

1. A first-time 1 WPM player can complete Zones 1 and 2 without a lethal timeout.
2. A 40 to 50 WPM player can move through stage result and shop without scrolling or pointer input.
3. The Warden shows articulated idle, chain, execute, block, hurt, recover, and Overdrive clips.
4. Packet Stalker, Needle Wraith, and Null Crown show distinct locomotion, attack, hit, and defeat motion.
5. The next two enemies remain visible while the command rail stays the focal point.
6. Zone 3 and later players can save full Overdrive and release it with Enter.
7. Every MVP item and Macro has a distinct trigger acknowledgement.
8. The renderer remains responsive when input arrives faster than its animation recovery.
9. The normal run path contains no full-page Stage Result, required scroll, or required pointer click.
10. Final verification passes with no 404, missing asset, encoding corruption, test failure, type error, lint error, or production build error.
