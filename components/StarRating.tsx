"use client";

export default function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? null : n)}
          className="grid h-11 w-11 place-items-center text-3xl leading-none"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <span className={value !== null && n <= value ? "text-mustard-500" : "text-crust-300"}>{value !== null && n <= value ? "★" : "☆"}</span>
        </button>
      ))}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs font-bold text-crust-500 underline"
        >
          clear
        </button>
      )}
    </div>
  );
}
