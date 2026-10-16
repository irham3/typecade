-- Independent dungeon namespace. Previous account saves and achievements are untouched.
create table public.dungeon_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 save_data jsonb not null,
 revision bigint not null default 0 check (revision >= 0),
 updated_at timestamptz not null default now()
);
create table public.dungeon_records (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 24),
 best_seconds integer not null check (best_seconds between 0 and 1000000000),
 best_level integer not null check (best_level between 1 and 1000000),
 best_kills bigint not null check (best_kills >= 0)
);
create table public.dungeon_achievements (
 user_id uuid not null references auth.users(id) on delete cascade,
 achievement_id text not null check (achievement_id in ('first_strike','level_five','clean_fifty','boss_slayer')),
 unlocked_at timestamptz not null default now(),
 primary key (user_id, achievement_id)
);
alter table public.dungeon_saves enable row level security;
alter table public.dungeon_records enable row level security;
alter table public.dungeon_achievements enable row level security;
revoke all on public.dungeon_saves, public.dungeon_records, public.dungeon_achievements from anon, authenticated;
grant select on public.dungeon_saves, public.dungeon_records, public.dungeon_achievements to authenticated;
create policy dungeon_save_owner on public.dungeon_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy dungeon_record_owner on public.dungeon_records for select to authenticated using ((select auth.uid()) = user_id);
create policy dungeon_achievement_owner on public.dungeon_achievements for select to authenticated using ((select auth.uid()) = user_id);

create function public.save_dungeon_checkpoint(checkpoint jsonb, expected_revision bigint, knight_name text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
 owner_id uuid := auth.uid();
 next_revision bigint;
 seconds integer; run_level integer; kills bigint; streak bigint; depth integer;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 if expected_revision is null or expected_revision < 0 or expected_revision > 1000000000
  or checkpoint is null or jsonb_typeof(checkpoint) <> 'object'
  or octet_length(checkpoint::text) > 500000
  or checkpoint->>'version' is distinct from '1'
  or jsonb_typeof(checkpoint->'seed') is distinct from 'string'
  or not (checkpoint ?& array['rng','worldTime','nextBoss','spawnAt','nextId','xp','totalXp','gold','words','correct','errors','streak','skills','relics','queue','offers','resumePhase','afterDraft','pendingDrafts','legendaryDrafts','prefix','command','paragraph','cursor','labelLimit','notice','boss','target','stagger'])
  or coalesce(checkpoint->>'language','') not in ('en','id')
  or coalesce(checkpoint->>'phase','') not in ('ready','paused','dead')
  or jsonb_typeof(checkpoint->'player') is distinct from 'object'
  or jsonb_typeof(checkpoint->'enemies') is distinct from 'array'
  or jsonb_typeof(checkpoint->'loot') is distinct from 'array'
  or jsonb_typeof(checkpoint->'effects') is distinct from 'array'
  or jsonb_typeof(checkpoint->'projectiles') is distinct from 'array'
  or jsonb_typeof(checkpoint->'skills') is distinct from 'object'
  or jsonb_typeof(checkpoint->'relics') is distinct from 'object'
  or jsonb_typeof(checkpoint->'queue') is distinct from 'array'
  or jsonb_typeof(checkpoint->'offers') is distinct from 'array'
 then raise exception 'Invalid dungeon checkpoint'; end if;
 if jsonb_array_length(checkpoint->'enemies') > 128 or jsonb_array_length(checkpoint->'loot') > 256
  or jsonb_array_length(checkpoint->'effects') > 128 or jsonb_array_length(checkpoint->'projectiles') > 64
  or char_length(checkpoint->>'seed') > 200 or knight_name is null or char_length(knight_name) not between 1 and 24
  or knight_name ~ '[<>[:cntrl:]]'
 then raise exception 'Invalid dungeon limits'; end if;
 if not (checkpoint->'player' ?& array['x','z','hp','maxHp','mana','invincible','dashAt','dashFrom'])
  or exists (select 1 from unnest(array['x','z','hp','maxHp','mana','invincible','dashAt']) as field(key) where jsonb_typeof(checkpoint->'player'->field.key) is distinct from 'number')
  or jsonb_typeof(checkpoint->'player'->'dashFrom') is distinct from 'object'
 then raise exception 'Invalid dungeon player'; end if;
 if (checkpoint->'player'->>'maxHp')::numeric not between 1 and 100
  or (checkpoint->'player'->>'hp')::numeric not between 0 and (checkpoint->'player'->>'maxHp')::numeric
  or (checkpoint->'player'->>'mana')::numeric not between 0 and 100
  or abs((checkpoint->'player'->>'x')::numeric)>1000000 or abs((checkpoint->'player'->>'z')::numeric)>1000000
  or jsonb_array_length(checkpoint->'queue')>6 or jsonb_array_length(checkpoint->'offers')>3
 then raise exception 'Invalid dungeon player limits'; end if;
 if not (checkpoint ?& array['time','level','kills','bestStreak','biome']) or exists (select 1 from unnest(array['time','level','kills','bestStreak','biome']) as field(key) where jsonb_typeof(checkpoint->field.key) is distinct from 'number') then raise exception 'Missing dungeon progress'; end if;
 if exists(select 1 from unnest(array['level','kills','bestStreak','biome']) as field(key) where (checkpoint->>field.key)::numeric % 1 <> 0) then raise exception 'Invalid dungeon progress'; end if;
 seconds := floor((checkpoint->>'time')::numeric)::integer;
 run_level := (checkpoint->>'level')::integer;
 kills := (checkpoint->>'kills')::bigint;
 streak := (checkpoint->>'bestStreak')::bigint;
 depth := (checkpoint->>'biome')::integer;
 if seconds not between 0 and 1000000000 or run_level not between 1 and 1000000
  or kills < 0 or kills > 9007199254740991 or streak < 0 or depth < 0
 then raise exception 'Invalid dungeon progress'; end if;
 insert into public.dungeon_saves(user_id,save_data) values(owner_id,checkpoint) on conflict do nothing;
 update public.dungeon_saves s set save_data=checkpoint,revision=s.revision+1,updated_at=now()
  where s.user_id=owner_id and s.revision=expected_revision returning s.revision into next_revision;
 if next_revision is null then raise exception 'Save conflict: reload the cloud record before uploading' using errcode='40001'; end if;
 insert into public.dungeon_records as r(user_id,display_name,best_seconds,best_level,best_kills)
  values(owner_id,knight_name,seconds,run_level,kills)
  on conflict(user_id) do update set display_name=excluded.display_name,
   best_seconds=greatest(r.best_seconds,excluded.best_seconds),best_level=greatest(r.best_level,excluded.best_level),best_kills=greatest(r.best_kills,excluded.best_kills);
 insert into public.dungeon_achievements(user_id,achievement_id)
  select owner_id, id from (values ('first_strike',kills>0),('level_five',run_level>=5),('clean_fifty',streak>=50),('boss_slayer',depth>0)) as earned(id,unlocked)
  where unlocked on conflict do nothing;
 return next_revision;
end;
$$;
revoke all on function public.save_dungeon_checkpoint(jsonb,bigint,text) from public, anon;
grant execute on function public.save_dungeon_checkpoint(jsonb,bigint,text) to authenticated;

-- These are community, browser-reported records. They are never ranked/verified results.
create function public.dungeon_leaderboard()
returns table(display_name text,best_seconds integer,best_level integer,best_kills bigint)
language sql stable security definer set search_path = '' as $$
 select r.display_name,r.best_seconds,r.best_level,r.best_kills from public.dungeon_records r
 order by r.best_seconds desc,r.best_kills desc,r.user_id limit 20;
$$;
revoke all on function public.dungeon_leaderboard() from public;
grant execute on function public.dungeon_leaderboard() to anon, authenticated;
