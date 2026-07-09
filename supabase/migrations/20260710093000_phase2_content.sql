-- Silent Forge: Phase 2 RPCs -- Workshop valves, Archive books, Vault
-- placement, Prison escape, and the Warden-alert / DM-decision mechanic.
--
-- Design decision (2026-07-10, supersedes the original plan's auto-capture):
-- noise hitting 100 does NOT move anyone. add_noise records who tripped the
-- alarm in flags.wardenAlert; the DM console surfaces it and the DM decides
-- what happens at the table (dm_force_scene / dm_clear_noise below). Those
-- two are the first slice of the Phase 4 DM override RPCs, built early.
--
-- Puzzle answers live ONLY in submit_puzzle_attempt, as in Phase 1.

-- Record the offender on the shared state when the alarm trips. auth.uid()
-- inside a SECURITY DEFINER call chain is still the original caller, so
-- "who caused it" falls out naturally even when add_noise is invoked from
-- inside submit_puzzle_attempt.
create or replace function add_noise(p_session_id uuid, p_amount int) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_noise int;
  v_offender text;
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  update session_state
    set noise = least(100, noise + p_amount), updated_at = now()
    where session_id = p_session_id
    returning noise into v_noise;

  if v_noise >= 100 then
    select display_name into v_offender from players
      where session_id = p_session_id and user_id = auth.uid();
    update session_state
      set flags = jsonb_set(flags, array['wardenAlert'], to_jsonb(coalesce(v_offender, 'someone'))),
          updated_at = now()
      where session_id = p_session_id;
  end if;
end;
$$;

-- Answers (from the PoC, server-side only):
--   workshop-valves -> [2,0,1,3]   grants valve + valveFound   fail: +30 noise
--   archive-books   -> violet,ash,ember  grants lens + lensFound  fail: no noise
--   gallery-elimination (Phase 1) -> 'butler'  grants heart + heartFound  fail: +30
create or replace function submit_puzzle_attempt(p_session_id uuid, p_puzzle_id text, p_value jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_player_id uuid;
  v_correct boolean := false;
  v_grant_item text;
  v_grant_flag text;
  v_fail_noise int := 0;
begin
  select id into v_player_id from players
    where session_id = p_session_id and user_id = auth.uid();
  if v_player_id is null then
    raise exception 'not a member of this session';
  end if;

  if p_puzzle_id = 'gallery-elimination' then
    v_correct := (p_value ->> 'choice') = 'butler';
    v_grant_item := 'heart';
    v_grant_flag := 'heartFound';
    v_fail_noise := 30;
  elsif p_puzzle_id = 'workshop-valves' then
    v_correct := (p_value -> 'dials') = '[2,0,1,3]'::jsonb;
    v_grant_item := 'valve';
    v_grant_flag := 'valveFound';
    v_fail_noise := 30;
  elsif p_puzzle_id = 'archive-books' then
    v_correct := (p_value -> 'sequence') = '["violet","ash","ember"]'::jsonb;
    v_grant_item := 'lens';
    v_grant_flag := 'lensFound';
    v_fail_noise := 0;
  else
    raise exception 'unknown puzzle_id: %', p_puzzle_id;
  end if;

  insert into puzzle_attempts (session_id, player_id, puzzle_id, correct)
    values (p_session_id, v_player_id, p_puzzle_id, v_correct);

  if v_correct then
    update session_state set
      inventory = case
        when inventory ? v_grant_item then inventory
        else inventory || to_jsonb(v_grant_item)
      end,
      flags = jsonb_set(flags, array[v_grant_flag], 'true'::jsonb),
      updated_at = now()
    where session_id = p_session_id;
  elsif v_fail_noise > 0 then
    perform add_noise(p_session_id, v_fail_noise);
  end if;

  return jsonb_build_object('correct', v_correct);
end;
$$;

-- Vault sockets. The item must already be in the party inventory; placement
-- is a shared-state mutation so it goes through an RPC like everything else.
create function place_item(p_session_id uuid, p_item_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_flag text;
  v_all_placed boolean;
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  if p_item_id not in ('heart', 'lens', 'valve') then
    raise exception 'unknown item: %', p_item_id;
  end if;

  if not exists (
    select 1 from session_state
      where session_id = p_session_id and inventory ? p_item_id
  ) then
    return jsonb_build_object('ok', false);
  end if;

  v_flag := 'placed' || initcap(p_item_id);

  update session_state
    set flags = jsonb_set(flags, array[v_flag], 'true'::jsonb), updated_at = now()
    where session_id = p_session_id;

  select coalesce((flags ->> 'placedHeart')::boolean, false)
     and coalesce((flags ->> 'placedLens')::boolean, false)
     and coalesce((flags ->> 'placedValve')::boolean, false)
    into v_all_placed
    from session_state where session_id = p_session_id;

  if v_all_placed then
    update session_state
      set flags = jsonb_set(flags, array['allPlaced'], 'true'::jsonb), updated_at = now()
      where session_id = p_session_id;
  end if;

  return jsonb_build_object('ok', true, 'all_placed', v_all_placed);
end;
$$;

-- Prison grate escape. Gated on the caller actually being in the prison
-- scene so this can't be used as a generic clear-noise escape hatch.
-- Escaping resets the party's noise and clears the alert (PoC parity:
-- the heat dies down once the Warden loses the trail).
create function escape_prison(p_session_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update players
    set current_scene_id = 'workshop'
    where session_id = p_session_id and user_id = auth.uid()
      and current_scene_id = 'prison';

  if not found then
    raise exception 'not imprisoned in this session';
  end if;

  update session_state
    set noise = 0, flags = flags - 'wardenAlert', updated_at = now()
    where session_id = p_session_id;
end;
$$;

-- DM overrides. Role check is server-side against the caller's players row
-- (route-hiding on /dm is cosmetic, this is the real gate). dm_force_scene
-- is deliberately generic (any player, any scene) -- Phase 4 reuses it.
create function dm_force_scene(p_session_id uuid, p_player_id uuid, p_scene_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  update players
    set current_scene_id = p_scene_id
    where session_id = p_session_id and id = p_player_id;

  if not found then
    raise exception 'no such player in this session';
  end if;
end;
$$;

create function dm_clear_noise(p_session_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  update session_state
    set noise = 0, flags = flags - 'wardenAlert', updated_at = now()
    where session_id = p_session_id;
end;
$$;

grant execute on function place_item(uuid, text) to authenticated;
grant execute on function escape_prison(uuid) to authenticated;
grant execute on function dm_force_scene(uuid, uuid, text) to authenticated;
grant execute on function dm_clear_noise(uuid) to authenticated;

-- add_noise gained no new signature but re-assert its lockdown after
-- create or replace (grants survive replace, but be explicit).
revoke execute on function add_noise(uuid, int) from public, anon, authenticated;
