import { SceneShell } from "./SceneShell";
import type { ArtProps } from "./artTypes";

// Ported from the PoC's renderEntrance() at ~/Downloads/silent_forge(1).html:271-286.
export function EntranceArt(_props: ArtProps) {
  return (
    <SceneShell>
      <path
        d="M320 500 L320 140 Q400 60 480 140 L480 500 Z"
        fill="#16171a"
        stroke="#34373d"
        strokeWidth="2"
      />
      <ellipse cx="400" cy="70" rx="60" ry="14" fill="#1e2024" stroke="#34373d" />
      <line x1="400" y1="56" x2="400" y2="20" stroke="#34373d" strokeWidth="2" />
      <circle cx="400" cy="18" r="5" fill="#8b5fbf" opacity="0.7" />
      <g opacity="0.9">
        <ellipse cx="250" cy="430" rx="26" ry="10" fill="#16171a" />
        <rect x="236" y="360" width="28" height="70" rx="8" fill="#1e2024" stroke="#34373d" />
        <circle cx="250" cy="345" r="18" fill="#1e2024" stroke="#34373d" />
        <circle cx="244" cy="342" r="2.5" fill="#8b5fbf" />
        <circle cx="256" cy="342" r="2.5" fill="#34373d" />
      </g>
      <rect x="560" y="380" width="90" height="55" rx="3" fill="#16171a" stroke="#34373d" />
      <rect x="595" y="360" width="16" height="24" fill="#1e2024" stroke="#34373d" />
    </SceneShell>
  );
}
