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
    // prison cell's loose brick. Capture is the intended route to it.
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
    // The order clue ("Violet before Ash, Ash before Ember") is no longer
    // printed here -- it hides on the bookshelf's upper shelf.
    prompt:
      "Four tomes stand in the shelf: violet, ash, black, and ember. Their spines are worn from being pulled in some particular order.",
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
    wrongText: "The beam scatters, unfocused — that sigil does not match the Spire's dial.",
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
    // The riddle ("Only the one who never sang served faithfully.") is no
    // longer posted here -- it hides on a note behind the piston hound's case.
    prompt:
      "Five automatons watch from their cases. Four of them will trigger a loud alarm if disturbed; nothing marks which one is safe.",
    onFailNoise: 30,
    solvedText:
      "The Silent Butler does not react — but its chest panel clicks and swings open. Inside, nested where a boiler should be, sits a slow-ticking Cogwork Heart. You lift it free.",
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
        label: "Silent Butler",
        wrongFlavor: "",
      },
    ],
  },
];
