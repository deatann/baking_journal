"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";

export interface UploadedPhoto {
  path: string;
  previewUrl: string;
}

interface Props {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  bucket: string;
  maxPhotos?: number;
}

export default function PhotoUploader({ photos, onChange, bucket, maxPhotos = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    const remaining = maxPhotos - photos.length;
    const toUpload = Array.from(files).slice(0, Math.max(remaining, 0));
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const uploaded: UploadedPhoto[] = [];
      for (const file of toUpload) {
        const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.78 });
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        uploaded.push({ path, previewUrl: URL.createObjectURL(compressed) });
      }
      onChange([...photos, ...uploaded]);
    } catch (err: any) {
      setError(err?.message ?? "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(path: string) {
    onChange(photos.filter((p) => p.path !== path));
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3">
        {photos.map((photo) => (
          <div key={photo.path} className="group relative h-24 w-24">
            <img
              src={photo.previewUrl}
              alt=""
              className="h-24 w-24 rounded-xl border-[1.5px] border-line object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(photo.path)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-line bg-white text-xs text-red-500"
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-crust-300 bg-white text-crust-500 active:bg-peach-100">
            <span className="text-xl">{uploading ? "…" : "+"}</span>
            <span className="text-[10px]">{uploading ? "Uploading" : "Add photo"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-crust-500">
        Photos are resized before upload. {photos.length}/{maxPhotos}.
      </p>
    </div>
  );
}
