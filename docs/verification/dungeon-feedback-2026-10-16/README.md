# Damage, opening and combat-training verification - 2026-10-16

This revision follows `abb85ed` on `refactor/roughlike-survival-2.5d`. Earlier visual captures and measurements remain in their original folders and do not establish the performance of this source.

## Scope

- Dedicated actual-hit feedback: local armor emission, red impact ring, short edge response, recoil and truthful lost-HP text. Loading a lower-HP snapshot without a new negative damage cue does not fabricate a hit.
- Two initial foes and two optional objects, four-threat opening cap for 90 seconds, six threats until three minutes, twelve until the first boss, slower initial movement and gradual new-enemy speed, with prompt target refill. Normal recurring bosses, XP, upgrade costs and endless progression remain.
- Gold diamond loot labels and orange explosive labels use text/icon/borders; enemy labels retain armor bars. Exact segment/rectangle reachability closes a corner-cutting hole in the former sampled path test.
- Real level-up and acquisition pulses, rank changes on draft cards, applied-upgrade benefits, and honest capped-restoration copy.
- Seven optional, replayable EN/ID combat lessons using real headless rules in an isolated session. Visible Skip tutorial from step one; Shift+Tab controls, Enter to advance, standard pause/resume, Dojo/pre-run/main-menu entry. Training does not write or replace the survival checkpoint.
- Shared stone/steel/brass controls, pressed buttons, short panel/card entrances and Reduced Effects across title, Dojo, lobby, settings, account and result pages. No new dependency, downloaded art or second renderer.

## Seeded balance checks

The existing 30 Hz fixture types at 20/50/90/130 nominal WPM, heals when low and prefers active-skill upgrades; it does not use offensive skill keywords. These accelerated results are not renderer measurements or a guarantee of human difficulty. Explicit tests also assert the opening/learning/pre-boss threat limits and that four labels refill on reachable floor.

| Input | Survived | Level | Kills | Biomes | Peak enemies / loot | Measured run WPM |
| --- | --- | --- | --- | --- | --- | --- |
| 20 WPM | 215 s | 10 | 128 | 0 | 13 / 12 | 18 |
| 50 WPM | 335 s | 13 | 253 | 0 | 14 / 7 | 43 |
| 90 WPM | 935 s | 22 | 1,957 | 2 | 10 / 14 | 77 |
| 130 WPM | 960 s | 23 | 2,544 | 3 | 9 / 15 | 117 |

The earlier 20 WPM fixture survived 51 seconds. Changing the director also changes later seeded draws/builds, so these figures are a tuning signal, not a controlled claim that every human run lasts longer.

## Verification

Before the adaptive-audio revision, `npm run test -- --coverage` passed 167 unit/browser tests across 24 files, with unchanged 100% global coverage gates: 3,720 statements, 3,217 branches, 626 functions and 2,038 lines. The tests cover both tutorial languages end to end, skip/replay/checkpoint isolation, renderer recovery within a lesson, real upgrade benefits, staged pressure caps, object/enemy label packing, actual damage versus a lower-HP snapshot, bounded effects and teardown. Lint, both TypeScript checks and production retirement/headless searches also passed at that pre-audio checkpoint. These results do not verify the later audio changes.

Chromium's focused tutorial checks pass, including native Shift+Tab to Skip and portrait/landscape controls. The subsequent full matrix was stopped on the user's explicit request to defer testing and continue audio implementation. It had reached Chromium case 9/60; no complete cross-browser result is claimed. Captures and the 900-active-second profile remain pending. No performance or human-difficulty claim is inferred from screenshots or accelerated simulation alone.

## Limits

Browser viewport tests do not establish physical-phone performance or human comfort at a specific WPM. JS heap is not whole-browser RSS or driver memory. Production deployment and account migrations are outside this revision.


## Audio implementation checkpoint

The adaptive score, state-driven effects and independent persisted bus controls were added after the coverage checkpoint above. `npx tsc --noEmit` and `npm run build` completed successfully for the revision; lint also completed successfully. The final lazy renderer chunk is approximately 414 KB / 104.4 KB gzip; audio adds no network-loaded asset. No automated suite was rerun after the user deferred testing. The audio fixture was updated for the new mixer, scheduling, voice caps, mute/visibility and disposal behavior. Headphone/speaker listening, browser audio routing and sustained resource behavior remain unverified. No new runtime dependency or downloaded audio file was introduced.
