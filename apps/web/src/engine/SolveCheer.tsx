import { useEffect, useRef, useState } from "react";
import type { SolveEvent } from "../lib/sessionApi";

// The player-facing solve feedback: a warm comic-book burst over the scene, the
// positive twin of NoiseBang. Solving a puzzle is a party win, so -- like the
// BANG -- everyone in the session sees it: your own solve is a BIG centered
// gold "AHA!"; someone else's is a small one in the bottom-right corner (the
// opposite corner from the small BANG, which the two would otherwise fight
// over whenever a solve and a wrong answer land together -- see index.css).
//
// Driven by flags.solveEvent, stamped by submit_puzzle_attempt on the FIRST
// correct answer only -- re-solving an already-solved puzzle grants again but
// stays silent, so nobody gets a victory burst for old news. The seq watermark
// makes every delivery path idempotent: realtime
// UPDATE, the immediate reconcile fetch, and the delayed reconcile sweep can
// all replay the same event and only the first sighting cheers. The first-ever
// observation (page load / rejoin) is swallowed on purpose -- it's history,
// not news. This mirrors NoiseBang exactly; keep the two in sync.

// 12-point rounded sunburst around (100,75): every outer point sits at the same
// radius (no jagged alternating spikes like the BANG) so it reads warm and
// celebratory rather than violent. Inner control points pull the outline in
// between points for soft petals.
const RAYS = 12;
const BURST_POINTS = Array.from({ length: RAYS * 2 }, (_, i) => {
  const angle = (Math.PI * i) / RAYS;
  const r = i % 2 === 0 ? 70 : 48;
  return `${(100 + r * Math.cos(angle)).toFixed(1)},${(75 + r * 0.72 * Math.sin(angle)).toFixed(1)}`;
}).join(" ");

// A few sparkles scattered around the burst for extra celebratory pop.
const SPARKLES = [
  { x: 40, y: 32, r: 3.5 },
  { x: 160, y: 40, r: 2.5 },
  { x: 150, y: 112, r: 3 },
  { x: 46, y: 118, r: 2.5 },
];

const CHEER_MS = 1700;

export function SolveCheer({
  event,
  selfPlayerId,
}: {
  event: SolveEvent | undefined;
  selfPlayerId: string | null;
}) {
  const lastSeq = useRef<number | null>(null);
  const [cheer, setCheer] = useState<{ kind: "big" | "small"; seq: number } | null>(null);

  const seq = event?.seq ?? 0;
  const by = event?.by;

  useEffect(() => {
    if (lastSeq.current === null) {
      lastSeq.current = seq;
      return;
    }
    if (seq <= lastSeq.current) return;
    lastSeq.current = seq;
    setCheer({ kind: by === selfPlayerId ? "big" : "small", seq });
    const timer = setTimeout(() => setCheer(null), CHEER_MS);
    return () => clearTimeout(timer);
  }, [seq, by, selfPlayerId]);

  if (!cheer) return null;

  const fontSize = cheer.kind === "big" ? 36 : 30;

  return (
    // key restarts the CSS animation when a second cheer lands mid-fade
    <div
      key={cheer.seq}
      className={`solve-cheer solve-cheer-${cheer.kind}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 150">
        {/* style, not presentation attributes: var() only substitutes in CSS */}
        <polygon
          points={BURST_POINTS}
          style={{ fill: "var(--gold)", stroke: "var(--gold-bright)" }}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {SPARKLES.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} style={{ fill: "var(--gold-bright)" }} />
        ))}
        <text
          x="100"
          y="76"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Cinzel, serif"
          fontWeight="700"
          fontSize={fontSize}
          fill="#2a1c05"
        >
          AHA!
        </text>
      </svg>
    </div>
  );
}
