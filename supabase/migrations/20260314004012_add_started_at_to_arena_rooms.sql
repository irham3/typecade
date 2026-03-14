-- Add a true started_at timestamp to avoid race instant-finishes caused by drifting updated_at
alter table public.arena_rooms add column if not exists started_at timestamptz;