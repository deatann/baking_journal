// Playful per-category styling: an emoji and an accent color, so recipe
// cards and tags aren't all the same shade of brown. Falls back to a
// deterministic hash-based pick for categories we don't recognize, so the
// same category always gets the same color/emoji rather than a random one.

export const ACCENTS = ["berry", "sage", "mustard", "sky", "plum"] as const;
export type Accent = (typeof ACCENTS)[number];

const KNOWN: Record<string, { emoji: string; accent: Accent }> = {
  cookies: { emoji: "🍪", accent: "mustard" },
  cakes: { emoji: "🎂", accent: "berry" },
  cake: { emoji: "🎂", accent: "berry" },
  bread: { emoji: "🍞", accent: "sage" },
  pastry: { emoji: "🥐", accent: "mustard" },
  pastries: { emoji: "🥐", accent: "mustard" },
  pie: { emoji: "🥧", accent: "berry" },
  pies: { emoji: "🥧", accent: "berry" },
  muffins: { emoji: "🧁", accent: "plum" },
  cupcakes: { emoji: "🧁", accent: "plum" },
  brownies: { emoji: "🍫", accent: "plum" },
  donuts: { emoji: "🍩", accent: "sky" },
  doughnuts: { emoji: "🍩", accent: "sky" },
  pancakes: { emoji: "🥞", accent: "mustard" },
  waffles: { emoji: "🧇", accent: "mustard" },
  uncategorized: { emoji: "🍽️", accent: "sage" },
};

function hashAccent(name: string): Accent {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

export function categoryStyle(category: string | null | undefined): { emoji: string; accent: Accent } {
  const key = (category ?? "").trim().toLowerCase();
  if (KNOWN[key]) return KNOWN[key];
  return { emoji: "🍽️", accent: hashAccent(key || "recipe") };
}

// Tailwind can't see dynamically-built class strings, so every accent's
// classes are spelled out here in full and looked up by name.
export const ACCENT_CLASSES: Record<Accent, { strip: string; badge: string; text: string }> = {
  berry: { strip: "bg-berry-400", badge: "bg-berry-100 text-berry-700", text: "text-berry-600" },
  sage: { strip: "bg-sage-400", badge: "bg-sage-100 text-sage-700", text: "text-sage-600" },
  mustard: { strip: "bg-mustard-400", badge: "bg-mustard-100 text-mustard-700", text: "text-mustard-600" },
  sky: { strip: "bg-sky-400", badge: "bg-sky-100 text-sky-700", text: "text-sky-600" },
  plum: { strip: "bg-plum-400", badge: "bg-plum-100 text-plum-700", text: "text-plum-600" },
};

export const DEFAULT_CATEGORIES = [
  "bread", "brownies", "cakes", "cookies", "cupcakes", "donuts", "muffins", "pancakes", "pastry", "pie", "waffles",
];
