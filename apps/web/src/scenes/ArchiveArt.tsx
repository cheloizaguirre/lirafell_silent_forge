import { SceneShell } from "./SceneShell";
import type { ArtProps } from "./artTypes";

// Ported from the PoC's renderArchive() at silent_forge(1).html:410-427.
// Once the lens is found, the three pattern tomes settle lower in the shelf
// (the PoC nudged clicked tomes down; here the solved state shows all three
// settled). Stage 2: while armed-but-unaligned a beam flickers from the
// Spire; once aligned, a steady violet beam lances up toward the Vault.
// (The PoC's live sigil overlay lives in the puzzle modal here instead --
// the dial value is modal-local state, not party state.)
const TOME_COLORS: Record<string, string> = {
  violet: "#8b5fbf",
  ash: "#6b6570",
  black: "#221d2c",
  ember: "#8a4a3a",
};
const TOME_ORDER = ["violet", "ash", "black", "ember"];

export function ArchiveArt({ flags }: ArtProps) {
  const lensFound = flags.lensFound === true;
  const armed = flags.armed === true;
  const aligned = flags.aligned === true;

  return (
    <SceneShell>
      {/* bookshelf */}
      <rect x="40" y="80" width="260" height="340" fill="#171320" stroke="#3a3346" />
      {TOME_ORDER.map((c, i) => (
        <rect
          key={c}
          x={60 + i * 55}
          y={lensFound && c !== "black" ? 260 : 250}
          width="40"
          height="140"
          fill={TOME_COLORS[c]}
          stroke="#3a3346"
        />
      ))}
      <text x="170" y="440" textAnchor="middle" fontSize="11" fill="#8a8298">
        "Violet before Ash, Ash before Ember."
      </text>

      {/* memory imprint lens */}
      {aligned && <rect x="511" y="0" width="4" height="274" fill="#c9a3ff" opacity="0.6" />}
      <rect x="500" y="330" width="26" height="70" fill="#221d2c" stroke="#3a3346" />
      <circle cx="513" cy="300" r="34" fill="url(#glow)" opacity={aligned ? 0.9 : 0.4} />
      <circle cx="513" cy="300" r="26" fill="#171320" stroke="#8b5fbf" strokeWidth="2" />
      {armed && !aligned && (
        <text x="513" y="345" textAnchor="middle" fontSize="10" fill="#8a8298">
          a faint beam flickers from the Spire above
        </text>
      )}

      {/* locked cabinet */}
      <rect x="620" y="260" width="120" height="150" fill="#171320" stroke="#3a3346" />
      <circle cx="680" cy="335" r="6" fill="#3a3346" />
    </SceneShell>
  );
}
