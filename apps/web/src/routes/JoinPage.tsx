import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { joinSession } from "../lib/sessionApi";

export function JoinPage() {
  const { code: codeFromUrl } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(codeFromUrl?.toUpperCase() ?? "");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code.trim() || !displayName.trim()) {
      setError("Enter both a join code and your name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureAnonymousSession();
      await joinSession(code.trim().toUpperCase(), displayName.trim());
      navigate(`/play/${code.trim().toUpperCase()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join that session.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-shell">
      <h1>Join the Quest</h1>
      <label htmlFor="join-code">Join code</label>
      <input
        id="join-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="XSTN2A"
      />
      <label htmlFor="join-name">Your name</label>
      <input
        id="join-name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Player B"
      />
      <button type="button" disabled={busy} onClick={() => void handleJoin()}>
        {busy ? "Joining..." : "Join"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
