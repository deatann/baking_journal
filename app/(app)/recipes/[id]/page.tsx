import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Recipe } from "@/lib/types";
import { getViewerCached } from "@/lib/session";
import { profileOf } from "@/lib/profiles";
import { coverUrl as toCoverUrl } from "@/lib/covers";
import RecipeDetailClient from "./RecipeDetailClient";

export const dynamic = "force-dynamic";

// Public recipes get a proper title/description/preview image for search engines and link previews.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recipes")
    .select("title,category,cover_path,is_public")
    .eq("id", params.id)
    .maybeSingle();
  if (!data) return {};
  const cover = toCoverUrl(supabase, data.cover_path);
  const title = data.title as string;
  const description = `${title}: a ${data.category || "baking"} recipe from our family recipe book.`;
  return {
    title,
    description,
    // Only publicly shared recipes are indexable; a signed-in family member viewing a private one is not.
    robots: data.is_public ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title, description, images: cover ? [cover] : undefined },
  };
}

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [viewer, { data, error }] = await Promise.all([
    getViewerCached(),
    supabase.from("recipes").select("*").eq("id", params.id).single(),
  ]);

  if (error || !data) notFound();

  const recipe = data as Recipe;
  const isGuest = !viewer.me;
  let sourceImageUrl: string | null = null;
  // The original screenshot is never shown to guests (storage policy blocks it too).
  if (!isGuest && recipe.source_image_path) {
    const { data: signed } = await supabase.storage
      .from("recipe-scans")
      .createSignedUrl(recipe.source_image_path, 60 * 60);
    sourceImageUrl = signed?.signedUrl ?? null;
  }

  const meId = viewer.me?.id ?? "";
  const owner = profileOf(viewer.profiles, recipe.user_id);

  return (
    <RecipeDetailClient
      recipe={recipe}
      sourceImageUrl={sourceImageUrl}
      canEdit={!isGuest && recipe.user_id === meId}
      ownerName={owner.name}
      isGuest={isGuest}
      coverUrl={toCoverUrl(supabase, recipe.cover_path)}
    />
  );
}
