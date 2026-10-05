"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import RecipeForm, { RecipeFormValues } from "@/components/RecipeForm";
import { newIngredientId } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader
        title={fromDraft ? "Review & save" : "New recipe"}
        hand={fromDraft ? "almost in the book" : "write it down"}
      />
      {ready && (
        <RecipeForm
          key={fromDraft ? "draft" : "blank"}
          initial={initial}
          submitLabel="Save recipe"
          onSubmit={handleSubmit}
          extraTopContent={
            fromDraft ? (
              <div className="rounded-2xl border-2 border-butter-300 bg-butter-100 px-3.5 py-2.5 text-[13px] font-bold text-crust-700">
                Filled in by AI. Check the quantities and steps before saving.
              </div>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
