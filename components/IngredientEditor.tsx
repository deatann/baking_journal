"use client";

import { Ingredient, newIngredientId } from "@/lib/types";

const UNIT_SUGGESTIONS = [
  "cup", "tbsp", "tsp", "g", "kg", "ml", "l", "oz", "lb",
  "stick", "pinch", "clove", "whole", "large", "medium", "small", "can", "packet",
];

interface Props {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
  /** Names offered while typing: common baking ingredients plus ones already used. */
  nameSuggestions?: string[];
}

export default function IngredientEditor({ ingredients, onChange, nameSuggestions = [] }: Props) {
  function updateRow(id: string, patch: Partial<Ingredient>) {
    onChange(ingredients.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([...ingredients, { id: newIngredientId(), name: "", qty: null, unit: "", note: "" }]);
  }

  function removeRow(id: string) {
    onChange(ingredients.filter((row) => row.id !== id));
  }

  return (
    <div className="space-y-2.5">
      {ingredients.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[84px_1fr_36px] gap-2 rounded-2xl border-2 border-crust-200 p-2.5 md:grid-cols-[84px_110px_1fr_1fr_36px] md:border-0 md:p-0"
        >
          <input
            type="text"
            inputMode="decimal"
            placeholder="qty"
            value={row.qty === null ? "" : String(row.qty)}
            onChange={(e) => {
              const v = e.target.value;
              const n = v === "" ? null : Number(v);
              updateRow(row.id, { qty: v === "" || Number.isFinite(n as number) ? n : row.qty });
            }}
            className="field !px-3"
          />
          <input
            type="text"
            placeholder="unit"
            value={row.unit}
            onChange={(e) => updateRow(row.id, { unit: e.target.value })}
            list="unit-suggestions"
            className="field !px-3"
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            className="grid h-12 w-9 place-items-center justify-self-end rounded-xl text-lg text-crust-400 active:bg-red-50 active:text-red-500 md:order-last"
            aria-label="Remove ingredient"
          >
            ✕
          </button>
          <input
            type="text"
            placeholder="ingredient name"
            value={row.name}
            onChange={(e) => updateRow(row.id, { name: e.target.value })}
            list="ingredient-name-suggestions"
            className="field col-span-3 !px-3 md:col-span-1"
          />
          <input
            type="text"
            placeholder="note (optional)"
            value={row.note}
            onChange={(e) => updateRow(row.id, { note: e.target.value })}
            className="field col-span-3 !px-3 md:col-span-1"
          />
        </div>
      ))}

      <button type="button" onClick={addRow} className="dashed-btn">
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
