import { useEffect, useRef } from "react";
import { createBuf, disc, fillRect, frameRect, ring, sprite, set, rgb } from "./pixelCanvas";
import type { Buf } from "./pixelCanvas";
import { PAL } from "./dungeonKit";

// Tiny inventory icons: the same item-identity language the Vault sockets
// use (crimson heart / cyan lens / brass valve), rendered standalone for the
// HUD. The visible name is replaced by the sprite; a visually-hidden span
// keeps the text for screen readers (and the verify suite's textContent
// checks).

// Anything still wearing the sentinel after drawing becomes transparent, so
// the icons sit on the panel background without a box around them.
const SENTINEL = rgb("#010203");

const SCALE = 3;

function punchOutSentinel(buf: Buf): void {
  for (let i = 0; i < buf.w * buf.h; i++) {
    if (
      buf.data[i * 4] === SENTINEL[0] &&
      buf.data[i * 4 + 1] === SENTINEL[1] &&
      buf.data[i * 4 + 2] === SENTINEL[2]
    ) {
      buf.data[i * 4 + 3] = 0;
    }
  }
}

const HEART = [
  ".XX.XX.",
  "XXXXXXX",
  "XXXXXXX",
  ".XXXXX.",
  "..XXX..",
  "...X...",
];

interface ItemSprite {
  name: string;
  w: number;
  h: number;
  draw: (buf: Buf) => void;
}

const ITEMS: Record<string, ItemSprite> = {
  heart: {
    name: "Cogwork Heart",
    w: 7,
    h: 6,
    draw: (buf) => {
      sprite(buf, 0, 0, HEART, PAL.heartRed);
      set(buf, 1, 1, PAL.heartLight);
      set(buf, 2, 1, PAL.heartLight);
    },
  },
  lens: {
    name: "Aether Lens",
    w: 7,
    h: 7,
    draw: (buf) => {
      disc(buf, 3, 3, 3, PAL.lensCyan);
      ring(buf, 3, 3, 3, PAL.lensDim);
      set(buf, 2, 2, PAL.lensLight);
      set(buf, 3, 2, PAL.lensLight);
    },
  },
  valve: {
    name: "Pressure Valve Key",
    w: 6,
    h: 6,
    draw: (buf) => {
      fillRect(buf, 0, 0, 6, 6, PAL.brassLight);
      frameRect(buf, 0, 0, 6, 6, PAL.brass);
      set(buf, 1, 1, PAL.brassBright);
    },
  },
  // The keystone (crown) gear: a brass cog with the blank hollow-diamond crown
  // at its heart -- the ◇ identity from the cabinet-gears puzzle. Only the
  // DM-granted keystone ever reaches inventory; the four symbol-gears are
  // puzzle-content tiles, not items.
  keystone: {
    name: "Keystone Gear",
    w: 7,
    h: 7,
    draw: (buf) => {
      disc(buf, 3, 3, 3, PAL.brass);
      ring(buf, 3, 3, 3, PAL.brassLight);
      // four cog teeth at the cardinal points
      set(buf, 3, 0, PAL.brassBright);
      set(buf, 3, 6, PAL.brassBright);
      set(buf, 0, 3, PAL.brassBright);
      set(buf, 6, 3, PAL.brassBright);
      // hollow diamond crown at the center (blank -- no symbol)
      for (const [dx, dy] of [
        [3, 1], [2, 2], [4, 2], [1, 3], [5, 3], [2, 4], [4, 4], [3, 5],
      ] as const) {
        set(buf, dx, dy, PAL.steelDark);
      }
    },
  },
};

export function ItemSpritePixel({ itemId }: { itemId: string }) {
  const item = ITEMS[itemId];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!item) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const buf = createBuf(item.w, item.h, SENTINEL);
    item.draw(buf);
    punchOutSentinel(buf);
    const img = ctx.createImageData(buf.w, buf.h);
    img.data.set(buf.data);
    ctx.putImageData(img, 0, 0);
  }, [item]);

  // Unknown item ids (future content) fall back to plain text.
  if (!item) return <span>{itemId}</span>;

  return (
    <span className="inventory-item" title={item.name}>
      <canvas
        ref={canvasRef}
        width={item.w}
        height={item.h}
        style={{ width: item.w * SCALE, height: item.h * SCALE }}
        aria-hidden="true"
      />
      <span className="sr-only">{item.name}</span>
    </span>
  );
}
