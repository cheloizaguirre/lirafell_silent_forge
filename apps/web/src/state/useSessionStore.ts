import { create } from "zustand";
import type { PlayerRow, SessionStateRow } from "../lib/sessionApi";

interface SessionStore {
  sessionId: string | null;
  selfPlayerId: string | null;
  sessionState: SessionStateRow | null;
  players: PlayerRow[];
  // Cosmetic "have I personally seen this flavor text before" bookkeeping
  // for showText's onlyIfFlagUnset/onlyIfFlagSet -- deliberately NOT synced
  // to session_state.flags. Only puzzle RPCs may write real party-shared
  // flags; this exists so we don't need a generic (and easily abusable)
  // set-any-flag RPC just for "have you read this note before" text.
  localFlags: Set<string>;

  setSession: (sessionId: string, selfPlayerId: string) => void;
  setSessionState: (state: SessionStateRow) => void;
  setPlayers: (players: PlayerRow[]) => void;
  upsertPlayer: (player: PlayerRow) => void;
  markLocalFlag: (flag: string) => void;

  self: () => PlayerRow | null;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  selfPlayerId: null,
  sessionState: null,
  players: [],
  localFlags: new Set(),

  setSession: (sessionId, selfPlayerId) => set({ sessionId, selfPlayerId }),
  setSessionState: (sessionState) => set({ sessionState }),
  setPlayers: (players) => set({ players }),
  upsertPlayer: (player) =>
    set((s) => {
      const idx = s.players.findIndex((p) => p.id === player.id);
      if (idx === -1) return { players: [...s.players, player] };
      const next = s.players.slice();
      next[idx] = player;
      return { players: next };
    }),
  markLocalFlag: (flag) => set((s) => ({ localFlags: new Set(s.localFlags).add(flag) })),

  self: () => get().players.find((p) => p.id === get().selfPlayerId) ?? null,
}));
