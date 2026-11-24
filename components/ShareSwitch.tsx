"use client";

// On/off switch used for "Share on the guest page". Off by default everywhere.
export default function ShareSwitch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="press flex items-center gap-2.5 text-left"
      >
        <span
          className={`relative h-[26px] w-11 shrink-0 rounded-full border-[1.5px] border-line transition-colors ${
            checked ? "bg-sage-400" : "bg-crust-200"
          }`}
        >
          <span
            className={`absolute top-[2px] h-[19px] w-[19px] rounded-full border-[1.5px] border-line bg-white transition-all ${
              checked ? "left-[20px]" : "left-[2px]"
            }`}
          />
        </span>
        <span className="text-sm font-extrabold text-ink">{label}</span>
      </button>
      {hint && <p className="mt-1.5 text-xs text-crust-500">{hint}</p>}
    </div>
  );
}
