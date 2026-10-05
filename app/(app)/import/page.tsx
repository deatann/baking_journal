"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseRecipeText, ParsedRecipe } from "@/lib/parseRecipeText";
import { parseWithLLM } from "@/lib/llmParse";
import { saveRecipeDraft } from "@/lib/recipeDraft";
import PageHeader from "@/components/PageHeader";
import ParsedRecipeReview from "@/components/ParsedRecipeReview";

type Stage = "input" | "parsing" | "review";

export default function ImportTextPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("input");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [parsedBy, setParsedBy] = useState<"ai" | "local">("ai");
  const [aiFallbackReason, setAiFallbackReason] = useState<string | null>(null);

  async function handleParse() {
    if (!text.trim()) return;
    setStage("parsing");
    try {
      const result = await parseWithLLM(text);
      setParsed(result);
      setParsedBy("ai");
      setAiFallbackReason(null);
    } catch (err: any) {
      setParsed(parseRecipeText(text));
      setParsedBy("local");
      setAiFallbackReason(err?.message ?? "unknown error");
    }
    setStage("review");
  }

  function useThisRecipe() {
    if (!parsed) return;
    saveRecipeDraft(parsed, null);
    router.push("/recipes/new?fromScan=1");
  }

  function reset() {
    setStage("input");
    setParsed(null);
    setAiFallbackReason(null);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New recipe" hand="from text" />

      {stage === "input" && (
        <div className="space-y-3">
          <p className="text-sm text-crust-600">Paste a recipe, in any text form</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            placeholder={
              "Brown Butter Chocolate Chip Cookies\n\nIngredients\n1 cup butter, browned\n2 cups flour\n...\n\nInstructions\n1. Brown the butter and let cool\n..."
            }
            className="field resize-y font-mono !text-sm"
          />
          <button onClick={handleParse} disabled={!text.trim()} className="btn btn-primary w-full sm:w-auto">
            Upload
          </button>
        </div>
      )}

      {stage === "parsing" && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <img src="/brand/scene.jpg" alt="" className="h-28 w-28 animate-bob rounded-full border-2 border-ink object-cover" />
          <p className="font-hand text-2xl font-bold text-peach-500">reading your recipe...</p>
        </div>
      )}

      {stage === "review" && parsed && (
        <ParsedRecipeReview
          parsed={parsed}
          onConfirm={useThisRecipe}
          onReset={reset}
          resetLabel="Start over"
          sourceNote="in that text"
          parsedBy={parsedBy}
          aiFallbackReason={aiFallbackReason}
        />
      )}
    </div>
  );
}
