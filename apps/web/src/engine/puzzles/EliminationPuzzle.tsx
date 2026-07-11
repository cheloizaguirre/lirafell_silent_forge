import { useState } from "react";
import { puzzles } from "@silent-forge/content";
import type { EliminationPuzzleContent } from "@silent-forge/content";
import { submitPuzzleAttempt } from "../../lib/sessionApi";

export function EliminationPuzzle({
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
    (p): p is EliminationPuzzleContent => p.id === puzzleId && p.kind === "elimination",
  );
  const [pending, setPending] = useState<string | null>(null);

  if (!puzzle) return null;

  const handleChoose = async (optionId: string) => {
    setPending(optionId);
    try {
      const result = await submitPuzzleAttempt(sessionId, puzzleId, { choice: optionId });
      if (result.correct) {
        // Auto-close on solve, matching the dial and sequence puzzles --
        // the payoff plays out in the scene, not behind a modal.
        log(
          puzzle.solvedText ??
            `You examine the ${labelFor(puzzle, optionId)}. It doesn't react.`,
          "system",
        );
        onSolved();
        onClose();
      } else {
        const option = puzzle.options.find((o) => o.id === optionId);
        log(option?.wrongFlavor ?? "That was the wrong choice.", "warn");
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="puzzle-overlay" role="dialog" aria-modal="true" aria-labelledby="puzzle-title">
      <div className="puzzle-panel">
        <h2 id="puzzle-title">{puzzle.title}</h2>
        <p>{puzzle.prompt}</p>
        <div className="puzzle-options">
          {puzzle.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="puzzle-option"
              disabled={pending !== null}
              onClick={() => void handleChoose(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" className="puzzle-close" onClick={onClose}>
          Step back
        </button>
      </div>
    </div>
  );
}

function labelFor(puzzle: EliminationPuzzleContent, optionId: string): string {
  return puzzle.options.find((o) => o.id === optionId)?.label ?? optionId;
}
