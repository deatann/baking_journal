"use client";

import { Ingredient, newIngredientId } from "@/lib/types";

const UNIT_SUGGESTIONS = [
  "cup", "tbsp", "tsp", "g", "kg", "ml", "l", "oz", "lb",
  "stick", "pinch", "clove", "whole", "large", "medium", "small", "can", "packet",
];

interface Props {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
  /** Ingredient names to offer as you type - common baking ingredients plus
   * anything you've already used across your own saved recipes. */
  nameSuggestions?: string[];
}

export default function IngredientEditor({ ingredients, onChange, nameSuggestions = [] }: Props) {
  function updateRow(id: string, patch: Partial<Ingredient>) {
    onChange(ingredients.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([
      ...ingredients,
      { id: newIngredientId(), name: "", qty: null, unit: "", note: "" },
    ]);
  }

  function removeRow(id: string) {
    onChange(ingredients.filter((row) => row.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[80px_100px_1fr_1fr_32px] gap-2 px-1 text-xs font-medium text-crust-500 sm:grid">
        <span>Qty</span>
        <span>Unit</span>
        <span>Ingredient</span>
        <span>Note</span>
        <span></span>
      </div>

      {ingredients.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-2 gap-2 rounded-lg border border-crust-100 p-2 sm:grid-cols-[80px_100px_1fr_1fr_32px] sm:border-0 sm:p-0"
        >
          <input
            type="text"
            inputMode="decimal"
            placeholder="qty"
            value={row.qty === null ? "" : String(row.qty)}
            onChange={(e) => {
              const v = e.target.value;
              const n = v === "" ? null : Number(v);
              updateRow(row.id, { qty: Number.isFinite(n as number) || v === "" ? n : row.qty });
            }}
            className="rounded-md border border-crust-200 px-2 py-1.5 text-sm focus:border-crust-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="unit"
            value={row.unit}
            onChange={(e) => updateRow(row.id, { unit: e.target.value })}
            list="unit-suggestions"
            className="rounded-md border border-crust-200 px-2 py-1.5 text-sm focus:border-crust-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="ingredient name"
            value={row.name}
            onChange={(e) => updateRow(row.id, { name: e.target.value })}
            list="ingredient-name-suggestions"
            className="col-span-2 rounded-md border border-crust-200 px-2 py-1.5 text-sm focus:border-crust-500 focus:outline-none sm:col-span-1"
          />
          <input
            type="text"
            placeholder="note (optional)"
            value={row.note}
            onChange={(e) => updateRow(row.id, { note: e.target.value })}
            className="rounded-md border border-crust-200 px-2 py-1.5 text-sm focus:border-crust-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            className="justify-self-end rounded-md px-2 py-1.5 text-crust-400 hover:bg-red-50 hover:text-red-500 sm:justify-self-auto"
            aria-label="Remove ingredient"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="rounded-lg border border-dashed border-crust-300 px-3 py-1.5 text-sm text-crust-600 hover:bg-crust-50"
      >
        + Add ingredient
      </button>

      <datalist id="ingredient-name-suggestions">
        {nameSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="unit-suggestions">
        {UNIT_SUGGESTIONS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
    </div>
  );
}
