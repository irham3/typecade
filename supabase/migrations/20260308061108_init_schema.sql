-- ============================================================
-- Typecade Approved Schema Revamp
-- ============================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. languages
-- ============================================================
create table public.languages (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    created_at timestamptz not null default now()
);

-- Seed default languages
insert into public.languages (code, name)
values
    ('EN', 'English'),
    ('ID', 'Bahasa Indonesia');

-- ============================================================
-- 2. profiles  (linked to auth.users)
-- ============================================================
create table public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    email text,
    display_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (user_id, email, display_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================
-- 3. typing_tests  (solo typing test results)
-- ============================================================
create table public.typing_tests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    language_code text not null references public.languages(code),
    wpm integer not null default 0,
    accuracy integer not null default 0,
    mode text not null,              -- 'time' or 'words'
    time integer not null,           -- the value (e.g. 60 or 50)
    is_punctuation boolean not null default false,
    is_number boolean not null default false,
    created_at timestamptz not null default now()
);

create index idx_typing_tests_user_id on public.typing_tests(user_id);
create index idx_typing_tests_created_at on public.typing_tests(created_at desc);

-- ============================================================
-- 4. user_stats  (aggregated stats per user)
-- ============================================================
create table public.user_stats (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    avg_wpm integer not null default 0,
    avg_accuracy integer not null default 0,
    best_wpm integer not null default 0,
    best_accuracy integer not null default 0,
    total_test integer not null default 0,
    updated_at timestamptz not null default now()
);

-- Trigger function to automatically recalculate user_stats on every new typing_test
create or replace function public.auto_update_user_stats()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
    v_avg_wpm integer;
    v_avg_accuracy integer;
    v_best_wpm integer;
    v_best_accuracy integer;
    v_total_test integer;
begin
    select
        coalesce(avg(wpm), 0)::integer,
        coalesce(avg(accuracy), 0)::integer,
        coalesce(max(wpm), 0)::integer,
        coalesce(max(accuracy), 0)::integer,
        count(*)::integer
    into v_avg_wpm, v_avg_accuracy, v_best_wpm, v_best_accuracy, v_total_test
    from public.typing_tests
    where user_id = new.user_id;

    insert into public.user_stats (user_id, avg_wpm, avg_accuracy, best_wpm, best_accuracy, total_test, updated_at)
    values (new.user_id, v_avg_wpm, v_avg_accuracy, v_best_wpm, v_best_accuracy, v_total_test, now())
    on conflict (user_id) do update set
        avg_wpm = excluded.avg_wpm,
        avg_accuracy = excluded.avg_accuracy,
        best_wpm = excluded.best_wpm,
        best_accuracy = excluded.best_accuracy,
        total_test = excluded.total_test,
        updated_at = excluded.updated_at;
        
    return new;
end;
$$;

create trigger trg_auto_update_user_stats
    after insert on public.typing_tests
    for each row execute function public.auto_update_user_stats();

-- ============================================================
-- 5. arena_rooms
-- ============================================================
create table public.arena_rooms (
    id uuid primary key default gen_random_uuid(),
    code text not null unique constraint valid_code_length check(char_length(code) = 8),
    name text not null default 'New Arena',
    host_user_id uuid not null references auth.users(id) on delete cascade,
    language_code text not null references public.languages(code),
    max_players integer not null default 6,
    is_active boolean not null default false, -- Set by trigger depending on participant count
    is_racing boolean not null default false,
    participant_count integer not null default 0,
    mode text not null default 'time',
    time integer not null default 60,
    is_punctuation boolean not null default false,
    is_number boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index idx_arena_rooms_code on public.arena_rooms(code);
create index idx_arena_rooms_active on public.arena_rooms(is_active);

-- ============================================================
-- 6. arena_results
-- ============================================================
create table public.arena_results (
    id uuid primary key default gen_random_uuid(),
    arena_room_id uuid not null references public.arena_rooms(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    
    -- Live sync tracking
    status text not null default 'waiting',  -- 'waiting', 'playing', 'finished'
    
    -- Results
    wpm integer not null default 0,
    accuracy integer not null default 0,
    rank integer not null default 0,
    
    joined_at timestamptz not null default now(),

    unique (arena_room_id, user_id)
);

create index idx_arena_results_room_id on public.arena_results(arena_room_id);
create index idx_arena_results_user_id on public.arena_results(user_id);

-- Auto-update participant_count AND is_active on arena_rooms
create or replace function public.update_arena_room_status()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
    v_room_id uuid;
    v_count integer;
begin
    v_room_id := coalesce(new.arena_room_id, old.arena_room_id);
    
    select count(*) into v_count 
    from public.arena_results 
    where arena_room_id = v_room_id;

    update public.arena_rooms
    set 
        participant_count = v_count,
        is_active = (v_count > 0)
    where id = v_room_id;
    return null;
end;
$$;

create trigger trg_update_arena_room_status
    after insert or delete on public.arena_results
    for each row execute function public.update_arena_room_status();

-- ============================================================
-- 7. Row Level Security (RLS)
-- ============================================================

-- profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = user_id);

-- typing_tests
alter table public.typing_tests enable row level security;
create policy "Users can view their own typing tests" on public.typing_tests for select using (auth.uid() = user_id);
create policy "Users can insert their own typing tests" on public.typing_tests for insert with check (auth.uid() = user_id);

-- user_stats
alter table public.user_stats enable row level security;
create policy "User stats are viewable by everyone" on public.user_stats for select using (true);

-- arena_rooms
alter table public.arena_rooms enable row level security;
create policy "Rooms are viewable by everyone" on public.arena_rooms for select using (true);
create policy "Authenticated users can create rooms" on public.arena_rooms for insert with check (auth.uid() = host_user_id);
create policy "Host can update their room" on public.arena_rooms for update using (auth.uid() = host_user_id);

-- arena_results
alter table public.arena_results enable row level security;
create policy "Arena results are viewable by everyone" on public.arena_results for select using (true);
create policy "Authenticated users can join rooms" on public.arena_results for insert with check (auth.uid() = user_id);
create policy "Users can update their own result row" on public.arena_results for update using (auth.uid() = user_id);
create policy "Users can leave rooms" on public.arena_results for delete using (auth.uid() = user_id);

-- ============================================================
-- 8. Realtime
-- ============================================================
alter publication supabase_realtime add table public.arena_rooms;
alter publication supabase_realtime add table public.arena_results;
