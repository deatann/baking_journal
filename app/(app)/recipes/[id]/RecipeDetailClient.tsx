"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Recipe } from "@/lib/types";
import ScaleCalculator from "@/components/ScaleCalculator";
import RecipeForm, { RecipeFormValues } from "@/components/RecipeForm";

export default function RecipeDetailClient({
  recipe,
  sourceImageUrl,
}: {
  recipe: Recipe;
  sourceImageUrl: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [currentFactor, setCurrentFactor] = useState(1);
  const [userDensities, setUserDensities] = useState<Record<string, number>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("ingredient_densities")
      .select("ingredient_key,grams_per_cup")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, number> = {};
        for (const row of data) map[row.ingredient_key] = Number(row.grams_per_cup);
        setUserDensities(map);
      });
  }, []);

  async function handleSaveDensity(ingredientKey: string, gramsPerCup: number) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("ingredient_densities")
      .upsert(
        { user_id: user.id, ingredient_key: ingredientKey, grams_per_cup: gramsPerCup },
        { onConflict: "user_id,ingredient_key" },
      );
    if (error) {
      alert(`Couldn't save that conversion: ${error.message}`);
      return;
    }
    setUserDensities((prev) => ({ ...prev, [ingredientKey]: gramsPerCup }));
  }
  const [deleting, setDeleting] = useState(false);

  async function handleUpdate(values: RecipeFormValues) {
    const supabase = createClient();
    const { error } = await supabase
      .from("recipes")
      .update({
        title: values.title,
        category: values.category || "uncategorized",
        base_yield_qty: values.base_yield_qty,
        base_yield_unit: values.base_yield_unit || null,
        ingredients: values.ingredients.filter((i) => i.name.trim() !== ""),
        steps: values.steps.filter((s) => s.trim() !== ""),
        prep_time_min: values.prep_time_min,
        cook_time_min: values.cook_time_min,
        oven_temp_c: values.oven_temp_c,
        tags: values.tags,
        notes: values.notes,
        is_favorite: values.is_favorite,
      })
      .eq("id", recipe.id);

    if (error) throw error;
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${recipe.title}"? This can't be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("recipes").delete().eq("id", recipe.id);
    setDeleting(false);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    router.push("/recipes");
  }

  if (editing) {
    const initial: RecipeFormValues = {
      title: recipe.title,
      category: recipe.category,
      base_yield_qty: recipe.base_yield_qty,
      base_yield_unit: recipe.base_yield_unit ?? "",
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      prep_time_min: recipe.prep_time_min,
      cook_time_min: recipe.cook_time_min,
      oven_temp_c: recipe.oven_temp_c,
      tags: recipe.tags ?? [],
      notes: recipe.notes ?? "",
      is_favorite: recipe.is_favorite,
    };
    return (
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-crust-800">Edit recipe</h1>
          <button
            onClick={() => setEditing(false)}
            className="text-sm text-crust-500 hover:text-crust-700"
          >
            Cancel
          </button>
        </div>
        <RecipeForm initial={initial} submitLabel="Save changes" onSubmit={handleUpdate} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-crust-800">
          {recipe.is_favorite && "⭐ "}
          {recipe.title}
        </h1>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-full border-2 border-crust-300 px-3 py-1.5 text-sm font-semibold text-crust-700 transition-transform hover:-translate-y-0.5 hover:bg-crust-100"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs uppercase tracking-wide text-crust-400">
        {recipe.category}
        {recipe.source_type === "scanned" && " · scanned"}
      </p>

      {recipe.tags?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-crust-100 px-2 py-0.5 text-xs text-crust-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4 text-sm text-crust-600">
        {recipe.prep_time_min && <span>Prep: {recipe.prep_time_min} min</span>}
        {recipe.cook_time_min && <span>Bake: {recipe.cook_time_min} min</span>}
        {recipe.oven_temp_c && <span>Oven: {recipe.oven_temp_c}°C</span>}
      </div>

      {sourceImageUrl && (
        <details className="mb-6">
          <summary className="cursor-pointer text-sm text-crust-500 hover:text-crust-700">
            View original scanned screenshot
          </summary>
          <img
            src={sourceImageUrl}
            alt="Original scanned recipe"
            className="mt-2 max-h-96 rounded-lg border border-crust-200 object-contain"
          />
        </details>
      )}

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-bold text-crust-800">Scale &amp; ingredients</h2>
        <ScaleCalculator
          ingredients={recipe.ingredients}
          baseYieldQty={recipe.base_yield_qty}
          baseYieldUnit={recipe.base_yield_unit}
          onScaleChange={setCurrentFactor}
          userDensities={userDensities}
          onSaveDensity={handleSaveDensity}
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-bold text-crust-800">Steps</h2>
        {recipe.steps.length > 0 ? (
          <ol className="list-decimal space-y-2 pl-6 text-sm text-crust-700">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-crust-400">No steps recorded.</p>
        )}
      </section>

      {recipe.notes && (
        <section className="mb-8">
          <h2 className="mb-2 font-display text-lg font-bold text-crust-800">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-crust-700">{recipe.notes}</p>
        </section>
      )}

      <Link
        href={`/journal/new?recipeId=${recipe.id}&scale=${currentFactor}`}
        className="inline-block rounded-full bg-crust-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md"
      >
        Log a bake of this (at ×{currentFactor})
      </Link>
    </div>
  );
}
