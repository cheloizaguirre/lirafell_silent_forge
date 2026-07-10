# 8-bit prototype: checkpoint notes

Written 2026-07-10 on the `proto-vault-8bit` branch. **Status: all 7 scenes
done (Vault, Entrance, Workshop, Archive, Prison, Gallery, Spire).
Remaining: the user's approval pass over the full set, then merge.** This
file is now the pre-merge reference: everything below was learned by
building the seven scenes, most of it by screenshot.

## Pipeline (what exists)

- **Procedural sprites, zero binary assets.** Each scene draws into a
  160×100 RGBA framebuffer (`pixel/pixelCanvas.ts`: rect/frame/disc/ring/
  dither/bitmap-glyph primitives, all deterministic) and blits to a canvas
  upscaled by CSS `image-rendering: pixelated`. Scene coords are the SVG
  originals ÷ 5, so hotspot percentages keep meaning.
- **`pixel/dungeonKit.ts`** owns the shared parts: the saturated game-style
  `PAL` (deliberately breaks from the muted UI chrome — user decision
  2026-07-10; the chrome itself must stay muted), `drawRoom` (mottled
  brickwork to the floor seam at y=78, warm tiled floor below, edge
  vignette), `drawSpireTop` (the outdoor variant shell: starfield, crescent
  moon, crenellated parapet — same floor seam and vignette so kit habits
  carry over), `drawTorch`, and `usePixelFrame` (2-frame / 600ms flicker).
- **Per-scene component** = kit + ~110–180 lines of furniture, same
  `flags → visuals` contract as the SVG it replaces. Swap-in/swap-back is a
  one-line entry in `engine/sceneRegistry.ts`.
- **Verify after every scene**: `verify:realtime` (67 checks) +
  `verify:mobile` (18). Both have passed unchanged for all five scenes.

## Design rules (learned, not guessed)

1. **Readable text is HTML overlays, never canvas pixels.** `.pixel-rune`
   carries the verify suite's `data-converge`/`data-lit` hooks;
   `.pixel-caption` renders in-scene clues ("Violet before Ash...", the
   grate caption). Both need their dark backing chip — bare text drowns on
   busy art. Exception: *digits* work as 3×5 pixel glyphs (the 2-0-1-3
   engraving), and look great.
2. **Sprites need a backdrop of the opposite value — black-on-black AND
   grey-on-grey both fail.** Bitten four times: the grey automaton faded
   into the bricks (→ black+violet against slate), the Warden vanished
   inside its black-dithered alcove (→ mortar-toned interior), the black
   decoy tome vanished in the black shelf slot (→ wood-backed recess), and
   the Gallery's steel exhibits drowned on a grey slate case backing (user
   catch → dark mortar interior + a dithered case-light halo behind each
   specimen). Pick the backing against the sprite's value, not the room's.
3. **Regular checker dither moirés at this resolution.** Fine for small
   glows/halos; as a full-scene gloom it reads as woven mesh against the
   brick pattern. Use an irregular scatter instead
   (`(x*13 + y*7) % 11 === 0` ≈ 9%) — reads as grime and shadow.
4. **Color language.** Purple = aether/magic/interactable glints ONLY
   (eyes, cores, runes, beams, the lamp, hotspot-worthy glints). Item
   identity: crimson heart / cyan lens / brass valve, dim variants before
   placement so identity reads early. Fire (torches, candle, forge rod) is
   the warmth; ONE cold cyan note per scene max (lens glass, prison
   moonlight) for contrast. Wood + brass for furniture.
5. **The colossus formula** (entrance automaton, the Warden): black chassis
   + violet rim-light on one side + shoulder slab + horned head + brow line
   + eyes pulsing on the flicker frame + faint aether core + plating seams.
   Scale sells the menace (~40–60% of scene height). Needs rule #2.
6. **One boolean frame drives all life.** Torch flames, candle, pulsing
   eyes/cores, the grate's 1px rattle, the sputtering beam, drifting steam
   — everything animates off the same 2-frame flicker. Cheap, cohesive,
   deterministic per frame (stable screenshots).
7. **Show, don't print.** The SVG printed "a faint beam flickers from the
   Spire above"; the pixel Archive shows a sputtering dithered beam that
   goes solid on alignment. Prefer replacing status text with state visuals.
8. **Art follows hotspots; when a sprite outgrows its box, grow the box.**
   Adjust `scenes.ts` with the SVG original noted inline (done for the
   automaton, the Warden, and the Workshop side doors, which moved from
   floor-corner boxes up onto the walls as real doorways).
9. **A mascot sprite must stay clearly smaller than its machine.** The
   Gallery's cuckoo started 3×3 beside the barrel and the whole cannon read
   as a duck on a cart; shrunk to 2×2 and perched on the breech it reads as
   cannon-with-bird. Same class of catch as rule #2: only visible by
   screenshot.
10. **Screenshots catch what suites can't.** Every scene shipped with a
   scratchpad Playwright script that drives the real flows (DM grants,
   placement, Spire arming, force-scene into prison) and captures each
   state variant. Caught: rune label collisions, all three black-on-black
   failures, the gloom moiré, the BANG hidden behind the puzzle modal.

## How the Spire resolved (the open design questions)

- The sky shell was worth building: `drawSpireTop` went into dungeonKit
  next to `drawRoom`, and the outdoor night (starfield, cyan crescent moon
  as the scene's one cold note, crenellated parapet) makes the climax scene
  read distinct on the first screenshot.
- ☉ is drawn, not printed: double violet ring + core disc on the dial face,
  pulsing on the flicker frame over a sparse haze — unmissable, and a
  player can relay "a circle with a dot" to the Archive without text.
- "Dial dormant" needed no caption: the dead mortar face with brass
  quarter-ticks reads dormant on its own. The lever caption keeps SVG
  parity ("a great brass lever" / "the lever rests, thrown").
- The Archive's beam is fired here, same grammar both ends: sputtering
  dither while armed, solid `purpleBright` core once aligned.

## Open items before merge
- User approval pass over all seven, then merge (`main` still renders the
  SVG originals; the registry diff is the only integration point).
- On merge: update NEXT_STEPS.md + the sprite-art-analysis doc (the
  "1–2 weeks of art production" estimate collapsed — procedural sprites
  took ~a day for five scenes), and decide the SVG components' fate
  (keep as swap-back references vs delete).
