import { useEffect, useRef } from "react";
import type { ArtProps } from "../artTypes";
import {
  createBuf,
  fillRect,
  frameRect,
  ditherRect,
  disc,
  ditherDisc,
  ring,
  set,
  blit,
  rgb,
} from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, usePixelFrame } from "./dungeonKit";

// 8-bit Archive & Study (proto-vault-8bit branch). The tome shelf and its
// inscription are the puzzle surface, so both must read from a couch: the
// four tomes are fat color-coded spines, and the "Violet before Ash..."
// clue is an HTML caption (same rule as the Vault's rune labels). The SVG's
// "a faint beam flickers" *text* is replaced by an actual flickering beam:
// armed-but-unaligned sputters on the flicker frame, aligned goes solid.

const W = 160;
const H = 100;

const ASH = rgb("#8a857f");

// Order and geometry mirror the SVG (x60+i*55, /5): violet, ash, black
// (the decoy), ember. The solved shelf lets the three answer tomes settle
// two pixels lower, exactly like the SVG's nudge.
const TOMES = [
  { x: 12, color: PAL.purple, settles: true },
  { x: 23, color: ASH, settles: true },
  { x: 34, color: PAL.black, settles: false },
  { x: 45, color: PAL.ember, settles: true },
] as const;

// Filler spines for the upper shelves -- deterministic pattern, pure decor.
const FILLER: readonly (readonly [number, number])[] = [
  // [width, palette index into FILLER_COLORS]
  [3, 0], [2, 1], [4, 2], [3, 3], [2, 4], [3, 1], [4, 0], [2, 2], [3, 4], [2, 3],
];
const FILLER_COLORS = [PAL.steel, PAL.ember, PAL.purpleDim, PAL.brass, ASH] as const;

interface ArchiveState {
  lensFound: boolean;
  armed: boolean;
  aligned: boolean;
}

function draw(ctx: CanvasRenderingContext2D, s: ArchiveState, frame: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  drawTorch(buf, 74, 26, frame);
  drawTorch(buf, 134, 26, frame === 0 ? 1 : 0);

  // ---- The great bookshelf (hotspot x5-37%, y46-80%) -----------------------
  fillRect(buf, 8, 16, 52, 62, PAL.woodDark);
  frameRect(buf, 8, 16, 52, 62, PAL.wood);
  for (let y = 17; y < 78; y++) set(buf, 9, y, PAL.woodLight);
  for (let x = 9; x < 59; x++) set(buf, x, 17, PAL.woodLight);
  // two upper shelves of filler spines
  for (const shelfY of [32, 47] as const) {
    for (let x = 9; x < 59; x++) set(buf, x, shelfY, PAL.wood);
    let bx = 11;
    FILLER.forEach(([w, c], i) => {
      const h = 9 + ((i * 5 + shelfY) % 4);
      fillRect(buf, bx, shelfY - h, w, h, FILLER_COLORS[c]);
      set(buf, bx, shelfY - h, PAL.black);
      bx += w + 1;
      if (bx > 55) bx = 11;
    });
  }
  // The tome recess reads as shelf-wood, not a void -- the black decoy
  // tome has to silhouette against SOMETHING. Vertical plank seams show
  // in the gaps between spines; a shelf board runs beneath them.
  for (const px of [16, 27, 38, 49] as const) {
    for (let y = 49; y < 76; y++) set(buf, px, y, PAL.wood);
  }
  fillRect(buf, 9, 76, 50, 2, PAL.wood);
  for (let x = 9; x < 59; x++) set(buf, x, 76, PAL.woodLight);

  // the colored tomes themselves
  for (const tome of TOMES) {
    const top = s.lensFound && tome.settles ? 52 : 50;
    fillRect(buf, tome.x, top, 8, 76 - top, tome.color);
    for (let y = top; y < 76; y++) set(buf, tome.x, y, PAL.black);
    // spine bands + title stud
    for (let x = tome.x + 1; x < tome.x + 8; x++) {
      set(buf, x, top + 2, PAL.brassLight);
      set(buf, x, 72, PAL.brass);
    }
    set(buf, tome.x + 4, top + 6, PAL.brassLight);
  }

  // ---- Memory imprint lens (hotspot x60-68%, y55-83%) ----------------------
  // pedestal
  fillRect(buf, 100, 66, 6, 12, PAL.steelDark);
  for (let y = 66; y < 78; y++) set(buf, 100, y, PAL.steel);
  fillRect(buf, 99, 65, 8, 2, PAL.brass);
  set(buf, 99, 65, PAL.brassLight);
  // the beam, before the glass: solid when aligned, sputtering when the
  // Spire is armed but the lens still points wrong
  if (s.aligned) {
    fillRect(buf, 102, 0, 3, 54, PAL.purple);
    for (let y = 0; y < 54; y++) set(buf, 103, y, PAL.purpleBright);
    ditherDisc(buf, 103, 59, 9, PAL.purpleDim);
  } else if (s.armed && frame === 0) {
    ditherRect(buf, 102, 0, 3, 54, PAL.purpleDim);
  }
  // lens assembly: steel ring, cyan glass
  ring(buf, 103, 59, 6, PAL.steel);
  ring(buf, 103, 59, 5, PAL.steelDark);
  const glass = s.aligned
    ? PAL.lensLight
    : s.armed
      ? frame === 0
        ? PAL.lensCyan
        : PAL.lensDim
      : PAL.lensDim;
  disc(buf, 103, 59, 4, glass);
  set(buf, 102, 58, s.aligned ? PAL.white : PAL.lensLight);

  // ---- Locked cabinet (hotspot x78-93%, y52-84%) ---------------------------
  fillRect(buf, 125, 54, 24, 24, PAL.wood);
  frameRect(buf, 125, 54, 24, 24, PAL.woodDark);
  for (let x = 126; x < 148; x++) set(buf, x, 54, PAL.woodLight);
  // two inset door panels + center seam
  frameRect(buf, 128, 57, 8, 18, PAL.woodDark);
  frameRect(buf, 138, 57, 8, 18, PAL.woodDark);
  for (let y = 55; y < 77; y++) set(buf, 137, y, PAL.woodDark);
  // brass lock: knob + keyhole
  fillRect(buf, 136, 64, 3, 3, PAL.brass);
  set(buf, 136, 64, PAL.brassLight);
  set(buf, 137, 66, PAL.black);

  blit(ctx, buf);
}

export function ArchiveArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  const state: ArchiveState = {
    lensFound: flags.lensFound === true,
    armed: flags.armed === true,
    aligned: flags.aligned === true,
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, state, frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lensFound, state.armed, state.aligned, frame]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
      <span className="pixel-caption" style={{ left: "21%", top: "82%" }}>
        "Violet before Ash, Ash before Ember."
      </span>
    </div>
  );
}
