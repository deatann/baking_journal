import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// Lists the front page, About, and every recipe marked "Share on the guest page".
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/recipes`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
  ];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase.from("recipes").select("id,updated_at").eq("is_public", true);
    for (const r of data ?? []) {
      entries.push({
        url: `${SITE_URL}/recipes/${r.id}`,
        lastModified: r.updated_at,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    /* migration not run yet: just list the static pages */
  }
  return entries;
}
