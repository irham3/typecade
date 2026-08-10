# Feature-Gated Overdrive Navigation

## Scope

Add Overdrive to the shared Typecade navbar while the mode remains behind `NEXT_PUBLIC_OVERDRIVE` and the `/overdrive` route. Document the temporary route and launch behavior in `README.md`.

This change covers requirement F-2. It does not move Overdrive to the homepage or add it to the sitemap. PRD milestone M5 owns that launch change.

## Navigation behavior

The shared navbar will use this order:

1. Practice
2. Overdrive
3. Arena
4. Learn
5. Board

The Overdrive item will:

- Link to `/overdrive`.
- Use the existing `Zap` icon from `components/icons.tsx`.
- Render in both desktop and mobile navigation.
- Render only when `process.env.NEXT_PUBLIC_OVERDRIVE === "true"`.
- Use the navbar's existing active-state rule for `/overdrive` and nested paths.

The route guard in `app/overdrive/page.tsx` remains the authority. When the flag is disabled, the navbar hides the item and direct access to `/overdrive` returns the existing not-found response.

## Documentation

`README.md` will state that Overdrive currently lives at `/overdrive`, requires `NEXT_PUBLIC_OVERDRIVE=true`, and appears in navigation only while that flag is enabled. The route may replace the homepage only after the soft-launch gates in PRD milestone M5 pass.

The README will keep the route note short. A later `docs/architecture.md` can own the complete route registry and project tree.

## Accessibility and layout

The existing navbar link supplies the visible `Overdrive` label and keyboard focus behavior. The icon supports the label and does not replace it. The fifth item must fit the current desktop navigation container and mobile drawer without changing spacing tokens or introducing a new breakpoint.

## Verification

- Run ESLint against `components/navbar.tsx`.
- Run the Overdrive Playwright smoke test with `NEXT_PUBLIC_OVERDRIVE=true`.
- Confirm the desktop navbar and mobile drawer expose an `Overdrive` link to `/overdrive` when the flag is enabled.
- Confirm the navbar source excludes that item when the flag comparison evaluates false.
- Run `git diff --check`.

## Out of scope

- Moving Overdrive to `/`.
- Adding `/overdrive` to `sitemap.xml` before launch.
- Reworking navbar visuals or responsive breakpoints.
- Changing the Overdrive route guard.
