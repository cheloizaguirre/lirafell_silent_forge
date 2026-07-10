import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { scenes } from "@silent-forge/content";
import { ensureAnonymousSession } from "../lib/auth";
import {
  dmAdjustNoise,
  dmClearNoise,
  dmForceScene,
  dmGetSolutions,
  dmGrantItem,
  fetchOwnPlayer,
  fetchSessionByCode,
} from "../lib/sessionApi";
import type { DmSolution } from "../lib/sessionApi";
import { useSessionStore } from "../state/useSessionStore";
import { useSessionState } from "../state/useSessionState";

// Pretty names for the grant buttons; ids are what the RPC/state speak.
const GRANTABLE_ITEMS = [
  { id: "heart", name: "Cogwork Heart" },
  { id: "lens", name: "Aether Lens" },
  { id: "valve", name: "Pressure Valve Key" },
];

// A live dump of flags/inventory/noise/players, plus the two write surfaces:
// the Warden alert panel (noise 100 -- nothing happens automatically, the DM
// narrates at the table and decides who gets dragged to the cell or whether
// the party slipped away) and the always-on overrides panel (the plan's v1
// trio, no more: force scene per-player, clear noise, grant item). Every
// override RPC is role-gated server-side -- this route being hidden from
// players is cosmetic, not the gate.
export function DmPage() {
  const { code } = useParams<{ code: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setSession = useSessionStore((s) => s.setSession);
  const sessionState = useSessionStore((s) => s.sessionState);
  const players = useSessionStore((s) => s.players);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [movePlayerId, setMovePlayerId] = useState("");
  const [moveSceneId, setMoveSceneId] = useState<string>(scenes[0]?.id ?? "entrance");
  const [solutions, setSolutions] = useState<DmSolution[] | null>(null);

  useSessionState(sessionId);

  // The cheat sheet comes from a role-gated RPC (answers never ship in the
  // bundle); one fetch per session is plenty -- it's static content.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    dmGetSolutions(sessionId)
      .then((s) => {
        if (!cancelled) setSolutions(s);
      })
      .catch(() => {
        if (!cancelled) setSolutions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

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
          <div className={`noise-gauge ${sessionState.noise >= 70 ? "danger" : ""}`}>
            <div className="noise-fill" style={{ width: `${sessionState.noise}%` }} />
          </div>
        </div>
        <div className="objective">
          <b>Inventory</b>
          {sessionState.inventory.length > 0 ? sessionState.inventory.join(", ") : "empty"}
        </div>
        <div className="objective">
          <b>Flags</b>
          {(() => {
            // noiseEvent is BANG plumbing, not game state -- pure churn here.
            const { noiseEvent: _omitted, ...dmFlags } = sessionState.flags;
            return Object.keys(dmFlags).length > 0 ? JSON.stringify(dmFlags) : "none set";
          })()}
        </div>
        <ul className="player-list">
          {players.map((p) => (
            <li key={p.id}>
              <b>{p.display_name}</b> ({p.role}) — currently in <b>{p.current_scene_id}</b>
            </li>
          ))}
        </ul>

        <div className="dm-overrides">
          <h2>Overrides</h2>
          <div className="dm-override-row">
            <label htmlFor="dm-move-player">Move</label>
            <select
              id="dm-move-player"
              value={movePlayerId}
              onChange={(e) => setMovePlayerId(e.target.value)}
            >
              <option value="">choose a player…</option>
              {players
                .filter((p) => p.role === "player")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name}
                  </option>
                ))}
            </select>
            <label htmlFor="dm-move-scene">to</label>
            <select
              id="dm-move-scene"
              value={moveSceneId}
              onChange={(e) => setMoveSceneId(e.target.value)}
            >
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={actionBusy || !movePlayerId}
              onClick={() => void runDmAction(() => dmForceScene(sessionId, movePlayerId, moveSceneId))}
            >
              Move player
            </button>
          </div>
          <div className="dm-override-row">
            <span className="dm-override-label">Grant</span>
            {GRANTABLE_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={actionBusy || sessionState.inventory.includes(item.id)}
                onClick={() => void runDmAction(() => dmGrantItem(sessionId, item.id))}
              >
                {sessionState.inventory.includes(item.id) ? `${item.name} ✓` : item.name}
              </button>
            ))}
          </div>
          <div className="dm-override-row">
            <span className="dm-override-label">Noise</span>
            <button
              type="button"
              disabled={actionBusy || sessionState.noise === 0}
              onClick={() => void runDmAction(() => dmAdjustNoise(sessionId, -10))}
            >
              −10
            </button>
            <button
              type="button"
              disabled={actionBusy || sessionState.noise === 100}
              onClick={() => void runDmAction(() => dmAdjustNoise(sessionId, 10))}
            >
              +10
            </button>
            <button
              type="button"
              disabled={actionBusy || sessionState.noise === 0}
              onClick={() => void runDmAction(() => dmClearNoise(sessionId))}
            >
              Clear noise ({sessionState.noise})
            </button>
          </div>
          {actionError && <p className="error">{actionError}</p>}
        </div>

        {/* Collapsed by default: the DM console is private, but no reason to
            have every answer on screen when a player wanders past. */}
        <details className="dm-cheatsheet">
          <summary>Cheat sheet — all puzzle solutions</summary>
          {solutions === null && <p className="dm-cheatsheet-note">Loading…</p>}
          {solutions?.length === 0 && (
            <p className="dm-cheatsheet-note">Could not load the cheat sheet.</p>
          )}
          <ul>
            {(solutions ?? []).map((s) => (
              <li key={s.title}>
                <b>{s.title}</b>
                <span className="dm-cheatsheet-solution">{s.solution}</span>
                <span className="dm-cheatsheet-note">{s.note}</span>
              </li>
            ))}
          </ul>
        </details>
      </main>
    </>
  );
}
