-- Silent Forge: core schema.
--
-- Scene is per-player (players.current_scene_id) because multiple
-- players are on different devices in different rooms simultaneously.
-- flags/inventory/noise are party-shared (one row per session in
-- session_state) since the whole table experiences those together.
-- No client ever writes to session_state directly (see RLS below) --
-- all mutations go through the SECURITY DEFINER RPCs in the next migration.

create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  role text not null default 'player' check (role in ('dm', 'player')),
  current_scene_id text not null default 'entrance',
  joined_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create table session_state (
  session_id uuid primary key references sessions (id) on delete cascade,
  flags jsonb not null default '{}'::jsonb,
  inventory jsonb not null default '[]'::jsonb,
  noise int not null default 0 check (noise between 0 and 100),
  puzzle_working jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table puzzle_attempts (
  id bigint generated always as identity primary key,
  session_id uuid not null references sessions (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  puzzle_id text not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);

create index players_session_id_idx on players (session_id);
create index puzzle_attempts_session_id_idx on puzzle_attempts (session_id);

alter table sessions enable row level security;
alter table players enable row level security;
alter table session_state enable row level security;
alter table puzzle_attempts enable row level security;

-- RLS policies alone are not sufficient -- Postgres checks a base table-level
-- GRANT before RLS row-filtering ever runs. Without this, every SELECT is
-- rejected outright with "permission denied for table", regardless of policy.
-- No INSERT/UPDATE/DELETE grants anywhere below -- every mutation must go
-- through a SECURITY DEFINER RPC (next migration), which bypasses RLS and
-- these grants entirely (it runs as the function owner) and re-validates
-- membership/role itself.
grant select on sessions, players, session_state, puzzle_attempts to authenticated;

-- Members of a session can read its rows.

create function is_session_member(p_session_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from players
    where session_id = p_session_id and user_id = auth.uid()
  );
$$;

create policy "members can read their session" on sessions
  for select using (is_session_member(id));

create policy "members can read players in their session" on players
  for select using (is_session_member(session_id));

create policy "members can read their session state" on session_state
  for select using (is_session_member(session_id));

create policy "members can read their puzzle attempts" on puzzle_attempts
  for select using (is_session_member(session_id));
