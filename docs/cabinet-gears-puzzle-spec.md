# Puzzle spec — The Master Gearlock (locked-cabinet capstone)

Status: **spec, not built** (rev 2, 2026-07-13). This is the deferred
"locked-cabinet harder puzzle" from `NEXT_STEPS.md`, designed as an **optional
capstone** in the Archive. It reuses the existing `ordered-sequence` puzzle kind
and the `dm_grant_item` grant pattern, adds **one small generic engine feature**
(flag-gated sequence items — `requiresFlag`/`lockedLabel`, reusable beyond this
puzzle), and adds **four small scene-art additions** (a hidden symbol tucked into
each of four room backgrounds). The original "no scene changes" scope is
deliberately relaxed: the clue *lives* in the rooms now, which is what ties the
puzzle to them.

New player-facing prose below is content (CC BY-NC-SA 4.0, like the rest of
`packages/content`). Answers stay server-only (`submit_puzzle_attempt` +
`dm_get_solutions`), per the standing invariant.

## Two hard constraints (from the brief)

1. **Nothing in-game may say where the fifth gear comes from.** No "the Warden
   has it," no hint of the offline encounter, anywhere a player can read. The
   fifth gear is simply *missing*, then simply *present* once the DM grants it.
   The trigger (an offline Warden fight) is DM knowledge only — see "DM flow."
2. **The reward is vague and mysterious, narrated by the DM offline.** The
   game opens the cabinet and stops at the threshold; it never names what's
   inside. Solving sets a flag; it grants no item and prints no contents.

## The idea — a capstone read from the whole building

The Archive's `locked-cabinet` hotspot already exists and is already "sealed
with a gear-shaped lock" ([scenes.ts:589](../packages/content/src/data/scenes.ts)).
That lock **is** the puzzle: a five-gear train. Four gears are engraved with a
**simple symbol** (in the style of the lens sigils — ☉ and friends); the fifth,
central gear is **blank**. The mechanism is dead until every gear is seated in
the right order.

The order is not written anywhere on the cabinet. **Each of the four symbols is
hidden, un-hotspotted, in the background art of the room it belongs to** — you
only find them by *looking*. And in the room, the symbol is **ringed by a number
of dots**: that dot count is the gear's slot. The gears themselves show the bare
symbol with **no dots** — so the lock tells you *which* symbols, and the rooms
tell you *in what order*.

It's a real observation puzzle and a real capstone: you can't solve it without
having walked every room with your eyes open.

## The five gears

The four symbol-gears are **already in the cabinet** — visible once it can be
opened. They are *not* items collected from rooms (no inventory plumbing); the
connection is the shared symbol. The keystone is the only external dependency.

| id (in `p_value.sequence`) | label | symbol on the gear | hidden in room |
| --- | --- | --- | --- |
| `bellows` | Bellows Gear | a **valve cross** (⊹) | Workshop |
| `beam` | Lantern Gear | the **sun** (☉) | Spire |
| `watcher` | Watcher Gear | an **eye** (◉) | Gallery |
| `ash` | Ashfall Gear | a **flame / triangle** (△) | Archive |
| `keystone` | Keystone Gear | **blank — no symbol** | — (DM-granted; no in-game origin) |

Symbols are representative glyphs; the pixel art draws each as a small, distinct
mark (see "Scene changes"). Pick four that are visually unambiguous at 160×100.

## The clue — symbols in the rooms, ordered by dots

Each room hides its gear's symbol in the background, **ringed by N dots**, where
**N is that gear's slot** (1 = first placed). The blank keystone has no symbol
and no dots; it takes the one remaining slot (5th) by elimination.

| room | symbol | dots around it | → slot |
| --- | --- | --- | --- |
| Workshop | valve cross ⊹ | 1 | 1 |
| Spire | sun ☉ | 2 | 2 |
| Gallery | eye ◉ | 3 | 3 |
| Archive | flame △ | 4 | 4 |
| — (keystone, blank) | — | — | 5 |

The dot counts are deliberately **scrambled** relative to the order players visit
rooms, so the answer can't be guessed from progression — you have to actually
find and count. Retune freely (see "Tuning knobs"); just keep them 1–4 and
distinct, and keep the two files in sync.

## The answer

Correct order (top slot → bottom slot), sorted by dot count with the blank
keystone last:

```
["workshop", "spire", "gallery", "archive", "keystone"]
```

Answer lives only in `submit_puzzle_attempt` and `dm_get_solutions`.

## Hotspot state machine (`locked-cabinet`, Archive)

Replaces the current single flavor `showText`. **Two states** — the keystone
distinction lives *inside* the puzzle (a locked fifth tile), not on the hotspot.
Uses the existing `when` conditions — no schema change. Note the cabinet gives
**no order clue itself**; the clue is out in the rooms.

- **Unsolved (`cabinetOpened` unset):** clicking runs `openPuzzle:
  "cabinet-gears"` — the lock always opens. The four symbol-gears are pickable;
  the fifth (keystone) tile is present but **disabled and relabeled "▢ —
  missing"** until `keystoneFound` (see "Puzzle UI"). Because `sequenceLength`
  is 5 and the fifth can't be picked until granted, players can *explore and
  pre-arrange* the four they understand but can't complete it early. The prompt
  carries the flavor; no separate intro `showText` needed.
- **Solved (`cabinetOpened` set):** clicking shows the aftermath flavor (below),
  re-readable; the puzzle does not reopen.

The server still refuses a keystone-less submit (`the mechanism is incomplete`,
below) as a backstop — the disabled tile is UX, not the security boundary.

## The reward (vague, DM-narrated)

`solvedText` — stops at the threshold, names nothing:

> *Five gears bite as one. The train spins up with a deep, resonant hum you feel
> in your teeth, and the cabinet's iron face folds slowly open. Cold, still air
> breathes out of the dark inside, and something within catches the light. It
> has been waiting a long time.*

Solving sets party flag **`cabinetOpened`** (for DM-console display / bragging
rights) and **grants no item, prints no contents**. The DM describes what the
party finds, live at the table.

State-3 re-read flavor:

> *The cabinet stands open. Whatever it held is in your hands now, or your
> heads.*

## Puzzle content (`packages/content/src/data/puzzles.ts`)

Append one `ordered-sequence` puzzle. `sequenceLength: 5` = all five gears used
(unlike `archive-books`, which uses 3 of 4). The `prompt` gives a *light* nudge
toward the mechanic (symbols seen elsewhere, something ringed them) without
spelling out "dots = order":

```ts
{
  kind: "ordered-sequence",
  id: "cabinet-gears",
  sceneId: "archive",
  title: "The Master Gearlock",
  // Order is nowhere on the cabinet. Each symbol is hidden in the room it
  // belongs to, ringed by a count of dots = its slot; the blank crown takes
  // the leftover slot. Answer lives in the RPC.
  prompt:
    "Four gears sit in the lock, each etched with a small symbol, and a blank crown belongs at their heart. You have seen each of these marks somewhere in these halls, and something ringed every one of them — all but the crown, which was ringed by nothing and has no place of its own.",
  onFailNoise: 30,
  wrongText:
    "The train jams with a shriek of tortured metal and kicks back — that was LOUD. The gears reset to their resting teeth.",
  solvedText:
    "Five gears bite as one. The train spins up with a deep, resonant hum you feel in your teeth, and the cabinet's iron face folds slowly open. Cold, still air breathes out of the dark inside, and something within catches the light. It has been waiting a long time.",
  items: [
    { id: "gallery", label: "◉ Gear" },
    { id: "workshop", label: "⊹ Gear" },
    { id: "archive", label: "△ Gear" },
    { id: "spire", label: "☉ Gear" },
    // Locked until the DM grants it: shown as a disabled "▢ — missing" tile
    // (lockedLabel) until flags.keystoneFound is set, then it becomes pickable
    // under its real label.
    { id: "keystone", label: "◇ Gear", requiresFlag: "keystoneFound", lockedLabel: "▢ — missing" },
  ],
  sequenceLength: 5,
}
```

The `items` array order is just the palette of choices shown; it is **not** the
answer.

### Puzzle UI — the locked fifth tile (generic, content-driven)

Rather than special-casing `keystone` in TypeScript, add two optional fields to
the ordered-sequence item schema (`packages/content/src/schema/puzzle.ts`) so any
future sequence puzzle can gate a choice:

- `requiresFlag?: string` — the party flag that must be truthy for this item to
  be pickable.
- `lockedLabel?: string` — the label to show while it's locked (defaults to the
  normal label if omitted).

`OrderedSequencePuzzle` then needs the current party flags. It already renders
inside `PlayPage`, which holds `sessionState.flags`
([PlayPage.tsx](../apps/web/src/routes/PlayPage.tsx)) — pass them in as a
`flags` prop (the other sequence puzzle, `archive-books`, simply carries no
`requiresFlag` items and is unaffected). In the `items.map`, an item whose
`requiresFlag` is unmet renders **`disabled`** with its `lockedLabel`; everything
else is unchanged. With `sequenceLength: 5` and the keystone unpickable, the
submit branch never fires until the grant lands — no extra "block submit" logic.

Engraving each item's symbol on its `ItemSpritePixel` tile (or the button) lets
players match gear→room by sight.

## Scene changes — the hidden symbols (four pixel scenes)

Each of the four rooms gets one small symbol drawn into its 160×100 buffer,
**ringed by its dot count**, with **no hotspot and no interactivity** — pure
decoration a paying-attention player can spot. No schema, no flags, no state:
these are just pixels. Keep them **low-contrast but not sub-pixel** — drawn in a
near-background palette tone (e.g. `PAL.steelDark` on stone, a mortar tone in a
seam) so they read as "hidden," not invisible. An observant player at the table
must be able to find them; don't bury them under one pixel of contrast.

| file | symbol | dots | suggested hiding spot (art director's call) |
| --- | --- | --- | --- |
| `WorkshopArtPixel.tsx` | valve cross ⊹ | 1 | stamped on a pipe elbow or the pressure-gauge face |
| `SpireArtPixel.tsx` | sun ☉ | 2 | etched on the stairwell wall near the beam aperture |
| `GalleryArtPixel.tsx` | eye ◉ | 3 | in the mortar backing between two display cases, or a nameplate |
| `ArchiveArtPixel.tsx` | flame △ | 4 | burned into a spine on the upper shelf, or on the lamp base |

Drawing approach: a tiny `drawGlyph`-style helper per symbol (a handful of `set`
/ `disc` / `ring` calls), then place the dots as single `set` pixels evenly
around it. `dungeonKit.ts` already retired `drawDigits` but kept it — a small
`drawGlyph`/`drawDots` pair belongs there too, reusable across the four scenes.
The gears' engravings (in the puzzle UI / `ItemSpritePixel`) draw the **same
glyph with no surrounding dots** — that visual identity is how players match.

The blank keystone has no room and no symbol — nothing to hide.

## Server changes — one new migration `20260713xxxxxx_cabinet_gears.sql`

Three edits, all following existing patterns.

### 1. Gate + validate in `submit_puzzle_attempt` (`create or replace`)

Add a branch, structured exactly like the `archive-lens` dormancy gate:

```sql
elsif p_puzzle_id = 'cabinet-gears' then
  -- Gate: the mechanism is incomplete without the crown gear (DM grant).
  -- Mirrors the 'lens is dormant' check; the reason string never mentions
  -- where the gear comes from.
  if not exists (
    select 1 from session_state
      where session_id = p_session_id
        and coalesce((flags ->> 'keystoneFound')::boolean, false)
  ) then
    raise exception 'the mechanism is incomplete';
  end if;
  v_correct := (p_value -> 'sequence')
    = '["workshop","spire","gallery","archive","keystone"]'::jsonb;
  v_grant_item := null;          -- reward is DM-narrated, no item
  v_grant_flag := 'cabinetOpened';
  v_fail_noise := 30;            -- wrong arrangement is loud, like the others
```

The existing success branch already does `jsonb_set(flags, [v_grant_flag],
'true')` with a null item — no other change needed.

### 2. Extend `dm_grant_item` allowlist to include the keystone

```sql
-- was: if p_item_id not in ('heart', 'lens', 'valve') then
if p_item_id not in ('heart', 'lens', 'valve', 'keystone') then
```

`dm_grant_item('keystone')` then adds `keystone` to inventory and sets
`flags.keystoneFound = true` automatically (it writes `p_item_id || 'Found'`) —
which is exactly the gate flag State 2 and the server check read. One grant, no
new RPC.

### 3. Add the cabinet row to `dm_get_solutions` (`create or replace`)

```
puzzle: "cabinet-gears"
solution: "Workshop(1) -> Spire(2) -> Gallery(3) -> Archive(4) -> Keystone"
note: "Order = dots ringing each room's hidden symbol (Workshop ⊹ 1, Spire ☉ 2,
       Gallery ◉ 3, Archive △ 4); blank keystone last. Grant the Keystone Gear
       once the party has earned it. Reward is yours to narrate."
```

The `note` is DM-facing. Keep the solution string in sync with the RPC — these
two files remain the only places answers live.

## Client changes (`apps/web`)

- **Inventory label + sprite** for item id `keystone` ("Keystone Gear") wherever
  the other three (`heart`/`lens`/`valve`) are mapped, incl. an `ItemSpritePixel`
  case. (The four symbol-gears are puzzle-content items, not inventory — only the
  granted keystone lands in inventory.)
- **Gear tiles** in the puzzle UI: render each gear's symbol (bare, no dots) so
  players can match it to the room symbol they found; the keystone tile shows its
  `lockedLabel` and is `disabled` until `keystoneFound` (see "Puzzle UI").
- **`OrderedSequencePuzzle` gets a `flags` prop** from `PlayPage`, plus the
  generic `requiresFlag`/`lockedLabel` handling — the only engine-side change.
- **DM Overrides panel** (`DmPage.tsx`): add a **"Grant Keystone Gear"** button
  next to the existing grant-item buttons, calling the same grant flow with id
  `keystone`, disabled once `flags.keystoneFound` is set. Label it neutrally —
  no "Warden."
- **Archive art** (`ArchiveArtPixel.tsx`, optional polish): show the cabinet's
  five-spindle lock, the bare center spindle until `keystoneFound`, and an open
  state on `cabinetOpened`. Add a `data-` attr (e.g. `data-cabinet="open"`) for
  the verify script, mirroring `VaultArt`'s `data-converge`/`data-lit`.

## DM flow (out-of-band trigger)

The Overrides panel gets one button: **Grant Keystone Gear**. The DM clicks it
when the party has earned the missing gear — the intended trigger is an **offline
Warden encounter run at the table**, but that is entirely the DM's call and is
*never surfaced to players*. Mechanically it's identical to the existing
grant-item overrides: role-gated, idempotent, sets `keystoneFound` — which
un-disables the fifth tile in the puzzle.

## Verify additions (`pnpm verify:realtime`)

Add a capstone leg after the convergence:

1. Assert the fifth gear is locked before the grant — the puzzle opens with the
   keystone tile `disabled` (`▢ — missing`), and a direct
   `submit_puzzle_attempt('cabinet-gears', …)` is refused server-side
   (`the mechanism is incomplete`).
2. DM grants the keystone; assert `keystoneFound` propagates over realtime, the
   keystone tile un-disables, and the "Grant Keystone Gear" button disables.
3. Submit a **wrong** order → `correct:false`, party noise +30 (BANG).
4. Submit `["workshop","spire","gallery","archive","keystone"]` → `correct:true`,
   `cabinetOpened` set, cabinet renders open.
5. Assert `dm_get_solutions` returns the cabinet solution string (the
   answers-only-in-RPC assertion, like the others).

Optionally assert each of the four hidden symbols renders in its scene buffer
(if you expose a test hook), but they carry no state so a pixel check is enough.
Does **not** gate `won` — the convergence keeps victory. This is a secret, not a
requirement.

## Tuning knobs

- **Retune the dot→slot mapping** — any permutation of 1–4 across the four rooms
  works; change the answer string + `dm_get_solutions` together. Scrambled vs.
  visit-order is the main difficulty lever.
- **Strip the prompt nudge** — drop the "something ringed every one of them" line
  so players must discover that the dots mean anything. Hardest version.
- **Hide the symbols harder or softer** — the contrast of the room glyphs is the
  real difficulty dial; err toward findable (a stuck party has no fallback clue
  but the DM cheat-sheet).
- **Keystone position** — it's last by the "leftover slot" rule; if you'd rather
  the earned gear be the drive, make it slot 1 and shift the dot counts to 2–5.

## Decisions worth not re-litigating

- **Symbol distinctness.** The four room glyphs (⊹ ☉ ◉ △) plus the keystone (◇)
  must be mutually distinct **and** readable apart from the lens dial sigils
  (`✦ ☾ ☉ ◈ ⚙`) at 160×100. Two deliberate overlaps: the Spire gear reuses **☉**
  as a *callback to the lens puzzle's answer* — keep it, don't "fix" it; and the
  keystone **◇** is close to the lens **◈**, so draw them clearly different (the
  keystone is blank/hollow, no dots). Final glyphs are the art director's call;
  these are just the placeholders the rest of the doc names.
- **The cabinet is openable from the start** (no game-progress gate) — a party
  can inspect the four gears and the locked crown slot before doing anything
  else. That's intended foreshadowing, not a bug.
- **Wrong answers still cost +30 noise** even though this is usually attempted
  post-`won`, where noise is largely moot. Left consistent with the other
  puzzles rather than special-cased.
- **The keystone is an inventory item as a side effect** of `dm_grant_item`
  (which always writes item + `${id}Found` flag). The puzzle only reads the
  `keystoneFound` flag; the inventory entry is just a nice "you hold it" signal.

## Implementation checklist (exact files)

Content (`packages/content`):
- [ ] `src/schema/puzzle.ts` — extend `OrderedSequencePuzzleSchema.items`
      (lines ~54–61) with `requiresFlag: z.string().optional()` and
      `lockedLabel: z.string().optional()`.
- [ ] `src/data/puzzles.ts` — append the `cabinet-gears` puzzle (block above).

Engine / UI (`apps/web`):
- [ ] `src/engine/puzzles/OrderedSequencePuzzle.tsx` — accept a `flags` prop;
      render an item whose `requiresFlag` is unmet as `disabled` with its
      `lockedLabel`.
- [ ] `src/routes/PlayPage.tsx` — pass `sessionState.flags` into the puzzle.
- [ ] `src/scenes/pixel/ItemSpritePixel.tsx` — add a `keystone` sprite entry
      (id-keyed map, alongside `heart`/`lens`/`valve`), label "Keystone Gear".
- [ ] `src/routes/DmPage.tsx` — "Grant Keystone Gear" button (reuse the
      grant-item flow with id `keystone`), disabled once `flags.keystoneFound`.

Scenes (`apps/web/src/scenes/pixel`):
- [ ] `dungeonKit.ts` — small reusable `drawGlyph` + `drawDots` helpers.
- [ ] Hide the symbol + dots in `WorkshopArtPixel` (⊹×1), `SpireArtPixel`
      (☉×2), `GalleryArtPixel` (◉×3), `ArchiveArtPixel` (△×4).
- [ ] `ArchiveArtPixel.tsx` — the cabinet's five-spindle lock (bare center until
      `keystoneFound`, open on `cabinetOpened`), + `data-cabinet` for verify.
- [ ] `scenes.ts` — rework the `locked-cabinet` hotspot to the two-state machine
      (openPuzzle until `cabinetOpened`, aftermath `showText` after).

Server (`supabase/migrations`):
- [ ] New `20260713xxxxxx_cabinet_gears.sql`: the `submit_puzzle_attempt` branch
      (gate + answer), the `dm_grant_item` allowlist add, and the
      `dm_get_solutions` row. Answer string in **exactly** these two RPCs.
- [ ] Apply locally (`supabase db reset` — wipes the running session) **and push
      to the live hosted DB (`supabase db push`)**, since the deploy is now live.

Tests:
- [ ] Extend `pnpm verify:realtime` with the capstone leg (above).
- [ ] Content still validates (`pnpm --filter @silent-forge/content` typecheck /
      the zod parse) after the schema extension.
