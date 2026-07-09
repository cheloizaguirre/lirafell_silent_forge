import { useState } from "react";
import { puzzles } from "@silent-forge/content";
import type { OrderedSequencePuzzleContent } from "@silent-forge/content";
import { submitPuzzleAttempt } from "../../lib/sessionApi";

export function OrderedSequencePuzzle({
  puzzleId,
  sessionId,
  onSolved,
  onClose,
  log,
}: {
  puzzleId: string;
  sessionId: string;
  onSolved: () => void;
  onClose: () => void;
  log: (text: string, tone: "flavor" | "system" | "warn") => void;
}) {
  const puzzle = puzzles.find(
    (p): p is OrderedSequencePuzzleContent => p.id === puzzleId && p.kind === "ordered-sequence",
  );
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [solved, setSolved] = useState(false);

  if (!puzzle) return null;

  const labelFor = (id: string) => puzzle.items.find((i) => i.id === id)?.label ?? id;

  // The whole sequence is validated server-side in one attempt once enough
  // picks are in -- deliberately NOT per-click, so partial answers never get
  // confirmed or denied over the wire.
  const handlePick = async (itemId: string) => {
    if (picked.includes(itemId)) return;
    const next = [...picked, itemId];
    setPicked(next);
    if (next.length < puzzle.sequenceLength) {
      log(`The ${labelFor(itemId)} slides aside with a soft click.`, "flavor");
      return;
    }
    setPending(true);
    try {
      const result = await submitPuzzleAttempt(sessionId, puzzleId, { sequence: next });
      if (result.correct) {
        setSolved(true);
        log(puzzle.solvedText ?? "Something clicks into alignment.", "system");
        onSolved();
      } else {
        log(puzzle.wrongText ?? "Nothing happens, and everything resets.", "flavor");
        setPicked([]);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="puzzle-overlay" role="dialog" aria-modal="true" aria-labelledby="puzzle-title">
      <div className="puzzle-panel">
        <h2 id="puzzle-title">{puzzle.title}</h2>
        <p>{puzzle.prompt}</p>
        <div className="puzzle-options">
          {puzzle.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="puzzle-option"
              disabled={pending || solved || picked.includes(item.id)}
              onClick={() => void handlePick(item.id)}
            >
              {item.label}
              {picked.includes(item.id) && (
                <span className="puzzle-pick-order"> · {picked.indexOf(item.id) + 1}</span>
              )}
            </button>
          ))}
        </div>
        <p className="puzzle-sequence-status">
          {solved
            ? "The sequence holds."
            : picked.length === 0
              ? `Choose ${puzzle.sequenceLength} in order.`
              : `Chosen: ${picked.map(labelFor).join(" → ")}`}
        </p>
        <button type="button" className="puzzle-close" onClick={onClose}>
          {solved ? "Close" : "Step back"}
        </button>
      </div>
    </div>
  );
}
