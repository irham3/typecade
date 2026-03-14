-- Add policy to allow system/triggers to update arena_rooms
create policy "System can update rooms" 
on public.arena_rooms 
for update 
using (true);
