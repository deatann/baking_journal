import { ParsedRecipe } from "./parseRecipeText";
import { newIngredientId } from "./types";

const DRAFT_KEY = "scannedRecipeDraft";

/** Build the sessionStorage draft the /recipes/new?fromScan=1 page reads on load. */
export function saveRecipeDraft(parsed: ParsedRecipe, sourceImagePath: string | null) {
  const draft = {
    values: {
      title: parsed.title,
      category: "",
      base_yield_qty: null,
      base_yield_unit: "",
      ingredients:
        parsed.ingredients.length > 0
          ? parsed.ingredients
          : [{ id: newIngredientId(), name: "", qty: null, unit: "", note: "" }],
      steps: parsed.steps.length > 0 ? parsed.steps : [""],
      prep_time_min: null,
      cook_time_min: null,
      oven_temp_c: null,
      tags: [],
      notes:
        parsed.unparsedLines.length > 0
          ? `Lines the parser couldn't place - check these:\n${parsed.unparsedLines.join("\n")}`
          : "",
      is_favorite: false,
    },
    sourceImagePath,
  };
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readRecipeDraft(): { values: any; sourceImagePath: string | null } | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRecipeDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}
