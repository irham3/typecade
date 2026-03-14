-- Drop the trigger that incorrectly updates arena_rooms when arena_results is modified
drop trigger if exists trg_update_arena_room_status on public.arena_results;
drop function if exists public.update_arena_room_status();