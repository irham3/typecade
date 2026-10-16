# Dungeon visual revision — 2026-10-16

Branch: `refactor/roughlike-survival-2.5d`. These are implementation captures, not the supplied art references. The previous [combat screenshot](../dungeon-2026-10-16/combat.png) and its performance report predate this revision.

## Presentation changes

- Shared chamfered character meshes with larger helms, readable visors, armor trims, broader boots and blades, distinctive skulls/goblin faces, and separate shoulder/weapon articulation.
- Eased dash travel, directional streaks, target-facing charge, alternating cuts, independent enemy gait, contact-ready poses, victim recoil/flash and short falling death poses, impact stars and brief reinforcement arrival rings. These are renderer poses; gameplay destinations, collision, HP and input timing remain authoritative.
- Dedicated tapered cyan slashes, wide amber CLEAVE, branched STORM bolts, green healing crosses/rings, armor sparks, pickup arcs and death fragments. Large bursts take priority over minor cues at the cosmetic cap. The domain's bounded cue history also retains the cast when 128 victims produce subsequent hit cues.
- Actual accepted room skills keep their cast identity in event history. Real peer attacks/skills, heal recipients, downed peers and raid boss timings drive the presentation. There are no simulated peers.
- Integer pixel scaling, depth-based outlines, closer framing, lower-contrast stone seams, small moss patches, ruin returns, wind-deformed banners, torch fixtures and local light pools. Four/six non-overlapping target labels remain readable with lighter backing.

## Word and encounter flow

Bilingual packs now have 32 words per trash kind, 20 per guard/elite/boss/bomber/mage kind, eight per object kind, 30 late trash words and four boss passages. Draw each armor layer from the correct difficulty pack, prefer words outside the last 24 generated layers, and retain this bounded history in backward-compatible version-1 checkpoints. Distinct initials and locked-prefix protection take precedence. Room streams vary ordinary verbs with an eight-word history while retaining special-action sampling and obstacle cadence.

After dashes the director aims for four reachable combat labels; missing targets shorten its normal countdown to 0.3 world seconds, up to three reinforcements per pass. Search 16 angles on a 6�8.5-unit ring for safe walkable, reachable, spaced positions. Never retire locked enemies or bosses; other pursuers beyond 18 units are retired. Normal spawn pressure was slowed to compensate for the faster refill. An empty queue announces reinforcements instead of displaying an unexplained blank. Arrow movement remains outside this revision; target choice and word completion control repositioning.

Accelerated seeded balance checks retain the existing bot policy (heal when low, active-upgrade preference, no offensive skill bot). These are domain results, not human difficulty claims:

| Nominal input | Survived | Level | Kills | Biomes | Peak enemies / loot | Measured run WPM |
| --- | --- | --- | --- | --- | --- | --- |
| 20 WPM | 51 s | 3 | 17 | 0 | 25 / 1 | 18 |
| 50 WPM | 321 s | 14 | 353 | 0 | 12 / 10 | 44 |
| 90 WPM | 639 s | 20 | 1,149 | 1 | 9 / 8 | 81 |
| 130 WPM | 960 s | 24 | 2,594 | 3 | 9 / 10 | 117 |

The 20 WPM fixture still reaches three levels but dies early; this is a remaining tuning signal, not proof of a comfortable beginner difficulty. Faster refill removes some idle time that previously lowered measured WPM. A separate real browser session below uses offensive skills too.

## Captures

Desktop captures use Chromium with the detected AMD Radeon 860M at 1440 × 900. The normal run uses actual keyboard input and an isolated local browser context; healing follows an actual enemy hit. Mobile captures use a 390 × 844 browser viewport, not physical-phone hardware.

- [Title](title.png), [arena](arena.png), [ordinary slash](slash.png).
- [CLEAVE](cleave.png), [STORM and chained barrels](storm.png), [HEAL](heal.png).
- [Dojo](dojo.png), [mobile Dojo](dojo-mobile.png), [mobile arena](arena-mobile.png).
- [Capture smoke metadata](visual-smoke.json).

## Verification

The revised source passes 157 unit/browser tests across 23 files. Coverage remains 100% statements (3,507), branches (3,045), functions (591) and lines (1,945), with the original global thresholds unchanged. Tests exercise actual WebGL geometry for skill identity, CLEAVE without a preceding dash, recoil/death lifetime, full-horde cue admission, reduced effects, burst/instance caps, party actions, raid warning/impact and teardown.

The final cross-browser, timed-profile and resource results are recorded below after their runs finish. Do not substitute the earlier revision's measurements.

## Limits

The game uses original procedural models and effects; visual quality remains a user-review judgement. Browser viewport tests do not establish physical low-end-phone performance. JS heap/resource counters do not measure whole-browser RSS or all driver memory. No production deployment, account migration, new runtime dependency or public asset download is part of this change. Audio synthesis is unchanged and has not been calibrated through physical speakers.
