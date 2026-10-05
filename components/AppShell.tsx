"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "./Avatar";
import ProfileSheet from "./ProfileSheet";

export interface ShellMe {
  id: string;
  name: string;
  avatarUrl: string | null;
}

const ADD_OPTIONS = [
  { href: "/import", icon: "📝", title: "Text", hint: "Paste a recipe text", bg: "bg-butter-300" },
  { href: "/scan", icon: "📷", title: "Scan", hint: "Photo or screenshots of a recipe", bg: "bg-sage-100" },
  { href: "/journal/new", icon: "🥐", title: "Log bake", hint: "Record what you baked today", bg: "bg-peach-100" },
];

const NAV_ICON = "h-[26px] w-[26px] fill-none stroke-current";

export default function AppShell({ me, children }: { me: ShellMe; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hideAvatar, setHideAvatar] = useState(false);

  const newActive =
    pathname.startsWith("/import") ||
    pathname.startsWith("/scan") ||
    pathname === "/journal/new" ||
    pathname === "/recipes/new";
  const recipesActive = pathname.startsWith("/recipes") && pathname !== "/recipes/new";
  const journalActive = pathname.startsWith("/journal") && pathname !== "/journal/new";

  // Phone: the floating chibi hides while scrolling down and returns on scroll up / at the top.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const d = y - last;
      if (y < 24 || d < -6) setHideAvatar(false);
      else if (d > 6) {
        setHideAvatar(true);
        setMenuOpen(false);
      }
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setAddOpen(false);
    setMenuOpen(false);
    setHideAvatar(false);
  }, [pathname]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const accountMenu = (
    <div className="absolute z-40 min-w-[190px] animate-drop rounded-2xl border-[1.5px] border-line bg-white p-1.5 shadow-pop">
      <div className="mb-1 border-b border-dashed border-crust-200 px-3 pb-2 pt-1.5 text-xs font-bold text-crust-500">
        Signed in as
        <div className="text-sm font-extrabold text-ink">{me.name}</div>
      </div>
      <button
        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-extrabold text-crust-600 hover:bg-peach-100"
        onClick={() => {
          setMenuOpen(false);
          setProfileOpen(true);
        }}
      >
        Edit profile &amp; chibi
      </button>
      <button
        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-extrabold text-crust-600 hover:bg-peach-100"
        onClick={signOut}
      >
        Sign out
      </button>
    </div>
  );

  const addList = (
    <>
      {ADD_OPTIONS.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          onClick={() => setAddOpen(false)}
          className="press flex items-center gap-3 rounded-2xl p-2.5 hover:bg-peach-100"
        >
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border-[1.5px] border-line text-[22px] ${o.bg}`}>
            {o.icon}
          </span>
          <span>
            <b className="block font-display text-[17px] font-bold leading-tight">{o.title}</b>
            <small className="text-xs font-semibold text-crust-500">{o.hint}</small>
          </span>
        </Link>
      ))}
    </>
  );

  const navBtn = (active: boolean) =>
    `press rounded-full border-[1.5px] px-4 py-1.5 text-sm font-extrabold ${
      active ? "border-line bg-butter-300 text-ink" : "border-transparent text-crust-600 hover:bg-crust-100"
    }`;

  return (
    <>
      {(addOpen || menuOpen) && (
        <div
          className="fixed inset-0 z-30 bg-ink/25"
          onClick={() => {
            setAddOpen(false);
            setMenuOpen(false);
          }}
        />
      )}

      {/* ---------- desktop top bar ---------- */}
      <header className="fixed inset-x-0 top-0 z-30 hidden h-16 border-b-[1.5px] border-crust-200 bg-crust-50/95 backdrop-blur md:block">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-6">
          <div className="relative flex items-center gap-2.5">
            <button
              onClick={() => {
                setAddOpen(false);
                setMenuOpen((v) => !v);
              }}
              aria-label="Account menu"
              className="press block rounded-full transition-transform hover:-rotate-6 hover:scale-105"
            >
              <Avatar name={me.name} url={me.avatarUrl} size={44} />
            </button>
            <Link href="/recipes" className="font-display text-[22px] font-bold text-crust-600">
              Baking Journal
            </Link>
            {menuOpen && <div className="absolute left-0 top-14">{accountMenu}</div>}
          </div>
          <nav className="relative flex items-center gap-1.5">
            <Link href="/recipes" className={navBtn(recipesActive)}>
              Recipes
            </Link>
            <button
              onClick={() => {
                setMenuOpen(false);
                setAddOpen((v) => !v);
              }}
              className={navBtn(newActive || addOpen)}
            >
              New ▾
            </button>
            <Link href="/journal" className={navBtn(journalActive)}>
              Journal
            </Link>
            {addOpen && (
              <div className="absolute right-16 top-14 z-40 w-80 animate-drop rounded-3xl border-[1.5px] border-line bg-white p-2.5 shadow-pop">
                {addList}
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ---------- phone: floating chibi ---------- */}
      <div
        className={`fixed left-3 top-3 z-30 transition-all duration-200 md:hidden ${
          hideAvatar ? "pointer-events-none -translate-y-20 opacity-0" : ""
        }`}
        style={{ top: "max(12px, env(safe-area-inset-top))" }}
      >
        <button
          onClick={() => {
            setAddOpen(false);
            setMenuOpen((v) => !v);
          }}
          aria-label="Account menu"
          className="press block rounded-full"
        >
          <Avatar name={me.name} url={me.avatarUrl} size={48} />
        </button>
        {menuOpen && <div className="absolute left-0 top-14">{accountMenu}</div>}
      </div>

      {/* ---------- phone: + menu and bottom bar ---------- */}
      {addOpen && (
        <div
          className="fixed left-1/2 z-40 w-[min(calc(100%-28px),340px)] -translate-x-1/2 animate-pop rounded-3xl border-[1.5px] border-line bg-white p-2.5 shadow-pop md:hidden"
          style={{ bottom: "calc(98px + env(safe-area-inset-bottom))" }}
        >
          {addList}
        </div>
      )}
      <nav
        className="fixed left-1/2 z-40 flex h-16 w-[min(calc(100%-28px),340px)] -translate-x-1/2 items-center justify-around rounded-full border-[1.5px] border-line bg-white shadow-pop md:hidden"
        style={{ bottom: "calc(14px + env(safe-area-inset-bottom))" }}
      >
        <Link
          href="/recipes"
          aria-label="Recipes"
          className={`press grid h-12 w-12 place-items-center rounded-full ${
            recipesActive ? "bg-butter-300 text-ink ring-[1.5px] ring-line" : "text-crust-600"
          }`}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={NAV_ICON}>
            <path d="M3.5 11 12 4l8.5 7" />
            <path d="M5.5 10v9.5h13V10" />
            <path d="M10 19.5v-5h4v5" />
          </svg>
        </Link>
        <button
          aria-label="Add"
          onClick={() => {
            setMenuOpen(false);
            setAddOpen((v) => !v);
          }}
          className={`press -mt-[22px] grid h-[60px] w-[60px] place-items-center rounded-full border-[1.5px] border-line text-ink shadow-inkpop ${
            addOpen ? "bg-peach-300" : "bg-sage-400"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            strokeWidth="2.8"
            strokeLinecap="round"
            className={`h-[30px] w-[30px] fill-none stroke-current transition-transform ${addOpen ? "rotate-45" : ""}`}
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <Link
          href="/journal"
          aria-label="Journal"
          className={`press grid h-12 w-12 place-items-center rounded-full ${
            journalActive ? "bg-butter-300 text-ink ring-[1.5px] ring-line" : "text-crust-600"
          }`}
        >
          <svg viewBox="0 0 24 24" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className={NAV_ICON}>
            <path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5 2-1.5 5-1.9 8-1.5V5c-3-.4-6 0-8 1.5Z" />
            <path d="M12 6.5v13" />
          </svg>
        </Link>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-40 pt-4 sm:px-6 md:pb-16 md:pt-24">{children}</main>

      {profileOpen && <ProfileSheet me={me} onClose={() => setProfileOpen(false)} />}
    </>
  );
}
