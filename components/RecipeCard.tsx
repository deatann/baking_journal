import Link from "next/link";
import { Recipe } from "@/lib/types";
import { categoryStyle, ACCENT_CLASSES } from "@/lib/categoryStyle";

export default function RecipeCard({ recipe, byName }: { recipe: Recipe; byName?: string }) {
  const { emoji, accent } = categoryStyle(recipe.category);
  const classes = ACCENT_CLASSES[accent];
  const tags = recipe.tags ?? [];
  const shown = tags.slice(0, 2);
  const more = tags.length - shown.length;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="relative block overflow-hidden rounded-[20px] border-[1.5px] border-line bg-white px-4 pb-3.5 pt-5 shadow-pop press md:hover:-translate-y-0.5"
    >
      <span className={`absolute left-0 top-0 h-2.5 w-full border-b-[1.5px] border-line ${classes.strip}`} />
      <h2 className="font-display text-[19px] font-bold leading-tight text-ink">
        <span className="mr-1">{emoji}</span>
        {recipe.title}
      </h2>
      <p className={`mt-0.5 text-[11px] font-extrabold uppercase tracking-wide ${classes.text}`}>
        {recipe.category}
        {recipe.source_type === "scanned" && " · scanned"}
        {byName && (
          <span className="font-bold normal-case tracking-normal text-crust-500"> · by {byName}</span>
        )}
      </p>
      {tags.length > 0 && (
        <div className="mt-2.5 flex flex-nowrap gap-1.5 overflow-hidden">
          {shown.map((tag) => (
            <span
              key={tag}
              className="shrink-0 rounded-full border-[1.5px] border-line bg-peach-100 px-2.5 py-0.5 text-[11px] font-bold"
            >
              {tag}
            </span>
          ))}
          {more > 0 && (
            <span className="shrink-0 rounded-full border-[1.5px] border-crust-300 bg-white px-2.5 py-0.5 text-[11px] font-bold text-crust-500">
              +{more}
            </span>
          )}
        </div>
      )}
      <p className="mt-2.5 text-[13px] text-crust-500">
        {recipe.ingredients?.length ?? 0} ingredients
        {recipe.base_yield_qty ? ` · yields ${recipe.base_yield_qty} ${recipe.base_yield_unit ?? ""}` : ""}
      </p>
    </Link>
  );
}
