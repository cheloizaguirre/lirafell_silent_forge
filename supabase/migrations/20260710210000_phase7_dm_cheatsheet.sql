-- Silent Forge: Phase 7 -- the DM cheat-sheet.
--
-- The repo invariant stands: puzzle answers exist ONLY inside Supabase
-- RPCs, never in packages/content or the client bundle. The DM console
-- still needs them at the table, so this role-gated RPC hands the whole
-- sheet to the DM (and only the DM) at runtime. If an answer changes in
-- submit_puzzle_attempt, change it here in the same migration -- these two
-- are the only places answers live.
create function dm_get_solutions(p_session_id uuid) returns jsonb
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
      'note', 'Each wrong automaton shrieks: +30 noise.'
    ),
    jsonb_build_object(
      'title', 'Pressure Valves (Workshop)',
      'solution', '2 - 0 - 1 - 3 (the faded engraving above the pipes)',
      'note', 'Each failed pressure test: +30 noise, dials slam back to 0.'
    ),
    jsonb_build_object(
      'title', 'The Colored Tomes (Archive)',
      'solution', 'Violet -> Ash -> Ember ("Violet before Ash, Ash before Ember" -- the Black Tome is a decoy)',
      'note', 'Wrong order is quiet; the shelf just resets.'
    ),
    jsonb_build_object(
      'title', 'Realign the Lens (Archive, Stage 2)',
      'solution', 'The sun sigil ☉ (third position; shown on the Spire dial once armed)',
      'note', 'Dormant until the Spire is armed. Wrong sigils are quiet.'
    ),
    jsonb_build_object(
      'title', 'Stage 2 order',
      'solution', 'Place all three components -> arm the Spire (+35 noise!) -> vent the Workshop overflow -> realign the lens -> activate the convergence in the Vault.',
      'note', 'The prison grate takes three heaves and resets party noise.'
    )
  );
end;
$$;

grant execute on function dm_get_solutions(uuid) to authenticated;
