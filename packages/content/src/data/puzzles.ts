import type { PuzzleContent } from "../schema/puzzle";

// The puzzle prompts/flavor text below are licensed CC BY-NC-SA 4.0, not
// MIT -- see /LICENSE-CONTENT.
//
// Answers are NOT here — see supabase/migrations for the RPC that validates
// attempts server-side. `id` below is the shared key passed to
// submit_puzzle_attempt(puzzle_id, value).

export const puzzles: PuzzleContent[] = [
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
