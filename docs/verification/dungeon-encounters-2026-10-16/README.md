# Dungeon encounters, supplies and CI coverage repair — 2026-10-16

Checkpoint PR #8 was merged into main at 9229079 while GitHub validation was pending, at the user's request to defer tests. Its subsequent coverage check failed. This revision restores the unchanged 100% global thresholds and adds the requested follow-up gameplay.

## Implemented behavior

- Seeded per-spawn and per-type speed, skeleton sway, goblin weave/bursts, slow guards, flying bats, hovering ranged mages and minotaur/boss windup/committed charge/recovery. Mage line-of-sight and projectile wall collision remain in headless rules.
- Distinct typed shield, health bottle, mana crystal and sentry pickups. Actual shield absorption, one 18-second stationary attacking tower, prefix-preserving tower shots, visible shield gear/auras, active relic motes, supply/relic HUD and authoritative party shields.
- New-run Indonesian vocabulary/selector, louder music bus without overwriting mute/master settings, and compatible validated defaults for old dungeon checkpoints.

## Current-source verification

`npm run test -- --coverage`: **177 passed across 25 files**, **100% statements 4262/4262, branches 3865/3865, functions 664/664 and lines 2323/2323**. No threshold, exclusion or coverage-ignore workaround was added. Repeated audio gesture/resume/mute/state transitions, actual cue families, voice budgets, creature steering, shield/tower outcomes, save validation, equipment rendering, labels and shared controls are exercised.

Production build and dependency audit passed; npm audit reported zero vulnerabilities. Final lint/both TypeScript checks, the three-browser E2E matrix, Worker dry-run, timed production profile and GitHub check are recorded below when complete. Headphone/speaker loudness calibration remains unverified.


The final renderer keeps flight altitude when frozen or Reduced Effects is enabled; its dedicated matrix assertions are included in the coverage figures above. The new equipment-reload E2E fixture initializes storage only once, preserving the checkpoint it is meant to exercise. Lint, app/server TypeScript checks, headless/retirement audits and Worker dry-run passed locally. The full browser matrix and current GitHub validation are tracked on [PR #10](https://github.com/irham3/typecade/pull/10); this source record does not claim a pending CI check passed. The prior request to defer timed hardware/listening work remains distinct from the subsequently requested CI verification.

Final interaction checks keep supply objects stationary under knockback and exclude them from limited lightning target admission, while barrel chains still leave support items unconsumed. Acquisition notices use a two-line clamp and reserve label space; targeted browser assertions verify the reserved desktop and landscape positions. The full 177-test coverage run and the two focused label checks passed for these final changes.


## Exact-case follow-up — 2026-10-17

Removed solo skill/draft and multiplayer skill input uppercasing. Every typing target now matches the displayed case; keyboard Caps Lock and modifier hints preserve usable uppercase entry. EN/ID rule tests reject lowercase/mixed-case commands without spending mana or applying upgrades; multiplayer tests reject lowercase sends; keyboard tests verify exact character output and modifier highlighting. The real tutorial E2E also checks lowercase rejection before the correct skill/upgrade.

Current local coverage: **179 tests / 25 files, 100% statements 4270/4270, branches 3875/3875, functions 665/665 and lines 2328/2328**. Full lint, both TypeScript checks and production build pass. Browser matrix is running and hardware/listening calibration remains unverified.

GitHub run 38908395817 passed coverage/build but failed 11 Firefox cases because the renderer could not initialize; all Chromium and WebKit cases passed. CI now gives the headed browsers an Xvfb display, retains all renderer assertions and uploads failures. Final CI completion is tracked on PR #10.
