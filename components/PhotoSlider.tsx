"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Horizontal photo strip with a live "2/3" counter and semi-transparent arrows.
// An arrow is hidden when there is nothing further in that direction.
export default function PhotoSlider({ urls }: { urls: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const n = urls.length;

  const update = useCallback(() => {
    const el = ref.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
  }, [n]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function go(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  }

  const arrow =
    "press absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/60 text-xl font-extrabold leading-none text-ink backdrop-blur-sm hover:bg-white/90";

  return (
    <>
      <div
        ref={ref}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {urls.map((url, i) => (
          <img key={i} src={url} alt="" loading="lazy" className="h-full w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {n > 1 && (
        <>
          <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-extrabold text-white">
            {index + 1}/{n}
          </span>
          {index > 0 && (
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-2`}>
              ‹
            </button>
          )}
          {index < n - 1 && (
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-2`}>
              ›
            </button>
          )}
        </>
      )}
    </>
  );
}
