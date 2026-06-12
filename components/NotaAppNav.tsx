"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Controller" },
  { href: "/players", label: "Players" },
  { href: "/scores", label: "Scores" },
] as const;

export function NotaAppNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="inline-flex rounded-sm bg-zinc-100 p-1 ring-1 ring-zinc-200/80"
      aria-label="NOTA Games sections"
    >
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-sm px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
