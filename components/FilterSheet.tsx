"use client";

import { useState } from "react";

export interface FilterOption {
  key: string; // "c:cookies" | "t:chewy"
  label: string;
  count: number;
}

export default function FilterSheet({
  open,
  onClose,
  categories,
  tags,
  selected,
  onToggle,
  onClear,
  mode,
  onModeChange,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  categories: FilterOption[];
  tags: FilterOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onClear: () => void;
  mode: "any" | "all";
  onModeChange: (m: "any" | "all") => void;
  resultCount: number;
}) {
  const [q, setQ] = useState("");
  if (!open) return null;

  const match = (o: FilterOption) => o.label.toLowerCase().includes(q.trim().toLowerCase());
  const cats = categories.filter(match);
  const tgs = tags.filter(match);

  const row = (o: FilterOption) => (
    <label
      key={o.key}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-2.5 text-[15px] font-bold active:bg-peach-100"
    >
      <input
        type="checkbox"
        checked={selected.has(o.key)}
        onChange={() => onToggle(o.key)}
        className="h-6 w-6 shrink-0 appearance-none rounded-lg border-2 border-ink bg-white checked:bg-sage-400 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%233b2a22%22 stroke-width=%224%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M5 12.5l4.5 4.5L19 7%22/></svg>')] checked:bg-center checked:bg-no-repeat"
      />
      {o.label}
      <span className="ml-auto text-xs font-bold text-crust-500">{o.count}</span>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[86%] w-full max-w-lg animate-up flex-col rounded-t-[28px] border-[2.5px] border-b-0 border-ink bg-white">
        <div className="flex items-center justify-between px-5 pb-1.5 pt-4">
          <h2 className="font-display text-[22px] font-bold">Filter recipes</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 rounded-full border-2 border-ink bg-white text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-5 pb-2 pt-1.5">
          <input
            className="field"
            placeholder="Search categories & tags..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="min-h-[120px] flex-1 overflow-y-auto px-5 pb-2">
          {cats.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-[11px] font-extrabold uppercase tracking-widest text-crust-500">
                Category
              </p>
              {cats.map(row)}
            </>
          )}
          {tgs.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-[11px] font-extrabold uppercase tracking-widest text-crust-500">
                Tags
              </p>
              {tgs.map(row)}
            </>
          )}
          {cats.length === 0 && tgs.length === 0 && (
            <p className="mt-6 text-center text-sm text-crust-500">Nothing matches that search.</p>
          )}
        </div>
        <div className="flex flex-col gap-2.5 border-t-2 border-crust-200 px-5 pb-5 pt-3">
          <div className="flex items-center gap-2 text-[13px] font-bold text-crust-600">
            Match
            <div className="flex overflow-hidden rounded-full border-2 border-ink">
              {(["any", "all"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`px-3 py-1 text-xs font-extrabold ${mode === m ? "bg-butter-300" : "bg-white"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            selected
          </div>
          <div className="flex gap-2.5">
            <button className="btn btn-ghost flex-1" onClick={onClear}>
              Clear
            </button>
            <button className="btn btn-primary flex-1" onClick={onClose}>
              Show {resultCount} recipe{resultCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
