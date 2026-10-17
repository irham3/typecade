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

Validate text contrast in the rendered scene. Pixel heading font stays local with its SIL license; small text is readable monospace. UI glyphs share authored shapes/stroke weight. Use the same stone/steel/brass panel and button edges across title, Dojo, lobby, settings, account, drafts and results. Buttons press into their bevels; entry/card transitions are short and respect Reduced Effects. No generic emoji/icon packs, decorative dashboard charts or excessive glows. Dungeon identity reaches all shell pages, not just gameplay.

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
| Knight | Breathing/weight shift, articulated gait, anticipation, dash lean, sword arc, recovery, actual-damage armor flash/red ring/edge/lost-HP response and hit recoil |
| Progression | Golden level pulse, frozen draft entrance, current/next rank, separate acquired-upgrade pulse and benefit text |
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
| Drawing buffer | Integer pixel scale (at least 2 CSS pixels), up to 960 × 640 by default; 640 × 480 adaptive and 480 × 360 Reduced Effects; DPR 1 |
| Dungeon | Recycle a 3 × 3 chunk ring; 32 × 32 world units per chunk, 256 two-unit flagstones and at most 192 ruin pieces per chunk |
| Active enemies | 128 including one boss; shared geometry, bounded actor state |
| Visible target labels | 6 desktop / 4 compact; prioritize active target |
| Loose loot | 256, merge same-kind nearby value without losing rewards |
| Projectiles / transient effects | 64 projectiles (three shared trail segments each); 24 live VFX bursts, 128 spark instances, 24 sword arcs, 24 ground rings, 32 lightning ribbons and 24 glow planes; 16 ambient embers and 16 short death poses; cosmetic overflow drops minor cues first |
| Materials / textures | Palette-shared; no texture per actor; account explicitly for any new atlas |
| Draw calls | Target at most 120 crowded desktop / 80 fallback; measure renderer.info |
| Audio | At most 8 one-shot voices plus 2 ambient/music loops |
| Post-processing | One small pixel/edge pass by default; selective glow only after profiling |

Screen-space glow, emissive color and short additive effects may supply the look without an expensive global bloom chain. Do not automatically stack RenderPixelatedPass and UnrealBloomPass simply because the source blueprint mentions them. Instancing/pooling must preserve articulated or otherwise readable actor animation.

After warmup, live entities/geometry/material/texture counts must plateau within caps. A repeated-navigation GC check targets less than 8 MiB retained heap growth after six cycles; record browser support and baseline variance. Profile a full 15-minute run, crowded boss phase, reduced-effects mode and WebGL context recovery. Report p50/p95 frame times and hardware; low-end physical phones and WAN capacity remain unproven until measured.

## Measured calibration

The original measurements below predate the 2026-10-16 visual revision. New evidence belongs in `verification/dungeon-visual-2026-10-16`; do not use the original 44-call result as the revised renderer's budget measurement. The visual revision adds chamfered character forms, independently posed arms, tapered sword trails, differentiated skills, short death poses, depth-based outlines, two small procedurally authored textures, ruin returns, wind-deformed banners and torch fixtures, spawn rings and brief impact stars. These replace the earlier one-box-per-event effects. Contact damage, HP, dash destinations and XP rules are preserved. Word pools and the spawn director now follow the revised game design; the bounded word history is backward compatible with version-1 saves; room events now preserve the accepted cast's skill name, and the effect-history cap retains cast cues during full-horde hits.

The [verification record](verification/dungeon-2026-10-16/README.md) contains hardware-labelled 900-second and final-build follow-up reports. The original long session measured render p95 18.0 ms on Radeon 860M. The final short capped scene remains 44 calls / p95 18.0 ms; Reduced Effects is 42 calls / p95 34.9 ms after avoiding clean-frame scheduling delays. These are local measurements, not a universal frame-rate guarantee or low-end phone calibration. Live entity limits stay unchanged.

The later onboarding/damage revision is verified separately in `verification/dungeon-feedback-2026-10-16`. It retains the VFX instance caps, adds one shared hero material for local damage emission, and uses the existing post pass for the edge response. The optional tutorial shares the renderer and headless rules; it never allocates a second WebGL canvas or writes a run checkpoint.


## Adaptive audio revision, 2026-10-16

The dungeon uses an original locally synthesized D-minor score at 112 BPM: eight bars of changing harmony and melody, soft pad/bass in menu and Dojo, beat-aligned percussion/ostinato layers under nearby threats, low brass for a live boss, and reduced lead plus a double heartbeat at 34% HP or below (party threshold: 30/100). Drafting keeps a quiet bed so the level fanfare completes. Defeat stops the score and plays a descending phrase; boss defeat has its own victory fanfare. Filtered noise supplies subdued torch/wind texture and crackle. These are synthesized character cues, not recorded monster voices or an orchestral soundtrack.

Actual events select distinct swing, cleave, armor, hurt, creature, death, explosion, loot, magnet, chest, heal, level and upgrade sounds. Nearby creature chatter is limited globally to one cue per 650 ms and per kind to one per 1.4 s; normal repeat cues have 100 ms cooldowns. Minor cues vary pitch slightly. Music ducks to 0.38 gain beneath major cues and releases gradually. Three persisted controls set Master, Music & ambience, and Sound effects; existing settings retain their master value and default missing bus values to 0.7/1.0. Master defaults to the existing 0.28. A master compressor and conservative bus gains provide headroom; this is not a measured LUFS or speaker-calibrated result.

Audio is created only after a gesture. One 40 ms audio-clock scheduler looks ahead 140 ms and skips missed time rather than replaying a backlog. Hard cap: 40 scheduled/live source voices total, with bus caps of 22 music, 20 effects and 2 ambience. Major feedback may evict lower-priority voices within those bounds; minor swarm chatter drops at capacity. One mono one-second noise buffer is shared (192 KB at 48 kHz). Hidden tabs, paused gameplay, context loss and mute stop sources/timer and suspend the context; renderer teardown disconnects all buses, closes the context and releases the buffer. No external audio assets or library are added. Actual listening and timed hardware profiling remain deferred at the user's request.


## Readable equipment and differentiated enemy motion

Shield pickups use a cyan kite silhouette; health is a red glass bottle with a cream cross; mana is a faceted blue-violet crystal; sentry equipment uses a gold/steel base, column and visible barrel. Supply labels name the actual benefit and have no enemy armor bars. Supply collection is a use/equip action, represented in the HUD with collected/use count or active/expired status. A real carried shield and shield-hit aura correspond to remaining shield HP; offensive relics show up to four small orbiting gems. One stationary sentry mesh and its endpoint beam represent real simulation shots. Party shields use only authoritative room shield values.

Bats have separate wing meshes and flight height; mages hover without walking legs. Ground actors retain distinct gaits and seeded steering. Charge windup commits a visible orange ground lane; mage cast warnings use violet floor markers. Reduced Effects keeps silhouettes, stationary shield/orbit indicators, active tower and static warning lanes readable. Five extra actor types reuse the existing instanced batching and shared shape cache; one 12-instance orbital batch, one 128-instance warning batch, six party shields and one sentry mesh are bounded and disposed through the existing renderer lifecycle. Enemy, loot, projectile, corpse and transient VFX caps remain unchanged.

Music gain is increased from 0.65 to 1.55 relative to unchanged SFX, with a new music preference default of 0.85. Saved per-bus and master/mute settings remain respected. This is an implementation gain change, not a measured loudness claim.


## 2026-10-17 action readability and dressing

Primary strikes alternate authored slash, thrust and uppercut poses; a three-instance shared knight-body echo batch sells dash travel. Impacts linger briefly, death fragments are larger, body/limbs separate along bounded eased death poses, and major slam/blast/treasure cues receive priority in the existing 24-burst pool. Resource captions last up to 1.35 simulation seconds with a 1.25-second CSS rise/fade; numbers reflect actual healing/mana/absorption and include a heart glyph.

The 48-instance decorative weather batch and 18-instance architectural landmark batch recycle with the existing nine chunks. Seasonal palettes change every 120 active seconds, also offset by boss depth, without moving collision footprints. Reduced Effects removes weather/echo motion, retaining silhouettes, warnings and readable feedback. No new asset files, postprocessing passes or runtime libraries are introduced. Main menu uses an authored crossed-blade crest, forged frame/rivets and a high-contrast brass action; all controls retain keyboard focus.

## Active boss duel and weather correction, 2026-10-17

Replace the block-shaped weather with one transparent, double-sided plane batch: 18 fine rising ash/ember flakes, 32 small falling snowflakes, or 12 slower tumbling leaves. Anchor the field to world cells rather than carrying it with the player. Reduced Effects disables it. No dark spherical debris or new downloaded art.

Boss footsteps/chase and correct-input knockback are actual simulation positions. Word completion causes an actual short sidestep; the hero tracks the moving boss. A 24-instance authored wood/iron fence has posts, crossbars and visible damage pulses; foreground sections are lower for readability. At breach the same instances fall flat. Siege swings, wood-colored chips, a real HP meter and breach captions explain the horde pressure. One additional shared geometry/instance batch remains under the unchanged 120-call budget; final performance evidence must measure this revision.
