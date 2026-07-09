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

// ============================================================================
// Phase 2 leg. The zero-DM-actions invariant above is already banked; from
// here the DM *deliberately* acts (the Warden alert is a DM decision point).
// ============================================================================

// ---- Valve puzzle: three wrong tests push noise 30 -> 60 -> 90 -> 100 -------
await player.getByRole("button", { name: "Close" }).click(); // solved gallery modal from the leg above
await player.click('button.hotspot[aria-label="Back to Workshop"]');
await player.click('button.hotspot[aria-label="Pressure Valves"]');
await player.waitForSelector(".puzzle-panel", { timeout: 10000 });
for (let i = 0; i < 3; i++) {
  await player.getByRole("button", { name: "Test the Pressure" }).click();
  await player.waitForTimeout(400); // let the RPC land; dials reset to 0 on fail
}
await waitForDm(dm, noiseTile, (t) => /Noise\s*100/.test(t), "DM sees noise hit 100 after three failed pressure tests");

// ---- Warden alert: DM decides; nobody moved automatically -------------------
await waitForDm(dm, ".warden-alert", (t) => t.includes("Player Two"), "Warden alert names Player Two on the DM console");
const preAlertList = (await dm.locator(".player-list").textContent()) ?? "";
check("Nobody was moved automatically at noise 100", /Player Two[\s\S]*workshop/.test(preAlertList),
  "Player Two still in workshop");

await dm.getByRole("button", { name: "Send Player Two to the cell" }).click();
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*prison/.test(t), "DM's 'send to the cell' moves Player Two to prison");
await player.waitForSelector('button.hotspot[aria-label="Loose Floor Grate"]', { timeout: 10000 });
check("Player's own view switched to the prison scene", true);

// ---- Grate escape: three heaves, then noise resets for the whole party ------
for (let i = 0; i < 3; i++) {
  await player.click('button.hotspot[aria-label="Loose Floor Grate"]');
  await player.waitForTimeout(250);
}
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*workshop/.test(t), "Grate escape returns Player Two to workshop");
await waitForDm(dm, noiseTile, (t) => /Noise\s*0(?!\d)/.test(t), "Escape resets party noise to 0");
check("Warden alert panel is gone after the escape", (await dm.locator(".warden-alert").count()) === 0);

// ---- Solve the valves: dials to [2,0,1,3] ------------------------------------
await player.click('button.hotspot[aria-label="Pressure Valves"]');
await player.waitForSelector(".puzzle-panel", { timeout: 10000 });
const dialClicks = [2, 0, 1, 3];
for (let i = 0; i < dialClicks.length; i++) {
  for (let c = 0; c < dialClicks[i]; c++) {
    await player.locator(".puzzle-dial").nth(i).click();
  }
}
await player.getByRole("button", { name: "Test the Pressure" }).click();
await waitForDm(dm, ".objective:has(b:text-is('Inventory'))", (t) => t.includes("valve"), "Correct valve code grants the Pressure Valve Key");
await player.getByRole("button", { name: "Close" }).click();

// ---- Archive: books in violet -> ash -> ember order --------------------------
await player.click('button.hotspot[aria-label="Door to Archive"]');
await player.click('button.hotspot[aria-label="The Colored Tomes"]');
await player.waitForSelector(".puzzle-panel", { timeout: 10000 });
for (const tome of ["Violet Tome", "Ash Tome", "Ember Tome"]) {
  await player.getByRole("button", { name: tome }).click();
  await player.waitForTimeout(250);
}
await waitForDm(dm, ".objective:has(b:text-is('Inventory'))", (t) => t.includes("lens"), "Correct tome sequence grants the Aether Lens");
await player.getByRole("button", { name: "Close" }).click();

// ---- Vault: all three components found -> door open -> place them -----------
await player.click('button.hotspot[aria-label="Back to Workshop"]');
await player.click('button.hotspot[aria-label="Vault Door"]');
await player.waitForSelector('button.hotspot[aria-label="Place Cogwork Heart"]', { timeout: 10000 });
check("Vault door opens once all three components are in hand", true);
for (const socket of ["Place Cogwork Heart", "Place Aether Lens", "Place Pressure Valve Key"]) {
  await player.click(`button.hotspot[aria-label="${socket}"]`);
  await player.waitForSelector(`button.hotspot[aria-label="${socket}"]`, { state: "detached", timeout: 10000 });
}
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("allPlaced"), "All three placements set allPlaced on the party state");

await dm.screenshot({ path: `${OUT}dm-console-live.png`, fullPage: true });
await player.screenshot({ path: `${OUT}player-vault.png`, fullPage: true });
console.log(`\nscreenshots: ${OUT}`);

if (errors.length) {
  console.log("\n--- console/page errors ---");
  for (const e of errors) console.log("  " + e);
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
