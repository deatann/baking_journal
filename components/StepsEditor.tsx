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

  const small =
    "grid h-8 w-8 place-items-center rounded-lg border-2 border-crust-200 bg-white text-[13px] text-crust-600 active:bg-peach-100 disabled:opacity-25";

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-2.5">
          <span className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-butter-300 text-xs font-extrabold">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <textarea
              value={step}
              onChange={(e) => updateStep(i, e.target.value)}
              rows={2}
              className="field resize-y"
            />
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={small} aria-label="Move step up">
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === steps.length - 1}
                className={small}
                aria-label="Move step down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeStep(i)}
                className={`${small} ml-auto hover:text-red-500`}
                aria-label="Remove step"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={() => onChange([...steps, ""])} className="dashed-btn">
        + Add step
      </button>
    </div>
  );
}
