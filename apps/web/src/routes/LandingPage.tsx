import { useState } from "react";
import { useNavigate } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { createSession, endSession, findExistingPlayerRow } from "../lib/sessionApi";
import { supabase } from "../lib/supabaseClient";

interface ExistingRun {
  sessionId: string;
  code: string;
  role: "dm" | "player";
}

export function LandingPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingRun | null>(null);

  const startFresh = async (name: string) => {
    const { code } = await createSession(name);
    navigate(`/dm/${code}`);
  };

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError("Enter a name first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const userId = await ensureAnonymousSession();
      const found = await findExistingPlayerRow(userId);
      if (found) {
        const { data: session } = await supabase
          .from("sessions")
          .select("code")
          .eq("id", found.session_id)
          .single();
        if (session) {
          setExisting({ sessionId: found.session_id, code: session.code, role: found.role });
          return;
        }
      }
      await startFresh(displayName.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleResume = () => {
    if (!existing) return;
    navigate(existing.role === "dm" ? `/dm/${existing.code}` : `/play/${existing.code}`);
  };

  // A DM's old run is ended (status -> completed) so it can't resurface;
  // a player can't end someone else's session, so theirs is just left behind.
  const handleStartFresh = async () => {
    if (!existing) return;
    setBusy(true);
    setError(null);
    try {
      if (existing.role === "dm") {
        await endSession(existing.sessionId);
      }
      await startFresh(displayName.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-shell">
      <h1>The Silent Forge</h1>
      <p className="subtitle">A Voss Atelier subquest</p>
      <label htmlFor="display-name">Your name</label>
      <input
        id="display-name"
        value={displayName}
        onChange={(e) => {
          setDisplayName(e.target.value);
          setExisting(null);
        }}
        placeholder="Chelo"
      />
      {existing ? (
        <>
          <p style={{ fontSize: 14 }}>
            You already have a quest running as {existing.role === "dm" ? "DM" : "a player"} (code{" "}
            <code>{existing.code}</code>).
          </p>
          <button type="button" disabled={busy} onClick={handleResume}>
            Resume that quest
          </button>
          <button type="button" disabled={busy} onClick={() => void handleStartFresh()}>
            {busy
              ? "Starting..."
              : existing.role === "dm"
                ? "End it and start fresh"
                : "Leave it and start fresh"}
          </button>
        </>
      ) : (
        <button type="button" disabled={busy} onClick={() => void handleCreate()}>
          {busy ? "Starting..." : "Start a new quest (as DM)"}
        </button>
      )}
      {error && <p className="error">{error}</p>}
      <p style={{ marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
        Have a join code from your DM? Go to <code>/join/&lt;code&gt;</code>.
      </p>
    </div>
  );
}
