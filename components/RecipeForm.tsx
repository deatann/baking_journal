"use client";

import { useEffect, useState } from "react";
import { Ingredient } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { COMMON_INGREDIENTS } from "@/lib/commonIngredients";
import IngredientEditor from "./IngredientEditor";
import StepsEditor from "./StepsEditor";

export interface RecipeFormValues {
  title: string;
  category: string;
  base_yield_qty: number | null;
  base_yield_unit: string;
  ingredients: Ingredient[];
  steps: string[];
  prep_time_min: number | null;
  cook_time_min: number | null;
  oven_temp_c: number | null;
  tags: string[];
  notes: string;
  is_favorite: boolean;
}

interface Props {
  initial: RecipeFormValues;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  extraTopContent?: React.ReactNode;
}

export default function RecipeForm({ initial, submitLabel, onSubmit, extraTopContent }: Props) {
  const [values, setValues] = useState<RecipeFormValues>(initial);
  const [tagInput, setTagInput] = useState(initial.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>(COMMON_INGREDIENTS);

  // Merge in every ingredient name already used across the user's own recipes,
  // so autocomplete gets more relevant to them specifically over time.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recipes")
      .select("ingredients")
      .then(({ data }) => {
        if (!data) return;
        const used = new Set<string>();
        for (const row of data as { ingredients: Ingredient[] }[]) {
          for (const ing of row.ingredients ?? []) {
            if (ing.name?.trim()) used.add(ing.name.trim());
          }
        }
        const merged = Array.from(new Set([...COMMON_INGREDIENTS, ...used])).sort();
        setNameSuggestions(merged);
      });
  }, []);

  function set<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.title.trim()) {
      setError("Give the recipe a title.");
      return;
    }

    setSaving(true);
    try {
      const tags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({ ...values, tags });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong saving this recipe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {extraTopContent}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-crust-700">Title</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none focus:ring-1 focus:ring-crust-500"
            placeholder="Brown butter chocolate chip cookies"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Category</label>
          <input
            type="text"
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
            placeholder="cookies, cakes, bread..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-crust-700">Yields</label>
            <input
              type="text"
              inputMode="decimal"
              value={values.base_yield_qty === null ? "" : String(values.base_yield_qty)}
              onChange={(e) => {
                const v = e.target.value;
                set("base_yield_qty", v === "" ? null : Number(v));
              }}
              className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
              placeholder="12"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-crust-700">Unit</label>
            <input
              type="text"
              value={values.base_yield_unit}
              onChange={(e) => set("base_yield_unit", e.target.value)}
              className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
              placeholder="cookies"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Prep (min)</label>
          <input
            type="number"
            value={values.prep_time_min ?? ""}
            onChange={(e) => set("prep_time_min", e.target.value === "" ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Bake (min)</label>
          <input
            type="number"
            value={values.cook_time_min ?? ""}
            onChange={(e) => set("cook_time_min", e.target.value === "" ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Oven (°C)</label>
          <input
            type="number"
            value={values.oven_temp_c ?? ""}
            onChange={(e) => set("oven_temp_c", e.target.value === "" ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-crust-700">Tags (comma-separated)</label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
          placeholder="chewy, brown butter, favorite"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-crust-700">Ingredients</label>
        <IngredientEditor
          ingredients={values.ingredients}
          onChange={(ingredients) => set("ingredients", ingredients)}
          nameSuggestions={nameSuggestions}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-crust-700">Steps</label>
        <StepsEditor steps={values.steps} onChange={(steps) => set("steps", steps)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-crust-700">Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
          placeholder="What did you change from the original? Any tips for next time?"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-crust-700">
        <input
          type="checkbox"
          checked={values.is_favorite}
          onChange={(e) => set("is_favorite", e.target.checked)}
          className="h-4 w-4 rounded border-crust-300"
        />
        Mark as favorite
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-crust-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
