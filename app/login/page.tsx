"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const next = searchParams.get("next") || "/recipes";
    router.push(next);
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    const supabase = createClient();
    const next = searchParams.get("next") || "/recipes";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="mx-auto grid max-w-4xl pb-10 md:min-h-screen md:grid-cols-[1.1fr_1fr] md:items-center md:gap-9 md:px-6 md:pb-0">
      {/* hero: full-bleed on phones (the card overlaps its bottom edge), framed on desktop */}
      <div className="relative">
        <div className="h-[290px] overflow-hidden rounded-b-[44px] border-b-[1.5px] border-line bg-white md:h-auto md:rounded-[34px_34px_60px_60px/30px_30px_56px_56px] md:border-[1.5px]">
          <img
            src="/brand/scene.jpg"
            alt="Illustrated baker whisking batter in a cosy kitchen"
            className="h-full w-full object-cover object-[50%_30%] md:h-auto"
          />
        </div>
        <span className="absolute right-3.5 top-3.5 -rotate-6 rounded-xl border-[1.5px] border-line bg-butter-300 px-2.5 font-hand text-[26px] font-bold text-crust-600 md:-bottom-3.5 md:right-[-8px] md:top-auto">
          fresh batch!
        </span>
      </div>

      <div className="card relative z-10 mx-4 -mt-14 p-6 md:mx-0 md:mt-0 md:p-7">
        <h1 className="font-display text-[28px] font-bold leading-tight">Baking Journal</h1>
        <p className="mb-3 font-hand text-2xl font-bold text-peach-500">your recipes, your way</p>

        <form onSubmit={handleSubmit}>
          <label className="label mt-3">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
          <label className="label mt-3">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary mt-5 w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs font-bold text-crust-400">
          <span className="h-px flex-1 bg-crust-200" />
          or
          <span className="h-px flex-1 bg-crust-200" />
        </div>
        <button type="button" onClick={handleGoogle} className="btn btn-ghost w-full">
          Continue with Google
        </button>

        <p className="mt-4 text-xs text-crust-500">
          Family recipe book. Accounts are added by the owner - there&apos;s no public sign-up.
        </p>
      </div>
    </div>
  );
}
