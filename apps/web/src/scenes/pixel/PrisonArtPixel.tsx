import { useEffect, useRef, useState } from "react";
import type { ArtProps } from "../artTypes";
import {
  createBuf,
  fillRect,
  frameRect,
  ditherRect,
  ring,
  set,
  blit,
} from "./pixelCanvas";
import type { Buf } from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, drawDigits, usePixelFrame } from "./dungeonKit";
import { useSessionStore } from "../../state/useSessionStore";

// 8-bit Prison (proto-vault-8bit branch). The layering IS the scene: the
// room shell plays the space beyond the bars, a gloom dither darkens it,
// black iron bars drop in front, and the foreground holds whatever is on
// OUR side. The same component draws both sides (feedback pass 2026-07-11):
//   side="cell"      -- we're locked in: straw, cot, chains, the loose brick,
//                       the corroded grate; the desk and its key sit beyond
//                       the bars, out of reach.
//   side="corridor"  -- reached via the workshop hatch: the desk (and key)
//                       are in front of us, the cell furniture shows dimly
//                       beyond the bars, and the barred cell door can be
//                       unlocked (it re-locks behind whoever slips in).
// The grate no longer rattles constantly -- it shakes for ~1s when heaved
// (a `pulse` action nudges the store; NoiseBang's transient pattern).

const W = 160;
const H = 100;

// x positions of the cage bars (SVG x100+i*80, /5 -> 20+i*16).
const BARS = [20, 36, 52, 68, 84, 100, 116, 132] as const;

const RATTLE_MS = 900;

interface PrisonState {
  side: "cell" | "corridor";
  brickOpened: boolean;
}

// The desk that holds the cell key. Beyond the bars from the cell (small,
// high, unreachable); in the foreground from the corridor.
function drawDesk(buf: Buf, x: number, y: number, w: number, frame: number): void {
  ditherRect(buf, x - 1, y + 10, w + 2, 2, PAL.black);
  fillRect(buf, x, y, w, 3, PAL.wood);
  for (let dx = 0; dx < w; dx++) set(buf, x + dx, y, PAL.woodLight);
  fillRect(buf, x, y + 3, 2, 8, PAL.woodDark);
  fillRect(buf, x + w - 2, y + 3, 2, 8, PAL.woodDark);
  // the key: brass, catching the torchlight on the flicker frame
  set(buf, x + Math.floor(w / 2) - 1, y - 1, frame === 0 ? PAL.brassBright : PAL.brassLight);
  set(buf, x + Math.floor(w / 2), y - 1, PAL.brass);
  set(buf, x + Math.floor(w / 2) + 1, y - 1, PAL.brass);
}

// Cell furniture: straw, cot, chains. Drawn in the foreground on the cell
// side, or beyond the bars (pre-gloom) on the corridor side.
function drawCellFurniture(buf: Buf): void {
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
}

// The corroded floor grate; gx lets the heave animation shift it a pixel.
function drawGrate(buf: Buf, gx: number, frame: number): void {
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
}

function draw(ctx: CanvasRenderingContext2D, s: PrisonState, frame: number, gx: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  // Beyond the bars: a torch out of reach, and a sliver of night through a
  // high barred window -- cold blue against the warm fire.
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

  // Whatever lives on the far side of the bars gets drawn BEFORE the gloom
  // and the cage so it reads distant and unreachable.
  if (s.side === "cell") {
    // the desk with the key, maddeningly visible across the corridor
    drawDesk(buf, 94, 64, 16, frame);
  } else {
    drawCellFurniture(buf);
    drawGrate(buf, 66, frame);
  }

  // Gloom: an irregular ~9% scatter of dark pixels. A regular checker
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

  if (s.side === "corridor") {
    // The cell door: a framed section of the cage with its brass lock,
    // openable from THIS side (with the desk key).
    frameRect(buf, 52, 8, 33, 82, PAL.steel);
    frameRect(buf, 53, 9, 31, 80, PAL.black);
    fillRect(buf, 80, 46, 4, 6, PAL.brass);
    set(buf, 80, 46, PAL.brassLight);
    set(buf, 81, 48, PAL.black);
    set(buf, 81, 49, PAL.black);
  }

  // ---- Our side of the bars (foreground) -----------------------------------
  if (s.side === "cell") {
    drawCellFurniture(buf);
    // chains hanging from the cell ceiling, shackles open
    for (const [cx, len] of [[12, 18], [148, 12]] as const) {
      for (let y = 3; y < len; y += 3) {
        fillRect(buf, cx, y, 2, 2, PAL.black);
        set(buf, cx, y, PAL.steelDark);
      }
      ring(buf, cx + 1, len + 2, 2, PAL.steelDark);
    }
    // the loose brick, low in the cell-side wall
    if (s.brickOpened) {
      fillRect(buf, 3, 66, 9, 6, PAL.black);
      frameRect(buf, 3, 66, 9, 6, PAL.floorLight);
      set(buf, 6, 69, PAL.paper);
      set(buf, 7, 69, PAL.paper);
      // the note itself, flattened on the floor below -- pixel digits are
      // the one text that works on canvas, and this one is THE clue
      fillRect(buf, 9, 83, 19, 8, PAL.paper);
      for (let x = 9; x < 28; x++) set(buf, x, 83, PAL.white);
      drawDigits(buf, 11, 84, "2013", PAL.black);
    } else {
      frameRect(buf, 3, 66, 9, 6, PAL.floorLight);
      ditherRect(buf, 4, 67, 7, 4, PAL.mortar);
      set(buf, 5, 68, PAL.black);
      set(buf, 9, 70, PAL.black);
    }
    drawGrate(buf, gx, frame);
  } else {
    // corridor side: the desk is right here, key on top
    drawDesk(buf, 94, 74, 20, frame);
  }

  blit(ctx, buf);
}

function PrisonArt({ flags, side }: ArtProps & { side: "cell" | "corridor" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();
  const brickOpened = flags.brickOpened === true;

  // Heave-the-grate rattle: the loose-grate hotspot fires a `pulse` into the
  // store; we shake the grate for ~1s and settle (NoiseBang's transient
  // pattern). While rattling the flicker runs fast so the 1px shake reads.
  const grateNudge = useSessionStore((s) => s.pulses["prison-grate"]);
  const lastNudge = useRef(grateNudge);
  const [rattling, setRattling] = useState(false);
  useEffect(() => {
    // watermark so a stale pulse from an earlier visit doesn't fire on mount
    if (grateNudge === undefined || grateNudge === lastNudge.current) return;
    lastNudge.current = grateNudge;
    setRattling(true);
    const timer = setTimeout(() => setRattling(false), RATTLE_MS);
    return () => clearTimeout(timer);
  }, [grateNudge]);
  const rattleFrame = usePixelFrame(rattling ? 130 : 600);
  const gx = 66 + (rattling && side === "cell" ? rattleFrame : 0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, { side, brickOpened }, frame, gx);
  }, [side, brickOpened, frame, gx]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
      {side === "cell" && brickOpened && (
        <span className="pixel-caption" style={{ left: "22%", top: "60%" }}>
          behind the brick: 2 – 0 – 1 – 3
        </span>
      )}
      {side === "corridor" && (
        <span className="pixel-caption" style={{ left: "65%", top: "64%" }}>
          the cell key rests on the desk
        </span>
      )}
    </div>
  );
}

export function PrisonArtPixel(props: ArtProps) {
  return <PrisonArt {...props} side="cell" />;
}

export function PrisonCorridorArtPixel(props: ArtProps) {
  return <PrisonArt {...props} side="corridor" />;
}
