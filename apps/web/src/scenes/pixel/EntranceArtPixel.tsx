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

  // ---- The slumped automaton, now a seated colossus (x36-61, y45-86) -------
  // Black chassis with violet edge-light. Bigger than a person, hunched
  // against the wall, fists on the floor -- dormant, not harmless. Its
  // eyes pulse with the flicker frame.
  ditherRect(buf, 36, 85, 27, 2, PAL.black);
  // massive arms first (behind the torso), fists resting on the floor
  fillRect(buf, 37, 62, 4, 18, PAL.black);
  fillRect(buf, 58, 62, 3, 16, PAL.black);
  fillRect(buf, 36, 79, 6, 6, PAL.black);
  fillRect(buf, 56, 77, 5, 7, PAL.black);
  set(buf, 36, 79, PAL.purpleDim);
  set(buf, 37, 79, PAL.purpleDim);
  set(buf, 56, 77, PAL.purpleDim);
  // shoulder slab + hunched torso + folded base
  fillRect(buf, 39, 56, 21, 8, PAL.black);
  fillRect(buf, 41, 62, 17, 18, PAL.black);
  fillRect(buf, 40, 79, 19, 6, PAL.black);
  // rim light along the shoulders and the wall-side edge
  for (let x = 40; x < 59; x++) set(buf, x, 56, PAL.purpleDim);
  for (let y = 62; y < 80; y++) set(buf, 37, y, PAL.purpleDim);
  // plating seams across the torso
  for (let x = 42; x < 57; x += 3) {
    set(buf, x, 72, PAL.purpleDim);
    set(buf, x + 1, 77, PAL.purpleDim);
  }
  // aether core behind the chest plate, faint but alive
  fillRect(buf, 48, 66, 3, 3, PAL.purpleDim);
  set(buf, 49, 67, frame === 0 ? PAL.purple : PAL.purpleBright);
  // horned, angular head jutting forward off the shoulders
  fillRect(buf, 43, 48, 11, 9, PAL.black);
  fillRect(buf, 43, 45, 2, 3, PAL.black);
  fillRect(buf, 52, 45, 2, 3, PAL.black);
  set(buf, 43, 45, PAL.purpleDim);
  set(buf, 53, 45, PAL.purpleDim);
  for (let y = 48; y < 57; y++) set(buf, 43, y, PAL.purpleDim);
  // brow line, then both eyes -- pulsing, watching
  for (let x = 45; x < 52; x++) set(buf, x, 50, PAL.purpleDim);
  const eye = frame === 0 ? PAL.purpleBright : PAL.purple;
  fillRect(buf, 45, 52, 2, 1, eye);
  fillRect(buf, 49, 52, 2, 1, eye);

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
