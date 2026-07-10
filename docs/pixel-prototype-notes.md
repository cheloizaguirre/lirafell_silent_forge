# 8-bit prototype: checkpoint notes

Written 2026-07-10 on the `proto-vault-8bit` branch. **Status: 6 of 7 scenes
done (Vault, Entrance, Workshop, Archive, Prison, Gallery). Remaining:
Spire.** The branch stays unmerged until the user approves the full set.
This file is the resume-here doc for the remaining scene: everything below
was learned by building the first six, most of it by screenshot.

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
  vignette), `drawTorch`, and `usePixelFrame` (2-frame / 600ms flicker).
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
2. **Black sprites need a non-black backdrop.** Bitten three times: the
   grey automaton faded into the bricks (→ black+violet against slate), the
   Warden vanished inside its black-dithered alcove (→ mortar-toned
   interior), the black decoy tome vanished in the black shelf slot (→
   wood-backed recess). If the sprite is dark, light the surface behind it.
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

## Notes for the remaining scene

- **Spire**: the great dial (☉ as a drawn pixel sigil when armed — it's
  the Archive clue, must be big and unmissable; "dial dormant" becomes a
  caption or a dark dial face), the brass lever with the violet
  interactable glint until thrown. Consider whether the top of the Spire
  wants a variant shell (night sky + parapet instead of `drawRoom`'s
  dungeon brick) — it's the only scene that's plausibly outdoors; decide
  by screenshot, and if a sky shell is built, keep it in dungeonKit next
  to `drawRoom`.

## Open items before merge

- Spire scene.
- User approval pass over all seven, then merge (`main` still renders the
  SVG originals; the registry diff is the only integration point).
- On merge: update NEXT_STEPS.md + the sprite-art-analysis doc (the
  "1–2 weeks of art production" estimate collapsed — procedural sprites
  took ~a day for five scenes), and decide the SVG components' fate
  (keep as swap-back references vs delete).
