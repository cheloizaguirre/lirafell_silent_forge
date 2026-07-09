# The Silent Forge — PoC Summary & Advancement Roadmap

*The creative content in this document (setting, story, puzzle design) is licensed CC BY-NC-SA 4.0 -- see [LICENSE-CONTENT](LICENSE-CONTENT).*

## 1. Concept Overview

**Setting:** The abandoned atelier of Master Artificer Brakka, a gothic arcane-tech workshop sealed for centuries.

**Goal:** The party must deactivate an anti-aether field — a defensive ward Voss left running that blocks all spellcasting and forces automatic failure on all dice rolls. All puzzles must therefore be solved through pure observation and logic; no character build, roll, or spell can shortcut them.

**Threat, not death:** The workshop is patrolled by an invincible steam-golem ("the Warden"). It is drawn by noise, not by sight or proximity. Getting caught never kills or maims the party — it sends them to a holding cell with a light, no-real-risk escape puzzle, so failure costs time and tension, not characters.

**Session shape:** Designed to run inside a single D&D session, structured as a two-stage escalation:
- **Stage 1 — Collection:** recover three "resonance components," each behind a self-contained puzzle in its own room.
- **Stage 2 — Convergence:** once all three are placed in the vault, a fourth room unlocks, and finishing the quest requires coordinated actions split across three separate rooms — the first point in the quest that can't be solved by one person alone in one place.

## 2. Current PoC Implementation

- **Format:** a single self-contained HTML file (`silent_forge.html`) — no build step, no server, no dependencies beyond a Google Fonts CDN link. Runs by opening the file in any browser.
- **Rendering:** hand-authored inline SVG per scene (muted gothic silhouettes, violet `#8b5fbf`/`#c9a3ff` accent for anything interactive or arcane), redrawn on every state change.
- **Interaction model:** absolutely-positioned HTML `<div>` hotspots overlaid on the SVG, each bound to a plain `onclick` handler. No drag-and-drop, no typed input — pure point-and-click, matching the Night Manor-style reference.
- **State:** one in-memory JS object (`state`) holding current scene, inventory, a flags map, puzzle-specific working state (valve positions, book-click order, etc.), and a 0–100 "noise" meter. Nothing persists across a page reload.
- **Engine shape:** each scene is a `render<SceneName>()` function that (a) writes an SVG string based on current flags, and (b) rebuilds the hotspot layer with fresh click handlers. A single dispatch map (`render()`) selects which to call. This is a hand-rolled, ad hoc scene graph — functional for 7 scenes, but not something that scales cleanly much further.

## 3. Content Inventory

| Scene | Role | Key mechanic |
|---|---|---|
| Entrance Hall | Intro / briefing | Lore note explains the noise rule and the Warden; no risk |
| Workshop Floor | Hub | Connects to all other rooms; houses the Medium puzzle and (later) the overflow valve |
| Archive / Study | Component room | Hard puzzle (cipher); Memory Lens gives bonus lore; later houses the beam-alignment task |
| Gallery of Automatons | Component room | Easy puzzle (elimination) |
| Vault Antechamber | Assembly point | Stage 1 completion (place 3 components) and Stage 2 completion (Activate the Convergence) |
| The Aether Spire | Stage 2 room | Unlocks only after all 3 components are placed; arming it is loud and starts the cross-room finale |
| Prison Cell | Soft fail-state | Reached automatically at 100% noise; trivial escape puzzle, resets noise, returns party to the Workshop |

**Puzzle difficulty tiers (tuned for an engineering/software audience):**
- **Easy — Gallery:** identify the one automaton described as "the one who never sang" among five; the other four are noise-triggering decoys. Single-step elimination.
- **Medium — Workshop:** a gear-train problem (teeth counts + one given RPM across four meshed gears; N₁T₁ = N₂T₂). Party computes the RPM chain (24→16→40→12) and sets four valves to the ones-digit of each stage (4, 6, 0, 2).
- **Hard — Archive:** a Caesar-cipher inscription (`YLROHW WKHQ DVK WKHQ HPEHU`, shift 3 → "VIOLET THEN ASH THEN EMBER"), with the shift value given only indirectly via a separate in-room object. Requires manual decryption before the in-app action (clicking three of four books in order) can be attempted.

**Items:** Cogwork Heart, Aether Lens, Pressure Valve Key — each gated behind one of the puzzles above and required to reach Stage 2.

**Stage 2 cross-room requirements:** arm the Spire (loud, adds noise), vent the new Workshop overflow valve, and align the Archive lens to the symbol the Spire's dial locked onto — all three must be true before the Vault's "Activate the Convergence" hotspot succeeds.

## 4. What the PoC Deliberately Does Not Solve

This was built to validate the *design*, not to be production infrastructure. Known gaps, by category:

**Architecture**
- Content (room text, puzzle answers, hotspot coordinates) is hardcoded directly into JS template strings, mixed with rendering and game logic. There's no separation between "data" and "engine."
- No persistence layer — refreshing the page loses all progress. There's no save/resume, and no way to pick the quest back up mid-session if a table needs to stop.
- Single shared state object assumes one screen for the whole table. There's no concept of multiple connected clients, so it doesn't support players using their own devices.
- Puzzle answers are fixed constants (`valveTarget`, `bookTarget`, `SPIRE_SYMBOL_INDEX`). Anyone who reads the page source sees every answer immediately.

**Content & Art**
- Scenes are minimal geometric SVG silhouettes — a placeholder aesthetic, not a finished art direction. There's no signature illustration work, no lighting/shadow rendering beyond a flat radial vignette, and no animation (the golem never visibly moves, for instance).
- No audio at all — no ambient tone, no stingers for noise events or capture, no UI sound feedback.
- All text is final-draft flavor writing, not modular/localizable content.

**Play Experience**
- No accessibility support: no keyboard navigation, no screen-reader labeling on hotspots, no colorblind-safe alternative to relying on the violet accent color for "this is interactive."
- No mobile-specific layout testing; the aspect-ratio SVG container was sized for a shared tablet/laptop screen, not phones.
- No DM-facing control panel — a real DM might want to peek at or override state (e.g., force-unlock a stuck puzzle, manually clear noise) without editing source.
- No telemetry: no way to know, across playtests, where groups actually get stuck, how long each puzzle takes, or how often the Prison Cell triggers.

## 5. Recommendations for the Next Implementation Pass

**Separate content from engine.** Move room text, hotspot geometry, puzzle targets, and dialogue into a JSON/YAML content file (or a small headless CMS) that a non-programmer can edit. The engine should be a generic interpreter over that data — "given this scene definition and this flag state, render these hotspots" — rather than one bespoke function per room.

**Pick a real rendering/state framework.** For the complexity this is already at (7 scenes, cross-room dependencies, a noise system), hand-rolled `innerHTML` string-building is close to its ceiling. Reasonable next steps:
- A lightweight component framework (React/Vue/Svelte) for scene and hotspot rendering, with the existing SVGs converted to real components.
- Or a 2D engine (Phaser, PixiJS) if the next version wants sprite-based art, particle effects (e.g. the violet "convergence" flourish), or actual golem movement/patrol animation.

**Support multi-device play.** If players should be able to interact from their own phones/tablets instead of crowding one screen, this needs a thin backend: a WebSocket or Firebase/Supabase realtime layer broadcasting shared state (scene, inventory, noise, flags) to all connected clients, with per-player cursors/labels so the DM can see who's doing what.

**Add persistence.** Server-side session storage (or, for a simpler v2, browser `IndexedDB`) so a table can close the laptop mid-session and resume exactly where they left off — this matters more than it might seem, since real sessions get interrupted.

**Randomize puzzle parameters.** Right now the gear teeth counts, the cipher shift, and the correct automaton are fixed constants. Parameterizing these (seeded per playthrough) would let the same quest structure be reused for multiple tables/campaigns without the answers being static or spoiler-able by reading source.

**Build a DM console.** A hidden, password-gated panel that shows the raw flag/state object and lets a DM force scene transitions, clear noise, or grant items — a practical safety valve for live play when a puzzle isn't landing.

**Invest in art and sound direction.** The current SVGs proved the interaction model; a production pass would want either commissioned illustration (matching the muted gothic-violet palette already established) or a consistent generative-art pipeline, plus a small ambient/SFX layer — this is likely the single highest-impact upgrade for player immersion.

**Add instrumentation.** Even simple event logging (puzzle attempt counts, time-to-solve, capture counts) would let future puzzle difficulty tuning be based on real playtest data instead of judgment calls.

**Accessibility pass.** Keyboard-navigable hotspots, ARIA labeling, and a non-color-dependent way to indicate interactivity (e.g., a subtle icon or outline style, not just the violet glow) would make this usable by a wider set of players.

## 6. Suggested v2 Stack (concrete starting point)

- **Frontend:** React (or Svelte) + TypeScript, Tailwind for UI chrome, SVG or Pixi/Phaser for scene rendering.
- **Content:** JSON scene/puzzle definitions, validated with a schema (Zod/JSON Schema) so bad content fails fast instead of breaking silently at runtime.
- **Backend (if multi-device/persistence is wanted):** Node + WebSocket (or Supabase/Firebase for less custom infra) for shared session state; Postgres/Firestore for save data.
- **Deployment:** static hosting (Vercel/Netlify) for the frontend; a small managed backend service if realtime sync is included. A PWA/service-worker wrapper would keep it usable if a table's venue has poor wifi.

## 7. Content Expansion Ideas (if the quest itself grows)

- Branching outcomes at the Vault finale (e.g., a "greedy" path that also steals an invention, changing later campaign hooks).
- A fourth puzzle tier ("expert") gated behind an optional room, for tables that finish early.
- Difficulty scaling knobs (e.g., simpler cipher shift for a mixed-experience table, harder gear-train variant with more stages for an all-engineer table) — straightforward once puzzle parameters are data-driven per Section 5.
