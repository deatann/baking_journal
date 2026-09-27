"use client";

import { ParsedRecipe } from "@/lib/parseRecipeText";

interface Props {
  parsed: ParsedRecipe;
  previewUrl?: string | string[] | null;
  onConfirm: () => void;
  onReset: () => void;
  resetLabel: string;
  sourceNote: string; // e.g. "in that image" or "in that text"
  /** Which parser actually produced this result, so it's never a silent guess. */
  parsedBy?: "ai" | "local";
  /** Set when the AI parser was tried first and failed over to the local one. */
  aiFallbackReason?: string | null;
}

export default function ParsedRecipeReview({
  parsed,
  previewUrl,
  onConfirm,
  onReset,
  resetLabel,
  sourceNote,
  parsedBy,
  aiFallbackReason,
}: Props) {
  return (
    <div className="space-y-5">
      {parsedBy === "local" && aiFallbackReason && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          AI parser unavailable ({aiFallbackReason}) - used the local parser instead. Double-check
          this one a bit more carefully than usual.
        </div>
      )}
      <div className="flex gap-4 rounded-xl border border-crust-200 p-4">
        {previewUrl && Array.isArray(previewUrl) ? (
          <div className="flex shrink-0 -space-x-6">
            {previewUrl.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Source ${i + 1}`}
                className="h-24 w-24 rounded-lg border-2 border-white object-cover shadow-sm"
                style={{ zIndex: previewUrl.length - i }}
              />
            ))}
          </div>
        ) : (
          previewUrl && (
            <img src={previewUrl} alt="Source" className="h-24 w-24 rounded-lg object-cover" />
          )
        )}
        <div>
          <p className="text-sm font-medium text-crust-700">Guessed title</p>
          <p className="text-crust-800">{parsed.title}</p>
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-crust-700">
          Ingredients found ({parsed.ingredients.length})
        </p>
        <ul className="rounded-lg border border-crust-200 divide-y divide-crust-100">
          {parsed.ingredients.map((ing) => (
            <li key={ing.id} className="px-3 py-2 text-sm text-crust-700">
              {ing.qtyRaw && <span className="font-medium">{ing.qtyRaw} </span>}
              {ing.unit && <span className="text-crust-500">{ing.unit} </span>}
              {ing.name}
              {ing.note && <span className="text-crust-400"> ({ing.note})</span>}
            </li>
          ))}
          {parsed.ingredients.length === 0 && (
            <li className="px-3 py-2 text-sm text-crust-400">None detected - you'll add these manually.</li>
          )}
        </ul>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-crust-700">Steps found ({parsed.steps.length})</p>
        <ol className="list-decimal space-y-1 rounded-lg border border-crust-200 p-3 pl-8 text-sm text-crust-700">
          {parsed.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {parsed.steps.length === 0 && (
          <p className="text-sm text-crust-400">None detected - you'll add these manually.</p>
        )}
      </div>

      {parsed.unparsedLines.length > 0 && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <p className="mb-1 font-medium">Couldn&apos;t confidently place these lines:</p>
          <ul className="list-disc pl-5">
            {parsed.unparsedLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs">
            They&apos;ll be added to the recipe&apos;s notes so nothing gets lost - move them
            into ingredients or steps on the next screen if needed.
          </p>
        </div>
      )}

      <p className="text-xs text-crust-400">
        This is a best-effort guess at what was {sourceNote} - always check it on the next
        screen before saving.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="rounded-full bg-crust-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md"
        >
          Looks good - review &amp; save
        </button>
        <button
          onClick={onReset}
          className="rounded-full border-2 border-crust-300 px-4 py-2 text-sm font-semibold text-crust-700 transition-transform hover:-translate-y-0.5 hover:bg-crust-100"
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
