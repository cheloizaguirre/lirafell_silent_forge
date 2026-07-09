-- Silent Forge: Phase 1 RPCs (session lifecycle + the one real puzzle).
--
-- Every function here is SECURITY DEFINER: clients never write to
-- sessions/players/session_state directly (RLS above allows SELECT only).
-- Puzzle answers live ONLY inside submit_puzzle_attempt below -- never in
-- packages/content or any client-fetched table.
--
-- Phase 2/3/4 will add place_item, activate_convergence, and the dm_*
-- override RPCs in a later migration -- not included here since those
-- puzzles/scenes aren't built yet.

create function generate_session_code() returns text
language plpgsql volatile as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I
  result text;
  attempt int := 0;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from sessions where code = result);
    attempt := attempt + 1;
    if attempt > 20 then
      raise exception 'could not generate a unique session code';
    end if;
  end loop;
  return result;
end;
$$;

create function create_session(p_display_name text) returns table (session_id uuid, code text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_session_id uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  v_code := generate_session_code();

  insert into sessions (code) values (v_code) returning id into v_session_id;
  insert into players (session_id, user_id, display_name, role)
    values (v_session_id, auth.uid(), p_display_name, 'dm');
  insert into session_state (session_id) values (v_session_id);

  return query select v_session_id, v_code;
end;
$$;

create function join_session(p_code text, p_display_name text) returns table (session_id uuid)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_session_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be authenticated';
  end if;

  select id into v_session_id from sessions where code = p_code and status = 'active';
  if v_session_id is null then
    raise exception 'no active session with that code';
  end if;

  insert into players (session_id, user_id, display_name, role)
    values (v_session_id, auth.uid(), p_display_name, 'player')
    on conflict (session_id, user_id) do update set display_name = excluded.display_name;

  return query select v_session_id;
end;
$$;

create function add_noise(p_session_id uuid, p_amount int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_session_member(p_session_id) then
    raise exception 'not a member of this session';
  end if;

  update session_state
    set noise = least(100, noise + p_amount), updated_at = now()
    where session_id = p_session_id;
end;
$$;

create function set_current_scene(p_session_id uuid, p_scene_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update players
    set current_scene_id = p_scene_id
    where session_id = p_session_id and user_id = auth.uid();

  if not found then
    raise exception 'not a member of this session';
  end if;
end;
$$;

-- Gallery elimination puzzle: correct answer is 'butler' (the automaton
-- that "never sang"). The other four are loud decoys. Ported from the PoC's
-- `autos` array at ~/Downloads/silent_forge(1).html:490-495.
create function submit_puzzle_attempt(p_session_id uuid, p_puzzle_id text, p_value jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_player_id uuid;
  v_correct boolean := false;
  v_grant_item text;
  v_grant_flag text;
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
  else
    perform add_noise(p_session_id, 30);
  end if;

  return jsonb_build_object('correct', v_correct);
end;
$$;

-- Lock down execution. generate_session_code and add_noise are truly
-- internal -- invoked solely from within other SECURITY DEFINER function
-- bodies, which doesn't require a role grant. is_session_member is
-- different: RLS policies invoke it in the querying role's own context (not
-- as an internal call), so it needs an explicit grant like any other
-- client-reachable function, even though nothing calls it directly by name.
revoke execute on function generate_session_code() from public, anon, authenticated;
revoke execute on function add_noise(uuid, int) from public, anon, authenticated;

grant execute on function is_session_member(uuid) to authenticated;
grant execute on function create_session(text) to anon, authenticated;
grant execute on function join_session(text, text) to anon, authenticated;
grant execute on function set_current_scene(uuid, text) to authenticated;
grant execute on function submit_puzzle_attempt(uuid, text, jsonb) to authenticated;
