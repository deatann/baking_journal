import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Recipe } from "@/lib/types";
import RecipeDetailClient from "./RecipeDetailClient";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  let sourceImageUrl: string | null = null;
  const recipe = data as Recipe;
  if (recipe.source_image_path) {
    const { data: signed } = await supabase.storage
      .from("recipe-scans")
      .createSignedUrl(recipe.source_image_path, 60 * 60);
    sourceImageUrl = signed?.signedUrl ?? null;
  }

  return <RecipeDetailClient recipe={recipe} sourceImageUrl={sourceImageUrl} />;
}
