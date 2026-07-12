-- Warden jump-scare: a DM override that summons a looming, waist-up Warden
-- bust over whatever room a player is standing in. Purely cosmetic -- it sets
-- ONE flag (wardenRoom = the scene id the Warden is looming in, or "" when
-- dismissed) and touches nothing else: no noise, no onEnter text, no hotspots.
-- Distinct from wardenHidden (which hides the Workshop's dormant statue).
--
-- Additive migration (one new function), so `supabase migration up` applies it
-- without a `db reset` -- no running session gets wiped.

create function dm_set_warden_room(p_session_id uuid, p_scene_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  update session_state
    set flags = jsonb_set(flags, array['wardenRoom'], to_jsonb(coalesce(p_scene_id, ''))),
        updated_at = now()
    where session_id = p_session_id;
end;
$$;

grant execute on function dm_set_warden_room(uuid, text) to authenticated;
