// Optional sections ("Cake", "Frosting", ...) for ingredients and steps.
// Storage stays backwards compatible, no migration:
//  - an ingredient carries an optional `section` label
//  - a step that starts with "## " is a section heading (e.g. "## Frosting"), not a step
import { Ingredient, newIngredientId } from "./types";

// ---------- steps ----------
export const isStepHeading = (s: string) => /^##(\s|$)/.test(s);
export const stepHeadingText = (s: string) => s.replace(/^##\s*/, "").trim();
export const makeStepHeading = (text: string) => `## ${text}`;

/** Drops blank steps, blank headings, and headings with no step under them. */
export function cleanSteps(steps: string[]): string[] {
  const out: string[] = [];
  for (const raw of steps) {
    if (isStepHeading(raw)) {
      const t = stepHeadingText(raw);
      if (t) out.push(makeStepHeading(t));
    } else if (raw.trim() !== "") {
      out.push(raw);
    }
  }
  // remove headings that have no steps after them
  return out.filter((s, i) => !isStepHeading(s) || (i + 1 < out.length && !isStepHeading(out[i + 1])));
}

export interface StepGroup {
  title: string;
  items: { text: string; index: number }[];
}

/** Groups steps under their headings. `index` is the position in the original array. */
export function groupSteps(steps: string[]): StepGroup[] {
  const groups: StepGroup[] = [];
  let cur: StepGroup = { title: "", items: [] };
  steps.forEach((s, index) => {
    if (isStepHeading(s)) {
      if (cur.items.length > 0 || cur.title) groups.push(cur);
      cur = { title: stepHeadingText(s), items: [] };
    } else {
      cur.items.push({ text: s, index });
    }
  });
  if (cur.items.length > 0 || cur.title) groups.push(cur);
  return groups;
}

// ---------- ingredients ----------
export interface IngredientGroup {
  title: string;
  items: Ingredient[];
}

export function groupIngredients(ings: Ingredient[]): IngredientGroup[] {
  const groups: IngredientGroup[] = [];
  for (const ing of ings) {
    const title = (ing.section ?? "").trim();
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(ing);
    else groups.push({ title, items: [ing] });
  }
  return groups;
}

/** Stored ingredients -> editor rows, with a header row at each section change. */
export function ingredientsToEditor(ings: Ingredient[]): Ingredient[] {
  const out: Ingredient[] = [];
  let cur = "";
  for (const ing of ings) {
    const s = (ing.section ?? "").trim();
    if (s !== cur) {
      out.push({ id: newIngredientId(), name: s || "Other", qty: null, unit: "", note: "", isHeader: true });
      cur = s;
    }
    out.push({ ...ing });
  }
  return out;
}

/** Editor rows -> stored ingredients (header rows become the `section` label on the rows below). */
export function ingredientsFromEditor(rows: Ingredient[]): Ingredient[] {
  const out: Ingredient[] = [];
  let cur = "";
  for (const row of rows) {
    if (row.isHeader) {
      cur = row.name.trim();
      continue;
    }
    if (row.name.trim() === "") continue;
    const { isHeader: _h, section: _s, ...rest } = row;
    out.push(cur ? { ...rest, section: cur } : rest);
  }
  return out;
}
