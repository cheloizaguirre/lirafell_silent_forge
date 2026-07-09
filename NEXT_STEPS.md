# Silent Forge — Progress & Next Manual Steps

Status as of 2026-07-10. **Phases 1 AND 2 are DONE and verified end-to-end through a real browser with two simulated devices (`pnpm verify:realtime`, 24/24).** All of Stage 1 is playable: Entrance, Workshop (valve puzzle), Archive (book puzzle), Gallery (elimination puzzle), Vault (component placement), Prison Cell (grate escape). The Warden mechanic is DM-mediated: noise hitting 100 raises an alert on the DM console naming the offender — the DM narrates and decides (send someone to the cell / clear the noise); nothing happens automatically. That decision (2026-07-10) supersedes the original plan's auto-capture reading and pulled `dm_force_scene`/`dm_clear_noise` forward from Phase 4. Picking this back up? Read this file, then hand it to Claude to resume — it has full context of the plan already (`plans/this-file-contains-the-purrfect-harbor.md`), but this doc is the fast way to re-sync.

## Current state: playable locally right now

```bash
supabase start                                     # if not already running
cd apps/web && npx vite --port 5173 --strictPort   # if not already running
```

Both Arch/CachyOS and macOS are supported dev environments. If either command
misbehaves, the per-OS quirks live in the verify skill's Environment notes —
notably, `supabase start` needs `-x vector -x analytics` on macOS under Colima.

Then open `http://localhost:5173/` in two different browsers (or one normal + one incognito window — they need separate localStorage to act as separate "devices"). Create a session as DM in one, join with the code in the other. All six Stage 1 scenes are playable with server-validated puzzles; crank noise to 100 to see the DM-side Warden alert flow.

Local Supabase Studio (DB browser/table editor): `http://127.0.0.1:54323`

## Next session: Phase 3 (Stage 2 convergence)

Everything here is buildable against local Docker; no manual steps block it. Concrete pointers so the next session doesn't re-derive them:

- **What it is** (approved plan, Phase 3): Spire scene + arm lever (loud: +35 noise), Workshop overflow-valve vent, Archive lens realignment, then a server-validated `activate_convergence` that re-checks `armed && vented && aligned` server-side. Acceptance test: three devices acting in three rooms simultaneously while a fourth watches the Vault objective update live — this, not the two-tab test, is the real multi-device bar.
- **PoC reference** (`silent_forge(1).html` at repo root, gitignored): Spire scene 594–625, Workshop overflow valve 353–364 + Spire-stair hotspot 350–352 (gated on `allPlaced`), Archive lens rotate/lock 466–481, Vault convergence hotspot 562–577. Symbols array + `SPIRE_SYMBOL_INDEX = 2` (☉) at 131–132 — the alignment answer, server-side only like all answers.
- **Existing hooks to build on:** `activateConvergence` action type exists, dispatcher stub at `apps/web/src/engine/actionDispatch.ts` says "not built yet". The lens realignment is a single-dial `numeric-dial` puzzle variant per the approved plan (schema already supports 1 dial). `dm_force_scene`/`dm_clear_noise` show the RPC patterns; `armed`/`vented`/`aligned` are ordinary `session_state.flags` set by new RPCs (arming adds 35 noise — reuse `add_noise`, which also gives the Warden alert for free). `SpireArt` needs creating + registering in `sceneRegistry.ts`; Workshop's Spire-stair and overflow-valve hotspots are flag-gated via existing `visibleWhen` conditions (WorkshopArt already renders the armed/vented/allPlaced visuals — built ahead in Phase 1).
- **Verify:** extend `scripts/verify-realtime.mjs` with a Phase 3 leg (a third browser context for the convergence test). Remember Gotcha #0 (cold-start rerun) after any `supabase db reset`.

## What's NOT built yet (see full roadmap below)

- **Phase 3 (Stage 2 convergence)** — see the section above.
- DM console has its first two actions (Warden alert: force-to-prison, clear noise) — the grant-item override and a general force-scene UI are still Phase 4.
- No hosted Supabase project yet — everything above runs against local Docker only. A phone can't reach `127.0.0.1:54321`, so real multi-device (not just multi-browser-window) testing needs a hosted project + deployment. This is the next real blocker.

## Manual step needed from you before deploying

`supabase login` opens a browser for OAuth — has to happen in your terminal, not Claude's. When you're ready to deploy (or just want real hosted Postgres instead of local Docker):

1. `supabase login`
2. Create a project via the [dashboard](https://supabase.com/dashboard) (or reuse one) — **note:** in Authentication settings, enable **Anonymous Sign-ins** (off by default, the whole auth flow depends on it — see `supabase/config.toml`'s `enable_anonymous_sign_ins = true` for the local equivalent, but hosted projects need this toggled in the dashboard separately, `supabase config push` may also work for newer CLI versions but wasn't tested).
3. `supabase link --project-ref <your-project-ref>` from the repo root.
4. Tell Claude it's linked — it'll run `supabase db push` (applies all migrations) and update `apps/web/.env.local` to point at the hosted URL/anon key instead of local.
5. Then: deploy `apps/web` to Vercel/Netlify for a phone-reachable URL (last remaining Phase 1 todo).

## What's built

**Tooling required:** Node (≥22; verified on 22 and 26), pnpm (≥10; verified on 10 and 11), Supabase CLI 2.109.1, a container runtime, and Playwright/Chromium for browser-based verification. See [Per-OS setup](#per-os-setup) below.

**Repo structure:**
```
apps/web/            Vite + React 19 + TS SPA — fully wired: routes, engine, Supabase client, realtime
packages/content/     Zod content schemas + all 6 Stage 1 scenes / 3 puzzles — validates clean
supabase/             config.toml + 4 migrations, tested end-to-end against local Docker Supabase
.claude/skills/verify/  project verify skill — how to spin up + browser-test this repo (READ THIS before re-verifying anything)
```

**`packages/content`** — schemas for condition/action/hotspot/puzzle/scene, content for all of Stage 1: Entrance, Workshop (valve puzzle), Archive (book puzzle), Gallery (elimination puzzle), Vault (placement), Prison (grate escape). Notable refinement over the original plan: hotspots carry `actions: Action[]` (array, not singular) because most PoC click handlers do more than one thing; `showText` actions gained both `onlyIfFlagUnset` AND `onlyIfFlagSet` (needed for "first read vs. repeat read" note text — caught this gap while building the dispatcher, not while writing content). Puzzle answers are never in this package — see RPCs.

**`apps/web`** — fully wired for Stage 1 (Phases 1+2):
- `src/lib/` — Supabase client, anonymous-auth helper (`ensureAnonymousSession`), typed RPC/table wrappers (`sessionApi.ts`).
- `src/state/` — Zustand store (`useSessionStore`) + the realtime subscription hook (`useSessionState`) that's the actual crux of multi-device sync. Local-only `localFlags` set for cosmetic "have I seen this text" bookkeeping (deliberately NOT synced to `session_state.flags` — only puzzle RPCs may write real party-shared flags, to avoid needing a generically-abusable set-any-flag RPC).
- `src/engine/` — `conditions.ts`, `sceneRegistry.ts`, `SceneRenderer.tsx`, `HotspotLayer.tsx`, `actionDispatch.ts` (placeItem/repeatClick/escapePrison implemented; activateConvergence still stubbed), `puzzles/` (Elimination, NumericDial, OrderedSequence — one component per kind).
- `src/scenes/` — art components for all six scenes (ported verbatim from the PoC's inline SVG), `SceneShell.tsx` (shared defs/gradients). `SpireArt` is Phase 3.
- `src/routes/` — `LandingPage`, `JoinPage`, `PlayPage`, `DmPage` (live state dump + the Warden alert panel — its first write surface).
- `src/index.css` — full palette/layout ported from the PoC (gothic violet theme, hotspot hover states, puzzle modal, noise gauge).

**`supabase/migrations/`** — four migrations, all tested against real local Postgres (not just reviewed):
- `20260709124635_init_schema.sql` — `sessions`, `players` (scene is **per-player**), `session_state` (flags/inventory/noise **party-shared**), `puzzle_attempts`. RLS + explicit table-level `GRANT SELECT` (see bug #1 below).
- `20260709124636_rpc_actions.sql` — `create_session`, `join_session`, `set_current_scene`, `add_noise` (internal), `submit_puzzle_attempt` (Gallery's real answer `'butler'` lives here only). `#variable_conflict use_column` pragma on the two `RETURNS TABLE` functions (see bug #2 below).
- `20260709181557_enable_realtime.sql` — adds `players`/`session_state` to the `supabase_realtime` publication with `REPLICA IDENTITY FULL` (see bug #3 below — this one was nasty).
- `20260710093000_phase2_content.sql` — valve/book answers, `place_item`, `escape_prison`, the Warden-alert write in `add_noise` (`flags.wardenAlert`, no auto-capture), and the first two role-gated DM RPCs (`dm_force_scene`, `dm_clear_noise`).

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
- **Phase 2: DONE (2026-07-10).** `NumericDialPuzzle` (Workshop valves, target `[2,0,1,3]`), `OrderedSequencePuzzle` (Archive books, target `['violet','ash','ember']`, full-sequence validation — one server check per completed triple, not per click), Vault item-placement (`place_item` RPC, `placed*`/`allPlaced` flags), Prison Cell (repeat-click grate → `escape_prison` RPC, resets party noise). Warden mechanic is DM-mediated (see top of this doc) via `dm_force_scene`/`dm_clear_noise` — role-gated server-side, reusable as-is in Phase 4.
- **Phase 3:** Stage 2 convergence — Spire arm/vent/align flags, the real multi-device stress test (3 devices in 3 rooms simultaneously, a 4th watching the Vault objective update live).
- **Phase 4:** DM console override actions — force-scene/clear-noise/grant-item RPCs, role-gated (the read-only view already built is the foundation these attach to).
- **Phase 5:** hardening — realtime reconnect reconciliation (partially done — `useSessionState` re-fetches on every `SUBSCRIBED` event already, but that doesn't cover the **Realtime cold-start gap**: the service acks `SUBSCRIBED` before its change-feed worker is consuming, and events fired in the first seconds are lost silently — see Gotcha #0 in the verify skill, reproduced deterministically 2026-07-10. Fix idea: one extra delayed re-reconcile a few seconds after `SUBSCRIBED`, which also covers flaky-wifi reconnects on phones), responsive/mobile layout pass.

Explicitly deferred beyond v1 (per user decision): commissioned art/animation, audio, telemetry, full accessibility pass, randomized/seeded puzzles, branching outcomes, expert difficulty tier.

## Reference

Two of these are gitignored local reference material, not repo content — restore them by hand at the repo root when picking the project up on a new machine. `silent_forge*.html` in particular is deliberately never committed: it has every puzzle answer in plaintext, and answers must stay confined to the Supabase RPCs.

- Approved plan: `plans/this-file-contains-the-purrfect-harbor.md` *(gitignored)*
- PoC source of truth: `silent_forge(1).html` at the repo root *(gitignored)* — the complete Stage 1+2 version, use this one, not the shorter `silent_forge.html`
- **Project verify skill: `.claude/skills/verify/SKILL.md`** — read this before re-verifying anything; it has the exact commands, the per-OS environment notes, and the realtime-publication gotcha
- Original design retrospective: `silent_forge_summary.md` (tracked, in this repo)
