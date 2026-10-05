import type { SupabaseClient } from "@supabase/supabase-js";
import { loadProfiles, type PublicProfile } from "./profiles";

export interface Me extends PublicProfile {}

/** The signed-in user plus their profile (falls back to the email name if no profile row yet). */
export async function getMe(
  supabase: SupabaseClient,
): Promise<{ me: Me; profiles: Record<string, PublicProfile> } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
