# Obsolete SVG scene art (historical reference — NOT live)

These are the **original SVG scene components** from before the 8-bit pixel-art
rework. The live game renders the procedural pixel versions in
`../pixel/*Pixel.tsx`; `engine/sceneRegistry.ts` maps every scene to its
`*Pixel` component and nothing imports the files here.

They are kept as **historical reference only** (original layout/composition,
early hotspot geometry). Treat their content as **stale**, not authoritative:

- Clue text predates the 2026-07-12 difficulty pass — e.g. `GalleryArt` still
  shows the plain "never sang" riddle, `ArchiveArt` the plain tome order.
- Gameplay structure predates the pixel-feedback relocation — e.g.
  `WorkshopArt` still shows the valve code `2 – 0 – 1 – 3` as a Workshop
  engraving, but that code now lives only behind the prison cell's loose brick.

`SceneShell.tsx` moved here with them because it was their shared wrapper and
had no other importers. `artTypes.ts` stayed in `../` — it's shared with the
live pixel components.

If you need current scene behavior, read `../pixel/` and
`packages/content/src/data/scenes.ts`, not this folder.
