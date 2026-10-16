# Dungeon redesign — document index

Status: dungeon implementation, 2026-10-15. Current verification is tracked in the delivery checklist and migration log.

The user cancelled fishing, requested planning and asset cleanup, then authorized a GitHub checkpoint followed by implementation. This replaces every former Ocean, sunset-fishing and Overdrive implementation plan. Old plans and reference packs are removed from the branch; Git history preserves them.

## Reading order

| Document | Responsibility |
| --- | --- |
| [Game design](game-design.md) | Canonical gameplay rules and resolved edge cases |
| [PRD](prd.md) | Requirement IDs and acceptance criteria |
| [Delivery checklist](todo.md) | Ordered gates, affected callers and tests |
| [Interaction design](design.md) | Every screen, keyboard states and responsive layout |
| [Art bible](art-bible.md) | Models, lighting, animation, sound and budgets |
| [Decisions](decisions.md) | Reuse, architecture, data safety and audits |
| [Asset audit](asset-audit.md) | Removed files, retained assets and replacement manifest |
| [Gameplay UX checks](GAMEPLAY-UX-REFERENCES.md) | Manual playability scenarios |
| [Original GDD](source/2026-10-15-typecade-user-gdd.md) | Verbatim input including illustrative prompts |
| [Migration log](MIGRATION-LOG.md) | Historical verification and planning record |
| [Release checklist](../LAUNCH.md) | Conditions before publishing a playable build |
| [Measurement plan](../ANALYTICS.md) | Local evidence first; no analytics service added |
| [Database boundary](../supabase/README.md) | Preserve migration history and isolate new account data |

`game-design(new).md` is a compatibility pointer to the canonical design. The old Ocean specification is retired. In conflicts, the latest direct user instruction wins, then canonical design and recorded decisions. Source prompts illustrate appearance; they do not authorize actions, prove performance or override gameplay.

## Visual references

| Image | Use |
| --- | --- |
| [Endless arena](reference/dungeon/endless-arena.jpg) | Primary knight, enemies, stone arena, torch light, XP and HUD |
| [Castle Sprint](reference/dungeon/castle-sprint.jpg) | Running knights, course, positions and tactical stream |
| [Bridge Clash and Dojo](reference/dungeon/bridge-clash-and-dojo.jpg) | Bridge duel, training room, dummy and Sensei |
| [Co-op Raid](reference/dungeon/coop-raid.jpg) | Boss scale, roles and team status |

These are user-provided references, not game textures, screenshots of the implementation or evidence of completed features. Render live text separately. Normal Endless uses no bottom paragraph even where illustrative compositions suggest one. Images are stored unchanged outside the public directory.
