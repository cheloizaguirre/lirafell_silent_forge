import { useState } from "react";
import { puzzles } from "@silent-forge/content";
import type { NumericDialPuzzleContent } from "@silent-forge/content";
import { submitPuzzleAttempt } from "../../lib/sessionApi";

export function NumericDialPuzzle({
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
    (p): p is NumericDialPuzzleContent => p.id === puzzleId && p.kind === "numeric-dial",
  );
  const [values, setValues] = useState<number[]>(() => puzzle?.dials.map((d) => d.min) ?? []);
  const [pending, setPending] = useState(false);
  const [solved, setSolved] = useState(false);

  if (!puzzle) return null;

  const cycleDial = (i: number) => {
    const dial = puzzle.dials[i];
    setValues((prev) =>
      prev.map((v, j) => (j === i ? (v >= dial.max ? dial.min : v + 1) : v)),
    );
  };

  const handleSubmit = async () => {
    setPending(true);
    try {
      const result = await submitPuzzleAttempt(sessionId, puzzleId, { dials: values });
      if (result.correct) {
        setSolved(true);
        log(puzzle.solvedText ?? "It clicks into place.", "system");
        onSolved();
      } else {
        log(puzzle.wrongText ?? "Nothing happens.", "warn");
        // PoC behavior: a failed pressure test slams every valve back to zero.
        setValues(puzzle.dials.map((d) => d.min));
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
        <div className="puzzle-options puzzle-dials">
          {puzzle.dials.map((dial, i) => (
            <button
              key={dial.id}
              type="button"
              className="puzzle-option puzzle-dial"
              disabled={pending || solved}
              aria-label={`${dial.label}, currently ${values[i]}`}
              onClick={() => cycleDial(i)}
            >
              <span className="puzzle-dial-label">{dial.label}</span>
              <span className="puzzle-dial-value">{values[i]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="puzzle-option"
          disabled={pending || solved}
          onClick={() => void handleSubmit()}
        >
          {puzzle.submitLabel}
        </button>
        <button type="button" className="puzzle-close" onClick={onClose}>
          {solved ? "Close" : "Step back"}
        </button>
      </div>
    </div>
  );
}
