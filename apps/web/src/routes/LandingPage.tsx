import { useState } from "react";
import { useNavigate } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { createSession, findExistingPlayerRow } from "../lib/sessionApi";
import { supabase } from "../lib/supabaseClient";

export function LandingPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError("Enter a name first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const userId = await ensureAnonymousSession();
      const existing = await findExistingPlayerRow(userId);
      if (existing) {
        const { data: session } = await supabase
          .from("sessions")
          .select("code")
          .eq("id", existing.session_id)
          .single();
        if (session) {
          navigate(existing.role === "dm" ? `/dm/${session.code}` : `/play/${session.code}`);
          return;
        }
      }
      const { code } = await createSession(displayName.trim());
      navigate(`/dm/${code}`);
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
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Chelo"
      />
      <button type="button" disabled={busy} onClick={() => void handleCreate()}>
        {busy ? "Starting..." : "Start a new quest (as DM)"}
      </button>
      {error && <p className="error">{error}</p>}
      <p style={{ marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
        Have a join code from your DM? Go to <code>/join/&lt;code&gt;</code>.
      </p>
    </div>
  );
}
