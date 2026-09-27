"use client";

import { useMemo, useState } from "react";
import { Recipe } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";

export default function RecipesBrowser({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set(recipes.map((r) => r.category || "uncategorized"));
    return ["all", ...Array.from(set).sort()];
  }, [recipes]);

  const filtered = recipes.filter((r) => {
    const matchesCategory = category === "all" || r.category === category;
    const matchesQuery =
      query.trim() === "" ||
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search recipes or tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none focus:ring-1 focus:ring-crust-500 sm:max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-crust-500">No recipes match that search.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
