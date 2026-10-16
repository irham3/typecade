# Dungeon accounts and preserved historical data

Updated 2026-10-15. Migration `20261015133316_dungeon_accounts.sql` is applied to the Typecade project. The prior Ocean/Overdrive migrations and user data remain separate and intact. Multiplayer uses Cloudflare Durable Objects, not database room tables.

## Dungeon schema

- `dungeon_saves`: private versioned checkpoint and monotonically increasing revision.
- `dungeon_records`: private best survival time, level and kills, with a sanitized display name.
- `dungeon_achievements`: private First Strike, Tempered Blade, Unbroken Rhythm and Obsidian Breaker unlocks.
- `save_dungeon_checkpoint`: authenticated-only atomic save/records/achievements, payload/version/limit checks and an expected-revision conflict guard. Direct table writes are denied.
- `dungeon_leaderboard`: curated top 20 display name/time/level/kills only. Public access is intentional. These are browser-reported community records, never verified ranked scores.

RLS limits all direct reads to the authenticated owner. Both functions pin an empty search path and qualify database objects. The save RPC derives ownership from `auth.uid()`; clients cannot supply another user's ID. The browser additionally runs complete domain checkpoint validation before upload and restore.

Account load, upload and replace are explicit UI actions. Local runs remain usable offline. Conflicts require reloading the cloud record; no automatic overwrite or interpretation of historical XP occurs. Late account responses are discarded after sign-out/account change/teardown.

## Verification

[Transactional SQL checks](tests/dungeon_accounts.sql) exercise owner/cross-account reads, anonymous denial, direct-write denial, invalid checkpoint rejection, revision conflict, atomic achievements and public field limits. QA writes roll back; the script reuses an existing account without creating an auth user or sending email. Run against an isolated project when no suitable account exists.

Client and browser tests cover malformed revisions, compatibility, network failures, deliberate restore and stale responses. Physical email delivery/OAuth flows are not covered by those tests.

The security advisor reports the two intended security-definer endpoints as executable by their documented roles. Historical mutable-search-path functions and auth-password protection advisories are outside this dungeon migration; no unrelated policies were changed. Review the [Supabase function advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) before broadening either RPC.

Public configuration stays in `env.example`. Never bundle service-role/database credentials. Preserve migration history: `0001_keepalive_cron.sql`, `0002_overdrive_competition.sql` and `20261013141438_ocean_adventure_accounts.sql` are historical, not new dungeon score validation.
