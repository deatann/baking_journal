"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PhotoUploader, { UploadedPhoto } from "@/components/PhotoUploader";
import StarRating from "@/components/StarRating";

interface RecipeOption {
  id: string;
  title: string;
}

export default function NewBakePage() {
  return (
    <Suspense fallback={null}>
      <NewBakeForm />
    </Suspense>
  );
}

function NewBakeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [recipeId, setRecipeId] = useState<string>(searchParams.get("recipeId") ?? "");
  const [freeTitle, setFreeTitle] = useState("");
  const [bakedOn, setBakedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [scaleFactor, setScaleFactor] = useState(searchParams.get("scale") ?? "1");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("recipes")
      .select("id,title")
      .order("title")
      .then(({ data }) => setRecipes(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const recipe = recipes.find((r) => r.id === recipeId);
    const title = recipe?.title || freeTitle.trim();
    if (!title) {
      setError("Pick a recipe or type a name for what you baked.");
      return;
    }
    const factor = Number(scaleFactor);
    if (!Number.isFinite(factor) || factor <= 0) {
      setError("Scale factor must be a positive number.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { error: insertError } = await supabase.from("bakes").insert({
        user_id: user.id,
        recipe_id: recipeId || null,
        recipe_title_snapshot: title,
        baked_on: bakedOn,
        scale_factor: factor,
        rating,
        notes,
        photo_paths: photos.map((p) => p.path),
      });
      if (insertError) throw insertError;

      router.push("/journal");
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save this journal entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl font-bold text-crust-800">Log a bake</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Recipe</label>
          <select
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
          >
            <option value="">— Not from a saved recipe —</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        {!recipeId && (
          <div>
            <label className="mb-1 block text-sm font-medium text-crust-700">What did you bake?</label>
            <input
              type="text"
              value={freeTitle}
              onChange={(e) => setFreeTitle(e.target.value)}
              className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
              placeholder="One-off experiment, or a recipe you haven't saved yet"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-crust-700">Date</label>
            <input
              type="date"
              value={bakedOn}
              onChange={(e) => setBakedOn(e.target.value)}
              className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-crust-700">Scale used</label>
            <input
              type="text"
              inputMode="decimal"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(e.target.value)}
              className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Rating</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none"
            placeholder="How did it turn out? What would you change next time?"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-crust-700">Photos</label>
          <PhotoUploader photos={photos} onChange={setPhotos} bucket="bake-photos" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-crust-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {saving ? "Saving..." : "Save journal entry"}
        </button>
      </form>
    </div>
  );
}
