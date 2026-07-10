import { SceneShell } from "./SceneShell";
import type { ArtProps } from "./artTypes";

// Ported from the PoC's renderPrison() at silent_forge(1).html:630-636.
export function PrisonArt(_props: ArtProps) {
  return (
    <SceneShell>
      <rect x="0" y="0" width="800" height="500" fill="#0b0c0e" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={100 + i * 80} y="60" width="10" height="380" fill="#1e2024" stroke="#34373d" />
      ))}
      <rect x="330" y="380" width="60" height="30" fill="#16171a" stroke="#8b5fbf" strokeWidth="2" />
      <text x="400" y="460" textAnchor="middle" fontSize="13" fill="#9a9ca3">
        a corroded floor grate rattles loosely
      </text>
    </SceneShell>
  );
}
