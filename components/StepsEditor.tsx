"use client";

interface Props {
  steps: string[];
  onChange: (steps: string[]) => void;
}

export default function StepsEditor({ steps, onChange }: Props) {
  function updateStep(i: number, value: string) {
    const next = [...steps];
    next[i] = value;
    onChange(next);
  }

  function removeStep(i: number) {
    onChange(steps.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex flex-col items-center gap-1 pt-1.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-crust-100 text-xs font-medium text-crust-700">
              {i + 1}
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-[10px] leading-none text-crust-400 hover:text-crust-700 disabled:opacity-20"
                aria-label="Move step up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === steps.length - 1}
                className="text-[10px] leading-none text-crust-400 hover:text-crust-700 disabled:opacity-20"
                aria-label="Move step down"
              >
                ▼
              </button>
            </div>
          </div>
          <textarea
            value={step}
            onChange={(e) => updateStep(i, e.target.value)}
            rows={2}
            className="flex-1 resize-y rounded-md border border-crust-200 px-2 py-1.5 text-sm focus:border-crust-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => removeStep(i)}
            className="self-start rounded-md px-2 py-1.5 text-crust-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Remove step"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...steps, ""])}
        className="rounded-lg border border-dashed border-crust-300 px-3 py-1.5 text-sm text-crust-600 hover:bg-crust-50"
      >
        + Add step
      </button>
    </div>
  );
}
