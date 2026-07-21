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

## Loop per stage (60 seconds default)

1. Words flow on screen (a stream, like the regular typing mode).
2. Every **word finished without a typo** scores: `(character count + Base bonus) x current Mult`.
3. **Combo**: every 10 consecutive words without a typo grants **Mult +1**. A typo resets Mult to 1 (unless an item changes this rule).
4. Hit the **Quota** before time runs out: stage clear, earn Tokens, enter the **Shop**.
5. Fail the quota: the **run ends**, results screen + share card.

## Baseline number calibration

Assume an average player at **60 WPM** (≈1 word/second, ≈300 characters/minute):

- 60-second stage = ±60 words = ±300 base chars.
- Natural max combo: Mult ~7 by the end of a stage (no items).
- Expected Zone 1 score with no items: **±600-900 points**, so the Zone 1 quota must sit below this.
- From Zone 3-4 onward, quotas **force** the player to own Mult items. Exactly like Balatro: base alone is never enough.

## Why typos must be expensive

Without a typo penalty this game becomes "spam the keyboard". Default rule: a typo means the word scores nothing + Mult resets. Items then sell **relaxations of this rule at a price/tradeoff** (see Combo Battery, Vampire); that is where the interesting decisions come from.

---

# 3. Run Structure

**8 Zones**, 3 stages each:

1. **Warm-up** (low quota, skippable for a small reward)
2. **Rush** (medium quota)
3. **Glitch** (boss: high quota + a nasty modifier)

Beat Zone 8 for the **win**, which unlocks **ENDLESS MODE** (infinity): quotas keep rising exponentially until the run dies. The endless score is what feeds the main leaderboard.

## Quota curve (draft v0.1, to be tuned)

| Zone | Warm-up | Rush | Glitch |
| --- | --- | --- | --- |
| 1 | 300 | 450 | 600 |
| 2 | 800 | 1,200 | 1,600 |
| 3 | 2,000 | 3,000 | 4,000 |
| 4 | 5,000 | 7,500 | 10,000 |
| 5 | 11,000 | 16,500 | 22,000 |
| 6 | 20,000 | 30,000 | 40,000 |
| 7 | 35,000 | 52,000 | 70,000 |
| 8 | 50,000 | 75,000 | 100,000 |

Endless: Zone 8 quota x 1.8^n per subsequent zone.

<aside>
⚠️

These numbers are structured placeholders. **They must be simulated in a spreadsheet first** (see §10) before implementation.

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

Before coding gameplay: **simulate in a spreadsheet**.

1. Player models: 40 / 60 / 90 WPM with 92% / 96% / 98% accuracy.
2. Simulate per-stage scores for each profile, with 0-3 scaling items.
3. Balance targets:
    - 60 WPM player + a decent build: reaches Zone 6-8 (wins sometimes).
    - 90 WPM player **without** a build: stuck at Zone 4-5. (This is what enforces *build > raw speed*.)
    - 40 WPM player + an economy/defensive build: Zone 4-5, still feels like progress.
4. Main tuning knobs: quota curve, combo rate (+1 per 10 words), item prices.

---

# 11. Meta-Progression & Retention

- **Unlock Keycaps** via achievements (e.g. the "Win without Mult items" achievement unlocks Mirror). The first run starts with only ~12 Keycaps in the pool; the rest are unlocked, giving a reason to play again.
- **Switch (difficulty)**: Membrane > Mechanical > Optical > Quantum. Each tier adds rules (quota +%, higher prices, more frequent Glitches).
- **Daily Seed Run**: every player worldwide gets the same seed once per day, feeding a daily leaderboard and a **share card** (Wordle-style result grid: zone reached, final build, score). This is the main distribution engine.
- **Cosmetics**: themes, particle effects, caret skins, earned by playing, never bought.

---

# 12. Presentation & Juice

- **Render gameplay on a canvas (PixiJS)**, not DOM/Framer Motion: particles + screen shake + 60fps on low-end devices (the majority of ID users).
- Every word clear: the score number "pops" off the word and flies to the total. Mult up: flash + 50ms hitstop. Glass shatters: 0.3s slow-mo.
- Audio: a click per keystroke (sound options: linear/tactile/clicky, keyboard switch theming), a riser when approaching the quota, a sting when a Glitch appears.
- The aesthetic stays **Cyber-Minimalism**: arcade does not mean tacky; think Balatro: maximalist systems, disciplined visuals.

---

# 13. MVP Scope (v1)

<aside>
✂️

**Scope discipline is the lifeline of a solo project.** Anything not on this list goes to v2.

</aside>

**In the MVP:**

- 8 Zones x 3 stages, simple endless mode after the win
- **15 Keycaps** (8 Common, 5 Uncommon, 2 Rare), **4 Macros**, **no Firmware**
- **5 Glitches** (No Backspace, Sudden Death, Invisible Ink, Blackout, Inflation)
- Basic shop + reroll, economy per §4
- Daily seed + daily leaderboard + share card
- EN + ID word pools (UI & all copy stay full English)
- Local-first (no forced login); login only for run history & leaderboard

**Not in the MVP:** Firmware, Switch difficulty, the full unlock system, cosmetics, Copycat/slot position, KERNEL PANIC.

**Suggested work order:**

1. Spreadsheet simulation (1-2 days): validate the curve
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

**Open questions:**

- Fixed 60-second stage timer, or shrinking in higher zones?
- Continuous word flow vs per-sentence (quote)?
- **Gameplay presentation**: abstract text stream vs a ZType-style enemy shooter (words attached to approaching enemies; the boss is a visible Glitch)? The systems (engine, scoring, items, shop, quota) stay identical either way; decide via the M1 prototype playtest, not debate.
- Mode name: "Overdrive"? "Arcade Run"? "Endless"? (placeholder: OVERDRIVE)
- Monetization later: cosmetics? supporter tier? (do not think about it before retention exists)

---

# 15. Multiplayer Strategy

<aside>
🎮

**Principle**: multiplayer is allowed and wanted, but it must never depend on a crowd that does not exist yet. An empty matchmaking lobby is worse than no multiplayer. Order: async > private > public.

</aside>

## Phase 1: Async Multiplayer (in the MVP)

- **Daily Seed leaderboard**: every player plays the same run each day (already in §11).
- **Ghost Race**: race against another player's keystroke replay, or your own. Feels alive without needing concurrent players.
- **Challenge Link**: "Beat my run": a link carrying seed + score; the recipient plays identical conditions. Doubles as a distribution engine (1 challenge = 1 potential new user).

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