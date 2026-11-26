"use client";

import { useState } from "react";
import Cropper from "react-easy-crop";
import { cropToBlob, PixelArea } from "@/lib/cropImage";

// Full-screen crop step with a fixed frame. Drag to move, pinch / slider to zoom.
export default function CropDialog({
  src,
  aspect,
  onCancel,
  onDone,
}: {
  src: string;
  aspect: number;
  onCancel: () => void;
  onDone: (blob: Blob) => void | Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<PixelArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!area) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await cropToBlob(src, area);
      await onDone(blob);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't crop that photo.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/95">
      <div className="px-4 pb-2 pt-4 text-center text-sm font-extrabold text-white">
        Drag to move, pinch or use the slider to zoom
      </div>
      <div className="relative min-h-0 flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, px) => setArea(px)}
          showGrid={false}
          objectFit="contain"
        />
      </div>
      <div className="space-y-3 bg-ink px-4 pb-6 pt-3">
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="w-full accent-[#f6d98c]"
        />
        {error && <p className="text-center text-xs font-bold text-red-300">{error}</p>}
        <div className="flex gap-2.5">
          <button type="button" onClick={onCancel} disabled={busy} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={busy || !area} className="btn btn-primary flex-1">
            {busy ? "Saving..." : "Use crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
