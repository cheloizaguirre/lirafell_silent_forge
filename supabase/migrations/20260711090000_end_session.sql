-- Silent Forge: end_session -- lets the DM close out a run.
--
-- Nothing ever flipped sessions.status off 'active', so the landing page's
-- resume lookup (players joined to sessions where status = 'active') pulled
-- every returning DM straight back into their old run with no way to start
-- a clean one. Completed sessions fall out of that lookup and out of
-- join_session's code check; their rows stay behind for post-mortems.
create function end_session(p_session_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from players
      where session_id = p_session_id and user_id = auth.uid() and role = 'dm'
  ) then
    raise exception 'only the DM can do that';
  end if;

  update sessions set status = 'completed' where id = p_session_id;
end;
$$;

grant execute on function end_session(uuid) to authenticated;
