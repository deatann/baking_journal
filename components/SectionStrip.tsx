"use client";

// Thin tap target shown between rows while placing a new section heading.
export default function SectionStrip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press block w-full rounded-lg border-2 border-dashed border-butter-300 bg-butter-100 py-1 text-[11px] font-extrabold uppercase tracking-widest text-crust-600"
    >
      Start section here
    </button>
  );
}
