"use client";

import { useState } from "react";
import type { useNotaAuth } from "@/hooks/useNotaAuth";

type NotaSignInProps = {
  auth: Pick<ReturnType<typeof useNotaAuth>, "signIn" | "loading" | "error">;
};

export function NotaSignIn({ auth }: NotaSignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await auth.signIn({ email: email.trim(), password });
    } catch {
      // error surfaced via auth.error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-sm bg-white p-5 ring-1 ring-zinc-200">
      <h2 className="font-display text-xl font-semibold text-zinc-900">Sign in to NOTA</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Sign in to start a session and link player phones.
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
            Email
          </span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-sm border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-500"
            placeholder="coach@example.com"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="rounded-sm border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-500"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || auth.loading}
          className="rounded-sm bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        {auth.error ? <p className="text-sm text-red-600">{auth.error}</p> : null}
      </form>
    </div>
  );
}
