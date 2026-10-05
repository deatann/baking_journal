import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { loadProfiles, type PublicProfile } from "./profiles";

export interface Me extends PublicProfile {}

/**
 * The signed-in user plus their profile (falls back to the email name if no profile row yet).
 * middleware.ts has already verified the session with Supabase on this request, so we read the
 * user from the cookie here instead of making another network round trip. Database access is
 * still enforced by RLS using the user's token, so this is display-only.
 */
export async function getMe(
  supabase: SupabaseClient,
): Promise<{ me: Me; profiles: Record<string, PublicProfile> } | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;
  const profiles = await loadProfiles(supabase);
  const fromEmail = (user.email ?? "me").split("@")[0];
  const me = profiles[user.id] ?? {
    id: user.id,
    name: fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1),
    avatarUrl: null,
  };
  return { me, profiles };
}

/** One lookup per request, shared by the layout and the page (React cache). */
export const getMeCached = cache(async () => getMe(createClient()));
