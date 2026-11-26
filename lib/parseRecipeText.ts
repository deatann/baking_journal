// Turns raw OCR text (from Google Vision, which only returns text - no
// structure) into a best-effort guess at title / ingredients / steps.
// This is intentionally conservative: it's a starting point for the review
// form, not a final answer. Expect to correct it, especially units and
// anything Vision misread from a stylized recipe-card font.

export interface ParsedIngredient {
  id: string;
  name: string;
  qty: number | null;
  qtyRaw: string; // what was actually typed/read, e.g. "1 1/2"
  unit: string;
  note: string;
  /** Component the ingredient belongs to ("Frosting"), when the source grouped them. */
  section?: string;
}

export interface ParsedRecipe {
  title: string;
  ingredients: ParsedIngredient[];
  steps: string[];
  unparsedLines: string[]; // anything the parser wasn't confident about
  /** Total oven time in minutes, when the AI parser found one (local parser leaves this empty). */
  bakeTimeMin?: number | null;
  /** Oven temperature in C, when the AI parser found one (local parser leaves this empty). */
  ovenTempC?: number | null;
}

const SECTION_HEADERS = {
  ingredients: /^ingredients?\b/i,
  steps: /^(instructions?|directions?|method|steps?|preparation)\b/i,
};

const UNITS = [
  "cups?", "tbsp", "tablespoons?", "tsp", "teaspoons?", "g", "grams?", "kg",
  "ml", "l", "litres?", "liters?", "oz", "ounces?", "lb", "lbs", "pounds?",
  "sticks?", "pinch(?:es)?", "cloves?", "cans?", "packets?", "slices?",
  "whole", "large", "medium", "small",
];
const UNIT_PATTERN = new RegExp(`^(${UNITS.join("|")})\\b`, "i");

// A line "looks like" an ingredient if it starts with a number, a fraction,
// or a unicode fraction glyph (½, ¾, ...). The first branch handles a mixed
// whole number + unicode fraction ("1 ½", "1½"); the second handles a plain
// number, a unicode fraction alone, or an ASCII fraction ("1 1/2", "3/4").
const QTY_LEAD =
  /^(\d+\s?[½¼¾⅓⅔⅛⅜⅝⅞]|[\d½¼¾⅓⅔⅛⅜⅝⅞]+(?:[\s./]\d+)?)\s*/;

// Recipes pasted from Notion, docs, or websites almost always use bullets or
// checkboxes ("- ", "• ", "- [ ] ") instead of plain lines. Strip those before
// looking for a quantity, otherwise the whole line (bullet included) gets
// treated as one unparseable blob instead of qty + unit + name.
const BULLET_LEAD = /^(?:[-*•‣▪●○]\s*|\[[ xX]?\]\s*)+/;

function stripBulletPrefix(line: string): string {
  return line.replace(BULLET_LEAD, "").trim();
}


// ---- section ("component") headings, e.g. "For the frosting:", "Filling", "Glaze" ----
const COMPONENT_WORDS =
  /^(?:the\s+)?(frosting|icing|filling|glaze|topping|toppings|ganache|crust|base|sauce|dough|batter|cake|syrup|cream|streusel|crumble|meringue|caramel|custard|sponge|assembly|to assemble|decoration|garnish)$/i;

function titleCase(t: string) {
  const s = t.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Returns the section name if the line looks like a component heading, else null. */
function headingText(line: string): string | null {
  const cleaned = stripBulletPrefix(line).replace(/^#+\s*/, "").trim();
  if (!cleaned || cleaned.length > 50 || QTY_LEAD.test(cleaned) || /[.!?]$/.test(cleaned)) return null;
  const words = cleaned.replace(/[:：]\s*$/, "").trim().split(/\s+/);
  if (words.length > 5) return null;
  const bare = words.join(" ");
  const endsColon = /[:：]\s*$/.test(cleaned);
  const forThe = /^for\s+(the\s+)?\S+/i.test(bare);
  const known = COMPONENT_WORDS.test(bare);
  if (!(endsColon || forThe || known)) return null;
  return titleCase(bare.replace(/^for\s+(the\s+)?/i, "").replace(/^the\s+/i, ""));
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `parsed-${Date.now()}-${idCounter}`;
}

function splitQtyUnitName(line: string): ParsedIngredient {
  let rest = line.trim();
  let qtyRaw = "";
  let qty: number | null = null;

  const qtyMatch = rest.match(QTY_LEAD);
  if (qtyMatch) {
    qtyRaw = qtyMatch[1];
    rest = rest.slice(qtyMatch[0].length).trim();
    qty = parseLooseNumber(qtyRaw);
  }

  let unit = "";
  const unitMatch = rest.match(UNIT_PATTERN);
  if (unitMatch) {
    unit = unitMatch[1];
    rest = rest.slice(unitMatch[0].length).trim();
  }

  // A parenthetical right after the qty/unit is usually a weight equivalent
  // ("9 tablespoon (128 g) unsalted butter") - pull it into the note instead
  // of leaving it stuck in front of the ingredient name.
  let parenNote = "";
  const leadingParen = rest.match(/^\(([^)]+)\)\s*/);
  if (leadingParen) {
    parenNote = leadingParen[1].trim();
    rest = rest.slice(leadingParen[0].length).trim();
  }

  // Split off a trailing note after a comma.
  let commaNote = "";
  const commaIdx = rest.indexOf(",");
  if (commaIdx > -1) {
    commaNote = rest.slice(commaIdx + 1).trim();
    rest = rest.slice(0, commaIdx).trim();
  }

  const note = [parenNote, commaNote].filter(Boolean).join(" - ");

  return {
    id: nextId(),
    name: rest || line.trim(),
    qty,
    qtyRaw,
    unit,
    note,
  };
}

function parseLooseNumber(raw: string): number | null {
  const glyphs: Record<string, number> = {
    "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
    "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
  };
  for (const [g, v] of Object.entries(glyphs)) {
    if (raw.includes(g)) {
      const wholePart = raw.replace(g, "").trim();
      const whole = wholePart ? Number(wholePart) : 0;
      return Number.isFinite(whole) ? whole + v : v;
    }
  }
  const fracMatch = raw.match(/^(\d+)[\s.]?(\d+)\/(\d+)$/);
  if (fracMatch) {
    const [, whole, num, den] = fracMatch;
    return Number(whole) + Number(num) / Number(den);
  }
  const simpleFrac = raw.match(/^(\d+)\/(\d+)$/);
  if (simpleFrac) {
    return Number(simpleFrac[1]) / Number(simpleFrac[2]);
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseRecipeText(rawText: string): ParsedRecipe {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let title = "";
  const ingredientLines: { line: string; section: string }[] = [];
  let curSection = "";
  const stepLines: string[] = [];
  const unparsedLines: string[] = [];

  let section: "none" | "ingredients" | "steps" = "none";
  let sawAnyHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (SECTION_HEADERS.ingredients.test(line)) {
      section = "ingredients";
      sawAnyHeader = true;
      // "Ingredients for the frosting" carries a section name after the keyword.
      const rest = line.replace(/^ingredients?\b\s*[:\-–]?\s*/i, "").replace(/^for\s+(the\s+)?/i, "").replace(/[:：]\s*$/, "").trim();
      if (rest && rest.split(/\s+/).length <= 4) curSection = titleCase(rest);
      continue;
    }
    if (SECTION_HEADERS.steps.test(line)) {
      section = "steps";
      sawAnyHeader = true;
      const rest = line.replace(/^(instructions?|directions?|method|steps?|preparation)\b\s*[:\-–]?\s*/i, "").replace(/^for\s+(the\s+)?/i, "").replace(/[:：]\s*$/, "").trim();
      if (rest && rest.split(/\s+/).length <= 4) stepLines.push(`## ${titleCase(rest)}`);
      continue;
    }

    // Component heading ("Frosting:", "For the filling") inside a list.
    {
      const h = headingText(line);
      const inIngredients = section === "ingredients" || (section === "none" && stepLines.length === 0);
      if (h && !(section === "none" && !sawAnyHeader && i < 1)) {
        if (inIngredients) curSection = h;
        else stepLines.push(`## ${h}`);
        continue;
      }
    }

    // First short, non-quantity line before any section header is the title guess.
    if (!title && !sawAnyHeader && i < 3 && !QTY_LEAD.test(line) && line.length < 80) {
      title = line;
      continue;
    }

    if (section === "ingredients") {
      ingredientLines.push({ line: stripBulletPrefix(line), section: curSection });
    } else if (section === "steps") {
      stepLines.push(stripBulletPrefix(line).replace(/^\d+[.)]\s*/, ""));
    } else {
      // No headers seen yet/at all - guess by shape.
      const cleaned = stripBulletPrefix(line);
      const looksLikeIngredient = QTY_LEAD.test(cleaned) && cleaned.length < 100;
      const looksLikeStep =
        /^\d+[.)]\s/.test(cleaned) || cleaned.length > 60 || /\.\s*$/.test(cleaned);

      if (looksLikeIngredient) ingredientLines.push({ line: cleaned, section: curSection });
      else if (looksLikeStep) stepLines.push(cleaned.replace(/^\d+[.)]\s*/, ""));
      else unparsedLines.push(line);
    }
  }

  // Anything left unparsed but that actually looks like an ingredient, rescue it.
  const rescued: string[] = [];
  for (const line of unparsedLines) {
    const cleaned = stripBulletPrefix(line);
    if (QTY_LEAD.test(cleaned)) ingredientLines.push({ line: cleaned, section: "" });
    else rescued.push(line);
  }

  return {
    title: title || "Untitled recipe",
    ingredients: ingredientLines.map(({ line, section }) => {
      const ing = splitQtyUnitName(line);
      return section ? { ...ing, section } : ing;
    }),
    steps: stepLines,
    unparsedLines: rescued,
  };
}
