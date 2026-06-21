# Supabase Free-Tier Keep-Alive Setup

Supabase **pauses** free-tier projects after ~7 days without REST API / Auth
activity. When paused, the next request takes 1–2 minutes to wake the database
back up, and during that window queries return errors that previously made the
UI look silently broken (empty leaderboards, empty rooms, missing profile).

This fix combines three layers of defense.

## What's included

| Layer | File | What it does |
|---|---|---|
| 1. SQL migration | `supabase/migrations/0001_keepalive_cron.sql` | Schedules `pg_cron` jobs that ping the database every hour and clean up old log rows every day. |
| 2. Error classifier | `lib/supabase/error-handler.ts` | Detects paused / waking-up / network errors from Supabase and exposes a human-friendly message. |
| 3. UI banner | wired into `lobby.tsx`, `board-view.tsx`, race hooks | Shows "database is waking up" instead of an empty list when paused. |

> **Important:** `pg_cron` runs *inside* Postgres, which is **not always
> counted as external REST activity** by Supabase's auto-pause detector. For
> full protection you also need an external HTTP ping — see step 3 below.

## One-time setup

### Step 1 — Apply the SQL migration

1. Open Supabase Dashboard → SQL Editor.
2. Paste the entire contents of `supabase/migrations/0001_keepalive_cron.sql`.
3. Click **Run**.

Verify:

```sql
SELECT jobname, schedule FROM cron.job;
-- Expect two rows: typecade-keepalive (0 * * * *) and typecade-cleanup (0 3 * * *)
```

### Step 2 — Verify the function

```sql
SELECT public.ping();
SELECT * FROM public.keepalive_log ORDER BY ran_at DESC LIMIT 5;
```

You should see a new row every hour.

### Step 3 — Set up external HTTP keep-alive (recommended)

`pg_cron` alone is not enough. Add an external monitor that hits the REST API
so Supabase sees real HTTP traffic.

**UptimeRobot (free, recommended):**

1. Sign up at https://uptimerobot.com (free tier = 50 monitors, 5-min interval).
2. Add a new monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Typecade Supabase Keep-Alive
   - **URL:** `https://YOUR-PROJECT.supabase.co/rest/v1/keepalive_log?select=id&limit=1`
   - **Monitoring Interval:** 60 minutes (free tier minimum)
   - **Monitor Timeout:** 30 seconds
3. Save.

Replace `YOUR-PROJECT` with your Supabase project ref (visible in the project
URL). No API key is required because the `keepalive_log` table has a read
policy open to `anon`.

### Step 4 — Verify from the UI

Force-pause your project from Supabase Dashboard → Settings → General →
"Restore project" toggle → pause. Then:

1. Open `/board` or `/arena`.
2. You should see the orange banner: *"The database is waking up from sleep…"*
3. After 1–2 minutes the data loads automatically.

## Troubleshooting

**pg_cron extension not available**

Free-tier Supabase projects ship with `pg_cron` pre-installed. If you see
`extension "pg_cron" is not allowed`, your project may be on a legacy plan —
upgrade to the current free tier in Dashboard → Settings → Plan.

**Migration runs but no jobs appear**

Check for errors in:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

**UptimeRobot shows the monitor as down**

Verify the URL manually in a browser. If you get a 404, the table name is
case-sensitive — use exactly `keepalive_log`.

## Tuning constants

Both polling intervals live in `lib/supabase/error-handler.ts` so you can tune
them without touching call sites:

```ts
export const LOBBY_POLL_INTERVAL_MS  = 30_000; // lobby room list
export const BOARD_POLL_INTERVAL_MS  = 60_000; // leaderboard
```

## Why not just upgrade?

You can, and it removes the need for all of this. But if you'd rather stay on
the free tier until you have meaningful traffic, the three layers above
together reliably prevent auto-pause in our experience.

— typecade team