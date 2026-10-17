# Typecade — Dungeon Typing Roguelike

Status: implemented and verified in this branch; production app/Worker deployment is separate. Revision: 2026-10-16.

Source: [supplied full GDD](source/2026-10-15-typecade-user-gdd.md) and [four references](README.md#visual-references). This document resolves interactions and distinguishes product rules from image prompts. The planning checkpoint was pushed before implementation; see the delivery checklist for current evidence.

## 1. Identity and modes

Real-time 2.5D action-typing roguelike. Typing drives the blue knight's dash, sword attacks, spells and build choices in an endless ruined-castle arena. Preserve readable pixel silhouettes, living actors and responsive impact with bounded resource use.

All five modes remain in scope: Endless Survival, Typing Dojo, Castle Sprint, Bridge Clash / Arena Royale and Co-op Dungeon Raid. Every page shares dungeon styling, including title, settings, account and results. Desktop web comes first; responsive access remains required. Steam/native packaging is a future distribution step, not a reason to add wrappers now.

## 2. Endless loop

1. Begin with two slower seeded enemies, a chest and a shield pickup, spread 6-6.9 units from the player. New enemies arrive from safe directions outside a protected start radius. Begin with an explicit keyboard-ready action and readable controls; no damage before readiness.
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

Default new runs to Indonesian; choose EN/ID before the run; language changes cannot replace an active word. UI remains English; gameplay vocabulary lives in content packs. Exact shown capitalization is required; shielded enemies teach Shift.

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

Enemy labels explicitly say ENEMY/LOCKED and retain armor bars. Chests use a bordered gold diamond label saying LOOT / GOLD + XP; barrels use a bordered orange blast label saying OBJECT / EXPLODES. Objects have no enemy armor bars. Color is reinforced by icon, text and shape.

Actual player HP loss and its negative damage cue drive a warm armor flash, brief red edge response, readable lost-HP indicator, recoil and a red impact ring. Preserve short feedback in Reduced Effects without camera shake. Loading a checkpoint with lower HP alone must not simulate a new hit.

Telegraph bomber expiry, contact and projectile attacks. Contact damage has a cooldown; no unavoidable spawn hits. Death, drops and area-chain reactions resolve once per entity. Objects use the same bounded queue and separate type cues. Objects cannot force dash into walls.

## 5. Tab-to-cast

Tab during arena play stores target ID/prefix, sets simulation speed to **0.5**, and exposes `CLEAVE/SAPU`, `STORM/BADAI`, `HEAL/SEMBUH`. Only this state recognizes skill keywords. Tab again cancels; a valid cast resumes automatically. Unavailable skills display mana/cooldown reason without consuming anything or losing enemy progress.

Cooldown counts **completed target words**; no seconds or character-based substitute. Casts and their kills do not grant typed-word cooldown credit. Display e.g. `3w` with explanation. Mana is separate and finite.

Keep clocks explicit: normal world motion uses full delta, Tab mode uses half delta for enemy movement/projectiles/countdowns, while the unpaused survival clock and typing metrics use real elapsed active time. Thus holding Tab cannot postpone the five-minute boss schedule. Drafts, pause and hidden-tab suspension advance neither clock. Boss paragraph combat advances the live world and cannot enter Tab mode; the combo text persists across attacks and barricade breaches. Do not use slowed world time to inflate WPM.

Area damage removes queued layers from the tail, preserving the current locked word/prefix. If a locked enemy has only its active layer left, reserve it for typing; skill/relic damage cannot delete that prefix. Other trash can die normally. Any future forced target death must explicitly clear the lock and announce it, never redirect remaining letters silently.

| Skill | Base | Maximum evolution |
| --- | --- | --- |
| Cleave | Strip one eligible layer in local sweep | Crimson Cleave strips two and attracts all XP |
| Storm | Area strike strips one eligible layer | Absolute Zero freezes survivors five seconds and halves untouched words |
| Heal | Restore up to two hearts | Divine Aegis adds four seconds of non-stacking invulnerability |

Shortening never rewrites partial input; apply to the next untouched word. Death, level-up and boss transitions have explicit priority over skill mode. Restore the stored target only if it is still valid.

## 6. XP, drafts and relics

Baseline XP threshold: `floor(100 * 1.25 ** level)`, with safe numeric bounds. Carry excess XP; resolve multiple levels through sequential frozen drafts. Offers are seeded, distinct and eligible, excluding maxed upgrades. Define a repeatable fallback once finite upgrades are exhausted so endless runs cannot reach an empty draft.

Level gain produces a golden character pulse and an animated frozen draft. Cards show current-to-next rank (or max-rank restoration); choosing one applies the real upgrade and produces a separate acquisition pulse/message naming the rank and benefit. Restoration copy describes the cap honestly when HP/mana are already full. Three cards show effect, level and unique typed keyword such as `SABET`, `PETIR`, `MAGNET`. Successful completion commits one offer exactly once. Draft input cannot trigger combat.

| Family | Required effect |
| --- | --- |
| Active evolutions | Upgrade Cleave, Storm and Heal toward their maximum forms |
| Chain lightning | Every tenth accepted combat character chains to two unlocked nearby targets; four-second cooldown |
| XP magnet | Increased pickup radius; explicit bounded tuning for WPM XP bonus |
| Thocky Mechanical Switch | Completed words emit local knockback |
| Vowel Spitfires | Accepted vowels fire a visible bolt at a seeded unlocked nearby mob; 2.4-second cooldown |
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

For the first 90 seconds the director aims for two reachable combat labels within a maximum of four live threats. Optional objects keep the target queue at four labels. Opening batches admit at most two targets, use a four-second normal interval, and scale new-enemy speed from 65% to full baseline over this opening. From 90 to 180 seconds, aim for three reachable combat labels with six live threats and a three-second interval. From 180 seconds to the first boss, cap regular pressure at twelve live threats. After the learning stage the director aims for four reachable combat labels; objects do not satisfy that floor. If fewer remain after a dash, cap the next normal world-time countdown at 0.3 seconds and admit up to three replacements per pass. New normal enemies appear 6–8.5 units away on walkable floor with an exact segment-versus-ruin check for the approach and at least one unit of spacing; search 16 seeded angles before declining an unsafe spawn. The normal interval is `max(0.65, 2.4 / (1 + time / 360 + level * 0.03))`. Early packs are trash, guards begin at 90 seconds, and later packs weight trash above specialists. Retire unlocked non-boss pursuers beyond 18 units. A short arrival ring distinguishes reinforcements, and an empty queue displays a reinforcement notice. There is no artificial wave counter or mandatory arrow movement; completed words remain the repositioning action.

Difficulty grows within entity caps: queued/offscreen spawns follow deterministic admission rules, then layers/speed/composition increase pressure. Never evict a locked target. Only one main boss is active; further scheduled bosses wait for encounter resolution.

Obsidian Minotaur has layered armor and separate health. Armor loss starts a finite **BREAK COMBO** ending with `BLIZZARD`; the hero retreats to a safe 3.5-unit presentation/combat distance when too close. Correct characters damage the boss, but health cannot fall below one until the final displayed character. Completing a nonlethal line reforms armor; completing a lethal line grants the boss reward once. Never append an unseen continuation or discard a partially typed line.

Duel pressure follows typing rhythm, not raw speed. Every correct character adds 0.55 second of calm (cap 1.5 seconds; a fresh duel starts at the cap). While calm remains and no rush is active, the boss circles at a 3.4-unit standoff outside hammer reach and does not wind up, so any steady rhythm of roughly 20 WPM or faster holds it off. When calm runs out (hesitation) it closes to a 2.2-unit approach/orbit radius (typo rushes stop at 1.9 units). A typo clears all calm. The boss continues chasing, weaving and committing to a visible 0.8-second hammer windup within 2.7 units. A hammer only hurts within 2.8 units and has a 3.2-second attack cooldown plus 0.65-second recovery. Correct characters push the boss back by up to 0.14 unit, capped by distance and walkable paths. Completing a word grants 0.8 seconds of guard and a safe 0.65-unit sidestep within the duel's inner area. Typos bring the boss 0.55 unit closer on a valid path and enable a two-second speed burst. Freeze effects still stop movement. This replaces the former fixed ten-second retaliation clock.

An authored wooden barricade encloses the paragraph duel at radius 5.5. Each armor break raises a fresh 30 HP barricade centred on the hero; completing a paragraph without killing the boss removes it, so a later combo never inherits a stale position or a nearly broken wall. Stakes topple progressively in the world as HP falls. Existing pursuers are moved outside on safe radial paths and three initial assailants join, subject to the normal 128-entity cap. Reinforcements enter at most once per three seconds, stopping at eight non-object pursuers. Assailants keep moving, then swing at the barricade. Incoming shots are intercepted. Shared damage admission allows one HP loss per 0.8 seconds at most: sustained immediate pressure breaks the wall after approximately 24–27 seconds (about the time a 27–30 WPM typist needs for an authored line), with travel/freeze able to delay it. This is an explicit baseline, not a measured promise for every typing speed.

At zero HP the fence falls into debris, its HUD reports a breach, and ordinary contact/ranged attacks can hurt the player while the same paragraph/cursor remains active. A breach never ends the fight or opens a draft. The boss bypasses this protective wall and always remains a live opponent. Only actual HP death or completion of the last displayed combo character can resolve the duel. Pause/hidden tabs freeze the entire encounter. Bank every upgrade until the boss falls.

Normal armored combat alternates committed charges with close hammer-slam patterns. Domain events identify blade/cleave/storm/lightning/firebolt/sentry/blast damage; bounded world captions, directed bolts and distinct attack poses explain the outcome. Automatic relics exclude the locked target and show actual cooldowns. Peti/chest labels promise +25 gold/+50 XP and opening/collection feedback uses those real rewards.

## 8. Other modes

**Combat tutorial:** optional seven-step safe training, accessible from the main menu, pre-run dialog and Dojo. Skip tutorial is visible from the first step; Shift+Tab can reach it and Escape opens normal pause controls. Lessons reuse the headless combat rules for dash/kill, case-sensitive armor, chest rewards, barrel chains, a controlled demonstration hit plus healing, area armor removal and an actual level-up draft. Completed lessons can advance with Enter or a button. Reset training on replay; do not replace a saved survival run, award account progress or require tutorial completion before Begin run.

**Typing Dojo:** safe chamber, Sensei, layered wooden dummy. Preserve word/sentence/custom practice, EN/ID, editable input, WPM/accuracy and useful settings. Lessons cover case, digits, symbols, dash/strike and sustained WPM. No death or reward farming. Paragraphs are always appropriate in this mode.

**Castle Sprint:** real 4+ participant rooms, colored knights, traversable castle course. Tactical stream varies ordinary verbs using the shared bilingual trash packs with an eight-word recent history. Preserve the original special-action sampling weight and scheduled dodge/explosion cadence so defense/obstacle words remain available. Tactical stream advances distance; show laps, WPM and live positions. Dodge/barrel/goblin words affect actual obstacles and results. Server owns starts, finish, scoring, reconnect and rematch.

**Bridge Clash / Arena Royale:** real 1v1 and 2–4+ participant bridge combat. Attack/defense words change HP, shield and points. Define target selection, defense windows, ties, replay rejection and authoritative outcomes before enabling the mode.

**Co-op Raid:** real four-or-more player party; initial four-player composition is two DPS, healer and tank. Role words perform damage, party healing and aggro/armor actions. Five boss health layers, team WPM, three shared revives. Define extra-player scaling and server-owned disconnect/downed/revive/wipe/victory behavior.

No simulated peers presented as live multiplayer. Every mode remains in roadmap; incomplete modes remain clearly unavailable until their gate passes.

## 9. Persistence and tuning before implementation

Use a separately versioned dungeon namespace. Preserve settings and old Ocean data. Dungeon bests/unlocks and checkpoints must not overwrite captain XP or old account tables.

A checkpoint includes seed and RNG state, entities/IDs, simulation clock, build, input phase and boss schedule; seed alone cannot reproduce divergent choices. Resume paused with explicit readiness. Reject corrupt/incompatible snapshots without deleting previous valid data. Account synchronization needs its own schema/validation and honest handling of locally earned scores.

Before M1 implementation, pin starting HP, damage grace, dash duration, spawn curve/speeds, loot, mana costs/recovery, word cooldowns and draft weights in one tested data table. These are unspecified in the supplied GDD. Calibrate with 20/50/90/130 WPM simulations, errors/idle gaps and actual play; screenshots are not balance evidence. Preserve source requirements: 50-character magnet, five-minute bosses, an uninterrupted finite boss combo.


### Adaptive score and sound feedback

Presentation reads actual solo/party state for the soundtrack: menu and Dojo use a light arrangement, enemy proximity raises combat layers, an active boss adds low brass, and critical HP adds a double heartbeat. Healing out of critical HP removes the heartbeat. Draft selection retains a quiet music bed and distinct level/acquisition fanfares; paused or hidden gameplay is silent. Damage, armor, enemy arrivals/nearby creatures, deaths, loot, chest, explosive, magnet and each skill use differentiated cues with bounded repetition and priority. Settings independently control master, music/ambience and effects volumes without changing saved run/account data. Sound remains optional and never decides gameplay outcomes.


## Enemy steering and world supplies revision, 2026-10-16

Each spawn gets a seeded 88-112% speed variation on its type's multiplier. Skeletons sway slightly; goblins weave and burst; guards advance slowly; bats use an airborne silhouette with animated wings and weaving pursuit; mages hover and orbit at 4.5-6.5 units, retreating when crowded. Mage shots require an unobstructed path and have a visible 1.1-second cast warning. Minotaurs and bosses alternate chase, a 1.1-second locked-direction windup, a bounded 1.3-second charge and an 0.85-second recovery. Their ground lane telegraphs the committed destination, allowing a typed dash to leave it. All dash destinations remain walkable even for flying targets. Movement, attacks and shot admission stay in the seeded simulation; renderer interpolation and flight height cannot change outcomes. Early threat caps remain in force; bats begin at 60 seconds and specialists retain the later roster.

Four non-hostile, uppercase, typed world supplies join chest and explosive barrel. A blue kite shield grants two shield HP up to four; shield absorbs before health and uses the normal non-stacking hit grace. A red cross-marked bottle restores up to two hearts. A faceted blue-violet mana crystal restores up to 40 mana. A gold/steel sentry deploys one visible stationary tower for 18 world seconds, firing at one reachable foe within seven units every 1.8 world seconds. Replacing a sentry refreshes its location and lifetime; it never stacks. The tower preserves the active target's word/prefix and cannot collect supplies. Skill/relic area damage also leaves supplies available for deliberate typing. Item collection is not an enemy kill; supplies do not satisfy threat floors. One uncollected pickup of each supply kind is admitted at a time; sentries enter the optional pool after 90 seconds.

The HUD shows current shield 0-4, collected supplies and used/active/expired state, plus acquired relic ranks. The knight visibly carries a shield while charges remain; existing offensive relics get corresponding orbiting motes, and the tower and beam show actual sentry shots. Party shields display only authoritative room shield values. Small screens retain a focusable horizontally scrollable equipment row. Version-1 checkpoints without the new supply, shield or sentry fields receive empty defaults; present values, telegraphs and beam endpoints are validated before restore. Existing checkpoint language and partially typed words remain intact; the new-run selector defaults to ID. Music bus gain rises from 0.65 to 1.55 (about 7.5 dB) relative to unchanged effects; new music defaults to 0.85, retaining saved controls and mute preferences.


## 2026-10-17 presentation and local history

Terrain dressing rotates through ash, crypt, ember, frost and verdant palettes every 120 active seconds, added to boss depth progression. Recycle the same nine chunks, one 18-instance landmark batch and a 32-instance weather batch; geometry remains inside the existing solid ruin footprint. Weather is decorative, disabled by Reduced Effects, and never changes pathfinding. Character silhouettes, attack poses, directional proc traces, resource/level/rank captions and a heraldic title screen use authored geometry/CSS without new assets or dependencies.

Store up to 50 local run records under `typecade:dungeon:history:v1`, keyed by run seed or room/round/player identity. Update resumed solo runs rather than duplicating them; record saved/retired/fallen states, Dojo results and authoritative multiplayer results with mode, language, duration and metrics. Keep tutorial results out of history. Supabase backup, DDL rework, cloud history and global leaderboard changes are explicitly deferred by the user; preserve the existing Auth/account integration.

Clean word strikes land outside contact range: 1 unit for final hits and objects, 2.2 for remaining armor, 3.5 for bosses. Heavy armor hits interrupt minotaur/boss attacks with one second of recovery. Candidate landing points must be walkable and connected to the target; blocked candidates rotate around the target, then retain the current player position if none is safe. Loot outside the normal pickup radius stays on the floor.

Indonesian supply/object/upgrade commands use natural alphabetic words: SABET replaces UP-SAPU. Difficulty punctuation remains restricted to the explicit mage/bomber enemy packs; item commands contain no synthetic prefixes or hyphens.

## Expanded bestiary, place-bound weather and onboarding, 2026-10-17

Fifteen additional combatants extend section 4. Each has its own steering, attack style, speed (`enemySpeed`) and unlock time; tuning lives in `enemyLunges` and `enemyProfiles` in the content pack.

| Kind | Tag | Movement | Attack | Unlock |
| --- | --- | --- | --- | --- |
| slime | SLOW | hops; moves only while airborne | contact | 45 s |
| rat | SWARM | fast jittering rush, spawns as a pack of up to three | contact | 60 s |
| wolf | FAST | circles to flank beyond 3 units | 0.45 s windup pounce | 90 s |
| spider | ERRATIC | sideways stop-and-go skitter | contact | 90 s |
| archer | RANGED | holds 5.5–8 units and strafes | arrow (4.5 u/s) every ~3.6 s | 120 s |
| imp | HIT & RUN | darts to 3.5 units, flees after firing | short firebolt | 150 s |
| serpent | STRIKER | sinusoidal slither | 0.6 s windup strike from 1.4–3.6 units | 150 s |
| beetle | RAM | slow approach, 2 armor words | long straight ram | 150 s |
| wisp | ORBIT | orbits at 3.2 units | dive through the hero | 150 s |
| shaman | SUPPORT | holds 4.5–6.5 units | wards a nearby ally with an extra armor word every 6 s (never the locked target) | 150 s |
| golem | TANK | very slow, 3 armor words | planted ground slam within 2.6 units | after first boss |
| wraith | BLINK | slow drift | blinks up to 2.6 units closer every 3.4 s | after first boss |
| assassin | STALKER | moves to the hero's back (opposite last dash) | quick stab dash | after first boss |
| troll | REGEN | slow, 2 armor words | regrows one armor word after 6 s untouched | after first boss |
| necromancer | SUMMONER | holds 5–7 units | raises a skeleton every 8.5 s while under the threat cap | after first boss |

Each depth favours residents: Ashen Courtyard skeletons/archers, Hollow Crypt wraiths/necromancers, Ember Foundry imps/golems, Frostbound Watch wolves, Verdant Sanctuary spiders/serpents/slimes. All entity, projectile and label caps from section 7 still apply; all randomness stays seeded.

Weather now follows the current depth instead of a two-minute cycle: falling ash, rising crypt wisps, forge sparks, snow and falling leaves. Plain primitives used with vertex-coloured materials carry a white colour attribute, so loot, embers, projectiles and telegraphs show their intended tint instead of black.

A before-run "How to play" primer (type, Backspace cancel, Tab, Esc) shows until the player opts out; it is reopenable from the ready screen. A keyboard controls sheet is available from the title, ready and pause screens. The combat tutorial gains an eight-step "Backspace cancels a lock" lesson that starts with a mistaken lock and only completes when the other foe falls.

### Boss duel staging, quotations and everyday vocabulary, 2026-10-17

- When armor breaks, the duel is staged on the nearest open floor whose whole barricade ring (radius 5.5 plus a 1.5 margin) avoids ruins and is reachable; the hero dashes there. Loose items (barrels, chests, supplies), in-flight shots and the sentry are cleared. Foes that cannot be placed outside the fence are removed, reinforcements only enter outside it, and any foe found inside an intact fence is pushed out before it acts. A "BOSS INCOMING" and a "BOSS DUEL" banner announce the two stages.
- Boss lines are real quotations and proverbs (Sun Tzu, Marcus Aurelius, Seneca, Shakespeare, Confucius, Nietzsche; Indonesian peribahasa, Soekarno, Tan Malaka, Chairil Anwar, Ki Hajar Dewantara, Kartini), each ending in the GDD's BLIZZARD ultimate keyword; the attribution is shown under the line.
- About 45% of words for eligible foes come from an everyday vocabulary pack (226 EN / 233 ID words), re-cased to the foe's style (lowercase, Title or UPPER) and length-limited per kind. Symbol foes, bosses, minotaurs and items keep their own packs.
