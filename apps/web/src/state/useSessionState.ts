import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchPlayers, fetchSessionState } from "../lib/sessionApi";
import { useSessionStore } from "./useSessionStore";

// Subscribes to Postgres Changes for this session's session_state + players
// rows and keeps the Zustand store in sync. This is the single source of
// truth for party-shared state (flags/inventory/noise) and per-player scene
// across every connected client (DM screen + each player's own device).
//
// Postgres Changes can silently miss events fired while a client was
// disconnected (phone locked, wifi drop) -- on every fresh SUBSCRIBED
// event we re-fetch both tables to reconcile, rather than trusting the
// event stream alone.
export function useSessionState(sessionId: string | null) {
  const setSessionState = useSessionStore((s) => s.setSessionState);
  const setPlayers = useSessionStore((s) => s.setPlayers);
  const upsertPlayer = useSessionStore((s) => s.upsertPlayer);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const reconcile = async () => {
      const [state, players] = await Promise.all([
        fetchSessionState(sessionId),
        fetchPlayers(sessionId),
      ]);
      if (cancelled) return;
      setSessionState(state);
      setPlayers(players);
    };

    const channel = supabase
      .channel(`session-state:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_state", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          setSessionState(payload.new as never);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          upsertPlayer(payload.new as never);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void reconcile();
        }
      });

    void reconcile();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [sessionId, setSessionState, setPlayers, upsertPlayer]);
}
