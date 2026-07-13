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
import type { Buf } from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, drawGlyph, drawDots, usePixelFrame } from "./dungeonKit";

// 8-bit Archive & Study (proto-vault-8bit branch). The tome shelf and its
// inscription are the puzzle surface, so both must read from a couch: the
// four tomes are fat color-coded spines, and the burn-cycle haiku clue is
// an HTML caption (same rule as the Vault's rune labels). The SVG's
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
  keystoneFound: boolean;
  cabinetOpened: boolean;
}

// The Master Gearlock cabinet (capstone). Three looks: sealed with a
// five-spindle gear lock (center spindle an empty socket until the keystone
// is granted), the same with the keystone seated once keystoneFound, and
// folded open once solved (cabinetOpened). Geometry keeps the old hotspot box
// (x78-93%, y52-84%).
function drawCabinet(buf: Buf, keystoneFound: boolean, cabinetOpened: boolean): void {
  frameRect(buf, 125, 54, 24, 24, PAL.woodDark);
  for (let x = 126; x < 148; x++) set(buf, x, 54, PAL.woodLight);

  if (cabinetOpened) {
    // iron face folded open on a still, dark interior; something within
    // catches the light (the game names nothing -- the DM narrates it).
    fillRect(buf, 126, 55, 22, 22, PAL.black);
    for (const lx of [126, 147] as const) {
      fillRect(buf, lx, 55, 2, 22, PAL.woodDark);
      for (let y = 55; y < 77; y++) set(buf, lx === 126 ? 127 : 146, y, PAL.wood);
    }
    ditherRect(buf, 131, 60, 8, 12, PAL.steelDark, true);
    set(buf, 136, 64, PAL.brassBright);
    set(buf, 137, 65, PAL.brassLight);
    set(buf, 135, 66, PAL.brass);
    return;
  }

  // sealed: wood doors, inset panels, center seam
  fillRect(buf, 126, 55, 22, 22, PAL.wood);
  frameRect(buf, 128, 57, 8, 18, PAL.woodDark);
  frameRect(buf, 138, 57, 8, 18, PAL.woodDark);
  for (let y = 55; y < 77; y++) set(buf, 137, y, PAL.woodDark);
  // iron lock plate carrying the five gear spindles
  fillRect(buf, 126, 63, 22, 6, PAL.steelDark);
  for (let x = 126; x < 148; x++) set(buf, x, 63, PAL.steel);
  [129, 133, 137, 141, 145].forEach((gx, i) => {
    if (i === 2 && !keystoneFound) {
      // the bare center spindle: an empty socket until the keystone is seated
      disc(buf, gx, 66, 1, PAL.black);
      set(buf, gx, 66, PAL.steelDark);
    } else {
      disc(buf, gx, 66, 1, PAL.brass);
      set(buf, gx, 66, PAL.brassLight);
    }
  });
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

  // ---- The Master Gearlock cabinet (hotspot x78-93%, y52-84%) --------------
  drawCabinet(buf, s.keystoneFound, s.cabinetOpened);

  // ---- Hidden capstone clue: flame △, ringed by 4 dots -> slot 4 -----------
  // Burned faintly into the wall between the lens and the cabinet. Matches the
  // "△ Gear" tile in the cabinet-gears puzzle. Pure decor, no state. Kept off
  // x102-104 -- the aligned lens beam runs there and would shred the glyph
  // (this capstone is usually played post-convergence, beam lit).
  drawGlyph(buf, "triangle", 116, 30, PAL.steelDark);
  drawDots(buf, 116, 30, 4, PAL.steelDark);

  blit(ctx, buf);
}

export function ArchiveArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  const state: ArchiveState = {
    lensFound: flags.lensFound === true,
    armed: flags.armed === true,
    aligned: flags.aligned === true,
    keystoneFound: flags.keystoneFound === true,
    cabinetOpened: flags.cabinetOpened === true,
  };
  const clueFound = flags.archiveClueFound === true;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, state, frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lensFound, state.armed, state.aligned, state.keystoneFound, state.cabinetOpened, frame]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
      {clueFound && (
        <span className="pixel-caption" style={{ left: "21%", top: "82%" }}>
          a haiku hides on the shelf
        </span>
      )}
      {/* Read-only hook for the verify suite, mirroring VaultArt's data-converge.
          Carries no visual weight; the cabinet look lives in the canvas above. */}
      <span
        className="sr-only"
        data-cabinet={state.cabinetOpened ? "open" : state.keystoneFound ? "ready" : "sealed"}
      />
    </div>
  );
}
