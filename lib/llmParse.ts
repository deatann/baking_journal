// Calls the server-side /api/parse-recipe route (Gemini Flash-Lite) to turn
// raw recipe text into structured data. Throws on any failure - callers
// should catch and fall back to the local heuristic parser in
// lib/parseRecipeText.ts, which has no external dependency.

import { ParsedRecipe } from "./parseRecipeText";

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `llm-${Date.now()}-${idCounter}`;
}

interface RawIngredient {
  qty?: number | null;
  qtyRaw?: string;
  unit?: string;
  name?: string;
  note?: string;
}

interface RawParsed {
  title?: string;
  ingredients?: RawIngredient[];
  steps?: string[];
  bakeTimeMin?: number | null;
  ovenTempC?: number | null;
  error?: string;
}

// Defensive cleanup: the model is asked for whole minutes / sensible degrees,
// but anything outside a plausible range is dropped rather than trusted.
function cleanBakeTime(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n >= 1 && n <= 720 ? n : null;
}

function cleanOvenTemp(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const n = Math.round(v);
  return n >= 50 && n <= 400 ? n : null;
}

function shapeResult(data: RawParsed): ParsedRecipe {
  if (!Array.isArray(data.ingredients)) {
    throw new Error("AI parser returned an unexpected shape.");
  }
  return {
    title: (data.title || "").trim() || "Untitled recipe",
    ingredients: data.ingredients.map((ing) => ({
      id: nextId(),
      name: (ing.name || "").trim(),
      qty: typeof ing.qty === "number" && Number.isFinite(ing.qty) ? ing.qty : null,
      qtyRaw: ing.qtyRaw || "",
      unit: ing.unit || "",
      note: ing.note || "",
    })),
    steps: (data.steps || []).map((s) => s.trim()).filter(Boolean),
    unparsedLines: [],
    bakeTimeMin: cleanBakeTime(data.bakeTimeMin),
    ovenTempC: cleanOvenTemp(data.ovenTempC),
  };
}

export interface ImageInput {
  base64: string;
  mimeType: string;
}

/** Pass 2+ images (e.g. several screenshots of one long caption) to have them
 * merged into a single recipe in one call, in the order given. */
export async function parseImagesWithLLM(images: ImageInput[]): Promise<ParsedRecipe> {
  const res = await fetch("/api/scan-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: images.map((img) => ({ data: img.base64, mimeType: img.mimeType })),
    }),
  });

  const data: RawParsed = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `AI scan request failed (${res.status}).`);
  }
  return shapeResult(data);
}

export async function parseWithLLM(text: string): Promise<ParsedRecipe> {
  const res = await fetch("/api/parse-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data: RawParsed = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `AI parser request failed (${res.status}).`);
  }
  return shapeResult(data);
}
