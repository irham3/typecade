> Visual, motion, and audio spec for Overdrive. Gameplay lives in the GDD: TYPECADE: OVERDRIVE — Game Design Document v0.1. Requirements and tech stack live in the PRD: TYPECADE: OVERDRIVE — PRD & Tech Spec v0.1. Every number in this doc is an implementation value, not a suggestion. To change one, edit this doc first. No improvising in code.
> 

> Language policy: all docs and all product copy are English. Indonesian exists only as an optional typed word pool inside gameplay.
> 

# 1. Art Direction

References: Balatro (item and shop feel), Hades (character staging and hit readability), Into the Breach (compact tactical silhouettes), ZType (enemy drama), CRT arcade cabinets.

Five rules, in priority order:

1. 80% of the screen is dark and neutral. Neon is reserved for the active word, combat impact, quota, and build procs.
2. One dominant light source per moment: the active target. Environmental light remains at least two contrast steps below it.
3. Character motion communicates state: ready, attack, recoil, danger, defeat, or transition. Low-contrast world motion may establish depth but never becomes the focal point.
4. Max 1 glow layer per element. A second glow gets deleted.
5. Preserve silhouette and readability before adding detail.

## Original asset language: Signal Expedition — typing-driven arcade combat

- The visual identity combines original raster character/environment art with custom code-native **Typecade Glyphs**: key matrices, brackets, split stems, scan marks, and corrupted letterforms.
- The player is the **Keystone Warden**: a non-human mechanical sentinel with key-switch armor, an oversized keycap shoulder, a readable visor slit, and a forearm typing cannon. Its silhouette is broad, grounded, and angled toward the target.
- Warm-up targets are the **Packet family** (Packet Stalker, Cache Hound, Relay Ram), Rush targets are the **Needle family** (Needle Wraith, Vector Mantis, Spine Courier), and Glitch targets are the **Null family** (Null Crown, Crown Hand, Void Shard). Every variant has a distinct silhouette and remains recognizable at 96px.
- Character rendering style: premium stylized 3D source renders converted into modular 2D rigs, hard-surface cel shading, restrained material texture, graphic shadow shapes, and no photorealistic detail. Character art uses one orthographic side-facing three-quarter camera so attack direction remains obvious.
- Environment rendering style: cyber-industrial signal trench with layered relay towers, keyboard-plate architecture, cables, and controlled haze. It uses the same hard-surface painted language and contains no readable text.
- No cartoon proportions, cute faces, human protagonists, generic spaceships, mascots, clip art, emoji, photorealism, visual references to copyrighted characters, or unrelated asset packs.
- Generated assets must be original, stored under `public/overdrive/art/`, use versioned filenames, and include their prompt/source in `CREDITS.md`. Editable rig sheets use flat chroma-key backgrounds removed locally before packing.
- Item art uses one custom filled SVG family with a 24×24 viewBox, consistent optical weight, and no rarity color baked into the icon.

| Allowed | Not allowed |
| --- | --- |
| Thin glow on the active word and quota bar | Glow on labels, panel borders, static text |
| Particles on accepted characters and word completion | Bright ambient particles that compete with the active target |
| Scanline overlay during Glitch stages only | Permanent scanlines on every screen |
| One accent color per function (see tokens) | Multi-color gradients, lens flares, heavy bloom |
| Pixel font for the wordmark and screen titles | Pixel font for body text or HUD numbers |
| Slow low-contrast parallax, cable drift, and haze | High-contrast decorative loops or motion near the active word |

# 2. Design Tokens: Color

```css
:root {
  /* surface */
  --bg-0: #0A0E14;    /* gameplay canvas */
  --bg-1: #111623;    /* panel, card */
  --bg-2: #1A2030;    /* raised, hover, track */
  --border: #232B3D;  /* all 1px borders */

  /* text */
  --text-hi: #E8ECF4;  /* primary text, typed letters */
  --text-mid: #9AA3B5; /* secondary text, labels */
  --text-dim: #788296; /* upcoming words; passes 4.5:1 on gameplay surfaces */

  /* accent, one color = one meaning */
  --green:  #3BF562;  /* active word, quota fill, success, primary CTA */
  --pink:   #FF4D9D;  /* combo */
  --violet: #9D6BFF;  /* mult, floating score popups */
  --yellow: #FFC93B;  /* score, tokens */
  --red:    #FF3B3B;  /* typo, glitch, danger */
  --cyan:   #35D6E8;  /* info, macros */
}
```

Usage rules:

- One color, one meaning. Combo is always pink, mult is always violet, money is always yellow. No exceptions on any screen, including the share card.
- Accents only for text, icons, borders, and bar fills. Never as a large background area.
- Gameplay background is always plain `--bg-0`. Texture or noise capped at 0.03 opacity.

## Rarity colors

Used only on keycap slot borders, rarity badges, and shop prices.

| Rarity | Hex | Note |
| --- | --- | --- |
| Common | #8A93A6 | gray |
| Uncommon | #3BF562 | green |
| Rare | #9D6BFF | violet |
| Legendary | #FFC93B | gold |
| Macro | #35D6E8 | cyan, a type rather than a rarity |

Rarity is never color-only: always border + text label ("RARE") in tooltips and the shop.

# 3. Typography

Two fonts, no more:

- **JetBrains Mono** (400, 700): all gameplay text, numbers, UI, body. Fallback: IBM Plex Mono, monospace.
- **Press Start 2P**: wordmark, screen titles (SHOP, RUN OVER), and zone names only. Max 1 occurrence per screen.

| Role | Size | Weight | Note |
| --- | --- | --- | --- |
| Active word | 48px | 700 | `--green`, typed letters brighter than the rest of the word |
| Stream words (upcoming rows) | 28px | 400 | `--text-dim` |
| Timer and score | 32px | 700 | tabular-nums required, digits must not shift width |
| Combo/mult/base numbers | 24px | 700 |  |
| HUD labels (COMBO, MULT, BASE, SCORE) | 14px | 700 | uppercase, letter-spacing 0.08em, `--text-mid` |
| Body, tooltips, item descriptions | 16px / 1.5 | 400 |  |
| Smallest text (footer, credits) | 14px | 400 | absolute floor, no text below 14px |
| Screen titles (Press Start 2P) | 24px | 400 |  |

# 4. Layout and Spacing

- Character rendering style: premium stylized 3D source renders converted into modular 2D rigs, hard-surface cel shading, restrained material texture, graphic shadow shapes, and no photorealistic detail. Character art uses one orthographic side-facing three-quarter camera so attack direction remains obvious.
- Environment rendering style: cyber-industrial signal trench with layered relay towers, keyboard-plate architecture, cables, and controlled haze. It uses the same hard-surface painted language and contains no readable text.
- No cartoon proportions, cute faces, human protagonists, generic spaceships, mascots, clip art, emoji, photorealism, visual references to copyrighted characters, or unrelated asset packs.
- Generated assets must be original, stored under `public/overdrive/art/`, use versioned filenames, and include their prompt/source in `CREDITS.md`. Editable rig sheets use flat chroma-key backgrounds removed locally before packing.
- Item art uses one custom filled SVG family with a 24×24 viewBox, consistent optical weight, and no rarity color baked into the icon.

| Allowed | Not allowed |
| --- | --- |
| Thin glow on the active word and quota bar | Glow on labels, panel borders, static text |
| Particles on accepted characters and word completion | Bright ambient particles that compete with the active target |
| Scanline overlay during Glitch stages only | Permanent scanlines on every screen |
| One accent color per function (see tokens) | Multi-color gradients, lens flares, heavy bloom |
| Pixel font for the wordmark and screen titles | Pixel font for body text or HUD numbers |
| Slow low-contrast parallax, cable drift, and haze | High-contrast decorative loops or motion near the active word |

# 2. Design Tokens: Color

```css
:root {
  /* surface */
  --bg-0: #0A0E14;    /* gameplay canvas */
  --bg-1: #111623;    /* panel, card */
  --bg-2: #1A2030;    /* raised, hover, track */
  --border: #232B3D;  /* all 1px borders */

  /* text */
  --text-hi: #E8ECF4;  /* primary text, typed letters */
  --text-mid: #9AA3B5; /* secondary text, labels */
  --text-dim: #788296; /* upcoming words; passes 4.5:1 on gameplay surfaces */

  /* accent, one color = one meaning */
  --green:  #3BF562;  /* active word, quota fill, success, primary CTA */
  --pink:   #FF4D9D;  /* combo */
  --violet: #9D6BFF;  /* mult, floating score popups */
  --yellow: #FFC93B;  /* score, tokens */
  --red:    #FF3B3B;  /* typo, glitch, danger */
  --cyan:   #35D6E8;  /* info, macros */
}
```

Usage rules:

- One color, one meaning. Combo is always pink, mult is always violet, money is always yellow. No exceptions on any screen, including the share card.
- Accents only for text, icons, borders, and bar fills. Never as a large background area.
- Gameplay background is always plain `--bg-0`. Texture or noise capped at 0.03 opacity.

## Rarity colors

Used only on keycap slot borders, rarity badges, and shop prices.

| Rarity | Hex | Note |
| --- | --- | --- |
| Common | #8A93A6 | gray |
| Uncommon | #3BF562 | green |
| Rare | #9D6BFF | violet |
| Legendary | #FFC93B | gold |
| Macro | #35D6E8 | cyan, a type rather than a rarity |

Rarity is never color-only: always border + text label ("RARE") in tooltips and the shop.

# 3. Typography

Two fonts, no more:

- **JetBrains Mono** (400, 700): all gameplay text, numbers, UI, body. Fallback: IBM Plex Mono, monospace.
- **Press Start 2P**: wordmark, screen titles (SHOP, RUN OVER), and zone names only. Max 1 occurrence per screen.

| Role | Size | Weight | Note |
| --- | --- | --- | --- |
| Active word | 48px | 700 | `--green`, typed letters brighter than the rest of the word |
| Stream words (upcoming rows) | 28px | 400 | `--text-dim` |
| Timer and score | 32px | 700 | tabular-nums required, digits must not shift width |
| Combo/mult/base numbers | 24px | 700 |  |
| HUD labels (COMBO, MULT, BASE, SCORE) | 14px | 700 | uppercase, letter-spacing 0.08em, `--text-mid` |
| Body, tooltips, item descriptions | 16px / 1.5 | 400 |  |
| Smallest text (footer, credits) | 14px | 400 | absolute floor, no text below 14px |
| Screen titles (Press Start 2P) | 24px | 400 |  |

# 4. Layout and Spacing

- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Values outside the scale are banned.
- Radius: 8px everywhere, 6px for bars. No pills except rarity badges.
- Borders: 1px `--border`. Elevation via borders, not shadows. Shadows are banned in gameplay.
- Non-game content width (leaderboard, settings): max 720px, centered.
- Gameplay: full viewport, any aspect ratio, HUD elements pinned to the edges with 24px padding.

## Gameplay canvas composition tokens

Runtime screenshot acceptance overrides obsolete token values. Character visual height is measured from trimmed visible bounds, not atlas dimensions.

| Token | Desktop (width >=720px) | Compact (width <720px) |
| --- | --- | --- |
| Warden anchor | x 23.5%, y 62% | x 25%, y 59% |
| Target anchor | x 70.5%, y 60% | x 69%, y 57.5% |
| Target lane y: high / mid / low | 56.5% / 60% / 63.5% | 54.5% / 57.5% / 60.5% |
| Upcoming target x offset | 13.5% | 16% |
| Distant target x offset | 23.5% | 27% |
| Upcoming target scale / alpha | 55% / 0.34 | 46% / 0.25 |
| Distant reinforcement scale / alpha | 34% / 0.16 | 28% / 0.10 |
| Warden visual height | 29.5% of canvas, max 276px | 20.5% of canvas, max 160px |
| Target visual height | 25.5% of canvas, max 238px | 17.5% of canvas, max 140px |
| Active word anchor | x 50%, y 76.5% | x 50%, y 76.5% |
| Target entry distance | 72px | 44px |
| Projectile travel | Warden muzzle to target core | same |
| Foreground cover height | 11.5% | 9% |
| Attack path | x 32%-65.5%, y 52.5% | x 30%-63.5%, y 51.5% |
| Warden mid-field / contact travel | 5% / 14% of Warden-to-target gap | same |
| Letter-node spacing | distribute current word across attack path | same, minimum visual gap 7px |

The active word is not attached to the target sprite. It sits on a high-contrast command rail between the combatants so character animation cannot move the caret.

Combat-effect geometry is also tokenized: the Aegis callout sits at y 34%; its shield spans y 30%-72% from an x 8% Warden offset with a 5% forward edge and 2% back edge. The Overdrive impact column spans y 14%-82%. Overdrive reaches 78% of the Warden-to-target gap, travels outward for 58% of its 320ms lifecycle, and returns during the remaining 42%. An ordinary contact ring has a 28px radius and 2px stroke; a finishing contact uses a 52px radius and 4px stroke. Attack smears are 8px wide. A defeat emits exactly 18 fragments, each inside a 9x4px silhouette. Letter bolts reach contact in 110ms. Effects share one 200-object live cap.

### Signal Trench environment layers

| Layer | Camera travel ratio | Required motion |
| --- | ---: | --- |
| Far sky and tower silhouettes | 0.08 | slow light-state change |
| Distant relay machinery | 0.2 | mechanical phase and authored sparks |
| Midground cables, doors, and conduits | 0.45 | door travel and cable sway |
| Battle deck and ground markings | 1 | camera track and impact light |
| Foreground gantries, pipes, and debris | 1.25 | pooled occlusion passes |
| Atmosphere and light spill | camera-relative | haze bands and beat fades |

Cable sway stays within 8px of its authored anchor. Ingress keeps the relay aperture closed, Relay breach opens the machinery path, and Extraction opens the Shop route. Reduced motion removes continuous parallax, cable sway, loose particles, and camera impulses while retaining light-state changes, contact shadows, and atmosphere fades.

Character integration layers are mandatory: deck-aligned contact shadow, cyan lower rim, low-alpha stage reflection, deck impact light, foreground leg haze, role-based depth desaturation, and local contact debris. These layers never tint the command rail.

## Rig asset delivery

- Environment kit: six isolated source layers using one three-quarter camera, material language, cyan key light, and restrained magenta corruption light. Runtime far and atmosphere layers may use half resolution before character quality is reduced.
- Editable rig sheets use PNG with at least 12% clear padding around every separated component. Runtime atlases may use alpha WebP after compatibility validation.
- Every component keeps one identity, material language, light direction, perspective, and scale. Pivot markers stay inside their frame bounds.
- Warden clips: `idle`, `ready`, `cannon-burst`, `rail-step`, `tether-pull`, `breach-slide`, `recoil-vault`, `crossfire-pivot`, `execution`, `overdrive-breach`, `block`, `hurt`, `recover`.
- Enemy clips: `locomotion`, `idle`, `anticipation`, `attack`, `hit`, `defeat`, `special`.
- Every enemy-family atlas contains its three canonical variant silhouettes as base parts plus optional attachments. A stage never loads another enemy-family atlas for variation.
- Each full-body action uses 8-12 authored key poses where the silhouette changes. Runtime interpolation runs at the renderer frame rate.
- Grounded Warden clips keep at least one foot within 4px of the authored ground line. Root Y does not create ordinary attack travel.
- The first playable stage loads at most 5MB of compressed combat art. A stage keeps the Warden atlas, one enemy-family atlas, and one environment kit resident and targets 64MB of GPU texture memory.
- Character edges must remain crisp at 0.5 scale and contain no chroma-key remnants. Broken joints, scale jumps, floating feet, and camera changes are release blockers.

# 5. Screen Specs

## 5.1 Gameplay HUD

```
+----------------------------------------------------------------+
| TYPECADE     ZONE 3 - RUSH         00:24              [o] 42   |  h 64
| QUOTA 3,000  [===============_________]  2,450 / 3,000         |  h 32
|                                                                |
| COMBO                                                    BASE  |
|  23         galaxy keyboard synergy arcade photon         312  |
| MULT              perform|ance                           SCORE |
|  x4         stability algorithm quantum victory          3,984 |
|                                                                |
|                  [K1][K2][K3][K4][K5]                          |  h 96
| <3 100% ACCURACY                                       60 WPM  |  h 32
+----------------------------------------------------------------+
```

| Element | Position | Spec |
| --- | --- | --- |
| Top bar | top, h 64 | wordmark left, zone-stage in `--cyan`, timer centered 32px, tokens right in `--yellow` |
| Quota bar | below top bar | h 12, track `--bg-2`, fill `--green`, glow blur 8px opacity 0.35, numbers on the right |
| Aegis / threat band | directly below the Zone label | 12px uppercase. Zones 1-2: `AEGIS ACTIVE · PROTECTED`; later zones show `PRESSURE`, `OVERCLOCKED`, or `LETHAL` |
| Focus Pause | replaces `TIME` label after 4 seconds of protected-stage inactivity | timer digits remain visible in `--cyan`; label reads `FOCUS PAUSE · TYPE WHEN READY`. No modal, countdown, or dimmed command rail |
| Word stream | visual focal point | Active word sits in a centered command rail at 48px. Two upcoming words appear below it. Characters and effects never move the caret or overlap the rail |
| Caret | inside active word | 3px vertical line, letter height, `--green`, 1s blink when idle, solid while typing |
| Left column | left, vertically centered | COMBO (label + pink number), MULT (label + violet number), gap 24 |
| Right column | right, vertically centered | BASE (`--text-hi` number), SCORE (`--yellow` number), gap 24 |
| Keycap row | bottom center, h 96 | 5 slots 64x64, gap 12 |
| Footer | bottom, h 32 | accuracy left, WPM right, 14px `--text-mid` |

Responsive exception at widths below 640px: the wordmark collapses to the Typecade mark, Zone and Stage stack on two lines, Keycap and Macro slots render at 48x48, and the build rows stack vertically. The 64x64 slot size remains mandatory from 640px upward. No gameplay control or active Macro may be hidden.

Ready gate:

- Full-canvas scrim `--bg-0` at 0.48 opacity; the combatants remain visible.
- Center copy above the command rail: stage label in 14px `--cyan`, `TYPE TO ENGAGE` in 24px JetBrains Mono 700, and `THE TIMER STARTS WITH YOUR FIRST KEY` in 14px `--text-mid`.
- No countdown and no confirmation button. The first printable key removes the gate in 150ms and is forwarded to the engine.
- On a resumed run, copy changes to `PRESS ANY KEY TO RESUME`.
- Zone 1 first-run subcopy reads `ONE KEY AT A TIME · AUTO-EXECUTE · FOCUS PAUSE ACTIVE`. The first target is one letter, not a full word.
- Zone 1 command-rail coaching progresses by stage: `FIND 1 KEY · AUTO-FIRES`, `TYPE 2 KEYS · AUTO-FIRES`, then `TYPE 3 LETTERS · AUTO-FIRES`. Zone 2 uses `TYPE THE WORD · SPACE EXECUTES` until the word is complete.

Command rail:

- Width: min(640px, calc(100vw - 96px)); compact width: calc(100vw - 32px).
- `--bg-0` at 0.88 opacity, 1px `--border`, 8px radius, 16px vertical and 24px horizontal padding.
- Active word stays 48px on desktop and 32px compact. When all letters are entered, a 14px `--green` label reads `SPACE — EXECUTE`.
- Dirty state adds a 14px `--red` label: `CORRUPTED — 0 SCORE`. Color, underline, and copy all communicate the error.
- In protected Zone 2 only, dirty state uses a cyan/red split label: `AEGIS RECOVERY — BASE ONLY`. The wrong character stays red, but the outcome is not falsely labeled zero.
- A 4px Overdrive charge rail runs along the command rail's bottom edge. At 100 it changes from `--cyan` to `--yellow` and the outline pulses once. Zone 2 changes the label to `SPACE — OVERDRIVE`. Zone 3 and later show `SPACE — EXECUTE` plus `ENTER — OVERDRIVE`.
- Predictable owned Keycaps that will trigger on the current clean word receive one armed border state. The state has no glow and never moves the caret.
- Two upcoming words appear at 16px below the rail, separated by 12px. They never use the active accent.

Combat readability:

- The current word's remaining characters also appear as small signal-nodes along the attack path. These are secondary targets, never a replacement for the command rail text.
- A node breaks on its corresponding accepted character. Entered nodes stay dim and fractured; remaining nodes use `--cyan` at no more than 70% of the command rail contrast.
- The Warden travels between three authored screen-space lanes during a word: home, mid-field, and contact. It returns home only after submission or a dirty reset.
- The arena shows one active enemy and two upcoming enemies. Upcoming enemies stay below active-word contrast and cannot own signal nodes or attack telegraphs.
- During Focus Pause, the Warden holds `ready`, enemy attack animation returns to `idle`, signal-nodes remain visible, the cyan timer label changes, and low-motion arena ambience continues. Do not cover the word or show a pause dialog.
- Enemy attack anticipation is at least 240ms and uses articulated motion, a directional line, and color. Ambient motion may never resemble attack anticipation.
- All combat motion stays behind the command rail and outside the caret exclusion zone.

Combo rail:

- Under COMBO, render a segmented 10-step meter using 4px-high segments and an adjacent `N / 10 TO MULT` label at 14px.
- Filled segments are `--pink`; empty segments use `--bg-2`. The meter does not animate width; each segment changes color instantly.
- On natural Mult increase, the Mult number scales per Motion Spec and the label briefly reads `MULT UP`.

Score popup: "+312" 20px `--violet`, spawns at the defeated target, travels 24px toward the score HUD while fading, 300ms, max 3 popups alive at once.

Resolved-word equation: 14px `--text-hi`, centered above the command rail for 700ms. Base is `--text-hi`, multiplication and Mult are `--violet`, final gain is `--yellow`. Only the latest equation is visible.

Item proc feedback:

- The triggering Keycap slot flashes its rarity border once for 150ms. No additional glow layer.
- At most one 14px proc label is visible near the active word, for example `WASD +10 BASE`.
- Each combat-side item shape fits a 48x48px footprint, uses a 2px stroke, and clears within 450ms. Simultaneous identical shapes merge into one restarted effect.
- Protection effects use a small shield-break mark next to Mult; they never interrupt typing.
- The stage-clear ribbon shows the strongest item contribution. The Shop retains the previous stage's strongest contribution.

## 5.2 Shop

- The Shop fits one viewport at every Definition of Done size and contains no required scroll.
- The top strip shows `SHOP`, Tokens, projected Interest, next Stage and Quota, and previous-stage facts.
- The center contains the exact 2 Keycap and 1 Macro offers. Desktop uses 3 columns; compact uses 3 short rows.
- The active build is a one-row rail on desktop and a compact horizontal rail below offers on narrow screens.
- Item cards show exact effect, trigger, price, rarity, and capacity state. Additional detail appears on focus or hover without changing layout height.
- Unaffordable items use opacity 0.4 and `--red` price text.
- Keyboard controls: 1 buys the first Keycap, 2 buys the second Keycap, 3 buys the Macro, R rerolls, Tab navigates, and Enter deploys.
- A successful purchase animates into the build rail for 600ms without blocking another action.
- The fixed deploy action reads `ENTER — DEPLOY TO [STAGE] · QUOTA [VALUE]`.

## 5.3 Stage-clear ribbon

- The gameplay canvas remains mounted after Quota is reached.
- The ribbon appears over the lower arena for 900ms and shows stage score, Tokens earned, accuracy, and the strongest item contribution.
- Enter skips the remaining display time. The Shop opens when the ribbon ends.
- The ribbon uses one data line per value, no recommendation paragraph, and no required pointer input.

## 5.4 Run Over

Vertical order, centered, max 480px:

1. "RUN OVER" Press Start 2P 24px `--red` (or "SYSTEM OVERRIDDEN" in `--green` on a win).
2. Final score 64px `--yellow`. Count-up for 800ms, then static.
3. 4-row table, 16px: Zone reached, Max combo, Accuracy, Avg WPM.
4. Tokens earned row: "+35" `--yellow`.
5. Final build: keycap icon row, 48px.
6. Buttons: NEW RUN (primary) on top, SHARE SCORE (ghost) second, MAIN MENU (text/ghost) last, gap 12. Starting a new free run takes one click and less than 2 seconds.

If a local personal best exists for the same mode and language, show either `NEW PERSONAL BEST` or `N TO BEAT YOUR BEST` directly below Final score. This is compact replay motivation, not a modal.

## 5.5 Main Menu

- Custom Typecade Glyph mark + wordmark + tagline 16px `--text-mid`. The mark is vector/code-native and uses no decorative animation.
- Vertical buttons: PLAY (primary, h 56), DAILY SEED (ghost, shows reset countdown "resets in 07:12:44"), PRACTICE (ghost), LEADERBOARD (text link).
- Max 2 clicks from page load to typing. No carousel, no banner, no modal on first load.

## 5.6 Share Card (OG image)

- 1200 x 630 PNG. Plain `--bg-0` background, 1px `--border` inner frame with 32 margin.
- Top left: wordmark 32px. Top right: seed date 16px `--text-mid`.
- Center: score 96px `--yellow`, with "ZONE 6 REACHED" 24px `--text-hi` below it.
- Bottom center: row of 5 build icons, 64px, with rarity borders.
- Footer: "typecade.com/overdrive" 20px `--green`.
- No photos, no gradients, no avatars. Must stay readable as a 400px thumbnail.

# 6. Components

| Component | Spec |
| --- | --- |
| Keycap slot | 64x64, radius 8, bg `--bg-1`, 2px rarity border, 32px `--text-hi` icon. Empty slot: dashed `--border` border, no icon |
| Item tooltip | width 260, bg `--bg-2`, 1px border, radius 8, 150ms show delay. Contents: name 16px 700, rarity badge, effect description 14px, sell value |
| Primary button | h 44, bg `--green`, text `--bg-0` 14px 700 uppercase, radius 8. Hover: brightness 1.1. Disabled: opacity 0.4 |
| Ghost button | h 44, transparent bg, 1px `--border`, text `--text-hi`. Hover: bg `--bg-2` |
| Rarity badge | pill, 14px 700 uppercase, rarity-colored text, rarity color background at 0.12 opacity |
| Progress bar | h 12, radius 6, track `--bg-2`, fill per function |
| Toast | bottom center, bg `--bg-2`, 1px border, appears in 200ms, auto-dismisses in 3s, max 1 |

# 7. Motion Spec

Budget: transform and opacity animations only (GPU). No width/height/layout animation. Max 200 live particles. Target 60fps on laptops without a discrete GPU.

| Event | Effect | Duration | Easing |
| --- | --- | --- | --- |
| Warden ready loop | articulated breathing, weight transfer, visor tracking, cannon settling, and foot contact | 1,200ms loop | linear interpolation |
| Target locomotion | class-specific articulated motion: Packet gait, Needle spine flight, Null plate orbit | 800-1,200ms loop | linear interpolation |
| Correct letter | letter shifts from `--text-dim` to bright, no transition | 0ms | instant |
| Accepted character attack | selected grounded verb starts within 50ms and reaches an articulated contact frame within 90ms; recovery may cancel into the next verb | 35ms anticipation + 55ms contact + 90ms recover | cubic-out |
| Character hit | enemy articulates away from the contact, moves 8px, and flashes a white silhouette | 90ms | ease-out |
| Wrong letter | letter flashes `--red`  • underline, active word shakes 4px horizontally | 120ms / 80ms | linear |
| Word complete | Warden enters `execution` then a backward settle; the target uses its family defeat, exits 48px, and resolves the score popup | 300ms | ease-out |
| Overdrive ready | Warden enters `ready`, cannon core locks, arena rim pulses once, command rail charge locks, one rising audio cue | 260ms | ease-out |
| Overdrive release | `overdrive-breach` crosses 78% of the Warden-to-target gap; its 58% outward / 42% return travel creates a y 14%-82% impact column and snap-return afterimage | 320ms | cubic-out |
| Enemy pressure attack | enemy `anticipation` then `attack`, directional line, Warden `block`, contact ring; no camera shake | 240ms + 120ms | ease-in / ease-out |
| Aegis rescue | lethal enemy `attack`, Warden `block`, shield plane fractures, `+30S` callout, cyan recovery wave | 600ms | ease-out |
| Next target | upcoming rig promotes to active while the distant rig enters from 48px | 180ms | ease-out-back |
| Mult up | MULT number scales 1.0 to 1.2 and back | 150ms | ease-out-back |
| Quota update | bar fill tweens to the new value | 200ms | ease-out |
| Quota reached | bar flashes 2 pulses | 400ms | linear |
| Final quota word | hitstop: render freeze | 50ms |  |
| Stage clear | 6px screen shake, 50ms hitstop, then result ribbon; Shop opens after 900ms and Enter skips | 150ms / 900ms | ease-out |
| Glitch stage intro | scanline overlay fade-in + glitch title stamp | 400ms | ease-out |
| Shop / menu transition | fade + 8px slide | 150ms | ease-out |
| Run over | score count-up | 800ms | ease-out |

Screen shake only on stage clear and Overdrive release, maximum 6px and 3px respectively. KERNEL PANIC may add it in v2; it is outside the locked MVP. Never shake on typos or ordinary words.

Runtime ambient limits: maximum 24 low-contrast motes, each 2px, alpha <=0.12, speed <=12px/s. Parallax follows the canonical layer ratios. Cable anchors move no more than 8px. Ambient travel freezes under reduced motion.

## Camera cues

`CameraDirector` combines journey, combat, impact, and accessibility channels. It transforms the world only; the command rail and HUD remain screen-space.

| Event | Cue |
| --- | --- |
| Encounter beat change | 600ms track to the next set-piece |
| Rail step | lateral follow capped at 40px |
| Tether pull | push-in capped at 2% |
| Crossfire pivot | 120ms pan and 180ms settle |
| Execution | 50ms hold and 180ms settle |
| Overdrive breach | 3% push-in and 3px shake maximum |
| Aegis rescue | brace toward the Warden, then release |
| Stage clear | track through the opened Extraction route |

## Combo escalation

| Combo | Added effect |
| --- | --- |
| 0 to 3 | base path and contact |
| 4 to 7 | one extra afterimage and denser contact fragments |
| 8 to 15 | violet secondary trail and environment beat light |
| 16 and above | thin screen-edge current and family-specific defeat accent |

Combo break: all tier effects drop straight to the new tier, no farewell animation.

## Item combat signatures

Every MVP item keeps its 48px HUD acknowledgement and adds one attributable world response:

| Item | Combat signature |
| --- | --- |
| WASD | four directional targeting brackets |
| Vowel Magnet | small cyan letter orbit pulled into the cannon |
| Longshot | elongated barrel trace and compressed impact |
| Sprinter | grounded green speed wake during the opening window |
| Second Wind | broken red trail rewound into a yellow finisher |
| Copper Key | one Token spark resolving toward the HUD |
| Home Row | horizontal sequence of illuminated deck key plates |
| Punctuator | punctuation glyph creating a sharp contact notch |
| Combo Battery | pink shield segment absorbing the break |
| Overclock | opened cannon vents retaining a stage heat light |
| Double Tap | delayed second contact from the opposite angle |
| Snowball | persistent frost-white armor edge marks |
| Interest Bank | stored Token pips orbiting the rear shoulder |
| Glass Keycap | prism plane forming on proc and fracturing on loss |
| Vampire | red return trail transferring from target to Warden |

Macro effects originate near the Macro rail before entering world space and never reuse a passive Keycap signature.

## Reduced motion

`prefers-reduced-motion` or the in-game toggle: disable shake, hitstop, continuous parallax travel, camera impulses, cable sway, loose particles, background pulse, and count-up. Keep articulated pose changes, contact readability, contact shadows, environment light-state changes, atmosphere fades, color changes, popup fades, and 150ms transitions. Gameplay must remain fully readable.

# 8. Audio Spec

| Event | Sound | Source |
| --- | --- | --- |
| Correct keystroke | switch click, 3 user-selectable variants: linear, tactile, clicky | own keyboard recordings |
| Typo | short muted thud. Not a buzzer, must not punish the ears | jsfxr |
| Word complete | short blip, pitch up 1 semitone per combo tier, capped at 12 | jsfxr |
| Quota reached | 2-note rising chime | jsfxr |
| Buy / sell item | coin + click | Kenney audio |
| Reroll | short mechanical shuffle | jsfxr |
| Glitch intro | 500ms distortion sting | ChipTone |
| Stage clear | short 3-note fanfare | jsfxr |
| Run over | descending power-down | jsfxr |

Mixing rules:

- Separate sliders: keystroke, SFX, music. Defaults: 50%, 70%, 0 (no music in MVP).
- Audio starts after the user's first input (browser autoplay policy).
- ogg + mp3 fallback. Total MVP audio budget under 500KB, lazy-loaded after first paint.
- No menu sounds except primary CTA hover.

# 9. Icons

- One source: the original **Typecade Glyph** inline SVG set in the repository. One style: solid single-color `--text-hi` silhouettes. Mixing outline and filled styles is banned.
- Render sizes: 32px (slots, HUD) and 48px (shop, run over). Inline SVG, not an icon font.
- Icon color never follows rarity. Rarity lives only in borders and badges.
- Emoji are banned across the entire game UI.
- Non-game UI icons (settings, close, etc.): Lucide, 2px stroke, 20px.

# 10. Accessibility

- Text contrast at least 4.5:1. Must-check hotspots: `--text-mid` on `--bg-1`, `--yellow` prices on `--bg-1`.
- State is never color-only. Typo = color + shake + underline. Rarity = color + label. Quota fail = color + text.
- Click targets at least 44x44px, including keycap slots (64px passes).
- Once a run starts, all gameplay works without a mouse. Esc = pause. In the Shop, 1/2/3 buy, R rerolls, Tab navigates, and Enter deploys.
- Every interactive control has a visible `:focus-visible` outline with at least 3:1 contrast.
- Blackout and Invisible Ink retain readable active input and expose their rules in text; accessibility settings must not silently remove a ranked modifier.
- Reduced motion: see section 7. Must be tested, not just present.

# 11. Definition of Done per screen

Before a screen counts as done:

- [ ]  No overlapping or overflowing elements at 390×844, 820×1180, 1366×768, 1440×900, and 1920×1080.
- [ ]  Every color and size comes from this doc's tokens, no stray hardcoded values.
- [ ]  Contrast audit passes (section 10).
- [ ]  60fps under worst case: x16 combo, 200 particles, laptop without a discrete GPU.
- [ ]  Reduced-motion path manually checked.
- [ ]  All copy in English and item names exactly matching the GDD.
