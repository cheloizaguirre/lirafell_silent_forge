import { useEffect, useRef } from "react";
import type { ArtProps } from "../artTypes";
import {
  createBuf,
  fillRect,
  frameRect,
  ditherRect,
  disc,
  ring,
  set,
  blit,
} from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, drawGlyph, drawDots, usePixelFrame } from "./dungeonKit";

// 8-bit Workshop Floor (proto-vault-8bit branch). The busiest scene: the
// Dormant Warden gets the same black+violet colossus treatment as the
// entrance automaton -- but bigger, standing, and in its own alcove.
// Feedback pass 2026-07-11: the valve code engraving is GONE (the clue moved
// to the prison brick), the pipe run dropped to knee height, the vault door
// grew to room-door proportions, the warden stepped away from the archive
// doorway, the bench cleared the gallery doorway, the Spire stairwell moved
// to the Vault, and a floor hatch to the prison corridor appears once the
// party has escaped the cell. Geometry follows the hotspots in
// packages/content (originals noted inline in scenes.ts).

const W = 160;
const H = 100;

interface WorkshopState {
  valveFound: boolean;
  allComponents: boolean;
  armed: boolean;
  vented: boolean;
  wardenHidden: boolean;
  escapedPrison: boolean;
}

// The alcove is architecture -- it stays even when the DM hides the Warden
// (the onEnter text then calls it empty).
function drawAlcove(buf: ReturnType<typeof createBuf>): void {
  // Recessed stone niche, floor to arch (x25-47, y14-78). The interior stays
  // mortar-toned -- the Warden is a BLACK chassis and needs something to
  // silhouette against.
  fillRect(buf, 25, 16, 22, 62, PAL.mortar);
  for (let y = 17; y < 78; y++) {
    set(buf, 26, y, PAL.black);
    set(buf, 45, y, PAL.black);
  }
  for (let y = 16; y < 78; y++) {
    set(buf, 25, y, PAL.steelDark);
    set(buf, 46, y, PAL.steelDark);
  }
  for (let x = 25; x < 47; x++) set(buf, x, 15, PAL.steelDark);
  for (let x = 27; x < 45; x++) set(buf, x, 16, PAL.black);
}

function drawWarden(buf: ReturnType<typeof createBuf>, frame: number): void {
  // The Warden: standing colossus, black chassis, violet edge-light.
  // legs
  fillRect(buf, 30, 60, 4, 14, PAL.black);
  fillRect(buf, 38, 60, 4, 14, PAL.black);
  fillRect(buf, 29, 74, 6, 3, PAL.black);
  fillRect(buf, 37, 74, 6, 3, PAL.black);
  set(buf, 29, 74, PAL.purpleDim);
  set(buf, 42, 74, PAL.purpleDim);
  // arms hanging outside the torso, fists at mid-thigh
  fillRect(buf, 26, 40, 3, 20, PAL.black);
  fillRect(buf, 43, 40, 3, 20, PAL.black);
  fillRect(buf, 25, 60, 5, 5, PAL.black);
  fillRect(buf, 42, 60, 5, 5, PAL.black);
  set(buf, 25, 60, PAL.purpleDim);
  set(buf, 46, 60, PAL.purpleDim);
  // shoulder slab + torso
  fillRect(buf, 27, 34, 18, 8, PAL.black);
  fillRect(buf, 28, 38, 16, 22, PAL.black);
  for (let x = 28; x < 45; x++) set(buf, x, 34, PAL.purpleDim);
  for (let y = 38; y < 60; y++) set(buf, 28, y, PAL.purpleDim);
  // plating seams
  for (let x = 29; x < 44; x += 3) {
    set(buf, x, 48, PAL.purpleDim);
    set(buf, x + 1, 54, PAL.purpleDim);
  }
  // aether furnace behind the chest plate -- banked, not out
  fillRect(buf, 34, 43, 4, 4, PAL.purpleDim);
  set(buf, 35, 44, frame === 0 ? PAL.purple : PAL.purpleBright);
  set(buf, 36, 45, PAL.purple);
  // horned head
  fillRect(buf, 31, 25, 10, 9, PAL.black);
  fillRect(buf, 31, 22, 2, 3, PAL.black);
  fillRect(buf, 39, 22, 2, 3, PAL.black);
  set(buf, 31, 22, PAL.purpleDim);
  set(buf, 40, 22, PAL.purpleDim);
  for (let y = 25; y < 34; y++) set(buf, 31, y, PAL.purpleDim);
  // brow + heavy eyes, pulsing on the flicker frame
  for (let x = 33; x < 40; x++) set(buf, x, 27, PAL.purpleDim);
  const eye = frame === 0 ? PAL.purpleBright : PAL.purple;
  fillRect(buf, 33, 29, 2, 2, eye);
  fillRect(buf, 38, 29, 2, 2, eye);
}

function draw(ctx: CanvasRenderingContext2D, s: WorkshopState, frame: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  // Left torch hangs above the archive doorway; right one over the bench.
  drawTorch(buf, 7, 42, frame);
  drawTorch(buf, 112, 26, frame === 0 ? 1 : 0);

  drawAlcove(buf);
  if (!s.wardenHidden) drawWarden(buf, frame);

  // ---- Vault door, top center (hotspot x43-57%, y4-42%) --------------------
  // Room-door proportions (feedback: it read as a safe, not a doorway):
  // tall steel double door with a center seam, hinges, and a threshold ledge.
  fillRect(buf, 70, 6, 20, 34, PAL.steelDark);
  frameRect(buf, 70, 6, 20, 34, s.allComponents ? PAL.purpleBright : PAL.steel);
  for (let y = 8; y < 39; y++) {
    set(buf, 79, y, PAL.black);
    set(buf, 80, y, PAL.black);
  }
  // hinges down both jambs
  for (const hy of [10, 22, 34] as const) {
    fillRect(buf, 71, hy, 2, 2, PAL.brass);
    fillRect(buf, 87, hy, 2, 2, PAL.brass);
  }
  // ring handles at the seam
  frameRect(buf, 75, 22, 3, 3, PAL.brassLight);
  frameRect(buf, 82, 22, 3, 3, PAL.brassLight);
  // brass studs, lighting violet once every component is found
  for (const [bx, by] of [[72, 8], [86, 8], [72, 37], [86, 37]] as const) {
    set(buf, bx, by, s.allComponents ? PAL.purpleBright : PAL.brass);
  }
  // threshold ledge
  fillRect(buf, 68, 40, 24, 2, PAL.steel);
  for (let x = 68; x < 92; x++) set(buf, x, 40, PAL.wallLight);

  // ---- Pipe assembly at knee height (hotspot x36-65%, y58-74%) -------------
  // Feedback: the run dropped from eye level to knee height, and the faded
  // 2-0-1-3 engraving is gone -- the code now lives behind the prison brick.
  fillRect(buf, 60, 66, 41, 3, PAL.steel);
  for (let x = 60; x < 101; x++) set(buf, x, 66, PAL.wallLight);
  for (let x = 60; x < 101; x++) set(buf, x, 68, PAL.steelDark);
  fillRect(buf, 60, 69, 3, 9, PAL.steel);
  fillRect(buf, 98, 69, 3, 9, PAL.steel);
  for (let y = 69; y < 78; y++) {
    set(buf, 62, y, PAL.steelDark);
    set(buf, 100, y, PAL.steelDark);
  }
  for (const [fx, fy] of [[60, 69], [98, 69]] as const) {
    fillRect(buf, fx - 1, fy, 5, 2, PAL.brass);
    set(buf, fx - 1, fy, PAL.brassLight);
  }
  // four valve wheels on the main run: brass while the puzzle is live,
  // dulled steel once the key is claimed
  for (let i = 0; i < 4; i++) {
    const cx = 66 + i * 10;
    disc(buf, cx, 67, 3, s.valveFound ? PAL.steelDark : PAL.brass);
    ring(buf, cx, 67, 3, s.valveFound ? PAL.steel : PAL.brassLight);
    set(buf, cx, 67, s.valveFound ? PAL.steel : PAL.steelDark);
  }

  // ---- Overflow valve (armed; hotspot x45-56%, y46-68%) --------------------
  // Feedback: the old horizontal stub jutted right into the workbench. Now a
  // vertical stub rises from the center of the pipe run, clear of the desk.
  if (s.armed) {
    fillRect(buf, 79, 58, 2, 8, PAL.steel);
    set(buf, 79, 58, PAL.wallLight);
    disc(buf, 80, 55, 4, s.vented ? PAL.steelDark : PAL.brass);
    ring(buf, 80, 55, 4, s.vented ? PAL.steel : PAL.brassLight);
    set(buf, 80, 55, PAL.steelDark);
    if (!s.vented) {
      // pressure wants out: the rim sparks violet until someone turns it
      set(buf, 80, 50, frame === 0 ? PAL.purpleBright : PAL.purple);
      set(buf, 84, 55, frame === 0 ? PAL.purple : PAL.purpleBright);
    } else {
      // steam hissing free, drifting up with the flicker frame
      const drift = frame === 0 ? 0 : 1;
      for (const [px, py] of [[78, 50], [81, 48], [79, 45], [83, 51]] as const) {
        set(buf, px + drift, py, PAL.white);
      }
    }
  }

  // ---- Workbench (hotspot x67-87%, y56-80%) --------------------------------
  // Shifted left (feedback) so the gallery doorway at x144-156 stops
  // overlapping the bench top.
  fillRect(buf, 110, 62, 29, 3, PAL.wood);
  for (let x = 110; x < 139; x++) set(buf, x, 62, PAL.woodLight);
  fillRect(buf, 111, 65, 2, 13, PAL.woodDark);
  fillRect(buf, 136, 65, 2, 13, PAL.woodDark);
  // tools: a brass wrench, a steel hammer, and a rod still glowing hot
  fillRect(buf, 114, 60, 5, 1, PAL.brass);
  set(buf, 114, 59, PAL.brassLight);
  set(buf, 118, 59, PAL.brassLight);
  fillRect(buf, 123, 58, 2, 4, PAL.steelDark);
  fillRect(buf, 122, 58, 4, 2, PAL.steel);
  fillRect(buf, 129, 60, 6, 1, PAL.ember);
  set(buf, 134, 60, frame === 0 ? PAL.flameCore : PAL.flame);

  // ---- Floor hatch to the prison corridor (escapedPrison) ------------------
  // Appears once the party has been through the cell: the duct they crawled
  // out of, propped open. Hotspot x29-39%, y80-92%.
  if (s.escapedPrison) {
    ditherRect(buf, 48, 89, 13, 2, PAL.black);
    fillRect(buf, 49, 83, 11, 6, PAL.steelDark);
    frameRect(buf, 49, 83, 11, 6, PAL.steel);
    for (const gx of [52, 55, 58] as const) {
      for (let y = 84; y < 88; y++) set(buf, gx, y, PAL.black);
    }
    // hinge + a faint violet draft from below
    set(buf, 49, 83, PAL.brass);
    set(buf, 59, 83, PAL.brass);
    set(buf, 54, 88, PAL.purpleDim);
  }

  // ---- Side doorways (hotspots x2-11% / x89-98%, y56-78%) ------------------
  for (const dx of [4, 144] as const) {
    fillRect(buf, dx, 58, 12, 20, PAL.black);
    for (let y = 58; y < 78; y++) {
      set(buf, dx, y, PAL.steelDark);
      set(buf, dx + 11, y, PAL.steelDark);
    }
    for (let x = dx; x < dx + 12; x++) set(buf, x, 57, PAL.steelDark);
    ditherRect(buf, dx + 1, 58, 10, 4, PAL.mortar);
  }

  // ---- Hidden capstone clue: valve cross ⊹, ringed by 1 dot -> slot 1 -------
  // Stamped on the wall beside the pipe run, low-contrast (near-background
  // steel). No hotspot, no state -- pure decoration for a paying-attention
  // player. Matches the "⊹ Gear" tile in the cabinet-gears puzzle.
  drawGlyph(buf, "cross", 55, 59, PAL.steelDark);
  drawDots(buf, 55, 59, 1, PAL.steelDark);

  blit(ctx, buf);
}

export function WorkshopArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  const state: WorkshopState = {
    valveFound: flags.valveFound === true,
    allComponents:
      flags.heartFound === true && flags.lensFound === true && flags.valveFound === true,
    armed: flags.armed === true,
    vented: flags.vented === true,
    wardenHidden: flags.wardenHidden === true,
    escapedPrison: flags.escapedPrison === true,
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, state, frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.valveFound,
    state.allComponents,
    state.armed,
    state.vented,
    state.wardenHidden,
    state.escapedPrison,
    frame,
  ]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
    </div>
  );
}
