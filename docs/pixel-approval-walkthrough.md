# Approval walkthrough: the seven 8-bit scenes (feedback pass)

A single playthrough on the `proto-vault-8bit` branch that passes through
every scene and every flag-driven art state, updated for the 2026-07-11
feedback pass (docs/pixel_feedback.md). Play it straight — the route uses
real puzzle solves, one deliberate capture (now the *intended* way to learn
the valve code), and the DM console where the game actually needs a DM.
Tick the boxes as you go; anything that looks wrong, note the box and we
iterate on that scene.

## Setup

1. `supabase start` (or `supabase status` if already up), then
   `cd apps/web && npx vite --port 5173 --strictPort`.
2. Open **two browser windows**: one DM, one player.
   - DM: `http://localhost:5173`, enter a name, *Start a new quest*.
   - Player: `http://localhost:5173/join/<CODE>`, join.
3. The DM cheat sheet (expandable on the DM console) lists every answer if
   you lose this doc mid-run — including where each hidden clue is stashed.

**How to look at each scene** (applies everywhere, not repeated below):

- [ ] **Walking in prints a room description** (every entry, latest-message
      panel) — and where the room's state matters, the text tracks it.
- [ ] Idle for a second or two: everything alive animates on the shared
      flicker — except the Gallery's eyes, which pulse on a slower clock.
- [ ] Hover each hotspot: the highlight box should frame the art it names.
- [ ] The UI chrome around the canvas stays muted; only the scene art is
      saturated.
- [ ] Captions and rune labels are readable HTML chips with dark backing —
      and clue captions stay HIDDEN until someone finds the note.

## 1 · Entrance Hall (static — no flag states)

- [ ] Entry text sets the room: candle, slumped automaton, the great door.
- [ ] Great door: hover box now frames the whole arch (it used to hang low).
- [ ] Writing desk: hover box grown to cover desk + note + candle.
- [ ] Clicking the desk prints ONE merged message (the full note + "its
      warning still stands"), the same on every click — no more double print.
- [ ] Slumped colossus, aether lamp, pulsing eyes: unchanged from last pass.

## 2 · Workshop Floor (pre-solve state)

Enter via the Great Door.

- [ ] Entry text mentions the vault door, both doorways, and the Warden.
- [ ] The Dormant Warden stands clear of the archive doorway (shifted right).
- [ ] Pipe assembly runs at **knee height**, four brass valve wheels on it.
- [ ] **No engraved digits anywhere** — the plaque is gone; the valve prompt
      no longer states a code either.
- [ ] Vault door is a tall **room-door**: double doors, center seam, hinges,
      ring handles, threshold ledge. Hover box matches.
- [ ] Workbench sits clear of the gallery doorway (shifted left).
- [ ] No stairwell — it now belongs to the Vault.
- [ ] **DM console → Overrides → "Hide the Warden"**: the colossus and its
      hotspot vanish live on the player screen (alcove stays); entry text on
      re-entry calls the alcove empty. Toggle it back.

## 3 · Gallery of Automatons

Door to Gallery, right side of the Workshop.

**Unsolved:**

- [ ] Five distinct exhibits in wood-and-brass cases, dark interiors — the
      case-light halo is gone.
- [ ] The four alarmed automatons' ember eyes pulse **slowly** (1.8s), out of
      step with the torches.
- [ ] **No cipher caption anywhere** — the plaque is gone.
- [ ] Each case has a "Look behind the …'s case" strip along its plinth.
      Four of them: *"Nothing here but dust and cobwebs."*
- [ ] **Behind the hound's case**: a paper note reveals the Caesar cipher
      (**FYXPIV**, key = the 4 automatons whose eyes blink → shift back 4 →
      BUTLER) — the caption chip (*"a cipher — count the blinking eyes"*)
      appears for the whole party (check the second window).
- [ ] The *Examine the Automatons* prompt does NOT restate the answer.

**Wrong answer** — pick any non-butler:

- [ ] One big BANG (~1.2s); DM gauge +30.

**Solve** — pick *Silent Butler*:

- [ ] Solve text: the butler's chest panel opens and **you lift the Cogwork
      Heart out** (no more "it doesn't react" and nothing else).
- [ ] Close the modal: every eye dark, butler's panel hangs open and empty.

## 4 · Archive & Study

Back to Workshop, then Door to Archive (left side).

**Pre-solve:**

- [ ] **No order caption anywhere** until found.
- [ ] Two "Search the … shelf" hotspots on the upper shelves. Middle shelf:
      dust. **Top shelf**: the note — a burn-cycle haiku, *"Twilight-crowned,
      it flares / then sinks to pale grey stillness / one coal, still
      breathing."* (twilight flare = Violet, pale grey = Ash, one coal =
      Ember; the Black Tome is never named) — and the caption (*"a haiku hides
      on the shelf"*) appears party-wide.
- [ ] The tome prompt does NOT restate the order.
- [ ] Lens pedestal hover box covers ring + glass + pedestal.
- [ ] Clicking the lens prints ONE merged recording message, every click.
- [ ] Locked cabinet: still locked, still no key (its puzzle comes later).

**Wrong order** — try a wrong sequence first:

- [ ] The shelf **SLAMS** the tomes back: BANG on player screens, **+30** on
      the DM gauge (it used to be quiet).

**Solve** — Violet → Ash → Ember (skip the black decoy):

- [ ] Modal auto-closes on the third click; tomes settle two pixels lower.

## 5 · Getting caught (Workshop → Prison → the corridor loop)

Back to Workshop. Open *Pressure Valves* and deliberately fail — submit
wrong dials until the DM console shows the **Warden alert** (noise 100;
three fails at +30 each).

- [ ] Each fail: **one BANG per wrong dial** — leaving 0-0-0-0 gives three
      stacked BANGs (dial 2 is accidentally right). Mastermind players may
      notice; that's intended.
- [ ] Noise is flat +30 per fail regardless of the BANG count.
- [ ] Nobody moves automatically at 100 — the DM decides.

DM: *Send \<player\> to the cell.*

- [ ] Wake-up text on landing (first capture only — later cell entries get a
      neutral description).
- [ ] Beyond the bars: torch, moonlit window slit — and now **the guard's
      desk with the cell key**, a hand's width out of reach (hotspot says so).
- [ ] The cot is clickable: a nap would sound wonderful, etc.
- [ ] The grate sits **still** until you heave it — each heave rattles it
      for ~a second, then it settles.
- [ ] **Loose Brick** (low in the left wall), three heaves: the brick comes
      free. The note on the floor shows only **cramped, unreadable
      handwriting** (no pixel digits anymore); the real text is a
      breathing-drill ditty in the message — raise both arms (2), empty mind
      to nothing (0), one slow breath (1), pat back three times (3) → 2-0-1-3.
      A caption chip (*"behind the brick: a breathing-drill note"*) pins it to
      the scene — party-wide.

Heave the *Loose Floor Grate* three times:

- [ ] Third heave escapes back to the Workshop; DM gauge resets to 0.
- [ ] A **floor hatch** has appeared in the Workshop (it stays for the rest
      of the session — the way back if anyone missed the brick).

**The corridor loop** — click the Floor Hatch:

- [ ] You surface on the **corridor side** of the bars: the desk (and key)
      in the foreground, the cell furniture dim beyond the bars, the barred
      cell door with its brass lock.
- [ ] *Unlock the Cell Door*: you slip in and it **re-locks behind you** —
      the key stays chained to the desk, every time.
- [ ] From inside, the grate is still the only way out. Heave out again.
- [ ] "Climb back up to the Workshop" chip works from the corridor too.

## 6 · Workshop (solve the valves)

Open *Pressure Valves*, set **2-0-1-3**, *Test the Pressure*.

- [ ] The modal **closes itself** on the solve.
- [ ] The four valve wheels dull from brass to steel (key claimed).
- [ ] With heart + lens + valve in hand, the vault door's frame and studs
      light **violet**.

## 7 · The Vault (placements)

Click the Vault Door.

- [ ] Entry text: containment ring, pedestal, three empty sockets.
- [ ] The containment ring sits **fully on the wall** — nothing spills past
      the floor seam; all four gems ride the ring.
- [ ] Empty sockets read their item identity before placement.

Place the three components one at a time:

- [ ] Heart → crimson; Lens → cyan; Valve → brass (as before).
- [ ] On the third placement: three dim diamond sigils + rune labels along
      the floor, AND a low **focusing altar** appears under the *Activate
      the Convergence* hover box (its core sigil pulsing), AND the
      **stairwell to the Spire grinds open in the right wall — of this
      room** (the narration says so too).

## 8 · The Aether Spire

Climb the stairwell (from the Vault).

- [ ] Entry text: night air, the dead dial, the cocked lever.
- [ ] The exit chip reads **"Back to Vault"** — the stairs connect
      Vault ↔ Spire both ways now.
- [ ] Night sky, crescent moon, parapet, dial, lever: unchanged.

**Throw the Great Lever:**

- [ ] BANG (+35); dial shows ☉ pulsing; sputtering beam; lever rests.
- [ ] **Re-enter the Vault** (one chip click): entry text now announces the
      **SPIRE ARMED** sigil burning, the other two dark.

## 9 · Workshop (vent the pressure)

Down through the Vault to the Workshop.

- [ ] The overflow valve rides the **lowered** right pipe drop, sparking
      violet. Crank it: sparks stop, white steam drifts.
- [ ] Swing through the Vault: entry text now names **SPIRE ARMED and
      PRESSURE VENTED**, lens still dark.

## 10 · Archive (align the lens)

Door to Archive.

- [ ] Exactly **one** hotspot on the lens: *Realign the Lens* (the recording
      dial is hidden while the realign is live — no more overlap).
- [ ] The beam sputters down onto the pedestal; the glass blinks with it.

Open *Realign the Lens*, turn the dial to **☉** (two clicks from ✦), *Lock
Alignment*. Try one wrong sigil first — wrong is quiet AND leaves the modal
open.

- [ ] **Lock Alignment closes the modal** on the correct sigil.
- [ ] The beam goes solid; the lens shines bright cyan.

## 11 · Spire revisit (optional but satisfying)

- [ ] Back up the Vault stairwell: the skyward beam is solid too.

## 12 · The Vault (convergence)

Return to the Vault.

- [ ] Entry text: **all three diamonds burning**, the ring thrumming.
- [ ] All three floor runes lit; the focusing altar pulses under its hover
      box (the "Activate the Convergence" graphic that used to be missing).

Click *Activate the Convergence*:

- [ ] Violet flood inside the ring; ring and gems flare; gold/white sparkles.
- [ ] Victory banner: **THE ANTI-AETHER FIELD HAS FALLEN** (all caps).
- [ ] Victory narration in the log ("magic has returned to the Silent
      Forge").
- [ ] Re-enter the Vault once more: the entry text has a quiet epilogue line.

## Loose ends worth one glance

- [ ] DM console: *Move player* now also offers the **Prison Corridor**.
      Art states follow the party **flags**, so jumped-to scenes render
      correctly.
- [ ] The realtime path is `verify:realtime` — now **90 checks**, covering
      the clue captions, the BANG counts, the corridor loop, the relocated
      stairwell, the auto-closing dials, and the warden toggle. Mobile
      layout is `verify:mobile` (18).

## After the pass

Approved → merge `proto-vault-8bit`, then per
[pixel-prototype-notes.md](pixel-prototype-notes.md): update NEXT_STEPS.md
and the sprite-art-analysis doc. Per the feedback's final thoughts, the SVG
originals stay in the tree as non-authoritative references. Still deferred
(tracked, not in this pass): the locked cabinet's "harder puzzle" reward,
and the Warden jump-scare that builds on the DM's hide/show toggle.
