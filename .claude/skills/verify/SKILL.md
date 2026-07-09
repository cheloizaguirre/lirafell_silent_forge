---
name: verify
description: Drive Silent Forge end-to-end through a real browser (multi-device realtime sync included) instead of just curling the RPCs or trusting a clean build.
---

# Verifying Silent Forge

This is a multi-device realtime app -- a clean `tsc`/`vite build` proves nothing
about whether two browser tabs actually see each other's state. Drive it for
real.

Arch/CachyOS and macOS are both supported dev environments. The commands below
are the same on either; where they aren't, see [Environment notes](#environment-notes).

## 1. Start the backend

```bash
supabase start      # first run pulls images, can take a few min
# or, if already running:
supabase status
```

If you changed a migration: `supabase db reset` (reapplies all migrations from
scratch, fast, local only).

## 2. Start the frontend

```bash
cd apps/web && npx vite --port 5173 --strictPort
```

`apps/web/.env.local` must point at the local stack (`VITE_SUPABASE_URL=http://127.0.0.1:54321`
+ the anon key `supabase start` printed). `.env.local.example` has the shape.

## 3. Drive it with Playwright, two browser contexts

Two isolated `browser.newContext()`s (not two tabs in one context) is what
actually simulates two players on two different devices -- separate
localStorage means separate anonymous auth identities, matching real
multi-device play.

Chromium isn't installed by default. Get just the browser binary:

```bash
npx --yes playwright@1.49.1 install chromium   # no --with-deps
```

Skip `--with-deps`. Playwright only supports it on Debian/Ubuntu -- it shells
out to `apt`, and it's a confirmed failure on Arch. Neither Arch nor macOS
needs it anyway: the required system libraries are already present.

Minimal driver shape (see conversation history / git log for a fuller
example than this skeleton):

```js
import { chromium } from "playwright";
const browser = await chromium.launch();
const ctxA = await browser.newContext(); // e.g. the DM
const ctxB = await browser.newContext(); // e.g. a player
// pageA creates a session -> code; pageB joins via /join/<code>;
// assert pageA's DOM reflects pageB's actions (scene, noise, inventory)
// without pageA ever taking an action itself -- that's the actual claim
// multi-device sync is making.
```

## Gotcha that will burn an hour if you don't check it first

**Postgres Changes needs the table added to the `supabase_realtime`
publication -- RLS and GRANTs are necessary but not sufficient.** A
subscription can be `SUBSCRIBED` with zero errors and just never receive any
event, forever, silently. If two-tab sync hangs, check this before anything
else:

```bash
docker exec supabase_db_lirafell_workshop \
  psql -U postgres -d postgres \
  -c "select tablename from pg_publication_tables where pubname = 'supabase_realtime';"
```

Should list `players` and `session_state`. If empty, the fix is
`alter publication supabase_realtime add table <name>;` (+ `replica identity
full`) in a migration -- already done in
`supabase/migrations/20260709181557_enable_realtime.sql`, but re-check this
first if a *new* realtime-dependent table gets added later and sync mysteriously
doesn't work.

## Environment notes

Only reach for these if a command above misbehaves.

**Linux (Arch/CachyOS) -- `docker` group.** If your shell session predates being
added to the `docker` group, docker commands fail with a permission error.
Group membership doesn't apply to already-running shells. Either open a fresh
terminal, or wrap the command: `sg docker -c "supabase start"`.

**macOS (Colima) -- `supabase start` fails on the `vector` container.** Colima's
docker socket lives on the host filesystem, and Supabase's `vector` log
collector tries to bind-mount it, which isn't a supported mount source. The
error names `docker.sock` and `operation not supported`. Migrations will have
already applied cleanly -- only the container start fails. Either skip the
container (it's just Studio's log viewer; `analytics`/logflare depends on it,
so exclude both):

```bash
supabase start -x vector -x analytics
```

or fix it once at the machine level so plain `supabase start` works:

```bash
sudo ln -sf ~/.colima/default/docker.sock /var/run/docker.sock
```

Docker Desktop and OrbStack don't have this problem.

## What "done" looks like

A screenshot of the DM tab (which took zero actions) showing a second
player's live scene location, noise level, and inventory after that player
did something on their own tab -- with no reload on the DM tab. That's the
actual acceptance bar for anything realtime-related in this repo, not just
"the RPC returned 200."
