import { SceneShell } from "./SceneShell";
import type { ArtProps } from "../artTypes";

// Ported from the PoC's renderGallery() at ~/Downloads/silent_forge(1).html:489-525.
const AUTOMATON_COUNT = 5;

export function GalleryArt(_props: ArtProps) {
  return (
    <SceneShell>
      {Array.from({ length: AUTOMATON_COUNT }, (_, i) => (
        <g key={i}>
          <rect x={60 + i * 140} y="150" width="110" height="220" rx="6" fill="#16171a" stroke="#34373d" />
          <circle cx={115 + i * 140} cy="230" r="26" fill="#1e2024" stroke="#3e4147" />
          <rect x={95 + i * 140} y="260" width="40" height="90" fill="#1e2024" stroke="#3e4147" />
        </g>
      ))}
      <text x="400" y="410" textAnchor="middle" fontSize="12" fill="#9a9ca3">
        plaque: "Only the one who never sang served faithfully."
      </text>
    </SceneShell>
  );
}
