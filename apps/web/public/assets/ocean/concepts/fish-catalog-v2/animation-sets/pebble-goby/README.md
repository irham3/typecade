# Pebble Goby animation set

Normalized animation strips for the Common-tier Pebble Goby. Each strip contains only this fish, with fixed `128x96` frame cells, center-body pivot target `(0.5, 0.55)`, transparent alpha, and nearest-neighbor pixel edges.

| State | File | Frames | Playback contract |
| --- | --- | ---: | --- |
| Idle | `pebble_goby_idle_4f.png` | 4 | Loop at 8 FPS (`A-B-C-B`) |
| Swim | `pebble_goby_swim_6f.png` | 6 | Loop at 10 FPS (`A-B-C-D-C-B`) |
| Bite | `pebble_goby_bite_4f.png` | 4 | One-shot at 12 FPS |
| Struggle | `pebble_goby_struggle_6f.png` | 6 | Loop while tension is high at 12 FPS |
| Stunned | `pebble_goby_stunned_4f.png` | 4 | Loop/hold at 6 FPS |
| Caught | `pebble_goby_caught_4f.png` | 4 | One-shot at 10 FPS, hold final frame |
| Escape | `pebble_goby_escape_6f.png` | 6 | One-shot at 14 FPS |

The source strips were generated from the Pebble Goby reference using OpenAI image generation, then normalized deterministically to the project frame contract. The swim strip's accidental right-facing frame was mirrored to preserve the project's left-facing hooked-fish convention.

These are still concept/draft animation assets. Before runtime approval, inspect at native game scale and run final alpha, palette, pivot, and in-engine motion QA.
