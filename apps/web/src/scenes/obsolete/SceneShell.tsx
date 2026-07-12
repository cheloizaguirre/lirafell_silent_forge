import type { ReactNode } from "react";

// Shared viewBox/defs, ported from the PoC's svgHead()/bg() helpers.
// All scene art is authored against this 800x500 coordinate space, matching
// the percentage-based hotspot geometry in packages/content.
//
// Palette (Phase 6): structural colors mirror the index.css variables as
// literals -- SVG presentation attributes don't substitute var(), so if the
// theme palette moves, these hexes move with it:
//   #0b0c0e bg | #16171a shadow2 | #1e2024 shadow | #34373d line
//   #3e4147 steel | #9a9ca3 muted | #1b1c20 vignette center
// Purple (#8b5fbf / #c9a3ff / #5c4577) is reserved for magic and
// interactables: glows, runes, beams, lit eyes, the lever/grate highlights.
export function SceneShell({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 800 500" className="scene-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vign" cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#1b1c20" />
          <stop offset="100%" stopColor="#0b0c0e" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c9a3ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#c9a3ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="500" fill="url(#vign)" />
      {children}
    </svg>
  );
}
