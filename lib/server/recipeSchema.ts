// Shared between /api/parse-recipe (text) and /api/scan-recipe (image) -
// both routes ask Gemini for the exact same structured shape, so the schema
// and the ingredient/step extraction rules live here once.

export const GEMINI_MODEL = "gemini-3.5-flash-lite";

export const RECIPE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          qty: { type: "number", nullable: true },
          qtyRaw: { type: "string" },
          unit: { type: "string" },
          name: { type: "string" },
          note: { type: "string" },
        },
        required: ["name"],
      },
    },
    steps: { type: "array", items: { type: "string" } },
  },
  required: ["title", "ingredients", "steps"],
};

export const EXTRACTION_RULES = `Return JSON matching the schema exactly. Rules:
- title: your best guess at the recipe's name. If genuinely none is present, use "Untitled recipe".
- ingredients: one entry per distinct ingredient line, in the order given.
  - qty: the quantity as a decimal number (convert fractions and unicode glyphs like ¾, ½ to their decimal value, e.g. "1 ½" -> 1.5). null if no quantity was given.
  - qtyRaw: the quantity exactly as written in the source (e.g. "1 1/2", "¾"). Empty string if none.
  - unit: a normalized unit (cup, tbsp, tsp, g, kg, ml, l, oz, lb, pinch, clove, whole, large, medium, small, stick, can, packet, slice) if one is present, otherwise empty string. Do not invent a unit that isn't there.
  - name: the clean ingredient name only - no bullets, no quantity, no unit, no parenthetical weight equivalents.
  - note: anything else useful (a gram/ml equivalent that was in parentheses, "packed", "chopped", "room temperature", a brand). Empty string if nothing.
- steps: an ordered list of instruction sentences, stripped of leading numbering ("1.", "2)"). If no instructions are present at all, return an empty array - do not invent steps.
- Translate all ingredient names and steps into English, regardless of the source language. Use common English culinary terms (e.g. "gula" -> "sugar", "telur" -> "egg", "tepung terigu" -> "all-purpose flour"). Keep qtyRaw as written in the source (numbers/fractions don't need translating).`;
