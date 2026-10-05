"use client";

import { useMemo, useState } from "react";
import { Recipe } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";
import FilterSheet, { FilterOption } from "@/components/FilterSheet";

const catKey = (c: string) => `c:${(c || "uncategorized").trim().toLowerCase()}`;
const tagKey = (t: string) => `t:${t.trim().toLowerCase()}`;

export default function RecipesBrowser({
  recipes,
  owners,
  meId,
}: {
  recipes: Recipe[];
  owners: Record<string, string>;
  meId: string;
}) {
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"any" | "all">("any");

  const { categories, tags, labels } = useMemo(() => {
    const cats = new Map<string, FilterOption>();
    const tgs = new Map<string, FilterOption>();
    const labels = new Map<string, string>();
    for (const r of recipes) {
      const ck = catKey(r.category);
      const cLabel = (r.category || "uncategorized").trim();
      const c = cats.get(ck) ?? { key: ck, label: cLabel, count: 0 };
      c.count += 1;
      cats.set(ck, c);
      labels.set(ck, c.label);
      for (const t of r.tags ?? []) {
        if (!t.trim()) continue;
        const tk = tagKey(t);
        const o = tgs.get(tk) ?? { key: tk, label: t.trim().toLowerCase(), count: 0 };
        o.count += 1;
        tgs.set(tk, o);
        labels.set(tk, o.label);
      }
    }
    const sort = (a: FilterOption, b: FilterOption) => a.label.localeCompare(b.label);
    return {
      categories: Array.from(cats.values()).sort(sort),
      tags: Array.from(tgs.values()).sort(sort),
      labels,
    };
  }, [recipes]);

  const filtered = recipes.filter((r) => {
    const keys = [catKey(r.category), ...(r.tags ?? []).map(tagKey)];
    const sel = Array.from(selected);
    const okFilter =
      sel.length === 0 ||
      (mode === "all" ? sel.every((k) => keys.includes(k)) : sel.some((k) => keys.includes(k)));
    const q = query.trim().toLowerCase();
    const okQuery =
      q === "" ||
      r.title.toLowerCase().includes(q) ||
      (r.tags ?? []).some((t) => t.toLowerCase().includes(q));
    return okFilter && okQuery;
  });

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const active = selected.size;

  return (
    <div>
      <div className="mb-2.5 flex gap-2.5">
        <input
          type="text"
          placeholder="Search recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="field min-w-0 flex-1"
        />
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Filter"
          className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 ${
            active ? "border-ink bg-butter-300 text-ink" : "border-crust-200 bg-white text-crust-600"
          }`}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2.3" strokeLinecap="round" className="h-[22px] w-[22px] fill-none stroke-current">
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          {active > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-white bg-peach-500 px-1 text-[11px] font-extrabold text-white">
              {active}
            </span>
          )}
        </button>
      </div>

      {active > 0 && (
        <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-crust-600">
          <span className="min-w-0 flex-1 truncate">
            Filtered: {Array.from(selected).map((k) => labels.get(k) ?? k).join(", ")}
          </span>
          <button onClick={() => setSelected(new Set())} className="font-extrabold text-peach-500 underline">
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-crust-500">No recipes match those filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              byName={recipe.user_id === meId ? undefined : owners[recipe.user_id] ?? "Someone"}
            />
          ))}
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        tags={tags}
        selected={selected}
        onToggle={toggle}
        onClear={() => setSelected(new Set())}
        mode={mode}
        onModeChange={setMode}
        resultCount={filtered.length}
      />
    </div>
  );
}
