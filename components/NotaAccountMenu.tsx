"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useNotaAuth } from "@/hooks/useNotaAuth";
import { isNotaApiConfigured } from "@/lib/config/api";

function AccountIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function NotaAccountMenu() {
  const auth = useNotaAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!isNotaApiConfigured() || auth.loading) {
    return null;
  }

  if (!auth.authenticated) {
    return (
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-sm p-2.5 text-zinc-400 ring-1 ring-zinc-200/80 transition hover:bg-white hover:text-zinc-600"
        aria-label="Sign in to NOTA"
        title="Sign in"
      >
        <AccountIcon />
      </Link>
    );
  }

  const signedInLabel = auth.email ?? (auth.source === "env" ? "Server token" : "Signed in");

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Signed in as ${signedInLabel}`}
        title={`Signed in as ${signedInLabel}`}
        className={`inline-flex items-center justify-center rounded-sm p-2.5 transition ${
          open
            ? "bg-emerald-700 text-white shadow-sm"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        <AccountIcon />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-sm bg-white p-3 shadow-lg ring-1 ring-zinc-200"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Admin</p>
          <p className="mt-1 truncate text-sm font-medium text-zinc-900">{signedInLabel}</p>
          <p className="mt-0.5 text-xs text-emerald-700">Signed in to NOTA</p>

          {auth.source === "supabase" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void auth.signOut();
              }}
              className="mt-3 w-full rounded-sm border border-zinc-200 px-3 py-2 text-left text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
