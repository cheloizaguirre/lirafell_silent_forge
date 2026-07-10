import { useEffect, useRef } from "react";
import type { ArtProps } from "../artTypes";
import {
  createBuf,
  fillRect,
  ditherRect,
  ring,
  set,
  blit,
} from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, usePixelFrame } from "./dungeonKit";

// 8-bit Prison Cell (proto-vault-8bit branch). The layering IS the scene:
// the room shell plays the corridor beyond the bars (torch burning out
// there, out of reach), a gloom dither darkens everything, black iron bars
// drop in front of it all, and the foreground holds what's in the cell with
// us -- straw, a cot, chains, and the corroded grate, which rattles a pixel
// on the flicker frame because it's the way out. Black-on-black lesson from
// the tome recess applied: everything black sits against lit backdrop.

const W = 160;
const H = 100;

// x positions of the cage bars (SVG x100+i*80, /5 -> 20+i*16).
const BARS = [20, 36, 52, 68, 84, 100, 116, 132] as const;

function draw(ctx: CanvasRenderingContext2D, frame: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  // The corridor beyond: a torch we can't reach, and a sliver of night
  // through a high barred window -- cold blue against the warm fire.
  drawTorch(buf, 76, 28, frame);
  fillRect(buf, 118, 8, 10, 8, PAL.black);
  for (let x = 118; x < 128; x++) set(buf, x, 7, PAL.steelDark);
  for (let y = 8; y < 16; y++) {
    set(buf, 117, y, PAL.steelDark);
    set(buf, 128, y, PAL.steelDark);
  }
  set(buf, 121, 8, PAL.steelDark);
  set(buf, 124, 8, PAL.steelDark);
  for (let y = 9; y < 16; y++) {
    set(buf, 121, y, PAL.steelDark);
    set(buf, 124, y, PAL.steelDark);
  }
  set(buf, 119, 9, PAL.lensLight);
  ditherRect(buf, 117, 16, 12, 5, PAL.lensDim, true);

  // Cell gloom: an irregular ~9% scatter of dark pixels. A regular checker
  // dither at this size moires against the brickwork and reads as mesh,
  // not shadow -- learned by screenshot.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if ((x * 13 + y * 7) % 11 === 0) set(buf, x, y, PAL.black);
    }
  }

  // The cage: full-height iron bars with two cross-rails -- black iron,
  // one steel edge column so the rounds catch the torchlight.
  for (const rail of [14, 66] as const) {
    fillRect(buf, 12, rail, 136, 3, PAL.black);
    for (let x = 12; x < 148; x++) set(buf, x, rail, PAL.steelDark);
  }
  for (const bx of BARS) {
    fillRect(buf, bx, 6, 3, 84, PAL.black);
    for (let y = 6; y < 90; y++) set(buf, bx + 2, y, PAL.steelDark);
  }

  // ---- Inside the cell (foreground, drawn over the bars) -------------------
  // straw heaped in the corner
  ditherRect(buf, 26, 83, 22, 5, PAL.floorLight);
  for (const [sx, sy] of [[30, 84], [38, 86], [44, 83]] as const) {
    set(buf, sx, sy, PAL.paper);
  }
  // a plank cot, thin blanket, sad pillow
  fillRect(buf, 112, 80, 28, 3, PAL.wood);
  for (let x = 112; x < 140; x++) set(buf, x, 80, PAL.woodLight);
  fillRect(buf, 113, 83, 2, 5, PAL.woodDark);
  fillRect(buf, 137, 83, 2, 5, PAL.woodDark);
  fillRect(buf, 126, 79, 10, 2, PAL.steelDark);
  fillRect(buf, 114, 78, 6, 2, PAL.paper);
  // chains hanging from the cell ceiling, shackles open
  for (const [cx, len] of [[12, 18], [148, 12]] as const) {
    for (let y = 3; y < len; y += 3) {
      fillRect(buf, cx, y, 2, 2, PAL.black);
      set(buf, cx, y, PAL.steelDark);
    }
    ring(buf, cx + 1, len + 2, 2, PAL.steelDark);
  }

  // The corroded floor grate (hotspot x41-49%, y74-82%): rattling loosely --
  // it shifts a pixel with the flicker frame. Rust on the slats, a violet
  // glint in the corner: this is the way out, and it knows it.
  const gx = 66 + frame;
  fillRect(buf, gx, 75, 12, 7, PAL.black);
  for (let x = gx; x < gx + 12; x++) {
    set(buf, x, 75, PAL.steel);
    set(buf, x, 81, PAL.steelDark);
  }
  for (let y = 75; y < 82; y++) {
    set(buf, gx, y, PAL.steel);
    set(buf, gx + 11, y, PAL.steelDark);
  }
  for (const sx of [3, 6, 9] as const) {
    for (let y = 76; y < 81; y++) set(buf, gx + sx, y, PAL.steelDark);
  }
  set(buf, gx + 4, 77, PAL.ember);
  set(buf, gx + 8, 79, PAL.ember);
  set(buf, gx + 6, 80, PAL.ember);
  set(buf, gx + 10, 76, frame === 0 ? PAL.purpleBright : PAL.purple);

  blit(ctx, buf);
}

export function PrisonArtPixel(_props: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, frame);
  }, [frame]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
      <span className="pixel-caption" style={{ left: "45%", top: "86%" }}>
        a corroded floor grate rattles loosely
      </span>
    </div>
  );
}
