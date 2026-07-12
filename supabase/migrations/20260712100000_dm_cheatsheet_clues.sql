-- DM cheat sheet catches up with the harder clue economy (2026-07-12).
--
-- The puzzle ANSWERS are unchanged -- only the in-world clues got harder, so
-- the DM console now describes how each clue encodes its answer:
--   * Gallery: the note behind the piston hound's case is a Caesar cipher
--     (FYXPIV) whose key is the number of automatons with blinking eyes (4);
--     shifting back 4 spells BUTLER.
--   * Valves: the note behind the prison brick is a breathing-drill ditty --
--     both arms (2), mind to nothing (0), one slow breath (1), pat x3 (3).
--   * Tomes: the upper-shelf clue is a burn-cycle haiku (violet flare -> ash
--     -> ember, no color names spoken; the Black Tome is the unnamed decoy).
--
-- The solution strings keep their '2 - 0 - 1 - 3', 'Silent Butler',
-- 'Violet -> Ash -> Ember' and '☉' literals -- verify-realtime asserts them.
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
      'solution', 'Silent Butler (decodes from the cipher FYXPIV)',
      'note', 'The note behind the piston hound''s case is a Caesar cipher: FYXPIV, key = number of automatons whose eyes blink (4 -- the butler''s never do). Shift each letter back 4 -> BUTLER. Each wrong automaton shrieks: +30 noise.'
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
