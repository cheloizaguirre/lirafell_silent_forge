import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { fetchOwnPlayer, fetchSessionByCode } from "../lib/sessionApi";
import { useSessionStore } from "../state/useSessionStore";
import { useSessionState } from "../state/useSessionState";
import { puzzles } from "@silent-forge/content";
import { SceneRenderer } from "../engine/SceneRenderer";
import { NoiseBang } from "../engine/NoiseBang";
import { WardenJumpScare } from "../engine/WardenJumpScare";
import type { NoiseEvent } from "../lib/sessionApi";
import { EliminationPuzzle } from "../engine/puzzles/EliminationPuzzle";
import { NumericDialPuzzle } from "../engine/puzzles/NumericDialPuzzle";
import { OrderedSequencePuzzle } from "../engine/puzzles/OrderedSequencePuzzle";
import { ItemSpritePixel } from "../scenes/pixel/ItemSpritePixel";

interface LogEntry {
  text: string;
  tone: "flavor" | "system" | "warn";
  id: number;
}

export function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [openPuzzleId, setOpenPuzzleId] = useState<string | null>(null);
  const logIdRef = useRef(0);

  const setSession = useSessionStore((s) => s.setSession);
  const selfPlayerId = useSessionStore((s) => s.selfPlayerId);
  const self = useSessionStore((s) => s.self());
  const sessionState = useSessionStore((s) => s.sessionState);
  const players = useSessionStore((s) => s.players);

  useSessionState(sessionId);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const userId = await ensureAnonymousSession();
        const resolvedSessionId = await fetchSessionByCode(code.toUpperCase());
        if (!resolvedSessionId) {
          if (!cancelled) navigate(`/join/${code}`);
          return;
        }
        const player = await fetchOwnPlayer(resolvedSessionId, userId);
        if (!player) {
          if (!cancelled) navigate(`/join/${code}`);
          return;
        }
        if (cancelled) return;
        setSession(resolvedSessionId, player.id);
        setSessionId(resolvedSessionId);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load session.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, navigate, setSession]);

  // If our scene changes while a puzzle is open (e.g. the DM sends us to the
  // cell mid-attempt), the modal belongs to the old room -- close it.
  const currentSceneId = self?.current_scene_id;
  useEffect(() => {
    setOpenPuzzleId(null);
  }, [currentSceneId]);

  const appendLog = (text: string, tone: LogEntry["tone"]) => {
    logIdRef.current += 1;
    setLog((prev) => [...prev, { text, tone, id: logIdRef.current }]);
  };

  if (loadError) {
    return (
      <div className="form-shell">
        <p className="error">{loadError}</p>
      </div>
    );
  }

  if (!sessionId || !self || !sessionState) {
    return (
      <div className="form-shell">
        <p>Entering the Silent Forge...</p>
      </div>
    );
  }

  // Noise itself is DM-facing now -- players only get the BANGs. Latest
  // message sits big under the scene for the room to read; the full
  // history lives in the right rail, newest first.
  const latest = log[log.length - 1];

  return (
    <>
      <header className="play-header">
        <h1>The Silent Forge</h1>
        <div className="session-badge">
          <b>{self.display_name}</b>
          <span>code {code?.toUpperCase()}</span>
        </div>
      </header>
      <main className="play-layout">
        <div className="play-main">
          <div className="objective">
            <b>Inventory</b>
            {sessionState.inventory.length > 0 ? (
              <span className="inventory-items">
                {sessionState.inventory.map((itemId) => (
                  <ItemSpritePixel key={itemId} itemId={itemId} />
                ))}
              </span>
            ) : (
              "empty-handed"
            )}
          </div>

          <div className="scene-wrap">
            <SceneRenderer
              sceneId={self.current_scene_id}
              sessionId={sessionId}
              flags={sessionState.flags}
              inventory={sessionState.inventory}
              log={appendLog}
              openPuzzle={setOpenPuzzleId}
            />
            <NoiseBang
              event={sessionState.flags.noiseEvent as NoiseEvent | undefined}
              selfPlayerId={selfPlayerId}
            />
            <WardenJumpScare
              wardenRoom={String(sessionState.flags.wardenRoom ?? "")}
              currentSceneId={self.current_scene_id}
            />
          </div>

          <div className="log-latest">
            {latest ? (
              <p className={`log-${latest.tone}`}>{latest.text}</p>
            ) : (
              <p className="log-flavor">Look around. Click something to begin.</p>
            )}
          </div>
        </div>

        <aside className="log-history">
          {log.length === 0 && <p className="log-history-empty">Nothing has happened yet.</p>}
          {log
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className={`log-bubble log-${entry.tone}`}>
                <p>{entry.text}</p>
              </div>
            ))}
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.id}>
                <b>{p.display_name}</b> ({p.role}) — {p.current_scene_id}
              </li>
            ))}
          </ul>
        </aside>
      </main>

      {openPuzzleId &&
        (() => {
          const kind = puzzles.find((p) => p.id === openPuzzleId)?.kind;
          const onSolved = () => {
            /* session_state updates arrive via realtime; nothing to do locally */
          };
          const onClose = () => setOpenPuzzleId(null);
          if (kind === "elimination")
            return (
              <EliminationPuzzle
                puzzleId={openPuzzleId}
                sessionId={sessionId}
                log={appendLog}
                onSolved={onSolved}
                onClose={onClose}
              />
            );
          if (kind === "numeric-dial")
            return (
              <NumericDialPuzzle
                puzzleId={openPuzzleId}
                sessionId={sessionId}
                log={appendLog}
                onSolved={onSolved}
                onClose={onClose}
              />
            );
          if (kind === "ordered-sequence")
            return (
              <OrderedSequencePuzzle
                puzzleId={openPuzzleId}
                sessionId={sessionId}
                log={appendLog}
                onSolved={onSolved}
                onClose={onClose}
                // The keystone tile gates on party flags (see the cabinet-gears
                // puzzle); archive-books carries no gated items and ignores it.
                flags={sessionState.flags}
              />
            );
          return null;
        })()}
    </>
  );
}
