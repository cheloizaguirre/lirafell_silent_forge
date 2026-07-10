import { useEffect, useRef } from "react";
import type { ArtProps } from "../artTypes";
import {
  createBuf,
  fillRect,
  frameRect,
  ditherRect,
  disc,
  ditherDisc,
  set,
  blit,
} from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, usePixelFrame } from "./dungeonKit";

// 8-bit Entrance Hall (proto-vault-8bit branch). Static scene -- no flags
// drive it -- but the same rules as the Vault: geometry mirrors the SVG
// original's percentage positions (800x500 / 5) so the great-door, automaton,
// and writing-desk hotspots line up unchanged.

const W = 160;
const H = 100;

function draw(ctx: CanvasRenderingContext2D, frame: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  // Torches flank the great door (clear of every hotspot region).
  drawTorch(buf, 50, 28, frame);
  drawTorch(buf, 105, 28, frame === 0 ? 1 : 0);

  // ---- The Great Door (SVG arch x320-480, apex ~y60 -> x64-96) -------------
  // Stone surround first, then the wooden door inset into it.
  disc(buf, 80, 30, 19, PAL.steelDark);
  fillRect(buf, 61, 30, 39, 48, PAL.steelDark);
  disc(buf, 80, 30, 16, PAL.wood);
  fillRect(buf, 64, 30, 33, 48, PAL.wood);
  // plank grain + center seam
  for (const px of [68, 72, 76, 84, 88, 92]) {
    for (let y = px % 8 === 0 ? 20 : 17; y < 78; y++) set(buf, px, y, PAL.woodDark);
  }
  for (let y = 15; y < 78; y++) {
    set(buf, 80, y, PAL.woodDark);
    set(buf, 81, y, PAL.woodDark);
  }
  // arch shadow tucks the door under its frame
  ditherRect(buf, 64, 14, 33, 3, PAL.black);
  // brass hinges + ring handles
  for (const hy of [28, 48, 68] as const) {
    fillRect(buf, 65, hy, 3, 2, PAL.brass);
    fillRect(buf, 93, hy, 3, 2, PAL.brass);
    set(buf, 65, hy, PAL.brassLight);
    set(buf, 95, hy, PAL.brassLight);
  }
  frameRect(buf, 75, 50, 3, 3, PAL.brassLight);
  frameRect(buf, 83, 50, 3, 3, PAL.brassLight);
  // threshold step
  fillRect(buf, 62, 78, 37, 2, PAL.steel);
  for (let x = 62; x < 99; x++) set(buf, x, 78, PAL.wallLight);

  // Stone ledge over the arch (the SVG's ellipse lintel) + the aether lamp
  // on its spike -- the one violet note in the room.
  fillRect(buf, 67, 11, 27, 3, PAL.steel);
  for (let x = 67; x < 94; x++) set(buf, x, 11, PAL.wallLight);
  for (let y = 5; y < 11; y++) set(buf, 80, y, PAL.steelDark);
  ditherDisc(buf, 80, 4, 4, PAL.purpleDim);
  disc(buf, 80, 4, 2, PAL.purple);
  set(buf, 80, 3, PAL.purpleBright);

  // ---- Slumped automaton (SVG ~x236-264, y345-430 -> x47-53, y69-86) -------
  // Black chassis with violet edge-light: steel faded into the slate wall.
  ditherRect(buf, 44, 85, 13, 2, PAL.black);
  // legs splayed on the floor
  fillRect(buf, 45, 82, 4, 3, PAL.black);
  fillRect(buf, 52, 82, 4, 3, PAL.black);
  set(buf, 45, 82, PAL.purpleDim);
  set(buf, 55, 82, PAL.purpleDim);
  // torso leaning into the wall
  fillRect(buf, 47, 72, 7, 11, PAL.black);
  for (let y = 72; y < 83; y++) set(buf, 47, y, PAL.purpleDim);
  set(buf, 48, 72, PAL.purpleDim);
  // chest plate, its aether core long dead
  fillRect(buf, 48, 75, 4, 3, PAL.purpleDim);
  set(buf, 49, 76, PAL.purple);
  // head lolled to one side; one eye still faintly lit
  disc(buf, 49, 69, 3, PAL.black);
  set(buf, 47, 67, PAL.purpleDim);
  set(buf, 48, 66, PAL.purpleDim);
  set(buf, 49, 66, PAL.purpleDim);
  set(buf, 48, 69, PAL.purpleBright);
  set(buf, 51, 69, PAL.purpleDim);
  // limp arm
  fillRect(buf, 54, 76, 2, 6, PAL.black);
  set(buf, 54, 76, PAL.purpleDim);

  // ---- Writing desk (SVG x560-650, y360-435 -> x112-130, y72-87) -----------
  ditherRect(buf, 111, 86, 20, 2, PAL.black);
  fillRect(buf, 112, 74, 18, 10, PAL.wood);
  for (let x = 112; x < 130; x++) set(buf, x, 74, PAL.woodLight);
  for (const gx of [117, 123] as const) {
    for (let y = 76; y < 84; y++) set(buf, gx, y, PAL.woodDark);
  }
  fillRect(buf, 112, 84, 2, 3, PAL.woodDark);
  fillRect(buf, 128, 84, 2, 3, PAL.woodDark);
  // the half-burned note
  fillRect(buf, 114, 71, 5, 3, PAL.paper);
  set(buf, 115, 72, PAL.woodDark);
  set(buf, 117, 72, PAL.woodDark);
  set(buf, 118, 71, PAL.ember); // singed corner
  // a stub of candle, still burning
  fillRect(buf, 125, 70, 2, 4, PAL.paper);
  set(buf, 125, 70, PAL.white);
  set(buf, 125 + (frame === 0 ? 0 : 1), 68, PAL.flameCore);
  set(buf, 125, 69, PAL.flame);
  set(buf, 126, 69, PAL.ember);
  ditherDisc(buf, 125, 69, 4, PAL.flame, true);

  blit(ctx, buf);
}

export function EntranceArtPixel(_props: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, frame);
  }, [frame]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
    </div>
  );
}
