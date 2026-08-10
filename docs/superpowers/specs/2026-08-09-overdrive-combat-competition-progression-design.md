# Overdrive Combat, Competition, and Progression Design

Date: 2026-08-09

Status: Proposed design approved in direction, pending document review

Scope: Overdrive combat feel, animation quality, score readability, run pacing, verified competition, and post-retention cosmetic progression

## 1. Decision

TYPECADE will use a combat-first release sequence:

1. Complete the M3 combat presentation and performance contract.
2. Complete the M4 Daily Seed, daily leaderboard, all-time endless leaderboard, share card, and account path.
3. Measure the soft-launch gates already defined in `docs/prd.md`.
4. Complete the M6 replay, anti-cheat, Ghost Race, Challenge Link, and deferred login prompt.
5. Add non-power account levels and play-earned cosmetics after the retention and performance gates pass.

Players must return because typing feels responsive, builds create readable score changes, and verified rivalry gives each run a target. Account progression can extend that loop after the game proves it.

## 2. Document authority

This document extends the approved direction in:

- `docs/game-design.md`
- `docs/prd.md`
- `docs/design.md`
- `docs/superpowers/specs/2026-07-26-overdrive-combat-flow-redesign-design.md`

The governing documents keep authority over formulas, item names, timings, visual tokens, MVP contents, and milestones. This document does not change those values.

Implementation must stop and amend the governing document first when a task requires any of these changes:

- score or Quota formulas
- stage clocks or zone count
- item behavior or price
- animation duration or easing
- MVP contents
- leaderboard attempt rules
- progression rewards that affect run power

## 3. Problem statement

The current source art establishes a strong Signal Siege identity. Runtime animation and feedback do not use its full potential.

The code audit and dual-agent critique found six product risks:

1. Accepted characters can lose or detach their visible contact beat when input exceeds the animation queue.
2. Warden and enemy clips animate too few body parts and poses to show grounded force.
3. Overdrive lacks parts of its canonical ready and release choreography.
4. Item triggers and score deltas can arrive in one perceptual burst, which hides build causality.
5. Per-keystroke Pixi object recreation can create frame-time spikes during the highest input load.
6. The current mobile menu puts Play below the first 390 by 844 viewport, while compact HUD text falls below the documented 14px minimum.

The Daily Seed, generic Board link, local personal best, and share image form a useful prototype. They do not yet provide a verified Overdrive competition loop. Account levels, cosmetic currency, and cosmetic inventory do not exist and remain outside the MVP.

## 4. Product principles

### 4.1 Input truth

Every accepted character must produce a visible, timestamped combat consequence. The renderer may shorten recovery or combine decorative effects. It may not discard the semantic contact.

One accepted character creates this causal chain:

`accepted input -> command rail acknowledgement -> Warden contact cue -> target reaction -> score or charge acknowledgement`

Each link must remain observable at high input rates. The engine stays authoritative. Presentation catches up without blocking the next character.

### 4.2 Build truth

Players must understand how their build changed the result. A clean submission presents one compact equation using the canonical order:

`Base -> Base multipliers -> additive Mult -> Mult multipliers -> final multipliers`

The presentation folds each item into the correct term, acknowledges the strongest contributions, and preserves the active word as the highest-priority visual element.

### 4.3 Physical causality

Character motion must communicate anticipation, force, contact, and recovery. Particles support those poses. They cannot replace pose clarity.

### 4.4 Competitive integrity

Leaderboards accept server-validated runs under an identified ruleset, RNG version, word-pool version, language, and client version. The UI labels local-only records as local.

### 4.5 Ethical retention

TYPECADE rewards mastery, exploration, rivalry, and expression. It excludes energy systems, loot boxes, streak loss, expiring power, hidden difficulty adjustment, paid run power, and paid leaderboard advantage.

## 5. Player experience goals

### 5.1 First run

Within the first minute, a new player should be able to explain:

- correct characters make the Warden attack
- accuracy protects the run
- completed clean words produce `Base x Mult`
- Overdrive creates a stronger submission

The player should acquire or use one build-defining item and notice its effect before the first run ends.

### 5.2 Developing player

After several runs, the player should recognize enemy class timing, compare item synergies, save or release Overdrive with intent, and identify the source of a large score change.

### 5.3 Expert player

An expert must be able to type at full speed without losing input acknowledgement. The verified leaderboard should distinguish score, zone, accuracy, WPM, build, and ruleset rather than treating WPM as the sole proof of skill.

### 5.4 Returning player

The returning player should have a clear target:

- beat a personal best
- resolve the Daily Seed
- improve a verified rank
- answer a Challenge Link
- complete an achievement
- earn a cosmetic after the progression gate opens

## 6. Combat experience design

### 6.1 Presentation event contract

The headless engine emits semantic events. A presentation scheduler converts them into timestamped visual and audio beats. The scheduler must preserve event identity, engine order, and target identity.

Events fall into three priority classes:

| Priority | Events | Queue rule |
| --- | --- | --- |
| Critical | accepted-character contact, typo, submission result, Aegis rescue, stage result, run result | never drop |
| Tactical | item trigger, Mult change, enemy pressure attack, Overdrive ready, Overdrive release | aggregate repeats; preserve cause and order |
| Decorative | ambient motes, secondary sparks, background pulse, afterimages | reduce or skip under load |

High input rates can cancel recovery and reduce decorative effects. They cannot create a hit without a visible contact frame or accept a character without a contact cue.

### 6.2 Keystone Warden motion grammar

The existing Warden rig remains the visual source. Full-body actions use 8-12 authored poses where required by the existing spec.

Each action assigns a job to these groups:

- support foot and rear foot
- pelvis and torso
- cannon shoulder and cannon arm
- brace arm
- head and visor
- cannon core and trailing parts

The Warden clips must express:

| Clip | Required physical story |
| --- | --- |
| `idle` | planted feet, slow weight transfer, torso breathing, visor tracking, cannon settling |
| `ready` | stance lowers, support foot commits, brace arm sets, cannon core locks |
| `chain-1` | short hip load, near contact, light recoil |
| `chain-2` | stronger torso rotation, opposite-foot pressure, medium recoil |
| `chain-3` | largest legal chain silhouette, cannon extension, fast settle path |
| `dash` | pelvis leads, torso follows, feet preserve ground direction |
| `execute` | full commitment through hips, brace, cannon, and head lag |
| `block` | shield-facing silhouette, loaded rear leg, protected head |
| `hurt` | force travels through the contact side, torso, pelvis, and recovery foot |
| `recover` | cannon settles first, then torso and stance return to readable neutral |
| `overdrive` | ready lock, arena-crossing release, recoil compression, snap-return settle |

The animation team must review silhouettes as flat black shapes before approving detail, effects, or interpolation.

### 6.3 Enemy class grammar

Each enemy must reveal its class through motion without labels.

#### Packet Stalker

- Low, grounded locomotion with articulated legs and jaw plates.
- Anticipation compresses toward the ground before a forward attack.
- Hit reactions transfer force through the nearest leg pair.
- Defeat breaks relay sections in a forward-to-back sequence.

#### Needle Wraith

- Spine-led flight with trailing fins and blade-arm lag.
- Anticipation straightens the spine and aligns one blade toward the Warden.
- Attack crosses distance faster than Packet while keeping a readable 240ms anticipation.
- Defeat loses directional control, folds, then dissolves.

#### Null Crown

- Floating core with deliberate crown-plate orbit and cloak-fragment drag.
- Anticipation pulls plates into a threatening single silhouette.
- Attack releases stored plate motion toward the Warden.
- Hit reactions disturb the orbit before the core reasserts control.
- Defeat collapses orbit, core, and cloak in separate beats.

### 6.4 Accepted-character rhythm

The existing design timing remains canonical:

- start the chain response within 50ms
- reach the contact frame within 90ms
- use 35ms anticipation, 55ms contact, and 90ms recover
- allow the next accepted character to cancel recovery

The scheduler must preserve one micro-contact per accepted character. At high WPM, it can blend root travel and compress recoveries into a continuous chain.

### 6.5 Word resolution

A clean submission creates:

1. an execution pose
2. a target defeat reaction
3. a compact score equation
4. the strongest item acknowledgement
5. a score popup traveling toward the score HUD

A dirty Zone 2 submission uses the Aegis Recovery presentation and canonical Base-only rule. A dirty Zone 3 or later submission communicates zero score and the correct Mult reset. Presentation cannot imply damage or score that the engine did not award.

### 6.6 Overdrive peak

Overdrive uses a causal build and release:

1. The command rail reaches 100 and locks.
2. The Warden enters `ready` and the cannon core locks.
3. The arena rim pulses once.
4. One rising audio cue establishes the release window.
5. The player triggers the canonical automatic or Enter release.
6. The 320ms attack crosses 78% of the Warden-to-target gap.
7. The impact column spans the canonical vertical area.
8. The camera applies no more than 3px shake.
9. The Warden settles while input control remains available.

Reduced motion removes shake, particles, and background pulse. It keeps poses, contact visibility, color changes, audio alternatives, and score acknowledgement.

### 6.7 Combo escalation

The current tiers in `docs/design.md` remain unchanged. The presentation treats them as an intensity ladder:

- Tier 1 preserves visual quiet.
- Tier 2 introduces the caret trail and the specified particle increase.
- Tier 3 changes particles to violet and adds the low-opacity background pulse.
- Tier 4 adds the thin edge glow and harmonic layer.

Critical word and enemy telegraphs keep visual priority at each tier. Combo break removes the tier effects without a farewell animation.

### 6.8 Item and Macro feedback

The existing item presentation presets remain the starting point. Each item needs four linked identifiers:

- a Typecade Glyph silhouette
- one canonical trigger label
- one presentation preset
- one contribution category for stage results

Simultaneous triggers use a deterministic presentation timeline. Repeated triggers aggregate into one label with a count. The active word remains unobscured, and the scheduler respects the three-popup limit.

## 7. Interface and onboarding design

### 7.1 Main menu

Desktop may preserve the arena composition and character identity. Mobile uses a short vertical action hierarchy.

The first mobile viewport must contain:

1. Typecade mark and `OVERDRIVE`
2. primary Play action
3. Daily Seed action or status
4. language and sound controls

Metrics and longer explanations move below the primary actions. The menu must not imply that local Board data represents the verified Overdrive leaderboard.

### 7.2 Gameplay HUD

The active word and caret keep first priority. Quota, timer, Base, Mult, score, Overdrive, and Aegis state use the documented positions and tokens.

Compact variants must keep the 14px text floor. State changes use text, shape, and motion or audio rather than color alone.

### 7.3 Score teaching

The first clean submission shows the complete compact equation. Later submissions may use the short form when no new factor appears. The full equation returns when:

- Base changes
- Mult changes
- an item triggers
- Overdrive applies
- a final multiplier applies

Stage results name the strongest item contribution and preserve enough context for the player to learn why the build worked.

### 7.4 Shop

The one-viewport shop keeps exact effect, trigger, price, rarity, capacity, active build, next Quota, and previous-stage contribution visible. Keyboard commands remain available.

Each card should answer three questions without a tooltip:

- What changes?
- When does it trigger?
- Which score term or protection system does it affect?

Tooltips can explain edge cases. They cannot carry the sole explanation of the effect.

## 8. Run pacing and balance validation

The canonical run remains 8 Zones by 3 stages with 75, 70, and 65 second ceilings and immediate clear at Quota.

The 10-15 minute target creates a pacing risk. The team must measure real clear times before changing any canonical value.

The balancing simulator and playtests must report:

- median and p90 run duration by skill profile
- time spent in combat, ribbons, and shops
- stage clear and failure rates by zone and stage type
- first item purchase time
- first clear build contribution
- Overdrive releases per stage
- dirty-word and combo-break distribution
- second-run starts by first-run outcome

The design review should examine whether 24 stages create a readable dramatic arc. Any proposal to change zone count, stage count, clocks, or Quotas requires an edit to `docs/game-design.md` before implementation.

## 9. Competitive loop

### 9.1 MVP and M4

M4 must deliver the requirements already marked P0:

- one UTC Daily Seed per language and ruleset
- one recorded daily attempt per authenticated user
- daily leaderboard
- all-time endless leaderboard
- local-first history
- share card
- login for cross-device history and leaderboard entry

Anonymous players can complete the mode and retain local history. The UI explains before a Daily attempt whether the run can enter the verified board.

### 9.2 Submission identity

Each leaderboard result identifies:

- user
- mode and seed
- date for Daily
- language
- ruleset version
- RNG version
- word-pool version
- client version
- final score and zone
- accuracy and WPM
- final build
- duration
- verification state

The server rejects results that lack the required identity or violate the one-attempt rule.

### 9.3 M6 verification and social play

M6 adds keystroke replay, interval validation, Ghost Race, and Challenge Link. The replay artifact supports competition and debugging.

Daily and all-time boards remain the canonical MVP boards. Friends and `Around You` views are post-MVP candidates. They require a GDD or PRD amendment before implementation.

### 9.4 Ranking presentation

Leaderboard rows should expose score, zone, accuracy, WPM, primary build identity, and verification. Rank is meaningful within the same ruleset, language, and board scope.

The run-over screen can show:

- verified rank or pending verification
- movement from the previous comparable result
- score required to pass the next visible rival
- replay, share, or challenge action when available

## 10. Post-retention account progression

### 10.1 Release gate

The team may start implementation after:

- M4 works end to end
- first-run resolution reaches at least 60%
- second-run rate reaches at least 35%
- D1 reaches at least 20%
- D7 reaches at least 8%
- share rate reaches at least 10%
- the low-end device sustains at least 55 FPS
- p95 input acknowledgement and contact stay within the canonical budgets under stress

The team should add crash-free run rate and ruleset-verification success as operational gates in the TDD.

### 10.2 Account level

Account level represents participation and mastery. It cannot affect:

- score formulas
- Quota
- Overdrive
- item pool odds
- shop prices
- run Tokens
- Glitch frequency
- leaderboard access or ranking

XP sources should reward resolved runs, stages cleared, first Daily completion, personal bests, verified achievements, and major mastery milestones. Raw WPM alone should not grant an XP advantage.

Initial pacing targets for later simulation:

| Milestone | Target experience |
| --- | --- |
| First cosmetic reward | first resolved run |
| Level 5 | 5-7 resolved runs |
| Level 10 | 15-20 resolved runs |
| Level 20 | 50-70 resolved runs |

These ranges are calibration targets, not canonical formulas. The TDD must place the curve in versioned pure TypeScript configuration and provide a simulator before implementation ships.

### 10.3 Cosmetic currency

Players earn cosmetic currency through play and spend it in a cosmetic catalog. The project must approve the currency name in the GDD before UI or identifiers use it.

Currency rules:

- the game awards currency after a resolved run or achievement
- spending uses exact prices
- the catalog has no random rolls
- inventory prevents duplicate ownership
- refunds or migration protect players when catalog data changes
- currency cannot purchase run power
- the first release has no real-money purchase path

### 10.4 Cosmetic categories

Candidate categories:

- Warden material and chassis palette
- cannon muzzle and contact effect
- caret style
- arena colorway
- profile frame and title
- verified achievement badge
- switch sound pack

Ranked-safe acceptance applies to each cosmetic:

- preserve Warden and enemy silhouettes
- preserve active-word contrast
- preserve attack telegraphs
- respect the same particle cap
- provide a reduced-motion variant
- avoid animation timing changes
- avoid louder mix levels than the base effect

### 10.5 Achievement relationship

Achievements can unlock cosmetics, titles, profile badges, or catalog access. Achievement requirements should describe mastery in terms the player can verify.

Examples of suitable categories:

- progression: resolve a zone or the full run
- accuracy: meet a threshold across a resolved stage or run
- build mastery: win with a defined item category constraint
- Overdrive mastery: execute a specified number of valid releases
- Daily mastery: resolve a verified Daily Seed

The governing GDD must approve exact names, thresholds, and rewards before implementation.

## 11. Ethical retention rules

TYPECADE may use:

- personal-best targets
- verified seed rivalry
- deterministic challenges
- build discovery
- mastery achievements
- play-earned cosmetics
- shareable run stories
- ghost races

TYPECADE must exclude:

- energy or ticket systems
- daily login gifts that punish missed days
- streak loss
- loot boxes or random cosmetic purchases
- limited-time competitive power
- paid score or shop advantages
- hidden difficulty changes based on player behavior
- currency loss after a failed run
- forced account creation before play

## 12. Telemetry and evaluation

The current typed telemetry bus needs a transport and a versioned event contract. Product evaluation requires events for:

- run start, stage start, stage result, run result, and second-run start
- accepted input acknowledgement and contact latency
- dropped, aggregated, and delayed presentation events
- frame-time percentiles during combat
- item purchase, reroll, trigger, and contribution
- Overdrive ready, release, and unused full charge
- menu impression, Play visibility, and Play activation
- Daily attempt eligibility, submission, verification, and rejection reason
- share generation and share action
- account prompt, login, migration, and abandonment
- XP grant, currency grant, catalog view, purchase, equip, and refund after progression launches

Telemetry must not send raw typed word content when aggregate events can answer the product question. Replay storage follows the explicit competitive requirement and its own retention policy.

## 13. Accessibility and performance gates

### 13.1 Accessibility

- Preserve full keyboard operation after a run starts.
- Keep gameplay text at or above the documented minimum.
- Provide visible focus for menus, Shop, leaderboard, and account surfaces.
- Give each critical audio cue a visual equivalent.
- Give each critical color state a text, shape, or motion equivalent.
- Keep accepted input, enemy anticipation, score causality, and Overdrive readable under reduced motion.
- Test gameplay at 200% browser zoom where the canvas and DOM controls coexist.

### 13.2 Performance

- Pool command-rail glyphs, signal nodes, particles, fragments, and reusable popup objects.
- Avoid object creation and destruction in the accepted-character hot path.
- Profile at representative high WPM and the 200-object effect ceiling.
- Track p50, p95, and p99 frame time and input-to-contact latency.
- Keep decorative work below critical contact work in each frame budget.
- Test the documented low-end device and both design breakpoints.

## 14. External design references

- [UNO official modes](https://www.letsplayuno.com/support/modes.html): borrow immediate score goals, collection clarity, achievements, and social objectives. Exclude daily gifts, stamina, loss stakes, and FOMO systems.
- [Balatro official FAQ](https://www.playbalatro.com/faq): use score manipulation, build identity, challenges, unlocks, and endless play as structural references.
- [Tetris Effect official game overview](https://www.tetriseffect.game/about-the-game/): use synchronized graphics, sound, and player action as a feedback reference.
- [Good Game Feel, DiGRA](https://dl.digra.org/index.php/dl/article/view/936/): use perceived control and immediate response as evaluation lenses.
- [Effects of juiciness in an action RPG](https://www.sciencedirect.com/science/article/pii/S1875952118300879): use bounded feedback intensity. Medium and high feedback outperformed absent and extreme implementations in the reported experiment.
- [Leaderboard goal-setting experiment](https://www.sciencedirect.com/science/article/pii/S0747563215300868): treat leaderboard motivation as dependent on player goal commitment and provide reachable comparison targets.

## 15. Acceptance criteria for this design

The later TDD and implementation plan must preserve these outcomes:

1. Every accepted character receives a visible semantic contact cue without delaying input.
2. Full-body Warden and enemy actions use the articulation and authored-pose requirements already defined by the project.
3. Overdrive uses the canonical ready and 320ms release choreography.
4. Players can explain Base, Mult, final multipliers, and primary item contributions from in-run and stage-result feedback.
5. Play appears in the first supported mobile viewport and compact HUD text respects the 14px floor.
6. Combat meets the low-end FPS gate and p95 response budgets under stress.
7. M4 competition uses server-authoritative identity and labels local results as local.
8. M6 replay supports anti-cheat, Ghost Race, and Challenge Link.
9. Account level and cosmetic currency remain outside MVP and grant no run power.
10. The progression system launches after the approved retention, performance, and verification gates pass.

## 16. Deliverables after approval

The next document will be a detailed Technical Design Document covering:

- module boundaries and data flow
- presentation-event schema and scheduler
- rig and animation data model
- Pixi object pools and lifecycle
- performance instrumentation
- telemetry transport and privacy
- leaderboard submission and verification
- replay encoding and storage
- account progression and cosmetic schemas
- migrations, security, failure handling, testing, and rollout

The final master implementation plan will break the approved design and TDD into small PR-sized tasks with exact file paths, tests, commands, dependencies, and acceptance checks.
