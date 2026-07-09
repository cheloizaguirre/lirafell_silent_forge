import type { ReactNode } from "react";

// Shared viewBox/defs, ported from the PoC's svgHead()/bg() helpers.
// All scene art is authored against this 800x500 coordinate space, matching
// the percentage-based hotspot geometry in packages/content.
export function SceneShell({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 800 500" className="scene-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vign" cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#241f30" />
          <stop offset="100%" stopColor="#0a090e" />
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
