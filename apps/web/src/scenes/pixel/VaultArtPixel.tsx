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
  sprite,
  set,
  blit,
} from "./pixelCanvas";
import { PAL, drawRoom, drawTorch, usePixelFrame } from "./dungeonKit";

// 8-bit prototype of the Vault (proto-vault-8bit branch). Same contracts as
// the SVG original: flags drive every layer, hotspot geometry is untouched
// (the pixel elements sit at the same percentage positions the SVG used --
// 800x500 coords divided by 5 into this 160x100 buffer), and the verify
// suite's data-converge/data-lit hooks live on the HTML rune labels below
// (readable text has no business being 3px tall).

const W = 160;
const H = 100;

const HEART_FILLED = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
];
const HEART_OUTLINE = [
  ".XX.XX.",
  "X..X..X",
  "X.....X",
  ".X...X.",
  "..X.X..",
  "...X...",
];
const DIAMOND = [
  "..X..",
  ".XXX.",
  "XXXXX",
  ".XXX.",
  "..X..",
];

// Same order as the SVG's CONVERGE_RUNES, but spread wider (25/50/75 vs the
// SVG's 40/50/60): the monospace labels are physically wider than the old
// serif text and collided at the original spacing.
const CONVERGE_RUNES = [
  { flag: "armed", x: 25, label: "spire armed" },
  { flag: "vented", x: 50, label: "pressure vented" },
  { flag: "aligned", x: 75, label: "lens aligned" },
] as const;

interface VaultState {
  placedHeart: boolean;
  placedLens: boolean;
  placedValve: boolean;
  allPlaced: boolean;
  armed: boolean;
  vented: boolean;
  aligned: boolean;
  won: boolean;
}

function draw(ctx: CanvasRenderingContext2D, s: VaultState, frame: number): void {
  const buf = createBuf(W, H, PAL.wall);
  drawRoom(buf);

  // Wall torches (clear of every hotspot region).
  drawTorch(buf, 28, 30, frame);
  drawTorch(buf, 127, 30, frame === 0 ? 1 : 0);

  // Victory: the room floods -- dithered aether bands inside the ring.
  if (s.won) {
    ditherDisc(buf, 80, 50, 44, PAL.purpleDim, true);
    ditherDisc(buf, 80, 50, 32, PAL.purpleDim);
    ditherDisc(buf, 80, 50, 20, PAL.purple);
  }

  // The great containment ring (SVG r180 -> 36): steel-blue, 2px chunky,
  // with four violet gem studs at the cardinal points.
  ring(buf, 80, 50, 36, s.won ? PAL.purpleBright : PAL.steel);
  ring(buf, 80, 50, 35, s.won ? PAL.purpleBright : PAL.steelDark);
  for (const [gx, gy] of [[80, 14], [80, 86], [44, 50], [116, 50]] as const) {
    fillRect(buf, gx - 1, gy - 1, 3, 3, s.won ? PAL.white : PAL.purple);
    set(buf, gx, gy, PAL.purpleBright);
  }

  // Pedestal (SVG 330,200 140x100 -> 66,40 28x20): stone slab, brass trim.
  fillRect(buf, 66, 40, 28, 20, PAL.steelDark);
  frameRect(buf, 66, 40, 28, 20, PAL.brass);
  for (let x = 67; x < 93; x++) set(buf, x, 41, PAL.brassLight);
  set(buf, 66, 40, PAL.brassLight);
  set(buf, 93, 40, PAL.brassLight);
  ditherRect(buf, 64, 60, 32, 2, PAL.black);

  // Sockets: dim item-colored outline when waiting, full color + glint when
  // placed. Item identity is readable before placement: crimson heart,
  // cyan lens, brass valve. Positions sit under the existing hotspots.
  sprite(buf, 67, 44, s.placedHeart ? HEART_FILLED : HEART_OUTLINE, s.placedHeart ? PAL.heartRed : PAL.heartDim);
  if (s.placedHeart) {
    set(buf, 68, 45, PAL.heartLight);
    set(buf, 69, 45, PAL.heartLight);
  }

  if (s.placedLens) {
    disc(buf, 80, 47, 3, PAL.lensCyan);
    set(buf, 79, 46, PAL.lensLight);
    set(buf, 80, 46, PAL.lensLight);
  } else {
    ring(buf, 80, 47, 3, PAL.lensDim);
  }

  if (s.placedValve) {
    fillRect(buf, 86, 44, 6, 6, PAL.brassLight);
    frameRect(buf, 86, 44, 6, 6, PAL.brass);
    set(buf, 87, 45, PAL.brassBright);
  } else {
    frameRect(buf, 86, 44, 6, 6, PAL.brass);
  }

  // Convergence sigils above the rune labels (labels are HTML, below).
  if (s.allPlaced && !s.won) {
    const lit = [s.armed, s.vented, s.aligned];
    CONVERGE_RUNES.forEach((rune, i) => {
      const cx = Math.round((rune.x / 100) * W);
      if (lit[i]) ditherDisc(buf, cx, 71, 4, PAL.purple);
      sprite(buf, cx - 2, 69, DIAMOND, lit[i] ? PAL.purpleBright : PAL.purpleDim);
      if (lit[i]) set(buf, cx, 71, PAL.white);
    });
  }

  // Victory sparkles: fixed constellation, gold and white.
  if (s.won) {
    for (const [sx, sy, gold] of [
      [52, 28, 1], [108, 24, 0], [64, 74, 0], [118, 62, 1], [80, 16, 0], [42, 56, 1],
    ] as const) {
      set(buf, sx, sy, gold ? PAL.brassBright : PAL.white);
      set(buf, sx + 1, sy, PAL.purpleBright);
      set(buf, sx, sy + 1, PAL.purpleBright);
    }
  }

  blit(ctx, buf);
}

export function VaultArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = usePixelFrame();

  const state: VaultState = {
    placedHeart: flags.placedHeart === true,
    placedLens: flags.placedLens === true,
    placedValve: flags.placedValve === true,
    allPlaced: flags.allPlaced === true,
    armed: flags.armed === true,
    vented: flags.vented === true,
    aligned: flags.aligned === true,
    won: flags.won === true,
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, state, frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.placedHeart,
    state.placedLens,
    state.placedValve,
    state.allPlaced,
    state.armed,
    state.vented,
    state.aligned,
    state.won,
    frame,
  ]);

  return (
    <div className="scene-pixel">
      <canvas ref={canvasRef} width={W} height={H} className="scene-pixel-canvas" />
      {state.allPlaced && !state.won && (
        <>
          {CONVERGE_RUNES.map((rune) => {
            const lit = flags[rune.flag] === true;
            return (
              <span
                key={rune.flag}
                className="pixel-rune"
                style={{ left: `${rune.x}%` }}
                data-converge={rune.flag}
                data-lit={lit}
              >
                {rune.label}
              </span>
            );
          })}
        </>
      )}
      {state.won && (
        <span className="pixel-rune pixel-rune-won" style={{ left: "50%" }} data-converge="won">
          the anti-aether field has fallen
        </span>
      )}
    </div>
  );
}
