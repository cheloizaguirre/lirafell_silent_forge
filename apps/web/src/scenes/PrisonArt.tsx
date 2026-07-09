import { SceneShell } from "./SceneShell";
import type { ArtProps } from "./artTypes";

// Ported from the PoC's renderPrison() at silent_forge(1).html:630-636.
export function PrisonArt(_props: ArtProps) {
  return (
    <SceneShell>
      <rect x="0" y="0" width="800" height="500" fill="#0a090e" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={100 + i * 80} y="60" width="10" height="380" fill="#221d2c" stroke="#3a3346" />
      ))}
      <rect x="330" y="380" width="60" height="30" fill="#171320" stroke="#8b5fbf" strokeWidth="2" />
      <text x="400" y="460" textAnchor="middle" fontSize="13" fill="#8a8298">
        a corroded floor grate rattles loosely
      </text>
    </SceneShell>
  );
}
