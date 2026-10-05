import { createClient } from "@/lib/supabase/server";
import { Recipe } from "@/lib/types";
import { getMe } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import RecipesBrowser from "./RecipesBrowser";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = createClient();
  const session = await getMe(supabase);
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load recipes: {error.message}
      </div>
    );
  }

  const recipes = (data ?? []) as Recipe[];
  const owners: Record<string, string> = {};
  for (const [id, p] of Object.entries(session?.profiles ?? {})) owners[id] = p.name;

  return (
    <div>
      <PageHeader title="Our Recipes" hand="what's baking today?" />
      {recipes.length === 0 ? (
        <EmptyState
          title="No recipes yet"
          text="Tap the + button to paste a recipe, scan a photo, or log a bake."
        />
      ) : (
        <RecipesBrowser recipes={recipes} owners={owners} meId={session?.me.id ?? ""} />
      )}
    </div>
  );
}
