create table if not exists public.daily_seeds (
  id bigint generated always as identity primary key,
  run_date date not null,
  language text not null check (language in ('EN', 'ID')),
  ruleset_version text not null,
  rng_version text not null,
  word_pool_version text not null,
  seed text not null,
  created_at timestamptz not null default now(),
  unique (run_date, language, ruleset_version)
);

create table if not exists public.runs (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  client_run_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  mode text not null check (mode in ('daily', 'free')),
  status text not null check (status in ('started', 'submitted', 'accepted', 'verified', 'rejected')),
  run_date date,
  seed text not null,
  language text not null check (language in ('EN', 'ID')),
  ruleset_version text not null,
  rng_version text not null,
  word_pool_version text not null,
  client_version text not null,
  win boolean,
  final_zone smallint check (final_zone between 1 and 32767),
  final_stage text check (final_stage in ('warmup', 'rush', 'glitch')),
  standard_score bigint check (standard_score >= 0),
  endless_score bigint check (endless_score >= 0),
  final_score bigint check (final_score >= 0),
  duration_ms integer check (duration_ms >= 0),
  accuracy_bps smallint check (accuracy_bps between 0 and 10000),
  average_wpm_x100 integer check (average_wpm_x100 >= 0),
  total_typos integer check (total_typos >= 0),
  max_combo integer check (max_combo >= 0),
  highest_mult integer check (highest_mult >= 1),
  build jsonb not null default '{"keycaps":[],"macros":[]}'::jsonb,
  replay_sha256 text,
  rejection_code text,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_run_id),
  check ((mode = 'daily' and run_date is not null) or (mode = 'free' and run_date is null))
);

create unique index if not exists runs_one_daily_attempt_idx
  on public.runs (user_id, run_date, language, ruleset_version)
  where mode = 'daily' and user_id is not null;

create index if not exists runs_user_created_idx
  on public.runs (user_id, created_at desc, id desc);

create index if not exists runs_daily_board_idx
  on public.runs (run_date, language, ruleset_version, final_score desc, submitted_at, id)
  where mode = 'daily' and status in ('accepted', 'verified');

create index if not exists runs_endless_board_idx
  on public.runs (language, ruleset_version, endless_score desc, submitted_at, id)
  where mode = 'free' and endless_score > 0 and status in ('accepted', 'verified');

create table if not exists public.leaderboard_entries (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.runs(id) on delete cascade unique,
  run_public_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  board text not null check (board in ('daily', 'endless')),
  board_date date,
  language text not null check (language in ('EN', 'ID')),
  ruleset_version text not null,
  score bigint not null check (score >= 0),
  final_zone smallint not null check (final_zone between 1 and 32767),
  accuracy_bps smallint not null check (accuracy_bps between 0 and 10000),
  average_wpm_x100 integer not null check (average_wpm_x100 >= 0),
  build_fingerprint jsonb not null,
  verification_state text not null check (verification_state in ('accepted', 'verified')),
  finished_at timestamptz not null,
  created_at timestamptz not null default now(),
  check ((board = 'daily' and board_date is not null) or (board = 'endless' and board_date is null))
);

create table if not exists public.replays (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.runs(id) on delete cascade unique,
  user_id uuid references auth.users(id) on delete set null,
  codec_version smallint not null,
  storage_key text not null unique,
  byte_length integer not null check (byte_length > 0),
  input_count integer not null check (input_count >= 0),
  sha256 text not null,
  verification_state text not null check (verification_state in ('pending', 'verified', 'rejected')),
  verification_code text,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists replays_user_id_idx on public.replays (user_id);

alter table public.daily_seeds enable row level security;
alter table public.runs enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.replays enable row level security;

revoke all on public.daily_seeds from anon, authenticated;
revoke all on public.runs from anon, authenticated;
revoke all on public.leaderboard_entries from anon, authenticated;
revoke all on public.replays from anon, authenticated;

grant select on public.daily_seeds to anon, authenticated;
grant select on public.leaderboard_entries to anon, authenticated;
grant select on public.runs to authenticated;
grant select on public.replays to authenticated;

drop policy if exists daily_seeds_read on public.daily_seeds;
create policy daily_seeds_read on public.daily_seeds for select using (true);

drop policy if exists runs_read_own on public.runs;
create policy runs_read_own on public.runs for select using ((select auth.uid()) = user_id);

drop policy if exists leaderboard_entries_read on public.leaderboard_entries;
create policy leaderboard_entries_read on public.leaderboard_entries for select using (true);

drop policy if exists replays_read_own on public.replays;
create policy replays_read_own on public.replays for select using ((select auth.uid()) = user_id);
