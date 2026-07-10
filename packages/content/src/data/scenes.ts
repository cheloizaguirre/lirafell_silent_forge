import type { Scene } from "../schema/scene";

// The narrative text below (room descriptions, item/scene names, flavor
// text) is licensed CC BY-NC-SA 4.0, not MIT -- see /LICENSE-CONTENT.
//
// All seven scenes: Stage 1 (Entrance, Workshop, Archive, Gallery, Vault,
// Prison — Phases 1+2) and Stage 2 convergence (Spire + the armed/vented/
// aligned hotspots — Phase 3). Content ported verbatim (text/geometry) from
// the PoC at ~/Downloads/silent_forge(1).html.

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
        id: "pressure-valves",
        label: "Pressure Valves",
        x: 36,
        y: 30,
        w: 29,
        h: 14,
        actions: [{ type: "openPuzzle", puzzleId: "workshop-valves" }],
        visibleWhen: { flag: "valveFound", equals: false },
      },
      {
        id: "pressure-valves-solved",
        label: "Pressure Valves",
        x: 36,
        y: 30,
        w: 29,
        h: 14,
        actions: [
          {
            type: "showText",
            text: "The pipes hold a low, satisfied hum. The pressure is balanced; the valve key is already yours.",
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "valveFound", equals: true },
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
        id: "spire-stair",
        label: "Stairwell to the Spire",
        x: 25,
        y: 13,
        w: 8,
        h: 20,
        actions: [{ type: "navigate", sceneId: "spire" }],
        visibleWhen: { flag: "allPlaced", equals: true },
      },
      {
        id: "overflow-valve",
        label: "Overflow Valve",
        x: 67,
        y: 42,
        w: 7,
        h: 10,
        actions: [
          {
            type: "ventOverflow",
            successText:
              "You crank the overflow valve. Pressure releases in a long, controlled sigh — quiet, contained, safe.",
            alreadyVentedText: "The overflow valve is already open; pressure flows smoothly.",
          },
        ],
        visibleWhen: {
          allOf: [
            { flag: "armed", equals: true },
            { flag: "vented", equals: false },
          ],
        },
      },
      {
        id: "overflow-valve-open",
        label: "Overflow Valve",
        x: 67,
        y: 42,
        w: 7,
        h: 10,
        actions: [
          {
            type: "showText",
            text: "The overflow valve is already open; pressure flows smoothly.",
            tone: "flavor",
          },
        ],
        visibleWhen: {
          allOf: [
            { flag: "armed", equals: true },
            { flag: "vented", equals: true },
          ],
        },
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
  {
    id: "archive",
    name: "Archive & Study",
    art: { component: "ArchiveArt" },
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
        id: "colored-tomes",
        label: "The Colored Tomes",
        x: 5,
        y: 46,
        w: 32,
        h: 34,
        actions: [{ type: "openPuzzle", puzzleId: "archive-books" }],
        visibleWhen: { flag: "lensFound", equals: false },
      },
      {
        id: "colored-tomes-solved",
        label: "The Colored Tomes",
        x: 5,
        y: 46,
        w: 32,
        h: 34,
        actions: [
          {
            type: "showText",
            text: "The three tomes rest in perfect alignment. The hidden compartment behind the shelf stands open and empty.",
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "lensFound", equals: true },
      },
      {
        id: "memory-lens",
        label: "Memory Imprint Lens",
        x: 60,
        y: 55,
        w: 8,
        h: 28,
        actions: [
          {
            type: "showText",
            text: 'You turn the brass dial. A recorded voice crackles to life, thin and tired: "...if you are hearing this, I am long gone, and the wardens still walk. I built them to guard what should not be woken carelessly. Three keys still my work: a heart that beats without blood, a lens that bends light no eye can see, and a valve that holds back the pressure of a mountain. Silence them all at once, in the antechamber, and the field will fall... Forgive me for what I could not finish." The recording fades to static.',
            tone: "system",
            onlyIfFlagUnset: "heardVossRecording",
            setFlagAfter: "heardVossRecording",
          },
          {
            type: "showText",
            text: "The recording crackles through once more, no less tired the second time. Three keys: a heart, a lens, a valve — silenced together in the antechamber.",
            tone: "flavor",
            onlyIfFlagSet: "heardVossRecording",
          },
        ],
      },
      // Deliberately AFTER memory-lens in this array so it stacks on top of
      // the overlapping memory-lens hotspot while active (PoC parity: the
      // realign controls cover the recording dial until the lens locks).
      {
        id: "lens-realign",
        label: "Realign the Lens",
        x: 60,
        y: 55,
        w: 8,
        h: 23,
        actions: [{ type: "openPuzzle", puzzleId: "archive-lens" }],
        visibleWhen: {
          allOf: [
            { flag: "armed", equals: true },
            { flag: "aligned", equals: false },
          ],
        },
      },
      {
        id: "locked-cabinet",
        label: "Locked Cabinet",
        x: 78,
        y: 52,
        w: 15,
        h: 32,
        actions: [
          {
            type: "showText",
            text: "A cabinet, sealed with a gear-shaped lock you have no key for. Whatever Voss kept in here, he meant to keep it hidden.",
            tone: "flavor",
          },
        ],
      },
    ],
  },
  {
    id: "vault",
    name: "Vault Antechamber",
    art: { component: "VaultArt" },
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
        id: "socket-heart",
        label: "Place Cogwork Heart",
        x: 41,
        y: 42,
        w: 6,
        h: 10,
        actions: [
          {
            type: "placeItem",
            itemId: "heart",
            successText: "The Cogwork Heart slots into place with a satisfying click.",
            missingText: "You don't have the Cogwork Heart yet.",
            allPlacedText:
              "The three components lock into their sockets and hum in unison — but nothing releases. Instead, a grinding shudder runs through the floor: somewhere above, a stairwell to a long-sealed Spire has ground open. The mechanism needs more than components. It needs to be run.",
          },
        ],
        visibleWhen: { not: { flag: "placedHeart", equals: true } },
      },
      {
        id: "socket-lens",
        label: "Place Aether Lens",
        x: 48,
        y: 44,
        w: 5,
        h: 8,
        actions: [
          {
            type: "placeItem",
            itemId: "lens",
            successText: "The Aether Lens slots into place with a satisfying click.",
            missingText: "You don't have the Aether Lens yet.",
            allPlacedText:
              "The three components lock into their sockets and hum in unison — but nothing releases. Instead, a grinding shudder runs through the floor: somewhere above, a stairwell to a long-sealed Spire has ground open. The mechanism needs more than components. It needs to be run.",
          },
        ],
        visibleWhen: { not: { flag: "placedLens", equals: true } },
      },
      {
        id: "socket-valve",
        label: "Place Pressure Valve Key",
        x: 53,
        y: 44,
        w: 5,
        h: 8,
        actions: [
          {
            type: "placeItem",
            itemId: "valve",
            successText: "The Pressure Valve Key slots into place with a satisfying click.",
            missingText: "You don't have the Pressure Valve Key yet.",
            allPlacedText:
              "The three components lock into their sockets and hum in unison — but nothing releases. Instead, a grinding shudder runs through the floor: somewhere above, a stairwell to a long-sealed Spire has ground open. The mechanism needs more than components. It needs to be run.",
          },
        ],
        visibleWhen: { not: { flag: "placedValve", equals: true } },
      },
      {
        id: "activate-convergence",
        label: "Activate the Convergence",
        x: 38,
        y: 60,
        w: 24,
        h: 8,
        actions: [
          {
            type: "activateConvergence",
            successText:
              "The chamber floods with violet light. A final, resonant CHIME rolls through the workshop, and the anti-aether field shatters into drifting motes of light. The air itself feels different — magic has returned to the Silent Forge.",
            resistPrefix: "The convergence resists — ",
            missingTexts: {
              armed: "the Spire mechanism has not been armed",
              vented: "the Workshop pressure has not been vented",
              aligned: "the Archive lens has not been aligned",
            },
          },
        ],
        visibleWhen: {
          allOf: [
            { flag: "allPlaced", equals: true },
            { flag: "won", equals: false },
          ],
        },
      },
    ],
  },
  {
    id: "spire",
    name: "The Aether Spire",
    art: { component: "SpireArt" },
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
      // Three mutually exclusive lever states. The !allPlaced variant is
      // unreachable in normal play (the Spire stair only opens at allPlaced)
      // but kept for PoC parity in case the DM force-scenes someone here.
      {
        id: "great-lever-stuck",
        label: "Great Lever",
        x: 44,
        y: 60,
        w: 12,
        h: 8,
        actions: [
          {
            type: "showText",
            text: "The lever will not budge. Whatever this mechanism does, it clearly answers to something else first — the vault below, perhaps, once it is properly fed.",
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "allPlaced", equals: false },
      },
      {
        id: "great-lever",
        label: "Great Lever",
        x: 44,
        y: 60,
        w: 12,
        h: 8,
        actions: [
          {
            type: "armSpire",
            successText:
              "You heave the lever down. Somewhere far below, gears the size of wagon wheels begin to grind. The dial spins wildly and CLANGS to a stop — that was LOUD.",
            alreadyArmedText:
              "The lever is already thrown. The dial holds steady on its sigil, and the mechanism churns on.",
          },
        ],
        visibleWhen: {
          allOf: [
            { flag: "allPlaced", equals: true },
            { flag: "armed", equals: false },
          ],
        },
      },
      {
        id: "great-lever-thrown",
        label: "Great Lever",
        x: 44,
        y: 60,
        w: 12,
        h: 8,
        actions: [
          {
            type: "showText",
            text: "The lever is already thrown. The dial holds steady on its sigil, and the mechanism churns on.",
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "armed", equals: true },
      },
    ],
  },
  {
    id: "prison",
    name: "Prison Cell",
    art: { component: "PrisonArt" },
    onEnter: [
      {
        type: "showText",
        text: "You wake in a small holding cell, rune-etched bars dulled with rust. The Warden is nowhere in sight — it never follows this far. Everything you carried is still with you.",
        tone: "system",
      },
    ],
    hotspots: [
      {
        id: "loose-grate",
        label: "Loose Floor Grate",
        x: 41,
        y: 74,
        w: 8,
        h: 8,
        actions: [
          {
            type: "repeatClick",
            counterId: "prison-grate",
            timesRequired: 3,
            textsByStep: [
              "You wedge your fingers under the grate and heave. It groans but holds.",
              "Rust flakes away in a shower. The grate shifts, almost free.",
              "With a final wrench, the grate tears loose. A cramped duct leads back toward the workshop floor.",
            ],
            onComplete: [{ type: "escapePrison" }],
          },
        ],
      },
    ],
  },
];
