import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { fetchOwnPlayer, fetchSessionByCode } from "../lib/sessionApi";
import { useSessionStore } from "../state/useSessionStore";
import { useSessionState } from "../state/useSessionState";
import { SceneRenderer } from "../engine/SceneRenderer";
import { EliminationPuzzle } from "../engine/puzzles/EliminationPuzzle";

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

  const noiseDanger = sessionState.noise >= 70;

  return (
    <>
      <header>
        <h1>The Silent Forge</h1>
        <p className="subtitle">
          {self.display_name} · code {code?.toUpperCase()}
        </p>
      </header>
      <main>
        <div className="objective">
          <b>Inventory</b>
          {sessionState.inventory.length > 0 ? sessionState.inventory.join(", ") : "empty-handed"}
        </div>

        <div className="noise-row">
          <span className="noise-label">Noise</span>
          <div className={`noise-gauge ${noiseDanger ? "danger" : ""}`}>
            <div className="noise-fill" style={{ width: `${sessionState.noise}%` }} />
          </div>
        </div>

        <SceneRenderer
          sceneId={self.current_scene_id}
          sessionId={sessionId}
          flags={sessionState.flags}
          inventory={sessionState.inventory}
          log={appendLog}
          openPuzzle={setOpenPuzzleId}
        />

        <div className="log-panel">
          {log.length === 0 && <p className="log-flavor">Look around. Click something to begin.</p>}
          {log.map((entry) => (
            <p key={entry.id} className={`log-${entry.tone}`}>
              {entry.text}
            </p>
          ))}
        </div>

        <ul className="player-list">
          {players.map((p) => (
            <li key={p.id}>
              <b>{p.display_name}</b> ({p.role}) — {p.current_scene_id}
            </li>
          ))}
        </ul>
      </main>

      {openPuzzleId && (
        <EliminationPuzzle
          puzzleId={openPuzzleId}
          sessionId={sessionId}
          log={appendLog}
          onSolved={() => {
            /* session_state updates arrive via realtime; nothing to do locally */
          }}
          onClose={() => setOpenPuzzleId(null)}
        />
      )}
    </>
  );
}
