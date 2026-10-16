# Dungeon verification — 2026-10-15/16

Branch: `refactor/roughlike-survival-2.5d`. These files are evidence of the implementation, outside public game assets. Reference JPGs are not used as evidence.

## Timed profile

[Raw report](profile.json) was captured from a production preview with `npm run profile:dungeon`. Chromium used the detected AMD Radeon 860M through Direct3D11 at 1440×900 on Windows / Ryzen AI 7 350 / 31 GiB RAM. Headless automation with the real GPU is not a physical-phone benchmark.

The run accumulated 900 active simulation seconds in 936 wall seconds, across six attempts and five deaths/restarts. The bot typed visible words and draft choices through real key events. It did not cast healing; its observed typing was limited by target availability/automation and is not the configured-speed headless balance bot. It never reached a natural boss in a single attempt. Boss mechanics/continuation are tested separately with deterministic runs and browser fixtures.

| Scenario | Render interval p50 / p95 | Drawing / allocations |
| --- | --- | --- |
| Natural survival session | 16.7 / 18.0 ms, 54,022 render samples | Max 26 sampled calls; 47–48 geometries; two textures |
| Synthetic capped boss | 16.7 / 18.0 ms | 44 calls; 128 enemies, 256 loot, 64 projectiles, 128 effects |
| Reduced capped boss | 33.3 / 35.1 ms | 42 calls; one texture; no outline pass/particles |

The capped fixture is a separate overload test, with intentionally long-lived cosmetic effects; it is not a natural 128-enemy playthrough. Render intervals are measured once per animation frame with a WebGL clear probe; RAF intervals are reported separately. Pause/draft rendering is excluded from render samples. This is one-machine evidence, not a universal FPS guarantee.

Thirty regular-play samples stayed within all entity caps. GC heap ranged from 7,628,976 to 9,252,960 bytes; the profiling arrays also retain timing samples. Six mode-navigation cycles after warmup retained 341,904 bytes (0.326 MiB). Resource-count checks and explicit disposal cover geometry, material, audio, observer/listener and context lifecycle separately.

- [Natural session screenshot](survival.png)
- [Synthetic capped boss screenshot](crowded-boss.png)

## Deterministic balance

`survival-soak.test.ts`, seeds `balance-{wpm}`, 30 Hz simulation, typed healing when low and active-upgrade preference. These are accelerated domain simulations, not renderer profiles.

| Nominal input | Survived | Level | Kills | Biomes / bosses beaten | Peak enemies / loot | Measured run WPM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 WPM | 188 s | 8 | 98 | 0 | 38 / 9 | 18 |
| 50 WPM | 331 s | 13 | 261 | 0 | 23 / 17 | 38 |
| 90 WPM | 960 s | 20 | 1194 | 2 | 36 / 9 | 67 |
| 130 WPM | 960 s | 20 | 1213 | 3 | 14 / 5 | 93 |

Measured run WPM includes active waiting/casting time. The test also validates restore, unique target initials and wall routing. It does not infer human difficulty from automated success.

## Current regression evidence

Coverage: 148 tests / 22 files, all four metrics 100%, unchanged gate. Transactional SQL ownership/conflict/validation checks pass against the additive dungeon schema; QA writes roll back. npm audit reports zero vulnerabilities and Worker deploy dry-run succeeds. The 48-case production regression matrix passes across Chromium, Firefox and WebKit. Three additional cross-browser background-focus regressions cover the later input recovery fix. Lint, both TypeScript checks, build and retirement/headless audits pass. Source references remain byte-identical and all three public asset URLs return 200.

Physical low-end mobile performance, WAN capacity, native email delivery, physical audio calibration and human playtesting remain unmeasured. The full browser suite uses real independent local clients; that is distinct from a WAN/load claim.

## Final build follow-up

[Separate short report](profile-followup.json) covers the final bridge torches, input-focus recovery and Reduced Effects scheduling follow-up. It runs five active seconds, the same synthetic capped fixture, and six navigation cycles; it does not replace the 900-second report above. Final render p95 is 18.4 ms for the short natural sample, 18.0 ms for the crowded fixture and 34.9 ms for Reduced Effects. Navigation retains 291,684 bytes (0.278 MiB). JS heap and allocation counts are not whole-browser RSS or total driver memory.

The final shared-input regressions run as `npx playwright test e2e/focus.spec.ts`: three pass across Chromium, Firefox and WebKit. They exercise background clicks in Endless and a real room, then verify normal menu/form focus. The full 48-case matrix predates that narrowly scoped focus fix; the entire 148-test unit/browser suite and 100% coverage were rerun afterward. Reduced Effects scheduling is additionally exercised by the real WebGL lifecycle test and the final-build profile.

Implementation screenshots from the full matrix:

- [Title](title.png) and [Endless combat](combat.png)
- [Bridge Clash](bridge-clash.png) and [Co-op Raid](coop-raid.png)
- [320px combat](combat-320.png), [Dojo](dojo-320.png) and [multiplayer](race-mobile-320.png)
- [Coverage counters](coverage-summary.json)

All three production retirement/headless audits return no matches. Public icon/font/license requests return 200; active local documentation links resolve. Historical user data and source inputs remain intact. A manual cleanup of two optional development artifacts was rejected by automatic approval review with “blocked by policy”; the ignored artifacts are not game-bundle dependencies. See the migration log for exact names and scope.
