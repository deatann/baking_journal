"use client";

import { useEffect, useState } from "react";
import { Ingredient } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { COMMON_INGREDIENTS } from "@/lib/commonIngredients";
import { DEFAULT_CATEGORIES } from "@/lib/categoryStyle";
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
}

interface Props {
  initial: RecipeFormValues;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  extraTopContent?: React.ReactNode;
}

const normTag = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ");

export default function RecipeForm({ initial, submitLabel, onSubmit, extraTopContent }: Props) {
  const [values, setValues] = useState<RecipeFormValues>({
    ...initial,
    tags: initial.tags.map(normTag).filter(Boolean),
  });
  const [tagDraft, setTagDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>(COMMON_INGREDIENTS);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Suggestions come from the signed-in user's own recipes so autocomplete
  // and tag vocabulary stay relevant and don't drift.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("recipes")
        .select("ingredients, tags, category")
        .eq("user_id", user.id);
      if (!data) return;
      const names = new Set<string>();
      const tags = new Set<string>();
      const cats = new Set<string>(DEFAULT_CATEGORIES);
      for (const row of data as { ingredients: Ingredient[]; tags: string[]; category: string }[]) {
        for (const ing of row.ingredients ?? []) if (ing.name?.trim()) names.add(ing.name.trim());
        for (const t of row.tags ?? []) if (normTag(t)) tags.add(normTag(t));
        if (row.category?.trim()) cats.add(row.category.trim().toLowerCase());
      }
      setNameSuggestions(Array.from(new Set([...COMMON_INGREDIENTS, ...names])).sort());
      setTagSuggestions(Array.from(tags).sort());
      setCategories(Array.from(cats).sort());
    })();
  }, []);

  function set<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function addTags(raw: string) {
    const parts = raw.split(",").map(normTag).filter(Boolean);
    if (parts.length === 0) return;
    setValues((v) => ({ ...v, tags: Array.from(new Set([...v.tags, ...parts])) }));
    setTagDraft("");
  }

  function removeTag(t: string) {
    setValues((v) => ({ ...v, tags: v.tags.filter((x) => x !== t) }));
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
      const pending = normTag(tagDraft);
      const tags = pending ? Array.from(new Set([...values.tags, pending])) : values.tags;
      await onSubmit({ ...values, tags });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong saving this recipe.");
    } finally {
      setSaving(false);
    }
  }

  const unusedSuggestions = tagSuggestions.filter((t) => !values.tags.includes(t));
  const num = (v: string) => (v === "" ? null : Number(v));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {extraTopContent}

      <div className="card space-y-4 p-4">
        <div>
          <label className="label">Title</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            className="field"
            placeholder="Brown butter chocolate chip cookies"
          />
        </div>

        <div>
          <label className="label">Category</label>
          <input
            type="text"
            list="category-suggestions"
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
            className="field"
            placeholder="cookies, cakes, bread..."
          />
          <datalist id="category-suggestions">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Yields</label>
            <input
              type="text"
              inputMode="decimal"
              value={values.base_yield_qty === null ? "" : String(values.base_yield_qty)}
              onChange={(e) => {
                const n = num(e.target.value);
                set("base_yield_qty", n === null || Number.isFinite(n) ? n : values.base_yield_qty);
              }}
              className="field"
              placeholder="12"
            />
          </div>
          <div>
            <label className="label">Unit</label>
            <input
              type="text"
              value={values.base_yield_unit}
              onChange={(e) => set("base_yield_unit", e.target.value)}
              className="field"
              placeholder="cookies"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Prep (min)</label>
            <input
              type="number"
              inputMode="numeric"
              value={values.prep_time_min ?? ""}
              onChange={(e) => set("prep_time_min", num(e.target.value))}
              className="field"
            />
          </div>
          <div>
            <label className="label">Bake (min)</label>
            <input
              type="number"
              inputMode="numeric"
              value={values.cook_time_min ?? ""}
              onChange={(e) => set("cook_time_min", num(e.target.value))}
              className="field"
            />
          </div>
          <div>
            <label className="label">Oven (°C)</label>
            <input
              type="number"
              inputMode="numeric"
              value={values.oven_temp_c ?? ""}
              onChange={(e) => set("oven_temp_c", num(e.target.value))}
              className="field"
            />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <label className="label">Tags</label>
        {values.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {values.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-ink bg-peach-100 py-0.5 pl-2.5 pr-1.5 text-xs font-bold"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  aria-label={`Remove tag ${t}`}
                  className="grid h-5 w-5 place-items-center rounded-full text-crust-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagDraft}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) addTags(v);
            else setTagDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTags(tagDraft);
            }
          }}
          onBlur={() => addTags(tagDraft)}
          className="field"
          placeholder="Type a tag, press Enter"
        />
        {unusedSuggestions.length > 0 && (
          <div className="mt-2.5">
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-crust-500">Your tags</p>
            <div className="flex flex-wrap gap-1.5">
              {unusedSuggestions.slice(0, 20).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTags(t)}
                  className="rounded-full border-[1.5px] border-crust-300 bg-white px-2.5 py-0.5 text-xs font-bold text-crust-600 active:bg-peach-100"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-4">
        <label className="label">Ingredients</label>
        <IngredientEditor
          ingredients={values.ingredients}
          onChange={(ingredients) => set("ingredients", ingredients)}
          nameSuggestions={nameSuggestions}
        />
      </div>

      <div className="card p-4">
        <label className="label">Steps</label>
        <StepsEditor steps={values.steps} onChange={(steps) => set("steps", steps)} />
      </div>

      <div className="card p-4">
        <label className="label">Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="field resize-y"
          placeholder="What did you change from the original? Any tips for next time?"
        />
      </div>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
