"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import { ParsedRecipe } from "@/lib/parseRecipeText";
import { parseImagesWithLLM } from "@/lib/llmParse";
import { saveRecipeDraft } from "@/lib/recipeDraft";
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
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-display text-2xl font-bold text-crust-800">Scan &amp; Convert</h1>
      <p className="mb-6 text-sm text-crust-500">
        Upload a screenshot of a recipe - or several, if it took more than one screenshot to
        capture the whole thing (e.g. a long Instagram caption). They get read together by AI as
        one recipe, but always check the result before saving.{" "}
        <a href="/import" className="underline hover:text-crust-700">
          Pasting text from Notion or a website instead? Use text import.
        </a>
      </p>

      {stage === "idle" && (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-crust-300 p-10 text-center text-crust-500 hover:bg-crust-50">
          <span className="text-3xl">📷</span>
          <span className="font-medium text-crust-700">Choose recipe screenshot(s)</span>
          <span className="text-xs">JPG, PNG, or phone screenshots - up to {MAX_IMAGES} at once</span>
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
        </label>
      )}

      {(stage === "uploading" || stage === "scanning") && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-crust-200 p-10 text-center">
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {previewUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="h-24 max-h-24 rounded-lg object-contain"
                />
              ))}
            </div>
          )}
          <p className="text-sm text-crust-600">
            {stage === "uploading"
              ? "Uploading..."
              : `Reading the recipe with AI${previewUrls.length > 1 ? ` (${previewUrls.length} images)` : ""}... (this can take a few seconds)`}
          </p>
        </div>
      )}

      {stage === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-3 text-sm text-red-700">{error}</p>
          <button
            onClick={reset}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
          >
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
