# Typecade dungeon — art, motion and resource bible

Revision: 2026-10-15. Production target, not evidence of implemented assets or measured performance.

## Direction

Use the [supplied dungeon references](README.md#visual-references): elevated 3/4 orthographic castle ruins, blue armored knight, chunky outlined low-poly forms enlarged through a pixel rendering pass, warm torches against cool stone. Preserve silhouettes and depth rather than copying baked text or the reference images into a background.

Orthographic azimuth starts at 45 degrees, elevation 35.264 degrees above the ground. Adjust framing for visibility and compact layouts; gameplay readability wins over exact composition. Stone floor planes, broken walls, columns, rubble and moss create depth. Limit foreground wall height/fade so actors and words remain visible. No fishing water, lighthouse, rowboat, pine island, fish or sunset-sea palette in the completed dungeon.

## Palette and UI

| Role | Baseline color |
| --- | --- |
| Deep backdrop | `#10151f` |
| Slate panel | `#1b2230` |
| Stone midtone | `#4b4d56` |
| Readable cream | `#f3ead7` |
| Player / focus | `#55c9ef` |
| Torch / physical attack | `#f29b45` |
| Healing / completed input | `#83db75` |
| Armor / current character | `#edc763` |
| Damage / danger | `#e96861` |
| Curse / elite magic | `#b391e8` |

Validate text contrast in the rendered scene. Pixel heading font stays local with its SIL license; small text is readable monospace. UI glyphs share authored shapes/stroke weight. No generic emoji/icon packs, decorative dashboard charts or excessive glows. Dungeon identity reaches all shell pages, not just gameplay.

## Actor and prop manifest

- Blue knight with oversized helm, visor, pauldrons, boots and readable sword; blue/red/green/yellow variants share geometry/material palette for multiplayer.
- Skeleton with distinct skull/ribs, goblin with ears/green silhouette, shielded variation, bomber with visible fuse, mage with robe/staff/projectile.
- Elite minotaur and larger Obsidian boss with horns, armor landmarks and staged armor removal.
- Wooden dummy with layered target body and Sensei with robe/staff for Dojo.
- Floor/wall/column/rubble modules, torch/candle, explosive barrel, chest, bridge/course obstacle.
- Green/blue/purple XP gems, gold coin and mana crystal, each identifiable without text.

Prefer procedural shared primitives and small authored geometry; reuse existing palette/merge/resource-lifecycle techniques, not fishing models. If a file-based model/texture becomes necessary, add only the used asset with source/license and tested disposal. Never add entire packs speculatively.

## Life and feedback

| Element | Required motion / feedback |
| --- | --- |
| Knight | Breathing/weight shift, articulated gait, anticipation, dash lean, sword arc, recovery and hit recoil |
| Trash | Independent gait phase, target pursuit, attack tell, knockback and short death reaction |
| Shields/elites | Layer crack/shatter, heavy impact, distinct surviving next-layer state |
| Bomber/mage | Fuse countdown/cast tell, real timed projectile or explosion outcome |
| Boss | Heavy gait, armor break, kneel/stagger, phantom slash reactions and defeat |
| World | Torch/candle flicker, restrained embers, occasional local dust; layered parallax through geometry |
| Loot | Small bob/spin, pickup arc to player, streak magnet sweep |
| Skills | Local sword ring, readable storm/freeze, healing/aegis with distinct silhouettes |

Motion reacts to actual domain events. Avoid identical synchronized loops, constant camera shake or particles covering words. No static screenshot background pretending to be a world. Respect pause, Reduced Effects and hidden-tab suspension.

## Sound

Reuse compatible short project-owned typing/confirmation effects after listening review. Retire ocean ambience, splash, catch, escape and expedition music with their callers. Dungeon sounds need sword impact, armor break, magic, heal, gem pickup, torch room tone, boss stagger/death and run result. Prefer native Web Audio synthesis where suitable; no new audio library. Sounds unlock after a gesture, have category volume/mute controls and bounded voices, and are released on scene exit.

## Resource budgets to validate

These are initial engineering caps, not measured results. Changing them requires recording profiling evidence.

| Resource | Starting budget / policy |
| --- | --- |
| Simulation | Fixed 30 Hz; timestamped input applied promptly; clamp catch-up after stalls |
| Presentation | Target 60 FPS on measured desktop; adaptive 30 FPS fallback, no 120 FPS promise |
| Drawing buffer | Adaptive pixel target up to 640 × 480, DPR capped at 1 initially |
| Dungeon | Recycle a 3 × 3 chunk ring; chunk layout starts at 32 × 32 tiles with instanced/merged geometry |
| Active enemies | 128 including one boss; shared geometry, bounded actor state |
| Visible target labels | 6 desktop / 4 compact; prioritize active target |
| Loose loot | 256, merge same-kind nearby value without losing rewards |
| Projectiles / transient effects | 64 projectiles, 128 particles, 16 damage texts; recycle/drop cosmetic overflow |
| Materials / textures | Palette-shared; no texture per actor; account explicitly for any new atlas |
| Draw calls | Target at most 120 crowded desktop / 80 fallback; measure renderer.info |
| Audio | At most 8 one-shot voices plus 2 ambient/music loops |
| Post-processing | One small pixel/edge pass by default; selective glow only after profiling |

Screen-space glow, emissive color and short additive effects may supply the look without an expensive global bloom chain. Do not automatically stack RenderPixelatedPass and UnrealBloomPass simply because the source blueprint mentions them. Instancing/pooling must preserve articulated or otherwise readable actor animation.

After warmup, live entities/geometry/material/texture counts must plateau within caps. A repeated-navigation GC check targets less than 8 MiB retained heap growth after six cycles; record browser support and baseline variance. Profile a full 15-minute run, crowded boss phase, reduced-effects mode and WebGL context recovery. Report p50/p95 frame times and hardware; low-end physical phones and WAN capacity remain unproven until measured.

## Measured calibration

The [verification record](verification/dungeon-2026-10-16/README.md) contains hardware-labelled 900-second and final-build follow-up reports. The original long session measured render p95 18.0 ms on Radeon 860M. The final short capped scene remains 44 calls / p95 18.0 ms; Reduced Effects is 42 calls / p95 34.9 ms after avoiding clean-frame scheduling delays. These are local measurements, not a universal frame-rate guarantee or low-end phone calibration. Live entity limits stay unchanged.
