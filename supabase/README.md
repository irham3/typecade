# Supabase — existing data and dungeon migration boundary

Updated 2026-10-15. Current phase is planning. No migration is applied, edited or removed by the dungeon reset.

## Existing migration files

| File | Purpose / status |
| --- | --- |
| [0001_keepalive_cron.sql](migrations/0001_keepalive_cron.sql) | Historical keepalive jobs; do not treat it as proof of current hosting behavior |
| [0002_overdrive_competition.sql](migrations/0002_overdrive_competition.sql) | Historical Overdrive competition schema; not the new dungeon ruleset |
| [20261013141438_ocean_adventure_accounts.sql](migrations/20261013141438_ocean_adventure_accounts.sql) | Existing Ocean progress, saves and achievements used by current account code |

Preserve migration history and existing user data. These files are not unused visual assets and must not be deleted to remove a theme. The old README's Next.js paths, routes, polling adapters and external-monitor setup are retired.

## Dungeon account plan

Use a separate versioned dungeon schema/namespace after its save contract is implemented. Do not send dungeon checkpoints through Ocean validation, reinterpret captain XP as survival score, or overwrite historical achievements.

Before enabling new cloud storage, specify payload limits, version validation, ownership/RLS, deterministic conflict behavior and local/offline handling. Public competitive scores need server validation; a browser-provided WPM or elapsed time is not authoritative.

Current account integration lives in `apps/web/src/account`. Real multiplayer rooms use the Cloudflare Worker/Durable Objects in `apps/web/src/server`, not Supabase multiplayer tables. Public URL/anonymous-key configuration remains in the root `env.example`; never put service-role credentials in Vite client code.

See the [architecture decisions](../docs/decisions.md) and [delivery checklist](../docs/todo.md). No database access or external hosting change is needed for planning.
