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
  const bake = [
    parsed.ovenTempC ? `${parsed.ovenTempC}°C` : null,
    parsed.bakeTimeMin ? `${parsed.bakeTimeMin} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const h = "mb-1.5 text-[11px] font-extrabold uppercase tracking-widest text-crust-500";

  return (
    <div className="space-y-5">
      {parsedBy === "local" && aiFallbackReason && (
        <div className="rounded-2xl border-2 border-mustard-300 bg-mustard-100 p-3 text-xs font-bold text-mustard-700">
          AI parser unavailable ({aiFallbackReason}) - used the local parser instead. It does not
          fill in bake time or temperature. Check this one more carefully than usual.
        </div>
      )}

      <div className="card flex gap-4 p-4">
        {previewUrl && Array.isArray(previewUrl) ? (
          <div className="flex shrink-0 -space-x-6">
            {previewUrl.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Source ${i + 1}`}
                className="h-24 w-24 rounded-xl border-2 border-ink object-cover"
                style={{ zIndex: previewUrl.length - i }}
              />
            ))}
          </div>
        ) : (
          previewUrl && (
            <img src={previewUrl} alt="Source" className="h-24 w-24 shrink-0 rounded-xl border-2 border-ink object-cover" />
          )
        )}
        <div className="min-w-0">
          {parsedBy === "ai" && (
            <span className="mb-1 inline-block whitespace-nowrap rounded-full border-2 border-ink bg-butter-300 px-2 py-0.5 text-[11px] font-extrabold">
              ✨ AI read this
            </span>
          )}
          <p className={h}>Guessed title</p>
          <p className="font-display text-lg font-bold leading-tight text-ink">{parsed.title}</p>
        </div>
      </div>

      <div>
        <p className={h}>Ingredients found ({parsed.ingredients.length})</p>
        <ul className="overflow-hidden rounded-2xl border-2 border-ink bg-white">
          {parsed.ingredients.map((ing, i) => (
            <li key={ing.id} className={`px-3 py-2 text-[15px] ${i > 0 ? "border-t border-crust-200" : ""}`}>
              {ing.qtyRaw && <span className="font-extrabold">{ing.qtyRaw} </span>}
              {ing.unit && <span className="font-bold text-crust-500">{ing.unit} </span>}
              {ing.name}
              {ing.note && <span className="ml-1 text-[13px] text-crust-400">{ing.note}</span>}
            </li>
          ))}
          {parsed.ingredients.length === 0 && (
            <li className="px-3 py-2 text-sm text-crust-400">None detected - you&apos;ll add these manually.</li>
          )}
        </ul>
      </div>

      <div>
        <p className={h}>Bake</p>
        <p className="rounded-2xl border-2 border-crust-200 bg-white px-3 py-2 text-[15px] font-bold">
          {bake || <span className="font-normal text-crust-400">Not found - you can add it on the next screen.</span>}
        </p>
      </div>

      <div>
        <p className={h}>Steps found ({parsed.steps.length})</p>
        {parsed.steps.length > 0 ? (
          <ol className="list-decimal space-y-1.5 rounded-2xl border-2 border-crust-200 bg-white p-3 pl-8 text-[15px]">
            {parsed.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-crust-400">None detected - you&apos;ll add these manually.</p>
        )}
      </div>

      {parsed.unparsedLines.length > 0 && (
        <div className="rounded-2xl border-2 border-mustard-300 bg-mustard-100 p-3 text-sm text-mustard-700">
          <p className="mb-1 font-extrabold">Couldn&apos;t confidently place these lines:</p>
          <ul className="list-disc pl-5">
            {parsed.unparsedLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs">
            They&apos;ll be added to the recipe&apos;s notes so nothing gets lost. Move them into
            ingredients or steps on the next screen if needed.
          </p>
        </div>
      )}

      <p className="text-xs text-crust-500">
        This is a best-effort guess at what was {sourceNote}. Check it on the next screen before saving.
      </p>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button onClick={onConfirm} className="btn btn-primary">
          Looks good - review &amp; save
        </button>
        <button onClick={onReset} className="btn btn-ghost">
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
