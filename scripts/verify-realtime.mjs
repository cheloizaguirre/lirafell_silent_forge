// End-to-end multi-device realtime verification. See .claude/skills/verify/SKILL.md
// for prerequisites (local Supabase up, vite on 5173, chromium installed) and the
// two gotchas that make a run fail for non-app reasons.
//
// Usage:  node scripts/verify-realtime.mjs        (BASE_URL env overrides the target)
//
// The core claim under test: a DM tab that takes ZERO actions and never reloads
// sees a second device's scene changes, noise, inventory, and flags arrive live.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const OUT = new URL("../verify-artifacts/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// Poll the DM page's DOM without ever interacting with it. This is the whole
// point: the DM tab must update purely from realtime events.
async function waitForDm(page, selector, predicate, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let last = "";
  while (Date.now() < deadline) {
    last = (await page.locator(selector).first().textContent().catch(() => "")) ?? "";
    if (predicate(last)) {
      check(label, true, `saw ${JSON.stringify(last.trim().slice(0, 70))}`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  check(label, false, `timed out after ${timeoutMs}ms; last saw ${JSON.stringify(last.trim().slice(0, 70))}`);
  return false;
}

const browser = await chromium.launch();
// Two isolated contexts = two devices = two separate anonymous auth identities.
const ctxA = await browser.newContext();
const ctxB = await browser.newContext();
const dm = await ctxA.newPage();
const player = await ctxB.newPage();

const errors = [];
for (const [who, pg] of [["DM", dm], ["PLAYER", player]]) {
  pg.on("console", (m) => m.type() === "error" && errors.push(`${who}: ${m.text()}`));
  pg.on("pageerror", (e) => errors.push(`${who} pageerror: ${e.message}`));
}

// ---- Setup: DM creates a session -------------------------------------------
await dm.goto(BASE, { waitUntil: "networkidle" });
await dm.fill("#display-name", "DM Chelo");
await dm.getByRole("button", { name: /Start a new quest/i }).click();
await dm.waitForURL(/\/dm\/[A-Z0-9]{6}$/, { timeout: 15000 });
const code = dm.url().split("/").pop();
check("DM created session and landed on /dm/<code>", !!code, `code ${code}`);
await dm.waitForSelector(".player-list li", { timeout: 15000 });

// From here on the DM page is READ-ONLY. Count any navigation/reload on it.
let dmNavigations = 0;
dm.on("framenavigated", (f) => {
  if (f === dm.mainFrame()) dmNavigations += 1;
});

// ---- Player joins on a separate device -------------------------------------
await player.goto(`${BASE}/join/${code}`, { waitUntil: "networkidle" });
await player.fill("#join-name", "Player Two");
await player.getByRole("button", { name: /^Join$/ }).click();
await player.waitForURL(new RegExp(`/play/${code}$`), { timeout: 15000 });
check("Player joined and landed on /play/<code>", true);

// If ONLY the next two checks fail (join invisible, but scene changes below
// arrive), that's the Realtime cold-start gotcha — rerun before debugging.
await waitForDm(dm, ".player-list", (t) => t.includes("Player Two"), "DM sees the new player appear live");
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*entrance/.test(t), "DM sees Player Two in 'entrance'");

// ---- Player moves: entrance -> workshop ------------------------------------
await player.click('button.hotspot[aria-label="Great Door (enter workshop)"]');
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*workshop/.test(t), "DM sees scene change to 'workshop' (realtime, no reload)");

// ---- Player moves: workshop -> gallery -------------------------------------
await player.click('button.hotspot[aria-label="Door to Gallery"]');
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*gallery/.test(t), "DM sees scene change to 'gallery'");

// ---- Player opens the puzzle, answers WRONG -> noise rises ------------------
await player.click('button.hotspot[aria-label="Examine the Automatons"]');
await player.waitForSelector(".puzzle-panel", { timeout: 10000 });
check("Puzzle modal opened for player", true);

const noiseTile = ".objective:has(b:text-is('Noise'))";
await player.getByRole("button", { name: "Brass Owl" }).click();
await waitForDm(dm, noiseTile, (t) => /Noise\s*30/.test(t), "DM sees noise rise to 30 after player's wrong answer");

// ---- Player answers CORRECT -> inventory + flag -----------------------------
await player.getByRole("button", { name: "Silent Butler" }).click();
await waitForDm(dm, ".objective:has(b:text-is('Inventory'))", (t) => t.includes("heart"), "DM sees 'heart' added to party inventory");
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("heartFound"), "DM sees 'heartFound' flag set");

// ---- The actual claim: the DM tab never navigated or reloaded ---------------
check("DM tab took zero navigations/reloads while player acted", dmNavigations === 0, `${dmNavigations} navigation(s)`);

// Sanity: the DM's own scene never moved (scene is per-player, not party-shared).
const dmList = (await dm.locator(".player-list").textContent()) ?? "";
check("Scene is per-player: DM still in 'entrance' while player is in 'gallery'",
  /DM Chelo[\s\S]*entrance/.test(dmList) && /Player Two[\s\S]*gallery/.test(dmList));

await dm.screenshot({ path: `${OUT}dm-console-live.png`, fullPage: true });
await player.screenshot({ path: `${OUT}player-gallery.png`, fullPage: true });
console.log(`\nscreenshots: ${OUT}`);

if (errors.length) {
  console.log("\n--- console/page errors ---");
  for (const e of errors) console.log("  " + e);
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
