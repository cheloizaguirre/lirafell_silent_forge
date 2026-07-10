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
import type { Buf } from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, usePixelFrame } from "./dungeonKit";

// 8-bit Gallery of Automatons (proto-vault-8bit branch). The SVG showed five
// identical silhouettes; here item-identity thinking applies to the suspects:
// five distinct exhibits (clockwork spider, brass owl, piston hound, cuckoo
// cannon, silent butler) so the plaque riddle plays against sprites you can
// actually tell apart. The four alarmed automatons watch with ember eyes that
// pulse on the flicker frame; the butler -- the one that never sang -- stands
// calm, a dim crimson glint behind its chest panel. Once the heart is taken,
// every eye goes dark and the butler's panel hangs open and empty.

const W = 160;
const H = 100;

// Case geometry mirrors the SVG (x60+i*140 w110 y150 h220, /5) and fills the
// automaton-displays hotspot (x7.5-90.5%, y30-74%).
const CASE_X = [12, 40, 68, 96, 124] as const;

// An alarmed automaton's eye: ember, pulsing on the flicker frame. Dark once
// the gallery is beaten.
function eye(buf: Buf, x: number, y: number, lit: boolean, frame: number): void {
  set(buf, x, y, lit ? (frame === 0 ? PAL.ember : PAL.flame) : PAL.steelDark);
}

// Museum display case: wood cabinet, brass studs, a glass window over a lit
// slate backing (never dark-on-dark), a steel specimen plinth, and an
// engraved brass nameplate.
function drawCase(buf: Buf, x: number): void {
  fillRect(buf, x + 2, 74, 2, 4, PAL.woodDark);
  fillRect(buf, x + 18, 74, 2, 4, PAL.woodDark);
  fillRect(buf, x, 30, 22, 44, PAL.wood);
  frameRect(buf, x, 30, 22, 44, PAL.woodDark);
  for (let dx = 1; dx < 21; dx++) set(buf, x + dx, 30, PAL.woodLight);
  set(buf, x + 1, 31, PAL.brassLight);
  set(buf, x + 20, 31, PAL.brassLight);
  // the glass window
  fillRect(buf, x + 2, 33, 18, 32, PAL.wallLight);
  fillRect(buf, x + 3, 61, 16, 4, PAL.steelDark);
  for (let dx = 3; dx < 19; dx++) set(buf, x + dx, 61, PAL.steel);
  // sparse diagonal glass glints
  set(buf, x + 16, 35, PAL.white);
  set(buf, x + 14, 37, PAL.white);
  set(buf, x + 12, 39, PAL.white);
  // nameplate with engraving specks
  fillRect(buf, x + 7, 67, 8, 3, PAL.brass);
  set(buf, x + 7, 67, PAL.brassLight);
  set(buf, x + 9, 68, PAL.black);
  set(buf, x + 12, 68, PAL.black);
}

function drawSpider(buf: Buf, cx: number, lit: boolean, frame: number): void {
  // three arched legs per side, lowest pair reaching the plinth
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const ay = 51 + i * 3;
      set(buf, cx + s * 5, ay, PAL.steelDark);
      set(buf, cx + s * 6, ay + 1, PAL.steelDark);
      set(buf, cx + s * 7, ay + 2, PAL.steelDark);
    }
    set(buf, cx + s * 7, 60, PAL.steelDark);
  }
  disc(buf, cx, 54, 4, PAL.steel);
  ring(buf, cx, 54, 4, PAL.steelDark);
  ditherRect(buf, cx - 2, 56, 5, 2, PAL.steelDark);
  // mandibles
  set(buf, cx - 1, 59, PAL.steelDark);
  set(buf, cx + 1, 59, PAL.steelDark);
  eye(buf, cx - 1, 53, lit, frame);
  eye(buf, cx + 1, 53, lit, frame);
}

function drawOwl(buf: Buf, cx: number, lit: boolean, frame: number): void {
  // perch bar
  fillRect(buf, cx - 6, 58, 13, 2, PAL.wood);
  for (let x = cx - 6; x < cx + 7; x++) set(buf, x, 58, PAL.woodLight);
  // body with a dithered belly and dark wing seams
  disc(buf, cx, 51, 5, PAL.brass);
  ditherRect(buf, cx - 2, 52, 5, 4, PAL.brassLight);
  for (let y = 49; y < 55; y++) {
    set(buf, cx - 4, y, PAL.woodDark);
    set(buf, cx + 4, y, PAL.woodDark);
  }
  // ear tufts
  set(buf, cx - 3, 45, PAL.brass);
  set(buf, cx - 4, 44, PAL.brass);
  set(buf, cx + 3, 45, PAL.brass);
  set(buf, cx + 4, 44, PAL.brass);
  // goggle eyes
  ring(buf, cx - 2, 49, 1, PAL.brassBright);
  ring(buf, cx + 2, 49, 1, PAL.brassBright);
  eye(buf, cx - 2, 49, lit, frame);
  eye(buf, cx + 2, 49, lit, frame);
  // beak + talons
  set(buf, cx, 51, PAL.brassBright);
  set(buf, cx, 52, PAL.brass);
  set(buf, cx - 2, 57, PAL.brassBright);
  set(buf, cx + 1, 57, PAL.brassBright);
}

function drawHound(buf: Buf, cx: number, lit: boolean, frame: number): void {
  fillRect(buf, cx - 6, 51, 11, 5, PAL.steel);
  for (let x = cx - 6; x < cx + 5; x++) set(buf, x, 55, PAL.steelDark);
  // shoulder and haunch pistons
  set(buf, cx - 4, 52, PAL.brass);
  set(buf, cx - 4, 53, PAL.brassLight);
  set(buf, cx + 2, 52, PAL.brass);
  set(buf, cx + 2, 53, PAL.brassLight);
  // head facing right, pricked ears, snout
  fillRect(buf, cx + 3, 46, 4, 4, PAL.steel);
  fillRect(buf, cx + 4, 50, 3, 1, PAL.steel);
  fillRect(buf, cx + 7, 48, 2, 2, PAL.steelDark);
  set(buf, cx + 3, 45, PAL.steelDark);
  set(buf, cx + 5, 45, PAL.steelDark);
  // legs + tail
  fillRect(buf, cx - 6, 56, 2, 5, PAL.steelDark);
  fillRect(buf, cx - 1, 56, 2, 5, PAL.steelDark);
  fillRect(buf, cx + 3, 56, 2, 5, PAL.steelDark);
  set(buf, cx - 7, 50, PAL.steelDark);
  set(buf, cx - 8, 49, PAL.steelDark);
  eye(buf, cx + 5, 47, lit, frame);
}

function drawCannon(buf: Buf, cx: number, lit: boolean, frame: number): void {
  // carriage on brass wheels
  fillRect(buf, cx - 5, 54, 11, 3, PAL.wood);
  for (let x = cx - 5; x < cx + 6; x++) set(buf, x, 54, PAL.woodLight);
  ring(buf, cx - 3, 58, 2, PAL.brass);
  set(buf, cx - 3, 58, PAL.brassLight);
  ring(buf, cx + 3, 58, 2, PAL.brass);
  set(buf, cx + 3, 58, PAL.brassLight);
  // breech block, then the barrel stepping up to the right with a black
  // underside so it separates from the slate backing
  fillRect(buf, cx - 5, 51, 4, 4, PAL.steelDark);
  fillRect(buf, cx - 1, 49, 4, 4, PAL.steel);
  set(buf, cx - 1, 52, PAL.black);
  set(buf, cx + 2, 52, PAL.black);
  fillRect(buf, cx + 3, 46, 3, 4, PAL.steel);
  set(buf, cx + 3, 49, PAL.black);
  // brass-banded muzzle, black bore
  fillRect(buf, cx + 6, 44, 3, 3, PAL.steelDark);
  set(buf, cx + 6, 44, PAL.brassLight);
  set(buf, cx + 6, 46, PAL.brassLight);
  set(buf, cx + 7, 45, PAL.black);
  // the tiny cuckoo, sprung on top of the breech
  fillRect(buf, cx - 4, 49, 2, 2, PAL.brassLight);
  set(buf, cx - 5, 50, PAL.brassBright);
  eye(buf, cx - 3, 49, lit, frame);
}

function drawButler(buf: Buf, cx: number, lit: boolean, opened: boolean): void {
  // head; the eyes never flare -- this one doesn't sing
  fillRect(buf, cx - 2, 43, 4, 4, PAL.steel);
  set(buf, cx - 1, 44, lit ? PAL.paper : PAL.steelDark);
  // monocle: the scene's one cold cyan note, chain dangling
  set(buf, cx + 1, 44, lit ? PAL.lensCyan : PAL.lensDim);
  set(buf, cx + 2, 45, PAL.brass);
  // long coat with a steel rim-light, shirt front, bowtie
  fillRect(buf, cx - 3, 47, 7, 10, PAL.steelDark);
  for (let y = 47; y < 57; y++) set(buf, cx - 3, y, PAL.steel);
  fillRect(buf, cx - 1, 48, 2, 2, PAL.paper);
  set(buf, cx - 1, 47, PAL.black);
  set(buf, cx, 47, PAL.black);
  // the heart housing: brass chest panel
  frameRect(buf, cx - 1, 51, 4, 4, PAL.brass);
  if (opened) {
    fillRect(buf, cx, 52, 2, 2, PAL.black);
    fillRect(buf, cx + 3, 50, 1, 5, PAL.brassLight);
  } else {
    fillRect(buf, cx, 52, 2, 2, PAL.steelDark);
    set(buf, cx, 52, PAL.heartDim);
    set(buf, cx + 1, 53, PAL.heartDim);
  }
  // tray arm
  fillRect(buf, cx - 5, 50, 2, 1, PAL.steelDark);
  fillRect(buf, cx - 8, 49, 4, 1, PAL.brassLight);
  set(buf, cx - 7, 48, PAL.paper);
  // legs, polished shoes
  fillRect(buf, cx - 2, 57, 2, 4, PAL.black);
  fillRect(buf, cx + 1, 57, 2, 4, PAL.black);
  set(buf, cx - 2, 60, PAL.steelDark);
  set(buf, cx + 2, 60, PAL.steelDark);
}

const SUSPECTS = [drawSpider, drawOwl, drawHound, drawCannon] as const;

function draw(ctx: CanvasRenderingContext2D, heartFound: boolean, frame: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  drawTorch(buf, 35, 14, frame);
  drawTorch(buf, 119, 14, frame === 0 ? 1 : 0);

  const lit = !heartFound;
  CASE_X.forEach((x, i) => {
    drawCase(buf, x);
    const cx = x + 11;
    if (i < SUSPECTS.length) SUSPECTS[i](buf, cx, lit, frame);
    else drawButler(buf, cx, lit, heartFound);
  });

  blit(ctx, buf);
}

export function GalleryArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();
  const heartFound = flags.heartFound === true;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, heartFound, frame);
  }, [heartFound, frame]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
      <span className="pixel-caption" style={{ left: "50%", top: "82%" }}>
        "Only the one who never sang served faithfully."
      </span>
    </div>
  );
}
