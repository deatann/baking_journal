"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import PhotoSlider from "@/components/PhotoSlider";
import { JOURNAL_PAGE_SIZE } from "@/lib/journalConfig";

export interface JournalItem {
  id: string;
  userId: string;
  who: string;
  whoAvatar: string | null;
  recipeId: string | null;
  title: string;
  bakedOn: string;
  scale: number;
  rating: number | null;
  notes: string;
  photoPaths: string[];
  emoji: string;
}

export interface Person {
  id: string;
  name: string;
  avatarUrl: string | null;
}

function fmtDate(d: string) {
  // baked_on is a plain date (YYYY-MM-DD); format in UTC so it never shifts a day.
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const TILES = ["bg-butter-200", "bg-peach-200", "bg-sage-200", "bg-sky-200", "bg-plum-200"];

export default function JournalBrowser({
  items,
  people,
  meId,
  initialUrls,
}: {
  items: JournalItem[];
  people: Person[];
  meId: string;
  initialUrls: Record<string, string>;
}) {
  const router = useRouter();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [who, setWho] = useState<string>("all");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<JournalItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [shown, setShown] = useState(JOURNAL_PAGE_SIZE);
  const [fetchedUrls, setFetchedUrls] = useState<Record<string, string>>({});
  const requested = useRef<Set<string>>(new Set());

  // Close the ⋯ menu on any outside tap.
  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuFor]);

  const live = useMemo(() => items.filter((i) => !removed.has(i.id)), [items, removed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return live.filter(
      (i) =>
        (who === "all" || i.userId === who) &&
        (q === "" || i.title.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q)),
    );
  }, [live, query, who]);

  // Only the bakes on screen get photo links (and download photos).
  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown]);
  const urlFor = (path: string) => initialUrls[path] ?? fetchedUrls[path];

  useEffect(() => {
    const need = visible
      .flatMap((b) => b.photoPaths)
      .filter((p) => !initialUrls[p] && !fetchedUrls[p] && !requested.current.has(p));
    if (need.length === 0) return;
    need.forEach((p) => requested.current.add(p));
    createClient()
      .storage.from("bake-photos")
      .createSignedUrls(need, 60 * 60)
      .then(({ data }) => {
        const add: Record<string, string> = {};
        for (const d of data ?? []) if (d.path && d.signedUrl) add[d.path] = d.signedUrl;
        setFetchedUrls((prev) => ({ ...prev, ...add }));
      });
  }, [visible, initialUrls, fetchedUrls]);

  // Put "me" first in the people filter.
  const orderedPeople = useMemo(
    () => [...people].sort((a, b) => (a.id === meId ? -1 : b.id === meId ? 1 : a.name.localeCompare(b.name))),
    [people, meId],
  );

  async function confirmDelete() {
    if (!confirming) return;
    setDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error } = await supabase.from("bakes").delete().eq("id", confirming.id);
    if (error) {
      setDeleting(false);
      setDeleteError(error.message);
      return;
    }
    // Row is gone; clean up the photo files too (best effort - a leftover file is harmless).
    if (confirming.photoPaths.length > 0) {
      await supabase.storage.from("bake-photos").remove(confirming.photoPaths);
    }
    setRemoved((prev) => new Set(prev).add(confirming.id));
    setConfirming(null);
    setDeleting(false);
    router.refresh();
  }

  const filtering = who !== "all" || query.trim() !== "";

  return (
    <div>
      <PageHeader title="Journal" hand="every bake, remembered" />

      {live.length === 0 ? (
        <EmptyState title="No bakes yet" text="Tap + and choose Log bake to add the first one.">
          <Link href="/journal/new" className="btn btn-primary mt-2">
            Log bake
          </Link>
        </EmptyState>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(JOURNAL_PAGE_SIZE);
            }}
            placeholder="Search bakes..."
            className="field mb-2.5 md:max-w-md"
          />

          {orderedPeople.length > 1 && (
            <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => {
                  setWho("all");
                  setShown(JOURNAL_PAGE_SIZE);
                }}
                className={`press shrink-0 rounded-full border-[1.5px] px-3.5 py-1.5 text-[13px] font-extrabold ${
                  who === "all" ? "border-line bg-butter-300" : "border-crust-300 bg-white"
                }`}
              >
                Everyone
              </button>
              {orderedPeople.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setWho(who === p.id ? "all" : p.id);
                    setShown(JOURNAL_PAGE_SIZE);
                  }}
                  className={`press flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] py-1 pl-1 pr-3 text-[13px] font-extrabold ${
                    who === p.id ? "border-line bg-butter-300" : "border-crust-300 bg-white"
                  }`}
                >
                  <Avatar name={p.name} url={p.avatarUrl} size={24} />
                  {p.id === meId ? "Me" : p.name}
                </button>
              ))}
            </div>
          )}

          <p className="mb-3 text-xs font-bold text-crust-500">
            {filtering ? `Showing ${filtered.length} of ${live.length} bakes` : `${live.length} bake${live.length === 1 ? "" : "s"}`}
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setWho("all");
                  setShown(JOURNAL_PAGE_SIZE);
                }}
                className="ml-2 font-extrabold text-peach-500 underline"
              >
                Clear
              </button>
            )}
          </p>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-crust-500">No bakes match.</p>
          ) : (
            <div className="-mx-4 grid grid-cols-1 gap-5 sm:-mx-6 md:mx-0 md:grid-cols-[repeat(auto-fit,minmax(240px,280px))] md:justify-center md:gap-6">
              {visible.map((bake, idx) => {
                const own = bake.userId === meId;
                const urls = bake.photoPaths.map(urlFor).filter((u): u is string => !!u);
                return (
                  <article
                    key={bake.id}
                    className="overflow-hidden border-y-[1.5px] border-line bg-white md:rounded-[20px] md:border-[1.5px] md:shadow-pop"
                  >
                    <div className="relative aspect-[3/4] bg-crust-100">
                      {urls.length > 0 ? (
                        <PhotoSlider urls={urls} />
                      ) : bake.photoPaths.length > 0 ? (
                        <div className="h-full w-full animate-pulse bg-crust-100" aria-label="Loading photos" />
                      ) : (
                        <div className={`grid h-full w-full place-items-center text-7xl ${TILES[idx % TILES.length]}`}>
                          {bake.emoji}
                        </div>
                      )}
                      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-2 rounded-full bg-white/90 py-1 pl-1 pr-3 shadow">
                        <Avatar name={bake.who} url={bake.whoAvatar} size={28} />
                        <span className="leading-tight">
                          <span className="block text-[12px] font-extrabold text-ink">{bake.who}</span>
                          <span className="block text-[11px] font-bold text-crust-500">{fmtDate(bake.bakedOn)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="relative px-3.5 pb-4 pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="min-w-0 font-display text-lg font-bold leading-tight">
                          {bake.recipeId ? (
                            <Link
                              href={`/recipes/${bake.recipeId}`}
                              className="underline decoration-crust-300 decoration-2 underline-offset-2"
                            >
                              {bake.title}
                            </Link>
                          ) : (
                            bake.title
                          )}
                        </h2>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {bake.scale !== 1 && (
                            <span className="rounded-full border-[1.5px] border-line bg-sky-100 px-2 py-0.5 text-[11px] font-extrabold">
                              ×{bake.scale}
                            </span>
                          )}
                          {own && (
                            <button
                              type="button"
                              aria-label="More options"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuFor(menuFor === bake.id ? null : bake.id);
                              }}
                              className="press grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-line bg-white text-lg font-black leading-none text-crust-600"
                            >
                              ⋯
                            </button>
                          )}
                        </div>
                      </div>

                      {own && menuFor === bake.id && (
                        <div className="absolute right-3 top-14 z-20 animate-drop overflow-hidden rounded-2xl border-[1.5px] border-line bg-white shadow-pop">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuFor(null);
                              setDeleteError(null);
                              setConfirming(bake);
                            }}
                            className="press flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-extrabold text-red-600 active:bg-red-50"
                          >
                            <span aria-hidden>🗑</span> Delete bake
                          </button>
                        </div>
                      )}

                      {bake.rating ? (
                        <p className="mt-0.5 text-sm tracking-widest text-mustard-500" aria-label={`${bake.rating} of 5 stars`}>
                          {"★".repeat(bake.rating)}
                          <span className="text-crust-200">{"★".repeat(5 - bake.rating)}</span>
                        </p>
                      ) : null}
                      {bake.notes && <p className="mt-1.5 line-clamp-3 text-[14px] text-crust-700">{bake.notes}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {filtered.length > shown && (
            <div className="mt-6 text-center">
              <button type="button" onClick={() => setShown((n) => n + JOURNAL_PAGE_SIZE)} className="btn btn-ghost">
                Show more ({filtered.length - shown} left)
              </button>
            </div>
          )}
        </>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 md:items-center"
          onClick={(e) => e.target === e.currentTarget && !deleting && setConfirming(null)}
        >
          <div className="w-full max-w-md animate-up rounded-t-[26px] border-[1.5px] border-b-0 border-line bg-white p-5 pb-8 md:animate-pop md:rounded-[22px] md:border-b-[1.5px] md:pb-5">
            <h2 className="font-display text-xl font-bold">Delete this bake?</h2>
            <p className="mb-4 mt-1 text-sm text-crust-700">
              &ldquo;{confirming.title}&rdquo;
              {confirming.photoPaths.length > 0
                ? ` and its ${confirming.photoPaths.length} photo${confirming.photoPaths.length === 1 ? "" : "s"}`
                : ""}{" "}
              will be removed for everyone. This can&apos;t be undone.
            </p>
            {deleteError && <p className="mb-3 text-sm font-bold text-red-600">{deleteError}</p>}
            <div className="flex gap-2.5">
              <button className="btn btn-ghost flex-1" disabled={deleting} onClick={() => setConfirming(null)}>
                Cancel
              </button>
              <button
                className="btn flex-1 !bg-red-600 !text-white"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
