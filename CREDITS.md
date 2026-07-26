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

## Overdrive — Articulated combat rigs v1

The following modular character sheets were generated for this repository on 2026-07-26 with OpenAI's built-in image generation tool. Each generation used the corresponding v3 character master as an identity reference. The generated sheets remain in `public/overdrive/art/source`; the game loads only the processed WebP atlases and JSON pivot data.

| Character | Source generation | Runtime assets |
| --- | --- | --- |
| Keystone Warden | `call_OIeCLOjjKFYOnPaMqKPHiqab.png` | `public/overdrive/art/rigs/warden-rig-v1.webp` and `warden-rig-v1.json` |
| Packet Stalker | `call_gw5sH39XL5xslGeKVVqsnh9y.png` | `public/overdrive/art/rigs/packet-rig-v1.webp` and `packet-rig-v1.json` |
| Needle Wraith | `call_McXdl1w7hWmgRcy68b22k48k.png` | `public/overdrive/art/rigs/needle-rig-v1.webp` and `needle-rig-v1.json` |
| Null Crown | `call_KeWRygQ5rIobHxZmMfZOd31o.png` | `public/overdrive/art/rigs/null-rig-v1.webp` and `null-rig-v1.json` |

### Rig-sheet prompt

Premium hand-painted 2.5D modular character art for a polished cyber-industrial arcade typing game. Preserve the supplied character's identity, silhouette language, hard-surface cel shading, restrained metal texture, and signal colors. Show every named body component exactly once, detached and centered in its assigned cell, at a consistent side-view three-quarter perspective and a consistent scale. Use a perfectly flat magenta chroma-key background. No text, labels, borders, scenery, cast shadows, loose particles, duplicate components, full assembled character, logos, watermarks, or references to copyrighted characters.

The Warden sheet used a 6x3 grid with torso, pelvis, head, visor, paired shoulders, paired upper arms, paired forearms, cannon barrel, cannon core, paired thighs, paired shins, and paired feet. The Packet sheet used a 5x3 grid with core torso, head, jaw, four two-segment legs, two tail segments, and paired back plates. The Needle sheet used a 5x3 grid with chest core, head, neck, two spine sections, paired blade arms, paired fins, and three tail sections; the final cell remained empty. The Null sheet used a 4x4 grid with void core, four crown sections, paired shoulders, paired upper arms, paired forearms, paired hands, three cloak sections, and lower core.

### Local rig processing

`scripts/process-rig-sheet.py` samples the chroma color from each sheet border, removes only border-connected key pixels, suppresses edge spill, groups connected components by semantic grid cell, adds four pixels of transparent padding, and packs the parts into a lossless 2048x2048 WebP atlas. The companion JSON records every frame, anchor, pivot, rig ID, and available animation clip.

## Overdrive — Signal Expedition art kit v1

The following original source sheets were generated for this repository on 2026-07-26 with OpenAI's built-in image generation tool. Usage is subject to the applicable OpenAI terms. The prompts requested no third-party characters, logos, trademarks, text, or watermarks.

| Source sheet | Generation reference | Runtime output |
| --- | --- | --- |
| `public/overdrive/art/source/signal-trench-kit-v1-source.png` | `exec-5f25cccd-bee8-43bf-aa64-4e71f2c594ed.png` | Six WebP layers and `public/overdrive/art/environment/signal-trench-kit-v1.json` |
| `public/overdrive/art/source/packet-family-v2-source.png` | `exec-e9501f14-95a1-4be4-9bd9-ee8fa962c2bc.png` | Packet variant frames in `public/overdrive/art/rigs/packet-rig-v1.webp` |
| `public/overdrive/art/source/needle-family-v2-source.png` | `exec-1bf18c96-a0e0-487f-af44-d9b7a1e42b74.png` | Needle variant frames in `public/overdrive/art/rigs/needle-rig-v1.webp` |
| `public/overdrive/art/source/null-family-v2-source.png` | `exec-ca4c6a08-26be-4c92-9003-17507baceb60.png` | Null variant frames in `public/overdrive/art/rigs/null-rig-v1.webp` |

### Signal Trench kit prompt

Production environment layer sheet for the original cyber-industrial typing arcade Signal Expedition. Premium stylized 3D hard-surface game render converted to polished 2D, with a shared three-quarter camera, blackened steel, worn graphite deck, cyan relay key light, restrained magenta corruption light, and deep navy atmosphere. Six isolated horizontal panels cover far towers and sky, relay machinery, cables and blast doors, the battle deck, foreground gantries and pipes, and atmosphere masks. Flat magenta separation, no characters, text, logos, UI, baked particles, or full-scene wallpaper.

### Enemy-family attachment prompts

Each attachment sheet used its current articulated rig source as an identity reference and retained the same camera, material response, lighting direction, and silhouette language. Packet requested modular Cache Hound sensor, relay, tail, and ankle pieces plus reinforced Relay Ram plates and piston guards. Needle requested Vector Mantis scythes, head fin, and signal tail plus Spine Courier relay, stabilizer, and fins. Null requested Crown Hand plates, wrist crown, and shoulder shard plus Void Shard crown, core casing, lower spear, and orbit plate. All parts were isolated in a 4x2 grid on flat magenta with no full character, floor, cast shadow, text, logo, or watermark.

### Local processing

`scripts/process-environment-kit.py` extracts fixed panel coordinates, removes connected chroma with a one-pixel alpha feather, trims empty padding, halves the far and atmosphere layers, exports visually lossless WebP, and writes authored spark, cable, gate, and light points. `scripts/process-rig-sheet.py` adds the 4x2 family attachment grids to the existing lossless atlases, records exact variant membership, and rejects packed-frame overlap.
