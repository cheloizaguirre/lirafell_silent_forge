import { SceneShell } from "./SceneShell";
import type { ArtProps } from "./artTypes";

// Ported from the PoC's renderVault() at silent_forge(1).html:530-543.
// Each socket lights up as its component is placed (placed* flags are set
// server-side by the place_item RPC).
export function VaultArt({ flags }: ArtProps) {
  const placedHeart = flags.placedHeart === true;
  const placedLens = flags.placedLens === true;
  const placedValve = flags.placedValve === true;

  return (
    <SceneShell>
      <circle cx="400" cy="250" r="180" fill="none" stroke="#3a3346" strokeWidth="6" />
      <rect x="330" y="200" width="140" height="100" fill="#171320" stroke="#3a3346" strokeWidth="2" />
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
    </SceneShell>
  );
}
