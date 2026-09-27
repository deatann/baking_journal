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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const next = searchParams.get("next") || "/recipes";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border-2 border-crust-200 bg-white p-8 shadow-lg">
        <h1 className="mb-0 font-display text-2xl font-bold text-crust-800">
          🍞 Baking Journal
        </h1>
        <p className="mb-6 font-hand text-xl text-berry-600">your recipes, your way</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-crust-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none focus:ring-1 focus:ring-crust-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-crust-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-crust-200 px-3 py-2 text-sm focus:border-crust-500 focus:outline-none focus:ring-1 focus:ring-crust-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-crust-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-crust-700 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-xs text-crust-400">
          This is a private, single-user app. Your account was created directly in the
          Supabase dashboard - there's no public sign-up.
        </p>
      </div>
    </div>
  );
}
