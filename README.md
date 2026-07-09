# The Silent Forge

An interactive, multi-device web-based D&D subquest. Players join a shared session from their own phones/tablets; a DM screen shows live party state. See [`silent_forge_summary.md`](silent_forge_summary.md) for the design background and [`NEXT_STEPS.md`](NEXT_STEPS.md) for current build status.

## Stack

- **Frontend:** React + TypeScript + Vite, SVG scene art (`apps/web`)
- **Content:** Zod-validated scene/puzzle definitions, no puzzle answers included (`packages/content`)
- **Backend:** Supabase (Postgres + Realtime + Auth) — session state synced live across devices via Postgres Changes; puzzle answers live only in server-side RPCs (`supabase/`)

## Prerequisites

You need: **Node.js 22+** (verified on 22 and 26), **pnpm 10+** (verified on 10 and 11), a **container runtime**, and the **Supabase CLI**. Both macOS and Arch/CachyOS are actively used dev environments; setup differs by OS.

Don't reach for `corepack enable` to get pnpm — Node stopped bundling `corepack` as of Node 25, and some distro Node packages omitted it before that. Install pnpm directly, as below.

### macOS

```bash
brew install node pnpm supabase/tap/supabase

# Container runtime -- pick one:
brew install docker colima && colima start --cpu 4 --memory 8   # lightweight, CLI-only
# brew install --cask docker    # Docker Desktop; launch it once from Applications
# brew install --cask orbstack  # OrbStack
```

Under **Colima**, plain `supabase start` fails: Supabase's `vector` log-collector container bind-mounts the docker socket, which Colima's host-side socket doesn't support (the error mentions `docker.sock` and `operation not supported`). Migrations apply cleanly first — only the container start fails. Either start without it:

```bash
supabase start -x vector -x analytics   # you lose only Studio's log viewer
```

or fix it once so plain `supabase start` works:

```bash
sudo ln -sf ~/.colima/default/docker.sock /var/run/docker.sock
```

Docker Desktop and OrbStack don't have this problem.

### Linux

```bash
# Node -- use your distro's package manager or nvm (https://github.com/nvm-sh/nvm)
sudo pacman -S nodejs-lts-jod npm        # Arch/CachyOS
# sudo apt install nodejs npm            # Debian/Ubuntu

# pnpm
sudo pacman -S pnpm         # Arch
# npm install -g pnpm       # any distro

# Docker Engine
sudo pacman -S docker              # Arch; use your distro's package manager otherwise
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"    # then log out/in (or `newgrp docker`) for group membership to apply
# already-open shells can use `sg docker -c "supabase start"` as a workaround

# Supabase CLI -- no official apt/dnf/pacman package; grab the release binary directly
# (the Arch AUR package `supabase-bin` was broken as of this writing -- missing its
# companion `supabase-go` binary -- so this is the reliable path on Linux)
mkdir -p "$HOME/.local/share/supabase"
curl -fsSL https://github.com/supabase/cli/releases/download/v2.109.1/supabase_2.109.1_linux_amd64.tar.gz \
  | tar -xzf - -C "$HOME/.local/share/supabase"
mkdir -p "$HOME/.local/bin"
ln -sf "$HOME/.local/share/supabase/supabase" "$HOME/.local/bin/supabase"
ln -sf "$HOME/.local/share/supabase/supabase-go" "$HOME/.local/bin/supabase-go"
# ensure ~/.local/bin is on your PATH (usually already is on most distros)
```

Verify everything landed:

```bash
node --version && pnpm --version && docker --version && supabase --version
```

## Setup

```bash
git clone https://github.com/cheloizaguirre/lirafell_silent_forge.git
cd lirafell_silent_forge
pnpm install

# start local Supabase (Postgres + Auth + Realtime, via Docker) --
# first run pulls several images, can take a few minutes
supabase start
# on macOS + Colima this fails on the `vector` container -- see Prerequisites above
```

`supabase start` prints an `API_URL` and `ANON_KEY` at the end. Copy the env template and fill them in:

```bash
cp apps/web/.env.local.example apps/web/.env.local
# edit apps/web/.env.local with the API_URL / ANON_KEY from the output above
```

Then run the app:

```bash
pnpm dev
```

Open `http://localhost:5173` in two different browsers (or a normal + incognito window — they need separate storage to act as separate devices) to try the multi-device flow: create a session as DM in one, join with the printed code in the other.

## Useful commands

```bash
pnpm validate:content   # validate all scene/puzzle content against the Zod schemas
supabase status         # show local Supabase URLs/keys again without restarting
supabase db reset        # reapply all migrations from scratch (local only, destructive to local data)
supabase stop            # stop the local Supabase Docker stack
```

See [`.claude/skills/verify/SKILL.md`](.claude/skills/verify/SKILL.md) for how this was verified end-to-end (browser-driven, multi-device realtime sync) and a gotcha worth knowing before debugging realtime sync issues.

## Project structure

```
apps/web/            React + TS SPA -- players and DM, route-gated
packages/content/     Zod schemas + scene/puzzle content (no puzzle answers)
supabase/             Postgres migrations, RLS policies, RPCs (puzzle answers live here only)
```

## Status & roadmap

See [`NEXT_STEPS.md`](NEXT_STEPS.md) for exactly what's built vs. outstanding, and the approved implementation plan for the full phased roadmap.

## License

This repo is dual-licensed:

- **Code** (application, schemas, database migrations/tooling) — [MIT](LICENSE).
- **Creative content** (the quest's story, room/puzzle text, flavor text — `silent_forge_summary.md`, `packages/content/src/data/`) — [CC BY-NC-SA 4.0](LICENSE-CONTENT). Run it at your table, remix it, just don't sell it, and share alike.
