// Volume<->weight conversion depends on an ingredient's density, which is
// NOT a fixed physical constant for baking purposes - it depends on how the
// ingredient was measured (scooped vs. spooned-and-leveled vs. sifted,
// packed vs. loose). These defaults are standardized-method estimates
// (roughly the King Arthur Baking / USDA "spoon into cup, level off"
// convention). Treat "reliable" as usually within ~3%, "moderate" within
// ~10%, and "low" as "could easily be off by 15-25% - weigh it yourself
// once and save your own number."

export type Confidence = "reliable" | "moderate" | "low";

export interface DensityEntry {
  gramsPerCup: number;
  confidence: Confidence;
}

// Keys are matched as whole words against the ingredient name (see
// lookupDefaultDensity below), longest/most-specific match wins - so
// "cake flour" matches its own entry rather than the generic "flour" one.
export const DEFAULT_DENSITIES: Record<string, DensityEntry> = {
  water: { gramsPerCup: 236, confidence: "reliable" },
  milk: { gramsPerCup: 245, confidence: "reliable" },
  buttermilk: { gramsPerCup: 245, confidence: "reliable" },
  cream: { gramsPerCup: 240, confidence: "reliable" },
  "vegetable oil": { gramsPerCup: 218, confidence: "reliable" },
  "olive oil": { gramsPerCup: 216, confidence: "reliable" },
  oil: { gramsPerCup: 218, confidence: "reliable" },
  butter: { gramsPerCup: 227, confidence: "reliable" },
  honey: { gramsPerCup: 340, confidence: "moderate" },
  "maple syrup": { gramsPerCup: 322, confidence: "moderate" },
  "granulated sugar": { gramsPerCup: 200, confidence: "moderate" },
  sugar: { gramsPerCup: 200, confidence: "moderate" },
  "caster sugar": { gramsPerCup: 200, confidence: "moderate" },
  "brown sugar": { gramsPerCup: 220, confidence: "low" }, // assumes packed
  "powdered sugar": { gramsPerCup: 120, confidence: "low" },
  "icing sugar": { gramsPerCup: 120, confidence: "low" },
  "all-purpose flour": { gramsPerCup: 125, confidence: "low" },
  "all purpose flour": { gramsPerCup: 125, confidence: "low" },
  "plain flour": { gramsPerCup: 125, confidence: "low" },
  "bread flour": { gramsPerCup: 130, confidence: "low" },
  "cake flour": { gramsPerCup: 114, confidence: "low" },
  "whole wheat flour": { gramsPerCup: 120, confidence: "low" },
  flour: { gramsPerCup: 125, confidence: "low" },
  "cocoa powder": { gramsPerCup: 84, confidence: "low" },
  "rolled oats": { gramsPerCup: 90, confidence: "low" },
  oats: { gramsPerCup: 90, confidence: "low" },
  "shredded coconut": { gramsPerCup: 85, confidence: "low" },
  "desiccated coconut": { gramsPerCup: 85, confidence: "low" },
  salt: { gramsPerCup: 273, confidence: "low" }, // varies a lot by salt type
  "baking soda": { gramsPerCup: 220, confidence: "moderate" },
  "baking powder": { gramsPerCup: 192, confidence: "moderate" },
  "chocolate chips": { gramsPerCup: 175, confidence: "moderate" },
};

/** Look up a default density by matching whole words in the ingredient name. Longest key wins. */
export function lookupDefaultDensity(name: string): DensityEntry | null {
  const normalized = name.trim().toLowerCase();
  let best: { key: string; entry: DensityEntry } | null = null;

  for (const [key, entry] of Object.entries(DEFAULT_DENSITIES)) {
    const pattern = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (pattern.test(normalized)) {
      if (!best || key.length > best.key.length) best = { key, entry };
    }
  }

  return best?.entry ?? null;
}

/** Normalize an ingredient name into the key used for a user's saved (learned) density. */
export function densityKey(name: string): string {
  return name.trim().toLowerCase();
}
