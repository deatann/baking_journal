"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import { ParsedRecipe } from "@/lib/parseRecipeText";
import { parseImagesWithLLM } from "@/lib/llmParse";
import { saveRecipeDraft } from "@/lib/recipeDraft";
import PageHeader from "@/components/PageHeader";
import ParsedRecipeReview from "@/components/ParsedRecipeReview";

type Stage = "idle" | "uploading" | "scanning" | "review" | "error";

const MAX_IMAGES = 5;

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [sourceImagePath, setSourceImagePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    setError(null);
    setParsed(null);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));

    if (files.length > MAX_IMAGES) {
      setError(`Pick at most ${MAX_IMAGES} images at once - you picked ${files.length}.`);
      setStage("error");
      return;
    }

    try {
      setStage("uploading");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      // Compress every image: each compressed copy is sent to the AI scanner,
      // and the first one is also kept in the recipe-scans bucket as "the"
      // source screenshot (only one is stored even when several were used).
      const compressed = await Promise.all(
        files.map((f) => compressImage(f, { maxDimension: 1800, quality: 0.85 })),
      );

      const path = `${user.id}/${Date.now()}-scan.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-scans")
        .upload(path, compressed[0], { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      setSourceImagePath(path);

      setStage("scanning");
      const images = await Promise.all(
        compressed.map(async (blob) => ({
          base64: await blobToBase64(blob),
          mimeType: "image/jpeg",
        })),
      );
      setParsed(await parseImagesWithLLM(images));
      setStage("review");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong.");
      setStage("error");
    }
  }

  function useThisRecipe() {
    if (!parsed) return;
    saveRecipeDraft(parsed, sourceImagePath);
    router.push("/recipes/new?fromScan=1");
  }

  function reset() {
    setStage("idle");
    setPreviewUrls([]);
    setParsed(null);
    setSourceImagePath(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New recipe" hand="from a photo" />

      {stage === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-crust-600">
            Take a photo, or choose screenshots (up to {MAX_IMAGES}). Several images are read together as one recipe.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn btn-primary">
              Take photo
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-ghost">
              Choose screenshots
            </button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) handleFiles(files);
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) handleFiles(files);
            }}
          />
        </div>
      )}

      {(stage === "uploading" || stage === "scanning") && (
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {previewUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="h-24 w-24 rounded-xl border-[1.5px] border-line object-cover"
                />
              ))}
            </div>
          )}
          <img src="/brand/scene.jpg" alt="" className="h-20 w-20 animate-bob rounded-full border-[1.5px] border-line object-cover" />
          <p className="font-hand text-2xl font-bold text-peach-500">
            {stage === "uploading" ? "Uploading..." : `Reading ${previewUrls.length} image${previewUrls.length === 1 ? "" : "s"}...`}
          </p>
        </div>
      )}

      {stage === "error" && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6 text-center">
          <p className="mb-3 text-sm font-bold text-red-700">{error}</p>
          <button onClick={reset} className="btn btn-ghost">
            Try again
          </button>
        </div>
      )}

      {stage === "review" && parsed && (
        <ParsedRecipeReview
          parsed={parsed}
          previewUrl={previewUrls.length > 1 ? previewUrls : previewUrls[0]}
          onConfirm={useThisRecipe}
          onReset={reset}
          resetLabel="Scan different image(s)"
          sourceNote={previewUrls.length > 1 ? "in those images" : "in that image"}
          parsedBy="ai"
        />
      )}
    </div>
  );
}
