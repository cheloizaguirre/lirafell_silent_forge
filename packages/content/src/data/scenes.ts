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
    onEnter: [
      {
        type: "showText",
        text: "Cold air, machine oil, and dust. The entrance hall of Voss's atelier is silent but for a guttering candle on a writing desk. A brass automaton lies slumped against the wall, and the great door into the workshop looms ahead.",
        tone: "system",
      },
    ],
    hotspots: [
      {
        id: "great-door",
        label: "Great Door (enter workshop)",
        // proto-vault-8bit feedback: raised to frame the whole arch (stone
        // surround y11-80px) instead of hanging low past the threshold.
        x: 37,
        y: 12,
        w: 27,
        h: 68,
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
        // proto-vault-8bit: grown to cover the pixel colossus (head included);
        // the SVG original's box was x24,y62,w12,h22.
        x: 22,
        y: 44,
        w: 17,
        h: 42,
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
        // proto-vault-8bit feedback: grown to cover the full desk sprite
        // including the note and candle flame (art x111-131px, y66-87px).
        x: 68,
        y: 66,
        w: 16,
        h: 24,
        actions: [
          // One merged message, printed on every click (feedback fix for the
          // old first-read/re-read flag pair double-printing).
          {
            type: "showText",
            text: 'A hurried note, half-burned at the edges: "The defenses still watch. Do NOT make noise — the Warden cannot be fought, only avoided. If it catches you, it will not kill you... but you will not enjoy the cell." — signed with an unfamiliar hand. Its warning still stands.',
            tone: "system",
          },
        ],
      },
    ],
  },
  {
    id: "workshop",
    name: "Workshop Floor",
    art: { component: "WorkshopArt" },
    // Two mutually exclusive variants: don't narrate the Warden when the DM
    // has hidden it (`when` gates on party flags; an unset flag reads false).
    onEnter: [
      {
        type: "showText",
        text: "The workshop floor sprawls beneath a groaning web of pipes. A heavy vault door is set high in the far wall, doorways lead off to the archive and the gallery — and an enormous steam-golem stands dormant in its alcove. Quietly, now.",
        tone: "system",
        when: { flag: "wardenHidden", equals: false },
      },
      {
        type: "showText",
        text: "The workshop floor sprawls beneath a groaning web of pipes. A heavy vault door is set high in the far wall, and doorways lead off to the archive and the gallery. The warden's alcove stands empty.",
        tone: "system",
        when: { flag: "wardenHidden", equals: true },
      },
    ],
    hotspots: [
      {
        // Not in the PoC (which had no way back at all) -- added in Phase 7
        // so the entrance isn't a one-way door. Same corner-chip convention
        // as the rooms' "Back to Workshop".
        id: "back-to-entrance",
        label: "Back to Entrance Hall",
        x: 2,
        y: 2,
        w: 10,
        h: 10,
        chip: true,
        actions: [{ type: "navigate", sceneId: "entrance" }],
      },
      {
        id: "dormant-warden",
        label: "The Dormant Warden",
        // proto-vault-8bit: grown to cover the pixel colossus in its alcove,
        // then shifted further right (feedback) to clear the archive doorway;
        // the SVG original's box was x7,y18,w12,h46. Hidden when the DM
        // toggles the warden away (future jump-scare hook).
        x: 15,
        y: 16,
        w: 15,
        h: 62,
        actions: [
          {
            type: "showText",
            text: "An enormous steam-golem stands frozen mid-stride, riveted plates dulled by dust. Its eye-lenses are dark. Best not to give it a reason to wake.",
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "wardenHidden", equals: false },
      },
      {
        id: "pressure-valves",
        label: "Pressure Valves",
        // proto-vault-8bit feedback: the pipe run dropped to knee height
        // (art run y66-69px, wheels y64-70, drops to the floor seam).
        x: 36,
        y: 58,
        w: 29,
        h: 16,
        actions: [{ type: "openPuzzle", puzzleId: "workshop-valves" }],
        visibleWhen: { flag: "valveFound", equals: false },
      },
      {
        id: "pressure-valves-solved",
        label: "Pressure Valves",
        x: 36,
        y: 58,
        w: 29,
        h: 16,
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
        // proto-vault-8bit feedback: bench shifted left to clear the gallery
        // doorway (art x110-139px, tools y58-62, legs to the floor seam).
        x: 67,
        y: 56,
        w: 20,
        h: 24,
        actions: [
          {
            type: "showText",
            text: "Scattered tools, a cracked crucible, and half-finished clockwork parts too damaged to use. Nothing salvageable here.",
            tone: "flavor",
          },
        ],
      },
      {
        id: "prison-hatch",
        label: "Floor Hatch",
        // The duct the party escaped through, propped open -- drops back down
        // to the corridor side of the prison bars (art x49-59px, y83-89).
        x: 29,
        y: 80,
        w: 10,
        h: 12,
        actions: [
          {
            type: "showText",
            text: "You lower yourself into the cramped duct and crawl back the way you once escaped, coming up on the corridor side of the cell bars.",
            tone: "system",
          },
          { type: "navigate", sceneId: "prison-corridor" },
        ],
        visibleWhen: { flag: "escapedPrison", equals: true },
      },
      {
        id: "overflow-valve",
        label: "Overflow Valve",
        // proto-vault-8bit feedback: vertical stub rising from the center of
        // the pipe run (art wheel x76-84px y51-59, stub down to y66, sparks
        // above), moved off the workbench.
        x: 45,
        y: 46,
        w: 11,
        h: 22,
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
        x: 45,
        y: 46,
        w: 11,
        h: 22,
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
        // proto-vault-8bit: raised onto the wall as a proper doorway; the
        // SVG original's floor-corner box was x2,y76,w8,h18.
        x: 2,
        y: 56,
        w: 9,
        h: 22,
        actions: [{ type: "navigate", sceneId: "archive" }],
      },
      {
        id: "door-gallery",
        label: "Door to Gallery",
        // proto-vault-8bit: raised onto the wall as a proper doorway; the
        // SVG original's floor-corner box was x90,y76,w8,h18.
        x: 89,
        y: 56,
        w: 9,
        h: 22,
        actions: [{ type: "navigate", sceneId: "gallery" }],
      },
      {
        id: "vault-door",
        label: "Vault Door",
        // proto-vault-8bit feedback: grown to room-door proportions
        // (art x70-90px, y6-42 including the threshold ledge).
        x: 43,
        y: 4,
        w: 14,
        h: 38,
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
        x: 43,
        y: 4,
        w: 14,
        h: 38,
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
    onEnter: [
      {
        type: "showText",
        text: "Five wood-and-brass display cases line the gallery, each holding a dead-still automaton. Four pairs of ember eyes smolder as you pass. The fifth exhibit, a butler in tarnished livery, watches with one calm pale eye.",
        tone: "system",
        when: { flag: "heartFound", equals: false },
      },
      {
        type: "showText",
        text: "The gallery sits dark and finished. Five automatons stand lifeless in their cases; the Silent Butler's chest panel hangs open and empty.",
        tone: "system",
        when: { flag: "heartFound", equals: true },
      },
    ],
    hotspots: [
      {
        id: "back-to-workshop",
        label: "Back to Workshop",
        x: 2,
        y: 2,
        w: 10,
        h: 10,
        chip: true,
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
      // "Look behind the case" strips along each case's plinth/nameplate zone.
      // Deliberately AFTER automaton-displays so they stack on top of its big
      // box (array order is stacking order). Only the hound's hides anything:
      // the riddle note that used to be a plaque (party flag galleryClueFound).
      {
        id: "behind-case-spider",
        label: "Look behind the Spider's case",
        x: 7.5,
        y: 61,
        w: 13.75,
        h: 13,
        actions: [
          { type: "showText", text: "Nothing here but dust and cobwebs.", tone: "flavor" },
        ],
      },
      {
        id: "behind-case-owl",
        label: "Look behind the Owl's case",
        x: 25,
        y: 61,
        w: 13.75,
        h: 13,
        actions: [
          { type: "showText", text: "Nothing here but dust and cobwebs.", tone: "flavor" },
        ],
      },
      {
        id: "behind-case-hound",
        label: "Look behind the Hound's case",
        x: 42.5,
        y: 61,
        w: 13.75,
        h: 13,
        actions: [
          { type: "setPartyFlag", flag: "galleryClueFound" },
          {
            type: "showText",
            text: 'Wedged behind the piston hound\'s case, your fingers find a folded slip of paper. In a careful hand it reads: "The guilty cannot hold still. Count how many automatons let their eyes flicker and blink — that count is your key. Shift each letter back by it to name the one you may trust: FYXPIV."',
            tone: "system",
          },
        ],
        visibleWhen: { flag: "galleryClueFound", equals: false },
      },
      {
        id: "behind-case-hound-found",
        label: "Look behind the Hound's case",
        x: 42.5,
        y: 61,
        w: 13.75,
        h: 13,
        actions: [
          {
            type: "showText",
            text: 'The paper note rests where it was found: "Count the automatons whose eyes flicker and blink; shift each letter of FYXPIV back by that many to name the one you may trust."',
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "galleryClueFound", equals: true },
      },
      {
        id: "behind-case-cannon",
        label: "Look behind the Cannon's case",
        x: 60,
        y: 61,
        w: 13.75,
        h: 13,
        actions: [
          { type: "showText", text: "Nothing here but dust and cobwebs.", tone: "flavor" },
        ],
      },
      {
        id: "behind-case-butler",
        label: "Look behind the Butler's case",
        x: 77.5,
        y: 61,
        w: 13.75,
        h: 13,
        actions: [
          { type: "showText", text: "Nothing here but dust and cobwebs.", tone: "flavor" },
        ],
      },
    ],
  },
  {
    id: "archive",
    name: "Archive & Study",
    art: { component: "ArchiveArt" },
    onEnter: [
      {
        type: "showText",
        text: "Paper dust hangs in the Archive's still air. A great bookshelf dominates the left wall, four fat colored tomes wedged among the clutter. A memory lens waits on its pedestal, and a locked cabinet sulks in the corner.",
        tone: "system",
      },
    ],
    hotspots: [
      {
        id: "back-to-workshop",
        label: "Back to Workshop",
        x: 2,
        y: 2,
        w: 10,
        h: 10,
        chip: true,
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
      // Top shelf hides the order clue (a burn-cycle haiku: violet flare ->
      // ash -> ember, no color names; the Black Tome is the unnamed decoy).
      // The middle shelf is honest dust. Both sit above the colored-tomes box.
      {
        id: "shelf-top",
        label: "Search the top shelf",
        x: 6,
        y: 20,
        w: 30,
        h: 12,
        actions: [
          { type: "setPartyFlag", flag: "archiveClueFound" },
          {
            type: "showText",
            text: 'Tucked behind the top shelf\'s spines, your fingers find a slip of paper. Three lines in a careful hand: "Twilight-crowned, it flares / then sinks to pale grey stillness / one coal, still breathing."',
            tone: "system",
          },
        ],
        visibleWhen: { flag: "archiveClueFound", equals: false },
      },
      {
        id: "shelf-top-found",
        label: "Search the top shelf",
        x: 6,
        y: 20,
        w: 30,
        h: 12,
        actions: [
          {
            type: "showText",
            text: 'The slip of paper rests where it was found: "Twilight-crowned, it flares / then sinks to pale grey stillness / one coal, still breathing."',
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "archiveClueFound", equals: true },
      },
      {
        id: "shelf-middle",
        label: "Search the middle shelf",
        x: 6,
        y: 33,
        w: 30,
        h: 13,
        actions: [
          { type: "showText", text: "Nothing here but dust and cobwebs.", tone: "flavor" },
        ],
      },
      {
        id: "memory-lens",
        label: "Memory Imprint Lens",
        // proto-vault-8bit feedback: grown to cover ring + glass + pedestal
        // (art x97-110px, y53-78). Hidden while "Realign the Lens" is live so
        // the two zones never overlap.
        x: 59,
        y: 50,
        w: 10,
        h: 30,
        actions: [
          // One merged message, printed on every click (feedback fix for the
          // old first-listen/re-listen flag pair double-printing).
          {
            type: "showText",
            text: 'You turn the brass dial. A recorded voice crackles to life, thin and tired: "...if you are hearing this, I am long gone, and the wardens still walk. I built them to guard what should not be woken carelessly. Three keys still my work: a heart that beats without blood, a lens that bends light no eye can see, and a valve that holds back the pressure of a mountain. Silence them all at once, in the antechamber, and the field will fall... Forgive me for what I could not finish." The recording fades to static.',
            tone: "system",
          },
        ],
        // Hidden exactly while lens-realign is live (feedback: the stale
        // recording zone overlapped the realign zone).
        visibleWhen: {
          anyOf: [
            { flag: "armed", equals: false },
            { flag: "aligned", equals: true },
          ],
        },
      },
      {
        id: "lens-realign",
        label: "Realign the Lens",
        // Same box as memory-lens -- exactly one of the two is visible at a
        // time (memory-lens hides while armed && !aligned).
        x: 59,
        y: 50,
        w: 10,
        h: 30,
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
    // Mutually exclusive entry texts tracking the three convergence diamonds
    // (feedback: the vault should announce which sigils are active on entry).
    // vent and align are independent once armed, so both orders get a variant.
    onEnter: [
      {
        type: "showText",
        text: "The vault antechamber. A chunky steel containment ring is set into the far wall above a stone pedestal — three empty sockets shaped for a heart, a lens, and a valve.",
        tone: "system",
        when: { flag: "allPlaced", equals: false },
      },
      {
        type: "showText",
        text: "The three components hum in their sockets. Along the floor, three dim diamond sigils wait unlit — spire armed, pressure vented, lens aligned — and a stairwell to the Spire stands open in the wall.",
        tone: "system",
        when: {
          allOf: [
            { flag: "allPlaced", equals: true },
            { flag: "armed", equals: false },
          ],
        },
      },
      {
        type: "showText",
        text: "The SPIRE ARMED sigil burns violet on the floor — the lever above has been thrown. The pressure-vented and lens-aligned diamonds still wait dark.",
        tone: "system",
        when: {
          allOf: [
            { flag: "armed", equals: true },
            { flag: "vented", equals: false },
            { flag: "aligned", equals: false },
          ],
        },
      },
      {
        type: "showText",
        text: "Two sigils burn on the floor — SPIRE ARMED and PRESSURE VENTED. Only the lens-aligned diamond still waits dark.",
        tone: "system",
        when: {
          allOf: [
            { flag: "armed", equals: true },
            { flag: "vented", equals: true },
            { flag: "aligned", equals: false },
          ],
        },
      },
      {
        type: "showText",
        text: "Two sigils burn on the floor — SPIRE ARMED and LENS ALIGNED. Only the pressure-vented diamond still waits dark.",
        tone: "system",
        when: {
          allOf: [
            { flag: "armed", equals: true },
            { flag: "vented", equals: false },
            { flag: "aligned", equals: true },
          ],
        },
      },
      {
        type: "showText",
        text: "All three diamond sigils burn bright along the floor — SPIRE ARMED, PRESSURE VENTED, LENS ALIGNED. The containment ring thrums, waiting for the convergence.",
        tone: "system",
        when: {
          allOf: [
            { flag: "armed", equals: true },
            { flag: "vented", equals: true },
            { flag: "aligned", equals: true },
            { flag: "won", equals: false },
          ],
        },
      },
      {
        type: "showText",
        text: "The air still shimmers where the anti-aether field fell. The vault antechamber is quiet now — in a new way.",
        tone: "system",
        when: { flag: "won", equals: true },
      },
    ],
    hotspots: [
      {
        id: "back-to-workshop",
        label: "Back to Workshop",
        x: 2,
        y: 2,
        w: 10,
        h: 10,
        chip: true,
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
              "The three components lock into their sockets and hum in unison — but nothing releases. Instead, a grinding shudder runs through the chamber: a stairwell to the long-sealed Spire grinds open right here in the antechamber wall. The mechanism needs more than components. It needs to be run.",
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
              "The three components lock into their sockets and hum in unison — but nothing releases. Instead, a grinding shudder runs through the chamber: a stairwell to the long-sealed Spire grinds open right here in the antechamber wall. The mechanism needs more than components. It needs to be run.",
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
              "The three components lock into their sockets and hum in unison — but nothing releases. Instead, a grinding shudder runs through the chamber: a stairwell to the long-sealed Spire grinds open right here in the antechamber wall. The mechanism needs more than components. It needs to be run.",
          },
        ],
        visibleWhen: { not: { flag: "placedValve", equals: true } },
      },
      {
        // Moved here from the Workshop (feedback): the stairs physically
        // connect Vault <-> Spire. Art: right wall doorway x132-148px, y44-76.
        id: "spire-stair",
        label: "Stairwell to the Spire",
        x: 82,
        y: 42,
        w: 11,
        h: 36,
        actions: [{ type: "navigate", sceneId: "spire" }],
        visibleWhen: { flag: "allPlaced", equals: true },
      },
      {
        id: "activate-convergence",
        label: "Activate the Convergence",
        // Sized to the new focusing-altar graphic (art x72-88px, y62-67).
        x: 43,
        y: 59,
        w: 14,
        h: 10,
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
    onEnter: [
      {
        type: "showText",
        text: "Night air, at last. The Spire's parapet opens onto a field of stars; a great dead dial crowns the mast, and a brass lever waits cocked beside it.",
        tone: "system",
        when: { flag: "armed", equals: false },
      },
      {
        type: "showText",
        text: "Night air over the Spire. The great dial burns with the sun sigil ☉ and the mechanism churns below; the thrown lever rests at the mast.",
        tone: "system",
        when: { flag: "armed", equals: true },
      },
    ],
    hotspots: [
      {
        // The stairwell physically connects Vault <-> Spire (feedback moved
        // it out of the Workshop), so the way back down lands in the Vault.
        id: "back-to-vault",
        label: "Back to Vault",
        x: 2,
        y: 2,
        w: 10,
        h: 10,
        chip: true,
        actions: [{ type: "navigate", sceneId: "vault" }],
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
    // The wake-up reads right only before anyone has escaped; afterwards the
    // cell can also be entered on purpose (via the corridor door), so
    // re-entries get a neutral description instead.
    onEnter: [
      {
        type: "showText",
        text: "You wake in a small holding cell, rune-etched bars dulled with rust. The Warden is nowhere in sight — it never follows this far. Everything you carried is still with you.",
        tone: "system",
        when: { flag: "escapedPrison", equals: false },
      },
      {
        type: "showText",
        text: "The holding cell again — straw, a plank cot, hanging chains, and the loose floor grate, familiar now.",
        tone: "system",
        when: { flag: "escapedPrison", equals: true },
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
          // the pulse makes the art rattle for ~1s on every heave (feedback:
          // it used to rattle constantly on the flicker)
          { type: "pulse", id: "prison-grate" },
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
      {
        id: "cot",
        label: "Plank Cot",
        x: 68,
        y: 74,
        w: 20,
        h: 16,
        actions: [
          {
            type: "showText",
            text: "A plank cot with a thin blanket and a sad pillow. A nap would sound wonderful under almost any other circumstances.",
            tone: "flavor",
          },
        ],
      },
      {
        id: "desk-key",
        label: "Key on a Desk",
        // the desk sits across the corridor, beyond the bars (art x94-114px)
        x: 57,
        y: 58,
        w: 14,
        h: 18,
        actions: [
          {
            type: "showText",
            text: "On a desk across the corridor sits a heavy iron key. You stretch an arm through the bars until your shoulder aches — it stays a hand's width out of reach.",
            tone: "flavor",
          },
        ],
      },
      // The loose brick hides THE valve code, encoded as a breathing-drill
      // ditty: both arms (2), mind to nothing (0), one breath (1), pat x3 (3)
      // -> 2-0-1-3. Three heaves per device to work it free; the reveal is
      // party-wide (brickOpened).
      {
        id: "loose-brick",
        label: "Loose Brick",
        x: 1,
        y: 60,
        w: 8,
        h: 14,
        actions: [
          {
            type: "repeatClick",
            counterId: "prison-brick",
            timesRequired: 3,
            textsByStep: [
              "One brick low in the wall sits proud of its course, mortar crumbling at the edges. You work your fingertips in and pull. It grinds a little looser.",
              "The brick rocks in its socket now, grating stone on stone.",
              "The brick comes free in your hands. In the dark space behind it: a folded note.",
            ],
            onComplete: [
              { type: "setPartyFlag", flag: "brickOpened" },
              {
                type: "showText",
                text: 'You unfold the note. No digits — just a little breathing-drill, in a careful hand: "To bleed off the pressure, here is all that I do: I raise up both arms; I empty my mind to nothing; I draw one slow breath; then I pat my own back — one, two, three. Set the valves to match, in the order I relax."',
                tone: "system",
              },
            ],
          },
        ],
        visibleWhen: { flag: "brickOpened", equals: false },
      },
      {
        id: "loose-brick-opened",
        label: "Loose Brick",
        x: 1,
        y: 60,
        w: 8,
        h: 14,
        actions: [
          {
            type: "showText",
            text: 'The brick sits beside its dark socket, the note flattened on the floor: "...both arms; my mind to nothing; one slow breath; a pat — one, two, three. Set the valves in the order I relax."',
            tone: "flavor",
          },
        ],
        visibleWhen: { flag: "brickOpened", equals: true },
      },
    ],
  },
  {
    id: "prison-corridor",
    name: "Prison Corridor",
    art: { component: "PrisonCorridorArt" },
    onEnter: [
      {
        type: "showText",
        text: "You come up through the duct on the corridor side of the cell bars. The guard's desk stands here, the cell key resting on it — and the barred door it opens.",
        tone: "system",
      },
    ],
    hotspots: [
      {
        id: "back-to-workshop",
        label: "Climb back up to the Workshop",
        x: 2,
        y: 2,
        w: 10,
        h: 10,
        chip: true,
        actions: [{ type: "navigate", sceneId: "workshop" }],
      },
      {
        id: "guard-desk",
        label: "Guard's Desk",
        x: 57,
        y: 68,
        w: 16,
        h: 22,
        actions: [
          {
            type: "showText",
            text: "A heavy iron key rests on the desk, chained to its leg — the same key that sat maddeningly out of reach from the other side of the bars. It only travels as far as the cell door.",
            tone: "flavor",
          },
        ],
      },
      {
        // No unlock flag on purpose (user decision): the door re-locks behind
        // whoever slips in, every time. The key stays chained to the desk.
        id: "cell-door",
        label: "Unlock the Cell Door",
        x: 33,
        y: 8,
        w: 20,
        h: 74,
        actions: [
          {
            type: "showText",
            text: "You lift the desk key on its chain, turn the lock, and slip into the cell. The door swings shut behind you and the lock clicks home — the key stays chained to the desk.",
            tone: "system",
          },
          { type: "navigate", sceneId: "prison" },
        ],
      },
    ],
  },
];
