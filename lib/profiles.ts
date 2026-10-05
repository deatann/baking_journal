// Everyone in the family can see everyone's name and chibi. Profiles are tiny
// (5 rows), so pages just load the lot and look people up by id.
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PublicProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export function avatarUrlFor(
  supabase: SupabaseClient,
  path: string | null | undefined,
  updatedAt?: string | null,
): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // ?v= makes the browser re-fetch after someone uploads a new chibi to the same path.
  const v = updatedAt ? Date.parse(updatedAt) : NaN;
  return Number.isFinite(v) ? `${data.publicUrl}?v=${v}` : data.publicUrl;
}

/** Returns {} (never throws) so pages still render if the profiles migration hasn't been run yet. */
export async function loadProfiles(
  supabase: SupabaseClient,
): Promise<Record<string, PublicProfile>> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,avatar_path,updated_at");
  if (error || !data) return {};
  const map: Record<string, PublicProfile> = {};
  for (const p of data as any[]) {
    map[p.id] = {
      id: p.id,
      name: p.display_name,
      avatarUrl: avatarUrlFor(supabase, p.avatar_path, p.updated_at),
    };
  }
  return map;
}

export function profileOf(map: Record<string, PublicProfile>, userId: string): PublicProfile {
  return map[userId] ?? { id: userId, name: "Someone", avatarUrl: null };
}
