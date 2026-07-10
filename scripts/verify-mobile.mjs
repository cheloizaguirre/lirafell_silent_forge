// Phase 6 touch-layout verification: drive the app on emulated iPads (coarse
// pointer + touch) and measure what the CSS actually produced: no horizontal
// overflow, 44px controls, expanded hotspot tap areas, the history rail
// stacking (portrait) vs sitting beside the scene (landscape), and the tap
// event path itself.
//
// Phones are out of scope by design (Phase 6 decision): play happens on
// tablets, laptops, and a projected surface, so tablets are the smallest
// target this script cares about.
//
// Usage:  pnpm verify:mobile   (same prerequisites as verify:realtime)
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const OUT = new URL("../verify-artifacts/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// DM on a desktop context, player on an emulated iPad in portrait.
const dmCtx = await browser.newContext();
const tabletCtx = await browser.newContext({ ...devices["iPad (gen 7)"] });
const dm = await dmCtx.newPage();
const tablet = await tabletCtx.newPage();

const fails = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails.push(name);
};

// How many columns did the .play-layout grid actually resolve to?
const layoutColumns = (pg) =>
  pg.evaluate(
    () =>
      getComputedStyle(document.querySelector(".play-layout")).gridTemplateColumns.split(" ")
        .length,
  );

// DM creates a session (desktop).
await dm.goto(BASE, { waitUntil: "networkidle" });
await dm.fill("#display-name", "DM Layout Check");
await dm.getByRole("button", { name: /Start a new quest/i }).click();
await dm.waitForURL(/\/dm\/[A-Z0-9]{6}$/, { timeout: 15000 });
const code = dm.url().split("/").pop();

// Tablet (portrait): join flow.
await tablet.goto(`${BASE}/join/${code}`, { waitUntil: "networkidle" });
check(
  "tablet reports coarse pointer",
  await tablet.evaluate(() => matchMedia("(pointer: coarse)").matches),
);
check(
  "no horizontal overflow on join page",
  await tablet.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
await tablet.screenshot({ path: `${OUT}/tablet-join.png` });
await tablet.fill("#join-name", "Tablet Player");
const joinBtn = tablet.getByRole("button", { name: /^Join$/ });
const joinBox = await joinBtn.boundingBox();
check("join button >= 44px tall", joinBox.height >= 44, `${joinBox.height}px`);
await joinBtn.click();
await tablet.waitForURL(new RegExp(`/play/${code}$`), { timeout: 15000 });
await tablet.waitForSelector(".hotspot");

check(
  "no horizontal overflow on play page",
  await tablet.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
check(
  "history rail stacks under the scene in portrait (< 900px)",
  (await layoutColumns(tablet)) === 1,
);
await tablet.screenshot({ path: `${OUT}/tablet-play-entrance.png` });

// Tap-target measurement: the effective hit area of every hotspot must be
// >= 44x44 (the ::before expansion). Pseudo-element boxes aren't in the DOM,
// so probe with elementFromPoint at the padded corners of each hotspot.
const hitAreas = await tablet.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll(".hotspot")) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const half = 21; // just inside a 44px box centered on the hotspot
    const corners = [
      [cx - half, cy - half],
      [cx + half, cy - half],
      [cx - half, cy + half],
      [cx + half, cy + half],
    ];
    // Corners may legitimately be captured by an overlapping neighbor's
    // expanded area or fall outside the viewport; require center + at
    // least 3 corners to resolve to *some* hotspot.
    let hits = 0;
    for (const [x, y] of corners) {
      const t = document.elementFromPoint(x, y);
      if (t && t.closest(".hotspot")) hits += 1;
    }
    const centerOk = document.elementFromPoint(cx, cy)?.closest(".hotspot") != null;
    out.push({
      label: el.getAttribute("aria-label"),
      w: Math.round(r.width),
      h: Math.round(r.height),
      hits,
      centerOk,
    });
  }
  return out;
});
for (const h of hitAreas) {
  check(
    `hotspot "${h.label}" tap area expanded (visible ${h.w}x${h.h})`,
    h.centerOk && h.hits >= 3,
    `${h.hits}/4 corners of 44px box hit`,
  );
}

// Tap through to the Workshop and open the valve puzzle on touch.
await tablet.tap('button.hotspot[aria-label="Great Door (enter workshop)"]');
await tablet.waitForSelector('button.hotspot[aria-label="Pressure Valves"]', { timeout: 15000 });
await tablet.tap('button.hotspot[aria-label="Pressure Valves"]');
await tablet.waitForSelector(".puzzle-panel");
const dial = tablet.locator(".puzzle-dial").first();
const dialBox = await dial.boundingBox();
check("puzzle dial >= 44px tall on tablet", dialBox.height >= 44, `${Math.round(dialBox.width)}x${Math.round(dialBox.height)}`);
const dialsPerRow = await tablet.evaluate(() => {
  const tops = [...document.querySelectorAll(".puzzle-dial")].map((d) => Math.round(d.getBoundingClientRect().top));
  return tops.filter((t) => t === tops[0]).length;
});
check("dials fit one row of four at tablet width", dialsPerRow === 4, `${dialsPerRow} in first row`);
check(
  "puzzle panel fits viewport",
  await tablet.evaluate(() => {
    const p = document.querySelector(".puzzle-panel").getBoundingClientRect();
    return p.bottom <= window.innerHeight && p.width <= window.innerWidth;
  }),
);
await tablet.screenshot({ path: `${OUT}/tablet-puzzle-dials.png` });
// Tap a dial to prove the touch path works end-to-end.
const before = await dial.textContent();
await dial.tap();
const after = await dial.textContent();
check("dial responds to tap", before !== after, `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
await tablet.locator(".puzzle-close").tap();

// Landscape tablet: the rail earns its column back.
const landCtx = await browser.newContext({ ...devices["iPad (gen 7) landscape"] });
const land = await landCtx.newPage();
await land.goto(`${BASE}/join/${code}`, { waitUntil: "networkidle" });
await land.fill("#join-name", "Landscape Player");
await land.getByRole("button", { name: /^Join$/ }).click();
await land.waitForURL(new RegExp(`/play/${code}$`), { timeout: 15000 });
await land.waitForSelector(".hotspot");
check(
  "history rail sits beside the scene in landscape (>= 900px)",
  (await layoutColumns(land)) === 2,
);
check(
  "rail is right of the scene in landscape",
  await land.evaluate(() => {
    const scene = document.querySelector(".scene-container").getBoundingClientRect();
    const rail = document.querySelector(".log-history").getBoundingClientRect();
    return rail.left >= scene.right;
  }),
);
check(
  "no horizontal overflow in landscape",
  await land.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
await land.screenshot({ path: `${OUT}/tablet-landscape-play.png` });

// DM console on a landscape tablet (the DM's likely real setup). The route is
// role-gated per device, so a tablet DM needs its own session created from a
// tablet context -- reusing a player's context would be correctly refused.
const dmTabCtx = await browser.newContext({ ...devices["iPad (gen 7) landscape"] });
const dmTab = await dmTabCtx.newPage();
await dmTab.goto(BASE, { waitUntil: "networkidle" });
await dmTab.fill("#display-name", "Tablet DM");
await dmTab.getByRole("button", { name: /Start a new quest/i }).click();
await dmTab.waitForURL(/\/dm\/[A-Z0-9]{6}$/, { timeout: 15000 });
await dmTab.waitForSelector(".dm-overrides");
check(
  "no horizontal overflow on DM page",
  await dmTab.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
const moveBtn = dmTab.getByRole("button", { name: /Move player/ });
const moveBox = await moveBtn.boundingBox();
check("DM override button >= 44px tall", moveBox.height >= 44, `${moveBox.height}px`);
const stepBtn = dmTab.getByRole("button", { name: "+10" });
const stepBox = await stepBtn.boundingBox();
check("DM noise stepper >= 44px tall", stepBox.height >= 44, `${stepBox.height}px`);
await dmTab.screenshot({ path: `${OUT}/tablet-dm.png`, fullPage: true });

await browser.close();
console.log(fails.length === 0 ? "\nALL TOUCH-LAYOUT CHECKS PASSED" : `\n${fails.length} FAILURES`);
process.exit(fails.length === 0 ? 0 : 1);
