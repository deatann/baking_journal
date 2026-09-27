"use client";

export default function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className="text-2xl leading-none"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          {value !== null && n <= value ? "⭐" : "☆"}
        </button>
      ))}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-crust-400 hover:text-crust-600"
        >
          clear
        </button>
      )}
    </div>
  );
}
