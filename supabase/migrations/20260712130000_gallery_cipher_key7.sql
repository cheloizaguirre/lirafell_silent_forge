-- Gallery cipher retuned (2026-07-12). The ANSWER is still BUTLER, but the
-- clue economy changed and the DM cheat sheet has to follow:
--   * The note behind the piston hound's case now reads simply
--     "Look into my eyes, look into my eyes, look into my eyes... IBASLY".
--   * The key is the number of *blinking* eyes scattered across the automatons
--     (7, not 4): spider 3 of 4, owl 1 of 2, hound 1, cannon 1, and the butler
--     now flickers 1 too. Steady/dead eyes don't count.
--   * IBASLY shifted back 7 spells BUTLER. The suspect is now just "Butler"
--     (it is no longer the "silent" one that never reacts).
--
-- Only the Gallery entry changes; the other solutions are re-emitted verbatim
-- so this migration fully replaces dm_get_solutions. verify-realtime asserts
-- the '2 - 0 - 1 - 3', 'Butler', 'Violet -> Ash -> Ember' and '☉' literals.
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
    )
  );
end;
$$;
