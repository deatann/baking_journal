"use client";

import { useState } from "react";
import { Ingredient, newIngredientId } from "@/lib/types";
import SectionStrip from "./SectionStrip";

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

  const [placing, setPlacing] = useState(false);

  function insertHeaderAt(index: number) {
    const header: Ingredient = { id: newIngredientId(), name: "", qty: null, unit: "", note: "", isHeader: true };
    const next = [...ingredients];
    next.splice(index, 0, header);
    onChange(next);
    setPlacing(false);
  }

  return (
    <div className="space-y-2.5">
      {placing && <SectionStrip onClick={() => insertHeaderAt(0)} />}
      {ingredients.map((row, rowIdx) => (
        <div key={row.id} className="space-y-2.5">
        {row.isHeader ? (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-butter-300 bg-butter-100 p-2">
            <span className="pl-1 text-[11px] font-extrabold uppercase tracking-widest text-crust-500">Section</span>
            <input
              type="text"
              autoFocus={row.name === ""}
              placeholder="e.g. Cake, Frosting, Filling"
              value={row.name}
              onChange={(e) => updateRow(row.id, { name: e.target.value })}
              className="field !h-10 min-w-0 flex-1 !px-3 font-extrabold"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="grid h-10 w-9 shrink-0 place-items-center rounded-xl text-lg text-crust-400 active:bg-red-50 active:text-red-500"
              aria-label="Remove section heading"
            >
              ✕
            </button>
          </div>
        ) : (
        <div
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
        )}
        {placing && rowIdx < ingredients.length - 1 && <SectionStrip onClick={() => insertHeaderAt(rowIdx + 1)} />}
        </div>
      ))}
      {placing && <SectionStrip onClick={() => insertHeaderAt(ingredients.length)} />}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addRow} className="dashed-btn flex-1">
          + Add ingredient
        </button>
        <button type="button" onClick={() => setPlacing((v) => !v)} className="dashed-btn flex-1">
          {placing ? "Cancel" : "+ Add section"}
        </button>
      </div>
      {placing && (
        <p className="text-xs text-crust-500">Tap where the new section should start. Sections are optional.</p>
      )}

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
