import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ensureAnonymousSession } from "../lib/auth";
import { joinSession } from "../lib/sessionApi";
import { randomOrcName } from "../lib/orcNames";

export function JoinPage() {
  const { code: codeFromUrl } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(codeFromUrl?.toUpperCase() ?? "");
  const [displayName, setDisplayName] = useState("");
  const [fallbackName] = useState(randomOrcName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    const name = displayName.trim() || fallbackName;
    if (!code.trim()) {
      setError("Enter a join code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureAnonymousSession();
      await joinSession(code.trim().toUpperCase(), name);
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
        placeholder={fallbackName}
      />
      <button type="button" disabled={busy} onClick={() => void handleJoin()}>
        {busy ? "Joining..." : "Join"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
