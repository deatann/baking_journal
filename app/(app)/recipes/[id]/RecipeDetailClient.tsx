"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Recipe } from "@/lib/types";
import { categoryStyle } from "@/lib/categoryStyle";
import ScaleCalculator from "@/components/ScaleCalculator";
import PageHeader from "@/components/PageHeader";
import RecipeForm, { RecipeFormValues } from "@/components/RecipeForm";

export default function RecipeDetailClient({
  recipe,
  sourceImageUrl,
  canEdit,
  ownerName,
}: {
  recipe: Recipe;
  sourceImageUrl: string | null;
  canEdit: boolean;
  ownerName: string;
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
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());

  function toggleStep(i: number) {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

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
    };
    return (
      <div className="max-w-2xl">
        <PageHeader title="Edit recipe" hand="tweak away">
          <button onClick={() => setEditing(false)} className="text-sm font-extrabold text-crust-500 underline">
            Cancel
          </button>
        </PageHeader>
        <RecipeForm initial={initial} submitLabel="Save changes" onSubmit={handleUpdate} />
      </div>
    );
  }

  const { emoji } = categoryStyle(recipe.category);
  const h2 = "mb-3 font-display text-xl font-bold text-ink";

  return (
    <div className="max-w-2xl">
      <div className="mb-1 flex items-start gap-3 pl-[62px] md:pl-0">
        <h1 className="min-w-0 flex-1 font-display text-[26px] font-bold leading-tight text-ink md:text-3xl">
          <span className="mr-1">{emoji}</span>
          {recipe.title}
        </h1>
        {canEdit && (
          <button onClick={() => setEditing(true)} className="btn btn-ghost shrink-0 !px-4 !py-1.5 text-sm">
            Edit
          </button>
        )}
      </div>
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-crust-500">
        {recipe.category}
        {recipe.source_type === "scanned" && " · scanned"}
      </p>
      <p className="mb-4 mt-1 text-[13px] font-bold text-crust-500">
        Added by {canEdit ? "you" : ownerName}
        {!canEdit && <span className="font-normal"> · only {ownerName} can edit this recipe</span>}
      </p>

      {recipe.tags?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border-[1.5px] border-ink bg-peach-100 px-2.5 py-0.5 text-xs font-bold"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2 text-[13px] font-extrabold">
        {recipe.prep_time_min ? (
          <span className="rounded-full border-2 border-crust-200 bg-white px-3 py-1">Prep {recipe.prep_time_min} min</span>
        ) : null}
        {recipe.cook_time_min ? (
          <span className="rounded-full border-2 border-crust-200 bg-white px-3 py-1">Bake {recipe.cook_time_min} min</span>
        ) : null}
        {recipe.oven_temp_c ? (
          <span className="rounded-full border-2 border-crust-200 bg-white px-3 py-1">Oven {recipe.oven_temp_c}°C</span>
        ) : null}
      </div>

      {sourceImageUrl && (
        <details className="mb-6">
          <summary className="cursor-pointer text-sm font-bold text-crust-500">
            View original scanned screenshot
          </summary>
          <img
            src={sourceImageUrl}
            alt="Original scanned recipe"
            className="mt-2 max-h-96 rounded-2xl border-2 border-ink object-contain"
          />
        </details>
      )}

      <section className="mb-8">
        <h2 className={h2}>Scale &amp; ingredients</h2>
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
        <h2 className={h2}>Steps</h2>
        {recipe.steps.length > 0 ? (
          <ol className="space-y-2.5">
            {recipe.steps.map((step, i) => {
              const done = doneSteps.has(i);
              return (
                <li
                  key={i}
                  onClick={() => toggleStep(i)}
                  className={`flex cursor-pointer gap-3 text-[15px] leading-snug ${done ? "text-crust-400 line-through" : "text-ink"}`}
                >
                  <span
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink text-xs font-extrabold no-underline ${
                      done ? "bg-sage-400" : "bg-butter-300"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="pt-1">{step}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-crust-400">No steps recorded.</p>
        )}
      </section>

      {recipe.notes && (
        <section className="mb-8">
          <h2 className={h2}>Notes</h2>
          <p className="whitespace-pre-wrap text-[15px] text-crust-700">{recipe.notes}</p>
        </section>
      )}

      <Link
        href={`/journal/new?recipeId=${recipe.id}&scale=${currentFactor}`}
        className="btn btn-primary w-full text-center sm:w-auto"
      >
        Log a bake of this (at ×{currentFactor})
      </Link>

      {canEdit && (
        <div className="mt-10 text-center">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-bold text-red-600 underline disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete recipe"}
          </button>
        </div>
      )}
    </div>
  );
}
