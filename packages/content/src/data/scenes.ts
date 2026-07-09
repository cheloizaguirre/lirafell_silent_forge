import type { Scene } from "../schema/scene";

// The narrative text below (room descriptions, item/scene names, flavor
// text) is licensed CC BY-NC-SA 4.0, not MIT -- see /LICENSE-CONTENT.
//
// Phase 1 vertical-slice content only: Entrance (full), Workshop (navigation
// hotspots only — the valve puzzle is Phase 2), Gallery (full, incl. the
// elimination puzzle). Content ported verbatim (text/geometry) from the PoC
// at ~/Downloads/silent_forge(1).html. Archive, Vault, Spire, Prison are
// added in later phases.

export const scenes: Scene[] = [
  {
    id: "entrance",
    name: "Entrance Hall",
    art: { component: "EntranceArt" },
    hotspots: [
      {
        id: "great-door",
        label: "Great Door (enter workshop)",
        x: 38,
        y: 20,
        w: 26,
        h: 70,
        actions: [
          {
            type: "showText",
            text: "You push through the groaning atelier doors into the gloom beyond.",
            tone: "system",
          },
          { type: "navigate", sceneId: "workshop" },
        ],
      },
      {
        id: "slumped-automaton",
        label: "Slumped Automaton",
        x: 24,
        y: 62,
        w: 12,
        h: 22,
        actions: [
          {
            type: "showText",
            text: 'A brass valet-automaton lies collapsed against the wall, long dormant. A nameplate reads: "Voss Household Auxiliary Unit III." Beneath it, scratched by hand: "Three hearts must beat as one, or the silence never breaks."',
            tone: "flavor",
          },
        ],
      },
      {
        id: "writing-desk",
        label: "Writing Desk",
        x: 70,
        y: 68,
        w: 14,
        h: 16,
        actions: [
          {
            type: "showText",
            text: 'A hurried note, half-burned at the edges: "The defenses still watch. Do NOT make noise — the Warden cannot be fought, only avoided. If it catches you, it will not kill you... but you will not enjoy the cell." — signed with an unfamiliar hand.',
            tone: "system",
            onlyIfFlagUnset: "metWarden",
            setFlagAfter: "metWarden",
          },
          {
            type: "showText",
            text: "The note says nothing new. Its warning about the Warden still stands.",
            tone: "flavor",
            onlyIfFlagSet: "metWarden",
          },
        ],
      },
    ],
  },
  {
    id: "workshop",
    name: "Workshop Floor",
    art: { component: "WorkshopArt" },
    hotspots: [
      {
        id: "dormant-warden",
        label: "The Dormant Warden",
        x: 7,
        y: 18,
        w: 12,
        h: 46,
        actions: [
          {
            type: "showText",
            text: "An enormous steam-golem stands frozen mid-stride, riveted plates dulled by dust. Its eye-lenses are dark. Best not to give it a reason to wake.",
            tone: "flavor",
          },
        ],
      },
      {
        id: "workbench",
        label: "Workbench",
        x: 76,
        y: 60,
        w: 19,
        h: 10,
        actions: [
          {
            type: "showText",
            text: "Scattered tools, a cracked crucible, and half-finished clockwork parts too damaged to use. Nothing salvageable here.",
            tone: "flavor",
          },
        ],
      },
      {
        id: "door-archive",
        label: "Door to Archive",
        x: 2,
        y: 76,
        w: 8,
        h: 18,
        actions: [{ type: "navigate", sceneId: "archive" }],
      },
      {
        id: "door-gallery",
        label: "Door to Gallery",
        x: 90,
        y: 76,
        w: 8,
        h: 18,
        actions: [{ type: "navigate", sceneId: "gallery" }],
      },
      {
        id: "vault-door",
        label: "Vault Door",
        x: 45,
        y: 4,
        w: 10,
        h: 14,
        actions: [{ type: "navigate", sceneId: "vault" }],
        visibleWhen: {
          allOf: [
            { flag: "heartFound", equals: true },
            { flag: "lensFound", equals: true },
            { flag: "valveFound", equals: true },
          ],
        },
      },
      {
        id: "vault-door-sealed",
        label: "Vault Door",
        x: 45,
        y: 4,
        w: 10,
        h: 14,
        actions: [
          {
            type: "showText",
            text: "The vault door is sealed tight, three empty sockets visible through its grate. It will not budge without all three resonance components.",
            tone: "flavor",
          },
        ],
        visibleWhen: {
          not: {
            allOf: [
              { flag: "heartFound", equals: true },
              { flag: "lensFound", equals: true },
              { flag: "valveFound", equals: true },
            ],
          },
        },
      },
    ],
  },
  {
    id: "gallery",
    name: "Gallery of Automatons",
    art: { component: "GalleryArt" },
    hotspots: [
      {
        id: "back-to-workshop",
        label: "Back to Workshop",
        x: 2,
        y: 2,
        w: 10,
        h: 10,
        actions: [{ type: "navigate", sceneId: "workshop" }],
      },
      {
        id: "automaton-displays",
        label: "Examine the Automatons",
        x: 7.5,
        y: 30,
        w: 83,
        h: 44,
        actions: [{ type: "openPuzzle", puzzleId: "gallery-elimination" }],
        visibleWhen: { flag: "heartFound", equals: false },
      },
      {
        id: "automaton-displays-solved",
        label: "Examine the Automatons",
        x: 7.5,
        y: 30,
        w: 83,
        h: 44,
        actions: [
          {
            type: "showText",
            text: "The Silent Butler's chest panel stands open, its mechanism still. The other four automatons sit dark and unmoving.",
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "heartFound", equals: true },
      },
    ],
  },
];
