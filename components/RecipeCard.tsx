import Link from "next/link";
import { Recipe } from "@/lib/types";
import { categoryStyle, ACCENT_CLASSES } from "@/lib/categoryStyle";
import Avatar from "./Avatar";

// Photo-first card: the cover photo (or a coloured tile with the category emoji) on top.
export default function RecipeCard({
  recipe,
  coverUrl,
  by,
  showPublic,
  isGuest,
}: {
  recipe: Recipe;
  coverUrl: string | null;
  by?: { name: string; avatarUrl: string | null };
  showPublic?: boolean;
  isGuest?: boolean;
}) {
  const { emoji, accent } = categoryStyle(recipe.category);
  const classes = ACCENT_CLASSES[accent];
  const tags = recipe.tags ?? [];
  const shown = tags.slice(0, 2);
  const more = tags.length - shown.length;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="relative block overflow-hidden rounded-[20px] border-[1.5px] border-line bg-white shadow-pop press md:hover:-translate-y-0.5"
    >
      <div className={`relative aspect-[4/3] w-full overflow-hidden border-b-[1.5px] border-line ${classes.tile}`}>
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-6xl">{emoji}</span>
        )}
        {by && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-white/90 py-[3px] pl-[3px] pr-2.5 text-[11px] font-extrabold text-ink">
            <Avatar name={by.name} url={by.avatarUrl} size={22} />
            by {by.name}
          </span>
        )}
        {showPublic && (
          <span className="absolute right-2.5 top-2.5 rounded-full border-[1.5px] border-line bg-sage-100 px-2 py-0.5 text-[11px] font-extrabold text-sage-700">
            Public
          </span>
        )}
      </div>
      <div className="px-4 pb-3.5 pt-3">
        <h2 className="font-display text-[19px] font-bold leading-tight text-ink">{recipe.title}</h2>
        <p className={`mt-0.5 text-[11px] font-extrabold uppercase tracking-wide ${classes.text}`}>
          {recipe.category}
          {!isGuest && recipe.source_type === "scanned" && " · scanned"}
        </p>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-nowrap gap-1.5 overflow-hidden">
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
        <p className="mt-2 text-[13px] text-crust-500">
          {recipe.ingredients?.length ?? 0} ingredients
          {recipe.base_yield_qty ? ` · yields ${recipe.base_yield_qty} ${recipe.base_yield_unit ?? ""}` : ""}
        </p>
      </div>
    </Link>
  );
}
