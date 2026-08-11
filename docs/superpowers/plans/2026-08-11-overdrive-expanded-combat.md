# Overdrive Expanded Combat Execution Log

Goal: make Overdrive feel mechanically different from the previous typing loop by moving combat truth into the engine, exposing tactical target state to Pixi/React, making mistakes threaten the run, and wiring the post-MVP build/shop/glitch systems the user explicitly approved.

## Implemented slices

- Tactical target engine: visible targets now expose id, role, HP, attack timer, reward, statuses, traits, reward multiplier, and shortest unique prefix metadata.
- Combat truth source: per-character actions no longer fake item procs. Item attacks resolve on clean word completion from the same engine event that scores the word.
- Dirty-word pressure: rejected characters are stored in `typedBuffer`/`errorPositions`; backspace repairs the buffer without erasing `wordDirty`; dirty Zone 3+ submissions damage Core Integrity and can fail with `core_breach`.
- Home Row shield: Home Row now grants real shield charges, and Core damage consumes shields before damaging the Core.
- Overdrive transformation: full charge is separated from active Overdrive. Enter activates a three-clean-execution state; only active executions amplify score/actions.
- Score resolution trace: word completion records engine-resolved score factors and trace data for presentation.
- Scheduler fix: presentation scheduler drains only due beats and now sequences contact cue → rig clip → target hit inside the 90ms contact budget.
- HUD/rail feedback: target cues show tactical labels, timers, HP, reward, statuses, Core, shield charges, and Overdrive execution count.
- Expanded Keycaps: the full GDD Keycap manifest is present, including Copycat, Midas, Flow State, Time Dilation, Mirror, Palindrome, Favorite Letter, Command Infinity Key, The Typewriter, Overdrive Core, and related mechanics where they affect engine state.
- Shop/economy: duplicate owned Keycaps are blocked, early Rare/Legendary offers are gated, Better Odds modifies rarity odds, Discount modifies prices, Turbo Finish doubles eligible token rewards, and Copycat doubles the Keycap to its right.
- Firmware: Extra Slot, Discount, Extended Timer, Better Odds, and Macro Pocket are registered, saved, shopped, bought, and applied as permanent run upgrades.
- Glitches: Scrambler, The Censor, Speed Demon, Drunk Caret, The Leech, and KERNEL PANIC are registered; Speed Demon, The Leech, Inflation, Sudden Death, No Backspace, and KERNEL PANIC have engine effects.
- Challenge links: share payloads include deterministic challenge URLs, and `/overdrive?challenge=...&build=...` starts a matching challenge run with Keycaps, Macros, and Firmware.
- Failure diagnosis: Run Over now shows the exact failure reason, including Core breach.

## Verification

- `npx vitest run lib/engine/overdrive features/overdrive/presentation features/overdrive/canvas features/overdrive/components/__tests__`
- `npm run lint`
- `npm run build`
- `git diff --check`
