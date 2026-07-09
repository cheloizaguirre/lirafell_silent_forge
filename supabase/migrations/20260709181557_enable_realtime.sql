-- Enable Postgres Changes for the two party-shared/per-player tables the
-- client subscribes to (see apps/web/src/state/useSessionState.ts).
--
-- Tables are NOT part of any publication by default -- RLS/GRANTs only
-- govern direct reads/writes, not whether row-change events are emitted at
-- all. Without this, `supabase_realtime` has zero tables and every
-- postgres_changes subscription silently receives nothing, forever, no
-- error. Caught by an actual two-browser-context Playwright run where the
-- DM view never learned about a second player joining.
--
-- REPLICA IDENTITY FULL so UPDATE/DELETE payloads carry full old-row data,
-- not just the primary key -- the standard Supabase realtime setup.
alter table players replica identity full;
alter table session_state replica identity full;

alter publication supabase_realtime add table players;
alter publication supabase_realtime add table session_state;
