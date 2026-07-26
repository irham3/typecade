# Typecade Asset Credits

This file records the source and usage terms for third-party and generated assets used by Typecade.

## Overdrive — Signal Siege v2

The following original images were generated for this repository on 2026-07-25 with OpenAI's built-in image generation tool. Usage is subject to the applicable OpenAI terms. They contain no third-party logos, trademarks, or requested copyrighted characters.

| Runtime asset | Source generation | Local processing |
| --- | --- | --- |
| `public/overdrive/art/signal-trench-arena-v2.png` | `call_TIekHn3jAJhQkzFWsfvrdPLg.png` | Copied without visual edits |
| `public/overdrive/art/keystone-warden-v3.png` | `call_19TUzqPlf6OzobgFArZuf37J.png` | Magenta chroma key removed, then transparent padding trimmed with `scripts/trim-alpha.py` |
| `public/overdrive/art/packet-stalker-v3.png` | `call_R90k9QJcIw0xUhOdOo5ivrPU.png` | Magenta chroma key removed, then transparent padding trimmed with `scripts/trim-alpha.py` |
| `public/overdrive/art/needle-wraith-v3.png` | `call_ioMmxQwn9PvhRXWcyRnR98Sw.png` | Green chroma key removed, then transparent padding trimmed with `scripts/trim-alpha.py` |
| `public/overdrive/art/null-crown-v3.png` | `call_MtyzLttrgSvg65BrlpXNkjTf.png` | Green chroma key removed, then transparent padding trimmed with `scripts/trim-alpha.py` |
| `public/overdrive/art/poses/warden/*.png` | `call_vk0KZNNeEz6TwlxNC4158OJr.png` | 4x2 magenta-key pose sheet normalized, keyed, component-cleaned, and split with `scripts/process-pose-sheet.py` |
| `public/overdrive/art/poses/packet/*.png` | `call_rJgwQLl6lWpRZO8l6T0WhOPB.png` | 4x2 magenta-key pose sheet normalized, keyed, component-cleaned, and split with `scripts/process-pose-sheet.py` |
| `public/overdrive/art/poses/needle/*.png` | `call_aWEaIpS95tQ6iejFqzeTAXZv.png` | 4x2 magenta-key pose sheet keyed, component-cleaned, and split with `scripts/process-pose-sheet.py` |
| `public/overdrive/art/poses/null/*.png` | `call_1BpHdCEYppzbbCYybt2E7USv.png` | 4x2 magenta-key pose sheet keyed, component-cleaned, and split with `scripts/process-pose-sheet.py` |

### Shared art bible

Premium hand-painted 2.5D game illustration; hard-surface cel shading; graphic shadow shapes; restrained metal texture; charcoal navy and gunmetal keyboard machinery; controlled cyan, acid-green, violet, and red signal accents; professional indie action-game finish; no text, logos, watermarks, photorealism, generic spaceships, cute mascots, or references to existing copyrighted characters.

### Arena prompt

An original cyber-industrial signal trench built from monumental keyboard plates, mechanical switch housings, relay towers, thick data cables, and angular server architecture. Wide 16:9 side-on three-quarter composition with a clear combat lane, strong depth layers, mobile-safe center crop, controlled haze, and quiet center space for the typing rail.

### Keystone Warden prompt

A compact non-human mechanical sentinel built from mechanical keyboard switch housings, a broad keycap-shaped shoulder plate, keyboard-plate armor, and a forearm typing cannon. Full-body grounded combat pose facing right, narrow cyan visor, acid-green core, asymmetric readable silhouette, on a perfectly flat magenta chroma-key background.

### Packet Stalker prompt

A small corrupted relay creature assembled from broken keyboard switches, snapped keycap armor, cable tendons, and a jagged packet-core shell. Full-body low quadruped stance facing left, red sensor slit, cyan and acid-green data seams, on a perfectly flat magenta chroma-key background.

### Needle Wraith prompt

A fast corrupted signal hunter constructed from keyboard stabilizer rails, switch springs, blade-like key stems, and a long data-needle weapon. Full-body hovering stance facing left, swept-back triangular silhouette, hot-pink visor and violet corruption seams, on a perfectly flat green chroma-key background.

### Null Crown prompt

A massive fractured boss construct forged from shattered keyboard plates, broken key stems, crown-like antenna blades, and a suspended corrupted switch core. Full-body hovering stance facing left, five asymmetric spires, clawed arms, red visor void, and red/violet corruption cracks, on a perfectly flat green chroma-key background.

### Pose-sheet prompts

Each v4 pose sheet used its corresponding v3 master as an identity reference and retained the shared art bible. The Warden sheet requested eight distinct full-body states: low ready, high ready, anticipation, forward strike, airborne dash, landing recovery, shield block/hurt, and transformed Overdrive lunge. Each enemy sheet requested two materially different idles plus anticipation, attack, special attack, hit reaction, recovery, and defeat. All prompts required consistent scale, ground line, perspective, lighting, and materials across a 4x2 grid on a perfectly flat `#FF00FF` chroma-key background, with no text, borders, scenery, detached particles, or repeated silhouettes.
