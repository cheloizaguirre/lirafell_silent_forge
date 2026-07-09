# Silent Forge — Progress & Next Manual Steps

Status as of 2026-07-09, evening. **Phase 1 (the vertical slice) is DONE and verified working end-to-end through a real browser with two simulated devices.** Picking this back up? Read this file, then hand it to Claude to resume — it has full context of the plan already (`plans/this-file-contains-the-purrfect-harbor.md`), but this doc is the fast way to re-sync.

## Current state: playable locally right now

```bash
supabase start                                     # if not already running
cd apps/web && npx vite --port 5173 --strictPort   # if not already running
```

Both Arch/CachyOS and macOS are supported dev environments. If either command
misbehaves, the per-OS quirks live in the verify skill's Environment notes —
notably, `supabase start` needs `-x vector -x analytics` on macOS under Colima.

Then open `http://localhost:5173/` in two different browsers (or one normal + one incognito window — they need separate localStorage to act as separate "devices"). Create a session as DM in one, join with the code in the other. Entrance → Workshop → Gallery all work; the Gallery elimination puzzle is fully playable and server-validated.

Local Supabase Studio (DB browser/table editor): `http://127.0.0.1:54323`

## What's NOT built yet (see full roadmap below)

- Workshop valve puzzle, Archive cipher puzzle, Vault, Spire, Prison Cell — Phase 2/3 content.
- DM console is currently **read-only** (live flags/inventory/noise/players dump) — the force-scene/clear-noise/grant-item override actions are Phase 4.
- No hosted Supabase project yet — everything above runs against local Docker only. A phone can't reach `127.0.0.1:54321`, so real multi-device (not just multi-browser-window) testing needs a hosted project + deployment. This is the next real blocker.

## Manual step needed from you before deploying

`supabase login` opens a browser for OAuth — has to happen in your terminal, not Claude's. When you're ready to deploy (or just want real hosted Postgres instead of local Docker):

1. `supabase login`
2. Create a project via the [dashboard](https://supabase.com/dashboard) (or reuse one) — **note:** in Authentication settings, enable **Anonymous Sign-ins** (off by default, the whole auth flow depends on it — see `supabase/config.toml`'s `enable_anonymous_sign_ins = true` for the local equivalent, but hosted projects need this toggled in the dashboard separately, `supabase config push` may also work for newer CLI versions but wasn't tested).
3. `supabase link --project-ref <your-project-ref>` from the repo root.
4. Tell Claude it's linked — it'll run `supabase db push` (applies all 3 migrations) and update `apps/web/.env.local` to point at the hosted URL/anon key instead of local.
5. Then: deploy `apps/web` to Vercel/Netlify for a phone-reachable URL (last remaining Phase 1 todo).

## What's built

**Tooling required:** Node (≥22; verified on 22 and 26), pnpm (≥10; verified on 10 and 11), Supabase CLI 2.109.1, a container runtime, and Playwright/Chromium for browser-based verification. See [Per-OS setup](#per-os-setup) below.

**Repo structure:**
```
apps/web/            Vite + React 19 + TS SPA — fully wired: routes, engine, Supabase client, realtime
packages/content/     Zod content schemas + Entrance/Workshop-nav/Gallery content — validates clean
supabase/             config.toml + 3 migrations, tested end-to-end against local Docker Supabase
.claude/skills/verify/  project verify skill — how to spin up + browser-test this repo (READ THIS before re-verifying anything)
```

**`packages/content`** — schemas for condition/action/hotspot/puzzle/scene, content for Entrance (full), Workshop (nav-only), Gallery (full, puzzle included). Notable refinement over the original plan: hotspots carry `actions: Action[]` (array, not singular) because most PoC click handlers do more than one thing; `showText` actions gained both `onlyIfFlagUnset` AND `onlyIfFlagSet` (needed for "first read vs. repeat read" note text — caught this gap while building the dispatcher, not while writing content). Puzzle answers are never in this package — see RPCs.

**`apps/web`** — fully wired for the Phase 1 slice:
- `src/lib/` — Supabase client, anonymous-auth helper (`ensureAnonymousSession`), typed RPC/table wrappers (`sessionApi.ts`).
- `src/state/` — Zustand store (`useSessionStore`) + the realtime subscription hook (`useSessionState`) that's the actual crux of multi-device sync. Local-only `localFlags` set for cosmetic "have I seen this text" bookkeeping (deliberately NOT synced to `session_state.flags` — only puzzle RPCs may write real party-shared flags, to avoid needing a generically-abusable set-any-flag RPC).
- `src/engine/` — `conditions.ts`, `sceneRegistry.ts`, `SceneRenderer.tsx`, `HotspotLayer.tsx`, `actionDispatch.ts`, `puzzles/EliminationPuzzle.tsx`.
- `src/scenes/` — `EntranceArt.tsx`, `WorkshopArt.tsx`, `GalleryArt.tsx` (ported verbatim from the PoC's inline SVG), `SceneShell.tsx` (shared defs/gradients).
- `src/routes/` — `LandingPage`, `JoinPage`, `PlayPage`, `DmPage` (read-only for now).
- `src/index.css` — full palette/layout ported from the PoC (gothic violet theme, hotspot hover states, puzzle modal, noise gauge).

**`supabase/migrations/`** — three migrations, all tested against real local Postgres (not just reviewed):
- `20260709124635_init_schema.sql` — `sessions`, `players` (scene is **per-player**), `session_state` (flags/inventory/noise **party-shared**), `puzzle_attempts`. RLS + explicit table-level `GRANT SELECT` (see bug #1 below).
- `20260709124636_rpc_actions.sql` — `create_session`, `join_session`, `set_current_scene`, `add_noise` (internal), `submit_puzzle_attempt` (Gallery's real answer `'butler'` lives here only). `#variable_conflict use_column` pragma on the two `RETURNS TABLE` functions (see bug #2 below).
- `20260709181557_enable_realtime.sql` — adds `players`/`session_state` to the `supabase_realtime` publication with `REPLICA IDENTITY FULL` (see bug #3 below — this one was nasty).

### Three real bugs found by actually testing (not just reading the SQL)

Writing SQL that looks right and SQL that works are different claims. In order of discovery:

1. **Missing table-level GRANTs.** RLS policies alone don't grant access — Postgres checks a base `GRANT SELECT` before RLS row-filtering ever runs. Every `SELECT` failed with `permission denied for table` despite correct RLS policies, until an explicit `grant select on ... to authenticated` was added.
2. **`ON CONFLICT` column shadowing.** `join_session`'s `returns table (session_id uuid)` creates an implicit PL/pgSQL variable named `session_id`, which collided with the real `players.session_id` column inside `on conflict (session_id, user_id)` — Postgres error 42702, "ambiguous column reference." Fixed with the `#variable_conflict use_column` pragma (the standard Postgres fix for this exact class of bug).
3. **Empty realtime publication.** The big one — found only by actually driving two browser tabs with Playwright, not by curl-testing the RPCs (which all passed). `supabase_realtime` had zero tables in it by default. RLS/grants were fine, the WebSocket subscription reported `SUBSCRIBED` with no errors, and it just never delivered a single row-change event, silently, forever. Full writeup + the psql command to check this in `.claude/skills/verify/SKILL.md`.

## Per-OS setup

Both environments are supported and both have been bootstrapped from scratch. After the OS-specific steps below, the rest is identical: `pnpm install`, then `supabase start`, then `cd apps/web && npx vite --port 5173 --strictPort`. Create `apps/web/.env.local` from `.env.local.example` using the anon key `supabase start` prints.

**Applies to both:**
- `pnpm-workspace.yaml` needs `allowBuilds.esbuild: true` (pnpm 10+ blocks postinstall scripts by default). Already committed — just don't remove it.
- `playwright install --with-deps` shells out to `apt`, so skip `--with-deps` on both. Plain `playwright install chromium` works; system libraries are already present.

**Arch / CachyOS:**
- `corepack` wasn't available even after installing Node — use `sudo pacman -S pnpm` directly.
- Supabase CLI: install as a raw binary into `~/.local/bin`. The AUR `supabase-bin` package was broken, missing its companion `supabase-go` binary.
- Docker: `sudo systemctl enable --now docker` + `sudo usermod -aG docker $USER`. New shells pick up the group; already-open shells need `sg docker -c "..."` as a workaround.

**macOS (Apple Silicon, via Homebrew):**
- `brew install node pnpm supabase/tap/supabase docker colima`, then `colima start --cpu 4 --memory 8`. Docker Desktop or OrbStack work too, in which case skip `colima`.
- Under Colima, plain `supabase start` fails: the `vector` log-collector container bind-mounts the docker socket, which Colima's host-side socket doesn't support. Migrations apply cleanly first — only the container start fails. Use `supabase start -x vector -x analytics` (you lose only Studio's log viewer), or symlink the socket once with `sudo ln -sf ~/.colima/default/docker.sock /var/run/docker.sock` so plain `supabase start` works.

**Historical note:** an early `pnpm create vite@latest --version` accidentally scaffolded a throwaway `vite-project/` at the repo root (the `--version` flag didn't short-circuit as expected) — cleaned up before it got committed to anything.

## Full remaining roadmap (Phases 2–5)

See the plan file for full detail — summary:
- **Phase 2:** remaining Stage 1 content — `NumericDialPuzzle` (Workshop valves, target `[2,0,1,3]`), `OrderedSequencePuzzle` (Archive books, target `['violet','ash','ember']`), Vault item-placement, Prison Cell. Design call already made and flagged: on noise hitting 100, only the player whose action caused it gets sent to Prison (simplest defensible per-device reading of "the party gets caught").
- **Phase 3:** Stage 2 convergence — Spire arm/vent/align flags, the real multi-device stress test (3 devices in 3 rooms simultaneously, a 4th watching the Vault objective update live).
- **Phase 4:** DM console override actions — force-scene/clear-noise/grant-item RPCs, role-gated (the read-only view already built is the foundation these attach to).
- **Phase 5:** hardening — realtime reconnect reconciliation (partially done — `useSessionState` re-fetches on every `SUBSCRIBED` event already), responsive/mobile layout pass.

Explicitly deferred beyond v1 (per user decision): commissioned art/animation, audio, telemetry, full accessibility pass, randomized/seeded puzzles, branching outcomes, expert difficulty tier.

## Reference

Two of these are gitignored local reference material, not repo content — restore them by hand at the repo root when picking the project up on a new machine. `silent_forge*.html` in particular is deliberately never committed: it has every puzzle answer in plaintext, and answers must stay confined to the Supabase RPCs.

- Approved plan: `plans/this-file-contains-the-purrfect-harbor.md` *(gitignored)*
- PoC source of truth: `silent_forge(1).html` at the repo root *(gitignored)* — the complete Stage 1+2 version, use this one, not the shorter `silent_forge.html`
- **Project verify skill: `.claude/skills/verify/SKILL.md`** — read this before re-verifying anything; it has the exact commands, the per-OS environment notes, and the realtime-publication gotcha
- Original design retrospective: `silent_forge_summary.md` (tracked, in this repo)
