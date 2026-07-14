import type { PuzzleContent } from "../schema/puzzle";

// The puzzle prompts/flavor text below are licensed CC BY-NC-SA 4.0, not
// MIT -- see /LICENSE-CONTENT.
//
// Answers are NOT here — see supabase/migrations for the RPC that validates
// attempts server-side. `id` below is the shared key passed to
// submit_puzzle_attempt(puzzle_id, value).

export const puzzles: PuzzleContent[] = [
  {
    kind: "numeric-dial",
    id: "workshop-valves",
    sceneId: "workshop",
    title: "Pressure Valves",
    // The code (2-0-1-3) is no longer engraved here -- it hides behind the
    // prison cell's loose brick, encoded as a breathing-drill ditty (both
    // arms 2, mind to nothing 0, one breath 1, pat x3 = 3). Capture is the
    // intended route to it.
    prompt:
      "Four numbered valves crown the pipe assembly, each dial cycling 0 through 3. Whatever setting the pipes want, nothing here says it.",
    onFailNoise: 30,
    wrongText:
      "Wrong pressure. The pipes SHRIEK and rattle violently — one deafening BANG for every valve that fought the setting.",
    solvedText:
      "The pipes shudder, then settle into a low, satisfied hum. A small brass valve key pops loose into your hand.",
    dials: [
      { id: "valve-1", label: "Valve 1", min: 0, max: 3 },
      { id: "valve-2", label: "Valve 2", min: 0, max: 3 },
      { id: "valve-3", label: "Valve 3", min: 0, max: 3 },
      { id: "valve-4", label: "Valve 4", min: 0, max: 3 },
    ],
    submitLabel: "Test the Pressure",
  },
  {
    kind: "ordered-sequence",
    id: "archive-books",
    sceneId: "archive",
    title: "The Colored Tomes",
    // The order clue is no longer printed plainly -- it hides on the
    // bookshelf's upper shelf as a burn-cycle haiku (violet flare -> ash ->
    // ember, no color names named; the Black Tome is the unreferenced decoy).
    prompt:
      "Four tomes stand in the shelf: violet, ash, black, and ember. Their spines are worn from being pulled, scratches on the tops and sides of the bookcase.",
    onFailNoise: 30,
    wrongText:
      "The shelf SLAMS the tomes back into place, the whole case booming against the wall — that was LOUD.",
    solvedText:
      "The three tomes click into alignment. A compartment behind the shelf swings open, revealing a lens of faintly violet glass — the Aether Lens.",
    items: [
      { id: "violet", label: "Violet Tome" },
      { id: "ash", label: "Ash Tome" },
      { id: "black", label: "Black Tome" },
      { id: "ember", label: "Ember Tome" },
    ],
    sequenceLength: 3,
  },
  {
    kind: "numeric-dial",
    id: "archive-lens",
    sceneId: "archive",
    title: "Realign the Lens",
    prompt:
      "The memory lens sits in a rotating brass housing, five sigils etched around its rim. A faint beam flickers from the Spire above — the lens must be turned to answer whatever sigil the Spire's dial now shows.",
    onFailNoise: 0,
    wrongText: "The beam scatters, unfocused — that sigil does not match the Spire's alignment.",
    solvedText:
      "The lens locks into perfect resonance. A thin violet beam lances upward toward the Vault above.",
    dials: [
      {
        id: "lens-sigil",
        label: "Lens Sigil",
        min: 0,
        max: 4,
        valueLabels: ["✦", "☾", "☉", "◈", "⚙"],
      },
    ],
    submitLabel: "Lock Alignment",
  },
  {
    kind: "elimination",
    id: "gallery-elimination",
    sceneId: "gallery",
    title: "Gallery of Automatons",
    // The answer is no longer posted plainly -- a note behind the piston
    // hound's case gives a Caesar cipher (IBASLY) whose key is the number of
    // *blinking* eyes scattered across the automatons (7: spider 3 of 4, owl 1
    // of 2, hound 1, cannon 1, and the butler flickers 1 too -- steady eyes
    // don't count); shifting back 7 spells BUTLER.
    prompt:
      "Five automatons watch from their cases. Which one will you inspect?",
    onFailNoise: 30,
    solvedText:
      "You touch the Butler and its chest panel clicks and swings open. Inside, nested where a boiler should be, sits a slow-ticking Cogwork Heart. You lift it free.",
    options: [
      {
        id: "spider",
        label: "Clockwork Spider",
        wrongFlavor: "It skitters and CLICKS violently, legs screeching against glass!",
      },
      {
        id: "owl",
        label: "Brass Owl",
        wrongFlavor: "Its eyes flare and it SHRIEKS a mechanical alarm!",
      },
      {
        id: "hound",
        label: "Piston Hound",
        wrongFlavor: "It lurches up, barking a horrible metallic bark!",
      },
      {
        id: "cuckoo",
        label: "Cuckoo Cannon",
        wrongFlavor: "It launches into a deafening fanfare!",
      },
      {
        id: "butler",
        label: "Butler",
        wrongFlavor: "",
      },
    ],
  },
  {
    kind: "ordered-sequence",
    id: "cabinet-gears",
    sceneId: "archive",
    title: "The Master Gearlock",
    // The order is nowhere on the cabinet. Each of the four symbols is hidden
    // in the room it belongs to, ringed by a count of dots = its slot; the
    // blank crown takes the leftover slot by elimination. The answer lives in
    // the RPC (submit_puzzle_attempt / dm_get_solutions) only.
    prompt:
      "Four gears sit on top of the cabinet. A mechanism missing five gears keeps making a lever spin uselessly. Each gear is etched with a small symbol. You have seen each of these marks somewhere...",
    onFailNoise: 30,
    wrongText:
      "The train jams with a shriek of tortured metal and kicks back — that was LOUD. The gears reset to their resting teeth.",
    solvedText:
      "Five gears bite as one. You pull the lever and the train spins up with a deep, resonant hum you feel in your teeth, and the cabinet's iron face folds slowly open. Cold, still air breathes out of the dark inside, and something within catches the light. It has been waiting a long time.",
    items: [
      { id: "gallery", label: "☉ Gear" },
      { id: "workshop", label: "⊹ Gear" },
      { id: "archive", label: "△ Gear" },
      { id: "spire", label: "□ Gear" },
      // Locked until the DM grants it: shown as a disabled "▢ — missing" tile
      // until flags.keystoneFound is set, then it becomes pickable under its
      // real label. The server refuses a keystone-less submit as a backstop.
      { id: "keystone", label: "Keystone Gear", requiresFlag: "keystoneFound", lockedLabel: "▢ — missing" },
    ],
    sequenceLength: 5,
  },
];
