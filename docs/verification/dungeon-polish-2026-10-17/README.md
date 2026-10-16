# Dungeon polish verification — 2026-10-17

Scope: finite boss combo/retaliation and banked drafts; safe armor strike spacing/recovery; attributed combat and resource feedback; bounded visual dressing; local gameplay history. Supabase work is explicitly postponed. No database/Auth mutation or SQL backup is claimed.

## Local current-source checks

- `npm run test:coverage`: 188 tests in 27 files passed. Unchanged 100% global statements (4495), branches (4243), functions (691), lines (2433). See coverage-summary.json.
- `npm run test:e2e -- --project=chromium e2e/boss.spec.ts e2e/dungeon.spec.ts e2e/tutorial.spec.ts --reporter=line`: seven passed in 44.6 seconds, against the production build served by the Worker. Includes a one-HP boss surviving until the final paragraph letter, drafts banked, armor strike spacing greater than three units, recovery without HP loss, 20 successive dashes, small viewports, optional tutorial and actual +2 HP feedback.
- `npm run lint -- --ignore-pattern test.js`, `npx tsc --noEmit`, `npm run typecheck:rooms`, `npm run build`, `npx wrangler deploy --dry-run`: passed.
- `npm audit`: zero vulnerabilities.
- `git diff --check`: clean. Retirement/headless production audits from docs/decisions.md: no matches.

The captures in this folder are from that seven-case run. The earlier 63-case local matrix predates this polish and is not evidence for this revision.

## Remaining release evidence

Final GitHub validation and all three browser projects are pending on PR #10. CI retains every assertion and the 100% coverage gate, splitting browser projects into separate jobs and giving Linux Firefox a real Xvfb display.

The 900-active-second production hardware profile is pending. No universal FPS, phone performance, listening calibration, cloud history or global leaderboard claim is made.
