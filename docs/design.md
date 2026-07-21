> Visual, motion, and audio spec for Overdrive. Gameplay lives in the GDD: TYPECADE: OVERDRIVE — Game Design Document v0.1. Requirements and tech stack live in the PRD: TYPECADE: OVERDRIVE — PRD & Tech Spec v0.1. Every number in this doc is an implementation value, not a suggestion. To change one, edit this doc first. No improvising in code.
> 

> Language policy: all docs and all product copy are English. Indonesian exists only as an optional typed word pool inside gameplay.
> 

# 1. Art Direction

References: Balatro (item and shop feel), Monkeytype (clean typing screen), ZType (enemy drama), CRT arcade cabinets.

Five rules, in priority order:

1. 90% of the screen is dark and neutral. Neon is reserved for whatever matters right now.
2. One light source per moment: the active word. Nothing else competes with it.
3. Every visual effect has a gameplay trigger. No decorative animation running on its own.
4. Max 1 glow layer per element. A second glow gets deleted.
5. When in doubt, delete.

| Allowed | Not allowed |
| --- | --- |
| Thin glow on the active word and quota bar | Glow on labels, panel borders, static text |
| Particles on word completion | Ambient particles / always-alive backgrounds |
| Scanline overlay during Glitch stages only | Permanent scanlines on every screen |
| One accent color per function (see tokens) | Multi-color gradients, lens flares, heavy bloom |
| Pixel font for the wordmark and screen titles | Pixel font for body text or HUD numbers |

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
  --text-dim: #4E576B; /* untyped words */

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
| Word stream | vertical center | 3 rows: top and bottom `--text-dim` 28px, middle active word 48px `--green` |
| Caret | inside active word | 3px vertical line, letter height, `--green`, 1s blink when idle, solid while typing |
| Left column | left, vertically centered | COMBO (label + pink number), MULT (label + violet number), gap 24 |
| Right column | right, vertically centered | BASE (`--text-hi` number), SCORE (`--yellow` number), gap 24 |
| Keycap row | bottom center, h 96 | 5 slots 64x64, gap 12 |
| Footer | bottom, h 32 | accuracy left, WPM right, 14px `--text-mid` |

Score popup: "+312" 20px `--violet`, spawns at the end of the active word, rises 24px while fading, 300ms, max 3 popups alive at once.

## 5.2 Shop

- "SHOP" title (Press Start 2P 24px) top left, tokens top right.
- Item grid, 4 columns, gap 16. Item card: 160px wide, bg `--bg-1`, 2px rarity border, radius 8. Contents: 48px icon, name 16px 700, type + rarity 14px `--text-mid`, token price bottom right in `--yellow`.
- Row below the grid: REROLL button (ghost, price in the label) left, LEAVE SHOP (primary) right.
- Active build panel (5 slots + macro) docked to the bottom, always visible; clicking an item shows tooltip + SELL button.
- Unaffordable items: opacity 0.4, price turns `--red`.

## 5.3 Run Over

Vertical order, centered, max 480px:

1. "RUN OVER" Press Start 2P 24px `--red` (or "FIRMWARE CLEAR" in `--green` on a win).
2. Final score 64px `--yellow`. Count-up for 800ms, then static.
3. 4-row table, 16px: Zone reached, Max combo, Accuracy, Avg WPM.
4. Tokens earned row: "+35" `--yellow`.
5. Final build: keycap icon row, 48px.
6. Buttons: SHARE SCORE (primary) on top, MAIN MENU (ghost) below, gap 12.

## 5.4 Main Menu

- Wordmark + tagline 16px `--text-mid`.
- Vertical buttons: PLAY (primary, h 56), DAILY SEED (ghost, shows reset countdown "resets in 07:12:44"), PRACTICE (ghost), LEADERBOARD (text link).
- Max 2 clicks from page load to typing. No carousel, no banner, no modal on first load.

## 5.5 Share Card (OG image)

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
| Rarity badge | pill, 12px 700 uppercase, rarity-colored text, rarity color background at 0.12 opacity |
| Progress bar | h 12, radius 6, track `--bg-2`, fill per function |
| Toast | bottom center, bg `--bg-2`, 1px border, appears in 200ms, auto-dismisses in 3s, max 1 |

# 7. Motion Spec

Budget: transform and opacity animations only (GPU). No width/height/layout animation. Max 200 live particles. Target 60fps on laptops without a discrete GPU.

| Event | Effect | Duration | Easing |
| --- | --- | --- | --- |
| Correct letter | letter shifts from `--text-dim` to bright, no transition | 0ms | instant |
| Wrong letter | letter flashes `--red`  • underline, active word shakes 4px horizontally | 120ms / 80ms | linear |
| Word complete | score popup rises 24px + fades, 10 particles from the word position | 300ms | ease-out |
| Mult up | MULT number scales 1.0 to 1.2 and back | 150ms | ease-out-back |
| Quota update | bar fill tweens to the new value | 200ms | ease-out |
| Quota reached | bar flashes 2 pulses | 400ms | linear |
| Final quota word | hitstop: render freeze | 50ms |  |
| Stage clear | 6px screen shake + results panel slides in from the bottom | 150ms / 250ms | ease-out |
| Glitch stage intro | scanline overlay fade-in + glitch title stamp | 400ms | ease-out |
| Shop / menu transition | fade + 8px slide | 150ms | ease-out |
| Run over | score count-up | 800ms | ease-out |

Screen shake only on stage clear and KERNEL PANIC. Not on typos, not on every word.

## Combo escalation

| Tier | Added effect |
| --- | --- |
| x1 to x3 | none |
| x4 to x7 | caret trail, +50% particles per word |
| x8 to x15 | particles turn `--violet`, background pulse at 0.04 opacity following the typing beat |
| x16 and up | thin edge glow around the screen, music layer rises |

Combo break: all tier effects drop straight to the new tier, no farewell animation.

## Reduced motion

`prefers-reduced-motion` or the in-game toggle: disable shake, hitstop, particles, background pulse, and count-up. Keep color changes, popup fades, and 150ms transitions. Gameplay must remain fully readable.

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

- One source: Game-icons.net. One style: solid single-color `--text-hi` silhouettes. Mixing outline and filled styles is banned.
- Render sizes: 32px (slots, HUD) and 48px (shop, run over). Inline SVG, not an icon font.
- Icon color never follows rarity. Rarity lives only in borders and badges.
- Emoji are banned across the entire game UI.
- Non-game UI icons (settings, close, etc.): Lucide, 2px stroke, 20px.

# 10. Accessibility

- Text contrast at least 4.5:1. Must-check hotspots: `--text-mid` on `--bg-1`, `--yellow` prices on `--bg-1`.
- State is never color-only. Typo = color + shake + underline. Rarity = color + label. Quota fail = color + text.
- Click targets at least 44x44px, including keycap slots (64px passes).
- Once a run starts, all gameplay works without a mouse. Esc = pause. Shop is navigable with Tab + Enter.
- Reduced motion: see section 7. Must be tested, not just present.

# 11. Definition of Done per screen

Before a screen counts as done:

- [ ]  No overlapping or overflowing elements at 1280px and 1920px.
- [ ]  Every color and size comes from this doc's tokens, no stray hardcoded values.
- [ ]  Contrast audit passes (section 10).
- [ ]  60fps under worst case: x16 combo, 200 particles, laptop without a discrete GPU.
- [ ]  Reduced-motion path manually checked.
- [ ]  All copy in English and item names exactly matching the GDD.