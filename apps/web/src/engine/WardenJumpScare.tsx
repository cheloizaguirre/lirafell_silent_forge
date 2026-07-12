import { useEffect, useRef, useState } from "react";
import {
  createBuf,
  fillRect,
  frameRect,
  ditherRect,
  ditherDisc,
  disc,
  ring,
  set,
  blit,
} from "../scenes/pixel/pixelCanvas";
import { PAL } from "../scenes/pixel/dungeonKit";

// The Warden jump-scare (follow-up to the deferred hook noted alongside
// wardenHidden). A DM override sets flags.wardenRoom to a scene id; any player
// standing in that scene gets this looming, waist-up Warden bust slammed over
// the room. Purely cosmetic -- it renders on TOP of whatever scene is showing
// (one overlay, mounted once in PlayPage, no per-scene art edits) and never
// blocks the hotspots underneath (pointer-events: none). Dismissed when the DM
// sets wardenRoom back to "".
//
// It reuses the 8-bit pixel toolkit so the scare matches the rooms: black
// chassis + violet edge-light (same identity as the Workshop's dormant
// statue), but scaled to fill the frame -- head near the top, waist at the
// canvas bottom -- and cranked menacing: huge red glowing eyes and a halo of
// concentric sound waves rippling outward.

const W = 160;
const H = 100;

// Head centre -- the eyes, horns, and the sound-wave halo all hang off this.
const HEAD_CX = 80;
const HEAD_CY = 30;

function drawHalo(buf: ReturnType<typeof createBuf>, phase: number): void {
  // Concentric sound waves rippling outward from the head. Four rings march
  // out on a 16px cycle and fade as they grow, so the ring nearest the head
  // is brightest and the outermost is nearly spent.
  for (let k = 0; k < 4; k++) {
    const r = 14 + ((phase * 2 + k * 16) % 64);
    const color = r > 52 ? PAL.wardenGlow : r > 34 ? PAL.wardenEye : PAL.wardenEyeBright;
    ring(buf, HEAD_CX, HEAD_CY, r, color);
    // a second, offset ring thickens the wave so it reads at upscaled size
    ring(buf, HEAD_CX, HEAD_CY, r + 1, PAL.wardenGlow);
  }
}

function drawBust(buf: ReturnType<typeof createBuf>, frame: number): void {
  // ---- Shoulders + torso: a wide slab running off both sides, waist flush
  // with the bottom of the canvas so it reads as pressed up against the glass.
  fillRect(buf, 20, 52, 120, 48, PAL.black);
  // sloped shoulder shelves up to the neck
  fillRect(buf, 30, 46, 100, 8, PAL.black);
  fillRect(buf, 44, 42, 72, 6, PAL.black);
  // violet edge-light down the left silhouette + across the shoulder line
  for (let y = 52; y < 100; y++) set(buf, 20, y, PAL.purpleDim);
  for (let x = 30; x < 130; x++) set(buf, x, 46, PAL.purpleDim);
  // plating seams across the chest
  for (let x = 34; x < 126; x += 6) {
    set(buf, x, 66, PAL.purpleDim);
    set(buf, x + 3, 78, PAL.purpleDim);
  }

  // ---- Arms cropped at the frame edges, fists rising into view
  fillRect(buf, 8, 62, 16, 38, PAL.black);
  fillRect(buf, 136, 62, 16, 38, PAL.black);
  for (let y = 62; y < 100; y++) set(buf, 8, y, PAL.purpleDim);
  for (let y = 62; y < 100; y++) set(buf, 151, y, PAL.purpleDim);

  // ---- Aether furnace behind the chest plate: red now, not banked violet.
  const core = frame === 0 ? PAL.wardenEyeBright : PAL.wardenEye;
  ditherDisc(buf, HEAD_CX, 72, 10, PAL.wardenGlow, true);
  fillRect(buf, 74, 66, 12, 12, PAL.black);
  frameRect(buf, 74, 66, 12, 12, PAL.wardenGlow);
  fillRect(buf, 78, 70, 4, 4, core);

  // ---- Neck
  fillRect(buf, 70, 44, 20, 8, PAL.black);

  // ---- Head: heavy horned skull-plate
  fillRect(buf, 56, 12, 48, 34, PAL.black);
  // horns sweeping up and out from the crown
  fillRect(buf, 52, 4, 5, 10, PAL.black);
  fillRect(buf, 48, 2, 4, 6, PAL.black);
  fillRect(buf, 103, 4, 5, 10, PAL.black);
  fillRect(buf, 108, 2, 4, 6, PAL.black);
  set(buf, 48, 2, PAL.purpleDim);
  set(buf, 111, 2, PAL.purpleDim);
  // violet edge-light on the left/top of the head
  for (let y = 12; y < 46; y++) set(buf, 56, y, PAL.purpleDim);
  for (let x = 56; x < 104; x++) set(buf, x, 12, PAL.purpleDim);

  // ---- Jagged brow ridge + jaw grille
  for (let x = 60; x < 100; x++) set(buf, x, 22, PAL.purpleDim);
  set(buf, 66, 21, PAL.purpleDim);
  set(buf, 80, 20, PAL.purpleDim);
  set(buf, 94, 21, PAL.purpleDim);
  // jaw / teeth grille with a red glow bleeding between the bars
  for (let gx = 66; gx < 96; gx += 4) {
    for (let y = 38; y < 44; y++) set(buf, gx, y, PAL.wardenGlow);
  }

  // ---- The eyes: large, red, glowing, pulsing on the flicker frame
  const eye = frame === 0 ? PAL.wardenEyeBright : PAL.wardenEye;
  const bloom = frame === 0 ? 9 : 7;
  ditherDisc(buf, 68, 28, bloom, PAL.wardenGlow, true);
  ditherDisc(buf, 92, 28, bloom, PAL.wardenGlow, true);
  disc(buf, 68, 28, 4, PAL.wardenEye);
  disc(buf, 92, 28, 4, PAL.wardenEye);
  fillRect(buf, 66, 26, 4, 4, eye);
  fillRect(buf, 90, 26, 4, 4, eye);
  // hot white pupils
  set(buf, 68, 28, PAL.white);
  set(buf, 92, 28, PAL.white);
}

function draw(ctx: CanvasRenderingContext2D, frame: number, phase: number): void {
  // Dark backdrop so the red halo and eyes blaze -- the scare owns the frame.
  const buf = createBuf(W, H, PAL.black);
  ditherRect(buf, 0, 0, W, H, PAL.mortar, true);
  drawHalo(buf, phase);
  drawBust(buf, frame);
  // heavy edge vignette pulling the corners into black
  ditherRect(buf, 0, 0, W, 10, PAL.black);
  ditherRect(buf, 0, H - 8, W, 8, PAL.black);
  ditherRect(buf, 0, 0, 10, H, PAL.black);
  ditherRect(buf, W - 10, 0, 10, H, PAL.black);
  blit(ctx, buf);
}

export function WardenJumpScare({
  wardenRoom,
  currentSceneId,
}: {
  wardenRoom: string;
  currentSceneId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const active = wardenRoom !== "" && wardenRoom === currentSceneId;

  // One animation clock drives both the eye pulse (slow) and the sound-wave
  // ripple (fast). Only ticks while the scare is on screen.
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setPhase((p) => (p + 1) % 3200), 140);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, phase % 4 < 2 ? 0 : 1, phase);
  }, [active, phase]);

  if (!active) return null;

  return (
    // key restarts the slam animation if the DM re-summons into this room
    <div key={wardenRoom} className="warden-scare" aria-hidden="true">
      <canvas ref={canvasRef} width={W} height={H} className="warden-scare-canvas" />
    </div>
  );
}
