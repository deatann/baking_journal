"use client";

import { useState } from "react";
import { isStepHeading, stepHeadingText, makeStepHeading } from "@/lib/sections";
import SectionStrip from "./SectionStrip";

interface Props {
  steps: string[];
  onChange: (steps: string[]) => void;
}

export default function StepsEditor({ steps, onChange }: Props) {
  const [placing, setPlacing] = useState(false);

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

  function insertHeaderAt(index: number) {
    const next = [...steps];
    next.splice(index, 0, makeStepHeading(""));
    onChange(next);
    setPlacing(false);
  }

  const small =
    "grid h-8 w-8 place-items-center rounded-lg border-2 border-crust-200 bg-white text-[13px] text-crust-600 active:bg-peach-100 disabled:opacity-25";

  // Numbers restart after each section heading.
  let n = 0;

  return (
    <div className="space-y-3">
      {placing && <SectionStrip onClick={() => insertHeaderAt(0)} />}
      {steps.map((step, i) => {
        const heading = isStepHeading(step);
        if (heading) n = 0;
        else n += 1;
        return (
          <div key={i} className="space-y-3">
            {heading ? (
              <div className="flex items-center gap-2 rounded-2xl border-2 border-butter-300 bg-butter-100 p-2">
                <span className="pl-1 text-[11px] font-extrabold uppercase tracking-widest text-crust-500">Section</span>
                <input
                  type="text"
                  autoFocus={stepHeadingText(step) === ""}
                  placeholder="e.g. Cake, Frosting, Filling"
                  value={stepHeadingText(step)}
                  onChange={(e) => updateStep(i, makeStepHeading(e.target.value))}
                  className="field !h-10 min-w-0 flex-1 !px-3 font-extrabold"
                />
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={small} aria-label="Move section up">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === steps.length - 1}
                  className={small}
                  aria-label="Move section down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className={`${small} hover:text-red-500`}
                  aria-label="Remove section heading"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <span className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-line bg-butter-300 text-xs font-extrabold">
                  {n}
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
            )}
            {placing && i < steps.length - 1 && <SectionStrip onClick={() => insertHeaderAt(i + 1)} />}
          </div>
        );
      })}
      {placing && steps.length > 0 && <SectionStrip onClick={() => insertHeaderAt(steps.length)} />}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange([...steps, ""])} className="dashed-btn flex-1">
          + Add step
        </button>
        <button type="button" onClick={() => setPlacing((v) => !v)} className="dashed-btn flex-1">
          {placing ? "Cancel" : "+ Add section"}
        </button>
      </div>
      {placing && (
        <p className="text-xs text-crust-500">Tap where the new section should start. Sections are optional.</p>
      )}
    </div>
  );
}
