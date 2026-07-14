# Silent Forge — Progress & Next Manual Steps

Status as of 2026-07-14. **Phases 1–7 are DONE, the 8-bit pixel art rework (the top v2 candidate) is DONE and merged to `main`, and the hosted deploy (Supabase + Netlify) is LIVE.** Verified end-to-end through a real browser (`pnpm verify:realtime`, **91/91** — seven simulated devices across two sessions by the final leg — plus `pnpm verify:mobile`, 18 layout/touch checks on emulated iPads). **Multi-device / multi-session play has also been validated by hand against the hosted deploy** (real separate devices across multiple sessions), so real-world multi-user sync is confirmed, not just the simulated-device suite.

## Pixel art rework — DONE and merged (2026-07-11)

`main` now renders **procedural 8-bit pixel scenes** for all seven rooms (no binary assets — each scene draws into a 160×100 framebuffer and upscales with `image-rendering: pixelated`). The SVG originals were moved to `apps/web/src/scenes/obsolete/` (2026-07-12) as **historical reference only** — no longer swap-back-ready, since they predate both the pixel-feedback relocation and the difficulty pass (see the `obsolete/README.md`); `engine/sceneRegistry.ts` points every scene at its `*Pixel` component. The full pipeline + the ten screenshot-learned design rules live in `docs/pixel-prototype-notes.md`; the current playthrough route is `docs/pixel-approval-walkthrough.md`.

The rework shipped in two waves: all seven scenes first, then a **feedback pass** (`docs/pixel_feedback.md`) merged as one branch. Feedback-pass gameplay changes worth remembering:

- **The valve code (2-0-1-3) moved off the Workshop plaque** — its only copy is a note behind a loose brick in the prison cell. **Getting captured is now the intended route to it** (no backup hint; the DM can always force a player to the cell, and after one escape a Workshop floor hatch reopens the corridor side).
- **A new `prison-corridor` scene** (SceneId + `PrisonCorridorArtPixel`, same component with a `side` prop): reached via the Workshop hatch; the desk key opens the cell door, which **re-locks every time** (no persistent unlock flag — deliberate).
- **Hidden clues reveal party-wide**: gallery cipher behind the hound's case, tome haiku on the Archive's top shelf; captions stay hidden until found. Uses a new **allowlisted `set_party_flag` RPC** (`galleryClueFound`/`archiveClueFound`/`brickOpened`) — the first player-writable flag path, deliberately not a generic setter. (Clue *encodings* were hardened later — see "Puzzle difficulty pass" below.)
- **Spire stairwell relocated from Workshop → Vault** (the stairs connect Vault↔Spire; Spire's exit chip now leads to the Vault).
- **DM warden hide/show toggle** (`dm_set_warden_hidden` + `flags.wardenHidden`) — groundwork for a future noise jump-scare.
- **Per-room `onEnter` descriptions** (print every entry); the Vault's tracks the convergence diamonds. `showText` actions gained a `when` condition evaluated against **party** flags (distinct from the local-only `onlyIfFlag*`).
- Player inventory renders as **pixel item sprites** (`ItemSpritePixel`), names preserved for a11y/tests via a visually-hidden span.
- Puzzle modals (dial, elimination) auto-close on solve like the sequence one; wrong valve tests BANG once per wrong dial (noise stays flat +30); BANG lifetime ~1.7s.

**Two new migrations** shipped with this (both applied to local via `supabase db reset`, which wipes any running session — start fresh):
- `20260711090000_end_session.sql` — DM `end_session` (landing "resume or start fresh").
- `20260711120000_pixel_feedback.sql` — `set_party_flag`, `dm_set_warden_hidden`, `add_noise` gains `p_bangs` (**DROP+CREATE**, new signature), `escape_prison` sets `escapedPrison`, `submit_puzzle_attempt` (tome fails now +30, valve fails report wrong-dial count), cheat-sheet notes updated.

**Warden noise jump-scare — DONE (2026-07-12).** Built on the hide/show toggle: a `wardenRoom` flag drives a `WardenJumpScare` overlay. **Still deferred (tracked, not built):** the locked-cabinet "harder puzzle" reward (an optional detail-hunt reward, no new scenes — the prison desk key opens the cell door now, so the cabinet still has no key). Now specced — a capstone gear-arrangement lock in `docs/cabinet-gears-puzzle-spec.md` — but not yet built or scheduled.

## Puzzle difficulty pass — clue text only (2026-07-12)

The three Stage-1 clues were rewritten to be harder to read; **answers and scenes/states are unchanged** (server RPCs untouched), so `verify:realtime`'s solve paths still hold. Clue text lives in `packages/content/src/data/scenes.ts` (the authoritative note `showText`, re-readable by re-clicking the hotspot) with short teaser captions in the `*Pixel` art:

- **Archive tomes** — the plain "Violet before Ash, Ash before Ember" became a burn-cycle **haiku** ("Twilight-crowned, it flares / then sinks to pale grey stillness / one coal, still breathing") with no color names; twilight-flare→Violet, pale-grey→Ash, one-coal→Ember, Black Tome unnamed = decoy.
- **Gallery automatons** — the "never sang" riddle became a **Caesar cipher**: the note reads `FYXPIV`, key = the number of automatons whose eyes blink (**4**; the butler's never do), shift back 4 → `BUTLER`. The blinking hint doubles as both the key and a nudge toward the one calm exhibit.
- **Workshop valves** — the bare `2 – 0 – 1 – 3` brick note became a **breathing-drill ditty** (raise both arms = 2, empty mind to nothing = 0, one slow breath = 1, pat back three times = 3, in valve order). `PrisonArtPixel` no longer pixel-renders `2013` — the on-canvas note is now unreadable scribble so it doesn't spoil the ditty; `drawDigits` is retired but kept in `dungeonKit`.

**New migration** (applied locally):
- `20260712100000_dm_cheatsheet_clues.sql` — `create or replace dm_get_solutions`: the DM cheat-sheet `note` fields now describe the new encodings. Solution strings keep their `2 - 0 - 1 - 3` / `Silent Butler` / `Violet -> Ash -> Ember` / `☉` literals (asserted by `verify:realtime`).

## Lore/vagueness pass + vault-door change (2026-07-14) — content only, NO migration

Two merge commits on `main` (`lore-vagueness-pass`, then `vault-door-any-component`). **Pure content/prose + one condition swap — no SQL, no new migration, so nothing new to `db push`.** Type-checks clean; not browser-playthrough-verified (would need solving a puzzle to hold a component).

- **Rebrand.** The quest is now **"Brakka's Workshop"** — the owner's full name is **Brakka Voss**, so the collapsed valet's nameplate keeps the "Voss" family name on purpose. The landing-page subtitle is now "A Brakka's Workshop subquest"; the word **"atelier" is gone repo-wide**. A new NPC name, **Milly**, appears in the Archive dial recording (rewritten to an in-character rambling log that drops the old explicit three-keys clue).
- **Terminology (locked with user):** **"aether"** = the magical force; **"aetheryte"** = a distinct object (the crystal hidden in the Spire mechanism). Don't normalize one to the other.
- **Clues made even vaguer** (extends the LOCKED 2026-07-12 difficulty pass; answers/RPCs unchanged — do NOT simplify back): bookshelf prompt dropped "in some particular order"; the Gallery-elimination prompt is now just "Which one will you inspect?" and the Gallery `onEnter` dropped the explicit butler-wink sentence (the butler's one blinking eye is still *rendered* in `GalleryArtPixel` via `eye()`, so the 7-blinking-eyes → IBASLY → BUTLER cipher still holds); the Archive haiku middle line is now "burnt spent stillness"; the entrance-hall note and the prison breathing-drill note were reworded vaguer (the explicit "set the valves in the order I relax" line is gone — the order is still encoded in the drill).
- **Typo/consistency fixes** in the same pass: "keeps makes" → "keeps making" (cabinet prompt), "ultra scene" → "it flares" (a stray error in the haiku's first line), and a dangling `"` closed in the entrance-hall note.
- **Vault door now opens with ANY one component** (heart/lens/valve), not all three — the gate switched `allOf`→`anyOf` on both the open and sealed hotspots, so players can walk into the antechamber early and see the empty sockets (foreboding by design). The Vault scene already handles partial state: the `allPlaced=false` entry text, per-socket `missingText` gating, and the `allPlaced`-locked stairwell/convergence all still hold.

---

**Everything below predates the pixel merge; the phase history is still accurate, but "renders SVG" is now "renders pixel", and the verify count is 91 not 67.**

 The full quest is playable start to finish: all of Stage 1 (Entrance, Workshop valves, Archive books, Gallery elimination, Vault placement, Prison escape) plus Stage 2 convergence (Spire arm lever at +35 noise, Workshop overflow vent, Archive lens realignment as a single-sigil-dial puzzle, and a server-validated `activate_convergence` that sets `won`). The Phase 3 acceptance bar was met literally: three devices flipped `armed`/`vented`/`aligned` from three different rooms while a fourth sat in the Vault watching the convergence runes light up over realtime with zero interactions, then threw the final switch itself. The DM console now has its full v1 override trio (per-player force-scene, grant-item, clear-noise), role-gated server-side and proven able to unstick a party that solved nothing. The Warden mechanic is DM-mediated: noise hitting 100 raises an alert on the DM console naming the offender — the DM narrates and decides (send someone to the cell / clear the noise); nothing happens automatically. That decision (2026-07-10) supersedes the original plan's auto-capture reading and pulled `dm_force_scene`/`dm_clear_noise` forward from Phase 4. Picking this back up? Read this file, then hand it to Claude to resume — it has full context of the plan already (`plans/this-file-contains-the-purrfect-harbor.md`), but this doc is the fast way to re-sync.

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

## Where v1 stands / what's next

Seven build phases are done (Phase 6: polish — neutral dark theme, projection-scale type, split log, DM-facing noise + BANG bursts; Phase 7: v1 improvements — DM cheat-sheet, visible corner-exit chips + a way back to the Entrance Hall, auto-closing book puzzle). **Per user decision 2026-07-10, the hosted deploy moved to the END of v2** — v1 improved locally against Docker until then. **That deploy is now DONE (2026-07-13) and live on Netlify + hosted Supabase, with multi-device/multi-session play validated by hand — see the "Hosted deploy" section below.**

**The top v2 candidate — 8-bit sprite art — is now DONE and merged (see the "Pixel art rework" section above).** The original estimate (`docs/sprite-art-analysis.md`: "art production dominates, ~1–2 weeks") collapsed: procedural sprites drawn in code took ~a day per several scenes, no binary asset pipeline needed. **The hosted deploy is now DONE too (Supabase + Netlify — see `docs/DEPLOY.md`), and multi-device/multi-session play has been validated by hand against it.** The warden jump-scare (2026-07-12) also shipped. **Remaining v2 work: only the deferred locked-cabinet reward puzzle, if wanted.**

## What's NOT built yet

- Everything in the "explicitly deferred beyond v1" list at the bottom of the roadmap.
- The deferred locked-cabinet reward puzzle (optional, unscheduled) — now specced in `docs/cabinet-gears-puzzle-spec.md` (capstone gear-arrangement lock), pending a build decision.

## Before an actual launch

- **Author the real puzzle answers.** The current answers (2013 / butler / violet→ash→ember / ☉) are PoC placeholders that appear in tracked docs + the Supabase RPCs — fine for now, but real puzzles should be authored before a public launch. Answers live only in `submit_puzzle_attempt` and the `dm_get_solutions` cheat-sheet (the two places to keep in sync), so swapping them is a new migration, not a bundle change.

## Hosted deploy — DONE (2026-07-13)

The app is live on Netlify against a hosted Supabase project (full runbook: `docs/DEPLOY.md`). Supabase migrations were pushed with `supabase db push`, **Anonymous Sign-ins is enabled** in the dashboard (the whole auth flow depends on it), and `apps/web` builds and serves from Netlify with `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` set as build-time env vars. **Multi-device / multi-session play was validated by hand against the live site** — separate real devices across multiple sessions synced correctly over hosted realtime, so real-world multi-user is confirmed. Optional remaining: a custom domain (`docs/DEPLOY.md` Part 2 §5).

Updating later: frontend changes auto-deploy on push to the connected branch; DB changes are a new migration + `supabase db push`; changed Supabase env values need a Netlify redeploy (build-time).

## What's built

**Tooling required:** Node (≥22; verified on 22 and 26), pnpm (≥10; verified on 10 and 11), Supabase CLI 2.109.1, a container runtime, and Playwright/Chromium for browser-based verification. See [Per-OS setup](#per-os-setup) below.

**Repo structure:**
```
apps/web/            Vite + React 19 + TS SPA — fully wired: routes, engine, Supabase client, realtime
  src/scenes/pixel/   procedural 8-bit scene components (ACTIVE) + pixelCanvas.ts / dungeonKit.ts / ItemSpritePixel.tsx
  src/scenes/obsolete/  the SVG originals — historical reference only (stale; see obsolete/README.md)
packages/content/     Zod content schemas + all 8 scenes / 4 puzzles — validates clean
supabase/             config.toml + 13 migrations, tested end-to-end against local Docker Supabase (and pushed to hosted)
docs/                 pixel-prototype-notes.md (pipeline + design rules), pixel-approval-walkthrough.md (route),
                      pixel_feedback.md (the feedback pass), sprite-art-analysis.md (superseded v2 assessment)
.claude/skills/verify/  project verify skill — how to spin up + browser-test this repo (READ THIS before re-verifying anything)
```

**`packages/content`** — schemas for condition/action/hotspot/puzzle/scene, content for all seven scenes: Entrance, Workshop (valve puzzle + Stage 2 overflow valve/Spire stair), Archive (book puzzle + Stage 2 lens realignment), Gallery (elimination puzzle), Vault (placement + convergence), Spire (arm lever), Prison (grate escape). Stage 2 additions: `armSpire`/`ventOverflow` action types, `activateConvergence` gained its narration fields (success/resist/missing texts — the *verdict* on what's missing always comes from the server), and dials gained optional `valueLabels` so the lens puzzle shows sigils instead of digits. Notable refinement over the original plan: hotspots carry `actions: Action[]` (array, not singular) because most PoC click handlers do more than one thing; `showText` actions gained both `onlyIfFlagUnset` AND `onlyIfFlagSet` (needed for "first read vs. repeat read" note text — caught this gap while building the dispatcher, not while writing content). Puzzle answers are never in this package — see RPCs.

**`apps/web`** — fully wired for Stages 1+2 (Phases 1–3):
- `src/lib/` — Supabase client, anonymous-auth helper (`ensureAnonymousSession`), typed RPC/table wrappers (`sessionApi.ts`).
- `src/state/` — Zustand store (`useSessionStore`) + the realtime subscription hook (`useSessionState`) that's the actual crux of multi-device sync. Local-only `localFlags` set for cosmetic "have I seen this text" bookkeeping (deliberately NOT synced to `session_state.flags` — only puzzle RPCs may write real party-shared flags, to avoid needing a generically-abusable set-any-flag RPC).
- `src/engine/` — `conditions.ts`, `sceneRegistry.ts`, `SceneRenderer.tsx`, `HotspotLayer.tsx`, `actionDispatch.ts` (all action types implemented, incl. armSpire/ventOverflow/activateConvergence), `puzzles/` (Elimination, NumericDial, OrderedSequence — one component per kind; NumericDial renders `valueLabels` sigils when present).
- `src/scenes/` — art components for all seven scenes (ported verbatim from the PoC's inline SVG), `SceneShell.tsx` (shared defs/gradients). `VaultArt` grew the three convergence runes (`data-converge`/`data-lit` attrs exist for the verify script) + the won state; `ArchiveArt` shows the Spire beam while armed and a steady beam once aligned.
- `src/routes/` — `LandingPage`, `JoinPage`, `PlayPage`, `DmPage` (live state dump + the Warden alert panel + the Phase 4 overrides panel: per-player force-scene picker, grant-item buttons that disable once held, standalone clear-noise — the plan's v1 trio, nothing more).
- `src/index.css` — originally the PoC's gothic-violet palette; since Phase 6 a neutral dark theme with purple as sparing highlight, projection-scale type, the split-log layout (latest panel + history rail), the DM-only noise gauge, and the BANG burst animations.

**`supabase/migrations/`** — 13 migrations, all tested against real local Postgres (not just reviewed) and pushed to hosted. The ten below cover through the pixel-feedback pass; the three newest — `20260712100000_dm_cheatsheet_clues.sql` (difficulty pass, described above), `20260712120000_warden_summon.sql` (warden jump-scare), and `20260712130000_gallery_cipher_key7.sql` (cipher retune) — are covered in their own sections:
- `20260709124635_init_schema.sql` — `sessions`, `players` (scene is **per-player**), `session_state` (flags/inventory/noise **party-shared**), `puzzle_attempts`. RLS + explicit table-level `GRANT SELECT` (see bug #1 below).
- `20260709124636_rpc_actions.sql` — `create_session`, `join_session`, `set_current_scene`, `add_noise` (internal), `submit_puzzle_attempt` (Gallery's real answer `'butler'` lives here only). `#variable_conflict use_column` pragma on the two `RETURNS TABLE` functions (see bug #2 below).
- `20260709181557_enable_realtime.sql` — adds `players`/`session_state` to the `supabase_realtime` publication with `REPLICA IDENTITY FULL` (see bug #3 below — this one was nasty).
- `20260710093000_phase2_content.sql` — valve/book answers, `place_item`, `escape_prison`, the Warden-alert write in `add_noise` (`flags.wardenAlert`, no auto-capture), and the first two role-gated DM RPCs (`dm_force_scene`, `dm_clear_noise`).
- `20260710150000_phase3_convergence.sql` — `arm_spire` (requires `allPlaced`, +35 noise, `FOR UPDATE` row lock so two simultaneous lever-heaves can't double-arm/double-noise), `vent_overflow` (requires `armed`), the `archive-lens` answer (`[2]` = ☉, dormant until `armed`) in `submit_puzzle_attempt` (whose item grant went conditional — aligning grants a flag, no item), and `activate_convergence` (re-checks `armed && vented && aligned` server-side, reports what's missing, sets `won`).
- `20260710160000_phase4_dm_console.sql` — `dm_grant_item`, completing the role-gated DM trio. Granting sets the item's `*Found` flag too, mirroring the puzzle solve — without it the override wouldn't unstick anything (the Vault door gates on those flags). `placed*` stays untouched: placement is gameplay, not a grant.
- `20260710190000_phase6_polish.sql` — noise attribution + DM steppers. `add_noise` now stamps `flags.noiseEvent = {seq, by, amount}` on every noise-raising call (seq is monotonic so clients can dedupe reconcile re-fetches; `by` is the actor's `players.id`, correct through the SECURITY DEFINER chain) — this drives the BANG bursts. `dm_adjust_noise(session, delta)` is the ±10 stepper RPC: role-gated, delta-based (two quick taps can't race a stale read), clamped 0–100; positive deltas route through `add_noise` (so DM-added noise BANGs on player screens and can trip the Warden), stepping down below 100 strips `wardenAlert`.
- `20260710210000_phase7_dm_cheatsheet.sql` — `dm_get_solutions`, role-gated like the override trio. The cheat-sheet exists so the answers-only-in-RPCs invariant survives having a DM-facing solutions panel: answers still never ship in the client bundle; the DM console fetches them at runtime. If an answer changes in `submit_puzzle_attempt`, change it here too — these two places are the only ones.
- `20260711090000_end_session.sql` — `end_session` (DM-only): marks the session complete so it stops matching the active-session resume filter, freeing the DM to start a clean run from the landing page.
- `20260711120000_pixel_feedback.sql` — the pixel feedback pass. `set_party_flag(session, flag)` — first player-writable flag path, **allowlisted** to `galleryClueFound`/`archiveClueFound`/`brickOpened` (clue reveals), not a generic setter. `dm_set_warden_hidden` (party `flags.wardenHidden`). `add_noise` gains `p_bangs int default 1` — a new signature, so **DROP + CREATE** (not `create or replace`) and re-assert the revoke; internal 2-arg callers resolve via the default. `escape_prison` also sets `flags.escapedPrison`. `submit_puzzle_attempt`: `archive-books` fails now +30 noise; `workshop-valves` fails compute the wrong-dial count and pass it as `p_bangs` (one BANG per wrong dial). `dm_get_solutions` notes updated (clue is behind the prison brick; tome fails loud). Answers still live only here + the cheat-sheet.

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

## Full roadmap (all build phases complete)

- **Phase 7: DONE (2026-07-10).** v1 improvements (user-directed): (a) **DM cheat-sheet** — collapsed `<details>` panel on the console listing all four puzzle solutions + the Stage 2 order, fed by the role-gated `dm_get_solutions` RPC so the answers-only-in-RPCs invariant holds. (b) **Visible navigation** — the corner "Back to Workshop" exits were invisible 10%×10% hover regions (undiscoverable on touch/projector), and nothing led back to the Entrance Hall at all (true in the PoC too). Hotspots gained an optional `chip: true` (schema + `HotspotLayer`) rendering an always-visible labeled button; all four corner exits are chips, and the Workshop gained a "Back to Entrance Hall" chip. (c) **Book puzzle auto-closes on solve** — the payoff (tomes settling, inventory) happens in the scene, so the modal no longer sits in front of it. (d) **8-bit sprite analysis** written to `docs/sprite-art-analysis.md` (v2 candidate). Suite now 67/67.
- **Phase 6: DONE (2026-07-10).** Polish pass (user-directed, planned after Phase 5): (a) **de-purple** — neutral dark theme in `index.css` AND the seven SVG scenes (structural hexes remapped to neutral grays that mirror the CSS variables — SVG presentation attributes don't substitute `var()`, see the SceneShell comment; purple survives only as highlight/magic: title, accent borders, hotspot glow, runes/beams/lit eyes). (b) **Projection typography** — 19px body base, 21px latest-message panel, 32px h1, `#root` widened to 1280px. Phones are explicitly out of scope now (tablets/laptops/projector only — supersedes the Phase 5 phone framing; the touch-target work carries over, `verify:mobile` retargeted to iPads portrait+landscape). (c) **Split log** — per-device as before, but rendered as a single big `.log-latest` message under the scene plus a newest-first `.log-bubble` history rail (rail sits right of the scene ≥900px, stacks below it under). (d) **Noise theater** — gauge is DM-only (players never see the meter), DM Overrides gained ±10 steppers, and `flags.noiseEvent` drives BANG bursts: big centered on your own noise, small anonymous corner burst for anyone else's (incl. DM-added noise). BANGs sit above the puzzle overlay (z 20) because wrong answers — the main noise source — happen with a modal open. Suite now 62/62 + 18 tablet layout checks.

See the plan file for full detail — summary:
- **Phase 2: DONE (2026-07-10).** `NumericDialPuzzle` (Workshop valves, target `[2,0,1,3]`), `OrderedSequencePuzzle` (Archive books, target `['violet','ash','ember']`, full-sequence validation — one server check per completed triple, not per click), Vault item-placement (`place_item` RPC, `placed*`/`allPlaced` flags), Prison Cell (repeat-click grate → `escape_prison` RPC, resets party noise). Warden mechanic is DM-mediated (see top of this doc) via `dm_force_scene`/`dm_clear_noise` — role-gated server-side, reusable as-is in Phase 4.
- **Phase 3: DONE (2026-07-10).** Stage 2 convergence — Spire scene + `arm_spire` (+35 noise), Workshop overflow vent, Archive lens sigil dial, server-validated `activate_convergence` → `won`. Acceptance test passed as written: Players Two/Three/Five acted in Spire/Workshop/Archive while Player Four sat in the Vault watching the runes light up via realtime (zero interactions, zero reloads), then activated the convergence. Verify suite now 43/43 across five devices.
- **Phase 4: DONE (2026-07-10).** DM console overrides — `dm_grant_item` RPC (force-scene/clear-noise already existed from Phase 2) + the always-on Overrides panel on `/dm/:code`: per-player scene mover, grant-item buttons, standalone clear-noise. Verified with a second fresh session where the DM unstuck a party by grants alone (Vault door opened without a single puzzle solved). Suite now 52/52.
- **Phase 5: DONE (2026-07-10).** Hardening — (a) the **Realtime cold-start gap** is fixed app-side: `useSessionState` now schedules a second reconcile ~5s after every `SUBSCRIBED` (on top of the immediate one), sweeping up events the service silently drops before its change-feed worker starts consuming; also covers flaky-wifi reconnects on phones. Acceptance met as specified: two consecutive `supabase db reset` + `docker restart supabase_realtime_lirafell_workshop` + immediate `verify:realtime` runs both passed 52/52 — the "rerun the suite after a fresh start" ritual is gone (Gotcha #0 in the verify skill rewritten accordingly; its return is the regression signal). (b) Responsive/mobile layout pass: narrow-viewport spacing, 44px touch targets under `pointer: coarse`, hotspot tap areas expanded to ≥44×44 via an invisible `::before` (smallest hotspots were ~7px on a phone), dial grid wraps two-up, default blue tap-highlight suppressed in favor of the hotspot glow. New committed driver `pnpm verify:mobile` (13 checks on an emulated iPhone 13, incl. tap-driving the valve puzzle and the DM console from a phone-created session). Full a11y pass stays deferred beyond v1.

Explicitly deferred beyond v1 (per user decision): commissioned art/animation, audio, telemetry, full accessibility pass, randomized/seeded puzzles, branching outcomes, expert difficulty tier.

## Reference

Two of these are gitignored local reference material, not repo content — restore them by hand at the repo root when picking the project up on a new machine. `silent_forge*.html` in particular is deliberately never committed: it has every puzzle answer in plaintext, and answers must stay confined to the Supabase RPCs.

- Approved plan: `plans/this-file-contains-the-purrfect-harbor.md` *(gitignored)*
- PoC source of truth: `silent_forge(1).html` at the repo root *(gitignored)* — the complete Stage 1+2 version, use this one, not the shorter `silent_forge.html`
- **Project verify skill: `.claude/skills/verify/SKILL.md`** — read this before re-verifying anything; it has the exact commands, the per-OS environment notes, and the realtime-publication gotcha
- Original design retrospective: `silent_forge_summary.md` (tracked, in this repo)
