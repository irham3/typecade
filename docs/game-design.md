> **Roguelike typing arcade**: the "Balatro of typing". Run-based, item synergy, unlimited scaling. This document is the single source of truth for gameplay design, items, economy, and MVP scope.
> 

<aside>
🎯

**Positioning**: not an add-on feature bolted onto the typing test, this is Typecade's new identity. Direct competitors: ZType (stagnant), Nitro Type (kids/ads). The "roguelike typing with modern polish" slot in the market is still **empty**.

</aside>

# 1. Core Concept

**One-liner (final EN copy)**: *Type to attack. Craft your Keycap build. Beat quotas that never stop rising. Survive as long as you can.*

**Design pillars:**

1. **Score = Base x Mult**: every system manipulates this formula (the Balatro formula).
2. **Accuracy is your life bar**: a typo always has consequences; speed without accuracy does not win.
3. **Build > raw speed**: a 50 WPM player with a smart build can beat a 100 WPM player with no strategy. This is what keeps the market from being limited to elite typists.
4. **One run = 10-15 minutes**: short enough for "one more run".

**World vocabulary (arcade/keyboard theming):**

| Balatro term | Typecade term | Meaning |
| --- | --- | --- |
| Joker | **Keycap** | Passive item, equipped in a slot (max 5) |
| Tarot/Planet | **Macro** | Single-use consumable |
| Voucher | **Firmware** | Permanent upgrade for the run |
| Chips x Mult | **Base x Mult** | Score formula |
| Ante | **Zone** | World level, quota rises per zone |
| Blind | **Stage** | Typing round |
| Boss Blind | **Glitch** | Stage with a nasty modifier |
| Money | **Token** | Arcade coin, shop currency |
| Stake (difficulty) | **Switch** | Membrane > Mechanical > Optical > Quantum |

---

# 2. Core Loop & Score Formula

## Loop per stage (75 / 70 / 65 second ceiling)

1. Words flow on screen (a stream, like the regular typing mode).
2. Every accepted character makes the Keystone Warden perform a readable action and adds 3 charge to the **Overdrive meter**. A typo removes 15 charge, to a minimum of zero.
3. Every **word finished without a typo** scores: `(character count + Base bonus) x current Mult`. If Overdrive is full, the clean submission becomes an Overdrive Strike, applies a final score multiplier of x2, and empties the meter.
4. **Combo**: every 10 consecutive words without a typo grants **Mult +1**. A typo resets Mult to 1 (unless an item changes this rule).
5. Hit the **Quota** before time runs out: the stage clears immediately, remaining time becomes a Token bonus, then the player enters the **Shop**.
6. In Zones 1-2, **Aegis Protocol** prevents timeout from ending the run. The Warden visibly blocks the lethal attack, the timer receives 30 seconds, and the stage continues. A rescued stage awards no time bonus. From Zone 3 onward, an unmet quota ends the run unless an item prevents it.

## Literal beginner route

`Beginner` means a hunt-and-peck player at 1-13 WPM, not a 40 WPM typist. The validation set explicitly includes 1, 5, 10, 12, and 13 WPM.

- Zone 1 Warm-up uses single home-row and high-frequency letters. Each submitted letter is a complete target.
- Zone 1 Rush uses two-letter signals. Zone 1 Glitch uses three-letter words.
- Zone 1 auto-executes as soon as its final character is accepted. `Space to execute` is introduced in Zone 2, after the player has learned targeting and correction.
- A wrong key in Zone 1 is rejected, shown in accuracy, and drains Overdrive, but it does not corrupt the signal or break Combo. The player simply finds the correct key and continues.
- Zone 2 introduces normal correction and Combo breaks, but a corrected dirty word receives **Aegis Recovery**: `(character count + Base bonus) x1`, ignoring Mult and final multipliers. From Zone 3 onward, dirty words return to the canonical zero-score rule.
- Zone 1 Glitch is a choreography-only training boss with no mechanical Glitch. The five MVP Glitches enter the pool in Zone 2; Sudden Death does not enter the pool until Zone 3.
- Zone 2 uses short 3-5 letter words. Zone 3 begins the full word pool and the normal roguelite pressure curve.
- Standard Zones 1-2 use **Focus Pause**. After 4 seconds with no printable input, the stage clock pauses automatically and the HUD reads `FOCUS PAUSE · TYPE WHEN READY`. The next printable input resumes the clock and is processed normally.
- Focus Pause does not pause WPM or run-duration measurement. It protects decision/search time without falsifying typing speed.
- Backspace and Macro keys count as intent and resume the clock, but only printable correct characters charge Overdrive.
- Focus Pause is disabled from Zone 3 onward and never exists in Endless mode.
- The first-run route teaches by escalation: `1 KEY → 2-KEY SIGNAL → 3-LETTER WORD → SHORT WORD → FULL POOL`. It never opens with an unexplained full word under a lethal timer.

Stage clocks are intentionally asymmetric:

| Stage | Initial time | Combat purpose |
| --- | ---: | --- |
| Warm-up | 75 seconds | Read the build, establish rhythm, and charge the first Overdrive safely |
| Rush | 70 seconds | Higher target cadence and less recovery time |
| Glitch | 65 seconds | Boss pressure plus the active Glitch |

The timer is a clear ceiling, not a promise that every stage lasts that long. Reaching Quota clears immediately. Outside the intentionally compressed Zone 1 tutorial, an effective early stage should normally resolve in 25-55 seconds. Skilled players may clear a tutorial stage in seconds and continue immediately into the full run; the game never pads a cleared Quota to a fixed one-minute duration.

## Canonical scoring lifecycle

- Typing accuracy is measured per attempted character. A corrected typo still marks the current word dirty.
- From Zone 3 onward, a dirty word awards zero score. Zone 2 uses the explicit Aegis Recovery Base-only exception above, while Zone 1 rejects wrong keys without dirtying its training signals. Any applicable Mult reset is resolved when the word is submitted.
- Combo, the natural Mult earned from Combo, stage-only item bonuses, stage score, accuracy, and WPM reset at every stage start.
- Run-persistent item bonuses, Tokens, inventory, and total run score do not reset between stages.
- The word that reaches Combo 10/20/30 receives the newly increased Mult.
- Apply Base bonuses, Base multipliers, additive Mult, Mult multipliers, and final score multipliers in that order; floor the final per-word score to an integer.
- `stage score` is compared with the current stage Quota. `run score` is the sum of every completed and failed stage score.
- A stage clears on the first submitted word that meets or exceeds Quota. The player never waits for the timer after earning a clear.
- Overdrive charge is run-persistent. It gains exactly 3 per accepted character, loses 15 on a non-ignored typo, caps at 100, and is consumed only by a clean submitted word at full charge.
- The Overdrive Strike is a final score multiplier and therefore resolves after Base and Mult item effects. It is part of the shared ruleset, not an item proc.
- An Aegis rescue is available only in standard Zones 1-2. It adds 30 seconds, increments the visible rescue count, and permanently sets that stage's time bonus to zero. It never changes score, Quota, word order, shop RNG, or leaderboard rules.
- Focus Pause becomes active after exactly 4,000ms with no input in a protected stage. The stage timer stops, while `runDurationMs`, stage WPM time, telemetry duration, and wall-clock playtime continue.

## Moment-to-moment experience contract

The scoring rules stay deep, but the first interaction must be obvious without reading a manual.

- A new stage opens in a **ready gate**. The stage timer does not move until the first printable key. That key is processed as normal input, so the gate adds no click and no lost keystroke.
- The active word and caret are always the highest-contrast elements. Zone 1 labels the exact input contract (`FIND 1 KEY`, `TYPE 2 KEYS`, or `TYPE 3 LETTERS`) and auto-executes. From Zone 2 onward, once every letter is entered, the rail changes to **SPACE — EXECUTE** or **SPACE — OVERDRIVE** when fully charged. Space submits the word and triggers the finishing strike.
- Each accepted character advances the Warden through a deterministic attack chain: launch, cross-field dash, strike, recoil, and recover. The corresponding enemy letter-node breaks on impact. The Warden must change pose and position; firing from one fixed anchor for an entire word is not acceptable.
- Resolution ends the encounter: a clean word destroys the target and awards score; a dirty Zone 2 word receives Aegis Recovery; a dirty Zone 3+ word awards zero and breaks Mult according to the canonical rules.
- A corrected dirty word remains visibly marked **AEGIS RECOVERY — BASE ONLY** in Zone 2 or **CORRUPTED — 0 SCORE** in Zone 3+. This makes the consequence honest before submission instead of surprising the player afterward.
- First-run coaching is embedded in the command rail without pausing play: Zone 1 uses `FIND 1 KEY — AUTO-FIRES`, `TYPE 2 KEYS — AUTO-FIRES`, and `TYPE 3 LETTERS — AUTO-FIRES`; Zone 2 introduces `TYPE THE WORD — SPACE EXECUTES`; then the Combo rail teaches `10 CLEAN WORDS = +1 MULT`. A Zone 2 typo changes the outcome copy to `AEGIS RECOVERY — BASE ONLY`; Zone 3+ uses `CORRECT IT, THEN EXECUTE — THIS WORD SCORES 0`.
- Combo is displayed as both the total clean streak and progress to the next natural Mult: `7 / 10 TO MULT`. When it reaches 10, the meter empties only after the Mult increase is visibly acknowledged.
- A clean submission shows one compact equation for 700ms: `6 BASE × 2 MULT = +12`. Item bonuses are folded into Base or Mult and the triggering item acknowledges beside the equation.
- Target entry and defeat animation never lock input. The next word becomes typeable immediately; visual transitions catch up independently within 180ms.
- At 75% Quota the arena enters **OVERRUN**: the quota rail, target cadence, and audio riser intensify without changing rules. At 90% Quota the HUD shows the approximate score still needed, not a vague warning.
- Aegis protection is explained before Zone 1 starts and remains visible as `AEGIS ACTIVE · ZONES 1-2`. A rescue uses a full character block animation and `+30S`, never a silent timer reset.
- Focus Pause is communicated as a calm cyan state, not a failure. Enemy attack anticipation cancels, the Warden enters `ready-high`, and the arena continues low-motion ambience so the game still feels alive.
- Difficulty is communicated by named threat bands rather than hidden adaptation: Zones 1-2 `PROTECTED`, Zones 3-4 `PRESSURE`, Zones 5-6 `OVERCLOCKED`, and Zones 7-8 `LETHAL`. Player WPM never secretly changes Quota or scoring.
- Stage Result answers three questions in order: `Did I clear?`, `Why did I score that much?`, and `What should I improve or buy?`. Shop answers: `What does this trigger?`, `Does it fit my current run?`, and `What challenge comes next?`

The intended rhythm is: **read → strike → reposition → execute → charge → burst → choose**. Any animation, panel, or explanation that delays this rhythm is a defect.

## Baseline number calibration

Model players from actual per-character accuracy, not a flat percentage applied after scoring. For a five-character word, 96% character accuracy produces only an 81.5% chance of a clean word before corrections. The simulator must reproduce dirty words, broken streaks, and item triggers.

- A 75-second Warm-up at 60 WPM contains approximately 375 attempted characters before early clear.
- Natural maximum at perfect accuracy depends on early clear; the simulator models the actual word lengths, dirty-word probability, and Overdrive cadence.
- Zone 1 must be survivable without owning an item; later zones progressively require a coherent build.
- From Zone 3-4 onward, quotas **force** the player to own Mult items. Exactly like Balatro: base alone is never enough.
- Zones 1-2 are onboarding through play, not a disguised speed test. A beginner can always finish them through Aegis rescues, while faster play earns time Tokens and reaches shops sooner.
- The quota table below is calibrated against `scripts/simulate-overdrive.mjs` and remains subject to external playtest gates in §10.

## Why typos must be expensive

Without a typo penalty this game becomes "spam the keyboard". Default rule: a typo means the word scores nothing + Mult resets. Items then sell **relaxations of this rule at a price/tradeoff** (see Combo Battery, Vampire); that is where the interesting decisions come from.

---

# 3. Run Structure

**8 Zones**, 3 stages each:

1. **Warm-up** (low quota, skippable for a small reward)
2. **Rush** (medium quota)
3. **Glitch** (boss: high quota + a nasty modifier)

Beat Zone 8 for the **win**, which unlocks **ENDLESS MODE** (infinity): quotas keep rising exponentially until the run dies. The endless score is what feeds the main leaderboard.

## Quota curve (ruleset v0.2)

| Zone | Warm-up | Rush | Glitch |
| --- | --- | --- | --- |
| 1 | 5 | 8 | 12 |
| 2 | 8 | 12 | 18 |
| 3 | 60 | 90 | 130 |
| 4 | 180 | 260 | 380 |
| 5 | 500 | 700 | 1,000 |
| 6 | 1,200 | 1,800 | 2,500 |
| 7 | 3,000 | 4,500 | 6,000 |
| 8 | 7,000 | 9,000 | 12,000 |

Endless: Zone 8 quota x 1.8^n per subsequent zone.

<aside>
⚠️

These values are the first implementation curve. They are validated by the deterministic simulation harness and must still pass external beginner, 40-50 WPM, 60 WPM, and 90 WPM playtests before release.

</aside>

---

# 4. Economy & Shop

## Token income per stage

- Clear Warm-up / Rush / Glitch: **3 / 4 / 5 Tokens**
- **Time bonus**: +1 Token per 10 seconds remaining
- **Interest**: +1 Token per 5 Tokens held when entering the shop (max +5), creating the save-vs-spend dilemma
- Skip Warm-up: +1 Token & jump straight to the next stage (tempo vs economy)

## Shop contents (between stages)

- 2 **Keycap** slots (random per rarity odds)
- 1 **Macro** slot
- 1 **Firmware** slot (appears only once per zone)
- **Reroll**: 5 Tokens, +1 per use within one visit

## Prices & rarity odds

| Rarity | Price | Appearance odds |
| --- | --- | --- |
| Common | 3-4 | 60% |
| Uncommon | 5-6 | 28% |
| Rare | 7-8 | 10% |
| Legendary | 10-12 | 2% |

Keycaps can be **sold** back for ~50% (rounded down).

MVP has no Legendary Keycaps in its 15-item manifest, so the Common/Uncommon/Rare weights are normalized across the available pool. The 2% Legendary roll is enabled only when Legendary items enter the pool.

---

# 5. Keycaps (Passive Items): 27 total

Default slots: **5**. Slot order matters (some items care about position).

## Common (8)

| Keycap | Effect | Design note |
| --- | --- | --- |
| **WASD** | Words starting with W/A/S/D: +10 Base | Gamer theming, instantly readable |
| **Vowel Magnet** | Every typed vowel: +1 Base | Small but constant scaling |
| **Longshot** | Words of 8+ letters: Base x2 | Synergy with Lexicon Swap (long words) |
| **Sprinter** | First 10 seconds of each stage: +2 Mult | Rewards an aggressive start |
| **Second Wind** | First word after a typo: score x3 | Softens the pain of a typo |
| **Copper Key** | Every 25 correct words: +1 Token | Entry-level economy item |
| **Home Row** | Words made only of home-row letters (asdfghjkl): +15 Base | Educational, trains real home-row typing |
| **Punctuator** | Correct punctuation: +3 Base per mark | Synergy with punctuation mode |

## Uncommon (9)

| Keycap | Effect | Design note |
| --- | --- | --- |
| **Combo Battery** | First typo of each stage does not reset Mult (1 shield/stage) | The defensive item casual players want most |
| **Overclock** | Every 15-word streak: +1 Mult, permanent for the stage | Main mid-game scaling |
| **Favorite Letter** | Pick 1 letter on purchase; that letter gives +2 Base per occurrence | Build enabler, players start "farming" letters |
| **Double Tap** | Words with a double letter (ll, ss, tt...): +4 Mult for that word | Small "jackpot" moments |
| **Palindrome** | Palindrome words: Base x5 | Rare but memorable |
| **Snowball** | Finish a stage with zero typos: +0.2 Mult, **permanent for the whole run** | Perfectionist reward, compounding |
| **Interest Bank** | Interest cap rises from +5 to +10 | Economy build |
| **Turbo Finish** | Clear with >50% time remaining: Token reward x2 | Rewards pure speed |
| **Caps Lock** | Words containing capital letters: Base x2 | Synergy with quote mode |

## Rare (7)

| Keycap | Effect | Design note |
| --- | --- | --- |
| **Glass Keycap** | Mult x3, **shatters** if stage accuracy <95% | Iconic risk/reward (Glass Joker style) |
| **Vampire** | Typos do not reset Mult, but cost -3 seconds | Changes the currency of mistakes: combo to time |
| **Midas** | Rare letters (x, z, q, j) typed correctly: +1 Token | Economy + makes weird words fun |
| **Flow State** | 30 seconds without a typo: all Base x2 until the next typo | Rewards consistency, high tension |
| **Time Dilation** | +15 seconds every stage, quota +10% | Tradeoff for slow-but-accurate players |
| **Mirror** | +Base equal to half the current Mult per word | Bridges Base and Mult synergy |
| **Copycat** | The Keycap in the slot to its right triggers twice | Typecade's Blueprint; slot position becomes a puzzle |

## Legendary (3)

| Keycap | Effect | Design note |
| --- | --- | --- |
| **⌘ Infinity Key** | +1 permanent Mult (whole run) for every Glitch defeated | Endless win condition |
| **The Typewriter** | All words +5 Base; a full sentence without a typo: +5 Mult | Strong generalist |
| **Overdrive Core** | When time remaining <10 seconds: all scoring x4 | The clutch item, the hypest moment for clips/content |

---

# 6. Macros (Consumables)

Max carried: 2. Price 2-4 Tokens.

| Macro | Effect |
| --- | --- |
| **Escape** | Cancel the Glitch effect for this stage |
| **Time Freeze** | +20 seconds this stage |
| **Quota Slash** | This stage's quota -25% |
| **Ctrl+C** | Duplicate 1 owned Common/Uncommon Keycap |
| **Insurance** | The next typo is fully ignored (no combo reset, does not shatter Glass) |
| **Lexicon Swap** | Swap this stage's word pool (choose: short words / long words / no punctuation) |
| **Jackpot** | Current Tokens x1.5 (max +10) |

---

# 7. Firmware (Permanent Run Upgrades)

One slot per zone in the shop, price ~8 Tokens:

- **Extra Slot**: +1 Keycap slot (max 7)
- **Discount**: all shop prices -25%
- **Extended Timer**: +10 seconds on every stage
- **Better Odds**: Rare/Legendary odds x2
- **Macro Pocket**: +1 Macro slot

---

# 8. Glitches (Boss Modifiers): 10 total

| Glitch | Effect | Counter |
| --- | --- | --- |
| **Invisible Ink** | Words fade out 1 second after appearing | Fast reading / Time Dilation |
| **No Backspace** | Backspace is locked | Accuracy / Insurance |
| **Sudden Death** | 3 typos = instant stage fail | Combo Battery / Vampire |
| **Scrambler** | Words appear one at a time with a per-word timer | Reaction speed |
| **The Censor** | 1 random letter per word is censored (█) | Context / vocabulary |
| **Speed Demon** | Quota only counts while live WPM ≥ a threshold | Sprinter / burst typing |
| **Inflation** | Quota +50%, Token reward x2 | A strong build turns it into farming |
| **Blackout** | Screen is dark except a small radius around the caret | Focus / muscle memory |
| **Drunk Caret** | Text sways/tilts (visual only) | Mental game, makes for funny clips |
| **The Leech** | Score drains -X per second | Type without stopping |

**Final Glitch (Zone 8): KERNEL PANIC**: a combination of 2 random Glitches at once + a full quota.

---

# 9. Text System (important, often underestimated)

The word pool must be **tagged**: length, letters used, contains double letters, palindrome, punctuation, capitals.

- The text generator is **biased 10-15% toward the player's build triggers** (e.g. the player owns Longshot, so long words appear slightly more often). The build feels alive but is never guaranteed; the Balatro-style RNG stays.
- Support **EN and ID word pools** from day one (the Indonesian differentiation lives on as typed-content variants, like the existing EN/ID modes).
    
    <aside>
    🇬🇧
    
    **Product language policy**: ALL taglines, UI copy, item/mode names, share cards, and Typecade marketing content are in **English** (global product). Indonesian exists only as a **word pool / typed-language variant**, never as the interface language.
    
    </aside>
    
- Anti-repeat: the same word never appears twice within 30 words.

---

# 10. Balancing Framework

Before changing gameplay numbers: run the deterministic simulation harness and record the result alongside the ruleset change.

1. Player models: 1 / 5 / 10 / 12 / 13 / 20 / 40 / 60 / 90 WPM with representative per-character accuracy and inter-key pauses.
2. Simulate per-stage scores for each profile, with 0-3 scaling items.
3. Balance targets:
    - 1-13 WPM beginner: can stop indefinitely to locate a key, completes the staged Zone 1 letter-to-word route, always completes Zones 1-2 through Focus Pause plus visible Aegis rescues, and reaches at least six shops/decisions before a speed-based run end is possible.
    - 40-50 WPM player: clears Zone 1 without rescue in a representative majority of runs and reaches Zone 3-5 with understandable build choices.
    - 60 WPM player + a decent build: reaches Zone 6-8 (wins sometimes).
    - 90 WPM player **without** a build: stuck at Zone 4-5. (This is what enforces *build > raw speed*.)
    - 40 WPM player + an economy/defensive build: Zone 4-5, still feels like progress.
4. Main tuning knobs: quota curve, stage clock by type, combo rate (+1 per 10 words), Overdrive gain/loss, and item prices.
5. Never use invisible per-player Quota scaling. Fairness assistance must be deterministic, visible, and identical for every player in the same Zone.

---

# 11. Meta-Progression & Retention

- **Unlock Keycaps** via achievements (e.g. the "Win without Mult items" achievement unlocks Mirror). The first run starts with only ~12 Keycaps in the pool; the rest are unlocked, giving a reason to play again.
- **Switch (difficulty)**: Membrane > Mechanical > Optical > Quantum. Each tier adds rules (quota +%, higher prices, more frequent Glitches).
- **Daily Seed Run**: every player worldwide gets the same seed once per day, feeding a daily leaderboard and a **share card** (Wordle-style result grid: zone reached, final build, score). This is the main distribution engine.
- **Cosmetics**: themes, particle effects, caret skins, earned by playing, never bought.

---

# 12. Presentation & Juice

- **Render gameplay on a canvas (PixiJS)**, not DOM/Framer Motion: layered character animation, pose changes, cross-field movement, projectiles, particles, hit reactions, and camera response at 60fps on low-end devices.
- **Presentation direction is locked: Signal Siege — character combat.** The player operates the **Keystone Warden**, a compact mechanical sentinel built from key-switch, keycap, and keyboard-plate geometry. It has a readable head, torso, typing cannon, and braced combat pose without becoming a cute mascot or a human character.
- Every target is a short combat encounter tied to one word. Its letters become destructible signal-nodes arranged along a readable attack path. Each accepted character moves the Warden to the next node and breaks it. The final accepted character enters an execution pose; a clean submission destroys the target, while a dirty submission makes it phase out with no score. The next target enters immediately so typing never waits for animation.
- Warm-up fields **Packet Stalkers**, small corrupted relay creatures; Rush fields **Needle Wraiths**, fast signal hunters; Glitch fields the **Null Crown**, a large fractured boss construct. Their silhouette, locomotion, anticipation, hit reaction, defeat, and entry motion must be readable without labels.
- Original raster character and environment art is allowed and preferred when it creates a stronger silhouette than code-native geometry. Assets must be project-owned or commercial-safe, stored locally, versioned, documented in `CREDITS.md`, and composited with code-driven effects. Stock sci-fi sprites, clip art, emoji, photorealism, generic spaceships, and unrelated asset packs remain banned.
- The arena is a layered cyber-industrial signal trench rather than an empty grid. Low-contrast parallax, distant machinery, cable motion, and haze may move continuously to establish depth; gameplay accents remain brighter than the world.
- Every word clear: the score number pops from the defeated target and resolves toward the score HUD. Mult up: flash + 50ms hitstop. Glass shatters: 0.3s slow-mo.
- At least six authored Warden poses and four poses per enemy class are required for MVP gameplay: ready, anticipation, attack/travel, recoil or recover, hit/block, and defeat or ultimate where applicable. A single raster master moved, rotated, or squashed in code does not satisfy character animation.
- Character sprites may use short crossfades only between compatible poses. Attacks require stepped or interpolated travel through the arena, animation smears, and contact frames. Ambient bobbing never counts as a gameplay animation.
- Full Overdrive changes the command rail, Warden silhouette, audio layer, and attack choreography before it changes score. The release crosses the arena, creates a full-height impact column, and returns control within 320ms.
- Every enemy periodically telegraphs an attack based on the remaining stage time. These attacks create pressure and authored block/dodge reactions but do not introduce a second health system in MVP. The lethal timeout attack is the only attack that resolves the stage outcome.
- Aegis rescue requires a distinct Warden block pose, an enemy attack pose, a shield break or deflection effect, a `+30S` callout, and a changed arena state. It must feel like surviving an attack, not like the timer silently jumping.
- Every equipped item must visibly acknowledge a proc without competing with the active word. A stage breakdown attributes score and protection to the build so the player can learn why it worked.
- Audio: a click per keystroke (sound options: linear/tactile/clicky, keyboard switch theming), a shot layer on accepted characters, an impact layer on word completion, a riser when approaching the quota, and a sting when a Glitch appears.
- The aesthetic is **Kinetic Cyber-Brutalism**: disciplined dark surfaces, bold asymmetric silhouettes, readable typography, and short high-impact motion. It must feel like a combat game controlled by typing, never like a dashboard with decorative sprites.

---

# 13. MVP Scope (v1)

<aside>
✂️

**Scope discipline is the lifeline of a solo project.** Anything not on this list goes to v2.

</aside>

**In the MVP:**

- 8 Zones x 3 stages, simple endless mode after the win
- **15 Keycaps**: WASD, Vowel Magnet, Longshot, Sprinter, Second Wind, Copper Key, Home Row, Punctuator, Combo Battery, Overclock, Double Tap, Snowball, Interest Bank, Glass Keycap, Vampire
- **4 Macros**: Escape, Time Freeze, Quota Slash, Insurance
- Core Overdrive meter and Overdrive Strike (3 charge per accepted character, -15 on typo, x2 final score on the next clean submission at 100)
- Literal beginner route (letters → two-letter signals → three-letter words → short words)
- Focus Pause and Aegis Protocol beginner protection in standard Zones 1-2
- No Firmware
- **5 Glitches** (No Backspace, Sudden Death, Invisible Ink, Blackout, Inflation)
- Basic shop + reroll, economy per §4
- Daily seed + daily leaderboard + share card
- EN + ID word pools (UI & all copy stay full English)
- Local-first (no forced login); login only for run history & leaderboard

**Not in the MVP:** Firmware, Switch difficulty, the full unlock system, cosmetics, Copycat/slot position, KERNEL PANIC.

**Suggested work order:**

1. Deterministic simulation: validate the curve against 1/5/10/12/13/20/40/60/90 WPM profiles
2. Core loop prototype with no visuals (stage + quota + combo + 5 hardcoded items), self-playtest: *is it fun?*
3. Shop + economy
4. Juice pass (canvas, particles, audio)
5. Daily seed + share card
6. Release as a new mode on typecade.com + launch (PH / ID keyboard communities / TikTok gameplay clips)

---

# 14. Risks & Open Questions

| Risk | Mitigation |
| --- | --- |
| Balancing misses (too easy/impossible) | Simulate first; soft-launch with per-zone death rate telemetry |
| Scope creep | The §13 MVP list is locked; new features = v2 |
| Raw speed stays dominant | Watch the leaderboard: if the top 10 are all 100+ WPM with no build variety, buff items and slow the natural combo curve |
| Identity conflict with the serious typing test | The arcade mode becomes the main face; the typing test stays as "Practice" |
| Leaderboard anti-cheat | Record keystroke timing per run, detect inhuman intervals; daily seed verified server-side |

**Resolved rules:**

- The MVP uses 75 / 70 / 65 second initial clocks for Warm-up / Rush / Glitch and immediate clear when Quota is reached.
- Standard Zones 1-2 use visible Aegis rescues. Endless mode never uses Aegis.
- Standard Zones 1-2 automatically Focus Pause after 4 seconds without input. Zone 3+ and Endless never pause automatically.
- Quota and score rules never change invisibly based on measured WPM.

**Open questions:**

- The MVP uses continuous word flow. Quote/sentence mode is post-MVP.
- Mode name: "Overdrive"? "Arcade Run"? "Endless"? (placeholder: OVERDRIVE)
- Monetization later: cosmetics? supporter tier? (do not think about it before retention exists)

---

# 15. Multiplayer Strategy

<aside>
🎮

**Principle**: multiplayer is allowed and wanted, but it must never depend on a crowd that does not exist yet. An empty matchmaking lobby is worse than no multiplayer. Order: async > private > public.

</aside>

## Phase 1: Async Multiplayer

- **MVP:** Daily Seed leaderboard: every player plays the same ruleset, seed, and word-pool language each day (already in §11).
- **Launch-week/P1:** Ghost Race: race against another player's keystroke replay, or your own. Feels alive without needing concurrent players.
- **Launch-week/P1:** Challenge Link: "Beat my run": a link carrying ruleset version, word-pool language, seed, and score; the recipient plays identical conditions.

## Phase 2: Live Race, Private Lobbies

- Repurpose the existing race feature on typecade.com into **private lobbies** for friends, communities, and events/competitions.
- Private lobbies never feel dead because they are filled by people who invited each other.
- Used for community events (weekly competitions, ID keyboard communities).

## Phase 3: Public Versus Runs (v2+)

- 1v1 in the style of TETR.IO / Tetris 99: two players run simultaneously; **combos send Glitches to the opponent's screen** (fading text, swaying caret, etc).
- Keycaps gain an offense/defense dimension, creating a new build meta.
- **Candidate concept: Base War**: base warfare through typing: offense-themed words damage the opponent's fortress, repair words rebuild your own; players choose how to allocate their typing (attack vs repair), a strategic decision layered above raw WPM. An **async raid** variant (attacking a snapshot of another player's base, Clash of Clans style) can live without concurrent players, making it a candidate bridge from Phase 1 to Phase 3.
- **Gate**: do not open public matchmaking before a consistent ~50+ concurrent players at peak hours. Until then, matchmaking is filled with honestly labeled ghosts/bots.

## Technical notes

- **Keystroke replay** (timestamp per input) is one artifact serving two needs: Ghost Race **and** leaderboard anti-cheat (§14).
- Supabase Realtime is enough for the small lobbies of Phases 1-2; public Phase 3 matchmaking is what requires dedicated infra (dedicated WS server / region matching).

TYPECADE: OVERDRIVE — PRD & Tech Spec v0.1

TYPECADE: OVERDRIVE — Design Doc v0.1
