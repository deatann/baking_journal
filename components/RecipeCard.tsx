import Link from "next/link";
import { Recipe } from "@/lib/types";
import { categoryStyle, ACCENT_CLASSES } from "@/lib/categoryStyle";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { emoji, accent } = categoryStyle(recipe.category);
  const classes = ACCENT_CLASSES[accent];

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group relative block overflow-hidden rounded-2xl border-2 border-crust-200 bg-white p-4 pt-5 shadow-sm transition-all hover:-translate-y-1 hover:rotate-1 hover:shadow-lg"
    >
      <span className={`absolute left-0 top-0 h-2 w-full ${classes.strip}`} />
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-crust-800 group-hover:text-crust-600">
          <span className="mr-1">{emoji}</span>
          {recipe.title}
        </h2>
        {recipe.is_favorite && <span title="Favorite">⭐</span>}
      </div>
      <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${classes.text}`}>
        {recipe.category}
        {recipe.source_type === "scanned" && " · scanned"}
      </p>
      {recipe.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${classes.badge}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-sm text-crust-500">
        {recipe.ingredients?.length ?? 0} ingredients
        {recipe.base_yield_qty ? ` · yields ${recipe.base_yield_qty} ${recipe.base_yield_unit ?? ""}` : ""}
      </p>
    </Link>
  );
}
