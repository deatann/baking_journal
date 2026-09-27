"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import RecipeForm, { RecipeFormValues } from "@/components/RecipeForm";
import { newIngredientId } from "@/lib/types";
import { readRecipeDraft, clearRecipeDraft } from "@/lib/recipeDraft";

const EMPTY: RecipeFormValues = {
  title: "",
  category: "",
  base_yield_qty: null,
  base_yield_unit: "",
  ingredients: [{ id: newIngredientId(), name: "", qty: null, unit: "", note: "" }],
  steps: [""],
  prep_time_min: null,
  cook_time_min: null,
  oven_temp_c: null,
  tags: [],
  notes: "",
  is_favorite: false,
};

export default function NewRecipePage() {
  return (
    <Suspense fallback={null}>
      <NewRecipeForm />
    </Suspense>
  );
}

function NewRecipeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initial, setInitial] = useState<RecipeFormValues>(EMPTY);
  const [sourceImagePath, setSourceImagePath] = useState<string | null>(null);
  const [fromDraft, setFromDraft] = useState(false);
  const [ready, setReady] = useState(false);

  // Support arriving here from the Scan or Import-from-text flow with
  // prefilled data left in sessionStorage.
  useEffect(() => {
    if (searchParams.get("fromScan") === "1") {
      const draft = readRecipeDraft();
      if (draft) {
        setInitial({ ...EMPTY, ...draft.values });
        setSourceImagePath(draft.sourceImagePath ?? null);
        setFromDraft(true);
      }
    }
    setReady(true);
  }, [searchParams]);

  async function handleSubmit(values: RecipeFormValues) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");

    const { data, error } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
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
        source_type: sourceImagePath ? "scanned" : "manual",
        source_image_path: sourceImagePath,
      })
      .select("id")
      .single();

    if (error) throw error;

    clearRecipeDraft();
    router.push(`/recipes/${data.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-crust-800">
        {fromDraft ? "Review imported recipe" : "New recipe"}
      </h1>
      {ready && (
        <RecipeForm
          key={fromDraft ? "draft" : "blank"}
          initial={initial}
          submitLabel="Save recipe"
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
