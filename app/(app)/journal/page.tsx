import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bake } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bakes")
    .select("*")
    .order("baked_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Couldn&apos;t load your journal: {error.message}
      </div>
    );
  }

  const bakes = (data ?? []) as Bake[];

  // Sign all photo paths across all bakes in one batch per bake (small N, simple loop is fine).
  const bakesWithUrls = await Promise.all(
    bakes.map(async (bake) => {
      const urls: string[] = [];
      for (const path of bake.photo_paths ?? []) {
        const { data: signed } = await supabase.storage
          .from("bake-photos")
          .createSignedUrl(path, 60 * 60);
        if (signed?.signedUrl) urls.push(signed.signedUrl);
      }
      return { ...bake, photoUrls: urls };
    }),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-crust-800">Baking Journal</h1>
        <Link
          href="/journal/new"
          className="rounded-full bg-crust-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md"
        >
          + Log a bake
        </Link>
      </div>

      {bakesWithUrls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-crust-300 p-10 text-center text-crust-500">
          <p className="mb-3">No entries yet.</p>
          <p className="text-sm">Log your first bake to start the journal.</p>
        </div>
      ) : (
        <ol className="space-y-5 border-l-4 border-dashed border-mustard-400 pl-6">
          {bakesWithUrls.map((bake) => (
            <li key={bake.id} className="relative">
              <span className="absolute -left-[35px] top-1.5 h-4 w-4 rounded-full bg-berry-400 ring-4 ring-crust-50" />
              <div className="rounded-2xl border-2 border-crust-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-hand text-lg leading-none text-crust-500">
                      {new Date(bake.baked_on).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <h2 className="font-display text-lg font-bold text-crust-800">
                      {bake.recipe_id ? (
                        <Link href={`/recipes/${bake.recipe_id}`} className="hover:text-crust-600">
                          {bake.recipe_title_snapshot}
                        </Link>
                      ) : (
                        bake.recipe_title_snapshot || "Untitled bake"
                      )}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-crust-500">
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">×{bake.scale_factor}</span>
                    {bake.rating && <span>{"⭐".repeat(bake.rating)}</span>}
                  </div>
                </div>

                {bake.notes && <p className="mt-2 text-sm text-crust-700">{bake.notes}</p>}

                {bake.photoUrls.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {bake.photoUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className={`h-24 w-24 rounded-md border-4 border-white object-cover shadow-md ${
                          i % 2 === 0 ? "tilt-left" : "tilt-right"
                        } transition-transform hover:rotate-0 hover:scale-105`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
