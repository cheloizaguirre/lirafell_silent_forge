import { SceneShell } from "./SceneShell";
import type { ArtProps } from "../artTypes";

// Ported from the PoC's renderVault() at silent_forge(1).html:530-543.
// Each socket lights up as its component is placed (placed* flags are set
// server-side by the place_item RPC). Once everything is placed, three
// convergence runes report the Stage 2 flags live -- this readout is the
// whole point of the Phase 3 acceptance test: a device parked here watches
// armed/vented/aligned light up as other devices act in other rooms. The
// data-converge/data-lit attributes exist for the verify script.
const CONVERGE_RUNES = [
  { flag: "armed", x: 320, label: "spire armed" },
  { flag: "vented", x: 400, label: "pressure vented" },
  { flag: "aligned", x: 480, label: "lens aligned" },
] as const;

export function VaultArt({ flags }: ArtProps) {
  const placedHeart = flags.placedHeart === true;
  const placedLens = flags.placedLens === true;
  const placedValve = flags.placedValve === true;
  const allPlaced = flags.allPlaced === true;
  const won = flags.won === true;

  return (
    <SceneShell>
      {won && <circle cx="400" cy="250" r="230" fill="url(#glow)" opacity="0.5" />}
      <circle cx="400" cy="250" r="180" fill="none" stroke={won ? "#8b5fbf" : "#34373d"} strokeWidth="6" />
      <rect x="330" y="200" width="140" height="100" fill="#16171a" stroke="#34373d" strokeWidth="2" />
      {/* heart socket */}
      <path
        d="M355 230 c-8,-12 -26,-4 -18,10 c6,10 18,16 18,16 c0,0 12,-6 18,-16 c8,-14 -10,-22 -18,-10 z"
        fill={placedHeart ? "#8b5fbf" : "none"}
        stroke="#8b5fbf"
        strokeWidth="2"
      />
      {/* lens socket */}
      <circle cx="400" cy="248" r="16" fill={placedLens ? "#8b5fbf" : "none"} stroke="#8b5fbf" strokeWidth="2" />
      {/* valve socket */}
      <rect x="430" y="234" width="26" height="26" fill={placedValve ? "#8b5fbf" : "none"} stroke="#8b5fbf" strokeWidth="2" />

      {allPlaced && !won && (
        <g>
          {CONVERGE_RUNES.map((rune) => {
            const lit = flags[rune.flag] === true;
            return (
              <text
                key={rune.flag}
                x={rune.x}
                y="345"
                textAnchor="middle"
                fontSize="12"
                fill={lit ? "#c9a3ff" : "#5c4577"}
                data-converge={rune.flag}
                data-lit={lit}
              >
                {rune.label}
              </text>
            );
          })}
        </g>
      )}
      {won && (
        <text x="400" y="345" textAnchor="middle" fontSize="14" fill="#c9a3ff" data-converge="won">
          the anti-aether field has fallen
        </text>
      )}
    </SceneShell>
  );
}
