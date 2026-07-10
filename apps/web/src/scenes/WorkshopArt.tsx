import { SceneShell } from "./SceneShell";
import type { ArtProps } from "./artTypes";

// Ported from the PoC's renderWorkshop() at ~/Downloads/silent_forge(1).html:309-345.
// The valve puzzle itself (the four interactive digit dials) is Phase 2 --
// this renders the static pipe assembly only. Vault/Spire highlighting
// already responds to flags so Phase 2/3 content lights up for free once
// those flags start getting set.
export function WorkshopArt({ flags }: ArtProps) {
  const allComponents = flags.heartFound === true && flags.lensFound === true && flags.valveFound === true;
  const allPlaced = flags.allPlaced === true;
  const armed = flags.armed === true;
  const vented = flags.vented === true;
  const loud = false; // noise-driven golem-eye glow wires up once noise is in this component's props

  return (
    <SceneShell>
      <rect x="60" y="90" width="90" height="230" rx="4" fill="#16171a" stroke="#34373d" />
      <g>
        <rect x="80" y="140" width="50" height="150" rx="6" fill="#1e2024" stroke="#3e4147" />
        <rect x="88" y="120" width="34" height="34" rx="4" fill="#1e2024" stroke="#3e4147" />
        <circle cx="98" cy="134" r="3" fill={loud ? "#e0768a" : "#5c4577"} />
        <circle cx="112" cy="134" r="3" fill={loud ? "#e0768a" : "#5c4577"} />
      </g>

      <path d="M300 500 L300 200 L500 200 L500 500" fill="none" stroke="#34373d" strokeWidth="10" />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={330 + i * 50}
          cy="200"
          r="16"
          fill={flags.valveFound ? "#34373d" : "#1e2024"}
          stroke={flags.valveFound ? "#34373d" : "#8b5fbf"}
          strokeWidth="2"
        />
      ))}
      <rect x="290" y="150" width="220" height="20" fill="#16171a" stroke="#34373d" />
      <text x="400" y="145" textAnchor="middle" fontSize="11" fill="#9a9ca3" fontFamily="EB Garamond">
        faded engraving: 2 – 0 – 1 – 3
      </text>

      <rect x="600" y="330" width="150" height="20" fill="#1e2024" stroke="#34373d" />
      <rect x="610" y="300" width="20" height="30" fill="#34373d" />
      <rect x="700" y="295" width="14" height="35" fill="#34373d" />

      <rect x="20" y="380" width="50" height="90" fill="#16171a" stroke="#34373d" />
      <text x="45" y="480" textAnchor="middle" fontSize="11" fill="#9a9ca3">Archive</text>
      <rect x="730" y="380" width="50" height="90" fill="#16171a" stroke="#34373d" />
      <text x="755" y="480" textAnchor="middle" fontSize="11" fill="#9a9ca3">Gallery</text>

      <rect
        x="360"
        y="20"
        width="80"
        height="70"
        fill="#16171a"
        stroke={allComponents ? "#c9a3ff" : "#34373d"}
        strokeWidth={allComponents ? "2" : "1"}
      />
      <text x="400" y="105" textAnchor="middle" fontSize="11" fill="#9a9ca3">Vault</text>

      {allPlaced && (
        <>
          <rect x="200" y="60" width="60" height="90" fill="#16171a" stroke="#c9a3ff" strokeWidth="2" />
          <text x="230" y="165" textAnchor="middle" fontSize="11" fill="#c9a3ff">Spire Stair</text>
        </>
      )}

      {armed && (
        <>
          <circle cx="560" cy="230" r="20" fill={vented ? "#34373d" : "#1e2024"} stroke="#8b5fbf" strokeWidth="2" />
          <text x="560" y="264" textAnchor="middle" fontSize="10" fill="#9a9ca3">overflow valve</text>
        </>
      )}
    </SceneShell>
  );
}
