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

// ---- Phase 7: the cheat sheet (role-gated RPC; answers never in the bundle).
// Checked BEFORE the read-only marker below -- expanding <details> is a UI
// action, and the zero-actions invariant starts after this point.
await dm.locator(".dm-cheatsheet summary").click();
const sheet = (await dm.locator(".dm-cheatsheet").textContent()) ?? "";
check("DM cheat sheet lists every puzzle solution",
  sheet.includes("Silent Butler") &&
  sheet.includes("2 - 0 - 1 - 3") &&
  sheet.includes("Violet -> Ash -> Ember") &&
  sheet.includes("☉"));

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

// ---- Phase 6: noise is DM-facing — players get BANGs, not a gauge -----------
check("Player view has no noise gauge (noise is DM-facing now)",
  (await player.locator(".noise-gauge").count()) === 0);
check("DM console shows the noise gauge",
  (await dm.locator(".noise-gauge").count()) === 1);

// ---- Player moves: entrance -> workshop ------------------------------------
await player.click('button.hotspot[aria-label="Great Door (enter workshop)"]');
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*workshop/.test(t), "DM sees scene change to 'workshop' (realtime, no reload)");

// ---- Phase 7: corner exits are visible chips, and the entrance isn't one-way
const entranceChip = player.locator('button.hotspot-chip[aria-label="Back to Entrance Hall"]');
check("Workshop shows a visible 'Back to Entrance Hall' chip",
  (await entranceChip.count()) === 1 &&
  ((await entranceChip.textContent()) ?? "").includes("Back to Entrance Hall"));
await entranceChip.click();
await player.waitForSelector('button.hotspot[aria-label="Great Door (enter workshop)"]', { timeout: 10000 });
check("Chip navigates back to the Entrance Hall", true);
await player.click('button.hotspot[aria-label="Great Door (enter workshop)"]');
await player.waitForSelector('button.hotspot[aria-label="Door to Gallery"]', { timeout: 10000 });

// ---- Player moves: workshop -> gallery -------------------------------------
await player.click('button.hotspot[aria-label="Door to Gallery"]');
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*gallery/.test(t), "DM sees scene change to 'gallery'");
check("Gallery's 'Back to Workshop' exit is a visible chip",
  (await player.locator('button.hotspot-chip[aria-label="Back to Workshop"]').count()) === 1);

// ---- Hidden clue: the riddle caption stays hidden until the note is found ---
check("Gallery riddle caption hidden before the hound-case note is found",
  (await player.locator(".pixel-caption").count()) === 0);
await player.click(`button.hotspot[aria-label="Look behind the Spider's case"]`);
await player.waitForTimeout(250); // dust and cobwebs -- no reveal
check("Wrong case reveals nothing", (await player.locator(".pixel-caption").count()) === 0);
await player.click(`button.hotspot[aria-label="Look behind the Hound's case"]`);
await player.waitForSelector(".pixel-caption", { timeout: 10000 });
check("Hound-case note reveals the riddle caption", true);
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("galleryClueFound"),
  "DM sees galleryClueFound set party-wide");

// ---- Player opens the puzzle, answers WRONG -> noise rises ------------------
await player.click('button.hotspot[aria-label="Examine the Automatons"]');
await player.waitForSelector(".puzzle-panel", { timeout: 10000 });
check("Puzzle modal opened for player", true);

const noiseTile = ".objective:has(b:text-is('Noise'))";
// Arm the BANG watcher before the noisy click: the burst only lives ~1.2s.
const wrongAnswerBang = player
  .waitForSelector(".noise-bang-big", { timeout: 8000 })
  .then(() => true)
  .catch(() => false);
await player.getByRole("button", { name: "Brass Owl" }).click();
await waitForDm(dm, noiseTile, (t) => /Noise\s*30/.test(t), "DM sees noise rise to 30 after player's wrong answer");
check("Big BANG burst on the wrong-answer player's own screen", await wrongAnswerBang);

// ---- Player answers CORRECT -> inventory + flag -----------------------------
await player.getByRole("button", { name: "Silent Butler" }).click();
await waitForDm(dm, ".objective:has(b:text-is('Inventory'))", (t) => /heart/i.test(t), "DM sees 'heart' added to party inventory");
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("heartFound"), "DM sees 'heartFound' flag set");
// Feedback: the elimination modal dismisses itself on the correct answer.
const galleryModalGone = await player
  .waitForSelector(".puzzle-panel", { state: "detached", timeout: 10000 })
  .then(() => true)
  .catch(() => false);
check("Gallery puzzle auto-closed on the correct answer", galleryModalGone);

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
await player.click('button.hotspot[aria-label="Back to Workshop"]');
await player.click('button.hotspot[aria-label="Pressure Valves"]');
await player.waitForSelector(".puzzle-panel", { timeout: 10000 });
// Dials sit at 0-0-0-0 vs the answer 2-0-1-3: three wrong dials -> 3 BANGs
// (feedback: one BANG per wrong dial, Mastermind-style; noise stays flat +30).
const threeBangs = player
  .waitForSelector('.noise-bang-big[data-bangs="3"]', { timeout: 8000 })
  .then(() => true)
  .catch(() => false);
for (let i = 0; i < 3; i++) {
  await player.getByRole("button", { name: "Test the Pressure" }).click();
  await player.waitForTimeout(400); // let the RPC land; dials reset to 0 on fail
}
check("Wrong valve test bangs once per wrong dial (3 BANGs for 0-0-0-0)", await threeBangs);
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

// ---- The loose brick hides the valve code (feedback: it moved off the pipes)
check("Code caption hidden before the brick is worked free",
  (await player.locator(".pixel-caption").count()) === 0);
for (let i = 0; i < 3; i++) {
  await player.click('button.hotspot[aria-label="Loose Brick"]');
  await player.waitForTimeout(250);
}
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("brickOpened"),
  "DM sees brickOpened set party-wide");
const cellCaptions = await player.locator(".pixel-caption").count();
check("Brick note caption (2-0-1-3) revealed in the cell", cellCaptions === 1, `${cellCaptions} captions`);

// ---- Grate escape: three heaves, then noise resets for the whole party ------
for (let i = 0; i < 3; i++) {
  await player.click('button.hotspot[aria-label="Loose Floor Grate"]');
  await player.waitForTimeout(250);
}
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*workshop/.test(t), "Grate escape returns Player Two to workshop");
await waitForDm(dm, noiseTile, (t) => /Noise\s*0(?!\d)/.test(t), "Escape resets party noise to 0");
check("Warden alert panel is gone after the escape", (await dm.locator(".warden-alert").count()) === 0);
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("escapedPrison"),
  "DM sees escapedPrison flag set by the escape");

// ---- The corridor loop: hatch -> corridor -> cell door -> cell -> grate out --
await player.waitForSelector('button.hotspot[aria-label="Floor Hatch"]', { timeout: 10000 });
check("Workshop floor hatch appeared after the first escape", true);
await player.click('button.hotspot[aria-label="Floor Hatch"]');
await player.waitForSelector('button.hotspot[aria-label="Unlock the Cell Door"]', { timeout: 10000 });
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*prison-corridor/.test(t),
  "Roster shows Player Two on the corridor side of the bars");
await player.click('button.hotspot[aria-label="Unlock the Cell Door"]');
await player.waitForSelector('button.hotspot[aria-label="Loose Floor Grate"]', { timeout: 10000 });
check("Cell door lets the player back into the cell (and re-locks)", true);
for (let i = 0; i < 3; i++) {
  await player.click('button.hotspot[aria-label="Loose Floor Grate"]');
  await player.waitForTimeout(250);
}
await waitForDm(dm, ".player-list", (t) => /Player Two[\s\S]*workshop/.test(t),
  "Second grate escape returns Player Two to workshop");

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
// Feedback: dial puzzles now dismiss themselves on solve, like the books.
const valveModalGone = await player
  .waitForSelector(".puzzle-panel", { state: "detached", timeout: 10000 })
  .then(() => true)
  .catch(() => false);
check("Valve puzzle auto-closed on solve", valveModalGone);

// ---- Phase 6: split log — one big latest message + newest-first history -----
const latestCount = await player.locator(".log-latest p").count();
check("Latest panel holds exactly one message", latestCount === 1, `${latestCount} <p>`);
const latestText = ((await player.locator(".log-latest").textContent()) ?? "").trim();
const topBubble = ((await player.locator(".log-bubble").first().textContent()) ?? "").trim();
const bubbleCount = await player.locator(".log-bubble").count();
check("History rail is newest-first (top bubble matches the latest message)",
  bubbleCount >= 2 && topBubble === latestText, `${bubbleCount} bubbles; top ${JSON.stringify(topBubble.slice(0, 50))}`);

// ---- Archive: books in violet -> ash -> ember order --------------------------
await player.click('button.hotspot[aria-label="Door to Archive"]');

// ---- Hidden clue: the tome-order caption hides on the top shelf -------------
check("Archive order caption hidden before the shelf note is found",
  (await player.locator(".pixel-caption").count()) === 0);
await player.click(`button.hotspot[aria-label="Search the middle shelf"]`);
await player.waitForTimeout(250); // dust and cobwebs -- no reveal
check("Wrong shelf reveals nothing", (await player.locator(".pixel-caption").count()) === 0);
await player.click(`button.hotspot[aria-label="Search the top shelf"]`);
await player.waitForSelector(".pixel-caption", { timeout: 10000 });
check("Top-shelf note reveals the tome-order caption", true);
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("archiveClueFound"),
  "DM sees archiveClueFound set party-wide");

await player.click('button.hotspot[aria-label="The Colored Tomes"]');
await player.waitForSelector(".puzzle-panel", { timeout: 10000 });
for (const tome of ["Violet Tome", "Ash Tome", "Ember Tome"]) {
  await player.getByRole("button", { name: tome }).click();
  await player.waitForTimeout(250);
}
await waitForDm(dm, ".objective:has(b:text-is('Inventory'))", (t) => t.includes("lens"), "Correct tome sequence grants the Aether Lens");
// Phase 7: the sequence puzzle dismisses itself on solve -- the payoff
// (tomes settling, inventory) happens in the scene, not behind a modal.
const bookModalGone = await player
  .waitForSelector(".puzzle-panel", { state: "detached", timeout: 10000 })
  .then(() => true)
  .catch(() => false);
check("Book puzzle auto-closed after the third correct tome", bookModalGone);

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

// ============================================================================
// Phase 3 leg. Stage 2 convergence — the real multi-device bar: three devices
// act in three different rooms (Spire / Workshop / Archive) while a fourth,
// parked in the Vault, watches the convergence runes light up with zero
// interactions. Continues from Phase 2 state: Player Two in the Vault,
// allPlaced set, noise 0.
// ============================================================================

const ctxC = await browser.newContext();
const ctxD = await browser.newContext();
const ctxE = await browser.newContext();
const venter = await ctxC.newPage(); // Player Three — Workshop overflow valve
const watcher = await ctxD.newPage(); // Player Four — Vault, read-only observer
const aligner = await ctxE.newPage(); // Player Five — Archive lens
for (const [who, pg] of [["VENTER", venter], ["WATCHER", watcher], ["ALIGNER", aligner]]) {
  pg.on("console", (m) => m.type() === "error" && errors.push(`${who}: ${m.text()}`));
  pg.on("pageerror", (e) => errors.push(`${who} pageerror: ${e.message}`));
}

async function joinAs(pg, name, joinCode = code) {
  await pg.goto(`${BASE}/join/${joinCode}`, { waitUntil: "networkidle" });
  await pg.fill("#join-name", name);
  await pg.getByRole("button", { name: /^Join$/ }).click();
  await pg.waitForURL(new RegExp(`/play/${joinCode}$`), { timeout: 15000 });
}
await joinAs(venter, "Player Three");
await joinAs(watcher, "Player Four");
await joinAs(aligner, "Player Five");
check("Players Three/Four/Five joined as separate devices", true);

// ---- Position everyone: Workshop / Vault / Archive --------------------------
await venter.click('button.hotspot[aria-label="Great Door (enter workshop)"]');
await venter.waitForSelector('button.hotspot[aria-label="Door to Archive"]', { timeout: 10000 });
check("Venter has NO Overflow Valve hotspot before the Spire is armed",
  (await venter.locator('button.hotspot[aria-label="Overflow Valve"]').count()) === 0);

await watcher.click('button.hotspot[aria-label="Great Door (enter workshop)"]');
await watcher.click('button.hotspot[aria-label="Vault Door"]');
await watcher.waitForSelector('button.hotspot[aria-label="Activate the Convergence"]', { timeout: 10000 });
check("Watcher sees the convergence hotspot (allPlaced, not won)", true);
// Feedback: the vault's entry text tracks the convergence state -- at this
// point (allPlaced, nothing armed) it mentions the opened stairwell.
const vaultEntry = (await watcher.locator(".log-latest").textContent()) ?? "";
check("Vault entry text reflects allPlaced (mentions the opened stairwell)",
  vaultEntry.includes("stairwell to the Spire stands open"));
check("Watcher sees all three convergence runes dim",
  (await watcher.locator('[data-converge][data-lit="false"]').count()) === 3);

await aligner.click('button.hotspot[aria-label="Great Door (enter workshop)"]');
await aligner.click('button.hotspot[aria-label="Door to Archive"]');
await aligner.waitForSelector('button.hotspot[aria-label="Memory Imprint Lens"]', { timeout: 10000 });
check("Aligner has NO Realign the Lens hotspot before the Spire is armed",
  (await aligner.locator('button.hotspot[aria-label="Realign the Lens"]').count()) === 0);

// ---- Premature activation: server refuses, names everything missing ---------
await watcher.click('button.hotspot[aria-label="Activate the Convergence"]');
await watcher.waitForSelector(".log-latest .log-warn", { timeout: 10000 });
const resistText = (await watcher.locator(".log-latest").textContent()) ?? "";
check("Premature convergence is refused with all three parts named",
  resistText.includes("The convergence resists") &&
  resistText.includes("Spire mechanism") &&
  resistText.includes("Workshop pressure") &&
  resistText.includes("Archive lens"));

// From here until the runes are lit, the watcher takes ZERO actions.
let watcherNavigations = 0;
watcher.on("framenavigated", (f) => {
  if (f === watcher.mainFrame()) watcherNavigations += 1;
});

// ---- Room 1 (Spire): Player Two arms the great lever — LOUD ----------------
// Feedback: the stairwell moved from the Workshop to the Vault -- and Player
// Two is already standing in it after placing the components.
await player.waitForSelector('button.hotspot[aria-label="Stairwell to the Spire"]', { timeout: 10000 });
check("Spire stairwell opened in the Vault once allPlaced", true);
await player.click('button.hotspot[aria-label="Stairwell to the Spire"]');
await player.waitForSelector('button.hotspot[aria-label="Great Lever"]', { timeout: 10000 });
check("Spire exit chip leads back down to the Vault",
  (await player.locator('button.hotspot-chip[aria-label="Back to Vault"]').count()) === 1);
// Both BANG watchers armed before the heave: big on the actor, small on the
// hands-off watcher parked in the Vault (pure realtime, zero interactions).
const leverBigBang = player
  .waitForSelector(".noise-bang-big", { timeout: 8000 })
  .then(() => true)
  .catch(() => false);
const leverSmallBang = watcher
  .waitForSelector(".noise-bang-small", { timeout: 8000 })
  .then(() => true)
  .catch(() => false);
await player.click('button.hotspot[aria-label="Great Lever"]');
await waitForDm(dm, noiseTile, (t) => /Noise\s*35/.test(t), "Arming the Spire costs 35 noise (it was LOUD)");
check("Big BANG burst on the lever-heaver's own screen", await leverBigBang);
check("Small anonymous BANG on the watcher's screen via realtime", await leverSmallBang);
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("armed"), "DM sees 'armed' flag set");

// ---- Room 2 (Workshop): overflow valve APPEARS via realtime, venter vents ---
await venter.waitForSelector('button.hotspot[aria-label="Overflow Valve"]', { timeout: 15000 });
check("Overflow Valve hotspot appeared on the venter's screen via realtime", true);
await venter.click('button.hotspot[aria-label="Overflow Valve"]');
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("vented"), "DM sees 'vented' flag set");

// ---- Room 3 (Archive): realign hotspot APPEARS via realtime, aligner aligns -
await aligner.waitForSelector('button.hotspot[aria-label="Realign the Lens"]', { timeout: 15000 });
check("Realign the Lens hotspot appeared on the aligner's screen via realtime", true);
await aligner.click('button.hotspot[aria-label="Realign the Lens"]');
await aligner.waitForSelector(".puzzle-panel", { timeout: 10000 });
// Wrong sigil first (dial starts at ✦): quiet failure, no noise.
await aligner.getByRole("button", { name: "Lock Alignment" }).click();
await aligner.waitForTimeout(400);
const dmNoiseAfterMiss = (await dm.locator(noiseTile).textContent()) ?? "";
check("Wrong sigil is quiet: noise still 35", /Noise\s*35/.test(dmNoiseAfterMiss));
// Two clicks: ✦ -> ☾ -> ☉, then lock.
await aligner.locator(".puzzle-dial").click();
await aligner.locator(".puzzle-dial").click();
await aligner.getByRole("button", { name: "Lock Alignment" }).click();
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("aligned"), "DM sees 'aligned' flag set");
// Feedback: locking the alignment closes the modal by itself.
const lensModalGone = await aligner
  .waitForSelector(".puzzle-panel", { state: "detached", timeout: 10000 })
  .then(() => true)
  .catch(() => false);
check("Lock Alignment auto-closed the lens modal", lensModalGone);

// ---- The watcher's Vault lit up rune by rune, hands off the whole time ------
for (const flag of ["armed", "vented", "aligned"]) {
  await watcher.waitForSelector(`[data-converge="${flag}"][data-lit="true"]`, { timeout: 15000 });
}
check("Watcher's three convergence runes all lit via realtime", true);
check("Watcher took zero navigations/reloads while three rooms acted", watcherNavigations === 0,
  `${watcherNavigations} navigation(s)`);

// ---- Convergence: the watcher throws the final switch ------------------------
await watcher.click('button.hotspot[aria-label="Activate the Convergence"]');
await waitForDm(dm, ".objective:has(b:text-is('Flags'))", (t) => t.includes("won"), "DM sees 'won' flag set");
await watcher.waitForSelector('[data-converge="won"]', { timeout: 10000 });
const wonLog = (await watcher.locator(".log-latest").textContent()) ?? "";
check("Watcher sees the victory narration", wonLog.includes("magic has returned to the Silent Forge"));
check("Convergence hotspot is gone after the win",
  (await watcher.locator('button.hotspot[aria-label="Activate the Convergence"]').count()) === 0);

// ============================================================================
// Phase 4 leg. The DM overrides panel: force scene / clear noise / grant item.
// Force-scene and clear-noise run against the finished session; the grant test
// gets a FRESH session (this one already holds every item) where a stuck party
// is unstuck by grants alone -- no puzzles solved.
// ============================================================================

// ---- Force scene from the roster, no Warden alert involved ------------------
await dm.locator("#dm-move-player").selectOption({ label: "Player Three" });
await dm.locator("#dm-move-scene").selectOption({ label: "Gallery of Automatons" });
await dm.getByRole("button", { name: "Move player" }).click();
await venter.waitForSelector('button.hotspot[aria-label="Examine the Automatons"]', { timeout: 15000 });
check("DM's Move player pulled Player Three into the Gallery (no action on their device)", true);
await waitForDm(dm, ".player-list", (t) => /Player Three[\s\S]*gallery/.test(t), "Roster shows Player Three in 'gallery'");

// ---- Noise steppers: DM nudges the meter, players hear it -------------------
// DM-added noise routes through add_noise, so player screens get the same
// small anonymous BANG as any other bystander noise. Player Three (moved to
// the Gallery above) is our bystander.
const dmNoiseBang = venter
  .waitForSelector(".noise-bang-small", { timeout: 8000 })
  .then(() => true)
  .catch(() => false);
await dm.getByRole("button", { name: "+10" }).click();
await waitForDm(dm, noiseTile, (t) => /Noise\s*45/.test(t), "DM +10 stepper raises noise 35 -> 45");
check("DM-added noise lands as a small anonymous BANG on a player's screen", await dmNoiseBang);
await dm.getByRole("button", { name: "−10" }).click();
await waitForDm(dm, noiseTile, (t) => /Noise\s*35(?!\d)/.test(t), "DM −10 stepper lowers noise 45 -> 35");

// ---- Standalone clear-noise (the 35 from arming the Spire) ------------------
await dm.getByRole("button", { name: "Clear noise (35)" }).click();
await waitForDm(dm, noiseTile, (t) => /Noise\s*0(?!\d)/.test(t), "Standalone clear-noise resets party noise to 0");

// ---- Warden toggle: sprite + hotspot vanish live on a player device ---------
await aligner.click('button.hotspot-chip[aria-label="Back to Workshop"]');
await aligner.waitForSelector('button.hotspot[aria-label="The Dormant Warden"]', { timeout: 10000 });
await dm.getByRole("button", { name: "Hide the Warden" }).click();
const wardenGone = await aligner
  .waitForSelector('button.hotspot[aria-label="The Dormant Warden"]', { state: "detached", timeout: 15000 })
  .then(() => true)
  .catch(() => false);
check("DM's warden toggle removes the warden hotspot live via realtime", wardenGone);
await dm.getByRole("button", { name: "Hidden — bring it back" }).click();
await aligner.waitForSelector('button.hotspot[aria-label="The Dormant Warden"]', { timeout: 15000 });
check("Toggling again brings the warden back", true);

// ---- Warden jump-scare: DM summons the looming bust into a room, live -------
// Purely cosmetic overlay (flags.wardenRoom): the .warden-scare canvas slams
// over any player standing in the summoned room, and detaches on dismiss.
// aligner (Player Five) is in the Workshop from the toggle check above.
await dm.locator("#dm-scare-scene").selectOption({ label: "Workshop Floor" });
await dm.getByRole("button", { name: "Summon" }).click();
const scareShown = await aligner
  .waitForSelector(".warden-scare", { timeout: 15000 })
  .then(() => true)
  .catch(() => false);
check("DM's Summon slams the Warden jump-scare onto a player in that room via realtime", scareShown);
// The overlay is cosmetic -- it must not swallow the hotspots underneath.
check("Jump-scare overlay is aria-hidden and click-through (pointer-events: none)",
  (await aligner.getAttribute(".warden-scare", "aria-hidden")) === "true" &&
    (await aligner.evaluate(() => getComputedStyle(document.querySelector(".warden-scare")).pointerEvents)) === "none");
await dm.getByRole("button", { name: /Looming in workshop.*Dismiss/ }).click();
const scareGone = await aligner
  .waitForSelector(".warden-scare", { state: "detached", timeout: 15000 })
  .then(() => true)
  .catch(() => false);
check("DM's Dismiss clears the jump-scare live", scareGone);

// A scare summoned into a DIFFERENT room never reaches a player elsewhere:
// the overlay is gated on wardenRoom === the device's current scene.
await dm.locator("#dm-scare-scene").selectOption({ label: "Gallery of Automatons" });
await dm.getByRole("button", { name: "Summon" }).click();
await aligner.waitForTimeout(1500);
check("Jump-scare stays out of a room the player isn't in (per-room gate)",
  (await aligner.locator(".warden-scare").count()) === 0);
await dm.getByRole("button", { name: /Looming in gallery.*Dismiss/ }).click();

// ---- Grant buttons are inert when the party already holds everything --------
check("Grant buttons are disabled for items already held",
  await dm.getByRole("button", { name: "Cogwork Heart" }).isDisabled());

// ---- Fresh session: a stuck party is unstuck by grants alone ----------------
const ctxF = await browser.newContext();
const ctxG = await browser.newContext();
const dm2 = await ctxF.newPage();
const stuck = await ctxG.newPage();
for (const [who, pg] of [["DM2", dm2], ["STUCK", stuck]]) {
  pg.on("console", (m) => m.type() === "error" && errors.push(`${who}: ${m.text()}`));
  pg.on("pageerror", (e) => errors.push(`${who} pageerror: ${e.message}`));
}

await dm2.goto(BASE, { waitUntil: "networkidle" });
await dm2.fill("#display-name", "DM Redux");
await dm2.getByRole("button", { name: /Start a new quest/i }).click();
await dm2.waitForURL(/\/dm\/[A-Z0-9]{6}$/, { timeout: 15000 });
const code2 = dm2.url().split("/").pop();
check("Second session created for the grant test", !!code2 && code2 !== code, `code ${code2}`);

await joinAs(stuck, "Stuck Player", code2);
await stuck.click('button.hotspot[aria-label="Great Door (enter workshop)"]');
await stuck.waitForSelector('button.hotspot[aria-label="Vault Door"]', { timeout: 10000 });

for (const item of ["Cogwork Heart", "Aether Lens", "Pressure Valve Key"]) {
  await dm2.getByRole("button", { name: item }).click();
  await dm2.waitForTimeout(250);
}
await waitForDm(dm2, ".objective:has(b:text-is('Inventory'))",
  (t) => t.includes("heart") && t.includes("lens") && t.includes("valve"),
  "dm_grant_item stocked the fresh party's inventory");
await waitForDm(dm2, ".objective:has(b:text-is('Flags'))",
  (t) => t.includes("heartFound") && t.includes("lensFound") && t.includes("valveFound"),
  "Grants set the *Found flags exactly like real solves");

// Wait for the grants to reach the stuck player's client before touching the
// Vault Door -- the sealed and open variants share a label, so clicking early
// would hit the sealed one and just log flavor text.
// The player HUD renders inventory as pixel sprites now; the item names
// survive as visually-hidden text (Title Case), so match case-insensitively.
await waitForDm(stuck, ".objective",
  (t) => /heart/i.test(t) && /lens/i.test(t) && /valve/i.test(t),
  "Stuck player's inventory filled up via realtime");
await stuck.click('button.hotspot[aria-label="Vault Door"]');
await stuck.waitForSelector('button.hotspot[aria-label="Place Cogwork Heart"]', { timeout: 10000 });
check("Granted flags opened the Vault door -- party unstuck without solving anything", true);

await dm.screenshot({ path: `${OUT}dm-console-live.png`, fullPage: true });
await player.screenshot({ path: `${OUT}player-spire.png`, fullPage: true });
await watcher.screenshot({ path: `${OUT}watcher-vault-won.png`, fullPage: true });
await dm2.screenshot({ path: `${OUT}dm2-console-grants.png`, fullPage: true });
console.log(`\nscreenshots: ${OUT}`);

if (errors.length) {
  console.log("\n--- console/page errors ---");
  for (const e of errors) console.log("  " + e);
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
