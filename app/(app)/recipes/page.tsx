import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Recipe } from "@/lib/types";
import RecipesBrowser from "./RecipesBrowser";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load recipes: {error.message}
      </div>
    );
  }

  const recipes = (data ?? []) as Recipe[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-crust-800">My Recipes</h1>
        <div className="flex gap-2">
          <Link
            href="/scan"
            className="rounded-full border-2 border-crust-300 px-3 py-2 text-sm font-semibold text-crust-700 transition-transform hover:-translate-y-0.5 hover:bg-crust-100"
          >
            Scan a recipe
          </Link>
          <Link
            href="/import"
            className="rounded-full border-2 border-crust-300 px-3 py-2 text-sm font-semibold text-crust-700 transition-transform hover:-translate-y-0.5 hover:bg-crust-100"
          >
            Import from text
          </Link>
          <Link
            href="/recipes/new"
            className="rounded-full bg-crust-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md"
          >
            + New recipe
          </Link>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-crust-300 p-10 text-center text-crust-500">
          <p className="mb-3">No recipes yet.</p>
          <p className="text-sm">
            Add one manually, or scan a screenshot of a recipe you&apos;ve modified.
          </p>
        </div>
      ) : (
        <RecipesBrowser recipes={recipes} />
      )}
    </div>
  );
}
