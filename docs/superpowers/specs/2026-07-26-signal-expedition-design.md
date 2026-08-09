# Signal Expedition redesign

## Status

Approved direction: evolve the existing Overdrive run into a continuous Signal Expedition. This is not a separate mode.

This spec defines the intended experience and implementation boundaries. Before implementation, the accepted values and contracts must be promoted into `docs/game-design.md`, `docs/prd.md`, and `docs/design.md`.

## Problem

The current build resolves the typing rules, beginner protection, scoring, items, and shop flow, but the arena presentation still reads as a static duel:

- The Warden repeats one forward travel arc, which makes the body look weightless and the gait look injured.
- One active target dominates the right side while the two staged targets are too dim and too close together to register as a formation.
- A stage takes place against one master image with an eight-pixel drift. The background reads as wallpaper instead of a location.
- Attack selection does not communicate the typed signal, current lane, enemy role, combo state, or owned build.
- Character lighting, ground contact, foreground occlusion, and atmospheric depth do not bind the rigs to the environment.
- Visual effects acknowledge input but repeat the same spatial pattern.
- The HUD can render duplicate React keys when two copies of the same Keycap occupy different slots. Two inactive Sprinters both receive `sprinter-0`.

## Product goal

Typing must remain the only combat control. Each accepted key must produce a readable action, while a complete word must feel like a short encounter with a beginning, escalation, and release.

The finished stage should feel like forward travel through a hostile signal trench. The player should see where the Warden came from, what it is fighting, and what area it breaches next.

The presentation may learn from three principles demonstrated by action typing games:

- Reward each accepted keystroke.
- Protect the earliest beginner route from failure.
- Change movement according to the combat situation.

Typecade keeps a separate identity through deterministic word choreography, roguelike Keycap builds, score routing, quota pressure, and a mechanical cyber-industrial world. It does not add platforming controls, sword loadouts, elemental lore, or letter-shaped enemies.

## Experience contract

### Stage journey

Every stage uses one continuous virtual scene with three encounter beats:

1. **Ingress**: the Warden enters the combat deck and meets the first formation.
2. **Relay breach**: machinery opens, the camera tracks forward, and enemy pressure rises.
3. **Extraction**: foreground structures pass the camera, the final formation enters, and the quota breach opens the route to the Shop.

Stage progress comes from `score / quota`, with `targetOrdinal` as a deterministic tie breaker. It never comes from measured WPM.

The beats begin at these quota ratios:

| Beat | Ratio |
| --- | ---: |
| Ingress | 0 |
| Relay breach | 0.4 |
| Extraction | 0.75 |

A fast player may cross a beat in one word. The transition catches up without locking input. A beginner may remain in one beat while Focus Pause protects search time.

### Visible formation

The arena must show four readable combat silhouettes whenever the viewport can support them:

- Keystone Warden
- active enemy
- upcoming enemy
- distant reinforcement

Compact layouts may crop the distant reinforcement, but its entry telegraph must remain visible.

The active enemy owns the integrity rail and attack telegraph. Upcoming enemies continue locomotion and react to nearby impacts. They do not receive the active word.

Upcoming targets use enough contrast to register as characters:

| Role | Desktop alpha | Compact alpha |
| --- | ---: | ---: |
| Active | 1 | 1 |
| Upcoming | 0.54 | 0.48 |
| Reinforcement | 0.3 | 0.26 |

Each stage family contains three silhouettes inside one resident atlas. Variants share a mechanical lineage but change mass, attachments, locomotion, and attack anticipation:

| Stage | Active family variants |
| --- | --- |
| Warm-up | Packet Stalker, Cache Hound, Relay Ram |
| Rush | Needle Wraith, Vector Mantis, Spine Courier |
| Glitch | Null Crown, Crown Hand, Void Shard |

Zone 1 introduces one family at a time. Zone 2 may alternate variants within a family. Zone 3 and later may use deterministic mixed formations when the texture budget permits. A stage never loads more than the Warden atlas and one enemy-family atlas.

## Typing-driven action grammar

An accepted character selects an action through pure deterministic inputs:

- current word length
- accepted character index
- target lane
- target role
- combo tier
- Overdrive state
- triggered item IDs

The selection function receives no rendering objects and uses no random source. Equal state produces equal choreography.

### Warden verbs

| Verb | Use | Body motion | Camera response |
| --- | --- | --- | --- |
| Cannon burst | first contact, single-letter training | planted feet, shoulder compression, cannon recoil | no translation |
| Rail step | early characters in short signals | heel-to-toe stride with one planted foot | short horizontal track |
| Tether pull | target is high or far | braced rear foot, articulated cable, target pulled toward contact | small push-in |
| Breach slide | mid-word lane change | low grounded slide, foreground sparks, no vertical arc | lateral track |
| Recoil vault | one authored accent in long words | cannon recoil lifts the Warden, one landing pose | short rise and settle |
| Crossfire pivot | target promotes during a chain | torso and feet pivot before the cannon changes side | snap-pan to the promoted target |
| Execution | final accepted character | authored contact, recoil, follow-through, recovery | impact hold then settle |
| Overdrive breach | explicit or protected auto release | full-arena traversal with afterimage and impact column | push-in, controlled shake, snap return |

Recoil vault is the only ordinary airborne verb. It may appear at most once in a word of seven or more characters. The current repeated jump arc is removed.

### Chain rules

- A single-letter target uses Cannon burst and resolves immediately.
- Two and three-character signals use Cannon burst, Rail step, then Execution.
- Four to six-character words use two grounded verbs before Execution.
- Seven-character and longer words may include Tether pull or one Recoil vault.
- Consecutive accepted keys within 140ms cancel recovery into the next verb.
- A pause longer than 400ms returns the Warden to a planted ready pose without resetting word progress.
- A typo uses a recoil or block reaction. It never launches the Warden.
- Space resolves the current spatial setup. It does not teleport the Warden home before contact.
- Enter at full charge overrides the ordinary finisher with Overdrive breach.

### Grounding requirements

- At least one foot stays within four pixels of the authored ground line during Cannon burst, Rail step, Breach slide, and Crossfire pivot.
- Root translation uses a ground path. Vertical motion comes from leg compression and torso motion.
- A foot may release only after the opposite foot has planted.
- The contact shadow follows the weighted foot and changes width during compression.
- Returning home uses a backward step or recoil settle. It never mirrors the attack arc.

## Camera direction

A `CameraDirector` owns camera state. Character rigs never move the root stage directly.

The camera combines four channels:

1. **Journey track** follows the current encounter beat.
2. **Combat track** keeps the active formation readable.
3. **Impact impulse** handles one short push, pan, or shake.
4. **Accessibility filter** removes shake and reduces travel.

Camera cues:

| Event | Cue |
| --- | --- |
| Beat change | 600ms track to the next set-piece |
| Rail step | 40px maximum lateral follow |
| Tether pull | 2% push-in |
| Crossfire pivot | 120ms pan, 180ms settle |
| Execution | 50ms hold, 180ms settle |
| Overdrive | 3% push-in plus existing 3px shake limit |
| Aegis rescue | camera braces toward the Warden, then releases |
| Stage clear | track through the opened extraction route |

Camera travel uses transform only. The command rail and HUD stay in screen space and never inherit world movement.

## Living environment

### Layer kit

The single arena master is replaced by a coherent Signal Trench environment kit:

1. far sky and tower silhouettes
2. distant relay machinery
3. midground cables, doors, and signal conduits
4. battle deck and ground markings
5. foreground gantries, pipes, and debris
6. atmosphere, light spill, and particles

All layers use the same three-quarter camera, material roughness, cyan key light, magenta corruption light, and painted hard-surface treatment as the character renders.

The three encounter beats reuse one kit through composition rather than three unrelated backgrounds. New generated source assets must share one art bible and generation session. Prompts, generation IDs, source sheets, and licenses remain recorded in `CREDITS.md`.

### Continuous motion

- Far towers move at 0.08 of camera travel.
- Distant machinery moves at 0.2.
- Midground structures move at 0.45.
- The battle deck moves at 1.
- Foreground occluders move at 1.25 and may pass in front of feet or defeated enemies.
- Cable anchors sway within eight pixels.
- Vent haze crosses the deck in low-contrast bands.
- Relay lights use deterministic pulse sequences tied to the stage beat.
- Sparks emit from authored machinery points, not from arbitrary screen coordinates.
- Extraction opens a physical gate or relay aperture before the Shop transition.

Reduced motion keeps relay light changes, contact shadows, and atmosphere fades. It removes continuous parallax drift, camera impulses, loose particles, and cable sway.

### Character integration

Characters receive presentation-side integration layers:

- ground contact shadow aligned to the deck perspective
- cyan environment rim on the lower and target-facing edges
- stage accent reflected at low alpha on armor
- impact light projected onto the deck
- foreground haze that can cover the lowest part of a leg
- depth desaturation for upcoming and distant targets
- local debris emitted from contact points

The environment never tints the command rail or changes gameplay color meanings.

## Effects vocabulary

Large effects must explain an event. Ambient effects remain quiet.

### Accepted key

Each accepted key combines:

- one muzzle or movement anticipation
- one path effect
- one contact effect
- one enemy articulation
- one signal-node fracture

The path effect changes with the Warden verb:

| Verb | Path effect |
| --- | --- |
| Cannon burst | segmented bolt with one short muzzle cone |
| Rail step | deck sparks and a narrow speed wake |
| Tether pull | bracket-shaped cable segments that tighten on contact |
| Breach slide | floor scrape, forward dust wedge, low afterimage |
| Recoil vault | recoil ring, one air trail, landing dust |
| Crossfire pivot | targeting brackets that rotate toward the next lane |

### Word resolution

A clean word uses a class-specific defeat:

- Packet family breaks into relay plates and data sparks.
- Needle family splits along its spine and leaves a thin vector trail.
- Null family collapses inward before releasing fractured crown plates.

A dirty word phases the target out with red corruption noise and no victory burst.

### Combo escalation

Combo changes density and rhythm without hiding the active word:

| Combo | Presentation |
| --- | --- |
| 0 to 3 | base path and contact |
| 4 to 7 | one extra afterimage and denser contact fragments |
| 8 to 15 | violet secondary trail and environment beat light |
| 16 and above | thin screen edge current and class-specific defeat accent |

### Item signatures

Every MVP item keeps a unique 48px HUD acknowledgement and gains one combat signature:

| Item | Combat signature |
| --- | --- |
| WASD | four directional targeting brackets |
| Vowel Magnet | letters pull a small cyan orbit into the cannon |
| Longshot | elongated barrel trace and compressed impact |
| Sprinter | grounded green speed wake during the opening window |
| Second Wind | broken red trail rewinds into a yellow finisher |
| Copper Key | one token spark resolves toward the HUD |
| Home Row | deck key plates light in a horizontal sequence |
| Punctuator | punctuation glyph punches a sharp contact notch |
| Combo Battery | a pink shield segment absorbs the break |
| Overclock | cannon vents open and retain a stage-level heat light |
| Double Tap | a delayed second contact lands from the opposite angle |
| Snowball | persistent frost-white edge marks accumulate on armor |
| Interest Bank | stored token pips orbit the rear shoulder |
| Glass Keycap | a prism plane forms on proc and visibly fractures on loss |
| Vampire | a red return trail transfers from the target to the Warden |

Macro effects remain visually distinct from passive Keycaps and originate near the macro rail before entering the world.

## Architecture

### Headless contracts

Scoring, items, stage state, word selection, and RNG stay in pure TypeScript. The engine publishes state and presentation events. It does not know about cameras, rigs, particles, or stage layers.

New pure presentation selectors:

```ts
selectEncounterBeat(score, quota, targetOrdinal)
selectAttackVerb(word, characterIndex, lane, combo, overdriveReady, triggeredItemIds)
selectFormationVariant(formationSchedule, targetOrdinal)
```

The headless run creates and persists a visual formation schedule through its single seeded RNG instance when a stage starts. The schedule contains family variant IDs only and does not import rendering code. The presentation selector reads that schedule by target ordinal. Rendering code never creates randomness or calls `Math.random()`.

### Canvas boundaries

`CombatScene` coordinates five focused systems:

- `EnvironmentDirector`
- `CameraDirector`
- `FormationDirector`
- `CombatDirector`
- `CombatEffects`

Each director owns its Pixi container and exposes `resize`, `sync`, `handle`, `update`, and `destroy` where relevant.

`CombatDirector` no longer moves the stage or background. It publishes camera cues to `CameraDirector`.

### Stable React identity

Inventory slot identity uses the slot index, not the item ID or latest proc ID:

```ts
key={`keycap-slot-${index}`}
key={`macro-slot-${index}`}
```

Proc animation restarts through a child animation key or data attribute inside the stable slot. Duplicate items remain legal and never create duplicate React keys.

## Error handling

- Atlas validation reports the exact missing family, part, clip, or variant.
- A failed optional environment layer falls back to the matching base layer without pausing the run.
- A failed character atlas pauses the run and presents the existing retry screen.
- No runtime fallback may silently substitute a different enemy family.
- Development and production-browser tests treat React key warnings, Next.js errors, WebGL errors, unhandled rejections, and failed asset requests as failures.

## Performance budgets

- First playable stage compressed art remains at or below 5MB.
- One stage keeps the Warden atlas, one enemy-family atlas, and one environment kit resident.
- Estimated GPU texture memory remains at or below 64MB.
- Live effects remain capped at 200.
- Foreground occluders use pooled sprites.
- Environment lights use graphics or pre-baked masks. No per-frame blur filter is allowed.
- Median frame rate stays at or above 55 fps on the project low-end profile.

When the full layer kit cannot meet the texture budget, the far layer uses a half-resolution texture before character quality is reduced.

## Accessibility

- Reduced motion preserves combat state changes and removes travel that can cause discomfort.
- Camera motion never moves the active word, caret, quota, timer, or item rail.
- Screen shake remains limited to Stage clear and Overdrive.
- Effects never cover the active word for more than one frame.
- The active enemy remains identifiable without color through silhouette, scale, lane, and integrity rail.
- Focus Pause cancels enemy anticipation, keeps environment ambience quiet, and holds a planted Warden pose.

## Testing strategy

### Regression test for duplicate keys

Create an E2E fixture with two Sprinter Keycaps and two identical Macros in separate slots. Enter gameplay and trigger each item. The test fails on any console error containing:

- `same key`
- `Encountered two children`
- `unique key`

The test must fail against the current HUD before the key fix is implemented.

### Pure selector tests

Unit tests cover:

- exact encounter beat boundaries
- deterministic attack verb selection
- no Recoil vault in words shorter than seven characters
- at most one Recoil vault per long word
- deterministic formation variants for equal seed and ordinal
- valid family variants for each stage

### Motion contract tests

Rig tests sample each grounded clip and assert:

- at least one foot remains within four pixels of the ground line
- no part produces a non-finite transform
- contact frames occur inside the clip duration
- recovery returns to a planted state

### Browser tests

Playwright covers:

- beginner one-key combat through Focus Pause
- short signal and Space submission
- long-word attack variation
- formation promotion without input lock
- all three encounter beats
- stage-class variant changes
- reduced motion
- 390x844, 820x1180, 1366x768, 1440x900, and 1920x1080 layouts
- no console error or warning during menu, stage, clear ribbon, Shop, resume, and Run Over
- no failed local asset request
- no `/overdrive` 404
- existing Practice route remains unchanged

### Release gate

Run these checks after the final code change:

1. rig and environment asset validators
2. full Vitest suite
3. lint
4. clean Next.js production build
5. deterministic beginner and balance simulation
6. full Playwright suite against the production build
7. manual live inspection of Ingress, Relay breach, Extraction, Shop, and compact layout
8. browser console review with zero React, Next.js, asset, WebGL, or promise errors

A successful development build alone does not pass the gate.

## Acceptance criteria

- No React duplicate-key warning can be produced by duplicate inventory items.
- Every accepted key starts a visible action within 50ms.
- The Warden uses at least four ordinary attack verbs during a representative six-stage route.
- Ordinary attacks remain grounded except for the authored long-word Recoil vault.
- Four combat silhouettes are readable on desktop and three remain readable on compact layouts.
- A stage visibly travels through Ingress, Relay breach, and Extraction.
- The environment contains independent far, mid, ground, foreground, atmosphere, and light motion.
- Characters show contact shadows, environment rim light, impact light, depth haze, and foreground occlusion.
- Packet, Needle, and Null families each expose three silhouette variants within their family atlas.
- Item procs change combat presentation and remain attributable in the HUD.
- The active word remains the highest-contrast element during the largest effect.
- Beginner protection and canonical scoring stay unchanged.
- Existing Practice behavior stays unchanged.
- The production build and production-browser E2E complete with zero console errors.

## Rejected approaches

### Multi-room arena

Room cuts would add variety but preserve the current stop-start rhythm. The player would still read each room as a static duel.

### Separate Expedition mode

A second mode would duplicate balancing, persistence, telemetry, onboarding, and test coverage. It would split attention before Overdrive itself reaches the intended quality.

### Continuous free platforming

Movement keys would compete with typing input and copy the reference game's control language. Typecade instead derives movement from the typed word and build state.
