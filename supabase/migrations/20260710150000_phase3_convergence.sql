-- Silent Forge: Phase 3 RPCs -- Stage 2 convergence (Spire arm, Workshop
-- overflow vent, Archive lens realignment, and the final activate_convergence).
--
-- armed / vented / aligned / won are ordinary flags in session_state.flags,
-- same as Phase 2's placed*/allPlaced. As always: RLS denies direct client
-- writes to session_state; every mutation below is a SECURITY DEFINER RPC
-- that re-checks its own preconditions server-side. The Vault UI evaluates
-- armed && vented && aligned client-side for instant "what's missing"
-- feedback, but activate_convergence re-checks the same gate here --
-- defense-in-depth against a client just posting won:true.

-- Throwing the great lever. Gated on allPlaced (the PoC's lever "will not
-- budge" until the vault is fed). Arming is LOUD: +35 noise through
-- add_noise, which also gives the Warden-alert flow for free if it tips 100.
create function arm_spire(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_flags jsonb;
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  -- Lock the row so two players heaving the lever at once can't both "win"
  -- the arming (and stack +35 noise twice).
  select flags into v_flags from session_state
    where session_id = p_session_id for update;

  if not coalesce((v_flags ->> 'allPlaced')::boolean, false) then
    raise exception 'the mechanism is not fed';
  end if;

  if coalesce((v_flags ->> 'armed')::boolean, false) then
    return jsonb_build_object('ok', true, 'already_armed', true);
  end if;

  update session_state
    set flags = jsonb_set(flags, array['armed'], 'true'::jsonb), updated_at = now()
    where session_id = p_session_id;

  perform add_noise(p_session_id, 35);

  return jsonb_build_object('ok', true);
end;
$$;

-- The Workshop overflow valve. Only exists once the Spire is armed (pressure
-- has somewhere to go); venting is quiet, contained, safe -- no noise.
create function vent_overflow(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_flags jsonb;
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  select flags into v_flags from session_state
    where session_id = p_session_id for update;

  if not coalesce((v_flags ->> 'armed')::boolean, false) then
    raise exception 'there is no pressure to vent';
  end if;

  if coalesce((v_flags ->> 'vented')::boolean, false) then
    return jsonb_build_object('ok', true, 'already_vented', true);
  end if;

  update session_state
    set flags = jsonb_set(flags, array['vented'], 'true'::jsonb), updated_at = now()
    where session_id = p_session_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- Archive lens realignment joins the answer table. The lens dial cycles the
-- five sigils; the match is the one the armed Spire dial shows (index 2, ☉)
-- -- displayed as a clue in SpireArt, but *validated* only here. The puzzle
-- is dormant until the Spire is armed. Aligning grants a flag, no item, so
-- the item grant below goes conditional.
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
  elsif p_puzzle_id = 'archive-lens' then
    if not exists (
      select 1 from session_state
        where session_id = p_session_id
          and coalesce((flags ->> 'armed')::boolean, false)
    ) then
      raise exception 'the lens is dormant';
    end if;
    v_correct := (p_value -> 'dials') = '[2]'::jsonb;
    v_grant_item := null;
    v_grant_flag := 'aligned';
    v_fail_noise := 0;
  else
    raise exception 'unknown puzzle_id: %', p_puzzle_id;
  end if;

  insert into puzzle_attempts (session_id, player_id, puzzle_id, correct)
    values (p_session_id, v_player_id, p_puzzle_id, v_correct);

  if v_correct then
    update session_state set
      inventory = case
        when v_grant_item is null or inventory ? v_grant_item then inventory
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

-- The finale. Re-validates the full gate server-side and reports what's
-- missing so the client can narrate the resistance without ever holding
-- the authority to decide it.
create function activate_convergence(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_flags jsonb;
  v_missing jsonb := '[]'::jsonb;
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  select flags into v_flags from session_state
    where session_id = p_session_id for update;

  if not coalesce((v_flags ->> 'allPlaced')::boolean, false) then
    raise exception 'the mechanism is not fed';
  end if;

  if coalesce((v_flags ->> 'won')::boolean, false) then
    return jsonb_build_object('ok', true, 'already_won', true);
  end if;

  if not coalesce((v_flags ->> 'armed')::boolean, false) then
    v_missing := v_missing || '"armed"'::jsonb;
  end if;
  if not coalesce((v_flags ->> 'vented')::boolean, false) then
    v_missing := v_missing || '"vented"'::jsonb;
  end if;
  if not coalesce((v_flags ->> 'aligned')::boolean, false) then
    v_missing := v_missing || '"aligned"'::jsonb;
  end if;

  if jsonb_array_length(v_missing) > 0 then
    return jsonb_build_object('ok', false, 'missing', v_missing);
  end if;

  update session_state
    set flags = jsonb_set(flags, array['won'], 'true'::jsonb), updated_at = now()
    where session_id = p_session_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function arm_spire(uuid) to authenticated;
grant execute on function vent_overflow(uuid) to authenticated;
grant execute on function activate_convergence(uuid) to authenticated;
