# Dungeon interaction and screen specification

Revision: 2026-10-15. Planned behavior; current fishing UI is pending replacement. See [art bible](art-bible.md) for rendering and [game design](game-design.md) for rules.

## Shared visual system

Dark slate stone panels, square stepped borders, cream text, blue/cyan player accents, warm orange torch/attack accents. Green indicates valid input/healing; gold indicates active character/armor/treasure; red means threat/damage, with icon/text cues too. Use one restrained glow per active effect; no neon frame around every panel.

Reuse the licensed Press Start 2P font for titles and short headings. Use readable monospace for words, paragraphs, HUD and dense settings. Actual text remains HTML, not baked into images or Three.js models. Preserve contrast over both dark floor and bright spell effects. Use semantic controls, visible focus, named icons and sufficiently large touch targets.

## Screen inventory

| Screen | World and UI |
| --- | --- |
| First access / title | Living castle courtyard, idle blue knight, torch flicker; clear Start Endless, Dojo and Multiplayer choices, control brief and sound state |
| Run setup | EN/ID, accessible controls and effects settings; explicit ready action before damage clock starts |
| Endless horde | Arena dominates; WPM/accuracy/streak top-left; HP/mana/XP/time/gold top-right; up to six target labels; three compact skill cards at bottom |
| Tab skill mode | Cyan time-slow cue, clear active state, enlarged cards with typed prefix, mana/cooldown reason; stored target remains identifiable |
| Level draft | Frozen arena, three cards with effect/current level and unique typed keyword; no mouse required |
| Boss armor phase | Readable name, health and stacked armor; normal target interaction |
| Boss stagger | Armor-break cue, ten-second timer; rolling paragraph replaces skill cards; real damage feedback |
| Pause | Frozen world, Resume/Settings/Exit controls, visible preserved input and focus recovery |
| Results | Survival time, level, build, kills, gold, WPM/accuracy and best comparison; restart reachable by keyboard |
| Dojo | Candlelit training room, dummy, Sensei and lesson objective; editable practice paragraph and useful existing settings |
| Multiplayer browser/lobby | Dungeon theme, actual room membership/status, mode/rules/roles, ready state and connection errors |
| Castle Sprint | Knights/course, position strip, laps/distance/WPM and tactical stream |
| Bridge Clash | Bridge/knights, per-player HP/shield/points and attack/defense target cues |
| Co-op Raid | Boss layers, role status, team WPM, downed/revive state and tactical typing |
| Settings/account | Same panel/type system, native form semantics, clear save/auth state and errors; preserve existing data |

Every screen is required for visual review. Unavailable modes must say so until their real-client gate passes.

## Keyboard ownership

Capture gameplay keys only while the run owns focus. Tab switches skills only in the active arena; normal Tab navigation works in title, forms, dialogs, lobby and paused UI. Escape pauses/leaves nested mode predictably; browser shortcuts remain usable. Prevent repeated keydown from auto-completing words. Never install a global capture that makes menus unreachable.

Provide a native input/IME and touch fallback that feeds the same domain input events, with composition handled once. The direct-key path and fallback must not double-submit. When dialogs/auth inputs are open, gameplay is paused and receives no characters. Returning from a dialog restores the previous valid focus and state. Instructions explain case sensitivity and how to cancel an accidental target.

## Label placement

Project domain positions into screen space through typed renderer events. React owns text and measured bounds. Stable entity IDs bind labels to targets. Keep active target first; place other labels in bounded non-overlapping slots with short leader lines when displaced.

Reserve safe areas for HUD, skill cards and boss paragraph. Try bounded alternate offsets rather than shrinking text indefinitely; if six labels do not fit, show four. Handle same-prefix selection explicitly. On compact screens, promote the active word to a reserved nearby rail while keeping its target marker visible. Hidden/offscreen labels cannot receive initial target input.

Clamp to safe viewport bounds, use ResizeObserver/layout updates outside the hot simulation tick, and update projections at a bounded rate. Browser assertions must measure actual label rectangles, including long ID elite words, captions and font loading. Enemy motion must not cause incessant reflow or word reassignment.

## Responsive and reduced-effects behavior

Desktop presents a wide isometric arena. Portrait compacts HUD into named groups and uses four labels; touch keyboard is optional and must leave an arena reading area. Landscape reserves a narrow side area for controls only when needed. No game-critical text is clipped under browser chrome, notches or the keyboard.

Reduced Effects removes bloom/shake/ambient particles and limits idle motion; discrete damage, dash destination and target/phase changes remain visible. Pause/hidden tabs suspend gameplay and rendering; visibility return resumes paused with explicit acknowledgement so no catch-up damage occurs.

Boss/Dojo paragraphs use rolling readable rows with an explicit caret and preserved word boundaries. Normal Endless never inherits the old large fishing passage. Do not add a permanent decorative QWERTY overlay on desktop; offer it only as an input aid.
