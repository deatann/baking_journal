import { createClient } from "@/lib/supabase/server";
import { Recipe } from "@/lib/types";
import { getViewerCached } from "@/lib/session";
import { coverUrl } from "@/lib/covers";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import RecipesBrowser from "./RecipesBrowser";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = createClient();
  const [viewer, { data, error }] = await Promise.all([
    getViewerCached(),
    supabase.from("recipes").select("*").order("updated_at", { ascending: false }),
  ]);

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load recipes: {error.message}
      </div>
    );
  }

  const recipes = (data ?? []) as Recipe[];
  const isGuest = !viewer.me;
  const people: Record<string, { name: string; avatarUrl: string | null }> = {};
  for (const [id, p] of Object.entries(viewer.profiles)) people[id] = { name: p.name, avatarUrl: p.avatarUrl };
  const covers: Record<string, string> = {};
  for (const r of recipes) {
    const u = coverUrl(supabase, r.cover_path);
    if (u) covers[r.id] = u;
  }

  return (
    <div>
      <PageHeader title="Our Recipes" hand="what's baking today?" />
      {recipes.length === 0 ? (
        <EmptyState
          title={isGuest ? "Nothing shared yet" : "No recipes yet"}
          text={
            isGuest
              ? "Check back soon. The family is still choosing what to share."
              : "Tap the + button to paste a recipe, scan a photo, or log a bake."
          }
        />
      ) : (
        <RecipesBrowser recipes={recipes} people={people} covers={covers} meId={viewer.me?.id ?? ""} />
      )}
    </div>
  );
}
