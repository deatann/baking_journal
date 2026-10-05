import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Recipe } from "@/lib/types";
import { getMe } from "@/lib/session";
import { profileOf } from "@/lib/profiles";
import RecipeDetailClient from "./RecipeDetailClient";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const session = await getMe(supabase);
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const recipe = data as Recipe;
  let sourceImageUrl: string | null = null;
  if (recipe.source_image_path) {
    const { data: signed } = await supabase.storage
      .from("recipe-scans")
      .createSignedUrl(recipe.source_image_path, 60 * 60);
    sourceImageUrl = signed?.signedUrl ?? null;
  }

  const meId = session?.me.id ?? "";
  const owner = profileOf(session?.profiles ?? {}, recipe.user_id);

  return (
    <RecipeDetailClient
      recipe={recipe}
      sourceImageUrl={sourceImageUrl}
      canEdit={recipe.user_id === meId}
      ownerName={owner.name}
    />
  );
}
