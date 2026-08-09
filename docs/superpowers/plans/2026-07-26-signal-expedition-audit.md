# Phase 0 - Baseline & Audit Report

## Git State
```
Branch: codex/signal-expedition
HEAD: 60b1131c28c5a12b2149fa39fd2ce21ad139714b
```

## Baseline Execution
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 22 warnings (no errors)
- `npm test`: 1 failed test (`features/overdrive/canvas/formation/__tests__/formation-director.test.ts` expected 2 active targets but got 3).
- `npm run build`: Success

## Asset Inventory (`public/overdrive/art`)
```
public/overdrive/art/environment/signal-trench-atmosphere-v1.webp
public/overdrive/art/environment/signal-trench-deck-v1.webp
public/overdrive/art/environment/signal-trench-far-v1.webp
public/overdrive/art/environment/signal-trench-foreground-v1.webp
public/overdrive/art/environment/signal-trench-kit-v1.json
public/overdrive/art/environment/signal-trench-machinery-v1.webp
public/overdrive/art/environment/signal-trench-midground-v1.webp
public/overdrive/art/keystone-warden-v2.png
public/overdrive/art/keystone-warden-v3.png
public/overdrive/art/needle-wraith-v2.png
public/overdrive/art/needle-wraith-v3.png
public/overdrive/art/null-crown-v2.png
public/overdrive/art/null-crown-v3.png
public/overdrive/art/packet-stalker-v2.png
public/overdrive/art/packet-stalker-v3.png
public/overdrive/art/poses/needle-wraith-pose.webp
public/overdrive/art/poses/null-crown-pose.webp
public/overdrive/art/poses/packet-stalker-pose.webp
public/overdrive/art/poses/warden-pose.webp
public/overdrive/art/rigs/needle-rig-v1.json
public/overdrive/art/rigs/needle-rig-v1.webp
public/overdrive/art/rigs/null-rig-v1.json
public/overdrive/art/rigs/null-rig-v1.webp
public/overdrive/art/rigs/packet-rig-v1.json
public/overdrive/art/rigs/packet-rig-v1.webp
public/overdrive/art/rigs/warden-rig-v1.json
public/overdrive/art/rigs/warden-rig-v1.webp
public/overdrive/art/source/keystone-warden-v4-sheet.psd
public/overdrive/art/source/needle-wraith-v4-sheet.psd
public/overdrive/art/source/null-crown-v4-sheet.psd
public/overdrive/art/source/packet-stalker-v4-sheet.psd
```

## Legacy and Placeholder Searches
- **`Math.random` / React keys**: Found multiple non-deterministic / unstable keys usage in legacy components (`lib/words.ts`, `lib/store.ts`, `features/overdrive/components/hud.tsx`, `features/overdrive/components/shop.tsx`). Overdrive canvas correctly avoids `Math.random` (`features/overdrive/canvas/camera/camera-director.ts` uses deterministic shake).
- **Placeholders**: `features/overdrive/canvas/effects/combat-effects.ts` contains `// placeholder for rail step` and `// Overdrive Breach specific effects can be added here later` inside `combat-director.ts`.
