import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { dmClearNoise, dmForceScene, fetchOwnPlayer, fetchSessionByCode } from "../lib/sessionApi";
import { useSessionStore } from "../state/useSessionStore";
import { useSessionState } from "../state/useSessionState";

// Mostly a read-only live dump of flags/inventory/noise/players. The one
// write surface is the Warden alert panel: when noise hits 100 nothing
// happens automatically -- the DM narrates at the table and decides who (if
// anyone) gets dragged to the cell, or whether the party slipped away.
// dm_force_scene/dm_clear_noise are role-gated server-side; the rest of the
// Phase 4 overrides (grant item, arbitrary scene moves from the roster) will
// attach to this same foundation.
export function DmPage() {
  const { code } = useParams<{ code: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setSession = useSessionStore((s) => s.setSession);
  const sessionState = useSessionStore((s) => s.sessionState);
  const players = useSessionStore((s) => s.players);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useSessionState(sessionId);

  const runDmAction = async (fn: () => Promise<void>) => {
    setActionBusy(true);
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "The action failed.");
    } finally {
      setActionBusy(false);
    }
  };

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
        {sessionState.noise >= 100 && sessionId && (
          <div className="warden-alert" role="alert">
            <h2>The Warden stirs</h2>
            <p>
              <b>{String(sessionState.flags.wardenAlert ?? "Someone")}</b> made too much noise.
              Narrate it your way — the classic beat: <i>"A heavy, rhythmic clanking fills the
              hall. Steam hisses through the vents. THE WARDEN has found you."</i> Then decide
              what happens:
            </p>
            <div className="warden-actions">
              {players
                .filter((p) => p.role === "player" && p.current_scene_id !== "prison")
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={actionBusy}
                    className={
                      p.display_name === sessionState.flags.wardenAlert ? "warden-offender" : ""
                    }
                    onClick={() => void runDmAction(() => dmForceScene(sessionId, p.id, "prison"))}
                  >
                    Send {p.display_name} to the cell
                  </button>
                ))}
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void runDmAction(() => dmClearNoise(sessionId))}
              >
                They slipped away (clear noise)
              </button>
            </div>
            {actionError && <p className="error">{actionError}</p>}
          </div>
        )}
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
