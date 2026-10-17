# Typecade dungeon — requirements

Revision: 2026-10-15. Status: implemented and verified in this branch.  Governing rules: [game design](game-design.md). Delivery order: [checklist](todo.md).

## Product acceptance

The game must feel playable at first access: a living castle title scene, clear keyboard start, immediate feedback and a complete death/restart loop. Every page follows the same visual system. Endless survival and build decisions are the primary experience; Dojo and all three requested multiplayer modes remain part of delivery.

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| CORE-01 | Seeded real-time endless simulation | Same seed/input/ticks gives same outcome; no fixed final floor |
| CORE-02 | Typing drives dash/slash | Several visible targets; full word moves knight and removes exactly one layer |
| CORE-03 | Smart 4–6 target queue | Threat priority, stable lock, readable separated labels; desktop and compact layouts |
| CORE-04 | Full enemy/object roster | Trash, shields, elites, bombers, mages, barrels/chests have real differentiated effects |
| CORE-05 | EN/ID words | Case, digits and punctuation tested; gameplay content outside UI code |
| SKILL-01 | Tab-to-cast slow motion | 0.5 simulation speed; prefix restored after cast or cancel |
| SKILL-02 | Three skills and evolutions | Mana, word cooldown, area effects, healing and prefix protection verified |
| PROG-01 | XP/gold and leveling | Loot pickup, 50-clean-character magnet, overflow XP and repeatable level drafts |
| PROG-02 | Build variation | All specified letter, lexicon, magnet and active evolution families mechanically work |
| BOSS-01 | Recurrence and overdrive | Five-minute schedule; armor break; ten-second paragraph; ultimate; continued endless run |
| RUN-01 | Run lifecycle | Start, pause, death, results, restart and validated paused resume |
| DATA-01 | Save isolation | New versioned dungeon data; previous local/account data intact; corrupt snapshot fallback |
| DATA-02 | Dungeon account progression and leaderboard | Separate validated cloud save/achievement schema; published rankings distinguish verified results from local bests |
| DOJO-01 | Safe training | Dummy/Sensei, editable text, word/sentence/custom EN/ID, symbols/digits, objective feedback |
| RACE-01 | Castle Sprint | Four real clients finish same server-owned course; obstacle words/laps affect results |
| PVP-01 | Bridge Clash | Real 1v1 and four-client matches; valid attacks/blocks change authoritative HP/points |
| RAID-01 | Co-op Raid | Four real roles, five boss layers, team WPM, three shared revives, wipe/victory |
| NET-01 | Multiplayer integrity | Server timing/input/result validation; reconnect, disconnect, host changes and replay rejection |
| UI-01 | Every page redesigned | Title, modes/lobby, settings, account, combat, drafts, results and Dojo reviewed visually |
| A11Y-01 | Accessible input | No mouse required for core run; keyboard focus, Escape, IME fallback, readable errors |
| PERF-01 | Bounded workload | Pools/chunks respect caps; renderer/audio dispose; no hidden-tab catch-up burst |
| PERF-02 | Playable measured performance | Frame time, draw calls, entity counts, heap and GPU allocation evidence on declared hardware |
| CLEAN-01 | Retire obsolete system | No fishing UI/content/models/assets in released dungeon; no Phaser/Pixi or unused dependencies |

## Completion gates

Unit tests cover domain transitions and invalid inputs, not just happy-path rendering. Browser tests must exercise real keystrokes, layered targets, skill interruption, draft selection, death/restart, boss overdrive and cross-mode teardown. Use accelerated clocks/fixtures for long milestones; also conduct an actual timed play session.

Use Chromium, Firefox and WebKit, desktop and compact viewports. Preserve existing coverage thresholds; do not remove assertions to make a redesign pass. Multiplayer uses independent real clients and an authoritative room server. A local four-client check is not a WAN capacity measurement.

Performance targets and fallback policy are in [art bible](art-bible.md). Profile a 15-minute survival session, crowded/boss scenes and repeated navigation. Report physical-device/WAN gaps honestly; no invented 60–120 FPS claims.

## Out of this implementation sequence

Steam/Tauri/Electron packaging, monetization, ranked matchmaking seasons and new analytics services have no implementation gate here. Global public ranking is part of the final account integration gate and requires separate validated dungeon result storage; never reuse trusted Ocean XP or claim offline browser scores are authoritative.

## Active boss duel acceptance — 2026-10-17 steering

- Paragraph input keeps boss and horde simulation alive. Correct letters visibly push the boss back; a typo creates a bounded rush; completed words drive safe sidesteps and guard. Hammer attacks have a visible committed windup and real range/cooldown.
- A visible wooden barricade with actual HP protects the paragraph duel from non-boss contact/projectiles. Assailants move and attack it. Sustained pressure can breach it; breach preserves text/cursor and exposes the player to the horde. Upgrade drafts remain banked until the boss falls.
- Indonesian item/upgrade commands are natural alphabetic words with exact displayed case. Explicit enemy symbol/digit difficulty stays separate.
- Environmental ash/snow/leaves use restrained world-anchored flat shapes, never dark falling balls; Reduced Effects removes them.
- Preserve bounded pools, compatible checkpoints, keyboard-only play and unchanged 100% coverage. Final PR targets master; Supabase remains postponed.
