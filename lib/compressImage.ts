// Client-side image downscale/compress before upload, so a phone photo
// (often 3-8MB) becomes ~150-400KB before it hits Supabase storage.
// This matters because the free storage tier is a fixed 1GB, not a monthly
// allowance - uncompressed photos would burn through it fast.

export interface CompressOptions {
  maxDimension?: number; // longest side, in px
  quality?: number; // 0-1, JPEG quality
}

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<Blob> {
  const { maxDimension = 1600, quality = 0.78 } = opts;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height / width) * maxDimension);
      width = maxDimension;
    } else {
      width = Math.round((width / height) * maxDimension);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image compression failed"));
      },
      "image/jpeg",
      quality,
    );
  });
}
