import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bake } from "@/lib/types";
import { getMe } from "@/lib/session";
import { profileOf } from "@/lib/profiles";
import { categoryStyle } from "@/lib/categoryStyle";
import Avatar from "@/components/Avatar";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

function fmtDate(d: string) {
  // baked_on is a plain date (YYYY-MM-DD); format in UTC so it never shifts a day.
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const TILES = ["bg-butter-200", "bg-peach-200", "bg-sage-200", "bg-sky-200", "bg-plum-200"];

export default async function JournalPage() {
  const supabase = createClient();
  const session = await getMe(supabase);
  const profiles = session?.profiles ?? {};

  const [{ data, error }, { data: recipeRows }] = await Promise.all([
    supabase
      .from("bakes")
      .select("*")
      .order("baked_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("recipes").select("id,category"),
  ]);

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load the journal: {error.message}
      </div>
    );
  }

  const categoryById = new Map<string, string>();
  for (const r of (recipeRows ?? []) as { id: string; category: string }[]) categoryById.set(r.id, r.category);

  const bakes = (data ?? []) as Bake[];
  const bakesWithUrls = await Promise.all(
    bakes.map(async (bake) => {
      const urls: string[] = [];
      for (const path of bake.photo_paths ?? []) {
        const { data: signed } = await supabase.storage.from("bake-photos").createSignedUrl(path, 60 * 60);
        if (signed?.signedUrl) urls.push(signed.signedUrl);
      }
      return { ...bake, photoUrls: urls };
    }),
  );

  return (
    <div>
      <PageHeader title="Journal" hand="every bake, remembered" />

      {bakesWithUrls.length === 0 ? (
        <EmptyState title="No bakes yet" text="Tap + and choose Log bake to add the first one.">
          <Link href="/journal/new" className="btn btn-primary mt-2">
            Log bake
          </Link>
        </EmptyState>
      ) : (
        <div className="-mx-4 grid grid-cols-1 gap-5 sm:-mx-6 md:mx-0 md:grid-cols-[repeat(auto-fit,minmax(240px,280px))] md:justify-center md:gap-6">
          {bakesWithUrls.map((bake, idx) => {
            const who = profileOf(profiles, bake.user_id);
            const category = bake.recipe_id ? categoryById.get(bake.recipe_id) : undefined;
            const { emoji } = categoryStyle(category);
            const title = bake.recipe_title_snapshot || "Untitled bake";
            return (
              <article
                key={bake.id}
                className="overflow-hidden border-y-[2.5px] border-ink bg-white md:rounded-[20px] md:border-[2.5px] md:shadow-pop"
              >
                <div className="relative aspect-[3/4] bg-crust-100">
                  {bake.photoUrls.length > 0 ? (
                    <div className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {bake.photoUrls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full shrink-0 snap-center object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={`grid h-full w-full place-items-center text-7xl ${TILES[idx % TILES.length]}`}>
                      {emoji}
                    </div>
                  )}

                  <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-2 rounded-full bg-white/90 py-1 pl-1 pr-3 shadow">
                    <Avatar name={who.name} url={who.avatarUrl} size={28} />
                    <span className="leading-tight">
                      <span className="block text-[12px] font-extrabold text-ink">{who.name}</span>
                      <span className="block text-[11px] font-bold text-crust-500">{fmtDate(bake.baked_on)}</span>
                    </span>
                  </div>

                  {bake.photoUrls.length > 1 && (
                    <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-extrabold text-white">
                      1/{bake.photoUrls.length}
                    </span>
                  )}
                </div>

                <div className="px-3.5 pb-4 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold leading-tight">
                      {bake.recipe_id ? (
                        <Link href={`/recipes/${bake.recipe_id}`} className="underline decoration-crust-300 decoration-2 underline-offset-2">
                          {title}
                        </Link>
                      ) : (
                        title
                      )}
                    </h2>
                    {bake.scale_factor !== 1 && (
                      <span className="shrink-0 rounded-full border-[1.5px] border-ink bg-sky-100 px-2 py-0.5 text-[11px] font-extrabold">
                        ×{bake.scale_factor}
                      </span>
                    )}
                  </div>
                  {bake.rating ? (
                    <p className="mt-0.5 text-sm tracking-widest text-mustard-500" aria-label={`${bake.rating} of 5 stars`}>
                      {"★".repeat(bake.rating)}
                      <span className="text-crust-200">{"★".repeat(5 - bake.rating)}</span>
                    </p>
                  ) : null}
                  {bake.notes && <p className="mt-1.5 line-clamp-3 text-[14px] text-crust-700">{bake.notes}</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
