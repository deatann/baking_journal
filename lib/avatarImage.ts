// Centre-crop any image to a square and shrink it to `size` px, so chibis are
// tiny (a few KB) and render as perfect circles everywhere.
export async function squareAvatar(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare the image.");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

  const toBlob = (type: string, q: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));

  const webp = await toBlob("image/webp", 0.9);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg", 0.9);
  if (!jpeg) throw new Error("Couldn't prepare the image.");
  return jpeg;
}
