"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { squareAvatar } from "@/lib/avatarImage";
import Avatar from "./Avatar";

export default function ProfileSheet({
  me,
  onClose,
}: {
  me: { id: string; name: string; avatarUrl: string | null };
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(me.name);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter a name.");
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      let avatarPath: string | undefined;
      if (file) {
        const blob = await squareAvatar(file, 256);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        avatarPath = `${me.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(avatarPath, blob, { contentType: blob.type, upsert: true });
        if (upErr) throw upErr;
      }
      const row: Record<string, unknown> = {
        id: me.id,
        display_name: trimmed.slice(0, 30),
        updated_at: new Date().toISOString(),
      };
      if (avatarPath) row.avatar_path = avatarPath;
      const { error: dbErr } = await supabase.from("profiles").upsert(row);
      if (dbErr) throw dbErr;
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 md:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-sm animate-up rounded-b-none p-5 md:rounded-b-3xl">
        <h2 className="font-display text-2xl font-bold">Your profile</h2>
        <p className="mb-4 font-hand text-xl text-peach-500">make it yours</p>

        <div className="mb-4 flex items-center gap-4">
          <Avatar name={name || me.name} url={preview ?? me.avatarUrl} size={84} />
          <div>
            <label className="btn btn-ghost cursor-pointer">
              Choose chibi
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="mt-1 text-xs text-crust-500">Any image. It&apos;s cropped to a square circle.</p>
          </div>
        </div>

        <label className="label">Display name</label>
        <input
          className="field"
          value={name}
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary flex-1" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
