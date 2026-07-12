# Deploying Silent Forge

The app is a static Vite SPA (`apps/web`) backed by a hosted Supabase project.
There is **no server to run** — Netlify serves the built bundle, and the browser
talks to Supabase directly over HTTPS + websockets.

Deploy order matters: **set up Supabase first** (you need its URL + anon key to
configure the Netlify build).

---

## Part 1 — Supabase (hosted)

### 1. Create the project
1. Go to <https://supabase.com/dashboard> → **New project**.
2. Pick an org, name it (e.g. `silent-forge`), set a strong DB password (save it),
   choose a region close to your players.
3. Wait for provisioning (~2 min).

### 2. Grab your credentials
Dashboard → **Project Settings → API**:
- **Project URL** → this is `VITE_SUPABASE_URL` (e.g. `https://abcd1234.supabase.co`)
- **Project API keys → `anon` `public`** → this is `VITE_SUPABASE_ANON_KEY`

The anon key is safe to ship in the client bundle — Row Level Security is what
protects your data, not the key's secrecy. Never put the `service_role` key in
the frontend.

### 3. Link the CLI and push migrations
All schema, RPCs, and realtime setup live in `supabase/migrations/`. Push them to
the hosted DB:

```bash
# One-time: install + log in (if not already)
brew install supabase/tap/supabase   # or: npx supabase
supabase login

# Link this repo to the hosted project (ref is in the dashboard URL / settings)
supabase link --project-ref <your-project-ref>

# Push all migrations to the hosted database
supabase db push
```

`supabase db push` applies every file in `supabase/migrations/` in order,
including `20260709181557_enable_realtime.sql`, which adds `players` and
`session_state` to the `supabase_realtime` publication. **Without this, realtime
sync silently sends nothing** — the DM never sees players join. Don't skip it.

### 4. Verify realtime is on
Dashboard → **Database → Replication** (or **Realtime**): confirm the
`supabase_realtime` publication lists `players` and `session_state`. Realtime is
enabled by default on new projects; if it isn't, toggle it on there.

### 5. Sanity-check the schema
Dashboard → **Table Editor**: you should see the game tables. Dashboard →
**Database → Functions**: you should see the RPCs (`join_session`, etc.). If
RLS policies from the migrations are in place, anonymous play will work with just
the anon key.

---

## Part 2 — Netlify

The repo already contains `netlify.toml` with the build command, publish dir,
Node version, and SPA fallback — so most of this is just clicking through.

### 1. Connect the repo
1. <https://app.netlify.com> → **Add new site → Import an existing project**.
2. Authorize GitHub and pick this repo.
3. Netlify reads `netlify.toml`, so build command / publish dir / Node version
   are pre-filled. Don't override them.

### 2. Set environment variables
Site configuration → **Environment variables** → add:

| Key | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the `anon` `public` key |

These are **build-time** vars (Vite inlines `import.meta.env.*` into the bundle),
so any change requires a redeploy to take effect.

### 3. Deploy
Trigger the first deploy (automatic on connect, or **Deploys → Trigger deploy**).
Watch the log for a clean `pnpm --filter @silent-forge/web build`. Netlify uses
corepack to honor `packageManager: pnpm@11.3.0` — no pnpm config needed.

### 4. Verify the live site
- Open the Netlify URL → you should land on the Join page (base URL routes there).
- Hard-refresh a deep link like `/dm` → it should load, not 404 (proves the SPA
  redirect works).
- Open the DM view and a player view in two browsers/devices → a join in one
  should appear in the other within a second (proves Supabase realtime works
  end-to-end against the hosted DB).

### 5. Custom domain (optional)
Domain management → add your domain, follow the DNS instructions. Netlify
provisions HTTPS automatically.

---

## Updating later
- **Frontend / gameplay change:** push to the connected branch → Netlify
  auto-builds and deploys. PRs get preview deploys automatically.
- **DB / schema change:** add a new migration file, then `supabase db push`.
  Migrations are append-only — never edit an already-pushed file.
- **Changed a Supabase env value:** update it in Netlify and redeploy (build-time).

## CORS / allowed origins
Supabase's Data API and Realtime allow all origins by default, so the Netlify
domain works out of the box. If you later lock down auth redirect URLs
(Authentication → URL Configuration), add your Netlify domain there.
