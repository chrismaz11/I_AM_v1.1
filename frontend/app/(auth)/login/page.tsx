'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const errorParam = params.get("error");
  const [email, setEmail] = useState("user@iam.demo");
  const [password, setPassword] = useState("user123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-soft rounded-2xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-ink-900">Welcome back</h1>
          <p className="text-ink-500">Access your credential wallet.</p>
        </div>

        {(error || errorParam) && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error ?? errorParam}
          </p>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:ring-2 focus:ring-accent-400 focus:border-accent-500 outline-none transition"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:ring-2 focus:ring-accent-400 focus:border-accent-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ink-900 text-white py-2.5 font-semibold transition hover:bg-ink-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center text-ink-500">
          No account yet?{" "}
          <Link href="/register" className="text-accent-500 font-medium hover:underline">
            Create one
          </Link>
        </p>

        <div className="text-xs text-ink-500 bg-ink-200/60 rounded-lg p-3">
          Demo accounts: <br />
          • user@iam.demo / user123 <br />
          • verifier@iam.demo / verify123 <br />
          • admin@iam.demo / admin123
        </div>
      </div>
    </main>
  );
}
