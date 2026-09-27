// Unit conversion helpers. Two closed categories - volume and weight - plus
// everything else (count, "pinch", "whole", ...) which never converts.

export type UnitCategory = "volume" | "weight" | "other";

const VOLUME_TO_ML: Record<string, number> = {
  cup: 236.588, cups: 236.588, c: 236.588,
  tbsp: 14.7868, tablespoon: 14.7868, tablespoons: 14.7868,
  tsp: 4.92892, teaspoon: 4.92892, teaspoons: 4.92892,
  "fl oz": 29.5735, "fl. oz": 29.5735, "floz": 29.5735,
  ml: 1, milliliter: 1, milliliters: 1, millilitre: 1, millilitres: 1,
  l: 1000, liter: 1000, liters: 1000, litre: 1000, litres: 1000,
};

const WEIGHT_TO_G: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
};

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

export function unitCategory(unit: string): UnitCategory {
  const u = normalizeUnit(unit);
  if (u in VOLUME_TO_ML) return "volume";
  if (u in WEIGHT_TO_G) return "weight";
  return "other";
}

/** Convert a quantity to its base unit: ml for volume, g for weight. Null if not convertible. */
export function toBase(qty: number, unit: string): { value: number; category: UnitCategory } | null {
  const u = normalizeUnit(unit);
  if (u in VOLUME_TO_ML) return { value: qty * VOLUME_TO_ML[u], category: "volume" };
  if (u in WEIGHT_TO_G) return { value: qty * WEIGHT_TO_G[u], category: "weight" };
  return null;
}

export const ML_PER_CUP = VOLUME_TO_ML.cup;
export const G_PER_CUP_WATER = 236.588; // reference only, density-adjusted elsewhere
