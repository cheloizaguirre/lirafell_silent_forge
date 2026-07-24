-- Silent Forge: the solve cheer -- a positive counterpart to the noise BANG.
--
-- When a puzzle is solved correctly, stamp a party-shared `solveEvent` flag so
-- every connected client can play a celebratory burst (the gold "AHA!"), the
-- same way `noiseEvent` drives the red BANG on a wrong answer. Structure and
-- idempotency mirror noiseEvent exactly:
--   * seq is monotonically increasing, so a reconcile re-fetch replaying old
--     state can be told apart from a genuinely new solve (the client swallows
--     the first-ever observation as history, not news).
--   * `by` is the solver's players.id, so each client knows whether the solve
--     was its own (big centered cheer) or someone else's (small corner cheer).
--   * `puzzle` carries the puzzle id for future per-puzzle flavor; unused today.
--
-- Only the FIRST solve cheers. Nothing stops a player reopening a solved puzzle
-- and re-entering the right answer, and a victory burst for a puzzle the party
-- cracked ten minutes ago reads as a bug -- so the stamp is gated on the grant
-- flag not already being true. Knock-on worth knowing: dm_grant_item sets those
-- same *Found flags, so if the DM unsticks the party with a grant, whoever
-- later solves that puzzle for real gets the item logic but no cheer. Accepted.
--
-- submit_puzzle_attempt is otherwise re-emitted verbatim from
-- 20260713120000_cabinet_gears; the solveEvent stamp is the only addition, and
-- it sits inside the existing v_correct branch. Answers still live only in this
-- function (and the DM cheat sheet), untouched here.

create or replace function submit_puzzle_attempt(p_session_id uuid, p_puzzle_id text, p_value jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_player_id uuid;
  v_correct boolean := false;
  v_grant_item text;
  v_grant_flag text;
  v_fail_noise int := 0;
  v_bangs int := 1;
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
    if not v_correct then
      -- One BANG per wrong dial. jsonb-level comparison so malformed input
      -- (wrong types, short arrays) counts as wrong rather than erroring.
      select count(*) into v_bangs
        from (values (0, '2'::jsonb), (1, '0'::jsonb), (2, '1'::jsonb), (3, '3'::jsonb)) as a(i, d)
        where (p_value -> 'dials' -> a.i) is distinct from a.d;
    end if;
  elsif p_puzzle_id = 'archive-books' then
    v_correct := (p_value -> 'sequence') = '["violet","ash","ember"]'::jsonb;
    v_grant_item := 'lens';
    v_grant_flag := 'lensFound';
    v_fail_noise := 30;
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
  elsif p_puzzle_id = 'cabinet-gears' then
    -- Gate: the mechanism is incomplete without the crown gear (DM grant).
    -- Mirrors the 'lens is dormant' check; the reason string never mentions
    -- where the gear comes from. The disabled fifth tile is UX; this is the
    -- security boundary.
    if not exists (
      select 1 from session_state
        where session_id = p_session_id
          and coalesce((flags ->> 'keystoneFound')::boolean, false)
    ) then
      raise exception 'the mechanism is incomplete';
    end if;
    v_correct := (p_value -> 'sequence')
      = '["workshop","spire","gallery","archive","keystone"]'::jsonb;
    v_grant_item := null;          -- reward is DM-narrated, no item
    v_grant_flag := 'cabinetOpened';
    v_fail_noise := 30;            -- wrong arrangement is loud, like the others
  else
    raise exception 'unknown puzzle_id: %', p_puzzle_id;
  end if;

  insert into puzzle_attempts (session_id, player_id, puzzle_id, correct)
    values (p_session_id, v_player_id, p_puzzle_id, v_correct);

  if v_correct then
    -- Grant the reward, and on a FIRST solve also stamp solveEvent so every
    -- client cheers. The "already solved?" test reads the row's own flags
    -- inside the UPDATE rather than in a separate SELECT: that way it runs
    -- under the row lock, so two players submitting the right answer at the
    -- same instant can't both see "not solved yet" and both cheer.
    -- Re-solve path: set the grant flag (a no-op, it's already true) and leave
    -- solveEvent exactly as it was, so no client's seq watermark advances.
    update session_state set
      inventory = case
        when v_grant_item is null or inventory ? v_grant_item then inventory
        else inventory || to_jsonb(v_grant_item)
      end,
      flags = case
        when coalesce((flags ->> v_grant_flag)::boolean, false)
          then jsonb_set(flags, array[v_grant_flag], 'true'::jsonb)
        else jsonb_set(
          jsonb_set(flags, array[v_grant_flag], 'true'::jsonb),
          array['solveEvent'],
          jsonb_build_object(
            'seq', coalesce((flags #>> '{solveEvent,seq}')::int, 0) + 1,
            'by', v_player_id,
            'puzzle', p_puzzle_id
          )
        )
      end,
      updated_at = now()
    where session_id = p_session_id;
  elsif v_fail_noise > 0 then
    perform add_noise(p_session_id, v_fail_noise, v_bangs);
  end if;

  return jsonb_build_object('correct', v_correct);
end;
$$;
