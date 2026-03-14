-- ============================================================
-- RPC: player_leave_room
-- Called when a player leaves a room. Atomically decrements
-- participant_count and sets is_active = false if it hits 0.
-- Uses SECURITY DEFINER so it bypasses RLS for the update.
-- ============================================================
create or replace function public.player_leave_room(p_room_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
    v_new_count integer;
begin
    update public.arena_rooms
    set
        participant_count = greatest(0, participant_count - 1),
        is_active = (greatest(0, participant_count - 1) > 0),
        is_racing = case
            when greatest(0, participant_count - 1) = 0 then false
            else is_racing
        end
    where id = p_room_id
    returning participant_count into v_new_count;
end;
$$;

-- Allow any authenticated user to call this function
grant execute on function public.player_leave_room(uuid) to authenticated;
