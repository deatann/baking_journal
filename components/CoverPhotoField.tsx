"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import { categoryStyle } from "@/lib/categoryStyle";

// Cover photo picker for a recipe: choose from library, take a photo, replace or remove.
// The file goes to the public "recipe-covers" bucket under <user id>/<random>.jpg.
export default function CoverPhotoField({
  previewUrl,
  category,
  onChange,
}: {
  previewUrl: string | null;
  category: string;
  onChange: (path: string | null, previewUrl: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { emoji } = categoryStyle(category);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      const blob = await compressImage(file, { maxDimension: 1280, quality: 0.78 });
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("recipe-covers")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      onChange(path, URL.createObjectURL(blob));
    } catch (e: any) {
      setError(e?.message ?? "Photo upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const pick = (capture: boolean) => (
    <input
      type="file"
      accept="image/*"
      {...(capture ? { capture: "environment" as const } : {})}
      className="hidden"
      disabled={busy}
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = "";
      }}
    />
  );

  const btn =
    "btn flex-1 cursor-pointer justify-center !px-3 !py-1.5 text-[13px] " + (busy ? "pointer-events-none opacity-50" : "");

  return (
    <div>
      <label className="label">Cover photo</label>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border-[1.5px] border-line bg-crust-100">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center border-2 border-dashed border-crust-300 text-center text-sm font-extrabold text-crust-500">
            <div>
              <div className="text-5xl">{emoji}</div>
              <div className="mt-1">No cover photo yet</div>
              <div className="text-xs font-semibold">Choose one or take one</div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <label className={btn}>
          {busy ? "Uploading..." : previewUrl ? "Replace" : "Choose photo"}
          {pick(false)}
        </label>
        <label className={btn}>
          Take photo
          {pick(true)}
        </label>
        {previewUrl && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="btn !px-3 !py-1.5 text-[13px] !text-red-600"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}
