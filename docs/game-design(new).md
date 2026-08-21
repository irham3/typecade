# Ocean Typing RPG - Product, Game, and Asset Design

Status: Draft for review  
Date: 2026-08-17  
Platform: Desktop-first web application, responsive for tablet and mobile viewing  
Working title: Ocean Typing RPG

## 1. Executive Summary

Ocean Typing RPG is a game world in which typing is the main interaction, not the entire product. The player returns because of fishing expeditions, roguelite builds, fish collection, progression, ranked competition, and seasonal events.

The product has two main pillars:

1. Adventure: a single-player fishing roguelite focused on strategy, collection, and progression.
2. Competition: real-time typing races against real players, beginning with ranked 1v1 and later expanding to 3-5 player races.

The recommended first public MVP contains two sequentially developed vertical slices:

1. Fishing Adventure: one location, nine regular fish, one boss, six temporary skills, and a basic collection.
2. Boat Duel: real-time 1v1, matchmaking, rating, match history, and a normalized competitive ruleset.

Treasure Dive, larger party races, additional oceans, a full aquarium, and Rocket Race are later milestones. Rocket Race should be a seasonal event so the main ocean identity remains coherent.

The visual reference may take inspiration from the atmosphere and clarity of event-based fishing games, but all characters, fish, layouts, icons, effects, names, and art must be original.

## 2. Product Vision

The product should feel like a fishing RPG whose combat mechanic is typing. It should not feel like a typing test with a decorative fish placed above a text box. "Endless" means the player can grind through repeatable, varied expeditions; an individual session still has a beginning and an ending.

The core emotional loop is:

```text
Explore
  -> Find a fish
  -> Fight through typing
  -> Catch or lose it
  -> Improve the current build
  -> Complete the expedition
  -> Add to the collection
  -> Upgrade and unlock
  -> Return for a harder run
```

Competitive play uses the same typing measurement foundation but removes progression advantages. Ranked victories should come from typing skill, consistency, and composure rather than hours spent grinding.

## 3. Design Pillars

### 3.1 Typing must feel physical

Every correct word should affect the world: the line tightens, water splashes, the fish moves closer, the boat accelerates, or the diver descends. A typo should also create an understandable physical response rather than only changing a number.

### 3.2 Strategy matters in Adventure

Fast typing is useful, but it is not the only way to succeed. Route selection, bait, temporary skills, equipment, timing, and risk management should allow a precise or strategic player to outperform a faster but careless player.

### 3.3 Ranked is fair

All gameplay-affecting upgrades are normalized in ranked. Cosmetics may carry over. Every competitor receives the same text seed and difficulty.

### 3.4 Collection creates attachment

Fish are named, animated, sized, graded, and recorded. Catching a rare fish should be more memorable than receiving a WPM number.

### 3.5 One engine supports many fantasies

Boat, Dive, and Rocket races share one Race Engine. Visual themes change, while progress, timing, validation, matchmaking, and results remain common systems.

## 4. Product Structure

```text
Ocean Typing RPG
|
+-- Adventure
|   +-- Fishing Expedition
|   +-- Fish Collection
|   +-- Aquarium (later)
|   +-- Equipment and Skills
|
+-- Compete
|   +-- Ranked Boat Duel (1v1)
|   +-- Treasure Dive Party (3-5 players, later)
|   +-- Leaderboards and Seasons
|
+-- Profile
    +-- Account Level
    +-- Typing Statistics
    +-- Match History
    +-- Achievements
```

## 5. Fishing Adventure

### 5.1 Run format

A Fishing Expedition is a branching roguelite run with three ocean zones. A normal run targets 12-15 minutes. Strong players may extend a run to roughly 20 minutes by selecting optional encounters.

Each zone contains:

- Two or three normal fish encounters.
- One event, shop, rest, or route choice.
- One temporary skill reward.
- One elite encounter or environmental challenge.
- A safe checkpoint at the zone boundary.

The third zone ends with a boss fish.

At each checkpoint, catches and resources from completed zones are secured. If the player fails in the next zone, only unsecured rewards from that zone are lost. The player may leave voluntarily at a checkpoint.

### 5.2 Before a run

The player selects:

- Fishing location.
- Rod and line.
- Bait.
- One starter skill or passive perk.

The location controls available species, vocabulary profile, environmental hazards, and difficulty. Bait changes encounter probabilities but never guarantees a rare fish.

### 5.3 Fish encounter

Each encounter is generated from a deterministic seed containing the fish, word sequence, behavior pattern, and reward parameters.

During the encounter:

- Correct characters advance the current word.
- A completed word adds reel progress.
- Consecutive perfect words build combo and skill energy.
- A typo does not erase completed text or move the cursor backward.
- An incorrect key is logged, but the target cursor stays in place until the correct key is pressed.
- A typo raises line tension and may damage line durability.
- A long pause lets an aggressive fish pull away or recover stamina.
- Active skills use number keys or clickable icons. Adventure text excludes numerical input in the MVP so these controls cannot conflict.

The player catches the fish by filling reel progress before line durability reaches zero or the encounter timer expires.

### 5.4 Performance model

Fish rarity is determined before the typing battle by location, bait, route risk, skills, and controlled randomness. Typing performance determines whether the fish is caught and the quality of the result.

```text
Catch success = progress completed before failure
Catch quality = accuracy + consistency + combo + encounter difficulty
Fish size = species base size * quality modifier * controlled variation
Reward = rarity * quality * route-risk modifier
```

WPM contributes to performance but does not directly lock beginners out of rare encounters. A player with moderate WPM and excellent accuracy can still earn valuable catches.

### 5.5 Fish behavior archetypes

| Archetype | Typing behavior | World feedback |
| --- | --- | --- |
| Calm | Short, steady words | Smooth pull and small ripples |
| Darting | Alternates short bursts and pauses | Sudden lateral movement |
| Armored | Longer words, reduced normal progress | Heavy line and impact sparks |
| Tricky | Similar spellings or punctuation | Feints and direction changes |
| Swarm | Many short targets | Multiple silhouettes around the lure |
| Predator | Pressure rises while idle | Charge, screen nudge, stronger splash |
| Boss | Several phases and mixed patterns | Phase transitions and cinematic attacks |

### 5.6 Failure and recovery

An encounter fails when line durability reaches zero or its time condition expires. The player consumes one spare line to continue the expedition. The run ends when no spare lines remain, the player abandons the run, or a mandatory boss encounter is lost.

Failure should be legible:

- The incorrect character flashes red.
- The line and tension meter react immediately.
- A short sound identifies the error without being harsh.
- The fish performs a struggle animation.
- The interface explains the numerical consequence after the action, not during it.

## 6. Roguelite Skills

Temporary skills reset at the end of a run. Permanent progression unlocks new skills for the random reward pool but should avoid pure numerical power inflation.

### 6.1 MVP skill set

| Skill | Type | Effect | Strategic purpose |
| --- | --- | --- | --- |
| Cast Net | Active | Instantly resolves or captures nearby small fish | Efficient farming |
| Steel Line | Passive | Ignores the first typo in each encounter | Accuracy safety |
| Sonar | Active | Reveals rarity and route rewards before choosing | Information advantage |
| Calm Current | Active | Slows fish pressure briefly, not the typing timer | Recovery window |
| Perfect Bait | Passive | Perfect-word streaks improve rare encounter odds | Rewards consistency |
| Reel Mastery | Passive | Every fifth perfect word grants bonus progress | Combo build |

Future skills may create archetypes such as net builds, precision builds, combo builds, rare-hunting builds, and defensive builds.

### 6.2 Balance rule

A skill should change a decision, timing window, or build interaction. Avoid upgrades that only add small percentages without changing play. Skills are fully active in Adventure and disabled or normalized in ranked modes.

## 7. Collection and Meta Progression

### 7.1 Permanent collection

Every first catch unlocks an entry containing:

- Species name and illustration.
- Rarity and habitat.
- Largest recorded size.
- Best catch quality.
- Number caught.
- Short lore description.

Duplicates may be sold for coins or converted into upgrade materials. The first copy is always retained in the collection record.

### 7.2 Account level

Account XP comes from completed expeditions, new discoveries, missions, and multiplayer participation. Levels unlock content rather than large universal stat bonuses.

Recommended unlocks:

- New ocean locations.
- New bait recipes.
- Additional skill choices.
- Cosmetic rods, boats, trails, and profile frames.
- Higher expedition difficulty tiers.

### 7.3 Economy

The MVP uses one soft currency and one crafting material. Do not add premium currency until the core game is proven fun.

- Coins: equipment, bait, rerolls, and cosmetic basics.
- Materials: targeted upgrades and skill unlocks.

## 8. Competitive Modes

### 8.1 Ranked Boat Duel

Ranked begins as a 1v1 real-time match against a real player.

Rules:

- A match lasts 60 seconds.
- Both players receive the same text seed.
- Correct validated characters move the boat.
- A typo causes a short loss of acceleration, not backward movement.
- The winner has the highest validated progress.
- Ties resolve by accuracy, then completion timestamp.
- Adventure equipment and skills have no effect.
- Results update matchmaking rating and seasonal rank.

The initial ranking ladder may use Bronze, Silver, Gold, Platinum, Diamond, Master, and Grandmaster. The displayed tiers are presentation; matchmaking should rely on hidden or precise numerical rating.

### 8.2 Matchmaking

The queue first searches close to the player's rating, region, and recent verified WPM range. It gradually widens the rating range to avoid excessive wait time. The server, not the browser, owns the countdown, text seed, accepted progress, finish order, and rating result.

### 8.3 Treasure Dive Party

After 1v1 is stable, the same Race Engine expands to casual 3-5 player matches. Players descend toward a treasure chest. Typo penalties become environmental events such as jellyfish stuns, currents, or seaweed slowdowns.

All finishers receive a reward. Placement controls the amount, while first place receives the strongest presentation and prestige reward. This mode may use light matchmaking but does not need Elo in its first version.

### 8.4 Rocket seasonal event

Rocket Race reuses the Race Engine but is released as a limited seasonal theme. A typo causes engine slowdown or temporary malfunction; the rocket never moves backward.

## 9. Shared Typing Engine

The Typing Engine is independent from fishing and race rendering. It accepts a text seed and input events, then emits validated progress and metrics. Backspace is ignored during gameplay because an incorrect key never advances the target cursor; it remains available in ordinary profile and account fields.

Responsibilities:

- Normalize supported characters.
- Track correct and incorrect keystrokes.
- Calculate WPM, raw WPM, accuracy, combo, and consistency.
- Emit word-complete, typo, combo, and passage-complete events.
- Produce a compact event log for server verification.
- Launch with an Indonesian content pack while supporting additional language packs without changing game logic.

For ranked, players are matched inside the same language queue and progress is based on validated characters rather than word count. The server validates believable timing, monotonic progress, text order, and rate limits. The client may predict movement for responsiveness, but server state decides the official result.

## 10. Architecture Recommendation

### 10.1 Client

- React and TypeScript for menus, profile, collection, settings, and accessibility.
- Vite for a lightweight development and build workflow.
- Phaser for the 2D game scene, sprite animation, particles, camera effects, tweens, and WebGL/Canvas rendering.
- A typed bridge between React UI and the Phaser scene. The bridge emits domain events rather than directly manipulating scene internals.

Phaser is recommended over building the game scene directly in React because it is designed for browser games and supports WebGL and Canvas rendering, animation, particles, input, and scene management.

### 10.2 Multiplayer server

- Node.js and TypeScript.
- Colyseus for authoritative match rooms, matchmaking, real-time state synchronization, and reconnect handling.
- One room instance per match.
- Server-side rating updates after a signed match result.

Colyseus is preferred over a collection of custom WebSocket handlers because its room and state model already matches isolated race sessions.

### 10.3 Persistent backend

- Supabase Auth for accounts.
- PostgreSQL for profiles, inventory, fish records, progression, ratings, and match history.
- Row Level Security for user-owned data.
- Object storage for content manifests or downloadable asset bundles if needed.

Supabase Realtime can support social presence and notifications. Competitive match authority should remain in Colyseus rather than being based only on database change subscriptions.

### 10.4 Suggested modules

```text
apps/web
  UI shell, Phaser host, input, presentation

apps/game-server
  matchmaking, race rooms, validation, rating results

packages/typing-engine
  text normalization, metrics, deterministic input rules

packages/game-rules
  fishing formulas, skills, rewards, race rules

packages/contracts
  shared schemas and network messages

packages/content
  fish, locations, words, skills, balance data
```

## 11. Visual Direction

### 11.1 Recommended style

Use stylized 2D fantasy-ocean art with clear silhouettes and painterly texture. The world should feel luminous and slightly magical, while typography and competitive information stay crisp.

The palette should not be only blue. Use:

- Cyan and teal for water.
- Coral red and magenta for living reefs.
- Warm gold for rewards and legendary catches.
- Sea green for common systems.
- White and near-black for readable typing states.

The interface should avoid copying the composition, icons, fish, or ornamental shapes of the MLBB event. It may share the broad fantasy of fishing but must establish its own visual identity.

### 11.2 Layered scenes

Each fishing scene uses five layers:

1. Distant sky, moon, island, or cavern.
2. Water body or underwater gradient.
3. Midground silhouettes and schools of fish.
4. Main encounter fish, line, lure, and gameplay effects.
5. Foreground foam, coral, particles, and interface.

Move the layers at different speeds for parallax. Add a subtle water distortion, drifting particles, light caustics, and slow color variation. The scene should continue moving even when the player is not typing.

## 12. Making Fish Feel Alive

Do not create a large frame-by-frame animation set for every species. Use a hybrid asset system.

### 12.1 Fish construction

Each fish is built from a clean transparent illustration with separable parts where useful:

- Body.
- Tail.
- Front and rear fins.
- Eye or emissive markings.
- Optional mouth, lure, horn, or armor.

Common fish can use a four-to-six frame sprite loop. Rare fish and bosses may use a lightweight bone or mesh rig.

### 12.2 Required animation states

Every fish uses the same state contract:

| State | Purpose |
| --- | --- |
| Idle | Breathing and hovering before interaction |
| Swim | Normal horizontal movement |
| Bite | Transition into the typing encounter |
| Struggle | Response to typo or high tension |
| Stunned | Response to a defensive or control skill |
| Caught | Final pull and reward reveal |
| Escape | Line break or encounter failure |

Not every species needs unique animation data for every state. Procedural modifiers can reuse the base state while changing amplitude, speed, rotation, squash, and particles.

### 12.3 Procedural life

Phaser can add inexpensive continuous motion:

- Sine-wave vertical drift.
- Tail oscillation tied to swimming speed.
- Slight body rotation toward movement direction.
- Eye blink on randomized intervals.
- Squash and stretch during strong pulls.
- Short hit flash and camera nudge on critical events.
- Small bubbles emitted near the mouth or gills.

Species personalities come from parameter presets. A pufferfish drifts and expands, a shark moves in decisive arcs, and an eel uses longer wave motion. This creates variety without producing dozens of unique frames.

### 12.4 Boss presentation

Boss fish receive:

- A short entrance animation.
- Three behavior phases.
- A unique silhouette and screen-space scale.
- One signature environmental VFX.
- Music intensity layers.
- A distinct catch and escape sequence.

## 13. VFX System

VFX should be event-driven and reusable. The game rules emit events; the scene decides how to render them.

| Game event | Visual response | Audio response |
| --- | --- | --- |
| Correct character | Tiny line pulse | Very soft tick, usually throttled |
| Perfect word | Splash arc and warm spark | Light confirmation tone |
| Combo milestone | Ring burst and brief glow | Rising accent |
| Typo | Red character flash, line snap, fish struggle | Short muted error cue |
| Skill ready | Icon charge and radial shine | Ready chime |
| Cast Net | Expanding net mesh and foam trail | Throw and water impact |
| Rare encounter | Color shift, particles, silhouette reveal | Rare sting |
| Line critical | Strong line vibration and warning pulse | Tension creak |
| Catch | Water burst, freeze-frame, reward light | Catch impact and reward sting |
| Escape | Line break, fish depth fade | Snap and distant splash |

### 13.1 Reusable VFX textures

The MVP only needs a small library of reusable grayscale textures:

- Soft circle.
- Sharp spark.
- Bubble.
- Foam droplet.
- Water streak.
- Glow ring.
- Smoke or underwater cloud.
- Lightning or tension line.

Tint, scale, rotation, blend mode, lifetime, and emission curves turn these textures into many effects. Phaser's particle emitters are suitable for bubbles, foam, glints, trails, and reward bursts.

### 13.2 Restraint rules

- Correct-character feedback must remain subtle enough for sustained typing.
- Typo feedback must be immediate but should not hide the target text.
- Camera shake is reserved for boss attacks, line breaks, and major catches.
- Effects behind the typing panel must reduce contrast automatically.
- Provide reduced-motion and reduced-flash accessibility settings.

## 14. Asset Inventory for the First Vertical Slice

### 14.1 Environment

- One Shallow Coast location.
- Three background variants for its zones.
- Five parallax layers per variant.
- One weather or time variation.
- One map-route background.

### 14.2 Creatures

- Six common fish.
- Three uncommon or rare fish.
- One boss fish, for ten species total.
- Three ambient silhouettes or schools.

### 14.3 Player equipment

- One player boat or fishing platform.
- Two rods.
- Two line styles.
- Three bait icons.
- One net asset.

### 14.4 Interface

- Typing panel and text states.
- Tension, durability, combo, and skill-energy meters.
- Six skill icons.
- Rarity frames.
- Collection cards.
- Route nodes.
- Reward and result panels.
- Keyboard and accessibility settings.

### 14.5 Effects and audio

- Eight reusable particle textures.
- Twelve authored effect presets.
- Roughly twenty short sound effects.
- One ambient ocean loop.
- One expedition music loop with a boss intensity layer.

## 15. Asset Production Pipeline

### 15.1 Art bible first

Before producing many fish, create one page defining:

- Silhouette language.
- Outline thickness.
- Shading method.
- Color palette.
- Camera angle.
- Texture density.
- Standard fish sizes.
- Rarity treatment.
- Export resolution and pivot conventions.

Approve one common fish, one rare fish, and one boss as quality targets before scaling production.

### 15.2 Recommended pipeline

```text
Reference board
  -> Original concept sketch or generated concept
  -> Style cleanup and paint-over
  -> Separate movable parts or draw animation frames
  -> Export transparent PNG frames
  -> Pack into texture atlas
  -> Attach metadata and animation states
  -> Test in Phaser at target size
  -> Profile memory and draw calls
```

Generated images are useful for concepts, mood, backgrounds, texture ideas, and initial fish designs. They should not be treated as final animation frames without cleanup because frame consistency, silhouettes, transparent edges, and part alignment require art direction.

### 15.3 Naming convention

```text
fish_<species>_<state>_<frame>.png
vfx_<family>_<variant>.png
ui_<feature>_<state>.png
bg_<location>_<layer>.webp
sfx_<event>_<variant>.ogg
```

Each fish has a content record containing its asset key, rarity, habitat, behavior preset, scale, pivot, animation timings, audio keys, and reward data. Game rules should reference content IDs rather than file paths.

## 16. Recommended Art and Animation Tools

### 16.1 Best MVP stack

- Krita or Photoshop: painting backgrounds and fish illustrations.
- Aseprite: small sprite animations and sprite-sheet export.
- TexturePacker: atlas packing, trimming, pivots, and Phaser JSON export.
- Figma: interface layout, icons, component states, and handoff.
- Phaser: final animation composition, procedural movement, particles, tweens, and camera feedback.

This approach has the lowest pipeline risk and does not require every fish to be fully rigged.

### 16.2 Rive

Use Rive selectively for interactive UI, animated badges, mascots, tutorial gestures, or one prominent hero creature. Rive provides web runtimes and state-machine control, but its runtime adds payload and another rendering pipeline. It is not recommended for every small fish in the MVP.

### 16.3 Spine

Use Spine later if production quality requires many large, reusable skeletal creatures or elaborate bosses. It has official runtimes for Phaser, PixiJS, WebGL, and Canvas, but integrating its runtimes requires complying with the Spine license and holding an appropriate editor license. It is powerful, but unnecessary for the first ten fish.

### 16.4 Custom asset generation

Codex can help generate original concept sheets, fish illustrations, backgrounds, icons, VFX texture masks, and implementation-ready prompts. The reliable workflow is generation followed by cleanup, layer separation, animation setup, and in-game testing. Codex can also build the Phaser scenes, typing engine, skill logic, collection screens, and multiplayer server.

## 17. Asset Sources and Licensing

### 17.1 Recommended sources

- Kenney: excellent for placeholder UI, input prompts, audio, and its Fish Pack. Kenney states that assets on its asset pages are CC0 and may be used commercially without required attribution.
- itch.io game assets: useful for ocean packs, UI, particles, music, and sound. Licenses vary per product, so record the license for every downloaded pack.
- OpenGameArt: useful for prototypes and audio, but licenses vary. Read the exact license and attribution requirements for every item.
- Custom commissioned or generated art: best for final fish identity and a coherent visual brand.

### 17.2 Asset register

Maintain an `ASSET-LICENSES.md` or structured asset register from the first day. Record:

- Asset name and source URL.
- Creator.
- License and purchase receipt.
- Attribution requirement.
- Whether modification is allowed.
- Where the asset is used.

Do not copy, trace, extract, or edit assets from MLBB or another commercial game.

## 18. Performance Budget

The desktop-first target should still run on ordinary integrated graphics.

Recommended initial budgets:

- One main Phaser canvas.
- Prefer texture atlases over many independent image requests.
- Keep active particle counts bounded and pool emitters.
- Load only the current location and common shared UI.
- Lazy-load boss, collection, and future-area assets.
- Use WebP or AVIF for opaque backgrounds and PNG/WebP with alpha for sprites as appropriate.
- Avoid multiple simultaneous Rive or Spine scenes during gameplay.
- Provide 60 FPS as the target and a reduced-effects mode for weaker devices.

Aseprite can export sprite sheets directly. TexturePacker can generate Phaser atlas data and compressed texture variants, which can reduce requests and GPU memory pressure when configured carefully.

## 19. Audio Direction

Audio is essential to making the scene feel alive but must not fatigue a typing player.

Use four layers:

1. Environment: waves, wind, bubbles, distant wildlife.
2. Interaction: cast, reel, line tension, splash, skill activation.
3. Typing feedback: very soft word-complete and typo cues, not a loud sound per key.
4. Music: calm expedition loop with intensity layers for rare fish and bosses.

Randomize pitch and select among two or three variants for repeated splashes and line sounds. Allow separate volume controls for music, environment, gameplay feedback, and typing sounds.

## 20. Content Data Examples

```json
{
  "id": "reef_shark",
  "name": "Reef Shark",
  "rarity": "rare",
  "habitat": "shallow_coast_zone_3",
  "behavior": "predator",
  "typingProfile": "medium_burst",
  "baseSizeKg": 38,
  "assetKey": "fish_reef_shark",
  "rewardTable": "shallow_rare"
}
```

```json
{
  "id": "steel_line",
  "name": "Steel Line",
  "type": "passive",
  "rarity": "common",
  "effect": "ignore_first_typo_per_encounter",
  "rankedAllowed": false
}
```

Content-driven definitions let designers add fish, locations, skills, and race themes without changing the Typing Engine.

## 21. Error Handling and Resilience

### 21.1 Adventure

- Autosave secured rewards at every zone checkpoint.
- Restore an interrupted run only when its content version is still compatible.
- Never grant rewards twice after refresh or reconnect.
- Keep deterministic seeds so a restored encounter remains consistent.

### 21.2 Multiplayer

- Allow a short reconnect window.
- Keep the match running under server authority during disconnects.
- Mark suspicious or impossible event streams for review and withhold rating changes when validation fails.
- Cancel without rating loss when a match cannot start fairly.
- Use idempotent result processing so repeated network messages cannot duplicate rewards.

### 21.3 Assets

- Display lightweight placeholders when optional cosmetic assets fail.
- Treat missing gameplay-critical manifests as a blocked scene load with a retry action.
- Version asset manifests to avoid stale browser caches.

## 22. Testing Strategy

### 22.1 Typing Engine tests

- Correct and incorrect character sequences.
- Backspace policy.
- Unicode and punctuation normalization.
- WPM, accuracy, combo, and consistency formulas.
- Identical deterministic results for identical event logs.

### 22.2 Fishing rules tests

- Tension and durability changes.
- Skill interactions and ordering.
- Reward security at checkpoints.
- Rarity and size boundaries.
- Boss phase transitions.

### 22.3 Multiplayer tests

- Two clients receive the same seed.
- Progress cannot move backward or exceed valid input.
- Reconnect behavior.
- Tie-breaking.
- Idempotent rating updates.
- Simulated latency and packet loss.

### 22.4 Visual tests

- Desktop and mobile viewport screenshots.
- Text never overlaps fish, meters, or buttons.
- Particle effects do not obscure the typing target.
- Canvas is nonblank after scene transitions.
- Reduced-motion mode removes shake and large bursts.
- Performance checks on integrated graphics and throttled mobile hardware.

## 23. Delivery Roadmap

### Milestone 0: Game-feel prototype

- One fish encounter.
- Typing Engine metrics.
- Tension, catch, and escape.
- One background and reusable particles.
- No account or persistent economy.

Success criterion: typing visibly and satisfyingly controls the fishing battle.

### Milestone 1: Fishing vertical slice

- One three-zone expedition.
- Nine regular fish and one boss, for ten species total.
- Six temporary skills.
- Checkpoints, rewards, and collection.
- Account and cloud save.

Success criterion: players voluntarily replay runs to complete the collection or try a different build.

### Milestone 2: Ranked Boat Duel

- Real-time 1v1 rooms.
- Matchmaking and rating.
- Server validation.
- Profile, history, and result presentation.

Success criterion: matches feel fair, responsive, and worth replaying.

Milestones 1 and 2 together form the first public MVP. Milestone 0 is an internal proof, and Milestone 2 should receive its own implementation plan after the Fishing vertical slice has validated the shared Typing Engine.

### Milestone 3: Treasure Dive Party

- Three-to-five-player casual rooms.
- Placement rewards.
- Environmental typo effects.
- Party/lobby flow.

### Milestone 4: Expansion

- Additional fishing locations.
- Full aquarium.
- Daily missions and achievements.
- Seasonal leaderboards.
- Rocket Race event.

## 24. Explicit Non-Goals for the First MVP

- Eight-player ranked matches.
- Guilds, chat, trading, or a player marketplace.
- Premium currency or loot boxes.
- Dozens of locations.
- Full skeletal animation for every fish.
- Mobile-native applications.
- User-generated text passages.
- Rocket Race at launch.

## 25. Key Product Decisions

- Adventure is Fishing, not an endless boat race.
- Adventure uses roguelite runs and strategic skills.
- Permanent collection and progression survive between runs.
- Ranked starts at 1v1 and uses real players.
- Competitive statistics are normalized.
- Multiplayer progress and results are server-authoritative.
- Treasure Dive is the first larger multiplayer mode.
- Rocket is a later seasonal skin for the shared Race Engine.
- The first art pipeline uses sprites, procedural animation, and reusable VFX.
- Rive and Spine are optional specialist tools, not mandatory dependencies.

## 26. Recommended Next Step

After this design is approved, create an implementation plan for Milestone 0 and Milestone 1 only. The first technical proof should establish the Typing Engine, one satisfying fish battle, and the asset pipeline before building persistent progression or multiplayer.

## 27. Official References

- Phaser documentation: https://docs.phaser.io/
- Phaser particles: https://docs.phaser.io/phaser/concepts/gameobjects/particles
- Colyseus documentation: https://docs.colyseus.io/
- Colyseus rooms: https://docs.colyseus.io/room
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Rive Web runtime: https://rive.app/docs/runtimes/web/web-js
- Rive state machines: https://rive.app/docs/runtimes/web/state-machines
- Spine runtimes and licensing: https://esotericsoftware.com/spine-runtimes
- Aseprite sprite-sheet export: https://www.aseprite.org/docs/sprite-sheet/
- TexturePacker Phaser workflow: https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser
- Kenney assets and licensing: https://kenney.nl/assets and https://kenney.nl/support
- OpenGameArt licensing FAQ: https://opengameart.org/content/faq
