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
} from "./pixelCanvas";
import { PAL, drawSpireTop, drawTorch, usePixelFrame } from "./dungeonKit";

// 8-bit Aether Spire (proto-vault-8bit branch). The only outdoor scene:
// drawSpireTop's night sky, starfield, and parapet replace the dungeon
// brick. The great dial is the source of the Archive's clue, so the armed
// sigil is drawn huge -- a pixel ☉, double ring + core, pulsing violet in a
// dithered haze; dormant is a dead mortar face with brass quarter-ticks.
// The lever keeps its violet glint until thrown (SVG parity), and the beam
// the Archive receives is fired here: sputtering skyward while armed,
// solid once the lens aligns.

const W = 160;
const H = 100;

interface SpireState {
  armed: boolean;
  aligned: boolean;
}

function draw(ctx: CanvasRenderingContext2D, s: SpireState, frame: number): void {
  const buf = createBuf(W, H, PAL.black);
  drawSpireTop(buf);

  drawTorch(buf, 18, 50, frame);
  drawTorch(buf, 137, 50, frame === 0 ? 1 : 0);

  // the beam, fired from the dial into the sky
  if (s.aligned) {
    fillRect(buf, 79, 0, 3, 23, PAL.purple);
    for (let y = 0; y < 23; y++) set(buf, 80, y, PAL.purpleBright);
  } else if (s.armed && frame === 0) {
    ditherRect(buf, 79, 0, 3, 23, PAL.purpleDim);
  }

  // ---- the mast that carries the dial --------------------------------------
  fillRect(buf, 72, 50, 16, 28, PAL.wall);
  for (let y = 50; y < 78; y++) {
    set(buf, 72, y, PAL.wallLight);
    set(buf, 87, y, PAL.mortar);
  }
  for (let x = 73; x < 87; x++) set(buf, x, 55, PAL.mortar);
  // steel struts up to the dial ring
  set(buf, 71, 49, PAL.steel);
  set(buf, 70, 48, PAL.steel);
  set(buf, 88, 49, PAL.steel);
  set(buf, 89, 48, PAL.steel);

  // ---- the great dial (SVG cx400 cy180 r70, /5) -----------------------------
  disc(buf, 80, 36, 14, PAL.steelDark);
  ring(buf, 80, 36, 14, PAL.steel);
  disc(buf, 80, 36, 12, PAL.mortar);
  // brass quarter-ticks
  set(buf, 80, 25, PAL.brass);
  set(buf, 80, 47, PAL.brass);
  set(buf, 69, 36, PAL.brass);
  set(buf, 91, 36, PAL.brass);
  if (s.armed) {
    // the sigil ☉: big and unmissable -- this is the clue the Archive needs
    ditherDisc(buf, 80, 36, 11, PAL.purpleDim, true);
    ring(buf, 80, 36, 8, frame === 0 ? PAL.purpleBright : PAL.purple);
    ring(buf, 80, 36, 7, PAL.purple);
    disc(buf, 80, 36, 3, frame === 0 ? PAL.purpleBright : PAL.purple);
  }

  // ---- the great lever (hotspot x44-56%, y60-68%) ---------------------------
  fillRect(buf, 73, 61, 14, 9, PAL.steelDark);
  frameRect(buf, 73, 61, 14, 9, PAL.steel);
  fillRect(buf, 76, 64, 2, 2, PAL.brass); // pivot boss
  if (s.armed) {
    // thrown: arm resting down-right, knob gone dull
    set(buf, 78, 66, PAL.brass);
    set(buf, 79, 67, PAL.brass);
    set(buf, 80, 67, PAL.brass);
    set(buf, 81, 68, PAL.brass);
    fillRect(buf, 82, 69, 3, 3, PAL.brass);
    set(buf, 82, 69, PAL.brassLight);
  } else {
    // cocked: arm up-right, bright knob, violet come-pull-me glint
    set(buf, 78, 64, PAL.brass);
    set(buf, 79, 63, PAL.brass);
    set(buf, 80, 63, PAL.brass);
    set(buf, 81, 62, PAL.brass);
    set(buf, 82, 61, PAL.brass);
    fillRect(buf, 83, 58, 3, 3, PAL.brassLight);
    set(buf, 83, 58, PAL.brassBright);
    set(buf, 86, 57, frame === 0 ? PAL.purpleBright : PAL.purple);
  }

  blit(ctx, buf);
}

export function SpireArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  const state: SpireState = {
    armed: flags.armed === true,
    aligned: flags.aligned === true,
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, state, frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.armed, state.aligned, frame]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
      <span className="pixel-caption" style={{ left: "50%", top: "84%" }}>
        {state.armed ? "the lever rests, thrown" : "a great brass lever"}
      </span>
    </div>
  );
}
