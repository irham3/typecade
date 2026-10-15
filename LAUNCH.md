# Dungeon release checklist

Revision: 2026-10-15. Replaces the former typing-test/Overdrive promotion playbook. Current phase is planning; no deployment or public announcement is authorized by this checklist.

## Before release

- [ ] Complete the [delivery gates](docs/todo.md), with real playable Endless and accurately labelled mode availability.
- [ ] Review every page against [interaction design](docs/design.md) and [art bible](docs/art-bible.md).
- [ ] Run unit, coverage, build, E2E, lint, web/server TypeScript and retirement audits on the final source.
- [ ] Capture actual dungeon screenshots and a short gameplay recording; reference images are not product evidence.
- [ ] Verify EN/ID, keyboard-only play, text separation, accessible input, sound unlock and Reduced Effects.
- [ ] Measure crowded/boss frame times, 15-minute memory behavior and repeated mode teardown.
- [ ] Complete each enabled multiplayer mode with independent real clients; report local/WAN limitations.
- [ ] Preserve old saves; validate new namespace/account schema and distinguish local from verified ranked results.
- [ ] Audit final public assets, licensing, dependency use and production URLs.
- [ ] Review Worker configuration and environment bindings before any deploy; legacy Ocean identifiers are still present.
- [ ] Obtain final deployment authorization when needed by the active task; this planning change does not deploy.

## Public description and evidence

Use the dungeon identity in [repository metadata](.github/repository.yml). Describe only implemented mechanics and supported modes. Do not claim the source GDD's target frame rate, fake multiplayer population, old Ocean test results or unbuilt Steam support as shipped features.

No external marketing account, messaging, analytics service, crawler configuration or paid tooling is configured here. Revisit promotion only after a playable build exists.
