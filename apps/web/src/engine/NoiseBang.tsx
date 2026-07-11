import { useEffect, useRef, useState } from "react";
import type { NoiseEvent } from "../lib/sessionApi";

// The player-facing noise feedback (the gauge itself is DM-only now): a
// comic-book burst over the scene. Your own noise is a BIG centered BANG;
// someone else's is a small anonymous one in the corner -- the party hears
// the clang, only the DM knows how close the Warden is.
//
// Driven by flags.noiseEvent from add_noise. The seq watermark makes every
// delivery path idempotent: realtime UPDATE, the immediate reconcile fetch,
// and the Phase 5 delayed sweep can all replay the same event and only the
// first sighting bangs. The first-ever observation (page load / rejoin) is
// swallowed on purpose -- it's history, not news.

// 24-vertex starburst around (100,75): outer points alternate two radii so
// it reads hand-drawn rather than geometric.
const BURST_POINTS = Array.from({ length: 24 }, (_, i) => {
  const angle = (Math.PI * i) / 12;
  const r = i % 2 === 0 ? (i % 4 === 0 ? 74 : 62) : 40;
  return `${(100 + r * Math.cos(angle)).toFixed(1)},${(75 + r * 0.72 * Math.sin(angle)).toFixed(1)}`;
}).join(" ");

const BANG_MS = 1700;

export function NoiseBang({
  event,
  selfPlayerId,
}: {
  event: NoiseEvent | undefined;
  selfPlayerId: string | null;
}) {
  const lastSeq = useRef<number | null>(null);
  const [bang, setBang] = useState<{ kind: "big" | "small"; seq: number; count: number } | null>(
    null,
  );

  const seq = event?.seq ?? 0;
  const by = event?.by;
  // 1-4 BANGs; wrong valve attempts bang once per wrong dial (Mastermind-style
  // feedback, intended). Events without `bangs` (older rows) bang once.
  const bangs = Math.max(1, Math.min(4, event?.bangs ?? 1));

  useEffect(() => {
    if (lastSeq.current === null) {
      lastSeq.current = seq;
      return;
    }
    if (seq <= lastSeq.current) return;
    lastSeq.current = seq;
    setBang({ kind: by === selfPlayerId ? "big" : "small", seq, count: bangs });
    const timer = setTimeout(() => setBang(null), BANG_MS);
    return () => clearTimeout(timer);
  }, [seq, by, bangs, selfPlayerId]);

  if (!bang) return null;

  // Stack the words inside the burst's inner radius, shrinking as the count
  // grows so four still fit.
  const fontSize = [bang.kind === "big" ? 30 : 34, 24, 20, 16][bang.count - 1];
  const lineGap = [0, 30, 25, 21][bang.count - 1];
  const firstY = 76 - (lineGap * (bang.count - 1)) / 2;

  return (
    // key restarts the CSS animation when a second bang lands mid-fade
    <div
      key={bang.seq}
      className={`noise-bang noise-bang-${bang.kind}`}
      data-bangs={bang.count}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 150">
        {/* style, not presentation attributes: var() only substitutes in CSS */}
        <polygon
          points={BURST_POINTS}
          style={{ fill: "var(--danger)", stroke: "var(--danger-bright)" }}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {Array.from({ length: bang.count }, (_, i) => (
          <text
            key={i}
            x="100"
            y={firstY + i * lineGap}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Cinzel, serif"
            fontWeight="700"
            fontSize={fontSize}
            fill="#fff"
          >
            BANG!
          </text>
        ))}
      </svg>
    </div>
  );
}
