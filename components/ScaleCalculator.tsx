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
  const [showConversions, setShowConversions] = useState(false);
  const [ticked, setTicked] = useState<Set<string>>(new Set());

  function applyFactor(f: number) {
    if (!Number.isFinite(f) || f <= 0) return;
    setFactor(f);
    setCustomInput(String(f));
    onScaleChange?.(f);
  }

  function toggleTick(id: string) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SCALE_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => applyFactor(preset)}
            className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold ${
              factor === preset
                ? "border-line bg-butter-300 text-ink"
                : "border-crust-200 bg-white text-crust-600 active:bg-peach-100"
            }`}
          >
            ×{preset}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-crust-500">×</span>
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
            aria-label="Custom scale"
            className="w-16 rounded-xl border-2 border-crust-200 bg-white px-2 py-1 text-base font-bold focus:border-line focus:outline-none"
          />
        </div>
      </div>

      <label className="mb-3 flex items-center gap-2 text-[13px] font-bold text-crust-600">
        <input
          type="checkbox"
          checked={showConversions}
          onChange={(e) => setShowConversions(e.target.checked)}
          className="h-4 w-4 accent-[#3b2a22]"
        />
        Show cup / metric conversions
      </label>

      {baseYieldQty && (
        <p className="mb-3 text-sm font-bold text-crust-500">
          Yields {formatQty(scaleQty(baseYieldQty, factor))} {baseYieldUnit} at ×{factor}
        </p>
      )}

      <ul className="overflow-hidden rounded-2xl border-[1.5px] border-line bg-white">
        {ingredients.map((ing, idx) => {
          const scaledQty = scaleQty(ing.qty, factor);
          const done = ticked.has(ing.id);
          return (
            <li
              key={ing.id}
              onClick={() => toggleTick(ing.id)}
              className={`grid cursor-pointer grid-cols-[24px_92px_1fr] items-baseline gap-x-2.5 px-3 py-2.5 text-[15px] ${
                idx > 0 ? "border-t border-crust-200" : ""
              } ${done ? "bg-crust-50" : ""}`}
            >
              <span
                className={`grid h-5 w-5 translate-y-1 place-items-center rounded-md border-[1.5px] border-line text-[12px] font-extrabold ${
                  done ? "bg-sage-400" : "bg-white"
                }`}
                aria-hidden
              >
                {done ? "✓" : ""}
              </span>
              <span className={`font-extrabold ${done ? "text-crust-400 line-through" : "text-ink"}`}>
                {formatQty(scaledQty)} <span className="font-bold text-crust-500">{ing.unit}</span>
              </span>
              <span className={`min-w-0 ${done ? "text-crust-400 line-through" : "text-ink"}`}>
                {ing.name}
                {ing.note && <span className="ml-1.5 text-[13px] text-crust-400">{ing.note}</span>}
              </span>
              {showConversions && (
                <div className="col-start-3" onClick={(e) => e.stopPropagation()}>
                  <ConversionLine
                    name={ing.name}
                    qty={scaledQty}
                    unit={ing.unit}
                    userDensities={userDensities}
                    onSaveDensity={onSaveDensity}
                  />
                </div>
              )}
            </li>
          );
        })}
        {ingredients.length === 0 && (
          <li className="px-3 py-2.5 text-sm text-crust-400">No ingredients listed.</li>
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
          className="mt-0.5 text-xs text-crust-400 underline decoration-dotted hover:text-crust-600"
        >
          no conversion yet — weigh 1 cup and set it
        </button>
      );
    }
    return (
      <form
        className="mt-1 flex items-center gap-1.5"
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
    <div className="mt-0.5 flex items-center gap-1.5">
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
