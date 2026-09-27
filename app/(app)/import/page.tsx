"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseRecipeText, ParsedRecipe } from "@/lib/parseRecipeText";
import { parseWithLLM } from "@/lib/llmParse";
import { saveRecipeDraft } from "@/lib/recipeDraft";
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
      <h1 className="mb-2 font-display text-2xl font-bold text-crust-800">Import from text</h1>
      <p className="mb-6 text-sm text-crust-500">
        Copy a recipe from Notion, a website, or a text message and paste the whole thing
        below. Works best when the ingredients and steps are on separate lines - it uses the
        same best-effort parser as Scan &amp; Convert, so check the result before saving.
      </p>

      {stage === "input" && (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            placeholder={
              "Brown Butter Chocolate Chip Cookies\n\nIngredients\n1 cup butter, browned\n2 cups flour\n1 cup brown sugar, packed\n...\n\nInstructions\n1. Brown the butter and let cool\n2. Mix dry ingredients\n..."
            }
            className="w-full resize-y rounded-lg border border-crust-200 px-3 py-2 font-mono text-sm focus:border-crust-500 focus:outline-none focus:ring-1 focus:ring-crust-500"
          />
          <button
            onClick={handleParse}
            disabled={!text.trim()}
            className="rounded-full bg-crust-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Parse recipe
          </button>
        </div>
      )}

      {stage === "parsing" && (
        <div className="rounded-xl border border-crust-200 p-10 text-center text-sm text-crust-600">
          Parsing with AI...
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
