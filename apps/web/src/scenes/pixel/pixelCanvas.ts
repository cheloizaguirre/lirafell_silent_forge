// Tiny procedural framebuffer for the 8-bit art prototype (proto-vault-8bit
// branch). Sprites are drawn into a low-res RGBA buffer with chunky integer
// primitives, blitted to a <canvas>, and upscaled by CSS with
// image-rendering: pixelated -- the jaggies ARE the aesthetic.
//
// Everything is deterministic (no randomness): identical flags produce
// identical pixels, which keeps screenshots and the verify suite stable.
// A real asset pipeline (Aseprite PNGs) would replace these draw calls but
// keep the same layered, flags-driven structure.

export type RGB = readonly [number, number, number];

export function rgb(hex: string): RGB {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ] as const;
}

export interface Buf {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

export function createBuf(w: number, h: number, fill: RGB): Buf {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = 255;
  }
  return { w, h, data };
}

export function set(buf: Buf, x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= buf.w || y >= buf.h) return;
  const i = (y * buf.w + x) * 4;
  buf.data[i] = c[0];
  buf.data[i + 1] = c[1];
  buf.data[i + 2] = c[2];
  buf.data[i + 3] = 255;
}

export function fillRect(buf: Buf, x: number, y: number, w: number, h: number, c: RGB): void {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) set(buf, x + dx, y + dy, c);
}

export function frameRect(buf: Buf, x: number, y: number, w: number, h: number, c: RGB): void {
  for (let dx = 0; dx < w; dx++) {
    set(buf, x + dx, y, c);
    set(buf, x + dx, y + h - 1, c);
  }
  for (let dy = 0; dy < h; dy++) {
    set(buf, x, y + dy, c);
    set(buf, x + w - 1, y + dy, c);
  }
}

// Checkerboard fill; sparse=true lights only every 4th pixel. The classic
// 8-bit stand-in for gradients and translucency.
export function ditherRect(
  buf: Buf,
  x: number,
  y: number,
  w: number,
  h: number,
  c: RGB,
  sparse = false,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx;
      const py = y + dy;
      const on = sparse ? px % 2 === 0 && py % 2 === 0 : (px + py) % 2 === 0;
      if (on) set(buf, px, py, c);
    }
  }
}

export function disc(buf: Buf, cx: number, cy: number, r: number, c: RGB): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    for (let dx = -half; dx <= half; dx++) set(buf, cx + dx, cy + dy, c);
  }
}

export function ditherDisc(buf: Buf, cx: number, cy: number, r: number, c: RGB, sparse = false): void {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    for (let dx = -half; dx <= half; dx++) {
      const px = cx + dx;
      const py = cy + dy;
      const on = sparse ? px % 2 === 0 && py % 2 === 0 : (px + py) % 2 === 0;
      if (on) set(buf, px, py, c);
    }
  }
}

// 1px chunky circle outline: union of both parametrizations so neither the
// steep nor the shallow arcs leave gaps.
export function ring(buf: Buf, cx: number, cy: number, r: number, c: RGB): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.round(Math.sqrt(r * r - dy * dy));
    set(buf, cx - dx, cy + dy, c);
    set(buf, cx + dx, cy + dy, c);
  }
  for (let dx = -r; dx <= r; dx++) {
    const dy = Math.round(Math.sqrt(r * r - dx * dx));
    set(buf, cx + dx, cy - dy, c);
    set(buf, cx + dx, cy + dy, c);
  }
}

// Hand-authored bitmap glyph: 'X' paints, anything else is transparent.
// This is the miniature version of the real spritesheet pipeline.
export function sprite(buf: Buf, x: number, y: number, rows: string[], c: RGB): void {
  rows.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      if (row[dx] === "X") set(buf, x + dx, y + dy, c);
    }
  });
}

export function blit(ctx: CanvasRenderingContext2D, buf: Buf): void {
  const img = ctx.createImageData(buf.w, buf.h);
  img.data.set(buf.data);
  ctx.putImageData(img, 0, 0);
}
