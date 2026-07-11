# SVG → 8-bit sprite art: migration analysis

> **SUPERSEDED (2026-07-11): this migration is DONE and merged to `main`.**
> The approach that actually shipped differs from this analysis: instead of a
> binary asset pipeline (Aseprite PNGs), the scenes are drawn **procedurally
> in code** into a 160×100 framebuffer (`apps/web/src/scenes/pixel/`), which
> collapsed the "~1–2 weeks of art production" estimate below to ~a day per
> several scenes. This doc is kept for its state-inventory and the reasoning,
> not as a plan. See `docs/pixel-prototype-notes.md` for the real pipeline
> and `NEXT_STEPS.md` for current status.

Written 2026-07-10 (Phase 7), as requested — an assessment of the work, not
an implementation plan. Candidate for v2.

## What exists today

- Seven scene-art components (`apps/web/src/scenes/*Art.tsx`), ~340 lines of
  inline SVG total, all authored in a shared **800×500 coordinate space**
  (`SceneShell.tsx`), ~13 distinct colors after the Phase 6 recolor.
- **State-driven variants via `flags` props** — this is the part that shapes
  everything below. Current inventory of visual states:
  - Workshop: valve knobs found/unfound, vault box lit when `allComponents`,
    Spire stair when `allPlaced`, overflow valve when `armed` (dimmed once
    `vented`), golem eyes (quiet/loud placeholder)
  - Archive: tomes settled when `lensFound`, lens glow dim/bright, Spire beam
    when `aligned`
  - Vault: three sockets filled per `placed*`, three convergence runes
    dim/lit, `won` ring + glow + narration text
  - Spire: dial dormant vs ☉, lever highlighted vs thrown
  - Entrance/Gallery/Prison: static
- **Hotspots are completely decoupled from the art** — `HotspotLayer`
  overlays %-based buttons (plus the Phase 7 visible chips). An art swap
  does not touch hotspot geometry, content schemas, or the engine.
- **The verify suite reaches into the art in exactly one place**: the
  `data-converge` / `data-lit` attributes on the Vault runes.

## What a sprite migration actually involves

### 1. Asset authoring — the dominant cost, and it isn't code

Each scene becomes a pixel-art background (sensible logical resolution:
**320×200 or 400×250**, preserving the 8:5 ratio so hotspot percentages keep
meaning) plus **overlay sprites for every independent state** above — about
**7 backgrounds + ~15 overlay sprites** (sockets, runes, beam, stair, valve,
lever, dial, glow states). Commissioned art was explicitly deferred beyond
v1; realistic sourcing options:

- Hand-pixeled (Aseprite): roughly 0.5–1.5 days per scene at this fidelity →
  **1–2 weeks solo** for the full set. By far the biggest line item.
- Generated + cleanup, or licensed asset packs: faster, but style coherence
  across 7 rooms + 15 overlays becomes the work instead.

### 2. Rendering pipeline — small, well-understood engineering (~1–2 days)

- Keep one React component per scene with the **same `flags → visuals`
  contract**; it renders a stack of absolutely-positioned layers (base +
  conditional overlays) instead of SVG elements. `sceneRegistry` already maps
  name → component, so **scenes can migrate one at a time** with SVG
  fallbacks — prototype-friendly.
- `image-rendering: pixelated` + nearest-neighbor upscale in the existing
  `aspect-ratio: 8/5` container. Non-integer scaling causes minor pixel
  shimmer; acceptable, or clamp the scene width to integer multiples.
- Spritesheet vs individual PNGs: at this asset count, individual PNGs are
  simpler and the whole set is tens of KB — no perf concern either way.

### 3. Things that don't port 1:1

- **Gradient glows** (`#glow`, the won-halo, vignette): pixel-art idiom is
  dithered halos or 2–4 frame `steps()` animations, not radial gradients.
  Modest CSS work, but an aesthetic decision to make deliberately.
- **Text inside the art** (engraving, plaques, rune labels, "dial dormant"):
  tiny pixel text will be unreadable on a projector. Recommendation: move
  in-art text out to hotspot labels/log lines during the migration, or use a
  bitmap font sparingly. This is a content edit, not just art.
- **The BANG bursts and noise gauge are chrome, not scene art** — unaffected
  (though an 8-bit BANG would be on-theme and trivial to swap later).

### 4. Contracts to preserve

- `data-converge`/`data-lit` must survive on whatever element renders the
  runes (an overlay `<img>`/`<div>` carries them fine) — the verify suite's
  Phase 3 leg depends on it.
- Hotspot geometry: unchanged by design (separate layer).
- `verify:mobile`'s tap-area checks: unchanged (hotspot layer again).
- LICENSE-CONTENT (CC BY-NC-SA) should explicitly cover the new art assets.

## Bottom line

Engineering is the easy half: **~1–2 days** for the layered-sprite pipeline,
animations, and verify-hook preservation, migratable scene-by-scene behind
`sceneRegistry`. The real cost is **art production: ~1–2 weeks hand-pixeled
solo (or commissioning)** for 7 backgrounds + ~15 state overlays in a
coherent style. Recommended first step if v2 green-lights it: prototype the
**Vault** (the most state-rich scene) end-to-end to validate the pipeline and
the look before committing to the full set.
