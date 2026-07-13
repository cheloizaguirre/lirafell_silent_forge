-- Silent Forge: the Master Gearlock capstone (locked-cabinet puzzle).
--
-- An optional five-gear observation puzzle in the Archive. Four symbol-gears
-- are already in the lock; each symbol is hidden in the room it belongs to,
-- ringed by a count of dots = its slot. The fifth (blank keystone) gear is
-- DM-granted out of band -- nothing a player can read says where it comes
-- from. Solving opens the cabinet (sets cabinetOpened) and grants NO item and
-- prints NO contents: the reward is narrated by the DM at the table.
--
-- Three edits, all following existing patterns:
--   1. submit_puzzle_attempt gains a 'cabinet-gears' branch (gate + answer),
--      structured like the archive-lens dormancy gate.
--   2. dm_grant_item's allowlist gains 'keystone' -- grants the Keystone Gear
--      and (via the p_item_id || 'Found' write) sets keystoneFound, the flag
--      the puzzle gate and the disabled fifth tile both read.
--   3. dm_get_solutions gains the cabinet row (DM cheat sheet).
-- The answer string lives ONLY in the two RPCs below.

-- 1. submit_puzzle_attempt: re-emitted verbatim from 20260711120000 with the
-- new cabinet-gears branch appended before the unknown-puzzle fallback.
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

-- 2. dm_grant_item: allowlist now includes the keystone. Granting it adds
-- 'keystone' to inventory and sets keystoneFound (p_item_id || 'Found'),
-- which un-disables the puzzle's fifth tile and satisfies the server gate.
create or replace function dm_grant_item(p_session_id uuid, p_item_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  if p_item_id not in ('heart', 'lens', 'valve', 'keystone') then
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

-- 3. dm_get_solutions: re-emitted verbatim from 20260712130000 with the
-- cabinet capstone appended. The note is DM-facing; keep the solution string
-- in sync with the answer literal in submit_puzzle_attempt above -- these two
-- functions remain the only places the answer lives.
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
      'solution', 'Butler (decodes from the cipher IBASLY)',
      'note', 'The note behind the piston hound''s case is a Caesar cipher: IBASLY, key = number of *blinking* eyes across the automatons (7 -- spider 3 of 4, owl 1 of 2, hound 1, cannon 1, butler 1; steady eyes don''t count). Shift each letter back 7 -> BUTLER. Each wrong automaton shrieks: +30 noise.'
    ),
    jsonb_build_object(
      'title', 'Pressure Valves (Workshop)',
      'solution', '2 - 0 - 1 - 3 (the breathing-drill note behind the prison cell''s loose brick)',
      'note', 'The note is a breathing-drill ditty, one action per valve in order: raise both arms (2), empty mind to nothing (0), one slow breath (1), pat back three times (3). Capture is the intended route. Each failed test: +30 noise, one BANG per wrong dial, dials slam back to 0.'
    ),
    jsonb_build_object(
      'title', 'The Colored Tomes (Archive)',
      'solution', 'Violet -> Ash -> Ember (from the burn-cycle haiku -- the Black Tome is a decoy)',
      'note', 'The order clue is a haiku on the bookshelf''s upper shelf: "Twilight-crowned, it flares / then sinks to pale grey stillness / one coal, still breathing." (twilight flare = Violet, pale grey = Ash, one coal = Ember; the Black Tome is never named). Wrong order is LOUD: +30 noise, the shelf slams itself reset.'
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
    ),
    jsonb_build_object(
      'title', 'The Master Gearlock (Archive capstone)',
      'solution', 'Workshop(1) -> Spire(2) -> Gallery(3) -> Archive(4) -> Keystone',
      'note', 'Optional capstone. Order = dots ringing each room''s hidden symbol (Workshop cross 1, Spire sun 2, Gallery eye 3, Archive flame 4); the blank keystone is last. The fifth gear is missing until you Grant the Keystone Gear (DM Overrides) -- do that once the party has earned it. The game opens the cabinet and names nothing inside: the reward is yours to narrate.'
    )
  );
end;
$$;
