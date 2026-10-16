# Dungeon release checklist

Revision: 2026-10-15. Replaces the former typing-test/Overdrive promotion playbook. The dungeon implementation has passed the local verification recorded in the migration log. GitHub push is authorized; app/Worker deployment and public announcements are separate release actions.

## Before release

- [x] Complete the [delivery gates](docs/todo.md), with real playable Endless and accurately labelled mode availability.
- [x] Review every page against [interaction design](docs/design.md) and [art bible](docs/art-bible.md).
- [x] Run unit, coverage, build, E2E, lint, web/server TypeScript and retirement audits on the final source.
- [x] Capture actual dungeon screenshots and machine-readable profile evidence; reference images are not product evidence.
- [ ] Capture a human-reviewed gameplay recording before a public launch.
- [x] Verify EN/ID, keyboard-only play, text separation, accessible input, sound unlock and Reduced Effects.
- [x] Measure crowded/boss frame times, 15-minute memory behavior and repeated mode teardown.
- [x] Complete each enabled multiplayer mode with independent real clients; report local/WAN limitations.
- [x] Preserve old saves; validate new namespace/account schema and distinguish local from verified ranked results.
- [x] Audit final public assets, licensing, dependency use and production URLs.
- [x] Review Worker configuration and environment bindings before any deploy; the obsolete Ocean deployment alias is retired.
- [ ] Obtain final deployment authorization when needed by the active task; this planning change does not deploy.

## Public description and evidence

Use the dungeon identity in [repository metadata](.github/repository.yml). Describe only implemented mechanics and supported modes. Do not claim the source GDD's target frame rate, fake multiplayer population, old Ocean test results or unbuilt Steam support as shipped features.

No external marketing account, messaging, analytics service, crawler configuration or paid tooling is configured here. Revisit promotion only after a playable build exists.
