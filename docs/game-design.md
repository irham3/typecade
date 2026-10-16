# Typecade — Dungeon Typing Roguelike

Status: implemented and verified in this branch; production app/Worker deployment is separate. Revision: 2026-10-16.

Source: [supplied full GDD](source/2026-10-15-typecade-user-gdd.md) and [four references](README.md#visual-references). This document resolves interactions and distinguishes product rules from image prompts. The planning checkpoint was pushed before implementation; see the delivery checklist for current evidence.

## 1. Identity and modes

Real-time 2.5D action-typing roguelike. Typing drives the blue knight's dash, sword attacks, spells and build choices in an endless ruined-castle arena. Preserve readable pixel silhouettes, living actors and responsive impact with bounded resource use.

All five modes remain in scope: Endless Survival, Typing Dojo, Castle Sprint, Bridge Clash / Arena Royale and Co-op Dungeon Raid. Every page shares dungeon styling, including title, settings, account and results. Desktop web comes first; responsive access remains required. Steam/native packaging is a future distribution step, not a reason to add wrappers now.

## 2. Endless loop

1. Spawn seeded skeletons/goblins from 360 degrees outside a protected start radius. Begin with an explicit keyboard-ready action and readable controls; no damage before readiness.
2. Show 4–6 eligible enemy/object labels, prioritizing nearby threats. Type one to lock it; finish to dash and strip a layer.
3. Kills drop XP gems and gold. Attract nearby drops during movement. Every **50 consecutive correct characters** triggers a global XP magnet; typo resets streak.
4. Filling XP raises run level and freezes the arena for three upgrade choices. Type a complete keyword to choose and safely resume.
5. Increase pressure with time/level. Every **five minutes of unpaused run time**, schedule a boss. Victory grants a legendary relic and advances biome dressing; survival continues.
6. HP death ends the run. Results show time, level, kills, gold, WPM, accuracy and build. Restart resets temporary power. Persistent bests/unlocks are separate from run levels and old captain XP.

Fishing voyages, catch passages, boat equipment, fish collection, refit gates and quota shops are retired.

## 3. Typing and smart targeting

Input states: `ENDLESS_ARENA`, `TAB_SKILL_MODE`, `BOSS_OVERDRIVE`, `LEVEL_UP_DRAFT`, with ready, pause and ended states. Route each accepted character once. Ignore repeat, modifiers alone and browser shortcuts. Preserve content case/digits/punctuation.

First matching character locks a displayed reachable target. Resolve duplicate prefixes by danger, distance, then stable entity ID; immediately indicate selection. Prefer distinct starting characters when assigning visible labels; never rewrite a displayed or partially typed word. Keep the locked target eligible. Use queue hysteresis so labels do not flicker between moving enemies.

The final character commits immediately; no Space confirmation or movement key. Incorrect input counts against accuracy, gives a non-color cue and keeps the valid prefix. Escape pauses; an explicit cancel clears target/prefix without scoring. Dojo retains editable backspace practice separately.

Dash uses domain positions and a bounded duration, lands on traversable floor, and gives short visible non-stacking invulnerability. Multiple completions during animation apply exactly once in event order. Camera follows without excessive shake. Rendering never changes outcomes.

Choose EN/ID before the run; language changes cannot replace an active word. UI remains English; gameplay vocabulary lives in content packs. Exact shown capitalization is required; shielded enemies teach Shift.

## 4. Enemies and environmental targets

| Type | EN / ID examples | Outcome |
| --- | --- | --- |
| Skeleton / goblin | `slash`, `cut` / `tebas`, `hajar` | One layer; dash kill and loot |
| Shielded | `Guard`, `Break` / `Perisai`, `Besi` | Case-sensitive shield break |
| Elite / minotaur | `CRUSH → BREAK → EXECUTE` / `HANCURKAN → TEMBUS → EKSEKUSI` | One word per layer; blue shield, gold armor, red health |
| Bomber | `detonate-3`, `bot-09` / `ledak-3`, `mesin-09` | Finish before visible countdown to explode nearby mobs |
| Mage | `hex_bolt!`, `void_orb!` / `kutuk_petir!`, `mantra!` | Return projectile; drop mana |
| Barrel | `IGNITE` / `LEDAKKAN` | Free local area explosion |
| Chest | `LOOT` / `BUKA` | Treasure pickup |

Enemy packs in each language contain 32 skeleton words, 32 goblin words, 20 each for guards, elites, bosses, bombers and mages, and eight each for barrels/chests. Each armor layer draws a seeded word. Prefer words absent from the last 24 generated layers; preserve distinct visible initials first, then fall back to the least recently generated eligible word if the pool is constrained. Relics keep their existing shortening/punctuation rules. Checkpoints retain this bounded history; older version-1 checkpoints initialize it empty. Late trash uses a separate 30-word pack. Four boss passages per language retain the real `BLIZZARD` trigger.

Telegraph bomber expiry, contact and projectile attacks. Contact damage has a cooldown; no unavoidable spawn hits. Death, drops and area-chain reactions resolve once per entity. Objects use the same bounded queue and separate type cues. Objects cannot force dash into walls.

## 5. Tab-to-cast

Tab during arena play stores target ID/prefix, sets simulation speed to **0.5**, and exposes `CLEAVE/SAPU`, `STORM/BADAI`, `HEAL/SEMBUH`. Only this state recognizes skill keywords. Tab again cancels; a valid cast resumes automatically. Unavailable skills display mana/cooldown reason without consuming anything or losing enemy progress.

Cooldown counts **completed target words**; no seconds or character-based substitute. Casts and their kills do not grant typed-word cooldown credit. Display e.g. `3w` with explanation. Mana is separate and finite.

Keep clocks explicit: normal world motion uses full delta, Tab mode uses half delta for enemy movement/projectiles/countdowns, while the unpaused survival clock and typing metrics use real elapsed active time. Thus holding Tab cannot postpone the five-minute boss schedule. Drafts, pause and hidden-tab suspension advance neither clock. Boss stagger uses ten seconds of active real time and cannot enter Tab mode. Do not use slowed world time to inflate WPM.

Area damage removes queued layers from the tail, preserving the current locked word/prefix. If a locked enemy has only its active layer left, reserve it for typing; skill/relic damage cannot delete that prefix. Other trash can die normally. Any future forced target death must explicitly clear the lock and announce it, never redirect remaining letters silently.

| Skill | Base | Maximum evolution |
| --- | --- | --- |
| Cleave | Strip one eligible layer in local sweep | Crimson Cleave strips two and attracts all XP |
| Storm | Area strike strips one eligible layer | Absolute Zero freezes survivors five seconds and halves untouched words |
| Heal | Restore up to two hearts | Divine Aegis adds four seconds of non-stacking invulnerability |

Shortening never rewrites partial input; apply to the next untouched word. Death, level-up and boss transitions have explicit priority over skill mode. Restore the stored target only if it is still valid.

## 6. XP, drafts and relics

Baseline XP threshold: `floor(100 * 1.25 ** level)`, with safe numeric bounds. Carry excess XP; resolve multiple levels through sequential frozen drafts. Offers are seeded, distinct and eligible, excluding maxed upgrades. Define a repeatable fallback once finite upgrades are exhausted so endless runs cannot reach an empty draft.

Three cards show effect, level and unique typed keyword such as `UP-SAPU`, `PETIR`, `MAGNET`. Successful completion commits one offer exactly once. Draft input cannot trigger combat.

| Family | Required effect |
| --- | --- |
| Active evolutions | Upgrade Cleave, Storm and Heal toward their maximum forms |
| Chain lightning | Every tenth accepted combat character hits two seeded eligible targets |
| XP magnet | Increased pickup radius; explicit bounded tuning for WPM XP bonus |
| Thocky Mechanical Switch | Completed words emit local knockback |
| Vowel Spitfires | Accepted vowels fire at a seeded nearby mob |
| 100+ WPM Overclock | Above 100 WPM, double mana recovery and word cooldown reduction |
| Programmer's Glasses | Remove punctuation from future eligible bomber/mage words |
| Execute Shortener | Future final elite words contain at most three letters in both languages |

Only accepted combat input triggers letter relics. Drafts, menus and skill names cannot farm procs/XP/cooldowns. Relic area damage follows target-prefix protection. Crowd control and knockback remain bounded.

## 7. Pressure and recurring boss

| Time | Pressure |
| --- | --- |
| 00:00–02:29 | Mostly one-layer trash with lowercase 3–5 letter words |
| 02:30–04:59 | Introduce layered elites, digit bombers, symbol mages |
| Every 05:00 | Recurring armored boss |
| 15:00 onward | Up to five elite layers, 8–12 letter words, faster/denser mobs |

The spawn director aims for four reachable combat labels; objects do not satisfy that floor. If fewer remain after a dash, cap the next normal world-time countdown at 0.3 seconds and admit up to three replacements per pass. New normal enemies appear 6�8.5 units away on walkable floor with a clear approach and at least one unit of spacing; search 16 seeded angles before declining an unsafe spawn. The normal interval is `max(0.65, 2.4 / (1 + time / 360 + level * 0.03))`. Early packs are trash, guards begin at 90 seconds, and later packs weight trash above specialists. Retire unlocked non-boss pursuers beyond 18 units. A short arrival ring distinguishes reinforcements, and an empty queue displays a reinforcement notice. There is no artificial wave counter or mandatory arrow movement; completed words remain the repositioning action.

Difficulty grows within entity caps: queued/offscreen spawns follow deterministic admission rules, then layers/speed/composition increase pressure. Never evict a locked target. Only one main boss is active; further scheduled bosses wait for encounter resolution.

Obsidian Minotaur has layered armor and separate health. Armor loss triggers **ARMOR BREAK** and a **ten-second stagger**. Skill cards slide away and a rolling paragraph appears. Correct characters deal deterministic damage with phantom slashes; embedded `BLIZZARD` triggers once per occurrence.

Append seeded continuation if the passage ends early. Kill resolves relic/biome once, returns to horde and keeps the run going; otherwise armor reforms at stagger expiry. Pause/hidden tabs freeze the timer. Nested skill mode cannot extend stagger. Damage/XP text reflects actual rules; never copy fake `999 CRIT` values from concept art.

## 8. Other modes

**Typing Dojo:** safe chamber, Sensei, layered wooden dummy. Preserve word/sentence/custom practice, EN/ID, editable input, WPM/accuracy and useful settings. Lessons cover case, digits, symbols, dash/strike and sustained WPM. No death or reward farming. Paragraphs are always appropriate in this mode.

**Castle Sprint:** real 4+ participant rooms, colored knights, traversable castle course. Tactical stream varies ordinary verbs using the shared bilingual trash packs with an eight-word recent history. Preserve the original special-action sampling weight and scheduled dodge/explosion cadence so defense/obstacle words remain available. Tactical stream advances distance; show laps, WPM and live positions. Dodge/barrel/goblin words affect actual obstacles and results. Server owns starts, finish, scoring, reconnect and rematch.

**Bridge Clash / Arena Royale:** real 1v1 and 2–4+ participant bridge combat. Attack/defense words change HP, shield and points. Define target selection, defense windows, ties, replay rejection and authoritative outcomes before enabling the mode.

**Co-op Raid:** real four-or-more player party; initial four-player composition is two DPS, healer and tank. Role words perform damage, party healing and aggro/armor actions. Five boss health layers, team WPM, three shared revives. Define extra-player scaling and server-owned disconnect/downed/revive/wipe/victory behavior.

No simulated peers presented as live multiplayer. Every mode remains in roadmap; incomplete modes remain clearly unavailable until their gate passes.

## 9. Persistence and tuning before implementation

Use a separately versioned dungeon namespace. Preserve settings and old Ocean data. Dungeon bests/unlocks and checkpoints must not overwrite captain XP or old account tables.

A checkpoint includes seed and RNG state, entities/IDs, simulation clock, build, input phase and boss schedule; seed alone cannot reproduce divergent choices. Resume paused with explicit readiness. Reject corrupt/incompatible snapshots without deleting previous valid data. Account synchronization needs its own schema/validation and honest handling of locally earned scores.

Before M1 implementation, pin starting HP, damage grace, dash duration, spawn curve/speeds, loot, mana costs/recovery, word cooldowns and draft weights in one tested data table. These are unspecified in the supplied GDD. Calibrate with 20/50/90/130 WPM simulations, errors/idle gaps and actual play; screenshots are not balance evidence. Preserve source requirements: 50-character magnet, five-minute bosses, ten-second stagger.
