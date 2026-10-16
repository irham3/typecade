# Dungeon encounters, supplies and CI coverage repair — 2026-10-16

Checkpoint PR #8 was merged into main at 9229079 while GitHub validation was pending, at the user's request to defer tests. Its subsequent coverage check failed. This revision restores the unchanged 100% global thresholds and adds the requested follow-up gameplay.

## Implemented behavior

- Seeded per-spawn and per-type speed, skeleton sway, goblin weave/bursts, slow guards, flying bats, hovering ranged mages and minotaur/boss windup/committed charge/recovery. Mage line-of-sight and projectile wall collision remain in headless rules.
- Distinct typed shield, health bottle, mana crystal and sentry pickups. Actual shield absorption, one 18-second stationary attacking tower, prefix-preserving tower shots, visible shield gear/auras, active relic motes, supply/relic HUD and authoritative party shields.
- New-run Indonesian vocabulary/selector, louder music bus without overwriting mute/master settings, and compatible validated defaults for old dungeon checkpoints.

## Current-source verification

`npm run test -- --coverage`: **176 passed across 25 files**, **100% statements 4260/4260, branches 3855/3855, functions 663/663 and lines 2322/2322**. No threshold, exclusion or coverage-ignore workaround was added. Repeated audio gesture/resume/mute/state transitions, actual cue families, voice budgets, creature steering, shield/tower outcomes, save validation, equipment rendering, labels and shared controls are exercised.

Production build and dependency audit passed; npm audit reported zero vulnerabilities. Final lint/both TypeScript checks, the three-browser E2E matrix, Worker dry-run, timed production profile and GitHub check are recorded below when complete. Headphone/speaker loudness calibration remains unverified.
