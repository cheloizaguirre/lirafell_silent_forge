import { SceneShell } from "./SceneShell";
import type { ArtProps } from "./artTypes";

// Ported from the PoC's renderSpire() at silent_forge(1).html:594-625.
// The ☉ shown on the armed dial is the in-game clue for the Archive lens
// realignment -- someone standing here has to see it (or relay it). The
// *validation* of that sigil lives only in the submit_puzzle_attempt RPC.
export function SpireArt({ flags }: ArtProps) {
  const armed = flags.armed === true;

  return (
    <SceneShell>
      {/* the spire tower */}
      <path d="M300 500 L340 60 L460 60 L500 500 Z" fill="#171320" stroke="#3a3346" strokeWidth="2" />

      {/* the great dial */}
      <circle cx="400" cy="180" r="70" fill="#221d2c" stroke="#4a4058" strokeWidth="3" />
      {armed ? (
        <text x="400" y="192" textAnchor="middle" fontSize="34" fill="#c9a3ff">
          ☉
        </text>
      ) : (
        <text x="400" y="192" textAnchor="middle" fontSize="14" fill="#5c4577">
          dial dormant
        </text>
      )}

      {/* the lever housing */}
      <rect x="380" y="320" width="40" height="120" fill="#221d2c" stroke="#4a4058" />
      <rect
        x="360"
        y="430"
        width="80"
        height="20"
        fill="#171320"
        stroke={armed ? "#3a3346" : "#8b5fbf"}
        strokeWidth="2"
      />
      <text x="400" y="470" textAnchor="middle" fontSize="11" fill="#8a8298">
        {armed ? "the lever rests, thrown" : "a great brass lever"}
      </text>
    </SceneShell>
  );
}
