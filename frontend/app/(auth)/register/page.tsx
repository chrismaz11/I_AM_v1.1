'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data?.error ?? "Failed to register");
      setLoading(false);
      return;
    }

    await signIn("credentials", { redirect: false, email, password });
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-soft rounded-2xl p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-ink-900">Create your wallet</h1>
          <p className="text-ink-500">Start with a secure identity and credential vault.</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </p>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink-700" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:ring-2 focus:ring-accent-400 focus:border-accent-500 outline-none transition"
              placeholder="Avery Lee"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink-700" htmlFor="email">
              Work email
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
              minLength={8}
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
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-center text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
