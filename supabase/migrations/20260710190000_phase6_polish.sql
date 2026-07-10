-- Silent Forge: Phase 6 (polish) -- noise attribution + DM noise steppers.
--
-- Noise becomes DM-facing theater: the gauge moves off the player HUD, and
-- players instead get BANG graphics -- big when *you* made the noise, small
-- and anonymous when anyone else did. The client needs to know two things
-- about every noise-raising event: "did it happen just now" and "was it me".
-- add_noise stamps both into the party-shared flags as a monotonically
-- increasing noiseEvent -- the seq lets clients dedupe against reconcile
-- re-fetches (incl. the Phase 5 delayed sweep), `by` is the actor's players.id.
--
-- Quiet events (escape_prison reset, dm_clear_noise, negative DM deltas)
-- deliberately do NOT stamp: no BANG when the world gets quieter.

-- Re-create with the noiseEvent stamp. Body is otherwise identical to the
-- Phase 2 version (clamp at 100, wardenAlert on trip).
create or replace function add_noise(p_session_id uuid, p_amount int) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_noise int;
  v_offender text;
  v_actor uuid;
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  -- auth.uid() inside a SECURITY DEFINER call chain is still the original
  -- caller (same trick wardenAlert relies on), so the actor is correct even
  -- when add_noise runs inside submit_puzzle_attempt / arm_spire.
  select id into v_actor from players
    where session_id = p_session_id and user_id = auth.uid();

  update session_state
    set noise = least(100, noise + p_amount),
        flags = case when p_amount > 0 then
          jsonb_set(flags, array['noiseEvent'], jsonb_build_object(
            'seq', coalesce((flags #>> '{noiseEvent,seq}')::int, 0) + 1,
            'by', v_actor,
            'amount', p_amount
          ))
        else flags end,
        updated_at = now()
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

-- DM noise steppers (-10/+10 on the console). Delta-based so two quick taps
-- can't race a stale read; clamped either side. Positive deltas route through
-- add_noise so DM-added noise makes anonymous BANGs on player screens (free
-- table theater) and trips the warden alert at 100 like any other noise.
-- Stepping DOWN below 100 strips the alert -- the threat recedes.
create function dm_adjust_noise(p_session_id uuid, p_delta int) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_noise int;
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  if p_delta > 0 then
    perform add_noise(p_session_id, p_delta);
    return;
  end if;

  update session_state
    set noise = greatest(0, noise + p_delta), updated_at = now()
    where session_id = p_session_id
    returning noise into v_noise;

  if v_noise < 100 then
    update session_state
      set flags = flags - 'wardenAlert', updated_at = now()
      where session_id = p_session_id;
  end if;
end;
$$;

grant execute on function dm_adjust_noise(uuid, int) to authenticated;
