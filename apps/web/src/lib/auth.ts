import { supabase } from "./supabaseClient";

// Supabase persists the anon session in localStorage automatically, so a
// returning tab already has a auth.uid() -- callers just need to ensure
// *some* session exists before hitting a session-scoped RPC.
export async function ensureAnonymousSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    return data.session.user.id;
  }
  const { data: signedIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signedIn.session) {
    throw error ?? new Error("anonymous sign-in failed");
  }
  return signedIn.session.user.id;
}
