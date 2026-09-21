"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/store";

type Mode = "login" | "register";

const DEMO = [
  { label: "Ada Whitfield", email: "ada@inkwell.dev" },
  { label: "Milo Reyes", email: "milo@inkwell.dev" },
  { label: "Jun Park", email: "jun@inkwell.dev" },
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
    });

    const data = (await response.json().catch(() => ({}))) as { user?: PublicUser; error?: string };
    setBusy(false);

    if (!response.ok || !data.user) {
      setError(data.error ?? "That did not work. Try again.");
      return;
    }

    // Mirrors the session for instant client-side hydration; the httpOnly
    // cookie issued by the API remains the source of truth for the server.
    window.localStorage.setItem("inkwell:user", JSON.stringify(data.user));
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="card p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-white">
          {mode === "login" ? "Sign in to Inkwell" : "Join Inkwell"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {mode === "login"
            ? "Sessions are local: an httpOnly cookie backed by a signed-in record in your JSON store."
            : "No external database, no verification email. Your account is written to the local store with a hashed password."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" ? (
            <div>
              <label className="label" htmlFor="name">
                Display name
              </label>
              <input
                id="name"
                className="field"
                placeholder="Ada Whitfield"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
              />
            </div>
          ) : null}

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field"
              placeholder={mode === "register" ? "At least 6 characters, 1 number" : "••••••••"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {mode === "login" ? (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Demo accounts</p>
            <p className="mt-1 text-xs text-slate-500">
              Password for all seeded writers: <code className="text-fuchsia-200">password123</code>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword("password123");
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/register" className="text-violet-300 hover:text-violet-200">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link href="/login" className="text-violet-300 hover:text-violet-200">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
