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
  rgb,
} from "./pixelCanvas";

// 8-bit prototype of the Vault (proto-vault-8bit branch). Same contracts as
// the SVG original: flags drive every layer, hotspot geometry is untouched
// (the pixel elements sit at the same percentage positions the SVG used --
// 800x500 coords divided by 5 into this 160x100 buffer), and the verify
// suite's data-converge/data-lit hooks live on the HTML rune labels below
// (readable text has no business being 3px tall).

const W = 160;
const H = 100;

const PAL = {
  bg: rgb("#0b0c0e"),
  wall: rgb("#15161a"),
  brick: rgb("#1b1c21"),
  floor: rgb("#101114"),
  floorLine: rgb("#26282d"),
  steel: rgb("#34373d"),
  steelDim: rgb("#1e2024"),
  purple: rgb("#8b5fbf"),
  purpleBright: rgb("#c9a3ff"),
  purpleDim: rgb("#5c4577"),
  white: rgb("#e3e4e8"),
};

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

function draw(ctx: CanvasRenderingContext2D, s: VaultState): void {
  const buf = createBuf(W, H, PAL.wall);

  // Brickwork: mortar lines every 6 rows, joints staggered per course.
  for (let y = 6; y < 78; y += 6) {
    for (let x = 0; x < W; x++) set(buf, x, y, PAL.brick);
    const offset = (y / 6) % 2 === 0 ? 0 : 8;
    for (let x = offset; x < W; x += 16) {
      for (let dy = 1; dy < 6; dy++) set(buf, x, y + dy, PAL.brick);
    }
  }
  // Dithered vignette pulls the edges into darkness.
  ditherRect(buf, 0, 0, W, 8, PAL.bg);
  ditherRect(buf, 0, 0, 8, H, PAL.bg);
  ditherRect(buf, W - 8, 0, 8, H, PAL.bg);
  fillRect(buf, 0, 0, W, 3, PAL.bg);

  // Floor.
  fillRect(buf, 0, 78, W, H - 78, PAL.floor);
  for (let x = 0; x < W; x++) set(buf, x, 78, PAL.floorLine);
  ditherRect(buf, 0, 90, W, H - 90, PAL.bg, true);

  // Victory: the room floods -- dithered purple bands inside the ring.
  if (s.won) {
    ditherDisc(buf, 80, 50, 44, PAL.purpleDim, true);
    ditherDisc(buf, 80, 50, 32, PAL.purpleDim);
    ditherDisc(buf, 80, 50, 20, PAL.purple);
  }

  // The great containment ring (SVG r180 -> 36), 2px chunky.
  const ringColor = s.won ? PAL.purpleBright : PAL.steel;
  ring(buf, 80, 50, 36, ringColor);
  ring(buf, 80, 50, 35, ringColor);

  // Pedestal (SVG 330,200 140x100 -> 66,40 28x20) with a lit top edge.
  fillRect(buf, 66, 40, 28, 20, PAL.steelDim);
  frameRect(buf, 66, 40, 28, 20, PAL.steel);
  for (let x = 67; x < 93; x++) set(buf, x, 41, PAL.floorLine);
  ditherRect(buf, 64, 60, 32, 2, PAL.bg);

  // Sockets: outline when waiting, filled + glint when placed. Positions
  // sit under the existing socket hotspots (41-47% / 48-53% / 53-58%).
  sprite(buf, 67, 44, s.placedHeart ? HEART_FILLED : HEART_OUTLINE, s.placedHeart ? PAL.purple : PAL.purpleDim);
  if (s.placedHeart) set(buf, 69, 45, PAL.purpleBright);

  if (s.placedLens) {
    disc(buf, 80, 47, 3, PAL.purple);
    set(buf, 79, 46, PAL.purpleBright);
  } else {
    ring(buf, 80, 47, 3, PAL.purpleDim);
  }

  if (s.placedValve) {
    fillRect(buf, 86, 44, 6, 6, PAL.purple);
    set(buf, 87, 45, PAL.purpleBright);
  } else {
    frameRect(buf, 86, 44, 6, 6, PAL.purpleDim);
  }

  // Convergence sigils above the rune labels (labels are HTML, below).
  if (s.allPlaced && !s.won) {
    const lit = [s.armed, s.vented, s.aligned];
    CONVERGE_RUNES.forEach((rune, i) => {
      const cx = Math.round((rune.x / 100) * W);
      if (lit[i]) ditherDisc(buf, cx, 71, 4, PAL.purpleDim);
      sprite(buf, cx - 2, 69, DIAMOND, lit[i] ? PAL.purpleBright : PAL.purpleDim);
    });
  }

  // Victory sparkles: fixed constellation, deterministic like everything else.
  if (s.won) {
    for (const [sx, sy] of [[52, 28], [108, 24], [64, 74], [118, 62], [80, 16], [42, 56]]) {
      set(buf, sx, sy, PAL.white);
      set(buf, sx + 1, sy, PAL.purpleBright);
      set(buf, sx, sy + 1, PAL.purpleBright);
    }
  }

  blit(ctx, buf);
}

export function VaultArtPixel({ flags }: ArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    if (ctx) draw(ctx, state);
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
