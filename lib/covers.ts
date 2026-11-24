import type { SupabaseClient } from "@supabase/supabase-js";

/** Cover photos live in the public "recipe-covers" bucket under random file names. */
export function coverUrl(supabase: SupabaseClient, path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from("recipe-covers").getPublicUrl(path).data.publicUrl;
}
