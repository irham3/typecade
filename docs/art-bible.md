# Ocean Typing RPG Art Bible

Status: locked for Milestone 0/1 prototype
Reference: `docs/reference/typecade-ui-reference.jpg`

## Visual Identity

Ocean Typing RPG uses bright fantasy-ocean environments behind compact, dark-navy game chrome. The world should feel luminous and playful, while typing information remains crisp, high-contrast, and stable.

## Silhouette Language

Fish use simple side-view silhouettes with exaggerated fins, tails, spines, horns, or body shapes that stay readable at 96 px wide. Common fish are rounded and friendly. Uncommon and rare fish add asymmetric fins, glow markings, or longer silhouettes. The boss uses a much larger crescent/serpent profile with a dorsal landmark and a clear threat shape.

Equipment uses chunky, readable forms: one boat/platform, rods with distinct reel silhouettes, clean line styles, small bait icons, and one net. UI icons are simple filled symbols inside the locked dark-navy chrome.

## Outline Thickness

Sprites use a dark marine outline equivalent to 2-3 px at 128 px export size and 1-2 px at 64 px display size. UI panels use a light border plus a darker outer edge to match the reference chrome. VFX textures are grayscale masks without colored outlines so Phaser can tint them per event.

## Shading Method

Fish and equipment use cel-shaded pixel-inspired forms: two main value bands, one small highlight band, and sparse texture pixels. Backgrounds use soft layered shapes and low-contrast wave bands. UI surfaces use flat dark navy fills, light bevel lines, and warm gold accents; text and dynamic numbers remain code-rendered.

## Color Palette

- Water: cyan and teal families for sea, bubbles, wake, and calm system feedback.
- Reef life: coral red and magenta for rare markings, living reef details, and spectacle.
- Rewards: warm gold for stars, coins, legendary catches, and completion flashes.
- Common systems: sea green for tension recovery, common fish accents, and positive progress.
- Readability: white and near-black for target text, input, panel fills, and outlines.
- Danger: red only for typo, line critical, escape, and durability loss.

## Camera Angle

Gameplay is a side-on 2D fishing stage with a slight elevated horizon: boat/rod on the left, water body mid-screen, active fish right-center, HUD on screen-space overlays. Fish sprites face left when hooked, with pivots near body center so swim/struggle tweens read naturally.

## Texture Density

Foreground fish and equipment carry medium pixel texture density. Background parallax stays lower contrast and lower detail so the typing panel is always dominant. UI chrome may include bevels and tiny corner notches, but not dense ornament that fights text.

## Standard Sizes

- Common fish: 128x96 source frame, displayed around 84-132 px wide.
- Rare fish: 160x112 source frame, displayed around 120-170 px wide.
- Boss fish: 256x160 source frame, displayed around 220-320 px wide.
- Equipment icons: 64x64 source, displayed 32-48 px.
- Skill and UI icons: 64x64 source, displayed 32-48 px.
- VFX masks: 64x64 grayscale PNG.
- Background layers: 1536x864 WebP, anchored top-left, five layers per zone variant.

## Rarity Treatment

Common fish keep sea-green, blue, and yellow accent blocks with modest highlights. Uncommon and rare fish add magenta/coral markings, small glow specks, and a more elaborate frame. Boss fish receives gold/coral rim accents, unique scale, signature water VFX, and a three-phase presentation.

Rarity is never color-only: all UI displays include a text rarity label and star count.

## Export And Pivot Conventions

All transparent sprites are exported as PNG with trimmed content inside a fixed frame and at least 8 px padding at source size. Fish pivots are center-body (`0.5, 0.55`). Rods pivot near handle base. Boat/platform pivots bottom-center. UI panels use nine-slice-compatible corners. Background layers are opaque WebP. Audio uses OGG naming with silent/generated placeholders recorded in the asset register.

## Prototype Asset Policy

Milestone 0/1 may use CC0 Kenney base fish shapes that are recolored, renamed, and wrapped in the project content manifest. Generated-image API output is preferred for final production art, but missing credentials must not block this implementation.
