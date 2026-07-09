import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { fetchOwnPlayer, fetchSessionByCode } from "../lib/sessionApi";
import { useSessionStore } from "../state/useSessionStore";
import { useSessionState } from "../state/useSessionState";

// Read-only for now: live flags/inventory/noise/players dump. The
// force-scene/clear-noise/grant-item override actions are Phase 4 (need
// their own role-gated RPCs, not built yet) -- this is the foundation
// they'll attach to.
export function DmPage() {
  const { code } = useParams<{ code: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setSession = useSessionStore((s) => s.setSession);
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
          if (!cancelled) setError("No session found for that code.");
          return;
        }
        const player = await fetchOwnPlayer(resolvedSessionId, userId);
        if (!player || player.role !== "dm") {
          if (!cancelled) setError("This device is not the DM for this session.");
          return;
        }
        if (cancelled) return;
        setSession(resolvedSessionId, player.id);
        setSessionId(resolvedSessionId);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load session.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, setSession]);

  if (error) {
    return (
      <div className="form-shell">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!sessionId || !sessionState) {
    return (
      <div className="form-shell">
        <p>Loading DM view...</p>
      </div>
    );
  }

  return (
    <>
      <header>
        <h1>DM Console</h1>
        <p className="subtitle">code {code?.toUpperCase()} — share /join/{code?.toUpperCase()} with players</p>
      </header>
      <main>
        <div className="objective">
          <b>Noise</b>
          {sessionState.noise}
        </div>
        <div className="objective">
          <b>Inventory</b>
          {sessionState.inventory.length > 0 ? sessionState.inventory.join(", ") : "empty"}
        </div>
        <div className="objective">
          <b>Flags</b>
          {Object.keys(sessionState.flags).length > 0 ? JSON.stringify(sessionState.flags) : "none set"}
        </div>
        <ul className="player-list">
          {players.map((p) => (
            <li key={p.id}>
              <b>{p.display_name}</b> ({p.role}) — currently in <b>{p.current_scene_id}</b>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
