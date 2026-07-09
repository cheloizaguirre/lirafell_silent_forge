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
    prompt: "Four numbered valves crown the pipe assembly, each dial cycling 0 through 3. Above them, a faded engraving reads: 2 – 0 – 1 – 3.",
    onFailNoise: 30,
    wrongText: "Wrong pressure. The pipes SHRIEK and rattle violently — that was LOUD.",
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
    prompt: 'Four tomes stand in the shelf: violet, ash, black, and ember. A small plaque reads: "Violet before Ash, Ash before Ember."',
    onFailNoise: 0,
    wrongText: "The shelf shifts, unimpressed, and resets itself.",
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
    kind: "elimination",
    id: "gallery-elimination",
    sceneId: "gallery",
    title: "Gallery of Automatons",
    prompt: 'A plaque reads: "Only the one who never sang served faithfully." Four of these five automatons will trigger a loud alarm if disturbed.',
    onFailNoise: 30,
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
