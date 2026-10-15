# Typecade Ocean Art Bible

Current direction: sunset pixel 2.5D, authorized 2026-10-15. This replaces the former side-on cutaway and bitmap menu direction. The reference is the user's elevated three-quarter fishing scene with a rowboat, an angler, a lighthouse island and a visible shoal.

## World

Three.js renders actual low-poly geometry with an elevated orthographic camera. The world includes a red-and-cream lighthouse, tiered pine trees, a wooden pier, faceted rocks, a plank rowboat, a fisherman in a brown hat and warm jacket, a curved rod and its fishing line. All gameplay models are built from small shared primitive geometries; static parts are merged by palette color.

Water has bounded geometric waves, triangular color facets, moving sunlight glints and foam. Warm sand, ochre wood, muted pine green, coral fish and blue-green water share one sunset light direction. A small render target is enlarged with nearest sampling; a three-sample edge pass reinforces object outlines. There are no bitmap coast plates, sprite atlases or baked-text button assets in the runtime.

## Life and feedback

- The hull bobs and rolls with the same wave function used by the sea.
- The angler breathes and reels; his arm, rod bend and fish lift respond to typing.
- Six fish swim with articulated tails and independent drift. Armor, predator and long-body profiles alter their silhouettes. The active boss has a crown landmark.
- Pine trees sway about their trunks; seabird wings flap; shore foam breathes with the tide.
- Hook, clean-word, typo, skill, guard, catch and level events trigger bounded feedback. Caught fish arc toward the boat; escaping fish leave the scene.
- Pause freezes the world. Hidden tabs stop work. Reduced Effects stops ambient animation, outlines and splashes while still displaying discrete encounter changes.

## UI

React owns all live text, input, menus, settings, collection and account dialogs. Every page uses square pixel corners, a dark teal ink border, muted green panels, cream type and ochre selected controls. Headers use the locally bundled Press Start 2P font; passages and small labels use a readable monospace font. Green means completed input and yellow means the active character. Typo feedback retains red and a non-color cue.

UI glyphs and collection illustrations are small authored SVG shapes, not a separate icon library. The Multiplayer rowboat is an authored isometric SVG in the same palette. Practice and Multiplayer retain DOM presentation with a lightly animated sea treatment.

Three fixed school anchors are shared between the renderer and React. Names are attached to separate buttons and never placed inside the typing passage. A target is selectable before typing starts and locks on the first keystroke. The selected fish name is prominent on desktop. Mobile keeps the shoal visible between navigation and typing controls. Landscape dedicates the left column to the world and the right to typing, skills and the keyboard.

Word mode displays individual letter cells. Sentence and Passage modes use clipped rolling rows. The keyboard highlights the expected letter and keeps touch input and native IME support. Modals retain focus, Escape handling and explicit close buttons. Rarity remains text as well as color.

## Production and budgets

- Drawing buffer: at most 640 × 480, DPR 1; no multisampling or shadow maps.
- World animation: at most 30 FPS, with frame-independent elapsed time.
- Foam: 80 instances; splash pool: 64 entries; fish: six models.
- Materials and source primitives are shared. Static model parts are merged. GPU allocations are checked after the ten-species warmup and repeated encounters.
- Renderer and audio resources are disposed when Adventure is unmounted. Browser tests cover context-loss recovery and repeated navigation.
- Font and authored SVGs live in `apps/web/public/assets/sunset`. Compatible native MP3 effects remain under `assets/ocean/audio`; unused variants and duplicate OGG files are removed.
- The original image and sprite source packs are removed from the branch. Historical screenshots under `docs` remain verification records and are not runtime assets.

The 2026-10-15 migration entry records test evidence and any performance limits. Desktop browser measurements are not a substitute for profiling physical low-end phones.
