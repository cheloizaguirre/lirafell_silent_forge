// Phase 5 mobile-layout verification: drive the app on an emulated phone
// (iPhone 13 descriptor -- coarse pointer + touch) and measure what the CSS
// actually produced: no horizontal overflow, 44px controls, expanded hotspot
// tap areas, dial wrap, and the tap event path itself.
//
// Usage:  pnpm verify:mobile   (same prerequisites as verify:realtime)
import { mkdirSync } from "node:fs";
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const OUT = new URL("../verify-artifacts/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
// DM on a desktop context, player on an emulated iPhone.
const dmCtx = await browser.newContext();
const phoneCtx = await browser.newContext({ ...devices["iPhone 13"] });
const dm = await dmCtx.newPage();
const phone = await phoneCtx.newPage();

const fails = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails.push(name);
};

// DM creates a session (desktop).
await dm.goto(BASE, { waitUntil: "networkidle" });
await dm.fill("#display-name", "DM Mobile Check");
await dm.getByRole("button", { name: /Start a new quest/i }).click();
await dm.waitForURL(/\/dm\/[A-Z0-9]{6}$/, { timeout: 15000 });
const code = dm.url().split("/").pop();

// Phone: join flow.
await phone.goto(`${BASE}/join/${code}`, { waitUntil: "networkidle" });
check(
  "phone reports coarse pointer",
  await phone.evaluate(() => matchMedia("(pointer: coarse)").matches),
);
check(
  "no horizontal overflow on join page",
  await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
await phone.screenshot({ path: `${OUT}/mobile-join.png` });
await phone.fill("#join-name", "Phone Player");
const joinBtn = phone.getByRole("button", { name: /^Join$/ });
const joinBox = await joinBtn.boundingBox();
check("join button >= 44px tall", joinBox.height >= 44, `${joinBox.height}px`);
await joinBtn.click();
await phone.waitForURL(new RegExp(`/play/${code}$`), { timeout: 15000 });
await phone.waitForSelector(".hotspot");

check(
  "no horizontal overflow on play page",
  await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
await phone.screenshot({ path: `${OUT}/mobile-play-entrance.png` });

// Tap-target measurement: the effective hit area of every hotspot must be
// >= 44x44 (the ::before expansion). Pseudo-element boxes aren't in the DOM,
// so probe with elementFromPoint at the padded corners of each hotspot.
const hitAreas = await phone.evaluate(() => {
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
await phone.tap('button.hotspot[aria-label="Great Door (enter workshop)"]');
await phone.waitForSelector('button.hotspot[aria-label="Pressure Valves"]', { timeout: 15000 });
await phone.tap('button.hotspot[aria-label="Pressure Valves"]');
await phone.waitForSelector(".puzzle-panel");
const dial = phone.locator(".puzzle-dial").first();
const dialBox = await dial.boundingBox();
check("puzzle dial >= 44px tall on phone", dialBox.height >= 44, `${Math.round(dialBox.width)}x${Math.round(dialBox.height)}`);
const dialsPerRow = await phone.evaluate(() => {
  const tops = [...document.querySelectorAll(".puzzle-dial")].map((d) => Math.round(d.getBoundingClientRect().top));
  return tops.filter((t) => t === tops[0]).length;
});
check("dials wrap on narrow screen (2 per row)", dialsPerRow === 2, `${dialsPerRow} in first row`);
check(
  "puzzle panel fits viewport",
  await phone.evaluate(() => {
    const p = document.querySelector(".puzzle-panel").getBoundingClientRect();
    return p.bottom <= window.innerHeight && p.width <= window.innerWidth;
  }),
);
await phone.screenshot({ path: `${OUT}/mobile-puzzle-dials.png` });
// Tap a dial to prove the touch path works end-to-end.
const before = await dial.textContent();
await dial.tap();
const after = await dial.textContent();
check("dial responds to tap", before !== after, `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
await phone.locator(".puzzle-close").tap();

// DM console on a phone (the DM might run it from a phone too). The route is
// role-gated per device, so a phone DM needs its own session created from a
// phone context -- reusing the player's context would be correctly refused.
const dmPhoneCtx = await browser.newContext({ ...devices["iPhone 13"] });
const dmPhone = await dmPhoneCtx.newPage();
await dmPhone.goto(BASE, { waitUntil: "networkidle" });
await dmPhone.fill("#display-name", "Phone DM");
await dmPhone.getByRole("button", { name: /Start a new quest/i }).click();
await dmPhone.waitForURL(/\/dm\/[A-Z0-9]{6}$/, { timeout: 15000 });
await dmPhone.waitForSelector(".dm-overrides");
check(
  "no horizontal overflow on DM page",
  await dmPhone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
);
const moveBtn = dmPhone.getByRole("button", { name: /Move player/ });
const moveBox = await moveBtn.boundingBox();
check("DM override button >= 44px tall", moveBox.height >= 44, `${moveBox.height}px`);
await dmPhone.screenshot({ path: `${OUT}/mobile-dm.png`, fullPage: true });

await browser.close();
console.log(fails.length === 0 ? "\nALL MOBILE CHECKS PASSED" : `\n${fails.length} FAILURES`);
process.exit(fails.length === 0 ? 0 : 1);
