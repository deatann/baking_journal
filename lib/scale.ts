// Quantity parsing/formatting for recipe scaling.
// Handles plain numbers, decimals, and fractions like "1 1/2" or "3/4"
// typed by a human, and formats scaled results back into something
// bakeable rather than "166.66666666666666 g".

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 1 / 4,
  "½": 1 / 2,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

/** Parse a human-entered quantity string into a number, or null if unparseable. */
export function parseQty(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  let s = raw.trim();
  if (s === "") return null;

  // Replace a single unicode fraction glyph, possibly preceded by a whole number.
  for (const [glyph, value] of Object.entries(UNICODE_FRACTIONS)) {
    if (s.includes(glyph)) {
      const wholePart = s.replace(glyph, "").trim();
      const whole = wholePart === "" ? 0 : Number(wholePart);
      if (Number.isFinite(whole)) return whole + value;
    }
  }

  // "1 1/2" or "3/4"
  const mixedMatch = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const [, whole, num, den] = mixedMatch;
    const d = Number(den);
    if (d === 0) return null;
    return Number(whole) + Number(num) / d;
  }

  const fracMatch = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const [, num, den] = fracMatch;
    const d = Number(den);
    if (d === 0) return null;
    return Number(num) / d;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Scale a quantity by a factor. Returns null if qty is null (no quantity to scale). */
export function scaleQty(qty: number | null, factor: number): number | null {
  if (qty === null) return null;
  return qty * factor;
}

const DISPLAY_FRACTIONS: Array<{ value: number; label: string }> = [
  { value: 1 / 8, label: "⅛" },
  { value: 1 / 4, label: "¼" },
  { value: 1 / 3, label: "⅓" },
  { value: 3 / 8, label: "⅜" },
  { value: 1 / 2, label: "½" },
  { value: 5 / 8, label: "⅝" },
  { value: 2 / 3, label: "⅔" },
  { value: 3 / 4, label: "¾" },
  { value: 7 / 8, label: "⅞" },
];

/**
 * Format a (possibly scaled) quantity for display. Snaps close-enough values
 * to a friendly baking fraction (within ~3%) so "166.667" becomes "1⅔"
 * instead of a long decimal; otherwise falls back to a rounded decimal.
 */
export function formatQty(value: number | null, opts?: { maxDecimals?: number }): string {
  if (value === null) return "";
  if (!Number.isFinite(value)) return "";

  const maxDecimals = opts?.maxDecimals ?? 2;
  const whole = Math.floor(value);
  const remainder = value - whole;

  if (remainder < 0.02) {
    return whole === 0 && value !== 0 ? formatDecimal(value, maxDecimals) : String(whole);
  }
  if (remainder > 0.98) {
    return String(whole + 1);
  }

  for (const frac of DISPLAY_FRACTIONS) {
    if (Math.abs(remainder - frac.value) < 0.03) {
      return whole > 0 ? `${whole}${frac.label}` : frac.label;
    }
  }

  return formatDecimal(value, maxDecimals);
}

function formatDecimal(value: number, maxDecimals: number): string {
  const rounded = Math.round(value * 10 ** maxDecimals) / 10 ** maxDecimals;
  return String(rounded);
}

/** Common preset scale factors shown as quick buttons. */
export const SCALE_PRESETS = [0.5, 0.75, 1, 1.5, 2, 3];
