import { supabase } from "./supabaseClient";

export interface PlayerRow {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  role: "dm" | "player";
  current_scene_id: string;
  joined_at: string;
}

export interface SessionStateRow {
  session_id: string;
  flags: Record<string, boolean | number | string>;
  inventory: string[];
  noise: number;
  puzzle_working: Record<string, unknown>;
  updated_at: string;
}

export async function createSession(displayName: string) {
  const { data, error } = await supabase
    .rpc("create_session", { p_display_name: displayName })
    .single<{ session_id: string; code: string }>();
  if (error) throw error;
  return data;
}

export async function joinSession(code: string, displayName: string) {
  const { data, error } = await supabase
    .rpc("join_session", { p_code: code, p_display_name: displayName })
    .single<{ session_id: string }>();
  if (error) throw error;
  return data;
}

export async function setCurrentScene(sessionId: string, sceneId: string) {
  const { error } = await supabase.rpc("set_current_scene", {
    p_session_id: sessionId,
    p_scene_id: sceneId,
  });
  if (error) throw error;
}

export async function submitPuzzleAttempt(
  sessionId: string,
  puzzleId: string,
  value: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .rpc("submit_puzzle_attempt", {
      p_session_id: sessionId,
      p_puzzle_id: puzzleId,
      p_value: value,
    })
    .single<{ correct: boolean }>();
  if (error) throw error;
  return data;
}

export async function placeItem(sessionId: string, itemId: string) {
  const { data, error } = await supabase
    .rpc("place_item", { p_session_id: sessionId, p_item_id: itemId })
    .single<{ ok: boolean; all_placed?: boolean }>();
  if (error) throw error;
  return data;
}

export async function armSpire(sessionId: string) {
  const { data, error } = await supabase
    .rpc("arm_spire", { p_session_id: sessionId })
    .single<{ ok: boolean; already_armed?: boolean }>();
  if (error) throw error;
  return data;
}

export async function ventOverflow(sessionId: string) {
  const { data, error } = await supabase
    .rpc("vent_overflow", { p_session_id: sessionId })
    .single<{ ok: boolean; already_vented?: boolean }>();
  if (error) throw error;
  return data;
}

export async function activateConvergence(sessionId: string) {
  const { data, error } = await supabase
    .rpc("activate_convergence", { p_session_id: sessionId })
    .single<{ ok: boolean; already_won?: boolean; missing?: ("armed" | "vented" | "aligned")[] }>();
  if (error) throw error;
  return data;
}

export async function escapePrison(sessionId: string) {
  const { error } = await supabase.rpc("escape_prison", { p_session_id: sessionId });
  if (error) throw error;
}

export async function dmForceScene(sessionId: string, playerId: string, sceneId: string) {
  const { error } = await supabase.rpc("dm_force_scene", {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_scene_id: sceneId,
  });
  if (error) throw error;
}

export async function dmClearNoise(sessionId: string) {
  const { error } = await supabase.rpc("dm_clear_noise", { p_session_id: sessionId });
  if (error) throw error;
}

// Finds the current auth user's existing players row across ANY active
// session, so a reloaded tab can resume without asking for a name/code again.
export async function findExistingPlayerRow(userId: string): Promise<PlayerRow | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*, sessions!inner(status)")
    .eq("user_id", userId)
    .eq("sessions.status", "active")
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as PlayerRow | null;
}

// Resolves a share code to a session id. RLS only allows this to succeed for
// someone who is already a member (i.e. already ran join_session/create_session
// with that code) -- it's not a general "look up any session by code" escape hatch.
export async function fetchSessionByCode(code: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function fetchOwnPlayer(sessionId: string, userId: string): Promise<PlayerRow | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as PlayerRow | null;
}

export async function fetchSessionState(sessionId: string): Promise<SessionStateRow> {
  const { data, error } = await supabase
    .from("session_state")
    .select("*")
    .eq("session_id", sessionId)
    .single();
  if (error) throw error;
  return data as SessionStateRow;
}

export async function fetchPlayers(sessionId: string): Promise<PlayerRow[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data as PlayerRow[];
}
