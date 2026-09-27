"use client";

import { useState } from "react";
import { Ingredient } from "@/lib/types";
import { formatQty, scaleQty, SCALE_PRESETS, parseQty } from "@/lib/scale";
import { convertIngredient } from "@/lib/convert";
import { densityKey } from "@/lib/density";

interface Props {
  ingredients: Ingredient[];
  baseYieldQty: number | null;
  baseYieldUnit: string | null;
  onScaleChange?: (factor: number) => void;
  userDensities: Record<string, number>;
  onSaveDensity: (ingredientKey: string, gramsPerCup: number) => Promise<void>;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  reliable: "text-green-700 bg-green-50",
  moderate: "text-amber-700 bg-amber-50",
  low: "text-orange-700 bg-orange-50",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  reliable: "reliable",
  moderate: "approximate",
  low: "rough estimate",
};

export default function ScaleCalculator({
  ingredients,
  baseYieldQty,
  baseYieldUnit,
  onScaleChange,
  userDensities,
  onSaveDensity,
}: Props) {
  const [factor, setFactor] = useState(1);
  const [customInput, setCustomInput] = useState("1");
  const [showConversions, setShowConversions] = useState(true);

  function applyFactor(f: number) {
    if (!Number.isFinite(f) || f <= 0) return;
    setFactor(f);
    setCustomInput(String(f));
    onScaleChange?.(f);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {SCALE_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => applyFactor(preset)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              factor === preset
                ? "bg-crust-600 text-white"
                : "bg-crust-100 text-crust-700 hover:bg-crust-200"
            }`}
          >
            ×{preset}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-sm text-crust-500">×</span>
          <input
            type="text"
            inputMode="decimal"
            value={customInput}
            onChange={(e) => {
              setCustomInput(e.target.value);
              const n = parseQty(e.target.value);
              if (n && n > 0) {
                setFactor(n);
                onScaleChange?.(n);
              }
            }}
            className="w-16 rounded-md border border-crust-200 px-2 py-1 text-sm focus:border-crust-500 focus:outline-none"
          />
        </div>

        <label className="ml-auto flex items-center gap-1.5 text-xs text-crust-500">
          <input
            type="checkbox"
            checked={showConversions}
            onChange={(e) => setShowConversions(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-crust-300"
          />
          cup/metric conversions
        </label>
      </div>

      {baseYieldQty && (
        <p className="mb-3 text-sm text-crust-500">
          Yields {formatQty(scaleQty(baseYieldQty, factor))} {baseYieldUnit} at ×{factor}
        </p>
      )}

      <ul className="divide-y divide-crust-100 rounded-lg border border-crust-200">
        {ingredients.map((ing) => {
          const scaledQty = scaleQty(ing.qty, factor);
          return (
            <li key={ing.id} className="px-3 py-2 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="w-20 shrink-0 text-right font-medium text-crust-800">
                  {formatQty(scaledQty)}
                </span>
                <span className="w-16 shrink-0 text-crust-500">{ing.unit}</span>
                <span className="text-crust-800">{ing.name}</span>
                {ing.note && <span className="text-crust-400">({ing.note})</span>}
              </div>
              {showConversions && (
                <ConversionLine
                  name={ing.name}
                  qty={scaledQty}
                  unit={ing.unit}
                  userDensities={userDensities}
                  onSaveDensity={onSaveDensity}
                />
              )}
            </li>
          );
        })}
        {ingredients.length === 0 && (
          <li className="px-3 py-2 text-sm text-crust-400">No ingredients listed.</li>
        )}
      </ul>
    </div>
  );
}

function ConversionLine({
  name,
  qty,
  unit,
  userDensities,
  onSaveDensity,
}: {
  name: string;
  qty: number | null;
  unit: string;
  userDensities: Record<string, number>;
  onSaveDensity: (ingredientKey: string, gramsPerCup: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  if (qty === null || !unit) return null;

  const result = convertIngredient(name, qty, unit, userDensities);

  if (result.kind === "none") return null;

  if (result.kind === "unknown") {
    if (!editing) {
      return (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-[88px] mt-0.5 text-xs text-crust-400 underline decoration-dotted hover:text-crust-600"
        >
          no conversion yet — weigh 1 cup and set it
        </button>
      );
    }
    return (
      <form
        className="ml-[88px] mt-1 flex items-center gap-1.5"
        onSubmit={async (e) => {
          e.preventDefault();
          const grams = Number(input);
          if (!Number.isFinite(grams) || grams <= 0) return;
          setSaving(true);
          await onSaveDensity(result.ingredientKey, grams);
          setSaving(false);
          setEditing(false);
        }}
      >
        <span className="text-xs text-crust-500">1 cup {name} =</span>
        <input
          autoFocus
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-16 rounded border border-crust-200 px-1.5 py-0.5 text-xs"
          placeholder="grams"
        />
        <span className="text-xs text-crust-500">g</span>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-crust-600 px-2 py-0.5 text-xs text-white hover:bg-crust-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-crust-400 hover:text-crust-600"
        >
          cancel
        </button>
      </form>
    );
  }

  return (
    <div className="ml-[88px] mt-0.5 flex items-center gap-1.5">
      <span className={`rounded px-1.5 py-0.5 text-xs ${CONFIDENCE_STYLE[result.confidence]}`}>
        ≈ {result.text}
      </span>
      <span className="text-[11px] text-crust-400">
        {result.source === "user" ? "your measurement" : CONFIDENCE_LABEL[result.confidence]}
      </span>
      {result.source === "default" && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] text-crust-400 underline decoration-dotted hover:text-crust-600"
        >
          correct it
        </button>
      )}
      {editing && (
        <form
          className="flex items-center gap-1.5"
          onSubmit={async (e) => {
            e.preventDefault();
            const grams = Number(input);
            if (!Number.isFinite(grams) || grams <= 0) return;
            setSaving(true);
            await onSaveDensity(densityKey(name), grams);
            setSaving(false);
            setEditing(false);
          }}
        >
          <span className="text-xs text-crust-500">1 cup {name} =</span>
          <input
            autoFocus
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-16 rounded border border-crust-200 px-1.5 py-0.5 text-xs"
            placeholder="grams"
          />
          <span className="text-xs text-crust-500">g</span>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-crust-600 px-2 py-0.5 text-xs text-white hover:bg-crust-700"
          >
            Save
          </button>
        </form>
      )}
    </div>
  );
}
