# Approval walkthrough: the seven 8-bit scenes

A single playthrough on the `proto-vault-8bit` branch that passes through
every scene and every flag-driven art state. Play it straight — the route
uses real puzzle solves (answers are in tracked docs by design at this
stage), one deliberate capture, and the DM console only where the game
actually needs a DM. Tick the boxes as you go; anything that looks wrong,
note the box and we iterate on that scene.

## Setup

1. `supabase start` (or `supabase status` if already up), then
   `cd apps/web && npx vite --port 5173 --strictPort`.
2. Open **two browser windows**: one DM, one player.
   - DM: `http://localhost:5173`, enter a name, *Start a new quest*.
   - Player: `http://localhost:5173/join/<CODE>`, join.
3. The DM cheat sheet (expandable on the DM console) lists every answer if
   you lose this doc mid-run.

**How to look at each scene** (applies everywhere, not repeated below):

- [ ] Idle for a second or two: everything alive (flames, eyes, cores,
      steam, beams, the grate) animates on the same 2-frame / 600ms flicker.
- [ ] Hover each hotspot: the highlight box should frame the art it names.
- [ ] The UI chrome around the canvas stays muted; only the scene art is
      saturated.
- [ ] Captions and rune labels are readable HTML chips with dark backing —
      never drowned in the art.

## 1 · Entrance Hall (static — no flag states)

- [ ] Great door: wood planks, brass hinges, twin ring handles, arched stone
      surround, threshold step.
- [ ] Aether lamp on its spike above the lintel — the room's only violet.
- [ ] Slumped colossus against the left wall: black chassis, violet rim-light,
      horned head, brow line, **eyes pulsing** on the flicker, faint chest core.
- [ ] Writing desk: half-burned note (singed ember corner), candle stub with
      a flickering flame.

## 2 · Workshop Floor (pre-solve state)

Enter via the Great Door.

- [ ] The Dormant Warden in its alcove: standing colossus, mortar-toned
      niche behind it (it must silhouette, not vanish), pulsing eyes and
      banked furnace.
- [ ] Pipe assembly: engraved plaque with real pixel digits **2-0-1-3**,
      legible from a couch.
- [ ] Four **brass** valve wheels on the pipe run (puzzle still live).
- [ ] Vault door top-center: steel frame, brass studs (nothing found yet).
- [ ] No stairwell in the upper-left wall yet.
- [ ] Workbench: wrench, hammer, rod still glowing hot at the tip.
- [ ] Side doorways left/right read as real doorways on the walls.

## 3 · Gallery of Automatons

Door to Gallery, right side of the Workshop.

**Unsolved:**

- [ ] Five distinct exhibits in wood-and-brass cases, dark interiors, a
      case-light halo behind each: clockwork spider / brass owl / piston
      hound / cuckoo cannon / silent butler.
- [ ] The four alarmed automatons watch with **ember eyes pulsing**.
- [ ] The butler stands calm: steady pale eye, cyan monocle, and a **dim
      crimson glint** behind its brass chest panel.
- [ ] Plaque caption: *"Only the one who never sang served faithfully."*

**Wrong answer** — open *Examine the Automatons*, pick any non-butler:

- [ ] Big BANG burst on your screen (lives ~1.2s); DM gauge shows noise +30.

**Solve** — pick *Silent Butler*, close the modal:

- [ ] Every eye has gone dark; the exhibits sit still.
- [ ] The butler's chest panel hangs **open** — brass hatch flap, empty
      black cavity, crimson glint gone.

## 4 · Archive & Study

Back to Workshop, then Door to Archive (left side).

**Pre-solve:**

- [ ] Great bookshelf: two shelves of filler spines, four fat tomes below —
      violet / ash / black / ember — in a **wood-backed** recess (the black
      decoy must silhouette).
- [ ] Caption: *"Violet before Ash, Ash before Ember."*
- [ ] Lens pedestal: steel ring, **dim** cyan glass.
- [ ] Locked cabinet: door panels, brass knob, black keyhole.

**Solve** — *The Colored Tomes*: Violet → Ash → Ember (skip the black decoy).
The modal auto-closes on the third click.

- [ ] The three answer tomes have **settled two pixels lower**; the black
      decoy stays put.

## 5 · Getting caught (Workshop → Prison Cell)

Back to Workshop. Open *Pressure Valves* and deliberately fail — submit
wrong dials until the DM console shows the **Warden alert** (noise 100;
about three fails).

- [ ] Each fail: BANG on the player screen, pipes-shriek text, +30 on the
      DM gauge.
- [ ] Nobody moves automatically at 100 — the DM decides.

DM: *Send \<player\> to the cell.*

- [ ] Player lands in the Prison Cell with the wake-up text.
- [ ] The room shell plays the corridor **beyond** the bars: unreachable
      torch, cold moonlit window slit, gloom scatter over everything.
- [ ] Full-height iron bars with cross-rails in front of it all.
- [ ] In the cell: straw, plank cot with pillow and blanket, hanging chains
      with open shackles.
- [ ] The corroded grate **rattles a pixel** on the flicker, rust specks and
      a violet corner glint; caption below.

Heave the *Loose Floor Grate* three times (three escalating texts):

- [ ] Third heave escapes back to the Workshop and the DM gauge resets to 0.

## 6 · Workshop (solve the valves)

Open *Pressure Valves*, set **2-0-1-3**, *Test the Pressure*.

- [ ] The four valve wheels dull from brass to steel (key claimed).
- [ ] With heart + lens + valve all in hand, the vault door's frame and
      studs light **violet**.

## 7 · The Vault (placements)

Click the Vault Door.

- [ ] Containment ring: chunky steel, four violet gem studs; stone pedestal
      with brass trim.
- [ ] Empty sockets read their item identity **before** placement: dim
      crimson heart outline, dim cyan lens ring, empty brass valve frame.

Place the three components one at a time, checking after each:

- [ ] Heart → filled crimson with highlight.
- [ ] Lens → solid cyan disc with glint.
- [ ] Valve → bright brass block.
- [ ] On the third placement (allPlaced): three **dim diamond sigils + rune
      labels** appear along the floor — `spire armed / pressure vented /
      lens aligned`, all unlit.

Back to Workshop:

- [ ] The Spire stairwell has ground open upper-left: black doorway, violet
      frame, steps climbing into the dark.

## 8 · The Aether Spire

Climb the stairwell.

**Dormant:**

- [ ] Night sky replaces the dungeon brick: starfield, cyan **crescent
      moon**, crenellated parapet, torches burning against the dark.
- [ ] The great dial on its mast: steel ring, **dead mortar face**, four
      brass quarter-ticks. It should read dormant with no caption needed.
- [ ] The lever: arm cocked up, bright brass knob, **violet glint** pulsing
      beside it; caption *"a great brass lever"*.

**Throw the Great Lever:**

- [ ] BANG (it was LOUD; +35 on the DM gauge).
- [ ] The dial now shows the sigil **☉** — double violet ring + core,
      pulsing, unmissable. You could relay "a circle with a dot" from the
      couch.
- [ ] A **sputtering** dithered beam fires from the dial into the sky
      (visible on one flicker frame, gone the next).
- [ ] The lever rests down, knob gone dull, glint gone; caption *"the lever
      rests, thrown"*.

## 9 · Workshop (vent the pressure)

Back down to the Workshop.

- [ ] A new overflow valve has appeared on the right pipe drop, rim
      **sparking violet** (armed, unvented).

Crank it:

- [ ] Sparks stop; **white steam** hisses free, drifting with the flicker.

## 10 · Archive (align the lens)

Door to Archive.

- [ ] The beam from the Spire now **sputters down** onto the lens pedestal;
      the lens glass blinks cyan/dim with it.

Open *Realign the Lens*, turn the dial to **☉** (two clicks from ✦), *Lock
Alignment*. Try one wrong sigil first if you like — wrong is quiet, no noise.

- [ ] The beam goes **solid** — violet with a bright core — and the lens
      shines bright cyan with a white glint.

## 11 · Spire revisit (optional but satisfying)

- [ ] Back up the stairwell: the skyward beam is solid now too — both ends
      of the beam tell the same story.

## 12 · The Vault (convergence)

Return to the Vault.

- [ ] All three floor runes are **lit**: violet-hazed diamonds with white
      cores, labels glowing.

Click *Activate the Convergence*:

- [ ] The room floods with dithered violet bands inside the ring; the ring
      and gems flare bright; a fixed constellation of gold/white sparkles.
- [ ] Victory banner: *"the anti-aether field has fallen"*.
- [ ] Victory narration in the log ("magic has returned to the Silent
      Forge").

## Loose ends worth one glance

- [ ] DM console: *Move player* to any scene mid-run — art states follow the
      party **flags**, not who walked where, so jumped-to scenes render
      correctly. (The Spire's pre-allPlaced "stuck lever" renders the same
      cocked-and-glinting lever; the difference is the flavor text.)
- [ ] A second player joining and standing in the Vault while you act
      elsewhere sees runes light **live** — the realtime path is what
      `verify:realtime` locks down (67 checks) if you'd rather not do it by
      hand.

## After the pass

Approved → merge `proto-vault-8bit`, then per
[pixel-prototype-notes.md](pixel-prototype-notes.md): update NEXT_STEPS.md
and the sprite-art-analysis doc, and decide whether the SVG originals stay
as swap-back references or go. Not approved → name the boxes that failed
and we iterate scene by scene (the registry swap makes SVG comparison a
one-line flip per scene).
