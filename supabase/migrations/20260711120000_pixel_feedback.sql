-- Silent Forge: pixel feedback pass -- hidden-clue party flags, BANG counts,
-- prison-loop groundwork, tome noise, and the DM warden toggle.
--
-- Gameplay decisions behind this migration (user-approved 2026-07-11):
--   * The valve code (2-0-1-3) leaves the Workshop plaque entirely; its only
--     copy is a note behind a loose brick in the prison cell. Capture is the
--     intended route to it.
--   * Clue reveals are party-wide: one player finding a note reveals it for
--     everyone, so players may set a small allowlisted set of flags.
--   * Wrong valve attempts BANG once per wrong dial (Mastermind-style feedback,
--     intended) but noise stays flat +30 per fail.
--   * Wrong tome order is now LOUD (+30): the shelf slams itself back.

-- 1. set_party_flag: the first player-writable flag path. Deliberately an
-- allowlist, not a generic setter -- everything else in flags stays
-- RPC-owned (see useSessionStore's localFlags rationale client-side).
create function set_party_flag(p_session_id uuid, p_flag text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  if p_flag not in ('galleryClueFound', 'archiveClueFound', 'brickOpened') then
    raise exception 'flag not settable by players: %', p_flag;
  end if;

  update session_state
    set flags = jsonb_set(flags, array[p_flag], 'true'::jsonb), updated_at = now()
    where session_id = p_session_id;
end;
$$;

grant execute on function set_party_flag(uuid, text) to authenticated;

-- 2. dm_set_warden_hidden: DM toggle for the Workshop's Dormant Warden
-- (sprite + hotspot). Groundwork for a future noise jump-scare.
create function dm_set_warden_hidden(p_session_id uuid, p_hidden boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  update session_state
    set flags = jsonb_set(flags, array['wardenHidden'], to_jsonb(p_hidden)),
        updated_at = now()
    where session_id = p_session_id;
end;
$$;

grant execute on function dm_set_warden_hidden(uuid, boolean) to authenticated;

-- 3. add_noise gains p_bangs (how many BANGs the clients should render,
-- 1-4). A new parameter means a new signature: DROP the old one, don't
-- create-or-replace. Internal 2-arg callers (arm_spire, dm_adjust_noise,
-- older submit_puzzle_attempt) resolve through the default.
drop function add_noise(uuid, int);

create function add_noise(p_session_id uuid, p_amount int, p_bangs int default 1) returns void
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
            'amount', p_amount,
            'bangs', greatest(1, least(4, coalesce(p_bangs, 1)))
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

-- Internal-only, as before: reachable through the gameplay RPCs, never
-- directly from a client.
revoke execute on function add_noise(uuid, int, int) from public, anon, authenticated;

-- 4. escape_prison also records that the party has been through the cell:
-- escapedPrison unlocks the Workshop floor hatch (the voluntary route back
-- to the corridor side of the bars, for anyone who missed the brick note).
create or replace function escape_prison(p_session_id uuid) returns void
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
    set noise = 0,
        flags = jsonb_set(flags - 'wardenAlert', array['escapedPrison'], 'true'::jsonb),
        updated_at = now()
    where session_id = p_session_id;
end;
$$;

-- 5. submit_puzzle_attempt: archive-books fails go LOUD (+30), and
-- workshop-valves fails report one BANG per wrong dial. The wrong-dial
-- count is derived from the same answer literal that decides correctness --
-- answers still live only in this function (and the cheat sheet below).
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
    perform add_noise(p_session_id, v_fail_noise, v_bangs);
  end if;

  return jsonb_build_object('correct', v_correct);
end;
$$;

-- 6. Cheat sheet catches up with the new clue economy. The valve solution
-- string keeps its '2 - 0 - 1 - 3' literal (verify-realtime asserts it).
create or replace function dm_get_solutions(p_session_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  return jsonb_build_array(
    jsonb_build_object(
      'title', 'Gallery of Automatons',
      'solution', 'Silent Butler ("the one who never sang")',
      'note', 'The riddle note hides behind the piston hound''s case. Each wrong automaton shrieks: +30 noise.'
    ),
    jsonb_build_object(
      'title', 'Pressure Valves (Workshop)',
      'solution', '2 - 0 - 1 - 3 (the note behind the prison cell''s loose brick)',
      'note', 'Capture is the intended route to the code. Each failed test: +30 noise, one BANG per wrong dial, dials slam back to 0.'
    ),
    jsonb_build_object(
      'title', 'The Colored Tomes (Archive)',
      'solution', 'Violet -> Ash -> Ember ("Violet before Ash, Ash before Ember" -- the Black Tome is a decoy)',
      'note', 'The order note hides on the bookshelf''s upper shelf. Wrong order is LOUD now: +30 noise, the shelf slams itself reset.'
    ),
    jsonb_build_object(
      'title', 'Realign the Lens (Archive, Stage 2)',
      'solution', 'The sun sigil ☉ (third position; shown on the Spire dial once armed)',
      'note', 'Dormant until the Spire is armed. Wrong sigils are quiet.'
    ),
    jsonb_build_object(
      'title', 'Stage 2 order',
      'solution', 'Place all three components -> take the Vault stairwell and arm the Spire (+35 noise!) -> vent the Workshop overflow -> realign the lens -> activate the convergence in the Vault.',
      'note', 'The prison grate takes three heaves and resets party noise. After one escape, the Workshop floor hatch reopens the corridor side of the cell.'
    )
  );
end;
$$;
