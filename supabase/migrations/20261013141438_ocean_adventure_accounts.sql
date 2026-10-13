create table if not exists public.ocean_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  xp bigint not null default 0 check (xp >= 0),
  coins bigint not null default 0 check (coins >= 0),
  catches bigint not null default 0 check (catches >= 0),
  species_discovered smallint not null default 0 check (species_discovered between 0 and 10),
  best_voyage integer not null default 1 check (best_voyage >= 1),
  updated_at timestamptz not null default now()
);

create table if not exists public.ocean_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.ocean_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null check (achievement_id in ('first_catch', 'three_species', 'captain_level_5', 'voyage_2', 'leviathan_caught')),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.ocean_progress enable row level security;
alter table public.ocean_saves enable row level security;
alter table public.ocean_achievements enable row level security;

revoke all on public.ocean_progress, public.ocean_saves, public.ocean_achievements from anon, authenticated;
grant select on public.ocean_progress to anon, authenticated;
grant insert, update on public.ocean_progress to authenticated;
grant select, insert, update on public.ocean_saves to authenticated;
grant select, insert on public.ocean_achievements to authenticated;

create policy ocean_progress_public_read on public.ocean_progress for select to anon, authenticated using (true);
create policy ocean_progress_owner_insert on public.ocean_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ocean_progress_owner_update on public.ocean_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ocean_saves_owner_read on public.ocean_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy ocean_saves_owner_insert on public.ocean_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy ocean_saves_owner_update on public.ocean_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy ocean_achievements_owner_read on public.ocean_achievements for select to authenticated using ((select auth.uid()) = user_id);
create policy ocean_achievements_owner_insert on public.ocean_achievements for insert to authenticated with check ((select auth.uid()) = user_id);
