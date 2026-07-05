"use client";

import { NotaAccountMenu } from "@/components/NotaAccountMenu";

export function NotaAppNav() {
  return (
    <div className="inline-flex items-center gap-3">
      <p className="font-display text-lg font-semibold tracking-tight text-zinc-900">NOTA Games</p>
      <NotaAccountMenu />
    </div>
  );
}
