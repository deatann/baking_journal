import { unitCategory, toBase, ML_PER_CUP } from "./units";
import { lookupDefaultDensity, densityKey, Confidence } from "./density";
import { formatQty } from "./scale";

export type ConversionResult =
  | { kind: "none" } // unit isn't volume or weight - nothing to convert
  | { kind: "unknown"; ingredientKey: string } // volume/weight unit, but no density known
  | { kind: "converted"; text: string; confidence: Confidence; source: "default" | "user" };

/**
 * Convert a (scaled) qty+unit for a named ingredient into the OTHER system
 * (volume -> grams, weight -> cups), using the user's learned densities
 * first and falling back to the built-in estimate table.
 */
export function convertIngredient(
  name: string,
  qty: number | null,
  unit: string,
  userDensities: Record<string, number>,
): ConversionResult {
  if (qty === null || !unit) return { kind: "none" };

  const category = unitCategory(unit);
  if (category === "other") return { kind: "none" };

  const key = densityKey(name);
  const userGramsPerCup = userDensities[key];
  const defaultEntry = lookupDefaultDensity(name);

  const gramsPerCup = userGramsPerCup ?? defaultEntry?.gramsPerCup;
  if (gramsPerCup === undefined) return { kind: "unknown", ingredientKey: key };

  const confidence: Confidence = userGramsPerCup !== undefined ? "reliable" : defaultEntry!.confidence;
  const source: "default" | "user" = userGramsPerCup !== undefined ? "user" : "default";

  const base = toBase(qty, unit);
  if (!base) return { kind: "none" };

  if (category === "volume") {
    // volume -> grams: (ml / ml-per-cup) * grams-per-cup
    const grams = (base.value / ML_PER_CUP) * gramsPerCup;
    const rounded = grams < 10 ? Math.round(grams * 10) / 10 : Math.round(grams);
    return { kind: "converted", text: `${rounded}g`, confidence, source };
  }

  // weight -> cups: (grams / grams-per-cup)
  const cups = base.value / gramsPerCup;
  return { kind: "converted", text: `${formatQty(cups)} cup${cups !== 1 ? "s" : ""}`, confidence, source };
}
