import { useEffect, useState } from "react";
import type { Buf, RGB } from "./pixelCanvas";
import { fillRect, ditherRect, disc, ditherDisc, set, sprite, rgb } from "./pixelCanvas";

// Shared dressing for the 8-bit scenes: the palette, the dungeon room shell
// (mottled brickwork, vignette, tiled floor), wall torches, and the 2-frame
// flicker hook. Scene components add their own props on top of this.
//
// The palette deliberately breaks from the app's muted dark chrome (user
// decision 2026-07-10): scene sprites go saturated game-style. The UI around
// the canvas stays muted.

export const PAL = {
  // room
  black: rgb("#0b0c0e"),
  wall: rgb("#262b3d"),
  wallLight: rgb("#333a52"),
  mortar: rgb("#1a1e2c"),
  floor: rgb("#3d3226"),
  floorLine: rgb("#2a2118"),
  floorLight: rgb("#56472f"),
  // wood & paper
  wood: rgb("#7a5230"),
  woodDark: rgb("#55381e"),
  woodLight: rgb("#97693c"),
  paper: rgb("#e8dcc0"),
  // metals
  steel: rgb("#6a7287"),
  steelDark: rgb("#454c61"),
  brass: rgb("#8a6a3a"),
  brassLight: rgb("#c9a24a"),
  brassBright: rgb("#ffe08a"),
  // fire
  ember: rgb("#c03a2a"),
  flame: rgb("#e07830"),
  flameCore: rgb("#ffd35c"),
  // items
  heartRed: rgb("#d04a5a"),
  heartLight: rgb("#ff8f9d"),
  heartDim: rgb("#6e3038"),
  lensCyan: rgb("#3fb8c9"),
  lensLight: rgb("#9ef0ff"),
  lensDim: rgb("#28626c"),
  // aether
  purple: rgb("#8b5fbf"),
  purpleBright: rgb("#c9a3ff"),
  purpleDim: rgb("#5c4577"),
  white: rgb("#f0f0f4"),
};

// Two flame frames a pixel apart -- the whole "animation" budget.
const FLAME_A = [
  "..X..",
  ".XX..",
  ".XXX.",
  "XXXX.",
  ".XXX.",
];
const FLAME_B = [
  "..X..",
  "..XX.",
  ".XXX.",
  ".XXXX",
  ".XXX.",
];

// The standard room shell: brickwork from the top down to the floor seam at
// y=78, warm tiled floor below, dithered vignette at the edges. Scenes draw
// their furniture over this.
export function drawRoom(buf: Buf): void {
  const { w: W, h: H } = buf;

  // Brickwork: dark mortar courses, staggered joints, and a deterministic
  // scatter of lit brick top-edges so the wall reads mottled, not flat.
  for (let y = 6; y < 78; y += 6) {
    for (let x = 0; x < W; x++) set(buf, x, y, PAL.mortar);
    const offset = (y / 6) % 2 === 0 ? 0 : 8;
    for (let x = offset - 16; x < W; x += 16) {
      for (let dy = 1; dy < 6; dy++) set(buf, x, y + dy, PAL.mortar);
      if ((x * 7 + y * 13) % 3 !== 0) {
        for (let dx = 2; dx < 15; dx++) set(buf, x + dx, y + 1, PAL.wallLight);
      }
    }
  }
  // Dithered vignette pulls the edges into darkness.
  ditherRect(buf, 0, 0, W, 8, PAL.black);
  ditherRect(buf, 0, 0, 8, H, PAL.black);
  ditherRect(buf, W - 8, 0, 8, H, PAL.black);
  fillRect(buf, 0, 0, W, 3, PAL.black);

  // Warm stone floor: worn top edge, tile joints, dark falloff at the front.
  fillRect(buf, 0, 78, W, H - 78, PAL.floor);
  for (let x = 0; x < W; x++) set(buf, x, 78, PAL.floorLight);
  for (let x = 0; x < W; x++) set(buf, x, 79, PAL.floorLine);
  for (let y = 84; y < H; y += 6) for (let x = 0; x < W; x++) set(buf, x, y, PAL.floorLine);
  for (let x = 8; x < W; x += 20) {
    for (let y = 80; y < H; y++) set(buf, x, y, PAL.floorLine);
  }
  ditherRect(buf, 0, 81, W, 3, PAL.floorLight, true);
  ditherRect(buf, 0, 92, W, H - 92, PAL.black, true);
}

// Night-sky shell for the top of the Spire -- the one plausibly-outdoor
// scene. Keeps drawRoom's conventions (floor seam at y=78, edge vignette,
// same warm platform stone) so scene coords and kit habits carry over;
// above the crenellated parapet it's open sky, stars, and a crescent moon.
export function drawSpireTop(buf: Buf): void {
  const { w: W, h: H } = buf;

  // starfield: two deterministic scatters, dim steel and rare white
  fillRect(buf, 0, 0, W, 64, PAL.black);
  for (let y = 0; y < 58; y++) {
    for (let x = 0; x < W; x++) {
      if ((x * 53 + y * 97) % 167 === 0) set(buf, x, y, PAL.steel);
      if ((x * 31 + y * 61) % 373 === 0) set(buf, x, y, PAL.white);
    }
  }
  // crescent moon -- the scene's one cold note
  disc(buf, 28, 13, 5, PAL.lensLight);
  disc(buf, 30, 12, 4, PAL.black);

  // crenellated parapet: merlons first, then the wall walk below
  for (let x = 0; x < W; x += 16) {
    fillRect(buf, x, 58, 9, 6, PAL.wall);
    for (let dx = 0; dx < 9; dx++) set(buf, x + dx, 58, PAL.wallLight);
  }
  fillRect(buf, 0, 64, W, 14, PAL.wall);
  for (let x = 0; x < W; x++) set(buf, x, 64, PAL.wallLight);
  for (const my of [69, 74] as const) {
    for (let x = 0; x < W; x++) set(buf, x, my, PAL.mortar);
  }
  for (let x = 5; x < W; x += 14) for (let y = 65; y < 69; y++) set(buf, x, y, PAL.mortar);
  for (let x = 12; x < W; x += 14) for (let y = 70; y < 74; y++) set(buf, x, y, PAL.mortar);

  // stone platform, same treatment as drawRoom's floor
  fillRect(buf, 0, 78, W, H - 78, PAL.floor);
  for (let x = 0; x < W; x++) set(buf, x, 78, PAL.floorLight);
  for (let x = 0; x < W; x++) set(buf, x, 79, PAL.floorLine);
  for (let y = 84; y < H; y += 6) for (let x = 0; x < W; x++) set(buf, x, y, PAL.floorLine);
  for (let x = 8; x < W; x += 20) {
    for (let y = 80; y < H; y++) set(buf, x, y, PAL.floorLine);
  }
  ditherRect(buf, 0, 81, W, 3, PAL.floorLight, true);
  ditherRect(buf, 0, 92, W, H - 92, PAL.black, true);

  // edge vignette (the sky is already dark; the sides still need the pull)
  ditherRect(buf, 0, 0, 8, H, PAL.black);
  ditherRect(buf, W - 8, 0, 8, H, PAL.black);
}

// 3x5 pixel digits. Digits are the one kind of text that works as canvas
// pixels (design rule #1); currently used for the 2-0-1-3 code note behind
// the prison brick.
const DIGITS: Record<string, string[]> = {
  "0": ["XXX", "X.X", "X.X", "X.X", "XXX"],
  "1": [".X.", "XX.", ".X.", ".X.", "XXX"],
  "2": ["XXX", "..X", "XXX", "X..", "XXX"],
  "3": ["XXX", "..X", ".XX", "..X", "XXX"],
};

// Draws a digit string (e.g. "2013") at 3x5 per glyph with a 1px gap; any
// non-digit character advances the cursor (renders as a space).
export function drawDigits(buf: Buf, x: number, y: number, text: string, color: RGB): void {
  let cx = x;
  for (const ch of text) {
    const glyph = DIGITS[ch];
    if (glyph) sprite(buf, cx, y, glyph, color);
    cx += 4;
  }
}

export function drawTorch(buf: Buf, x: number, y: number, frame: number): void {
  // warm glow halo first, so the flame draws over it
  ditherDisc(buf, x + 2, y, 8, PAL.brass, true);
  ditherDisc(buf, x + 2, y, 5, PAL.flame, true);
  // bracket
  fillRect(buf, x + 1, y + 4, 3, 6, PAL.brass);
  set(buf, x + 1, y + 4, PAL.brassLight);
  set(buf, x, y + 10, PAL.steelDark);
  set(buf, x + 4, y + 10, PAL.steelDark);
  // layered flame: ember edge, orange body, yellow core
  sprite(buf, x, y - 2, frame === 0 ? FLAME_A : FLAME_B, PAL.ember);
  sprite(buf, x, y - 1, frame === 0 ? FLAME_A : FLAME_B, PAL.flame);
  set(buf, x + 2, y + 1, PAL.flameCore);
  set(buf, x + 2, y + 2, PAL.flameCore);
  set(buf, x + (frame === 0 ? 1 : 3), y, PAL.flameCore);
}

// 2-frame flicker driver shared by every pixel scene.
export function usePixelFrame(intervalMs = 600): number {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return frame;
}
