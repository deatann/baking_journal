"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/recipes", label: "Recipes", active: "bg-mustard-400 text-crust-900" },
  { href: "/scan", label: "Scan & Convert", active: "bg-sky-400 text-white" },
  { href: "/journal", label: "Journal", active: "bg-berry-400 text-white" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b-2 border-crust-200 bg-crust-50/90 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/recipes"
            className="shrink-0 font-display text-xl font-bold text-crust-800 transition-transform hover:-rotate-2 hover:scale-105"
          >
            🍞 Baking Journal
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                    active
                      ? `${link.active} shadow-sm`
                      : "text-crust-700 hover:bg-crust-100 hover:-translate-y-0.5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="ml-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-crust-500 hover:bg-crust-100"
            >
              Sign out
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
