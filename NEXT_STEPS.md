# Silent Forge — Progress & Next Manual Steps

Status as of 2026-07-10. **Phases 1–4 are DONE and verified end-to-end through a real browser (`pnpm verify:realtime`, 52/52 — seven simulated devices across two sessions by the final leg).** The full quest is playable start to finish: all of Stage 1 (Entrance, Workshop valves, Archive books, Gallery elimination, Vault placement, Prison escape) plus Stage 2 convergence (Spire arm lever at +35 noise, Workshop overflow vent, Archive lens realignment as a single-sigil-dial puzzle, and a server-validated `activate_convergence` that sets `won`). The Phase 3 acceptance bar was met literally: three devices flipped `armed`/`vented`/`aligned` from three different rooms while a fourth sat in the Vault watching the convergence runes light up over realtime with zero interactions, then threw the final switch itself. The DM console now has its full v1 override trio (per-player force-scene, grant-item, clear-noise), role-gated server-side and proven able to unstick a party that solved nothing. The Warden mechanic is DM-mediated: noise hitting 100 raises an alert on the DM console naming the offender — the DM narrates and decides (send someone to the cell / clear the noise); nothing happens automatically. That decision (2026-07-10) supersedes the original plan's auto-capture reading and pulled `dm_force_scene`/`dm_clear_noise` forward from Phase 4. Picking this back up? Read this file, then hand it to Claude to resume — it has full context of the plan already (`plans/this-file-contains-the-purrfect-harbor.md`), but this doc is the fast way to re-sync.

## Current state: playable locally right now

```bash
supabase start                                     # if not already running
cd apps/web && npx vite --port 5173 --strictPort   # if not already running
```

Both Arch/CachyOS and macOS are supported dev environments. If either command
misbehaves, the per-OS quirks live in the verify skill's Environment notes —
notably, `supabase start` needs `-x vector -x analytics` on macOS under Colima.

Then open `http://localhost:5173/` in two different browsers (or one normal + one incognito window — they need separate localStorage to act as separate "devices"). Create a session as DM in one, join with the code in the other. All seven scenes are playable with server-validated puzzles, from the Entrance through the final convergence (`won`); crank noise to 100 to see the DM-side Warden alert flow.

Local Supabase Studio (DB browser/table editor): `http://127.0.0.1:54323`

## Next session: Phase 5 (hardening) — or jump to deploy

Everything in Phase 5 is buildable against local Docker; the hosted deploy (below) is the only thing blocked on a manual step, and it's the real blocker for playing on phones. Phase 5 pointers:

- **Realtime cold-start / reconnect re-reconcile** (the known gap, reproduced deterministically 2026-07-10): the realtime service acks `SUBSCRIBED` before its change-feed worker is consuming, so events in the first seconds after a (re)connect are lost silently. `useSessionState` already re-fetches on every `SUBSCRIBED`, which does NOT cover this. Fix idea from the roadmap: one extra delayed re-reconcile a few seconds after `SUBSCRIBED` — also covers flaky-wifi reconnects on phones. If it works, the verify suite should stop needing the "rerun after `supabase db reset`" ritual (Gotcha #0 in the verify skill) — that's the acceptance signal.
- **Responsive/mobile layout pass** — phones are the point of the whole multi-device design. In scope: layout/touch targets. Explicitly NOT in scope (deferred beyond v1): the full accessibility pass.
- **Verify:** no new content to cover; Gotcha #0 applies until the re-reconcile fix lands (and its disappearance is the test).

## What's NOT built yet (see full roadmap below)

- **Phase 5 (hardening)** — see the section above.
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
packages/content/     Zod content schemas + all 7 scenes / 4 puzzles — validates clean
supabase/             config.toml + 5 migrations, tested end-to-end against local Docker Supabase
.claude/skills/verify/  project verify skill — how to spin up + browser-test this repo (READ THIS before re-verifying anything)
```

**`packages/content`** — schemas for condition/action/hotspot/puzzle/scene, content for all seven scenes: Entrance, Workshop (valve puzzle + Stage 2 overflow valve/Spire stair), Archive (book puzzle + Stage 2 lens realignment), Gallery (elimination puzzle), Vault (placement + convergence), Spire (arm lever), Prison (grate escape). Stage 2 additions: `armSpire`/`ventOverflow` action types, `activateConvergence` gained its narration fields (success/resist/missing texts — the *verdict* on what's missing always comes from the server), and dials gained optional `valueLabels` so the lens puzzle shows sigils instead of digits. Notable refinement over the original plan: hotspots carry `actions: Action[]` (array, not singular) because most PoC click handlers do more than one thing; `showText` actions gained both `onlyIfFlagUnset` AND `onlyIfFlagSet` (needed for "first read vs. repeat read" note text — caught this gap while building the dispatcher, not while writing content). Puzzle answers are never in this package — see RPCs.

**`apps/web`** — fully wired for Stages 1+2 (Phases 1–3):
- `src/lib/` — Supabase client, anonymous-auth helper (`ensureAnonymousSession`), typed RPC/table wrappers (`sessionApi.ts`).
- `src/state/` — Zustand store (`useSessionStore`) + the realtime subscription hook (`useSessionState`) that's the actual crux of multi-device sync. Local-only `localFlags` set for cosmetic "have I seen this text" bookkeeping (deliberately NOT synced to `session_state.flags` — only puzzle RPCs may write real party-shared flags, to avoid needing a generically-abusable set-any-flag RPC).
- `src/engine/` — `conditions.ts`, `sceneRegistry.ts`, `SceneRenderer.tsx`, `HotspotLayer.tsx`, `actionDispatch.ts` (all action types implemented, incl. armSpire/ventOverflow/activateConvergence), `puzzles/` (Elimination, NumericDial, OrderedSequence — one component per kind; NumericDial renders `valueLabels` sigils when present).
- `src/scenes/` — art components for all seven scenes (ported verbatim from the PoC's inline SVG), `SceneShell.tsx` (shared defs/gradients). `VaultArt` grew the three convergence runes (`data-converge`/`data-lit` attrs exist for the verify script) + the won state; `ArchiveArt` shows the Spire beam while armed and a steady beam once aligned.
- `src/routes/` — `LandingPage`, `JoinPage`, `PlayPage`, `DmPage` (live state dump + the Warden alert panel + the Phase 4 overrides panel: per-player force-scene picker, grant-item buttons that disable once held, standalone clear-noise — the plan's v1 trio, nothing more).
- `src/index.css` — full palette/layout ported from the PoC (gothic violet theme, hotspot hover states, puzzle modal, noise gauge).

**`supabase/migrations/`** — six migrations, all tested against real local Postgres (not just reviewed):
- `20260709124635_init_schema.sql` — `sessions`, `players` (scene is **per-player**), `session_state` (flags/inventory/noise **party-shared**), `puzzle_attempts`. RLS + explicit table-level `GRANT SELECT` (see bug #1 below).
- `20260709124636_rpc_actions.sql` — `create_session`, `join_session`, `set_current_scene`, `add_noise` (internal), `submit_puzzle_attempt` (Gallery's real answer `'butler'` lives here only). `#variable_conflict use_column` pragma on the two `RETURNS TABLE` functions (see bug #2 below).
- `20260709181557_enable_realtime.sql` — adds `players`/`session_state` to the `supabase_realtime` publication with `REPLICA IDENTITY FULL` (see bug #3 below — this one was nasty).
- `20260710093000_phase2_content.sql` — valve/book answers, `place_item`, `escape_prison`, the Warden-alert write in `add_noise` (`flags.wardenAlert`, no auto-capture), and the first two role-gated DM RPCs (`dm_force_scene`, `dm_clear_noise`).
- `20260710150000_phase3_convergence.sql` — `arm_spire` (requires `allPlaced`, +35 noise, `FOR UPDATE` row lock so two simultaneous lever-heaves can't double-arm/double-noise), `vent_overflow` (requires `armed`), the `archive-lens` answer (`[2]` = ☉, dormant until `armed`) in `submit_puzzle_attempt` (whose item grant went conditional — aligning grants a flag, no item), and `activate_convergence` (re-checks `armed && vented && aligned` server-side, reports what's missing, sets `won`).
- `20260710160000_phase4_dm_console.sql` — `dm_grant_item`, completing the role-gated DM trio. Granting sets the item's `*Found` flag too, mirroring the puzzle solve — without it the override wouldn't unstick anything (the Vault door gates on those flags). `placed*` stays untouched: placement is gameplay, not a grant.

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

## Full remaining roadmap (Phase 5)

See the plan file for full detail — summary:
- **Phase 2: DONE (2026-07-10).** `NumericDialPuzzle` (Workshop valves, target `[2,0,1,3]`), `OrderedSequencePuzzle` (Archive books, target `['violet','ash','ember']`, full-sequence validation — one server check per completed triple, not per click), Vault item-placement (`place_item` RPC, `placed*`/`allPlaced` flags), Prison Cell (repeat-click grate → `escape_prison` RPC, resets party noise). Warden mechanic is DM-mediated (see top of this doc) via `dm_force_scene`/`dm_clear_noise` — role-gated server-side, reusable as-is in Phase 4.
- **Phase 3: DONE (2026-07-10).** Stage 2 convergence — Spire scene + `arm_spire` (+35 noise), Workshop overflow vent, Archive lens sigil dial, server-validated `activate_convergence` → `won`. Acceptance test passed as written: Players Two/Three/Five acted in Spire/Workshop/Archive while Player Four sat in the Vault watching the runes light up via realtime (zero interactions, zero reloads), then activated the convergence. Verify suite now 43/43 across five devices.
- **Phase 4: DONE (2026-07-10).** DM console overrides — `dm_grant_item` RPC (force-scene/clear-noise already existed from Phase 2) + the always-on Overrides panel on `/dm/:code`: per-player scene mover, grant-item buttons, standalone clear-noise. Verified with a second fresh session where the DM unstuck a party by grants alone (Vault door opened without a single puzzle solved). Suite now 52/52.
- **Phase 5:** hardening — realtime reconnect reconciliation (partially done — `useSessionState` re-fetches on every `SUBSCRIBED` event already, but that doesn't cover the **Realtime cold-start gap**: the service acks `SUBSCRIBED` before its change-feed worker is consuming, and events fired in the first seconds are lost silently — see Gotcha #0 in the verify skill, reproduced deterministically 2026-07-10. Fix idea: one extra delayed re-reconcile a few seconds after `SUBSCRIBED`, which also covers flaky-wifi reconnects on phones), responsive/mobile layout pass.

Explicitly deferred beyond v1 (per user decision): commissioned art/animation, audio, telemetry, full accessibility pass, randomized/seeded puzzles, branching outcomes, expert difficulty tier.

## Reference

Two of these are gitignored local reference material, not repo content — restore them by hand at the repo root when picking the project up on a new machine. `silent_forge*.html` in particular is deliberately never committed: it has every puzzle answer in plaintext, and answers must stay confined to the Supabase RPCs.

- Approved plan: `plans/this-file-contains-the-purrfect-harbor.md` *(gitignored)*
- PoC source of truth: `silent_forge(1).html` at the repo root *(gitignored)* — the complete Stage 1+2 version, use this one, not the shorter `silent_forge.html`
- **Project verify skill: `.claude/skills/verify/SKILL.md`** — read this before re-verifying anything; it has the exact commands, the per-OS environment notes, and the realtime-publication gotcha
- Original design retrospective: `silent_forge_summary.md` (tracked, in this repo)
