import { useEffect, useRef } from "react";
import type { ArtProps } from "../artTypes";
import {
  createBuf,
  fillRect,
  frameRect,
  ditherRect,
  disc,
  ring,
  sprite,
  set,
  blit,
} from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, usePixelFrame } from "./dungeonKit";

// 8-bit Workshop Floor (proto-vault-8bit branch). The busiest scene: the
// Dormant Warden gets the same black+violet colossus treatment as the
// entrance automaton -- but bigger, standing, and in its own alcove. The
// engraving clue is rendered as real 3x5 pixel digits (it must be legible
// from a couch; it IS the valve puzzle). Geometry follows the hotspots in
// packages/content -- the warden box and the two side doors were adjusted
// there to fit the pixel layout (originals noted inline in scenes.ts).

const W = 160;
const H = 100;

// 3x5 pixel digits for the faded engraving.
const DIGITS: Record<string, string[]> = {
  "0": ["XXX", "X.X", "X.X", "X.X", "XXX"],
  "1": [".X.", "XX.", ".X.", ".X.", "XXX"],
  "2": ["XXX", "..X", "XXX", "X..", "XXX"],
  "3": ["XXX", "..X", ".XX", "..X", "XXX"],
};

interface WorkshopState {
  valveFound: boolean;
  allComponents: boolean;
  allPlaced: boolean;
  armed: boolean;
  vented: boolean;
}

function drawWarden(buf: ReturnType<typeof createBuf>, frame: number): void {
  // Alcove: a recessed stone niche, floor to arch (x18-40, y14-78). The
  // interior stays mortar-toned -- the Warden is a BLACK chassis and needs
  // something to silhouette against.
  fillRect(buf, 18, 16, 22, 62, PAL.mortar);
  for (let y = 17; y < 78; y++) {
    set(buf, 19, y, PAL.black);
    set(buf, 38, y, PAL.black);
  }
  for (let y = 16; y < 78; y++) {
    set(buf, 18, y, PAL.steelDark);
    set(buf, 39, y, PAL.steelDark);
  }
  for (let x = 18; x < 40; x++) set(buf, x, 15, PAL.steelDark);
  for (let x = 20; x < 38; x++) set(buf, x, 16, PAL.black);

  // The Warden: standing colossus, black chassis, violet edge-light.
  // legs
  fillRect(buf, 23, 60, 4, 14, PAL.black);
  fillRect(buf, 31, 60, 4, 14, PAL.black);
  fillRect(buf, 22, 74, 6, 3, PAL.black);
  fillRect(buf, 30, 74, 6, 3, PAL.black);
  set(buf, 22, 74, PAL.purpleDim);
  set(buf, 35, 74, PAL.purpleDim);
  // arms hanging outside the torso, fists at mid-thigh
  fillRect(buf, 19, 40, 3, 20, PAL.black);
  fillRect(buf, 36, 40, 3, 20, PAL.black);
  fillRect(buf, 18, 60, 5, 5, PAL.black);
  fillRect(buf, 35, 60, 5, 5, PAL.black);
  set(buf, 18, 60, PAL.purpleDim);
  set(buf, 39, 60, PAL.purpleDim);
  // shoulder slab + torso
  fillRect(buf, 20, 34, 18, 8, PAL.black);
  fillRect(buf, 21, 38, 16, 22, PAL.black);
  for (let x = 21; x < 38; x++) set(buf, x, 34, PAL.purpleDim);
  for (let y = 38; y < 60; y++) set(buf, 21, y, PAL.purpleDim);
  // plating seams
  for (let x = 22; x < 37; x += 3) {
    set(buf, x, 48, PAL.purpleDim);
    set(buf, x + 1, 54, PAL.purpleDim);
  }
  // aether furnace behind the chest plate -- banked, not out
  fillRect(buf, 27, 43, 4, 4, PAL.purpleDim);
  set(buf, 28, 44, frame === 0 ? PAL.purple : PAL.purpleBright);
  set(buf, 29, 45, PAL.purple);
  // horned head
  fillRect(buf, 24, 25, 10, 9, PAL.black);
  fillRect(buf, 24, 22, 2, 3, PAL.black);
  fillRect(buf, 32, 22, 2, 3, PAL.black);
  set(buf, 24, 22, PAL.purpleDim);
  set(buf, 33, 22, PAL.purpleDim);
  for (let y = 25; y < 34; y++) set(buf, 24, y, PAL.purpleDim);
  // brow + heavy eyes, pulsing on the flicker frame
  for (let x = 26; x < 33; x++) set(buf, x, 27, PAL.purpleDim);
  const eye = frame === 0 ? PAL.purpleBright : PAL.purple;
  fillRect(buf, 26, 29, 2, 2, eye);
  fillRect(buf, 31, 29, 2, 2, eye);
}

function draw(ctx: CanvasRenderingContext2D, s: WorkshopState, frame: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  // Left torch hangs above the archive doorway; right one over the bench.
  drawTorch(buf, 7, 42, frame);
  drawTorch(buf, 112, 26, frame === 0 ? 1 : 0);

  drawWarden(buf, frame);

  // ---- Vault door, top center (hotspot x45-55%, y4-18%) --------------------
  fillRect(buf, 70, 5, 20, 14, PAL.steelDark);
  frameRect(buf, 70, 5, 20, 14, s.allComponents ? PAL.purpleBright : PAL.steel);
  disc(buf, 80, 12, 3, PAL.brass);
  set(buf, 80, 12, PAL.brassLight);
  set(buf, 79, 11, PAL.brassLight);
  for (const [bx, by] of [[72, 7], [88, 7], [72, 17], [88, 17]] as const) {
    set(buf, bx, by, s.allComponents ? PAL.purpleBright : PAL.brass);
  }

  // ---- Spire stairwell (allPlaced; hotspot x25-33%, y13-33%) ---------------
  if (s.allPlaced) {
    fillRect(buf, 40, 13, 13, 20, PAL.black);
    frameRect(buf, 40, 13, 13, 20, PAL.purpleBright);
    // steps climbing into the dark
    for (let i = 0; i < 4; i++) {
      for (let x = 42 + i * 2; x < 52; x++) set(buf, x, 30 - i * 4, PAL.floorLight);
    }
  }

  // ---- Pipe assembly + engraving (hotspot x36-65%, y30-44%) ----------------
  // plaque with the faded engraving: 2-0-1-3, one digit above each valve
  fillRect(buf, 58, 28, 44, 8, PAL.steelDark);
  frameRect(buf, 58, 28, 44, 8, PAL.steel);
  const code = ["2", "0", "1", "3"];
  code.forEach((d, i) => {
    sprite(buf, 65 + i * 10, 30, DIGITS[d], PAL.paper);
    if (i < 3) set(buf, 70 + i * 10, 32, PAL.steel);
  });
  // main pipe run with vertical drops at both ends
  fillRect(buf, 60, 38, 41, 3, PAL.steel);
  for (let x = 60; x < 101; x++) set(buf, x, 38, PAL.wallLight);
  for (let x = 60; x < 101; x++) set(buf, x, 40, PAL.steelDark);
  fillRect(buf, 60, 41, 3, 37, PAL.steel);
  fillRect(buf, 98, 41, 3, 37, PAL.steel);
  for (let y = 41; y < 78; y++) {
    set(buf, 62, y, PAL.steelDark);
    set(buf, 100, y, PAL.steelDark);
  }
  for (const [fx, fy] of [[60, 41], [98, 41]] as const) {
    fillRect(buf, fx - 1, fy, 5, 2, PAL.brass);
    set(buf, fx - 1, fy, PAL.brassLight);
  }
  // four valve wheels on the main run: brass while the puzzle is live,
  // dulled steel once the key is claimed
  for (let i = 0; i < 4; i++) {
    const cx = 66 + i * 10;
    disc(buf, cx, 39, 3, s.valveFound ? PAL.steelDark : PAL.brass);
    ring(buf, cx, 39, 3, s.valveFound ? PAL.steel : PAL.brassLight);
    set(buf, cx, 39, s.valveFound ? PAL.steel : PAL.steelDark);
  }

  // ---- Overflow valve (armed; hotspot x67-74%, y42-52%) --------------------
  if (s.armed) {
    fillRect(buf, 101, 46, 9, 2, PAL.steel);
    set(buf, 101, 46, PAL.wallLight);
    disc(buf, 113, 47, 4, s.vented ? PAL.steelDark : PAL.brass);
    ring(buf, 113, 47, 4, s.vented ? PAL.steel : PAL.brassLight);
    set(buf, 113, 47, PAL.steelDark);
    if (!s.vented) {
      // pressure wants out: the rim sparks violet until someone turns it
      set(buf, 113, 42, frame === 0 ? PAL.purpleBright : PAL.purple);
      set(buf, 117, 47, frame === 0 ? PAL.purple : PAL.purpleBright);
    } else {
      // steam hissing free, drifting with the flicker frame
      const drift = frame === 0 ? 0 : 1;
      for (const [px, py] of [[111, 41], [114, 39], [112, 36], [116, 42]] as const) {
        set(buf, px + drift, py, PAL.white);
      }
    }
  }

  // ---- Workbench (hotspot x76-95%, y60-70%) --------------------------------
  fillRect(buf, 122, 62, 29, 3, PAL.wood);
  for (let x = 122; x < 151; x++) set(buf, x, 62, PAL.woodLight);
  fillRect(buf, 123, 65, 2, 13, PAL.woodDark);
  fillRect(buf, 148, 65, 2, 13, PAL.woodDark);
  // tools: a brass wrench, a steel hammer, and a rod still glowing hot
  fillRect(buf, 126, 60, 5, 1, PAL.brass);
  set(buf, 126, 59, PAL.brassLight);
  set(buf, 130, 59, PAL.brassLight);
  fillRect(buf, 135, 58, 2, 4, PAL.steelDark);
  fillRect(buf, 134, 58, 4, 2, PAL.steel);
  fillRect(buf, 141, 60, 6, 1, PAL.ember);
  set(buf, 146, 60, frame === 0 ? PAL.flameCore : PAL.flame);

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

  blit(ctx, buf);
}

export function WorkshopArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  const state: WorkshopState = {
    valveFound: flags.valveFound === true,
    allComponents:
      flags.heartFound === true && flags.lensFound === true && flags.valveFound === true,
    allPlaced: flags.allPlaced === true,
    armed: flags.armed === true,
    vented: flags.vented === true,
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, state, frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.valveFound, state.allComponents, state.allPlaced, state.armed, state.vented, frame]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
    </div>
  );
}
