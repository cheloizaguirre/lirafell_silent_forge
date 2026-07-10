-- Silent Forge: Phase 4 -- the last DM override RPC. dm_force_scene and
-- dm_clear_noise were pulled forward into the Phase 2 migration for the
-- Warden-alert flow; dm_grant_item completes the plan's v1 DM console
-- trio (force scene / clear noise / grant item).
--
-- Granting an item also sets its *Found flag, mirroring exactly what the
-- puzzle solve would have written. Without the flag the override wouldn't
-- actually unstick anything: the Vault door gates on heartFound/lensFound/
-- valveFound, and the puzzle hotspots would still show unsolved. The
-- placed* flags stay untouched -- placement is gameplay, not a grant.
create function dm_grant_item(p_session_id uuid, p_item_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  if p_item_id not in ('heart', 'lens', 'valve') then
    raise exception 'unknown item: %', p_item_id;
  end if;

  update session_state set
    inventory = case
      when inventory ? p_item_id then inventory
      else inventory || to_jsonb(p_item_id)
    end,
    flags = jsonb_set(flags, array[p_item_id || 'Found'], 'true'::jsonb),
    updated_at = now()
  where session_id = p_session_id;
end;
$$;

grant execute on function dm_grant_item(uuid, text) to authenticated;
