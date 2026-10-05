import { createClient } from "@/lib/supabase/server";
import { Bake } from "@/lib/types";
import { getMeCached } from "@/lib/session";
import { categoryStyle } from "@/lib/categoryStyle";
import JournalBrowser, { JournalItem, Person } from "./JournalBrowser";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const supabase = createClient();

  const [session, { data, error }, { data: recipeRows }] = await Promise.all([
    getMeCached(),
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

  const bakes = (data ?? []) as Bake[];

  // One request for every photo link instead of one request per photo.
  const allPaths = Array.from(new Set(bakes.flatMap((b) => b.photo_paths ?? [])));
  const urlByPath = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data: signed } = await supabase.storage.from("bake-photos").createSignedUrls(allPaths, 60 * 60);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }

  const categoryById = new Map<string, string>();
  for (const r of (recipeRows ?? []) as { id: string; category: string }[]) categoryById.set(r.id, r.category);

  const profiles = session?.profiles ?? {};
  const meId = session?.me.id ?? "";

  const items: JournalItem[] = bakes.map((b) => {
    const p = profiles[b.user_id];
    const paths = b.photo_paths ?? [];
    return {
      id: b.id,
      userId: b.user_id,
      who: p?.name ?? "Someone",
      whoAvatar: p?.avatarUrl ?? null,
      recipeId: b.recipe_id,
      title: b.recipe_title_snapshot || "Untitled bake",
      bakedOn: b.baked_on,
      scale: b.scale_factor,
      rating: b.rating,
      notes: b.notes ?? "",
      photoPaths: paths,
      photoUrls: paths.map((path) => urlByPath.get(path)).filter((u): u is string => !!u),
      emoji: categoryStyle(b.recipe_id ? categoryById.get(b.recipe_id) : undefined).emoji,
    };
  });

  // People filter: everyone who has at least one bake.
  const seen = new Set(items.map((i) => i.userId));
  const people: Person[] = Array.from(seen).map((id) => ({
    id,
    name: profiles[id]?.name ?? "Someone",
    avatarUrl: profiles[id]?.avatarUrl ?? null,
  }));

  return <JournalBrowser items={items} people={people} meId={meId} />;
}
