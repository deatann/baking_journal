// Draws the chosen crop area of an image onto a canvas and returns it as a JPEG.
export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function cropToBlob(
  src: string,
  area: PixelArea,
  opts: { maxDimension?: number; quality?: number } = {},
): Promise<Blob> {
  const { maxDimension = 1280, quality = 0.78 } = opts;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Couldn't load the photo to crop."));
    el.src = src;
  });

  const scale = Math.min(1, maxDimension / Math.max(area.width, area.height));
  const w = Math.max(1, Math.round(area.width * scale));
  const h = Math.max(1, Math.round(area.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), "image/jpeg", quality);
  });
}
